/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ProductChoice {
  name: string;
  priceInfluence: number; // Positive/negative change to base price
}

export interface ProductOption {
  id: string;
  name: string;
  choices: ProductChoice[];
}

export interface CollarOption {
  name: string;
  desc: string;
  tag: string;
  iconKey: string; // Key name for the Lucide icon
  priceInfluence: number;
  enabled: boolean;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  collection?: string; // e.g. Target, Line, Otantik, Dream, etc.
  image: string;
  images?: string[]; // Multiple image URLs for the sliding slider/gallery
  basePrice: number; // in TL (Turkish Lira)
  kdvRate: number; // e.g. 20, 10, 1 (percentage)
  otvRate?: number; // Optional luxury tax (percentage)
  description: string;
  rating?: number;
  stock?: number;
  specs: { [key: string]: string };
  options: ProductOption[];
  popularity?: number; // 1-100 rating of sale frequency
  branch?: string; // e.g. Futbol, Basketbol, Koşu, Antrenman, vb.
  collarOptions?: CollarOption[];
}

export interface SelectedOptionState {
  optionId: string;
  optionName: string;
  choiceName: string;
  priceInfluence: number;
}

export interface CalculatorItem {
  id: string; // Unique instance ID in basket
  productId: string;
  productName: string;
  brand: string;
  category: string;
  quantity: number;
  basePrice: number;
  kdvRate: number;
  otvRate?: number;
  selectedSelections: SelectedOptionState[];
  customDiscount: number; // individual discount percentage (0-100)
  finalSingleUnitPrice: number; // single item price calculated with additions
  customPlayerName?: string; // Baskı Matrisi: Sırt İsmi
  customPlayerNumber?: string; // Baskı Matrisi: Sırt Numarası
  customSleeveLogo?: string; // Baskı Matrisi: Kol veya Göğüs Sponsoru
  customCrestStyle?: string; // Baskı Matrisi: Kulüp Arma Tipi
}

export interface CalculatorState {
  items: CalculatorItem[];
  globalDiscount: number; // percentage (0-100)
  shippingFee: number; // flat TL amount
  installmentMonths: number; // 1 (none), 3, 6, 9, 12
  installmentInterestRate: number; // e.g. 1.5% monthly flat rate, or calculated rate
  customTaxOverride?: number; // Optional user custom tax rate percentage
}

export interface BrandInfo {
  name: string;
  logo: string;
  origin: string;
  description: string;
}

export interface CategoryInfo {
  id: string;
  name: string;
  iconName: string; // Lucide icon identifier
  description: string;
  parentId?: string;
}
