import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CheckCircle,
  Banknote,
  ArrowRight,
  Lock,
  Tag,
} from "lucide-react";
import { useCart } from "@/context/CartContext";
import { Order, ShippingAddress } from "@/types";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";
import { useSiteContent } from "@/context/SiteContentContext";
import { calculateShippingFee } from "@/lib/shipping";

const TUNISIAN_GOVERNORATES = [
  "Tunis",
  "Ariana",
  "Ben Arous",
  "Manouba",
  "Nabeul",
  "Zaghouan",
  "Bizerte",
  "Béja",
  "Jendouba",
  "Le Kef",
  "Siliana",
  "Sousse",
  "Monastir",
  "Mahdia",
  "Sfax",
  "Kairouan",
  "Kasserine",
  "Sidi Bouzid",
  "Gabès",
  "Médenine",
  "Tataouine",
  "Gafsa",
  "Tozeur",
  "Kébili",
];

const CheckoutPage: React.FC = () => {
  const { cart, promoCode, promoDiscount, applyPromoCode, removePromoCode, addOrder } = useCart();
  const { content } = useSiteContent();
  const navigate = useNavigate();

  const [step, setStep] = useState<number>(1);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [orderSyncError, setOrderSyncError] = useState("");
  const [orderSyncBackendError, setOrderSyncBackendError] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoError, setPromoError] = useState("");
  const [isApplyingPromo, setIsApplyingPromo] = useState(false);
  const [addressError, setAddressError] = useState("");

  // Form State
  const [formData, setFormData] = useState<ShippingAddress>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    apartment: "",
    city: "",
    governorate: "",
    postalCode: "",
  });

  const [shippingMethod, setShippingMethod] = useState<"standard">("standard");
  const [paymentMethod, setPaymentMethod] = useState<"cod">("cod");

  useEffect(() => {
    if (!supabase) return;

    const authClient = supabase;
    let mounted = true;
    const loadCustomerDetails = async () => {
      const { data: sessionData } = await authClient.auth.getSession();
      const user = sessionData.session?.user;
      if (!user?.email) return;

      const { data } = await authClient
        .from("customers")
        .select("first_name,last_name,email,phone,address")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!mounted) return;

      const savedAddress = (data?.address && typeof data.address === "object" ? data.address : {}) as Record<string, unknown>;
      const metadata = user.user_metadata || {};
      setFormData((current) => ({
        ...current,
        firstName: data?.first_name || metadata.first_name || current.firstName,
        lastName: data?.last_name || metadata.last_name || current.lastName,
        email: data?.email || user.email || current.email,
        phone: data?.phone || metadata.phone || current.phone,
        address: typeof savedAddress.street === "string" ? savedAddress.street : current.address,
        apartment: typeof savedAddress.apartment === "string" ? savedAddress.apartment : current.apartment,
        city: typeof savedAddress.city === "string" ? savedAddress.city : current.city,
        governorate: typeof savedAddress.governorate === "string" ? savedAddress.governorate : current.governorate,
        postalCode: typeof savedAddress.postalCode === "string" ? savedAddress.postalCode : current.postalCode,
      }));
    };

    void loadCustomerDetails();
    return () => { mounted = false; };
  }, []);

  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const discountAmount = Math.round(subtotal * promoDiscount);
  const customOrder = cart.some((item) => item.sizeMode === "custom");
  const deliveryDelayDays = customOrder ? 2 : 0;
  const shippingFee = calculateShippingFee({
    subtotal,
    cartIsEmpty: cart.length === 0,
    announcement: content.announcement,
    shippingFee: content.shipping_fee,
    freeShippingThreshold: content.free_shipping_threshold,
  });
  const total = Math.max(0, subtotal - discountAmount + shippingFee);

  const handleApplyPromo = async (event: React.FormEvent) => {
    event.preventDefault();
    setPromoError("");
    setIsApplyingPromo(true);
    const success = await applyPromoCode(promoInput);
    setIsApplyingPromo(false);
    if (success) setPromoInput("");
    else setPromoError("Ce code promotionnel est invalide ou désactivé.");
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (addressError) setAddressError("");
  };

  const handleContinueToShipping = () => {
    const missingFields = [
      formData.address.trim().length < 3 ? "l'adresse" : "",
      formData.city.trim().length < 2 ? "la ville" : "",
      formData.governorate.trim().length < 2 ? "le gouvernorat" : "",
    ].filter(Boolean);

    if (missingFields.length > 0) {
      setAddressError(`Veuillez compléter ${missingFields.join(", ")}.`);
      return;
    }
    setAddressError("");
    setStep(3);
  };

  const handleFinalizeOrder = async () => {
    const newOrder: Order = {
      id: `KENZA-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("fr-FR", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
      status: "En préparation",
      items: [...cart],
      shippingAddress: { ...formData },
      shippingMethod,
      shippingFee,
      paymentMethod,
      subtotal,
      discount: discountAmount,
      total,
      deliveryDelayDays,
    };

    setOrderSyncError("");
    setOrderSyncBackendError("");

    if (supabase) {
      const { error: syncError } = await supabase.rpc("create_order", {
        p_order_number: newOrder.id,
        p_customer_name: `${formData.firstName} ${formData.lastName}`,
        p_email: formData.email,
        p_phone: formData.phone,
        p_address: {
          ...formData,
          address: formData.address.trim(),
          street: formData.address.trim(),
          apartment: formData.apartment?.trim() || null,
          city: formData.city.trim(),
          governorate: formData.governorate.trim(),
          postalCode: formData.postalCode.trim(),
        },
        p_shipping_method: shippingMethod,
        p_payment_method: paymentMethod,
        p_items: cart.map((item) => ({
          product_id: String(item.product.id),
          quantity: item.quantity,
          size: item.size || null,
          color: item.color || null,
          size_mode: item.sizeMode || "standard",
          custom_details: item.customDetails || null,
        })),
        p_promo_code: promoCode || null,
      });

      if (syncError) {
        console.error("Order creation failed", syncError);
        setOrderSyncBackendError(syncError.message || "");
        setOrderSyncError("La commande n'a pas pu être validée. Vérifiez votre panier puis réessayez.");
        return;
      }
    }

    addOrder(newOrder);
    setCreatedOrder(newOrder);
    setStep(5);
  };

  if (cart.length === 0 && step !== 5) {
    return (
      <div className="asala-container py-24 text-center">
        <h1
          className="text-2xl font-normal uppercase text-black mb-4"
          style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
        >
          Votre panier est vide
        </h1>
        <p className="text-stone text-[13px] mb-6 font-normal">
          Ajoutez des pièces à votre sélection pour procéder à la commande.
        </p>
        <Link to="/collection" className="asala-btn inline-flex">
          Découvrir la collection
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Stepper Header */}
      <section className="border-b border-black/10 bg-[#faf9f6] py-8 lg:py-10 text-center select-none">
        <div className="asala-container">
          <span className="text-[10px] uppercase tracking-[0.24em] text-stone font-medium block mb-1">
            Commande Sécurisée
          </span>
          <h1
            className="text-[28px] lg:text-[34px] font-normal uppercase tracking-tight text-black"
            style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
          >
            FINALISER MA COMMANDE
          </h1>

          {/* Stepper Steps */}
          {step < 5 && (
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-6 mt-4 sm:mt-6 text-[10px] sm:text-[11px] uppercase tracking-[0.08em] sm:tracking-[0.14em]">
              <span className={step >= 1 ? "text-black font-semibold border-b border-black pb-0.5" : "text-stone/60 font-normal"}>
                1. Coordonnées
              </span>
              <span className="text-stone/40">→</span>
              <span className={step >= 2 ? "text-black font-semibold border-b border-black pb-0.5" : "text-stone/60 font-normal"}>
                2. Adresse
              </span>
              <span className="text-stone/40">→</span>
              <span className={step >= 3 ? "text-black font-semibold border-b border-black pb-0.5" : "text-stone/60 font-normal"}>
                3. Livraison
              </span>
              <span className="text-stone/40">→</span>
              <span className={step >= 4 ? "text-black font-semibold border-b border-black pb-0.5" : "text-stone/60 font-normal"}>
                4. Paiement
              </span>
            </div>
          )}
        </div>
      </section>

      <div className="asala-container py-10 lg:py-14">
        {step === 5 && createdOrder ? (
          /* Step 5: Confirmation Success */
          <div className="max-w-2xl mx-auto border border-black p-8 sm:p-12 text-center bg-white">
            {(orderSyncBackendError || orderSyncError) && (
              <p className="mb-5 border border-amber-700 bg-amber-50 px-4 py-3 text-left text-[12px] text-amber-900">
                {orderSyncBackendError || orderSyncError}
              </p>
            )}
            <CheckCircle size={48} strokeWidth={1.2} className="mx-auto text-black mb-4" />
            <span className="text-[11px] uppercase tracking-[0.22em] text-stone block mb-1 font-medium">
              Commande Enregistrée
            </span>
            <h2
              className="text-[30px] font-normal uppercase tracking-tight text-black mb-2"
              style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
            >
              MERCI POUR VOTRE CONFIANCE
            </h2>
            <p className="text-[13px] text-stone font-normal mb-8">
              Référence de commande :{" "}
              <strong className="text-black font-semibold">{createdOrder.id}</strong>
            </p>

            <div className="bg-[#faf9f6] p-6 border border-black/10 text-left text-[12px] space-y-3 mb-8">
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-stone">Destinataire :</span>
                <span className="font-medium text-black">
                  {createdOrder.shippingAddress.firstName} {createdOrder.shippingAddress.lastName}
                </span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-stone">Adresse de livraison :</span>
                <span className="font-medium text-black text-right">
                  {createdOrder.shippingAddress.address}, {createdOrder.shippingAddress.city} ({createdOrder.shippingAddress.governorate})
                </span>
              </div>
              <div className="flex justify-between border-b border-black/10 pb-2">
                <span className="text-stone">Mode de règlement :</span>
                <span className="font-medium text-black">Paiement en espèces à la livraison</span>
              </div>
              <div className="flex justify-between pt-1 text-[14px]">
                <span className="font-semibold text-black">Total de la commande :</span>
                <span className="font-semibold text-black">{createdOrder.total} TND</span>
              </div>
            </div>

            <p className="text-[13px] text-stone font-normal mb-8 max-w-md mx-auto leading-relaxed">
              Un SMS de confirmation a été transmis au{" "}
              <span className="text-black font-medium">{createdOrder.shippingAddress.phone}</span>. Notre atelier prépare votre commande avec le plus grand soin.
            </p>

            {createdOrder.deliveryDelayDays ? (
              <p className="mb-8 border border-black/10 bg-[#faf9f6] px-4 py-3 text-left text-[12px] text-stone">
                Cette commande comprend une pièce sur mesure : <strong className="text-black">+{createdOrder.deliveryDelayDays} jours</strong> de délai de livraison.
              </p>
            ) : null}

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/compte" className="asala-btn-solid">
                Suivre mes commandes
              </Link>
              <Link to="/" className="asala-btn">
                Retour à la boutique
              </Link>
            </div>
          </div>
        ) : (
          /* Steps 1 to 4 with Side Summary */
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
            {/* Form Column (7 cols) */}
            <div className="min-w-0 lg:col-span-7 space-y-8">
              {/* Step 1: Coordonnées */}
              {step === 1 && (
                <div className="border border-black p-4 sm:p-6 lg:p-8 space-y-6 bg-white">
                  <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black pb-3 border-b border-black/15">
                    1. Vos Coordonnées
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Prénom *
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleInputChange}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Nom *
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleInputChange}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Adresse Email *
                    </label>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Numéro de téléphone tunisien *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      placeholder="+216 XX XXX XXX"
                      className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      required
                    />
                    <p className="text-[11px] text-stone mt-1.5">
                      Indispensable pour la prise de contact par le coursier lors de la livraison.
                    </p>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    className="w-full asala-btn-solid whitespace-normal py-4 text-center mt-6"
                  >
                    <span>Continuer vers l'adresse de livraison</span>
                    <ArrowRight size={14} strokeWidth={1.5} />
                  </button>
                </div>
              )}

              {/* Step 2: Adresse de livraison */}
              {step === 2 && (
                <div className="border border-black p-6 sm:p-8 space-y-6 bg-white">
                  <div className="flex justify-between items-center pb-3 border-b border-black/15">
                    <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black">
                      2. Adresse de Livraison
                    </h2>
                    <button
                      onClick={() => setStep(1)}
                      className="text-[11px] text-stone hover:text-black uppercase underline cursor-pointer"
                    >
                      Modifier coordonnées
                    </button>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Adresse (Rue, numéro, quartier) *
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Complément d'adresse (Bâtiment, étage, etc.)
                    </label>
                    <input
                      type="text"
                      name="apartment"
                      value={formData.apartment}
                      onChange={handleInputChange}
                      className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Ville *
                      </label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Gouvernorat *
                      </label>
                      <select
                        name="governorate"
                        value={formData.governorate}
                        onChange={handleInputChange}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none bg-white cursor-pointer"
                        required
                      >
                        <option value="">Sélectionner un gouvernorat</option>
                        {TUNISIAN_GOVERNORATES.map((g) => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Code Postal
                      </label>
                      <input
                        type="text"
                        name="postalCode"
                        value={formData.postalCode}
                        onChange={handleInputChange}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      />
                    </div>
                  </div>

                  {addressError && (
                    <p role="alert" className="border border-red-700 bg-red-50 px-4 py-3 text-left text-[12px] text-red-900">
                      {addressError}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <button
                      onClick={() => setStep(1)}
                      className="asala-btn w-full whitespace-normal py-3.5 text-center sm:w-auto"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleContinueToShipping}
                      className="min-w-0 flex-1 asala-btn-solid whitespace-normal py-3.5 text-center"
                    >
                      <span>Continuer vers le mode d'expédition</span>
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Mode de livraison */}
              {step === 3 && (
                <div className="border border-black p-6 sm:p-8 space-y-6 bg-white">
                  <div className="flex justify-between items-center pb-3 border-b border-black/15">
                    <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black">
                      3. Mode de Livraison
                    </h2>
                    <button
                      onClick={() => setStep(2)}
                      className="text-[11px] text-stone hover:text-black uppercase underline cursor-pointer"
                    >
                      Modifier adresse
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Standard */}
                    <label
                      onClick={() => setShippingMethod("standard")}
                      className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                        shippingMethod === "standard"
                          ? "border-black bg-[#faf9f6]"
                          : "border-black/20 hover:border-black/50"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={shippingMethod === "standard"}
                        onChange={() => setShippingMethod("standard")}
                        className="w-4 h-4 accent-black mt-0.5"
                      />
                      <div className="flex-1">
                        <div className="flex justify-between items-center">
                          <span className="text-[12px] font-semibold uppercase text-black">
                            Livraison Standard
                          </span>
                          <span className="text-[12px] font-semibold text-black">
                            {shippingFee === 0 ? "Offerte" : `${shippingFee} TND`}
                          </span>
                        </div>
                        <p className="text-[11px] text-stone mt-1">
                          {content.announcement}
                        </p>
                      </div>
                    </label>

                  </div>

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <button
                      onClick={() => setStep(2)}
                      className="asala-btn w-full whitespace-normal py-3.5 text-center sm:w-auto"
                    >
                      Retour
                    </button>
                    <button
                      onClick={() => setStep(4)}
                      className="min-w-0 flex-1 asala-btn-solid whitespace-normal py-3.5 text-center"
                    >
                      <span>Continuer vers le paiement</span>
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Paiement */}
              {step === 4 && (
                <div className="border border-black p-6 sm:p-8 space-y-6 bg-white">
                  <div className="flex justify-between items-center pb-3 border-b border-black/15">
                    <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black">
                      4. Mode de Paiement
                    </h2>
                    <button
                      onClick={() => setStep(3)}
                      className="text-[11px] text-stone hover:text-black uppercase underline cursor-pointer"
                    >
                      Modifier livraison
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* COD Option */}
                    <label
                      onClick={() => setPaymentMethod("cod")}
                      className={`flex items-start gap-4 p-5 border cursor-pointer transition-all ${
                        paymentMethod === "cod"
                          ? "border-black bg-[#faf9f6]"
                          : "border-black/20 hover:border-black/50"
                      }`}
                    >
                      <input
                        type="radio"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="w-4 h-4 accent-black mt-0.5"
                      />
                      <Banknote size={20} strokeWidth={1.5} className="text-black shrink-0" />
                      <div className="flex-1">
                        <span className="text-[12px] font-semibold uppercase text-black block">
                          Paiement en espèces à la livraison (COD)
                        </span>
                        <p className="text-[11px] text-stone mt-1">
                          Réglez votre commande en espèces directement auprès du coursier lors de la remise de votre colis.
                        </p>
                      </div>
                    </label>

                  </div>

                  {(orderSyncBackendError || orderSyncError) && (
                    <p role="alert" className="mt-4 border border-red-700 bg-red-50 px-4 py-3 text-left text-[12px] text-red-900">
                      {orderSyncBackendError || orderSyncError}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 pt-4 sm:flex-row">
                    <button
                      onClick={() => setStep(3)}
                      className="asala-btn w-full whitespace-normal py-4 text-center sm:w-auto"
                    >
                      Retour
                    </button>
                    <button
                      onClick={handleFinalizeOrder}
                      className="min-w-0 flex-1 asala-btn-solid whitespace-normal py-4 text-center"
                    >
                      <span>Confirmer la commande ({total} TND)</span>
                      <ArrowRight size={14} strokeWidth={1.5} />
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Side Order Summary (5 cols) */}
            <div className="min-w-0 lg:col-span-5">
              <div className="border border-black p-6 sm:p-8 bg-[#faf9f6]">
                <h3 className="text-[12px] uppercase tracking-[0.18em] font-semibold text-black mb-6 pb-3 border-b border-black/10">
                  Votre Panier ({cart.reduce((total, i) => total + i.quantity, 0)})
                </h3>

                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 mb-6">
                  {cart.map((item) => (
                    <div
                      key={`${item.product.id}-${item.size}`}
                      className="flex gap-3.5 items-center pb-4 border-b border-black/10"
                    >
                      <div className="w-14 h-[72px] bg-[#f4f2ee] shrink-0 overflow-hidden">
                        <ProductImage
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] uppercase font-medium text-black truncate">
                          {item.product.name}
                        </p>
                        <p className="text-[10px] text-stone uppercase mt-0.5">
                          Taille: {item.size || "Standard"} • Qté: {item.quantity}
                        </p>
                        {item.sizeMode === "custom" && (
                          <p className="text-[10px] text-stone">Sur mesure · délai +2 jours</p>
                        )}
                        <p className="text-[12px] font-semibold text-black mt-1">
                          {item.product.price * item.quantity} TND
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mb-6 border-b border-black/10 pb-5">
                  <p className="mb-2 text-[10px] uppercase tracking-[0.16em] text-stone">Code promotionnel</p>
                  {promoCode ? (
                    <div className="flex items-center justify-between gap-3 border border-black bg-white px-3 py-2.5 text-[12px]">
                      <span className="inline-flex items-center gap-2 font-medium"><Tag size={13} /> {promoCode} (-{Math.round(promoDiscount * 100)}%)</span>
                      <button type="button" onClick={removePromoCode} className="text-[10px] uppercase tracking-wider text-stone underline hover:text-black">Retirer</button>
                    </div>
                  ) : (
                    <form onSubmit={handleApplyPromo} className="flex gap-2">
                      <input type="text" value={promoInput} onChange={(event) => setPromoInput(event.target.value)} placeholder="Ex. PROMO10" className="min-w-0 flex-1 bg-white px-3 py-2.5 text-[12px] uppercase tracking-wider" />
                      <button type="submit" disabled={isApplyingPromo} className="asala-btn shrink-0 px-3 py-2.5 disabled:opacity-50">{isApplyingPromo ? "Vérification…" : "Appliquer"}</button>
                    </form>
                  )}
                  {promoError && <p className="mt-2 text-[11px] text-red-700">{promoError}</p>}
                </div>

                <div className="space-y-2.5 text-[12px] pb-5 border-b border-black/10 font-normal">
                  <div className="flex justify-between text-stone">
                    <span>Sous-total articles</span>
                    <span className="text-black font-medium">{subtotal} TND</span>
                  </div>
                  {discountAmount > 0 && (
                    <div className="flex justify-between text-black">
                      <span>Remise ({promoCode})</span>
                      <span>-{discountAmount} TND</span>
                    </div>
                  )}
                  <div className="flex justify-between text-stone">
                    <span>Livraison (Standard)</span>
                    <span className="text-black font-medium">
                      {shippingFee === 0 ? "Offerte" : `${shippingFee} TND`}
                    </span>
                  </div>
                  {customOrder && (
                    <div className="flex justify-between text-stone">
                      <span>Délai sur mesure</span>
                      <span className="text-black font-medium">+2 jours</span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-baseline pt-4">
                  <span className="text-[13px] uppercase tracking-[0.16em] font-semibold text-black">
                    Total
                  </span>
                  <div className="text-right">
                    <span className="text-[22px] font-semibold text-black">
                      {total} TND
                    </span>
                    <p className="text-[10px] text-stone mt-0.5">TVA comprise</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[11px] text-stone mt-6 pt-4 border-t border-black/10">
                  <Lock size={13} strokeWidth={1.5} className="text-black shrink-0" />
                  <span>Chiffrement SSL 256 bits de bout en bout</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutPage;
