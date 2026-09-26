import React, { useEffect, useState } from "react";
import { publicAsset } from "@/lib/publicAsset";

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const ProductImage: React.FC<Props> = ({ fallbackSrc = "/hero-model.jpg", src, alt = "Création KENZA", onError, ...props }) => {
  const [imageSrc, setImageSrc] = useState(src);

  // Keep the displayed image in sync when a gallery thumbnail is selected.
  useEffect(() => {
    setImageSrc(src);
  }, [src]);

  return (
    <img
      {...props}
      src={imageSrc ? publicAsset(imageSrc) : undefined}
      alt={alt}
      onError={(event) => {
        if (imageSrc !== fallbackSrc) setImageSrc(fallbackSrc);
        onError?.(event);
      }}
    />
  );
};

export default ProductImage;
