// src/types/index.ts

export type Category =
  | "Caftan"
  | "Takchita"
  | "Jebba"
  | "Robe"
  | "Accessoire"
  | "Cérémonie"
  | string;

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number; // in TND
  originalPrice?: number;
  images: string[];
  colorImages?: Record<string, string[]>;
  description: string;
  details?: string[];
  fabric?: string;
  care?: string;
  sizes: string[];
  colors: string[];
  featured?: boolean;
  new?: boolean;
  stock: number;
  inStock?: boolean;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string;
  color?: string;
  sizeMode?: "standard" | "custom";
  customDetails?: string;
}

export interface ShippingAddress {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  apartment?: string;
  city: string;
  governorate: string;
  postalCode: string;
}

export interface Order {
  id: string;
  date: string;
  status: "En attente" | "En préparation" | "Expédié" | "Livré" | string;
  items: CartItem[];
  shippingAddress: ShippingAddress;
  shippingMethod: "standard" | "express" | string;
  shippingFee: number;
  paymentMethod: "cod" | "card" | string;
  subtotal: number;
  discount: number;
  total: number;
  deliveryDelayDays?: number;
}
