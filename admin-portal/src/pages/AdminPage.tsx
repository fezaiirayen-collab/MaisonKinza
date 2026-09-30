import React, { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase";
import AdminDashboard from "./AdminDashboard";

const publicSitePath = import.meta.env.BASE_URL.replace(/vrai-admin\/$/, "");

const AdminPage: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [isSigningIn, setIsSigningIn] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsCheckingSession(false);
      return;
    }

    let mounted = true;
    const authClient = supabase;

    const verifyAdmin = async (nextSession: Session | null) => {
      if (!nextSession) {
        if (mounted) {
          setSession(null);
          setIsAdmin(false);
          setIsCheckingSession(false);
        }
        return;
      }

      const { data: adminResult, error } = await authClient.rpc("is_admin");
      if (!mounted) return;
      setSession(nextSession);
      setIsAdmin(!error && adminResult === true);
      setIsCheckingSession(false);
    };

    void authClient.auth.getSession().then(({ data }) => verifyAdmin(data.session));

    const { data } = authClient.auth.onAuthStateChange((_event, nextSession) => {
      // Évite d'appeler Supabase directement dans le callback d'authentification.
      window.setTimeout(() => { void verifyAdmin(nextSession); }, 0);
    });

    return () => {
      mounted = false;
      data.subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;

    setIsSigningIn(true);
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) setAuthError("Connexion impossible. Vérifiez vos identifiants.");
    setIsSigningIn(false);
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setSession(null);
  };

  if (!isSupabaseConfigured) return <ConfigurationState />;
  if (isCheckingSession) return <LoadingState label="Vérification de la session…" />;
  if (session && isAdmin === false) return <AccessDeniedState onSignOut={() => void handleSignOut()} />;
  if (session && isAdmin === true) return <AdminDashboard session={session} onSignOut={() => void handleSignOut()} />;

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#f4f2ee] px-4 py-10 sm:px-6 lg:px-8">
      <div className="w-full max-w-md border border-black bg-white p-6 sm:p-9">
        <div className="mb-8 flex items-center justify-between border-b border-black/10 pb-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.2em] text-stone">MAISON KENZA</p>
            <h1 className="mt-1 text-3xl" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
              Administration
            </h1>
          </div>
          <ShieldCheck size={28} strokeWidth={1.2} />
        </div>

        <p className="mb-6 text-[13px] leading-relaxed text-stone">
          Connectez-vous avec un compte administrateur Supabase pour gérer la boutique.
        </p>

        <form onSubmit={handleSignIn} className="space-y-4">
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Mot de passe</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full"
              autoComplete="current-password"
              required
            />
          </label>
          {authError && <ErrorMessage message={authError} />}
          <button type="submit" disabled={isSigningIn} className="asala-btn-solid w-full justify-center disabled:opacity-50">
            {isSigningIn ? "Connexion…" : "Ouvrir le tableau de bord"}
          </button>
        </form>

        <a href={publicSitePath} className="mt-6 block text-center text-[11px] uppercase tracking-[0.14em] text-stone hover:text-black">
          Retour à la boutique
        </a>
      </div>
    </div>
  );
};

const ErrorMessage: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex items-start gap-2 border border-red-700 bg-red-50 px-4 py-3 text-[12px] text-red-800">
    <AlertCircle size={16} strokeWidth={1.5} className="mt-0.5 shrink-0" />
    <span>{message}</span>
  </div>
);

const LoadingState: React.FC<{ label: string }> = ({ label }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#f4f2ee] text-[12px] uppercase tracking-[0.14em] text-stone">
    <RefreshCw size={16} strokeWidth={1.5} className="mr-2 animate-spin" /> {label}
  </div>
);

const ConfigurationState: React.FC = () => (
  <div className="flex min-h-screen items-center justify-center bg-[#f4f2ee] px-4 py-10">
    <div className="w-full max-w-xl border border-black bg-white p-6 sm:p-9">
      <h1 className="text-3xl" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Configuration Supabase</h1>
      <p className="mt-4 text-[13px] leading-relaxed text-stone">
        Ajoutez VITE_SUPABASE_URL et VITE_SUPABASE_PUBLISHABLE_KEY dans votre fichier .env puis redémarrez Vite.
      </p>
      <a href={publicSitePath} className="asala-btn mt-6 inline-flex">Retour à la boutique</a>
    </div>
  </div>
);

const AccessDeniedState: React.FC<{ onSignOut: () => void }> = ({ onSignOut }) => (
  <div className="flex min-h-screen items-center justify-center bg-[#f4f2ee] px-4 py-10">
    <div className="w-full max-w-md border border-black bg-white p-6 text-center sm:p-9">
      <h1 className="text-3xl" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>Accès refusé</h1>
      <p className="mt-4 text-[13px] leading-relaxed text-stone">
        Ce compte est connecté, mais il ne possède pas les droits administrateur.
      </p>
      <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <a href={publicSitePath} className="asala-btn inline-flex justify-center">Retour à la boutique</a>
        <button type="button" onClick={onSignOut} className="asala-btn-solid">Se déconnecter</button>
      </div>
    </div>
  </div>
);

export default AdminPage;
