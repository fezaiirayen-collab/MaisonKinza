import React from "react";
import { Link } from "react-router-dom";
import { Heart, Eye } from "lucide-react";
import { Product } from "@/types";
import { useCart } from "@/context/CartContext";
import ProductImage from "@/components/ProductImage";

interface Props {
  product: Product;
}

const ProductCard: React.FC<Props> = ({ product }) => {
  const { toggleFavorite, isFavorite, openQuickView } = useCart();
  const fav = isFavorite(String(product.id));
  const isOnSale = Boolean(product.originalPrice && product.originalPrice > product.price);

  return (
    <article className="group relative min-w-0 flex flex-col">
      {/* Image container: strict aspect-ratio 3/4, no border, no shadow, no radius */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#f4f2ee] sm:aspect-[3/4]">
        <Link to={`/product/${product.id}`} className="block w-full h-full">
          <ProductImage
            src={product.images[0]}
            alt={product.name}
            loading="lazy"
            className="!h-full !w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1">
          {isOnSale && (
            <span className="bg-red-600 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white select-none">
              En promotion
            </span>
          )}
          {product.new && (
            <span className="bg-black px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.16em] text-white select-none">
              Nouveau
            </span>
          )}
        </div>

        {/* Favorite Heart Button: top right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleFavorite(product);
          }}
          aria-label={fav ? "Retirer des favoris" : "Ajouter aux favoris"}
          className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3 h-9 w-9 flex items-center justify-center bg-transparent text-black transition-all duration-200 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 cursor-pointer hover:text-stone drop-shadow-[0_1px_3px_rgba(255,255,255,0.75)]"
        >
          <Heart
            size={16}
            strokeWidth={1.5}
            className={fav ? "fill-current text-black group-hover:text-white" : ""}
          />
        </button>

        {/* Quick View Button: bottom right */}
        <button
          onClick={(e) => {
            e.preventDefault();
            openQuickView(product);
          }}
          className="absolute bottom-3 right-3 hidden lg:inline-flex items-center gap-2 bg-white text-black border border-black/20 px-3 py-1.5 text-[9px] uppercase tracking-[0.14em] font-medium opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black hover:text-white"
          aria-label={`Aperçu rapide de ${product.name}`}
        >
          <Eye size={13} strokeWidth={1.5} />
          <span>Aperçu</span>
        </button>
      </div>

      {/* Product Information */}
      <div className="pt-4 flex flex-col space-y-1">
        <Link
          to={`/product/${product.id}`}
          className="text-[12px] sm:text-[13px] uppercase tracking-[0.1em] text-black font-medium hover:text-stone transition-colors truncate"
        >
          {product.name}
        </Link>
        <p className="text-[11px] uppercase tracking-[0.12em] text-stone font-normal">
          {product.category}
        </p>
        <div className="flex items-center gap-2 pt-0.5">
          <span className="text-[13px] font-medium text-black">
            {product.price} TND
          </span>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-[11px] text-stone line-through font-normal">
              {product.originalPrice} TND
            </span>
          )}
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
