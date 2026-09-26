import React from "react";
import { X } from "lucide-react";
import { useCart } from "@/context/CartContext";

const SizeGuideModal: React.FC = () => {
  const { isSizeGuideOpen, closeSizeGuide } = useCart();

  if (!isSizeGuideOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 select-none"
      onClick={closeSizeGuide}
      role="presentation"
    >
      <div
        className="relative bg-white border border-black max-w-xl w-full p-6 md:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={closeSizeGuide}
          className="absolute top-4 right-4 p-1 text-black hover:opacity-60 transition-opacity cursor-pointer"
          aria-label="Fermer le guide des tailles"
        >
          <X size={20} strokeWidth={1.5} />
        </button>

        <h3
          className="text-[24px] uppercase tracking-wide text-black mb-1 font-normal"
          style={{ fontFamily: '"Bodoni Moda", Georgia, serif' }}
        >
          GUIDE DES TAILLES KENZA
        </h3>
        <p className="text-[11px] text-stone uppercase tracking-[0.14em] mb-6">
          Mesures indicatives en centimètres pour caftans, takchitas & jebbas
        </p>

        <div className="overflow-x-auto mb-6">
          <table className="w-full text-left border-collapse text-[12px]">
            <thead>
              <tr className="border-b border-black text-black">
                <th className="py-2.5 font-medium uppercase tracking-wider">Taille</th>
                <th className="py-2.5 font-medium uppercase tracking-wider">Poitrine (cm)</th>
                <th className="py-2.5 font-medium uppercase tracking-wider">Taille (cm)</th>
                <th className="py-2.5 font-medium uppercase tracking-wider">Hanches (cm)</th>
                <th className="py-2.5 font-medium uppercase tracking-wider">Stature (cm)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10 text-stone">
              <tr>
                <td className="py-2.5 font-medium text-black">36 / S</td>
                <td className="py-2.5">82 - 86</td>
                <td className="py-2.5">62 - 66</td>
                <td className="py-2.5">88 - 92</td>
                <td className="py-2.5">160 - 170</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-black">38 / M</td>
                <td className="py-2.5">86 - 90</td>
                <td className="py-2.5">66 - 70</td>
                <td className="py-2.5">92 - 96</td>
                <td className="py-2.5">160 - 172</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-black">40 / L</td>
                <td className="py-2.5">90 - 95</td>
                <td className="py-2.5">70 - 75</td>
                <td className="py-2.5">96 - 102</td>
                <td className="py-2.5">162 - 175</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-black">42 / XL</td>
                <td className="py-2.5">95 - 102</td>
                <td className="py-2.5">75 - 82</td>
                <td className="py-2.5">102 - 108</td>
                <td className="py-2.5">162 - 175</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-black">44 / XXL</td>
                <td className="py-2.5">102 - 110</td>
                <td className="py-2.5">82 - 90</td>
                <td className="py-2.5">108 - 116</td>
                <td className="py-2.5">165 - 178</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-[#f9f8f6] p-4 border border-black/15 text-[11px] text-stone space-y-1.5 font-normal">
          <p className="font-semibold text-black uppercase tracking-wider">Confection Sur-Mesure :</p>
          <p className="leading-relaxed">
            Toutes nos créations de grand apparat et robes de cérémonie peuvent être ajustées ou confectionnées sur-mesure dans nos ateliers à Tunis. Contactez notre service conciergerie :
            <span className="font-medium text-black"> contact@kenza.tn</span> ou <span className="font-medium text-black">+216 71 000 000</span>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SizeGuideModal;
