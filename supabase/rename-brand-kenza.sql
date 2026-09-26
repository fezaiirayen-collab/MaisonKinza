-- Migration de marque : remplacer ASALA/KINZA par KENZA dans le contenu éditorial existant.

update public.site_content
set value = replace(replace(value, 'ASALA', 'KENZA'), 'KINZA', 'KENZA')
where value ilike '%asala%' or value ilike '%kinza%';

update public.home_sections
set eyebrow = replace(replace(eyebrow, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    title = replace(replace(title, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    subtitle = replace(replace(subtitle, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    description = replace(replace(description, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    button_label = replace(replace(button_label, 'ASALA', 'KENZA'), 'KINZA', 'KENZA')
where eyebrow ilike '%asala%' or title ilike '%asala%' or subtitle ilike '%asala%'
   or description ilike '%asala%' or button_label ilike '%asala%'
   or eyebrow ilike '%kinza%' or title ilike '%kinza%' or subtitle ilike '%kinza%'
   or description ilike '%kinza%' or button_label ilike '%kinza%';

update public.home_collection_tiles
set eyebrow = replace(replace(eyebrow, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    title = replace(replace(title, 'ASALA', 'KENZA'), 'KINZA', 'KENZA'),
    button_label = replace(replace(button_label, 'ASALA', 'KENZA'), 'KINZA', 'KENZA')
where eyebrow ilike '%asala%' or title ilike '%asala%' or button_label ilike '%asala%'
   or eyebrow ilike '%kinza%' or title ilike '%kinza%' or button_label ilike '%kinza%';
