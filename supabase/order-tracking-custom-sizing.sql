-- Suivi public par référence et prise en charge des pièces sur mesure.
-- À exécuter dans Supabase > SQL Editor avec le rôle propriétaire.

begin;

alter table public.orders
  add column if not exists delivery_delay_days integer not null default 0
    check (delivery_delay_days >= 0 and delivery_delay_days <= 30);

alter table public.order_items
  add column if not exists size_mode text not null default 'standard'
    check (size_mode in ('standard', 'custom')),
  add column if not exists custom_details text;

drop function if exists public.create_order(text, text, text, text, jsonb, text, text, jsonb, text);

create or replace function public.create_order(
  p_order_number text,
  p_customer_name text,
  p_email text,
  p_phone text,
  p_address jsonb,
  p_shipping_method text,
  p_payment_method text,
  p_items jsonb,
  p_promo_code text
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  new_order_id uuid;
  customer_uuid uuid;
  current_user_id uuid := auth.uid();
  current_email text := lower(trim(coalesce(p_email, '')));
  promo_uuid uuid;
  promo_percentage numeric := 0;
  actual_subtotal numeric := 0;
  actual_discount numeric := 0;
  actual_shipping numeric := 0;
  actual_total numeric := 0;
  standard_shipping numeric := 7;
  free_shipping_threshold numeric := 250;
  delivery_delay_days integer := 0;
  item jsonb;
  product_uuid uuid;
  product_name text;
  product_category text;
  product_price numeric;
  product_stock integer;
  product_sizes text[];
  product_colors text[];
  item_quantity integer;
  item_size text;
  item_color text;
  item_size_mode text;
  item_custom_details text;
  validated_items jsonb := '[]'::jsonb;
begin
  if nullif(trim(p_order_number), '') is null or length(trim(p_order_number)) > 80 then
    raise exception 'Numéro de commande invalide';
  end if;
  if length(trim(coalesce(p_customer_name, ''))) not between 3 and 160 then
    raise exception 'Nom client invalide';
  end if;
  if current_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'Email client invalide';
  end if;
  if length(trim(coalesce(p_phone, ''))) not between 6 and 40
    or trim(p_phone) !~ '^[0-9+ ()-]+$' then
    raise exception 'Téléphone invalide';
  end if;
  if jsonb_typeof(coalesce(p_address, '{}'::jsonb)) <> 'object'
    or octet_length(coalesce(p_address, '{}'::jsonb)::text) > 10000 then
    raise exception 'Adresse invalide';
  end if;
  if length(trim(coalesce(p_address->>'address', p_address->>'street', ''))) not between 3 and 250
    or length(trim(coalesce(p_address->>'city', ''))) not between 2 and 100
    or length(trim(coalesce(p_address->>'governorate', ''))) not between 2 and 100
    or length(trim(coalesce(p_address->>'apartment', ''))) > 100
    or length(trim(coalesce(p_address->>'postalCode', ''))) > 20 then
    raise exception 'Adresse invalide';
  end if;
  if p_shipping_method <> 'standard' or p_payment_method <> 'cod' then
    raise exception 'Mode de livraison ou de paiement invalide';
  end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array'
    or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) = 0
    or jsonb_array_length(p_items) > 50 then
    raise exception 'Panier invalide';
  end if;

  if to_regprocedure('public.enforce_public_rate_limit(text,text,integer,integer)') is not null then
    perform public.enforce_public_rate_limit('order', current_email, 10, 3600);
  end if;

  select coalesce((
    select case
      when value ~ '^\s*\d+([.,]\d+)?\s*$' then greatest(replace(trim(value), ',', '.')::numeric, 0)
      else 7
    end
    from public.site_content where content_key = 'shipping_fee'
  ), 7)
  into standard_shipping;
  standard_shipping := greatest(coalesce(standard_shipping, 7), 0);

  select coalesce((
    select case
      when value ~ '^\s*\d+([.,]\d+)?\s*$' then greatest(replace(trim(value), ',', '.')::numeric, 0)
      else 250
    end
    from public.site_content where content_key = 'free_shipping_threshold'
  ), 250)
  into free_shipping_threshold;
  free_shipping_threshold := greatest(coalesce(free_shipping_threshold, 250), 0);

  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'product_id', '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      or coalesce(item->>'quantity', '') !~ '^[0-9]+$' then
      raise exception 'Produit ou quantité invalide';
    end if;

    product_uuid := (item->>'product_id')::uuid;
    item_quantity := (item->>'quantity')::integer;
    item_size := nullif(trim(coalesce(item->>'size', '')), '');
    item_color := nullif(trim(coalesce(item->>'color', '')), '');
    item_size_mode := lower(coalesce(nullif(trim(item->>'size_mode'), ''), 'standard'));
    item_custom_details := nullif(trim(item->>'custom_details'), '');

    if item_quantity < 1 or item_quantity > 50 then
      raise exception 'Quantité invalide';
    end if;
    if item_size_mode not in ('standard', 'custom') then
      raise exception 'Mode de taille invalide';
    end if;

    select p.name, p.category, p.price, p.stock, p.sizes, p.colors
    into product_name, product_category, product_price, product_stock, product_sizes, product_colors
    from public.products p
    where p.id = product_uuid
    for update;

    if not found then
      raise exception 'Produit introuvable';
    end if;
    if product_stock < item_quantity then
      raise exception 'Stock insuffisant pour le produit %', product_name;
    end if;

    if item_size_mode = 'custom' then
      if product_category !~* 'robe' then
        raise exception 'Le sur-mesure est disponible pour les robes uniquement';
      end if;
      if length(coalesce(item_custom_details, '')) not between 10 and 1000 then
        raise exception 'Les précisions de mesure sont obligatoires';
      end if;
      item_size := 'Sur mesure';
      delivery_delay_days := 2;
    elsif coalesce(array_length(product_sizes, 1), 0) > 0
      and (item_size is null or not item_size = any(product_sizes)) then
      raise exception 'Taille invalide pour le produit %', product_name;
    end if;

    if coalesce(array_length(product_colors, 1), 0) > 0
      and (item_color is null or not item_color = any(product_colors)) then
      raise exception 'Couleur invalide pour le produit %', product_name;
    end if;

    update public.products set stock = stock - item_quantity where id = product_uuid;
    actual_subtotal := actual_subtotal + (product_price * item_quantity);
    validated_items := validated_items || jsonb_build_array(jsonb_build_object(
      'product_id', product_uuid::text,
      'product_name', product_name,
      'category', product_category,
      'unit_price', product_price,
      'quantity', item_quantity,
      'size', item_size,
      'color', item_color,
      'size_mode', item_size_mode,
      'custom_details', item_custom_details
    ));
  end loop;

  if nullif(trim(p_promo_code), '') is not null then
    select id, discount_percentage
    into promo_uuid, promo_percentage
    from public.promo_codes
    where code = upper(trim(p_promo_code)) and is_active = true;
    if promo_uuid is null then
      raise exception 'Code promotionnel invalide';
    end if;
    actual_discount := round((actual_subtotal * promo_percentage / 100)::numeric, 2);
  end if;

  actual_shipping := case when actual_subtotal >= free_shipping_threshold then 0 else standard_shipping end;
  actual_total := greatest(actual_subtotal - actual_discount + actual_shipping, 0);

  insert into public.orders (
    order_number, user_id, customer_name, email, phone, address,
    shipping_method, payment_method, subtotal, discount, shipping_fee, total,
    delivery_delay_days
  )
  values (
    trim(p_order_number), current_user_id, trim(p_customer_name), current_email,
    nullif(trim(coalesce(p_phone, '')), ''), coalesce(p_address, '{}'::jsonb),
    p_shipping_method, p_payment_method, actual_subtotal, actual_discount,
    actual_shipping, actual_total, delivery_delay_days
  )
  returning id, customer_id into new_order_id, customer_uuid;

  for item in select value from jsonb_array_elements(validated_items) loop
    insert into public.order_items (
      order_id, product_id, product_name, category, unit_price, quantity,
      size, color, size_mode, custom_details
    )
    values (
      new_order_id,
      nullif(item->>'product_id', ''),
      item->>'product_name',
      item->>'category',
      (item->>'unit_price')::numeric,
      (item->>'quantity')::integer,
      item->>'size',
      item->>'color',
      coalesce(item->>'size_mode', 'standard'),
      item->>'custom_details'
    );
  end loop;

  if promo_uuid is not null then
    insert into public.promo_code_usages (
      promo_code_id, order_id, customer_id, customer_email, customer_name,
      order_total, discount_amount
    )
    values (
      promo_uuid, new_order_id, customer_uuid, current_email, trim(p_customer_name),
      actual_total, actual_discount
    )
    on conflict (promo_code_id, order_id) do nothing;
  end if;

  return new_order_id;
end;
$$;

revoke all on function public.create_order(text, text, text, text, jsonb, text, text, jsonb, text) from public;
grant execute on function public.create_order(text, text, text, text, jsonb, text, text, jsonb, text) to anon, authenticated;

drop function if exists public.lookup_order(text);

create or replace function public.lookup_order(p_order_number text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  clean_reference text := upper(trim(coalesce(p_order_number, '')));
  result jsonb;
begin
  if clean_reference !~ '^[A-Z0-9-]{4,80}$' then
    raise exception 'Référence de commande invalide';
  end if;

  if to_regprocedure('public.enforce_public_rate_limit(text,text,integer,integer)') is not null then
    perform public.enforce_public_rate_limit('order-lookup', clean_reference, 20, 3600);
  end if;

  select jsonb_build_object(
    'order_number', o.order_number,
    'customer_name', o.customer_name,
    'email', o.email,
    'phone', o.phone,
    'address', o.address,
    'status', o.status,
    'payment_status', o.payment_status,
    'payment_method', o.payment_method,
    'shipping_method', o.shipping_method,
    'subtotal', o.subtotal,
    'discount', o.discount,
    'shipping_fee', o.shipping_fee,
    'total', o.total,
    'delivery_delay_days', o.delivery_delay_days,
    'created_at', o.created_at,
    'updated_at', o.updated_at,
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', oi.id,
        'product_name', oi.product_name,
        'category', oi.category,
        'unit_price', oi.unit_price,
        'quantity', oi.quantity,
        'size', oi.size,
        'color', oi.color,
        'size_mode', oi.size_mode,
        'custom_details', oi.custom_details
      ) order by oi.created_at)
      from public.order_items oi
      where oi.order_id = o.id
    ), '[]'::jsonb)
  )
  into result
  from public.orders o
  where upper(o.order_number) = clean_reference;

  if result is null then
    raise exception 'Commande introuvable';
  end if;
  return result;
end;
$$;

revoke all on function public.lookup_order(text) from public;
grant execute on function public.lookup_order(text) to anon, authenticated;

notify pgrst, 'reload schema';
commit;
