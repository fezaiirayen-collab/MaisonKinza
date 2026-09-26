import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase";

const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  const [hasRecoverySession, setHasRecoverySession] = useState(false);
  const [isChecking, setIsChecking] = useState(Boolean(supabase));
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setIsChecking(false);
      return;
    }

    const authClient = supabase;
    let mounted = true;
    const checkRecoverySession = async () => {
      const { data } = await authClient.auth.getSession();
      if (!mounted) return;
      setHasRecoverySession(Boolean(data.session));
      setIsChecking(false);
    };

    void checkRecoverySession();
    const { data: listener } = authClient.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      if (event === "PASSWORD_RECOVERY" || session) setHasRecoverySession(Boolean(session));
      setIsChecking(false);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!supabase) return;
    if (password.length < 12 || !/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
      setError("Le mot de passe doit contenir 12 caractères, une majuscule, une minuscule et un chiffre.");
      return;
    }
    if (password !== confirmation) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    setIsSaving(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setIsSaving(false);
    if (updateError) setError("Impossible de modifier le mot de passe. Le lien est peut-être expiré.");
    else {
      setNotice("Votre mot de passe a été modifié avec succès.");
      setPassword("");
      setConfirmation("");
      window.setTimeout(() => navigate("/compte"), 1800);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <section className="border-b border-black/10 bg-[#faf9f6] py-10 text-center lg:py-14">
        <div className="asala-container">
          <span className="text-[11px] uppercase tracking-[0.2em] text-stone">Espace Privilège</span>
          <h1 className="mt-2 text-[34px] uppercase tracking-tight" style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}>
            NOUVEAU MOT DE PASSE
          </h1>
          <p className="mt-2 text-[12px] text-stone">Choisissez un nouveau mot de passe pour votre compte KENZA.</p>
        </div>
      </section>

      <div className="asala-container py-10 lg:py-16">
        <div className="mx-auto max-w-md border border-black bg-white p-6 sm:p-9">
          {isChecking ? (
            <p className="text-center text-[11px] uppercase tracking-[0.14em] text-stone">Vérification du lien…</p>
          ) : !hasRecoverySession && !notice ? (
            <div className="space-y-4 text-center">
              <p className="text-[13px] leading-relaxed text-stone">Ce lien est invalide ou a expiré. Demandez un nouveau lien depuis la page de connexion.</p>
              <Link to="/compte" className="asala-btn inline-flex">Retour à la connexion</Link>
            </div>
          ) : notice ? (
            <div className="space-y-3 border border-black bg-[#faf9f6] p-5 text-center">
              <CheckCircle2 size={32} className="mx-auto" />
              <p className="text-[13px]">{notice}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="border border-red-700 bg-red-50 p-3 text-[12px] leading-relaxed text-red-800">{error}</div>}
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Nouveau mot de passe</span>
                <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full" minLength={6} autoComplete="new-password" required />
              </label>
              <label className="block">
                <span className="mb-1.5 block text-[11px] uppercase tracking-[0.14em] text-stone">Confirmer le nouveau mot de passe</span>
                <input type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="w-full" minLength={6} autoComplete="new-password" required />
              </label>
              <button type="submit" disabled={isSaving} className="asala-btn-solid w-full justify-center disabled:opacity-50">
                {isSaving ? "Enregistrement…" : "Valider le nouveau mot de passe"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
