import React, { useEffect, useMemo, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import {
  BarChart3,
  Check,
  ChevronDown,
  Download,
  FolderTree,
  LayoutDashboard,
  LogOut,
  Mail,
  MessageSquare,
  Package,
  Percent,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Settings,
  ShoppingCart,
  TicketPercent,
  Trash2,
  Users,
  X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const publicSitePath = import.meta.env.BASE_URL.replace(/vrai-admin\/$/, "");

type Tab = "overview" | "products" | "categories" | "orders" | "promotions" | "sales" | "customers" | "messages" | "newsletter" | "content";

type ProductRecord = {
  id: string;
  name: string;
  category: string;
  price: number;
  original_price: number | null;
  sale_percentage: number;
  sale_regular_price: number | null;
  sale_original_price: number | null;
  sale_original_category: string | null;
  images: string[];
  color_images: Record<string, string[]> | null;
  description: string;
  details: string[];
  fabric: string | null;
  care: string | null;
  sizes: string[];
  colors: string[];
  featured: boolean;
  is_new: boolean;
  stock: number;
  created_at: string;
};

type CategoryRecord = {
  id: string;
  name: string;
  slug: string;
  description: string;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
};

type OrderItemRecord = {
  id: string;
  product_id: string | null;
  product_name: string;
  category: string | null;
  unit_price: number;
  quantity: number;
  size: string | null;
  color: string | null;
  size_mode: "standard" | "custom";
  custom_details: string | null;
};

type OrderRecord = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: Record<string, string>;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  subtotal: number;
  discount: number;
  shipping_fee: number;
  total: number;
  delivery_delay_days: number;
  created_at: string;
  order_items?: OrderItemRecord[];
};

type PromoCodeRecord = {
  id: string;
  code: string;
  discount_percentage: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

type PromoUsageRecord = {
  id: string;
  promo_code_id: string;
  order_id: string | null;
  customer_id: string | null;
  customer_email: string;
  customer_name: string;
  order_total: number;
  discount_amount: number;
  used_at: string;
};

type PromoCodeForm = {
  code: string;
  discount_percentage: string;
  is_active: boolean;
};

type CustomerRecord = {
  id: string;
  user_id: string | null;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  phone_secondary: string | null;
  gender: string | null;
  birth_date: string | null;
  address: Record<string, string> | null;
  order_count: number;
  total_spent: number;
  created_at: string;
};

type ContactMessageRecord = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
};

type NewsletterSubscriberRecord = {
  email: string;
  is_active: boolean;
  subscribed_at: string;
  unsubscribed_at: string | null;
};

type ContentRecord = {
  id: string;
  content_key: string;
  label: string;
  value: string;
  type: string;
  is_visible: boolean;
};

type HomeSectionRecord = {
  id: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string | null;
  button_label: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
};

type HomeSectionForm = Omit<HomeSectionRecord, "id" | "is_active" | "image_url"> & { image_url: string };

type CollectionTileRecord = {
  id: string;
  eyebrow: string;
  title: string;
  image_url: string | null;
  button_label: string;
  category_slug: string;
  sort_order: number;
  is_active: boolean;
};

type CollectionTileForm = Omit<CollectionTileRecord, "id" | "is_active" | "image_url"> & { image_url: string };

type ProductForm = {
  name: string;
  category: string;
  price: string;
  original_price: string;
  images: string;
  description: string;
  details: string;
  fabric: string;
  care: string;
  sizes: string;
  colors: string;
  color_images: string;
  stock: string;
  featured: boolean;
  is_new: boolean;
};

const fallbackCategories = ["Caftan", "Jebba", "Robe", "Accessoire", "Abaya", "Takchita"];
const orderStatuses = ["pending", "confirmed", "preparing", "shipped", "delivered", "cancelled"];
const emptyHomeSection: HomeSectionForm = {
  eyebrow: "Collection Emblématique",
  title: "",
  subtitle: "",
  description: "",
  image_url: "",
  button_label: "Découvrir la collection",
  category_slug: "",
  sort_order: 1,
};
const emptyCollectionTile: CollectionTileForm = {
  eyebrow: "La Signature Maison Kenza",
  title: "",
  image_url: "",
  button_label: "Découvrir",
  category_slug: "",
  sort_order: 1,
};
const emptyProduct: ProductForm = {
  name: "",
  category: "Caftan",
  price: "",
  original_price: "",
  images: "",
  color_images: "",
  description: "",
  details: "",
  fabric: "",
  care: "",
  sizes: "S, M, L",
  colors: "",
  stock: "0",
  featured: false,
  is_new: true,
};
const emptyPromoCode: PromoCodeForm = { code: "", discount_percentage: "10", is_active: true };

const splitList = (value: string) => value.split(/[\n,]/).map((item) => item.trim()).filter(Boolean);
const joinList = (value?: string[] | null) => (value || []).join(", ");
const joinColorImages = (value?: Record<string, string[]> | null) => Object.entries(value || {}).map(([color, images]) => `${color} | ${images.join(", ")}`).join("\n");
const parseColorImages = (value: string): Record<string, string[]> => Object.fromEntries(
  value.split("\n").map((line) => {
    const [color, ...imageParts] = line.split("|");
    return [color?.trim(), imageParts.join("|").split(",").map((image) => image.trim()).filter(Boolean)];
  }).filter(([color, images]) => Boolean(color) && Array.isArray(images) && images.length > 0),
);
const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium" }).format(new Date(value));
const formatMoney = (value: number) => `${Number(value || 0).toLocaleString("fr-FR")} TND`;
const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const isAllowedImage = (file: File) => ["image/jpeg", "image/png", "image/webp"].includes(file.type) && file.size <= MAX_IMAGE_SIZE;

const csvCell = (value: unknown) => '"' + String(value ?? "").replace(/"/g, '""') + '"';

const exportCustomersCsv = (customers: CustomerRecord[]) => {
  const headers = [
    "Prénom",
    "Nom",
    "Email",
    "Téléphone",
    "Téléphone secondaire",
    "Sexe",
    "Date de naissance",
    "Adresse",
    "Appartement",
    "Ville",
    "Gouvernorat",
    "Code postal",
    "Nombre de commandes",
    "Total dépensé (TND)",
    "Date de création",
  ];
  const rows = customers.map((customer) => {
    const address = customer.address || {};
    return [
      customer.first_name,
      customer.last_name,
      customer.email,
      customer.phone,
      customer.phone_secondary,
      customer.gender,
      customer.birth_date,
      address.street,
      address.apartment,
      address.city,
      address.governorate,
      address.postalCode,
      customer.order_count,
      customer.total_spent,
      customer.created_at,
    ].map(csvCell).join(";");
  });
  const csv = "\uFEFF" + [headers.map(csvCell).join(";"), ...rows].join(String.fromCharCode(13, 10));
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = "clients-" + new Date().toISOString().slice(0, 10) + ".csv";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

const productToForm = (product: ProductRecord): ProductForm => ({
  name: product.name,
  category: product.category,
  price: String(product.price),
  original_price: product.original_price == null ? "" : String(product.original_price),
  images: joinList(product.images),
  color_images: joinColorImages(product.color_images),
  description: product.description || "",
  details: joinList(product.details),
  fabric: product.fabric || "",
  care: product.care || "",
  sizes: joinList(product.sizes),
  colors: joinList(product.colors),
  stock: String(product.stock),
  featured: product.featured,
  is_new: product.is_new,
});

const AdminDashboard: React.FC<{ session: Session; onSignOut: () => void }> = ({ session, onSignOut }) => {
  const [tab, setTab] = useState<Tab>("overview");
  const [products, setProducts] = useState<ProductRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeRecord[]>([]);
  const [promoUsages, setPromoUsages] = useState<PromoUsageRecord[]>([]);
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [newsletterSubscribers, setNewsletterSubscribers] = useState<NewsletterSubscriberRecord[]>([]);
  const [content, setContent] = useState<ContentRecord[]>([]);
  const [homeSections, setHomeSections] = useState<HomeSectionRecord[]>([]);
  const [collectionTiles, setCollectionTiles] = useState<CollectionTileRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", image_url: "" });
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [sectionForm, setSectionForm] = useState<HomeSectionForm>(emptyHomeSection);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [tileForm, setTileForm] = useState<CollectionTileForm>(emptyCollectionTile);
  const [editingTileId, setEditingTileId] = useState<string | null>(null);
  const [promoCodeForm, setPromoCodeForm] = useState<PromoCodeForm>(emptyPromoCode);
  const [editingPromoCodeId, setEditingPromoCodeId] = useState<string | null>(null);

  const categoryNames = categories.length ? categories.map((category) => category.name) : fallbackCategories;

  const loadData = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError("");
    const [productResult, categoryResult, orderResult, promoCodeResult, promoUsageResult, customerResult, messageResult, newsletterResult, contentResult, sectionResult, tileResult] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order", { ascending: true }),
      supabase.from("orders").select("*, order_items(*)").order("created_at", { ascending: false }),
      supabase.from("promo_codes").select("*").order("created_at", { ascending: false }),
      supabase.from("promo_code_usages").select("*").order("used_at", { ascending: false }),
      supabase.from("customers").select("*").order("created_at", { ascending: false }),
      supabase.from("contact_messages").select("*").order("created_at", { ascending: false }),
      supabase.from("newsletter_subscribers").select("*").order("subscribed_at", { ascending: false }),
      supabase.from("site_content").select("*").order("label", { ascending: true }),
      supabase.from("home_sections").select("*").order("sort_order", { ascending: true }),
      supabase.from("home_collection_tiles").select("*").order("sort_order", { ascending: true }),
    ]);

    if (productResult.error) setError(productResult.error.message);
    else setProducts((productResult.data || []) as ProductRecord[]);
    if (!categoryResult.error) setCategories((categoryResult.data || []) as CategoryRecord[]);
    if (!orderResult.error) setOrders((orderResult.data || []) as OrderRecord[]);
    if (!promoCodeResult.error) setPromoCodes((promoCodeResult.data || []) as PromoCodeRecord[]);
    if (!promoUsageResult.error) setPromoUsages((promoUsageResult.data || []) as PromoUsageRecord[]);
    if (!customerResult.error) setCustomers((customerResult.data || []) as CustomerRecord[]);
    if (!messageResult.error) setMessages((messageResult.data || []) as ContactMessageRecord[]);
    if (!newsletterResult.error) setNewsletterSubscribers((newsletterResult.data || []) as NewsletterSubscriberRecord[]);
    if (!contentResult.error) setContent((contentResult.data || []) as ContentRecord[]);
    if (!sectionResult.error) setHomeSections((sectionResult.data || []) as HomeSectionRecord[]);
    if (!tileResult.error) setCollectionTiles((tileResult.data || []) as CollectionTileRecord[]);

    const missingDashboardTables = [categoryResult, orderResult, promoCodeResult, promoUsageResult, customerResult, messageResult, newsletterResult, contentResult, sectionResult, tileResult].find((result) => result.error);
    if (missingDashboardTables?.error && !productResult.error) {
      setError(`Le SQL du dashboard n'est pas encore installé : ${missingDashboardTables.error.message}`);
    }
    setIsLoading(false);
  };

  useEffect(() => { void loadData(); }, [session]);
  useEffect(() => {
    if (tab === "customers" || tab === "sales") void loadData();
  }, [tab]);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = !query || product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query);
      return matchesSearch && (!categoryFilter || product.category === categoryFilter);
    });
  }, [categoryFilter, products, search]);

  const totalRevenue = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + Number(order.total || 0), 0);
  const categoryStats = useMemo(() => categories.map((category) => ({
    ...category,
    count: products.filter((product) => product.category === category.name).length,
  })), [categories, products]);

  const setProductField = <K extends keyof ProductForm>(field: K, value: ProductForm[K]) => {
    setProductForm((current) => ({ ...current, [field]: value }));
  };

  const openNewProduct = () => {
    setEditingProductId(null);
    setProductForm({ ...emptyProduct, category: categoryNames[0] || "Caftan" });
    setShowProductForm(true);
    setError("");
  };

  const editProduct = (product: ProductRecord) => {
    setEditingProductId(product.id);
    setProductForm(productToForm(product));
    setShowProductForm(true);
    setError("");
  };

  const uploadImages = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !event.target.files?.length) return;
    setIsSaving(true);
    setError("");
    const urls: string[] = [];
    for (const file of Array.from(event.target.files)) {
      if (!isAllowedImage(file)) {
        setError("Image refusée : utilisez JPG, PNG ou WebP de 5 Mo maximum.");
        setIsSaving(false);
        return;
      }
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const path = `${crypto.randomUUID()}-${safeName}`;
      const result = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
      if (result.error) {
        setError(`Upload impossible : ${result.error.message}. Vérifiez le SQL du bucket product-images.`);
        setIsSaving(false);
        return;
      }
      urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    setProductForm((current) => ({ ...current, images: [...splitList(current.images), ...urls].join(",\n") }));
    setNotice(`${urls.length} photo(s) ajoutée(s).`);
    setIsSaving(false);
  };

  const uploadColorImages = async (color: string, event: React.ChangeEvent<HTMLInputElement>) => {
    if (!supabase || !event.target.files?.length) return;
    setIsSaving(true);
    setError("");
    const urls: string[] = [];
    for (const file of Array.from(event.target.files)) {
      if (!isAllowedImage(file)) {
        setError("Image refusée : utilisez JPG, PNG ou WebP de 5 Mo maximum.");
        setIsSaving(false);
        return;
      }
      const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
      const path = `colors/${crypto.randomUUID()}-${safeName}`;
      const result = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
      if (result.error) {
        setError(`Upload impossible : ${result.error.message}. Vérifiez le SQL du bucket product-images.`);
        setIsSaving(false);
        return;
      }
      urls.push(supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl);
    }
    const currentImages = parseColorImages(productForm.color_images);
    currentImages[color] = [...(currentImages[color] || []), ...urls];
    setProductForm((current) => ({ ...current, color_images: joinColorImages(currentImages) }));
    setNotice(`${urls.length} photo(s) ajoutée(s) pour la couleur ${color}.`);
    setIsSaving(false);
  };

  const saveProduct = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const originalPrice = productForm.original_price.trim() ? Number(productForm.original_price) : null;
    if (!productForm.name.trim() || !productForm.description.trim() || !Number.isFinite(price) || price < 0) {
      setError("Le nom, la description et un prix valide sont obligatoires.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0 || (originalPrice !== null && (!Number.isFinite(originalPrice) || originalPrice < price))) {
      setError("Vérifiez le stock et les prix saisis.");
      return;
    }
    setIsSaving(true);
    const payload = {
      name: productForm.name.trim(), category: productForm.category, price, original_price: originalPrice,
      images: splitList(productForm.images), description: productForm.description.trim(), details: splitList(productForm.details),
      color_images: parseColorImages(productForm.color_images),
      fabric: productForm.fabric.trim() || null, care: productForm.care.trim() || null, sizes: splitList(productForm.sizes),
      colors: splitList(productForm.colors), stock, featured: productForm.featured, is_new: productForm.is_new,
    };
    const result = editingProductId
      ? await supabase.from("products").update(payload).eq("id", editingProductId)
      : await supabase.from("products").insert(payload);
    setIsSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setNotice(editingProductId ? "Produit mis à jour." : "Produit ajouté au catalogue.");
      setShowProductForm(false);
      await loadData();
    }
  };

  const deleteProduct = async (product: ProductRecord) => {
    if (!supabase || !window.confirm(`Supprimer « ${product.name} » ?`)) return;
    const result = await supabase.from("products").delete().eq("id", product.id);
    if (result.error) setError(result.error.message);
    else { setNotice("Produit supprimé."); await loadData(); }
  };

  const saveCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !categoryForm.name.trim() || !categoryForm.slug.trim()) return;
    setIsSaving(true);
    const payload = { name: categoryForm.name.trim(), slug: categoryForm.slug.trim().toLowerCase(), description: categoryForm.description.trim(), image_url: categoryForm.image_url.trim() || null };
    const result = editingCategoryId
      ? await supabase.from("categories").update(payload).eq("id", editingCategoryId)
      : await supabase.from("categories").insert(payload);
    setIsSaving(false);
    if (result.error) setError(result.error.message);
    else { setNotice("Catégorie enregistrée."); setCategoryForm({ name: "", slug: "", description: "", image_url: "" }); setEditingCategoryId(null); await loadData(); window.dispatchEvent(new Event("asala:categories-updated")); }
  };

  const deleteCategory = async (category: CategoryRecord) => {
    if (!supabase || !window.confirm(`Supprimer la catégorie « ${category.name} » ?`)) return;
    const result = await supabase.from("categories").delete().eq("id", category.id);
    if (result.error) setError(result.error.message);
    else { setNotice("Catégorie supprimée."); await loadData(); window.dispatchEvent(new Event("asala:categories-updated")); }
  };

  const updateOrder = async (orderId: string, status: string) => {
    if (!supabase) return;
    const result = await supabase.from("orders").update({ status }).eq("id", orderId);
    if (result.error) setError(result.error.message);
    else { setOrders((current) => current.map((order) => order.id === orderId ? { ...order, status } : order)); setNotice("Statut de commande mis à jour."); }
  };

  const savePromoCode = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    const code = promoCodeForm.code.trim().toUpperCase();
    const discount = Number(promoCodeForm.discount_percentage);
    if (!code || !Number.isFinite(discount) || discount <= 0 || discount > 100) {
      setError("Saisissez un code et un taux de réduction entre 0,01 et 100 %.");
      return;
    }

    setIsSaving(true);
    setError("");
    const payload = { code, discount_percentage: discount, is_active: promoCodeForm.is_active };
    const result = editingPromoCodeId
      ? await supabase.from("promo_codes").update(payload).eq("id", editingPromoCodeId)
      : await supabase.from("promo_codes").insert(payload);
    setIsSaving(false);

    if (result.error) setError(result.error.message);
    else {
      setNotice(editingPromoCodeId ? "Code promotionnel modifié." : "Code promotionnel créé.");
      setPromoCodeForm(emptyPromoCode);
      setEditingPromoCodeId(null);
      await loadData();
    }
  };

  const editPromoCode = (promo: PromoCodeRecord) => {
    setEditingPromoCodeId(promo.id);
    setPromoCodeForm({ code: promo.code, discount_percentage: String(promo.discount_percentage), is_active: promo.is_active });
    setError("");
  };

  const applySale = async (productIds: string[], percentage: number) => {
    if (!supabase || productIds.length === 0) return;
    const database = supabase;
    setIsSaving(true);
    setError("");
    const selectedProducts = products.filter((product) => productIds.includes(product.id));
    const results = await Promise.all(selectedProducts.map((product) => {
      const regularPrice = product.sale_regular_price == null ? Number(product.price) : Number(product.sale_regular_price);
      const discountedPrice = Math.round(regularPrice * (1 - percentage / 100) * 100) / 100;
      return database.from("products").update({
        price: discountedPrice,
        original_price: regularPrice,
        category: "Promotions",
        sale_percentage: percentage,
        sale_regular_price: regularPrice,
        sale_original_price: product.sale_original_price ?? product.original_price,
        sale_original_category: product.sale_original_category || product.category,
      }).eq("id", product.id);
    }));
    const failed = results.find((result) => result.error);
    setIsSaving(false);
    if (failed?.error) {
      setError(`Impossible d'appliquer la solde : ${failed.error.message}`);
      return;
    }
    setNotice(`Solde de ${percentage}% appliquée à ${selectedProducts.length} produit(s).`);
    await loadData();
    window.dispatchEvent(new Event("asala:categories-updated"));
  };

  const removeSale = async (product: ProductRecord) => {
    if (!supabase) return;
    setIsSaving(true);
    setError("");
    const result = await supabase.from("products").update({
      price: product.sale_regular_price ?? product.price,
      original_price: product.sale_original_price ?? null,
      category: product.sale_original_category || "Caftan",
      sale_percentage: 0,
      sale_regular_price: null,
      sale_original_price: null,
      sale_original_category: null,
    }).eq("id", product.id);
    setIsSaving(false);
    if (result.error) setError(`Impossible de retirer la solde : ${result.error.message}`);
    else {
      setNotice(`Solde retirée pour « ${product.name} ».`);
      await loadData();
      window.dispatchEvent(new Event("asala:categories-updated"));
    }
  };

  const updateMessageStatus = async (messageId: string, status: ContactMessageRecord["status"]) => {
    if (!supabase) return;
    const result = await supabase.from("contact_messages").update({ status }).eq("id", messageId);
    if (result.error) setError(result.error.message);
    else { setMessages((current) => current.map((message) => message.id === messageId ? { ...message, status } : message)); setNotice("Statut du message mis à jour."); }
  };

  const deleteMessage = async (message: ContactMessageRecord) => {
    if (!supabase || !window.confirm(`Supprimer le message de « ${message.name} » ?`)) return;
    const result = await supabase.from("contact_messages").delete().eq("id", message.id);
    if (result.error) setError(result.error.message);
    else { setMessages((current) => current.filter((item) => item.id !== message.id)); setNotice("Message supprimé."); }
  };

  const deleteNewsletterSubscriber = async (subscriber: NewsletterSubscriberRecord) => {
    if (!supabase || !window.confirm(`Supprimer « ${subscriber.email} » de la newsletter ?`)) return;
    const result = await supabase.from("newsletter_subscribers").delete().eq("email", subscriber.email);
    if (result.error) setError(result.error.message);
    else { setNewsletterSubscribers((current) => current.filter((item) => item.email !== subscriber.email)); setNotice("Contact supprimé de la newsletter."); }
  };

  const updateContent = async (item: ContentRecord, value: string) => {
    if (!supabase) return;
    const result = await supabase.from("site_content").update({ value }).eq("id", item.id);
    if (result.error) setError(result.error.message);
    else { setContent((current) => current.map((row) => row.id === item.id ? { ...row, value } : row)); window.dispatchEvent(new Event("asala:content-updated")); }
  };

  const uploadContentImage = async (item: ContentRecord, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!supabase || !file) return;
    setIsSaving(true);
    setError("");
    if (!isAllowedImage(file)) {
      setError("Image refusée : utilisez JPG, PNG ou WebP de 5 Mo maximum.");
      setIsSaving(false);
      return;
    }
    const safeName = file.name.toLowerCase().replace(/[^a-z0-9.-]+/g, "-");
    const path = `content/${crypto.randomUUID()}-${safeName}`;
    const uploadResult = await supabase.storage.from("product-images").upload(path, file, { upsert: false, contentType: file.type });
    if (uploadResult.error) {
      setError(`Upload impossible : ${uploadResult.error.message}. Vérifiez le bucket product-images.`);
      setIsSaving(false);
      return;
    }
    const imageUrl = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
    await updateContent(item, imageUrl);
    setNotice("Image enregistrée.");
    setIsSaving(false);
    event.target.value = "";
  };

  const saveHomeSection = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !sectionForm.title.trim()) return;
    setIsSaving(true);
    const payload = {
      eyebrow: sectionForm.eyebrow.trim(),
      title: sectionForm.title.trim(),
      subtitle: sectionForm.subtitle.trim(),
      description: sectionForm.description.trim(),
      image_url: sectionForm.image_url.trim() || null,
      button_label: sectionForm.button_label.trim() || "Découvrir la collection",
      category_slug: sectionForm.category_slug.trim().toLowerCase(),
      sort_order: Number(sectionForm.sort_order) || 0,
    };
    const result = editingSectionId
      ? await supabase.from("home_sections").update(payload).eq("id", editingSectionId)
      : await supabase.from("home_sections").insert(payload);
    setIsSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setNotice(editingSectionId ? "Section mise à jour." : "Section ajoutée à la page d'accueil.");
      setSectionForm(emptyHomeSection);
      setEditingSectionId(null);
      await loadData();
      window.dispatchEvent(new Event("asala:content-updated"));
    }
  };

  const deleteHomeSection = async (section: HomeSectionRecord) => {
    if (!supabase || !window.confirm(`Supprimer la section « ${section.title} » ?`)) return;
    const result = await supabase.from("home_sections").delete().eq("id", section.id);
    if (result.error) setError(result.error.message);
    else {
      setNotice("Section supprimée.");
      await loadData();
      window.dispatchEvent(new Event("asala:content-updated"));
    }
  };

  const saveCollectionTile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !tileForm.title.trim()) return;
    setIsSaving(true);
    const payload = {
      eyebrow: tileForm.eyebrow.trim(),
      title: tileForm.title.trim(),
      image_url: tileForm.image_url.trim() || null,
      button_label: tileForm.button_label.trim() || "Découvrir",
      category_slug: tileForm.category_slug.trim().toLowerCase(),
      sort_order: Number(tileForm.sort_order) || 0,
    };
    const result = editingTileId
      ? await supabase.from("home_collection_tiles").update(payload).eq("id", editingTileId)
      : await supabase.from("home_collection_tiles").insert(payload);
    setIsSaving(false);
    if (result.error) setError(result.error.message);
    else {
      setNotice(editingTileId ? "Carte mise à jour." : "Carte ajoutée à la page d'accueil.");
      setTileForm(emptyCollectionTile);
      setEditingTileId(null);
      await loadData();
      window.dispatchEvent(new Event("asala:content-updated"));
    }
  };

  const deleteCollectionTile = async (tile: CollectionTileRecord) => {
    if (!supabase || !window.confirm(`Supprimer la carte « ${tile.title} » ?`)) return;
    const result = await supabase.from("home_collection_tiles").delete().eq("id", tile.id);
    if (result.error) setError(result.error.message);
    else {
      setNotice("Carte supprimée.");
      await loadData();
      window.dispatchEvent(new Event("asala:content-updated"));
    }
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "overview", label: "Vue générale", icon: <LayoutDashboard size={16} /> },
    { id: "products", label: "Produits", icon: <Package size={16} /> },
    { id: "categories", label: "Catégories", icon: <FolderTree size={16} /> },
    { id: "orders", label: "Commandes", icon: <ShoppingCart size={16} /> },
    { id: "promotions", label: "Promotions", icon: <TicketPercent size={16} /> },
    { id: "sales", label: "Soldes", icon: <Percent size={16} /> },
    { id: "customers", label: "Clients", icon: <Users size={16} /> },
    { id: "messages", label: "Messages", icon: <MessageSquare size={16} /> },
    { id: "newsletter", label: "Newsletter", icon: <Mail size={16} /> },
    { id: "content", label: "Contenu du site", icon: <Settings size={16} /> },
  ];

  return (
    <div className="min-h-screen bg-[#f4f2ee] text-black">
      <header className="border-b border-black bg-white">
        <div className="mx-auto flex max-w-[1700px] items-center justify-between gap-4 px-4 py-4 sm:px-10 lg:px-20">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-stone">MAISON KENZA / ESPACE PRIVÉ</p>
            <h1 className="text-[27px] leading-tight sm:text-[34px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Tableau de bord</h1>
            <p className="mt-1 text-[11px] text-stone">{session.user.email}</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <a href={publicSitePath} className="hidden text-[11px] uppercase tracking-[0.14em] text-stone hover:text-black sm:block">Boutique</a>
            <button onClick={onSignOut} className="inline-flex items-center gap-2 border border-black px-3 py-2 text-[10px] uppercase tracking-[0.12em] hover:bg-black hover:text-white"><LogOut size={14} /> Déconnexion</button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1700px] flex-col gap-6 px-4 py-5 sm:px-10 lg:flex-row lg:px-20 lg:py-8">
        <aside className="shrink-0 lg:w-56">
          <nav className="flex gap-2 overflow-x-auto border border-black bg-white p-2 lg:flex-col lg:gap-1">
            {tabs.map((item) => <button key={item.id} onClick={() => setTab(item.id)} className={`flex shrink-0 items-center gap-3 px-3 py-3 text-left text-[11px] uppercase tracking-[0.1em] transition-colors ${tab === item.id ? "bg-black text-white" : "hover:bg-black/5"}`}>{item.icon}<span>{item.label}</span></button>)}
          </nav>
          <div className="mt-4 hidden border border-black/10 bg-white p-4 text-[11px] text-stone lg:block">Gestion sécurisée par Supabase Auth et RLS.</div>
        </aside>

        <main className="min-w-0 flex-1 space-y-5">
          {error && <Notice tone="error">{error}</Notice>}
          {notice && <Notice tone="success">{notice}</Notice>}
          {isLoading ? <Loading /> : (
            <>
              {tab === "overview" && <Overview products={products} orders={orders} customers={customers} totalRevenue={totalRevenue} categoryStats={categoryStats} onOrders={() => setTab("orders")} />}
              {tab === "products" && <ProductsPanel products={filteredProducts} allProducts={products} categories={categoryNames} search={search} categoryFilter={categoryFilter} setSearch={setSearch} setCategoryFilter={setCategoryFilter} onRefresh={() => void loadData()} onCreate={openNewProduct} onEdit={editProduct} onDelete={(product) => void deleteProduct(product)} />}
              {tab === "categories" && <CategoriesPanel categories={categories} form={categoryForm} editingId={editingCategoryId} setForm={setCategoryForm} onSubmit={saveCategory} onEdit={(category) => { setEditingCategoryId(category.id); setCategoryForm({ name: category.name, slug: category.slug, description: category.description, image_url: category.image_url || "" }); }} onDelete={(category) => void deleteCategory(category)} />}
              {tab === "orders" && <OrdersPanel orders={orders} products={products} onStatus={updateOrder} />}
              {tab === "promotions" && <PromotionsPanel promotions={promoCodes} usages={promoUsages} form={promoCodeForm} editingId={editingPromoCodeId} saving={isSaving} setForm={setPromoCodeForm} onSubmit={savePromoCode} onEdit={editPromoCode} onCancel={() => { setEditingPromoCodeId(null); setPromoCodeForm(emptyPromoCode); }} />}
              {tab === "sales" && <SalesPanel products={products} saving={isSaving} onApply={(ids, percentage) => void applySale(ids, percentage)} onRemove={(product) => void removeSale(product)} />}
              {tab === "customers" && <CustomersPanel customers={customers} onRefresh={() => void loadData()} />}
              {tab === "messages" && <MessagesPanel messages={messages} onStatus={updateMessageStatus} onDelete={(message) => void deleteMessage(message)} />}
              {tab === "newsletter" && <NewsletterPanel subscribers={newsletterSubscribers} onDelete={(subscriber) => void deleteNewsletterSubscriber(subscriber)} />}
              {tab === "content" && <ContentPanel content={content} sections={homeSections} tiles={collectionTiles} categories={categories} sectionForm={sectionForm} editingSectionId={editingSectionId} setSectionForm={setSectionForm} tileForm={tileForm} editingTileId={editingTileId} setTileForm={setTileForm} onUpdate={updateContent} onImageUpload={uploadContentImage} onSectionSubmit={saveHomeSection} onSectionEdit={(section) => { setEditingSectionId(section.id); setSectionForm({ eyebrow: section.eyebrow, title: section.title, subtitle: section.subtitle, description: section.description, image_url: section.image_url || "", button_label: section.button_label, category_slug: section.category_slug, sort_order: section.sort_order }); }} onSectionDelete={(section) => void deleteHomeSection(section)} onTileSubmit={saveCollectionTile} onTileEdit={(tile) => { setEditingTileId(tile.id); setTileForm({ eyebrow: tile.eyebrow, title: tile.title, image_url: tile.image_url || "", button_label: tile.button_label, category_slug: tile.category_slug, sort_order: tile.sort_order }); }} onTileDelete={(tile) => void deleteCollectionTile(tile)} />}
            </>
          )}
        </main>
      </div>

      {showProductForm && <ProductModal form={productForm} categories={categoryNames} editing={Boolean(editingProductId)} saving={isSaving} setForm={setProductForm} onUpload={uploadImages} onUploadColor={uploadColorImages} onSubmit={saveProduct} onClose={() => setShowProductForm(false)} />}
    </div>
  );
};

const Overview: React.FC<{ products: ProductRecord[]; orders: OrderRecord[]; customers: CustomerRecord[]; totalRevenue: number; categoryStats: (CategoryRecord & { count: number })[]; onOrders: () => void }> = ({ products, orders, customers, totalRevenue, categoryStats, onOrders }) => (
  <>
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      <Metric label="Chiffre d'affaires" value={formatMoney(totalRevenue)} icon={<BarChart3 size={18} />} />
      <Metric label="Commandes" value={orders.length} icon={<ShoppingCart size={18} />} />
      <Metric label="Clients" value={customers.length} icon={<Users size={18} />} />
      <Metric label="Produits" value={products.length} icon={<Package size={18} />} />
    </div>
    <div className="grid grid-cols-1 gap-5 xl:grid-cols-[1.15fr_0.85fr]">
      <section className="border border-black bg-white p-4 sm:p-6">
        <div className="mb-5 flex items-center justify-between border-b border-black/10 pb-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Activité commerciale</p><h2 className="mt-1 text-[23px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Dernières commandes</h2></div><button onClick={onOrders} className="text-[10px] uppercase tracking-wider underline">Voir tout</button></div>
        {orders.length === 0 ? <Empty label="Aucune commande enregistrée." /> : <div className="divide-y divide-black/10">{orders.slice(0, 6).map((order) => <div key={order.id} className="flex items-center justify-between gap-3 py-3 text-[12px]"><div><p className="font-medium">{order.order_number}</p><p className="text-stone">{order.customer_name || order.email} · {formatDate(order.created_at)}</p></div><div className="text-right"><p className="font-medium">{formatMoney(order.total)}</p><StatusBadge status={order.status} /></div></div>)}</div>}
      </section>
      <section className="border border-black bg-white p-4 sm:p-6"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Catalogue</p><h2 className="mt-1 text-[23px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Produits par catégorie</h2><div className="mt-6 space-y-4">{categoryStats.map((category) => { const max = Math.max(1, ...categoryStats.map((item) => item.count)); return <div key={category.id}><div className="mb-1 flex justify-between text-[11px]"><span>{category.name}</span><span className="text-stone">{category.count}</span></div><div className="h-2 bg-black/10"><div className="h-full bg-black" style={{ width: `${(category.count / max) * 100}%` }} /></div></div>; })}</div></section>
    </div>
  </>
);

const ProductsPanel: React.FC<{ products: ProductRecord[]; allProducts: ProductRecord[]; categories: string[]; search: string; categoryFilter: string; setSearch: (value: string) => void; setCategoryFilter: (value: string) => void; onRefresh: () => void; onCreate: () => void; onEdit: (product: ProductRecord) => void; onDelete: (product: ProductRecord) => void }> = ({ products, allProducts, categories, search, categoryFilter, setSearch, setCategoryFilter, onRefresh, onCreate, onEdit, onDelete }) => (
  <section className="border border-black bg-white p-4 sm:p-6"><div className="flex flex-col justify-between gap-4 border-b border-black/10 pb-5 sm:flex-row sm:items-center"><div><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Catalogue Supabase</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Produits ({products.length}/{allProducts.length})</h2></div><div className="flex gap-2"><button onClick={onRefresh} className="inline-flex items-center gap-2 border border-black px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white"><RefreshCw size={14} /> Actualiser</button><button onClick={onCreate} className="asala-btn-solid inline-flex items-center gap-2 px-3 py-2 text-[10px]"><Plus size={14} /> Nouveau produit</button></div></div><div className="flex flex-col gap-3 py-5 sm:flex-row"><label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Rechercher…" className="w-full pl-9" /></label><select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className="sm:w-52"><option value="">Toutes les catégories</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></div>{products.length === 0 ? <Empty label="Aucun produit trouvé." /> : <div className="overflow-x-auto border border-black/10"><table className="w-full min-w-[780px] text-left text-[12px]"><thead className="bg-[#faf9f6] text-[10px] uppercase tracking-wider text-stone"><tr><th className="px-4 py-3">Produit</th><th className="px-4 py-3">Catégorie</th><th className="px-4 py-3">Prix</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3 text-right">Actions</th></tr></thead><tbody className="divide-y divide-black/10">{products.map((product) => <tr key={product.id} className="hover:bg-[#faf9f6]"><td className="px-4 py-3"><div className="flex items-center gap-3"><div className="h-12 w-10 shrink-0 overflow-hidden bg-[#f4f2ee]">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-full w-full object-cover" /> : <Package size={16} className="m-auto mt-4 text-stone" />}</div><span className="font-medium uppercase tracking-wide">{product.name}</span></div></td><td className="px-4 py-3 text-stone">{product.category}</td><td className="px-4 py-3 font-medium">{formatMoney(product.price)}</td><td className={`px-4 py-3 font-medium ${product.stock === 0 ? "text-red-700" : ""}`}>{product.stock}</td><td className="px-4 py-3"><div className="flex gap-1">{product.is_new && <span className="bg-black px-2 py-1 text-[9px] text-white">Nouveau</span>}{product.featured && <span className="border border-black px-2 py-1 text-[9px]">À la une</span>}</div></td><td className="px-4 py-3"><div className="flex justify-end gap-2"><button onClick={() => onEdit(product)} className="border border-black/20 p-2 hover:border-black"><Pencil size={14} /></button><button onClick={() => onDelete(product)} className="border border-black/20 p-2 text-red-700 hover:border-red-700"><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>}</section>
);

const CategoriesPanel: React.FC<{ categories: CategoryRecord[]; form: { name: string; slug: string; description: string; image_url: string }; editingId: string | null; setForm: React.Dispatch<React.SetStateAction<{ name: string; slug: string; description: string; image_url: string }>>; onSubmit: (event: React.FormEvent) => void; onEdit: (category: CategoryRecord) => void; onDelete: (category: CategoryRecord) => void }> = ({ categories, form, editingId, setForm, onSubmit, onEdit, onDelete }) => <div className="grid grid-cols-1 gap-5 xl:grid-cols-[0.8fr_1.2fr]"><section className="border border-black bg-white p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Organisation</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{editingId ? "Modifier" : "Nouvelle catégorie"}</h2><form onSubmit={onSubmit} className="mt-5 space-y-4"><Field label="Nom"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full" /></Field><Field label="Slug"><input required value={form.slug} onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))} className="w-full" /></Field><Field label="Description"><textarea rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full" /></Field><Field label="Image URL"><input value={form.image_url} onChange={(event) => setForm((current) => ({ ...current, image_url: event.target.value }))} className="w-full" /></Field><button className="asala-btn-solid w-full justify-center">{editingId ? "Mettre à jour" : "Créer la catégorie"}</button></form></section><section className="border border-black bg-white p-5"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Catalogue</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{categories.length} catégories</h2><div className="mt-5 divide-y divide-black/10">{categories.map((category) => <div key={category.id} className="flex items-center justify-between gap-3 py-4"><div><p className="font-medium">{category.name}</p><p className="text-[11px] text-stone">/{category.slug} · {category.is_active ? "Visible" : "Masquée"}</p></div><div className="flex gap-2"><button onClick={() => onEdit(category)} className="border border-black/20 p-2"><Pencil size={14} /></button><button onClick={() => onDelete(category)} className="border border-black/20 p-2 text-red-700"><Trash2 size={14} /></button></div></div>)}</div></section></div>;

const OrderDetailsView: React.FC<{ order: OrderRecord; products: ProductRecord[]; onStatus: (id: string, status: string) => void; onBack: () => void }> = ({ order, products, onStatus, onBack }) => {
  const address = order.address || {};
  const addressLine = [address.address || address.street, address.apartment, address.postalCode, address.city, address.governorate].filter(Boolean).join(", ");

  return <section className="border border-black bg-white p-4 sm:p-6">
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
      <div>
        <button type="button" onClick={onBack} className="mb-4 text-[10px] uppercase tracking-wider underline">← Retour aux commandes</button>
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Fiche complète de commande</p>
        <h2 className="mt-1 text-[28px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{order.order_number}</h2>
        <p className="mt-1 text-[11px] text-stone">Commande du {formatDate(order.created_at)}</p>
      </div>
      <label className="text-[10px] uppercase tracking-wider text-stone">Statut<select value={order.status} onChange={(event) => onStatus(order.id, event.target.value)} className="mt-1 min-w-[180px] w-full"><option value="pending">En attente</option><option value="confirmed">Confirmée</option><option value="preparing">En préparation</option><option value="shipped">Expédiée</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option></select></label>
    </div>

    <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <div className="border border-black/10 bg-[#faf9f6] p-4"><p className="text-[10px] uppercase tracking-wider text-stone">Client</p><p className="mt-2 text-[13px] font-medium">{order.customer_name || "Client"}</p><p className="mt-1 break-all text-[12px] text-stone">{order.email}</p></div>
      <div className="border border-black/10 bg-[#faf9f6] p-4"><p className="text-[10px] uppercase tracking-wider text-stone">Coordonnées</p><p className="mt-2 text-[12px]">{order.phone || "Téléphone non renseigné"}</p><p className="mt-1 text-[11px] text-stone">Paiement : {order.payment_method || "—"} · {order.payment_status || "—"}</p></div>
      <div className="border border-black/10 bg-[#faf9f6] p-4"><p className="text-[10px] uppercase tracking-wider text-stone">Livraison</p><p className="mt-2 text-[12px]">{order.shipping_method || "Standard"}</p><p className="mt-1 text-[11px] text-stone">{order.delivery_delay_days > 0 ? `Sur mesure : +${order.delivery_delay_days} jours` : "Délai standard"}</p></div>
      <div className="border border-black/10 bg-[#faf9f6] p-4"><p className="text-[10px] uppercase tracking-wider text-stone">Adresse</p><p className="mt-2 text-[12px] leading-relaxed">{addressLine || "Adresse non renseignée"}</p></div>
    </div>

    <div className="mt-6 border border-black/10">
      <div className="border-b border-black/10 bg-[#faf9f6] px-4 py-3"><h3 className="text-[11px] font-semibold uppercase tracking-[0.16em]">Produits commandés</h3></div>
      <div className="divide-y divide-black/10">
        {(order.order_items || []).map((item) => {
          const product = products.find((candidate) => candidate.id === item.product_id || candidate.name === item.product_name);
          return <div key={item.id} className="flex flex-wrap items-center gap-4 p-4">
            <div className="h-20 w-16 shrink-0 overflow-hidden bg-[#f4f2ee]">{product?.images?.[0] ? <img src={product.images[0]} alt={item.product_name} className="h-full w-full object-cover" /> : <Package size={20} className="m-auto mt-7 text-stone" />}</div>
            <div className="min-w-0 flex-1 text-[12px]"><p className="font-medium">{item.quantity} × {item.product_name}</p><p className="mt-1 text-stone">{item.size_mode === "custom" ? "Sur mesure · +2 jours" : `Taille : ${item.size || "Standard"}`}{item.color ? ` · ${item.color}` : ""}</p>{item.custom_details && <p className="mt-2 max-w-2xl leading-relaxed text-stone">Précisions : {item.custom_details}</p>}</div>
            <p className="text-[13px] font-medium">{formatMoney(Number(item.unit_price) * item.quantity)}</p>
          </div>;
        })}
      </div>
      <div className="space-y-2 border-t border-black/10 p-4 text-[12px] sm:ml-auto sm:w-80"><div className="flex justify-between text-stone"><span>Sous-total</span><span className="text-black">{formatMoney(order.subtotal)}</span></div>{Number(order.discount) > 0 && <div className="flex justify-between text-stone"><span>Remise</span><span className="text-black">-{formatMoney(order.discount)}</span></div>}<div className="flex justify-between text-stone"><span>Livraison</span><span className="text-black">{Number(order.shipping_fee) ? formatMoney(order.shipping_fee) : "Offerte"}</span></div><div className="flex justify-between border-t border-black/10 pt-2 text-[15px] font-semibold"><span>Total</span><span>{formatMoney(order.total)}</span></div></div>
    </div>
  </section>;
};

const OrdersPanel: React.FC<{ orders: OrderRecord[]; products: ProductRecord[]; onStatus: (id: string, status: string) => void }> = ({ orders, products, onStatus }) => {
  const [referenceSearch, setReferenceSearch] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [lookupError, setLookupError] = useState("");
  const search = referenceSearch.trim().toLowerCase();
  const selectedOrder = orders.find((order) => order.id === selectedOrderId) || null;
  const filteredOrders = orders.filter((order) => {
    if (!search) return true;
    return [
      order.order_number,
      order.customer_name,
      order.email,
      order.status,
      ...(order.order_items || []).map((item) => item.product_name),
    ].some((value) => String(value || "").toLowerCase().includes(search));
  });

  const handleLookup = (event: React.FormEvent) => {
    event.preventDefault();
    const exactOrder = orders.find((order) => order.order_number.toLowerCase() === search);
    if (exactOrder) {
      setLookupError("");
      setSelectedOrderId(exactOrder.id);
    } else {
      setLookupError("Cette référence ne correspond à aucune commande chargée dans le dashboard.");
    }
  };

  if (selectedOrder) return <OrderDetailsView order={selectedOrder} products={products} onStatus={onStatus} onBack={() => setSelectedOrderId(null)} />;

  return <section className="border border-black bg-white p-4 sm:p-6">
    <div className="border-b border-black/10 pb-5">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Suivi logistique</p>
      <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Commandes ({filteredOrders.length}{filteredOrders.length !== orders.length ? ` / ${orders.length}` : ""})</h2>
      <form onSubmit={handleLookup} className="mt-4 flex flex-col gap-2 sm:flex-row">
        <label className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" />
          <input value={referenceSearch} onChange={(event) => { setReferenceSearch(event.target.value); setLookupError(""); }} placeholder="Rechercher par référence, ex. KENZA-123456" className="w-full pl-9" aria-label="Rechercher une commande par référence" />
        </label>
        <button type="submit" className="asala-btn-solid justify-center px-4">Afficher la commande</button>
      </form>
      <p className="mt-2 text-[11px] text-stone">Saisissez la référence exacte puis cliquez sur « Afficher la commande » pour ouvrir la fiche complète.</p>
      {lookupError && <p role="alert" className="mt-3 border border-red-700 bg-red-50 p-3 text-[12px] text-red-800">{lookupError}</p>}
    </div>
    {orders.length === 0 ? <Empty label="Aucune commande. Les commandes validées depuis le checkout apparaîtront ici." /> : filteredOrders.length === 0 ? <div className="mt-5"><Empty label="Aucune commande ne correspond à cette recherche." /></div> : <div className="mt-5 space-y-3">{filteredOrders.map((order) => <details key={order.id} className="border border-black/10 bg-[#faf9f6] p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-[12px]"><span><strong>{order.order_number}</strong><span className="ml-3 text-stone">{order.customer_name || order.email} · {formatDate(order.created_at)}</span></span><span className="flex items-center gap-3"><strong>{formatMoney(order.total)}</strong><ChevronDown size={15} /></span></summary><div className="mt-4 grid gap-4 border-t border-black/10 pt-4 md:grid-cols-[1fr_220px]"><div className="space-y-2 text-[12px]"><p><span className="text-stone">Référence :</span> <strong>{order.order_number}</strong></p>{(order.order_items || []).map((item) => <div key={item.id}><p>{item.quantity} × {item.product_name} <span className="text-stone">{item.size ? `· ${item.size}` : ""} {item.color ? `· ${item.color}` : ""}</span></p>{item.size_mode === "custom" && <p className="text-[11px] text-stone">Sur mesure · +2 jours{item.custom_details ? ` · ${item.custom_details}` : ""}</p>}</div>)}<p className="pt-2 text-stone">{order.email} {order.phone ? `· ${order.phone}` : ""}</p>{order.delivery_delay_days > 0 && <p className="text-stone">Délai supplémentaire : +{order.delivery_delay_days} jours</p>}</div><label className="text-[10px] uppercase tracking-wider text-stone">Statut<select value={order.status} onChange={(event) => onStatus(order.id, event.target.value)} className="mt-1 w-full"><option value="pending">En attente</option><option value="confirmed">Confirmée</option><option value="preparing">En préparation</option><option value="shipped">Expédiée</option><option value="delivered">Livrée</option><option value="cancelled">Annulée</option></select></label></div></details>)}</div>}
  </section>;
};

type SalesPanelProps = {
  products: ProductRecord[];
  saving: boolean;
  onApply: (productIds: string[], percentage: number) => void;
  onRemove: (product: ProductRecord) => void;
};

const SalesPanel: React.FC<SalesPanelProps> = ({ products, saving, onApply, onRemove }) => {
  const [percentage, setPercentage] = useState("20");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchValue, setSearchValue] = useState("");
  const query = searchValue.trim().toLowerCase();
  const filteredProducts = products.filter((product) => !query || product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query));
  const saleProducts = products.filter((product) => Number(product.sale_percentage || 0) > 0 || product.sale_regular_price != null);

  const toggleProduct = (id: string) => {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const selectVisible = () => {
    setSelectedIds((current) => [...new Set([...current, ...filteredProducts.map((product) => product.id)])]);
  };

  const submitSale = () => {
    const value = Number(percentage);
    if (selectedIds.length === 0 || !Number.isFinite(value) || value <= 0 || value > 100) return;
    onApply(selectedIds, value);
    setSelectedIds([]);
  };

  return (
    <div className="space-y-5">
      <section className="border border-black bg-white p-4 sm:p-6">
        <div className="border-b border-black/10 pb-5">
          <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Saison des soldes</p>
          <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Appliquer une promotion produit</h2>
          <p className="mt-2 max-w-2xl text-[12px] text-stone">Choisissez les produits, indiquez le pourcentage de réduction et ils seront publiés automatiquement dans la catégorie « Promotions ».</p>
        </div>
        <div className="mt-5 grid gap-5 xl:grid-cols-[220px_1fr]">
          <div className="space-y-4">
            <Field label="Taux de solde (%)"><input type="number" min="0.01" max="100" step="0.01" value={percentage} onChange={(event) => setPercentage(event.target.value)} className="w-full" /></Field>
            <div className="border border-black/10 bg-[#faf9f6] p-3 text-[11px] text-stone">Le prix avant solde sera conservé et affiché comme ancien prix sur la boutique.</div>
            <button type="button" disabled={saving || selectedIds.length === 0} onClick={submitSale} className="asala-btn-solid w-full justify-center disabled:cursor-not-allowed disabled:opacity-40">Appliquer à {selectedIds.length} produit(s)</button>
          </div>
          <div className="min-w-0">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row">
              <label className="relative flex-1"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone" /><input value={searchValue} onChange={(event) => setSearchValue(event.target.value)} placeholder="Rechercher un produit..." className="w-full pl-9" /></label>
              <div className="flex gap-2"><button type="button" onClick={selectVisible} className="border border-black px-3 py-2 text-[10px] uppercase tracking-wider">Tout sélectionner</button><button type="button" onClick={() => setSelectedIds([])} className="border border-black/20 px-3 py-2 text-[10px] uppercase tracking-wider">Effacer</button></div>
            </div>
            <div className="max-h-[420px] overflow-y-auto border border-black/10">
              {filteredProducts.length === 0 ? <Empty label="Aucun produit trouvé." /> : filteredProducts.map((product) => {
                const isOnSale = Number(product.sale_percentage || 0) > 0 || product.sale_regular_price != null;
                return <label key={product.id} className="flex cursor-pointer items-center gap-3 border-b border-black/10 p-3 last:border-b-0 hover:bg-[#faf9f6]">
                  <input type="checkbox" checked={selectedIds.includes(product.id)} onChange={() => toggleProduct(product.id)} className="h-4 w-4" />
                  {product.images?.[0] ? <img src={product.images[0]} alt="" className="h-12 w-10 shrink-0 object-cover" /> : <div className="h-12 w-10 shrink-0 bg-[#f4f2ee]" />}
                  <span className="min-w-0 flex-1"><span className="block truncate text-[12px] font-medium">{product.name}</span><span className="block text-[11px] text-stone">{product.category} · {formatMoney(product.price)}{isOnSale ? ` · Solde ${product.sale_percentage}%` : ""}</span></span>
                </label>;
              })}
            </div>
          </div>
        </div>
      </section>
      <section className="border border-black bg-white p-4 sm:p-6">
        <div className="border-b border-black/10 pb-5"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Catégorie Promotions</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Soldes actives ({saleProducts.length})</h2></div>
        {saleProducts.length === 0 ? <Empty label="Aucune solde active." /> : <div className="mt-5 divide-y divide-black/10">{saleProducts.map((product) => <div key={product.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3">{product.images?.[0] ? <img src={product.images[0]} alt="" className="h-14 w-11 shrink-0 object-cover" /> : <div className="h-14 w-11 shrink-0 bg-[#f4f2ee]" />}<div className="min-w-0"><p className="truncate text-[12px] font-medium">{product.name}</p><p className="text-[11px] text-stone">{product.sale_percentage}% · {formatMoney(product.original_price ?? product.sale_regular_price ?? product.price)} → {formatMoney(product.price)}</p></div></div><button type="button" disabled={saving} onClick={() => onRemove(product)} className="border border-black px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white disabled:opacity-40">Retirer la solde</button></div>)}</div>}
      </section>
    </div>
  );
};

type PromotionsPanelProps = {
  promotions: PromoCodeRecord[];
  usages: PromoUsageRecord[];
  form: PromoCodeForm;
  editingId: string | null;
  saving: boolean;
  setForm: React.Dispatch<React.SetStateAction<PromoCodeForm>>;
  onSubmit: (event: React.FormEvent) => void;
  onEdit: (promo: PromoCodeRecord) => void;
  onCancel: () => void;
};

const PromotionsPanel: React.FC<PromotionsPanelProps> = ({ promotions, usages, form, editingId, saving, setForm, onSubmit, onEdit, onCancel }) => (
  <div className="grid gap-5 xl:grid-cols-[360px_1fr]">
    <section className="border border-black bg-white p-4 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Partenariat</p>
      <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{editingId ? "Modifier le code" : "Créer un code promotionnel"}</h2>
      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <Field label="Code promotionnel">
          <input required value={form.code} onChange={(event) => setForm((current) => ({ ...current, code: event.target.value.toUpperCase() }))} className="w-full uppercase" placeholder="EX. PROMO10" />
        </Field>
        <Field label="Réduction (%)">
          <input required type="number" min="0.01" max="100" step="0.01" value={form.discount_percentage} onChange={(event) => setForm((current) => ({ ...current, discount_percentage: event.target.value }))} className="w-full" />
        </Field>
        <label className="flex items-center gap-2 text-[12px]">
          <input type="checkbox" checked={form.is_active} onChange={(event) => setForm((current) => ({ ...current, is_active: event.target.checked }))} className="h-4 w-4" />
          Code actif et utilisable
        </label>
        <div className="flex flex-wrap gap-2">
          <button type="submit" disabled={saving} className="asala-btn-solid disabled:opacity-50">{saving ? "Enregistrement…" : editingId ? "Modifier le code" : "Créer le code"}</button>
          {editingId && <button type="button" onClick={onCancel} className="asala-btn">Annuler</button>}
        </div>
      </form>
    </section>

    <section className="border border-black bg-white p-4 sm:p-6">
      <div className="border-b border-black/10 pb-5">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Suivi des partenariats</p>
        <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Codes promotionnels ({promotions.length})</h2>
        <p className="mt-2 text-[12px] text-stone">Ouvrez un code pour voir les clients qui l’ont utilisé et les montants associés.</p>
      </div>
      {promotions.length === 0 ? <Empty label="Aucun code promotionnel créé." /> : <div className="mt-5 space-y-3">
        {promotions.map((promo) => {
          const promoUsages = usages.filter((usage) => usage.promo_code_id === promo.id);
          const totalOrders = promoUsages.reduce((sum, usage) => sum + Number(usage.order_total || 0), 0);
          const totalDiscount = promoUsages.reduce((sum, usage) => sum + Number(usage.discount_amount || 0), 0);
          const customerMap = new Map<string, { name: string; email: string; uses: number; total: number; discount: number }>();
          promoUsages.forEach((usage) => {
            const key = usage.customer_email.toLowerCase();
            const current = customerMap.get(key) || { name: usage.customer_name, email: usage.customer_email, uses: 0, total: 0, discount: 0 };
            current.uses += 1;
            current.total += Number(usage.order_total || 0);
            current.discount += Number(usage.discount_amount || 0);
            customerMap.set(key, current);
          });
          return <details key={promo.id} className="border border-black/10 bg-[#faf9f6] p-4">
            <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-[12px]">
              <span><strong>{promo.code}</strong><span className="ml-3 text-stone">-{promo.discount_percentage}% · {promo.is_active ? "Actif" : "Désactivé"}</span></span>
              <span className="font-medium">{formatMoney(totalOrders)}</span>
            </summary>
            <div className="mt-4 grid gap-3 border-t border-black/10 pt-4 text-[12px] sm:grid-cols-3">
              <div><span className="block text-[10px] uppercase tracking-wider text-stone">Utilisations</span><strong>{promoUsages.length}</strong></div>
              <div><span className="block text-[10px] uppercase tracking-wider text-stone">Total commandes</span><strong>{formatMoney(totalOrders)}</strong></div>
              <div><span className="block text-[10px] uppercase tracking-wider text-stone">Remises accordées</span><strong>{formatMoney(totalDiscount)}</strong></div>
            </div>
            {customerMap.size === 0 ? <p className="mt-4 text-[12px] text-stone">Ce code n’a pas encore été utilisé.</p> : <div className="mt-4 overflow-x-auto border border-black/10"><table className="w-full min-w-[620px] text-left text-[12px]"><thead className="bg-white text-[10px] uppercase tracking-wider text-stone"><tr><th className="px-3 py-2">Client</th><th className="px-3 py-2">Utilisations</th><th className="px-3 py-2">Total client</th><th className="px-3 py-2">Remise</th></tr></thead><tbody className="divide-y divide-black/10">{Array.from(customerMap.values()).map((customer) => <tr key={customer.email}><td className="px-3 py-2"><strong>{customer.name || "Client"}</strong><br /><span className="text-stone">{customer.email}</span></td><td className="px-3 py-2">{customer.uses}</td><td className="px-3 py-2">{formatMoney(customer.total)}</td><td className="px-3 py-2">{formatMoney(customer.discount)}</td></tr>)}</tbody></table></div>}
            <div className="mt-4 flex justify-end"><button type="button" onClick={() => onEdit(promo)} className="border border-black px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white">Modifier</button></div>
          </details>;
        })}
      </div>}
    </section>
  </div>
);

const CustomersPanel: React.FC<{ customers: CustomerRecord[]; onRefresh: () => void }> = ({ customers, onRefresh }) => <section className="border border-black bg-white p-4 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Relation client</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Comptes clients ({customers.length})</h2><p className="mt-2 text-[12px] text-stone">Les informations du compte client sont enregistrées dans cette relation.</p></div><div className="flex flex-wrap gap-2"><button onClick={onRefresh} className="inline-flex items-center gap-2 border border-black px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white"><RefreshCw size={14} /> Actualiser</button><button onClick={() => exportCustomersCsv(customers)} disabled={customers.length === 0} className="inline-flex items-center gap-2 border border-black px-3 py-2 text-[10px] uppercase tracking-wider hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"><Download size={14} /> Exporter CSV</button></div></div>{customers.length === 0 ? <Empty label="Aucun client enregistré." /> : <div className="mt-5 overflow-x-auto border border-black/10"><table className="w-full min-w-[1100px] text-left text-[12px]"><thead className="bg-[#faf9f6] text-[10px] uppercase tracking-wider text-stone"><tr><th className="px-4 py-3">Client</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Profil</th><th className="px-4 py-3">Adresse</th><th className="px-4 py-3">Commandes</th><th className="px-4 py-3">Dépensé</th><th className="px-4 py-3">Depuis</th></tr></thead><tbody className="divide-y divide-black/10">{customers.map((customer) => { const address = customer.address || {}; const addressText = [address.street, address.apartment, address.postalCode, address.city, address.governorate].filter(Boolean).join(", "); return <tr key={customer.id}><td className="px-4 py-3 font-medium">{customer.first_name} {customer.last_name}</td><td className="px-4 py-3 text-stone">{customer.email}<br />{customer.phone || "—"}<br />{customer.phone_secondary || "—"}</td><td className="px-4 py-3 text-stone">{customer.gender || "—"}<br />{customer.birth_date ? formatDate(customer.birth_date) : "Date de naissance —"}</td><td className="max-w-[250px] px-4 py-3 text-stone">{addressText || "Adresse non renseignée"}</td><td className="px-4 py-3">{customer.order_count}</td><td className="px-4 py-3 font-medium">{formatMoney(customer.total_spent)}</td><td className="px-4 py-3 text-stone">{formatDate(customer.created_at)}</td></tr>; })}</tbody></table></div>}</section>;

const MessagesPanel: React.FC<{ messages: ContactMessageRecord[]; onStatus: (id: string, status: ContactMessageRecord["status"]) => void; onDelete: (message: ContactMessageRecord) => void }> = ({ messages, onStatus, onDelete }) => (
  <section className="border border-black bg-white p-4 sm:p-6">
    <div className="border-b border-black/10 pb-5"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Service clientèle</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Messages ({messages.length})</h2></div>
    {messages.length === 0 ? <Empty label="Aucun message reçu." /> : <div className="mt-5 space-y-3">{messages.map((message) => <details key={message.id} className="border border-black/10 bg-[#faf9f6] p-4"><summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-3 text-[12px]"><span><strong>{message.name}</strong><span className="ml-3 text-stone">{message.email} · {formatDate(message.created_at)}</span></span><span className="font-medium uppercase tracking-wider">{message.status === "new" ? "Nouveau" : message.status === "read" ? "Lu" : message.status === "replied" ? "Répondu" : "Archivé"}</span></summary><div className="mt-4 space-y-3 border-t border-black/10 pt-4 text-[12px]"><p><strong>Objet :</strong> {message.subject || "—"}</p><p><strong>Téléphone :</strong> {message.phone || "—"}</p><p className="whitespace-pre-line leading-relaxed">{message.message}</p><div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/10 pt-3"><select value={message.status} onChange={(event) => onStatus(message.id, event.target.value as ContactMessageRecord["status"])} className="w-full sm:w-48"><option value="new">Nouveau</option><option value="read">Lu</option><option value="replied">Répondu</option><option value="archived">Archivé</option></select><button type="button" onClick={() => onDelete(message)} className="text-[10px] uppercase tracking-wider text-red-700 hover:underline">Supprimer</button></div></div></details>)}</div>}
  </section>
);

const NewsletterPanel: React.FC<{ subscribers: NewsletterSubscriberRecord[]; onDelete: (subscriber: NewsletterSubscriberRecord) => void }> = ({ subscribers, onDelete }) => (
  <section className="border border-black bg-white p-4 sm:p-6">
    <div className="border-b border-black/10 pb-5"><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Communication</p><h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Contacts newsletter ({subscribers.length})</h2></div>
    {subscribers.length === 0 ? <Empty label="Aucun contact inscrit à la newsletter." /> : <div className="mt-5 overflow-x-auto border border-black/10"><table className="w-full min-w-[620px] text-left text-[12px]"><thead className="bg-[#faf9f6] text-[10px] uppercase tracking-wider text-stone"><tr><th className="px-4 py-3">Adresse email</th><th className="px-4 py-3">Statut</th><th className="px-4 py-3">Inscription</th><th className="px-4 py-3 text-right">Action</th></tr></thead><tbody className="divide-y divide-black/10">{subscribers.map((subscriber) => <tr key={subscriber.email}><td className="px-4 py-3 font-medium">{subscriber.email}</td><td className="px-4 py-3">{subscriber.is_active ? "Actif" : "Désinscrit"}</td><td className="px-4 py-3 text-stone">{formatDate(subscriber.subscribed_at)}</td><td className="px-4 py-3 text-right"><button type="button" onClick={() => onDelete(subscriber)} className="text-[10px] uppercase tracking-wider text-red-700 hover:underline">Supprimer</button></td></tr>)}</tbody></table></div>}
  </section>
);

type ContentPanelProps = {
  content: ContentRecord[];
  sections: HomeSectionRecord[];
  tiles: CollectionTileRecord[];
  categories: CategoryRecord[];
  sectionForm: HomeSectionForm;
  editingSectionId: string | null;
  setSectionForm: React.Dispatch<React.SetStateAction<HomeSectionForm>>;
  tileForm: CollectionTileForm;
  editingTileId: string | null;
  setTileForm: React.Dispatch<React.SetStateAction<CollectionTileForm>>;
  onUpdate: (item: ContentRecord, value: string) => void;
  onImageUpload: (item: ContentRecord, event: React.ChangeEvent<HTMLInputElement>) => void;
  onSectionSubmit: (event: React.FormEvent) => void;
  onSectionEdit: (section: HomeSectionRecord) => void;
  onSectionDelete: (section: HomeSectionRecord) => void;
  onTileSubmit: (event: React.FormEvent) => void;
  onTileEdit: (tile: CollectionTileRecord) => void;
  onTileDelete: (tile: CollectionTileRecord) => void;
};

const ContentPanel: React.FC<ContentPanelProps> = ({ content, sections, tiles, categories, sectionForm, editingSectionId, setSectionForm, tileForm, editingTileId, setTileForm, onUpdate, onImageUpload, onSectionSubmit, onSectionEdit, onSectionDelete, onTileSubmit, onTileEdit, onTileDelete }) => (
  <div className="space-y-5">
    <section className="border border-black bg-white p-4 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Page d'accueil</p>
      <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Contenus de la page d'accueil</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {content.filter((item) => !item.content_key.startsWith("about_")).map((item) => (
          <label key={item.id} className="border border-black/10 bg-[#faf9f6] p-4">
            <span className="text-[10px] uppercase tracking-wider text-stone">{item.label}</span>
            {item.content_key === "shipping_fee" || item.content_key === "free_shipping_threshold" ? (
              <input type="number" min="0" step="0.01" value={item.value} onChange={(event) => onUpdate(item, event.target.value)} className="mt-2 w-full bg-white" />
            ) : item.type === "text" ? (
              <textarea value={item.value} onChange={(event) => onUpdate(item, event.target.value)} rows={3} className="mt-2 w-full bg-white" />
            ) : item.type === "image" ? (
              <div className="mt-2 space-y-2">
                <input value={item.value} onChange={(event) => onUpdate(item, event.target.value)} className="w-full bg-white" placeholder="URL de l'image" />
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageUpload(item, event)} className="w-full border border-dashed border-black/30 p-3 text-[12px]" />
              </div>
            ) : (
              <input value={item.value} onChange={(event) => onUpdate(item, event.target.value)} className="mt-2 w-full bg-white" />
            )}
          </label>
        ))}
      </div>
    </section>

    <section className="border border-black bg-white p-4 sm:p-6">
      <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Page À propos</p>
      <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Contenus de la page À propos</h2>
      <p className="mt-2 text-[12px] text-stone">Modifiez ici uniquement les textes, images et le bouton de la page /a-propos.</p>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {content.filter((item) => item.content_key.startsWith("about_")).map((item) => (
          <label key={item.id} className="border border-black/10 bg-[#faf9f6] p-4">
            <span className="text-[10px] uppercase tracking-wider text-stone">{item.label}</span>
            {item.type === "text" ? (
              <textarea value={item.value} onChange={(event) => onUpdate(item, event.target.value)} rows={3} className="mt-2 w-full bg-white" />
            ) : item.type === "image" ? (
              <div className="mt-2 space-y-2">
                <input value={item.value} onChange={(event) => onUpdate(item, event.target.value)} className="w-full bg-white" placeholder="URL de l'image" />
                <input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => onImageUpload(item, event)} className="w-full border border-dashed border-black/30 p-3 text-[12px]" />
              </div>
            ) : (
              <input value={item.value} onChange={(event) => onUpdate(item, event.target.value)} className="mt-2 w-full bg-white" />
            )}
          </label>
        ))}
      </div>
    </section>

    <section className="border border-black bg-white p-4 sm:p-6">
      <div className="border-b border-black/10 pb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Page d'accueil</p>
        <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
          {editingSectionId ? "Modifier une section" : "Créer une section éditoriale"}
        </h2>
        <p className="mt-2 text-[12px] text-stone">Chaque bouton sera lié automatiquement à la catégorie choisie.</p>
      </div>

      <form onSubmit={onSectionSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Surtitre"><input required value={sectionForm.eyebrow} onChange={(event) => setSectionForm((current) => ({ ...current, eyebrow: event.target.value }))} className="w-full" placeholder="Collection Emblématique" /></Field>
        <Field label="Titre"><input required value={sectionForm.title} onChange={(event) => setSectionForm((current) => ({ ...current, title: event.target.value }))} className="w-full" placeholder="L'ART DU CAFTAN" /></Field>
        <Field label="Sous-titre" className="md:col-span-2"><textarea value={sectionForm.subtitle} onChange={(event) => setSectionForm((current) => ({ ...current, subtitle: event.target.value }))} rows={2} className="w-full" /></Field>
        <Field label="Description" className="md:col-span-2"><textarea value={sectionForm.description} onChange={(event) => setSectionForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="w-full" /></Field>
        <Field label="Image URL"><input value={sectionForm.image_url} onChange={(event) => setSectionForm((current) => ({ ...current, image_url: event.target.value }))} className="w-full" placeholder="/mon-image.jpg" /></Field>
        <Field label="Catégorie du bouton"><select value={sectionForm.category_slug} onChange={(event) => setSectionForm((current) => ({ ...current, category_slug: event.target.value }))} className="w-full"><option value="">Collection générale</option>{categories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.slug}>{category.name} → /{category.slug}</option>)}</select></Field>
        <Field label="Texte du bouton"><input value={sectionForm.button_label} onChange={(event) => setSectionForm((current) => ({ ...current, button_label: event.target.value }))} className="w-full" /></Field>
        <Field label="Ordre d'affichage"><input type="number" min="0" value={sectionForm.sort_order} onChange={(event) => setSectionForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} className="w-full" /></Field>
        <div className="flex justify-end md:col-span-2"><button type="submit" className="asala-btn-solid w-full justify-center sm:w-auto">{editingSectionId ? "Mettre à jour la section" : "Ajouter la section"}</button></div>
      </form>

      <div className="mt-6 divide-y divide-black/10 border-t border-black/10">
        {sections.map((section) => (
          <div key={section.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0"><p className="font-medium">{section.title}</p><p className="text-[11px] text-stone">{section.eyebrow} · bouton vers /{section.category_slug || "collection"}</p></div>
            <div className="flex shrink-0 gap-2"><button type="button" onClick={() => onSectionEdit(section)} className="border border-black/20 p-2"><Pencil size={14} /></button><button type="button" onClick={() => onSectionDelete(section)} className="border border-black/20 p-2 text-red-700"><Trash2 size={14} /></button></div>
          </div>
        ))}
      </div>
    </section>

    <section className="border border-black bg-white p-4 sm:p-6">
      <div className="border-b border-black/10 pb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-stone">Page d'accueil</p>
        <h2 className="mt-1 text-[24px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
          {editingTileId ? "Modifier une carte" : "Ajouter une carte — Nos lignes de création"}
        </h2>
        <p className="mt-2 text-[12px] text-stone">Les cartes sont affichées sur la page d'accueil et leur bouton ouvre la catégorie choisie.</p>
      </div>

      <form onSubmit={onTileSubmit} className="mt-5 grid gap-4 md:grid-cols-2">
        <Field label="Surtitre"><input value={tileForm.eyebrow} onChange={(event) => setTileForm((current) => ({ ...current, eyebrow: event.target.value }))} className="w-full" placeholder="La Signature Maison Kenza" /></Field>
        <Field label="Titre"><input required value={tileForm.title} onChange={(event) => setTileForm((current) => ({ ...current, title: event.target.value }))} className="w-full" placeholder="CAFTANS" /></Field>
        <Field label="Image URL"><input value={tileForm.image_url} onChange={(event) => setTileForm((current) => ({ ...current, image_url: event.target.value }))} className="w-full" placeholder="/home-caftans.jpg" /></Field>
        <Field label="Catégorie du bouton"><select value={tileForm.category_slug} onChange={(event) => setTileForm((current) => ({ ...current, category_slug: event.target.value }))} className="w-full"><option value="">Collection générale</option>{categories.filter((category) => category.is_active).map((category) => <option key={category.id} value={category.slug}>{category.name} → /{category.slug}</option>)}</select></Field>
        <Field label="Texte du bouton"><input value={tileForm.button_label} onChange={(event) => setTileForm((current) => ({ ...current, button_label: event.target.value }))} className="w-full" /></Field>
        <Field label="Ordre d'affichage"><input type="number" min="0" value={tileForm.sort_order} onChange={(event) => setTileForm((current) => ({ ...current, sort_order: Number(event.target.value) }))} className="w-full" /></Field>
        <div className="flex justify-end md:col-span-2"><button type="submit" className="asala-btn-solid w-full justify-center sm:w-auto">{editingTileId ? "Mettre à jour la carte" : "Ajouter la carte"}</button></div>
      </form>

      <div className="mt-6 divide-y divide-black/10 border-t border-black/10">
        {tiles.length === 0 ? <p className="py-4 text-[12px] text-stone">Aucune carte configurée.</p> : tiles.map((tile) => (
          <div key={tile.id} className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
              {tile.image_url && <img src={tile.image_url} alt="" className="h-14 w-11 shrink-0 object-cover" />}
              <div className="min-w-0"><p className="font-medium">{tile.title}</p><p className="text-[11px] text-stone">{tile.eyebrow} · bouton vers /{tile.category_slug || "collection"}</p></div>
            </div>
            <div className="flex shrink-0 gap-2"><button type="button" onClick={() => onTileEdit(tile)} className="border border-black/20 p-2"><Pencil size={14} /></button><button type="button" onClick={() => onTileDelete(tile)} className="border border-black/20 p-2 text-red-700"><Trash2 size={14} /></button></div>
          </div>
        ))}
      </div>
    </section>
  </div>
);

const ColorVariantsEditor: React.FC<{ form: ProductForm; setForm: React.Dispatch<React.SetStateAction<ProductForm>>; onUploadColor: (color: string, event: React.ChangeEvent<HTMLInputElement>) => void }> = ({ form, setForm, onUploadColor }) => {
  const [newColor, setNewColor] = useState("");
  const colors = splitList(form.colors);
  const colorImages = parseColorImages(form.color_images);

  const addColor = () => {
    const color = newColor.trim();
    if (!color || colors.some((current) => current.toLowerCase() === color.toLowerCase())) return;
    setForm((current) => ({ ...current, colors: [...splitList(current.colors), color].join(", ") }));
    setNewColor("");
  };

  const removeColor = (color: string) => {
    const nextImages = { ...colorImages };
    delete nextImages[color];
    setForm((current) => ({
      ...current,
      colors: splitList(current.colors).filter((currentColor) => currentColor !== color).join(", "),
      color_images: joinColorImages(nextImages),
    }));
  };

  return (
    <div className="md:col-span-2 border border-black/10 bg-[#faf9f6] p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.16em] text-stone">Variantes du produit</p>
          <h3 className="mt-1 text-[16px] font-medium">Couleurs et photos</h3>
        </div>
        <span className="text-[10px] text-stone">{colors.length} couleur(s)</span>
      </div>

      {colors.length > 0 && <div className="space-y-3">
        {colors.map((color) => (
          <div key={color} className="border border-black/15 bg-white p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
              <span className="text-[11px] font-medium uppercase tracking-wider">{color}</span>
              <button type="button" onClick={() => removeColor(color)} className="text-[10px] uppercase tracking-wider text-red-700 hover:underline">Supprimer</button>
            </div>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(event) => onUploadColor(color, event)} className="w-full border border-dashed border-black/30 p-3 text-[12px]" />
            <p className="mt-2 text-[10px] text-stone">{colorImages[color]?.length || 0} photo(s) enregistrée(s)</p>
          </div>
        ))}
      </div>}

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <input value={newColor} onChange={(event) => setNewColor(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") { event.preventDefault(); addColor(); } }} placeholder="Ex. Rouge, Bleu nuit…" className="flex-1" />
        <button type="button" onClick={addColor} className="asala-btn-solid whitespace-nowrap">Ajouter une autre couleur</button>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{ form: ProductForm; categories: string[]; editing: boolean; saving: boolean; setForm: React.Dispatch<React.SetStateAction<ProductForm>>; onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void; onUploadColor: (color: string, event: React.ChangeEvent<HTMLInputElement>) => void; onSubmit: (event: React.FormEvent) => void; onClose: () => void }> = ({ form, categories, editing, saving, setForm, onUpload, onUploadColor, onSubmit, onClose }) => <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 p-4 sm:p-8" onClick={onClose}><div className="mx-auto max-w-5xl border border-black bg-white p-5 sm:p-8" onClick={(event) => event.stopPropagation()}><div className="mb-6 flex items-start justify-between border-b border-black/10 pb-4"><div><p className="text-[10px] uppercase tracking-[0.18em] text-stone">Catalogue Supabase</p><h2 className="mt-1 text-[28px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{editing ? "Modifier le produit" : "Nouveau produit"}</h2></div><button onClick={onClose} className="p-1"><X size={20} /></button></div><form onSubmit={onSubmit} className="grid grid-cols-1 gap-5 md:grid-cols-2"><Field label="Nom du produit" className="md:col-span-2"><input required value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className="w-full" /></Field><Field label="Catégorie"><select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className="w-full">{categories.map((category) => <option key={category}>{category}</option>)}</select></Field><Field label="Stock"><input required type="number" min="0" value={form.stock} onChange={(event) => setForm((current) => ({ ...current, stock: event.target.value }))} className="w-full" /></Field><Field label="Prix (TND)"><input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))} className="w-full" /></Field><Field label="Prix avant remise"><input type="number" min="0" step="0.01" value={form.original_price} onChange={(event) => setForm((current) => ({ ...current, original_price: event.target.value }))} className="w-full" /></Field><Field label="Photos du produit" className="md:col-span-2"><div className="flex flex-col gap-3"><input type="file" accept="image/*" multiple onChange={onUpload} className="w-full border border-dashed border-black/30 p-3 text-[12px]" /><textarea rows={3} value={form.images} onChange={(event) => setForm((current) => ({ ...current, images: event.target.value }))} className="w-full" placeholder="URLs publiques, une par ligne" /></div></Field><Field label="Description" className="md:col-span-2"><textarea required rows={4} value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className="w-full" /></Field><Field label="Tailles"><input value={form.sizes} onChange={(event) => setForm((current) => ({ ...current, sizes: event.target.value }))} className="w-full" placeholder="S, M, L" /></Field><Field label="Matière"><input value={form.fabric} onChange={(event) => setForm((current) => ({ ...current, fabric: event.target.value }))} className="w-full" /></Field><Field label="Entretien"><input value={form.care} onChange={(event) => setForm((current) => ({ ...current, care: event.target.value }))} className="w-full" /></Field><Field label="Détails" className="md:col-span-2"><textarea rows={2} value={form.details} onChange={(event) => setForm((current) => ({ ...current, details: event.target.value }))} className="w-full" /></Field><ColorVariantsEditor form={form} setForm={setForm} onUploadColor={onUploadColor} /><div className="flex flex-wrap gap-5 md:col-span-2"><label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.is_new} onChange={(event) => setForm((current) => ({ ...current, is_new: event.target.checked }))} className="h-4 w-4" /> Nouveau</label><label className="flex items-center gap-2 text-[12px]"><input type="checkbox" checked={form.featured} onChange={(event) => setForm((current) => ({ ...current, featured: event.target.checked }))} className="h-4 w-4" /> À la une</label></div><div className="flex justify-end gap-3 border-t border-black/10 pt-5 md:col-span-2"><button type="button" onClick={onClose} className="asala-btn">Annuler</button><button type="submit" disabled={saving} className="asala-btn-solid inline-flex items-center gap-2">{saving ? "Enregistrement…" : <><Check size={14} /> Enregistrer</>}</button></div></form></div></div>;

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = "" }) => <label className={`block ${className}`}><span className="mb-1.5 block text-[10px] uppercase tracking-[0.14em] text-stone">{label}</span>{children}</label>;
const Metric: React.FC<{ label: string; value: string | number; icon: React.ReactNode }> = ({ label, value, icon }) => <div className="flex items-center justify-between border border-black bg-white p-4 sm:p-5"><div><p className="text-[10px] uppercase tracking-[0.14em] text-stone">{label}</p><p className="mt-2 text-xl font-medium sm:text-2xl">{value}</p></div>{icon}</div>;
const StatusBadge: React.FC<{ status: string }> = ({ status }) => <span className="mt-1 inline-block border border-black/20 px-2 py-0.5 text-[9px] uppercase tracking-wider">{status}</span>;
const Empty: React.FC<{ label: string }> = ({ label }) => <div className="border border-dashed border-black/20 px-5 py-12 text-center text-[12px] text-stone">{label}</div>;
const Notice: React.FC<{ tone: "error" | "success"; children: React.ReactNode }> = ({ tone, children }) => <div className={`border px-4 py-3 text-[12px] ${tone === "error" ? "border-red-700 bg-red-50 text-red-800" : "border-black bg-white"}`}>{children}</div>;
const Loading: React.FC = () => <div className="flex min-h-[240px] items-center justify-center border border-black bg-white text-[11px] uppercase tracking-wider text-stone"><RefreshCw size={16} className="mr-2 animate-spin" /> Chargement du dashboard…</div>;

export default AdminDashboard;
