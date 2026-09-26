import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import type { Session } from "@supabase/supabase-js";
import { User, Package, MapPin, Heart, ArrowRight, CheckCircle2, LogOut, RefreshCw } from "lucide-react";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";
import { supabase } from "@/lib/supabase";

type AccountOrderRecord = {
  id: string;
  order_number: string;
  customer_name: string;
  email: string;
  phone: string | null;
  address: Record<string, string> | null;
  status: string;
  total: number | string;
  created_at: string;
};

type AccountOrderSummary = {
  id: string;
  date: string;
  status: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    governorate: string;
  };
  total: number;
};

const orderStatusLabels: Record<string, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  preparing: "En préparation",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
};

const hasStrongPassword = (value: string) =>
  value.length >= 12 && /[a-z]/.test(value) && /[A-Z]/.test(value) && /\d/.test(value);

const formatOrderDate = (value: string) => new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "long",
  year: "numeric",
}).format(new Date(value));

const getPublicUrl = (path: string) => {
  const base = import.meta.env.BASE_URL.endsWith("/") ? import.meta.env.BASE_URL : `${import.meta.env.BASE_URL}/`;
  return `${window.location.origin}${base}${path.replace(/^\/+/, "")}`;
};

const AccountPage: React.FC = () => {
  const { favorites } = useCart();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [activeTab, setActiveTab] = useState<"orders" | "profile" | "addresses" | "favorites">("orders");
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState("");
  const [isCheckingSession, setIsCheckingSession] = useState(Boolean(supabase));
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authPasswordConfirmation, setAuthPasswordConfirmation] = useState("");
  const [authFirstName, setAuthFirstName] = useState("");
  const [authLastName, setAuthLastName] = useState("");
  const [authPhone, setAuthPhone] = useState("");
  const [authSecondaryPhone, setAuthSecondaryPhone] = useState("");
  const [authGender, setAuthGender] = useState("");
  const [authBirthDate, setAuthBirthDate] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [isSendingReset, setIsSendingReset] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authNotice, setAuthNotice] = useState("");
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [ordersError, setOrdersError] = useState("");
  const [accountOrders, setAccountOrders] = useState<AccountOrderRecord[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);

  const [profile, setProfile] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    phoneSecondary: "",
    gender: "",
    birthDate: "",
    address: "",
    apartment: "",
    city: "",
    governorate: "",
    postalCode: "",
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  const persistCustomer = useCallback(async (currentSession: Session, values: typeof profile) => {
    if (!supabase || !currentSession.user.email) return false;

    const { error } = await supabase.rpc("save_customer_profile", {
      p_first_name: values.firstName,
      p_last_name: values.lastName,
      p_phone: values.phone || null,
      p_phone_secondary: values.phoneSecondary || null,
      p_gender: values.gender || null,
      p_birth_date: values.birthDate || null,
      p_address: {
        street: values.address,
        apartment: values.apartment,
        city: values.city,
        governorate: values.governorate,
        postalCode: values.postalCode,
      },
    });

    if (error) {
      setProfileError("Impossible d'enregistrer votre profil pour le moment.");
      setAuthError("Impossible d'enregistrer votre profil pour le moment.");
      return false;
    }
    setProfileError("");
    return true;
  }, []);

  const loadOrders = useCallback(async (currentSession: Session) => {
    if (!supabase || !currentSession.user.email) return;

    setIsLoadingOrders(true);
    setOrdersError("");
    const { data, error } = await supabase
      .from("orders")
      .select("id,order_number,customer_name,email,phone,address,status,total,created_at")
      .eq("user_id", currentSession.user.id)
      .order("created_at", { ascending: false });

    if (error) setOrdersError("Impossible de charger vos commandes pour le moment.");
    else setAccountOrders((data || []) as AccountOrderRecord[]);
    setIsLoadingOrders(false);
  }, []);

  const loadCustomer = useCallback(async (currentSession: Session) => {
    if (!supabase || !currentSession.user.email) return;

    const { data, error } = await supabase
      .from("customers")
      .select("first_name,last_name,email,phone,phone_secondary,gender,birth_date,address")
      .eq("user_id", currentSession.user.id)
      .maybeSingle();

    if (error) {
      setAuthError("Impossible de charger votre profil pour le moment.");
      return;
    }

    const metadata = currentSession.user.user_metadata || {};
    const savedAddress = (data?.address && typeof data.address === "object" ? data.address : {}) as Record<string, unknown>;
    const values = {
      firstName: data?.first_name || metadata.first_name || "",
      lastName: data?.last_name || metadata.last_name || "",
      email: data?.email || currentSession.user.email,
      phone: data?.phone || metadata.phone || "",
      phoneSecondary: data?.phone_secondary || metadata.phone_secondary || "",
      gender: data?.gender || metadata.gender || "",
      birthDate: data?.birth_date || metadata.birth_date || "",
      address: typeof savedAddress.street === "string" ? savedAddress.street : "",
      apartment: typeof savedAddress.apartment === "string" ? savedAddress.apartment : "",
      city: typeof savedAddress.city === "string" ? savedAddress.city : "",
      governorate: typeof savedAddress.governorate === "string" ? savedAddress.governorate : "",
      postalCode: typeof savedAddress.postalCode === "string" ? savedAddress.postalCode : "",
    };
    setProfile(values);

    if (!data) await persistCustomer(currentSession, values);
    await loadOrders(currentSession);
  }, [loadOrders, persistCustomer]);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    const authClient = supabase;
    let mounted = true;
    const loadSession = async () => {
      const { data, error } = await authClient.auth.getSession();
      if (!mounted) return;
      if (error) setAuthError("Impossible de vérifier votre session.");
      if (data.session) {
        setSession(data.session);
        setAuthEmail(data.session.user.email || "");
        await loadCustomer(data.session);
      }
      if (mounted) setIsCheckingSession(false);
    };

    void loadSession();
    return () => { mounted = false; };
  }, [loadCustomer]);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!session) return;
    setProfileError("");
    void persistCustomer(session, profile).then((saved) => {
      if (!saved) return;
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    });
  };

  const handleAuthSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) {
      setAuthError("Supabase n'est pas configuré.");
      return;
    }
    if (authMode === "signup" && !hasStrongPassword(authPassword)) {
      setAuthError("Le mot de passe doit contenir 12 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }
    if (authMode === "signup" && authPassword !== authPasswordConfirmation) {
      setAuthError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSubmittingAuth(true);
    setAuthError("");
    setAuthNotice("");

    if (authMode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email: authEmail.trim(),
        password: authPassword,
        options: { data: { first_name: authFirstName.trim(), last_name: authLastName.trim(), phone: authPhone.trim(), phone_secondary: authSecondaryPhone.trim(), gender: authGender, birth_date: authBirthDate } },
      });
      if (error) setAuthError("Inscription ou connexion impossible. Vérifiez vos informations.");
      else if (data.session) {
        setSession(data.session);
        await persistCustomer(data.session, {
          firstName: authFirstName.trim(),
          lastName: authLastName.trim(),
          email: authEmail.trim(),
          phone: authPhone.trim(),
          phoneSecondary: authSecondaryPhone.trim(),
          gender: authGender,
          birthDate: authBirthDate,
          address: "",
          apartment: "",
          city: "",
          governorate: "",
          postalCode: "",
        });
      } else {
        setAuthNotice("Votre compte est créé. Vérifiez votre email pour confirmer votre inscription, puis connectez-vous.");
        setAuthMode("login");
      }
    } else {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: authEmail.trim(),
        password: authPassword,
      });
      if (error) setAuthError("Inscription ou connexion impossible. Vérifiez vos informations.");
      else if (data.session) {
        setSession(data.session);
        await loadCustomer(data.session);
      }
    }
    setIsSubmittingAuth(false);
  };

  const handleForgotPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase || !authEmail.trim()) {
      setAuthError("Saisissez votre adresse email pour recevoir le lien de réinitialisation.");
      return;
    }
    setIsSendingReset(true);
    setAuthError("");
    const { error } = await supabase.auth.resetPasswordForEmail(authEmail.trim(), { redirectTo: getPublicUrl("reset-password") });
    setIsSendingReset(false);
    if (error) setAuthError("Impossible d'envoyer le lien de réinitialisation.");
    else { setAuthNotice("Un lien de réinitialisation a été envoyé à votre adresse email."); setShowForgotPassword(false); }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    setSignOutError("");

    if (supabase) {
      const { error } = await supabase.auth.signOut({ scope: "local" });
      if (error) {
        setSignOutError("Impossible de fermer la session. Réessayez.");
        setIsSigningOut(false);
        return;
      }
    }

    navigate("/");
  };

  if (isCheckingSession) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-[11px] uppercase tracking-[0.14em] text-stone">
        Vérification de votre session…
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-white">
        <section className="border-b border-black/10 bg-[#faf9f6] py-10 text-center lg:py-14">
          <div className="asala-container">
            <span className="text-[11px] uppercase tracking-[0.2em] text-stone">Espace Privilège</span>
            <h1 className="mt-2 text-[34px] uppercase tracking-tight" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
              MON COMPTE
            </h1>
            <p className="mt-2 text-[12px] text-stone">Connectez-vous ou créez votre compte KENZA.</p>
          </div>
        </section>

        <div className="asala-container py-10 lg:py-16">
          <div className="mx-auto max-w-md border border-black bg-white p-6 sm:p-9">
            <div className="mb-6 grid grid-cols-2 border-b border-black/10">
              <button
                type="button"
                onClick={() => { setAuthMode("login"); setAuthError(""); setAuthNotice(""); }}
                className={`border-b-2 pb-3 text-[11px] uppercase tracking-[0.14em] ${authMode === "login" ? "border-black font-semibold" : "border-transparent text-stone"}`}
              >
                Se connecter
              </button>
              <button
                type="button"
                onClick={() => { setAuthMode("signup"); setAuthError(""); setAuthNotice(""); }}
                className={`border-b-2 pb-3 text-[11px] uppercase tracking-[0.14em] ${authMode === "signup" ? "border-black font-semibold" : "border-transparent text-stone"}`}
              >
                Créer un compte
              </button>
            </div>

            {authNotice && <div className="mb-5 border border-black bg-[#faf9f6] p-3 text-[12px] leading-relaxed">{authNotice}</div>}
            {authError && <div className="mb-5 border border-red-700 bg-red-50 p-3 text-[12px] leading-relaxed text-red-800">{authError}</div>}

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              {authMode === "signup" && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <label>
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Prénom</span>
                    <input value={authFirstName} onChange={(event) => setAuthFirstName(event.target.value)} className="w-full" required />
                  </label>
                  <label>
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Nom</span>
                    <input value={authLastName} onChange={(event) => setAuthLastName(event.target.value)} className="w-full" required />
                  </label>
                </div>
              )}
              {authMode === "signup" && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Téléphone</span>
                    <input type="tel" value={authPhone} onChange={(event) => setAuthPhone(event.target.value)} className="w-full" autoComplete="tel" />
                  </label>
                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Téléphone supplémentaire</span>
                    <input type="tel" value={authSecondaryPhone} onChange={(event) => setAuthSecondaryPhone(event.target.value)} className="w-full" autoComplete="tel" />
                  </label>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Sexe</span>
                      <select value={authGender} onChange={(event) => setAuthGender(event.target.value)} className="w-full bg-white"><option value="">Sélectionner</option><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Date de naissance *</span>
                      <input type="date" value={authBirthDate} onChange={(event) => setAuthBirthDate(event.target.value)} className="w-full" required />
                    </label>
                  </div>
                </div>
              )}
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Adresse email</span>
                <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="w-full" autoComplete="email" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Mot de passe</span>
                <input type="password" value={authPassword} onChange={(event) => setAuthPassword(event.target.value)} className="w-full" autoComplete={authMode === "login" ? "current-password" : "new-password"} minLength={6} required />
              </label>
              {authMode === "signup" && <label className="block"><span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Confirmer le mot de passe</span><input type="password" value={authPasswordConfirmation} onChange={(event) => setAuthPasswordConfirmation(event.target.value)} className="w-full" autoComplete="new-password" minLength={6} required /></label>}
              {authMode === "login" && <button type="button" onClick={() => { setShowForgotPassword((current) => !current); setAuthError(""); }} className="text-[11px] text-stone underline hover:text-black">Mot de passe oublié ?</button>}
              <button type="submit" disabled={isSubmittingAuth} className="asala-btn-solid w-full justify-center disabled:opacity-50">
                {isSubmittingAuth ? "Veuillez patienter…" : authMode === "login" ? "Se connecter" : "Créer mon compte"}
              </button>
            </form>

            {authMode === "login" && showForgotPassword && <form onSubmit={handleForgotPassword} className="mt-5 space-y-3 border-t border-black/10 pt-5">
              <p className="text-[12px] text-stone">Entrez votre email pour recevoir un lien de réinitialisation.</p>
              <input type="email" value={authEmail} onChange={(event) => setAuthEmail(event.target.value)} className="w-full" placeholder="Adresse email" required />
              <button type="submit" disabled={isSendingReset} className="asala-btn w-full justify-center">{isSendingReset ? "Envoi en cours…" : "Envoyer le lien"}</button>
            </form>}
          </div>
        </div>
      </div>
    );
  }

  const displayOrders: AccountOrderSummary[] = accountOrders.map((order) => {
    const address = order.address || {};
    const customerParts = order.customer_name.trim().split(/\s+/);
    return {
      id: order.order_number,
      date: formatOrderDate(order.created_at),
      status: orderStatusLabels[order.status] || order.status,
      shippingAddress: {
        firstName: address.firstName || customerParts[0] || "",
        lastName: address.lastName || customerParts.slice(1).join(" "),
        address: address.address || address.street || "Adresse non renseignée",
        city: address.city || "",
        governorate: address.governorate || "",
      },
      total: Number(order.total || 0),
    };
  });

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-black/10 bg-[#faf9f6] py-10 lg:py-14 text-center">
        <div className="asala-container">
          <span className="text-[11px] uppercase tracking-[0.2em] text-stone font-medium block mb-1">
            Espace Privilège
          </span>
          <h1
            className="text-[34px] sm:text-[42px] font-normal uppercase tracking-tight text-black"
            style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
          >
            MON COMPTE
          </h1>
          <p className="text-[12px] text-stone mt-1">
            Bienvenue, {profile.firstName} {profile.lastName}
          </p>
        </div>
      </section>

      <div className="asala-container py-10 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Navigation Tabs (4 cols) */}
          <aside className="md:col-span-4 border border-black p-4 space-y-1 bg-white">
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left px-4 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "orders" ? "bg-black text-white" : "hover:bg-black/5 text-black"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Package size={15} strokeWidth={1.5} /> Mes Commandes ({displayOrders.length})
              </span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left px-4 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "profile" ? "bg-black text-white" : "hover:bg-black/5 text-black"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <User size={15} strokeWidth={1.5} /> Mon Profil
              </span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setActiveTab("addresses")}
              className={`w-full text-left px-4 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "addresses" ? "bg-black text-white" : "hover:bg-black/5 text-black"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <MapPin size={15} strokeWidth={1.5} /> Carnet d'Adresses
              </span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>

            <button
              onClick={() => setActiveTab("favorites")}
              className={`w-full text-left px-4 py-3.5 text-[11px] uppercase tracking-[0.14em] font-medium flex items-center justify-between transition-colors cursor-pointer ${
                activeTab === "favorites" ? "bg-black text-white" : "hover:bg-black/5 text-black"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <Heart size={15} strokeWidth={1.5} /> Coups de CÅ“ur ({favorites.length})
              </span>
              <ArrowRight size={13} strokeWidth={1.5} />
            </button>

            {signOutError && (
              <p className="border border-red-700 bg-red-50 px-4 py-3 text-[11px] leading-relaxed text-red-800">
                {signOutError}
              </p>
            )}

            <button
              onClick={() => void handleSignOut()}
              disabled={isSigningOut}
              className="mt-4 flex w-full items-center gap-2 border-t border-black/10 px-4 py-4 text-left text-[11px] uppercase tracking-[0.14em] text-stone transition-colors hover:text-black disabled:opacity-50"
            >
              <LogOut size={15} strokeWidth={1.5} />
              {isSigningOut ? "Déconnexion…" : "Déconnexion"}
            </button>
          </aside>

          {/* Right Content Area (8 cols) */}
          <div className="md:col-span-8">
            {/* Orders Tab */}
            {activeTab === "orders" && (
              <div className="space-y-6">
                <div className="flex items-center justify-between gap-4 border-b border-black/10 pb-3">
                  <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black">
                    Historique de vos commandes
                  </h2>
                  <div className="flex items-center gap-4">
                    <button onClick={() => session && void loadOrders(session)} disabled={isLoadingOrders} className="inline-flex items-center gap-2 text-[10px] uppercase tracking-wider text-stone hover:text-black disabled:opacity-50">
                      <RefreshCw size={13} className={isLoadingOrders ? "animate-spin" : ""} /> Actualiser
                    </button>
                  </div>
                </div>
                {ordersError && <p className="border border-red-700 bg-red-50 p-3 text-[12px] text-red-800">{ordersError}</p>}

                <div className="space-y-6">
                  {displayOrders.length === 0 ? (
                    <div className="border border-black/10 bg-[#faf9f6] p-10 text-center text-[13px] text-stone">
                      Vous n'avez pas encore passé de commande.
                    </div>
                  ) : displayOrders.map((order) => (
                    <div key={order.id} className="border border-black p-6 bg-white space-y-4">
                      <div className="flex flex-wrap justify-between items-center gap-2 pb-4 border-b border-black/10 text-[12px]">
                        <div>
                          <span className="text-stone">Réf : </span>
                          <strong className="text-black font-semibold">{order.id}</strong>
                          <span className="text-stone ml-3">• {order.date}</span>
                        </div>
                        <span className="bg-black text-white px-3 py-1 text-[10px] uppercase tracking-widest font-medium">
                          {order.status}
                        </span>
                      </div>

                      <div className="text-[12px] text-stone space-y-1">
                        <p>
                          <strong className="text-black font-medium">Destinataire :</strong>{" "}
                          {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                        </p>
                        <p>
                          <strong className="text-black font-medium">Adresse :</strong>{" "}
                          {order.shippingAddress.address}, {order.shippingAddress.city} (
                          {order.shippingAddress.governorate})
                        </p>
                      </div>

                      <div className="flex justify-between items-center pt-3 border-t border-black/10">
                        <span className="text-[11px] uppercase tracking-wider text-stone font-medium">
                          Total réglé
                        </span>
                        <span className="text-[16px] font-semibold text-black">
                          {order.total} TND
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Profile Tab */}
            {activeTab === "profile" && (
              <div className="border border-black p-6 sm:p-8 bg-white">
                <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black pb-3 border-b border-black/10 mb-6">
                  Modifier mes informations
                </h2>

                {savedSuccess && (
                  <div className="flex items-center gap-2 p-3 mb-6 bg-[#faf9f6] border border-black text-[12px] text-black">
                    <CheckCircle2 size={16} />
                    <span>Vos informations ont ete mises a jour avec succes.</span>
                  </div>
                )}
                {profileError && <div className="mb-6 border border-red-700 bg-red-50 p-3 text-[12px] text-red-800">{profileError}</div>}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Prénom
                      </label>
                      <input
                        type="text"
                        value={profile.firstName}
                        onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                        Nom
                      </label>
                      <input
                        type="text"
                        value={profile.lastName}
                        onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                        className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Adresse Email
                    </label>
                    <input
                      type="email"
                      value={profile.email}
                      readOnly
                      className="w-full border border-black/30 bg-[#faf9f6] px-4 py-3 text-[13px] outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] uppercase tracking-[0.14em] text-stone font-medium mb-1.5 block">
                      Numéro de Téléphone
                    </label>
                    <input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="w-full border border-black px-4 py-3 text-[13px] outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Téléphone supplémentaire</span>
                      <input type="tel" value={profile.phoneSecondary} onChange={(event) => setProfile({ ...profile, phoneSecondary: event.target.value })} className="w-full border border-black px-4 py-3 text-[13px] outline-none" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Sexe</span>
                      <select value={profile.gender} onChange={(event) => setProfile({ ...profile, gender: event.target.value })} className="w-full bg-white border border-black px-4 py-3 text-[13px] outline-none"><option value="">Sélectionner</option><option value="Homme">Homme</option><option value="Femme">Femme</option></select>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Date de naissance</span>
                    <input type="date" value={profile.birthDate} onChange={(event) => setProfile({ ...profile, birthDate: event.target.value })} className="w-full border border-black px-4 py-3 text-[13px] outline-none" />
                  </label>

                  <button
                    type="submit"
                    className="asala-btn-solid mt-4 py-3.5"
                  >
                    Enregistrer les modifications
                  </button>
                </form>
              </div>
            )}

            {/* Addresses Tab */}
            {activeTab === "addresses" && (
              <div className="border border-black p-6 sm:p-8 bg-white space-y-6">
                <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black pb-3 border-b border-black/10">
                  Adresse Principale de Livraison
                </h2>

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  {profileError && <div className="border border-red-700 bg-red-50 p-3 text-[12px] text-red-800">{profileError}</div>}
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <label className="sm:col-span-2">
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Adresse</span>
                      <input value={profile.address} onChange={(event) => setProfile({ ...profile, address: event.target.value })} className="w-full" placeholder="Rue et numéro" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Appartement</span>
                      <input value={profile.apartment} onChange={(event) => setProfile({ ...profile, apartment: event.target.value })} className="w-full" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Ville</span>
                      <input value={profile.city} onChange={(event) => setProfile({ ...profile, city: event.target.value })} className="w-full" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Gouvernorat</span>
                      <input value={profile.governorate} onChange={(event) => setProfile({ ...profile, governorate: event.target.value })} className="w-full" />
                    </label>
                    <label>
                      <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Code postal</span>
                      <input value={profile.postalCode} onChange={(event) => setProfile({ ...profile, postalCode: event.target.value })} className="w-full" />
                    </label>
                  </div>
                  <button type="submit" className="asala-btn-solid mt-2 py-3.5">
                    Enregistrer l'adresse
                  </button>
                </form>
              </div>
            )}

            {/* Favorites Tab */}
            {activeTab === "favorites" && (
              <div className="space-y-6">
                <h2 className="text-[12px] uppercase tracking-[0.16em] font-semibold text-black pb-3 border-b border-black/10">
                  Vos pièces favorites ({favorites.length})
                </h2>

                {favorites.length === 0 ? (
                  <p className="text-[13px] text-stone py-8 text-center">
                    Aucune pièce enregistrée pour le moment.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                    {favorites.map((p) => (
                      <Link
                        key={p.id}
                        to={`/product/${p.id}`}
                        className="group flex flex-col"
                      >
                        <div className="aspect-[3/4] bg-[#f4f2ee] overflow-hidden mb-2">
                          <ProductImage
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <span className="text-[12px] uppercase font-medium text-black truncate">
                          {p.name}
                        </span>
                        <span className="text-[12px] text-stone mt-0.5">
                          {p.price} TND
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AccountPage;

