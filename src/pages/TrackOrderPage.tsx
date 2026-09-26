import React, { useState } from "react";
import { Search, Package, Truck, MapPin, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

type TrackedOrderItem = {
  id: string;
  product_name: string;
  category: string | null;
  unit_price: number | string;
  quantity: number;
  size: string | null;
  color: string | null;
  size_mode: "standard" | "custom";
  custom_details: string | null;
};

type TrackedOrder = {
  order_number: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: Record<string, string> | null;
  status: string;
  payment_status: string;
  payment_method: string;
  shipping_method: string;
  subtotal: number | string;
  discount: number | string;
  shipping_fee: number | string;
  total: number | string;
  delivery_delay_days: number;
  created_at: string;
  updated_at: string;
  items: TrackedOrderItem[];
};

const statusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const formatDate = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date(value));

const formatMoney = (value: number | string) => `${Number(value || 0).toFixed(2)} TND`;

const TrackOrderPage: React.FC = () => {
  const [reference, setReference] = useState("");
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanReference = reference.trim().toUpperCase();
    setError("");
    setOrder(null);

    if (!/^[A-Z0-9-]{4,80}$/.test(cleanReference)) {
      setError("Saisissez une référence valide, par exemple KENZA-123456.");
      return;
    }
    if (!supabase) {
      setError("Le suivi de commande est momentanément indisponible.");
      return;
    }

    setIsLoading(true);
    const { data, error: lookupError } = await supabase.rpc("lookup_order", {
      p_order_number: cleanReference,
    });
    setIsLoading(false);

    const result = Array.isArray(data) ? data[0] : data;
    if (lookupError || !result) {
      setError("Aucune commande ne correspond à cette référence.");
      return;
    }
    setOrder(result as TrackedOrder);
  };

  const address = order?.address || {};
  const addressLine = [
    address.address || address.street,
    address.apartment,
    address.postalCode,
    address.city,
    address.governorate,
  ].filter(Boolean).join(", ");

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-black/10 bg-[#faf9f6] py-10 text-center lg:py-14">
        <div className="asala-container">
          <span className="mb-2 block text-[11px] font-medium uppercase tracking-[0.2em] text-stone">Service client</span>
          <h1 className="text-[34px] font-normal uppercase tracking-tight text-black sm:text-[44px]" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
            SUIVRE MA COMMANDE
          </h1>
          <p className="mx-auto mt-2 max-w-xl text-[13px] leading-relaxed text-stone">
            Entrez la référence reçue après votre commande pour consulter son statut et son récapitulatif.
          </p>
        </div>
      </section>

      <div className="asala-container py-10 lg:py-16">
        <div className="mx-auto max-w-3xl">
          <form onSubmit={handleSearch} className="border border-black bg-white p-4 sm:flex sm:items-end sm:gap-3 sm:p-6">
            <label className="block flex-1 text-[11px] font-medium uppercase tracking-[0.14em] text-stone">
              Référence de commande
              <input
                value={reference}
                onChange={(event) => setReference(event.target.value.toUpperCase())}
                placeholder="KENZA-123456"
                maxLength={80}
                className="mt-2 w-full border border-black px-4 py-3 text-[13px] uppercase tracking-[0.12em] text-black outline-none placeholder:normal-case placeholder:tracking-normal"
                autoComplete="off"
              />
            </label>
            <button type="submit" disabled={isLoading} className="asala-btn-solid mt-3 w-full justify-center py-3 sm:mt-0 sm:w-auto sm:min-w-[170px]">
              <Search size={15} strokeWidth={1.5} />
              {isLoading ? "Recherche…" : "Rechercher"}
            </button>
          </form>

          {error && <p role="alert" className="mt-4 border border-red-700 bg-red-50 p-3 text-[12px] text-red-800">{error}</p>}

          {order && (
            <div className="mt-8 space-y-6">
              <section className="border border-black bg-white p-5 sm:p-7">
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-black/10 pb-5">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.16em] text-stone">Référence</p>
                    <h2 className="mt-1 text-[24px] font-normal text-black" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>{order.order_number}</h2>
                    <p className="mt-1 text-[11px] text-stone">Commande du {formatDate(order.created_at)}</p>
                  </div>
                  <span className="inline-flex items-center gap-2 bg-black px-3 py-2 text-[10px] font-medium uppercase tracking-[0.14em] text-white">
                    <CheckCircle2 size={14} strokeWidth={1.5} /> {statusLabels[order.status] || order.status}
                  </span>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-3">
                  <div className="border border-black/10 bg-[#faf9f6] p-4"><Package size={18} strokeWidth={1.4} /><p className="mt-3 text-[10px] uppercase tracking-wider text-stone">Client</p><p className="mt-1 text-[12px] font-medium">{order.customer_name}</p></div>
                  <div className="border border-black/10 bg-[#faf9f6] p-4"><Truck size={18} strokeWidth={1.4} /><p className="mt-3 text-[10px] uppercase tracking-wider text-stone">Livraison</p><p className="mt-1 text-[12px] font-medium">Standard{order.delivery_delay_days ? ` + ${order.delivery_delay_days} jours` : ""}</p></div>
                  <div className="border border-black/10 bg-[#faf9f6] p-4"><MapPin size={18} strokeWidth={1.4} /><p className="mt-3 text-[10px] uppercase tracking-wider text-stone">Adresse</p><p className="mt-1 text-[12px] font-medium leading-relaxed">{addressLine || "Adresse enregistrée"}</p></div>
                </div>
              </section>

              <section className="border border-black bg-white p-5 sm:p-7">
                <h2 className="border-b border-black/10 pb-3 text-[12px] font-semibold uppercase tracking-[0.16em]">Détail de la commande</h2>
                <div className="divide-y divide-black/10">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex flex-wrap items-start justify-between gap-4 py-4 text-[12px]">
                      <div>
                        <p className="font-medium uppercase">{item.quantity} × {item.product_name}</p>
                        <p className="mt-1 text-[11px] text-stone">{item.size_mode === "custom" ? "Sur mesure · +2 jours" : `Taille : ${item.size || "Standard"}`}{item.color ? ` · ${item.color}` : ""}</p>
                        {item.custom_details && <p className="mt-1 max-w-lg leading-relaxed text-stone">Précisions : {item.custom_details}</p>}
                      </div>
                      <span className="font-medium">{formatMoney(Number(item.unit_price) * item.quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 space-y-2 border-t border-black/10 pt-4 text-[12px]">
                  <div className="flex justify-between text-stone"><span>Sous-total</span><span className="text-black">{formatMoney(order.subtotal)}</span></div>
                  {Number(order.discount) > 0 && <div className="flex justify-between text-stone"><span>Remise</span><span className="text-black">-{formatMoney(order.discount)}</span></div>}
                  <div className="flex justify-between text-stone"><span>Livraison</span><span className="text-black">{Number(order.shipping_fee) ? formatMoney(order.shipping_fee) : "Offerte"}</span></div>
                  <div className="flex justify-between pt-2 text-[15px] font-semibold"><span>Total</span><span>{formatMoney(order.total)}</span></div>
                </div>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrackOrderPage;
