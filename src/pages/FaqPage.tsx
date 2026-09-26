import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

const FAQ_ITEMS = [
  {
    q: "Quels sont les délais de livraison en Tunisie ?",
    a: "Pour le Grand Tunis (Tunis, Ariana, Ben Arous, Manouba), la livraison s'effectue sous 24 à 48 heures ouvrées. Pour les autres gouvernorats (Sousse, Sfax, Nabeul, Bizerte, Monastir, etc.), le délai est de 48 à 72 heures ouvrées.",
  },
  {
    q: "La livraison est-elle offerte ?",
    a: "Non, la livraison est facturée 7 TND partout en Tunisie, quel que soit le montant de la commande.",
  },
  {
    q: "Comment fonctionne le paiement en espèces à la livraison ?",
    a: "Vous pouvez régler votre commande en espèces directement auprès du livreur lors de la remise en main propre de votre colis sécurisé. Aucun frais de gestion n'est facturé pour cette modalité.",
  },
  {
    q: "Puis-je échanger une pièce ou me faire rembourser ?",
    a: "Absolument. Vous bénéficiez d'un délai de 14 jours à compter de la réception de votre commande pour demander un échange de taille ou un remboursement. La pièce doit être intacte, non portée et munie de toutes ses étiquettes d'origine.",
  },
  {
    q: "Proposez-vous la confection sur-mesure pour les mariées et cérémonies ?",
    a: "Oui, notre atelier de Tunis réalise des créations sur-mesure pour mariages, fiançailles et galas. Contactez-nous par téléphone au +216 71 000 000 ou par email à contact@kenza.tn pour convenir d'un rendez-vous privé.",
  },
  {
    q: "Comment entretenir mon caftan ou ma takchita brodée au fil d'or ?",
    a: "Toutes nos pièces d'exception ornées de broderies artisanales au fil d'or et de soies fines nécessitent un nettoyage à sec spécialisé auprès d'un teinturier textile de prestige.",
  },
];

const FaqPage: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="bg-white min-h-screen">
      {/* Editorial Header */}
      <section className="border-b border-black/10 bg-[#faf9f6] py-12 lg:py-16 text-center select-none">
        <div className="asala-container">
          <span className="text-[11px] uppercase tracking-[0.2em] text-stone font-medium block mb-2">
            Questions Fréquentes
          </span>
          <h1
            className="text-[32px] lg:text-[42px] font-normal uppercase tracking-tight text-black mb-2"
            style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
          >
            AIDE & FOIRE AUX QUESTIONS
          </h1>
          <p className="text-[13px] text-stone font-normal max-w-lg mx-auto">
            Retrouvez les réponses essentielles concernant vos commandes, les livraisons et les retours.
          </p>
        </div>
      </section>

      <div className="asala-container max-w-[900px] py-12 lg:py-18">
        <div className="divide-y divide-black/10 border-t border-b border-black/10">
          {FAQ_ITEMS.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div key={idx} className="py-5">
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left text-[13px] uppercase tracking-[0.1em] font-medium text-black hover:text-stone transition-colors cursor-pointer"
                >
                  <span className="pr-4">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp size={16} strokeWidth={1.5} className="shrink-0" />
                  ) : (
                    <ChevronDown size={16} strokeWidth={1.5} className="shrink-0" />
                  )}
                </button>
                {isOpen && (
                  <p className="pt-3 text-[13px] text-stone font-normal leading-relaxed">
                    {item.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FaqPage;
