import type { Product } from "@/types";

export const getProductImageForColor = (product: Product, color?: string) => {
  const selectedColor = color?.trim().toLowerCase();
  const colorEntry = selectedColor
    ? Object.entries(product.colorImages || {}).find(([name, images]) => name.trim().toLowerCase() === selectedColor && images.length > 0)
    : undefined;

  return colorEntry?.[1][0] || product.images[0] || "/hero-model.jpg";
};
