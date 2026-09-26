import React from "react";
import { Link, useLocation } from "react-router-dom";

interface Props {
  className?: string;
  size?: "sm" | "md" | "lg";
  inverted?: boolean;
}

const Logo: React.FC<Props> = ({ className = "", size = "md", inverted = false }) => {
  const arabicFontSize = size === "sm" ? "22px" : size === "lg" ? "36px" : "28px";
  const latinFontSize = size === "sm" ? "8px" : size === "lg" ? "12px" : "10px";
  const colorClass = inverted ? "text-white" : "text-black";
  const isHomePage = useLocation().pathname === "/";

  return (
    <Link
      to="/"
      className={`inline-flex flex-col items-center justify-center leading-none group transition-opacity hover:opacity-75 select-none shrink-0 ${className}`}
      aria-label="KENZA Maison de Couture - Accueil"
    >
      <span
        className={`font-didone font-normal tracking-wide ${colorClass}`}
        style={{
          fontFamily: '"Bodoni Moda", "Amiri", Georgia, serif',
          fontSize: arabicFontSize,
          lineHeight: 1,
          display: isHomePage ? "none" : undefined,
        }}
      >
        كنزة
      </span>
      <span
        className={`font-didone font-normal tracking-wide ${colorClass}`}
        style={{
          fontFamily: '"Bodoni Moda", Georgia, serif',
          fontSize: arabicFontSize,
          lineHeight: 1,
          display: isHomePage ? undefined : "none",
        }}
      >
        KENZA
      </span>
      <span
        className={`font-sans font-medium uppercase mt-1 ${colorClass}`}
        style={{
          fontSize: latinFontSize,
          letterSpacing: "0.28em",
          marginRight: "-0.28em", // compensate trailing letter-spacing to center perfectly
          lineHeight: 1,
        }}
      >
        MAISON KENZA
      </span>
    </Link>
  );
};

export default Logo;
