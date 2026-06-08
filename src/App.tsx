/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { PRODUCTS, BRANDS, CATEGORIES } from './data';

const INITIAL_PRODUCTS = PRODUCTS;
const INITIAL_BRANDS = BRANDS;
const INITIAL_CATEGORIES = CATEGORIES;
const INITIAL_KDV = [20, 10, 1, 0];
import { Product, SelectedOptionState, CalculatorItem, BrandInfo, CategoryInfo } from './types';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { Calculator } from './components/Calculator';
import { AdminPanelModal } from './components/AdminPanelModal';
import { SizingPredictor } from './components/SizingPredictor';
import { ProductionTracker } from './components/ProductionTracker';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  initAnonymousAuth, 
  fetchProducts, 
  fetchBrands, 
  fetchCategories, 
  fetchKdvRates, 
  syncProductsInCloud, 
  syncBrandsInCloud, 
  syncCategoriesInCloud, 
  syncKdvRatesInCloud,
  isCloudQuotaExceeded
} from './firebase';

const getUniqueProducts = (arr: Product[]): Product[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter(p => {
    if (!p || !p.id) return false;
    const isDuplicate = seen.has(p.id);
    seen.add(p.id);
    return !isDuplicate;
  });
};

const getUniqueBrands = (arr: BrandInfo[]): BrandInfo[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter(b => {
    if (!b || !b.name) return false;
    const nameLower = b.name.toLowerCase().trim();
    const isDuplicate = seen.has(nameLower);
    seen.add(nameLower);
    return !isDuplicate;
  });
};

const getUniqueCategories = (arr: CategoryInfo[]): CategoryInfo[] => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set<string>();
  return arr.filter(c => {
    if (!c || !c.id) return false;
    const isDuplicate = seen.has(c.id);
    seen.add(c.id);
    return !isDuplicate;
  });
};

const getUniqueKdvRates = (arr: number[]): number[] => {
  if (!Array.isArray(arr)) return [];
  return Array.from(new Set(arr));
};

export default function App() {

  // Catalog loaded from LocalStorage or Compiled Defaults for absolute persistence
  const [products, setProductsRaw] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('b2b_products_v4');
      return saved ? getUniqueProducts(JSON.parse(saved)) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });
  const setProducts = (val: React.SetStateAction<Product[]>) => {
    setProductsRaw(prev => {
      const resolved = typeof val === 'function' ? (val as Function)(prev) : val;
      return getUniqueProducts(resolved);
    });
  };

  const [brands, setBrandsRaw] = useState<BrandInfo[]>(() => {
    try {
      const saved = localStorage.getItem('b2b_brands_v4');
      return saved ? getUniqueBrands(JSON.parse(saved)) : INITIAL_BRANDS;
    } catch {
      return INITIAL_BRANDS;
    }
  });
  const setBrands = (val: React.SetStateAction<BrandInfo[]>) => {
    setBrandsRaw(prev => {
      const resolved = typeof val === 'function' ? (val as Function)(prev) : val;
      return getUniqueBrands(resolved);
    });
  };

  const [categories, setCategoriesRaw] = useState<CategoryInfo[]>(() => {
    try {
      const saved = localStorage.getItem('b2b_categories_v4');
      return saved ? getUniqueCategories(JSON.parse(saved)) : INITIAL_CATEGORIES;
    } catch {
      return INITIAL_CATEGORIES;
    }
  });
  const setCategories = (val: React.SetStateAction<CategoryInfo[]>) => {
    setCategoriesRaw(prev => {
      const resolved = typeof val === 'function' ? (val as Function)(prev) : val;
      return getUniqueCategories(resolved);
    });
  };

  const [kdvRates, setKdvRatesRaw] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('b2b_kdv_rates_v4');
      return saved ? getUniqueKdvRates(JSON.parse(saved)) : INITIAL_KDV;
    } catch {
      return INITIAL_KDV;
    }
  });
  const setKdvRates = (val: React.SetStateAction<number[]>) => {
    setKdvRatesRaw(prev => {
      const resolved = typeof val === 'function' ? (val as Function)(prev) : val;
      return getUniqueKdvRates(resolved);
    });
  };
  const [isCloudLoading, setIsCloudLoading] = useState<boolean>(true);
  const [localQuotaExceeded, setLocalQuotaExceeded] = useState<boolean>(isCloudQuotaExceeded);

  useEffect(() => {
    const handleQuota = () => {
      setLocalQuotaExceeded(true);
    };
    if (typeof window !== 'undefined') {
      window.addEventListener('firestore-quota-exceeded', handleQuota);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('firestore-quota-exceeded', handleQuota);
      }
    };
  }, []);

  // Synchronize state with LocalStorage for ultra-robust client-side survival
  useEffect(() => {
    try {
      if (products && products.length > 0) {
        localStorage.setItem('b2b_products_v4', JSON.stringify(products));
      }
    } catch (e) {
      console.warn("Failed to save products to localStorage:", e);
    }
  }, [products]);

  useEffect(() => {
    try {
      if (brands && brands.length > 0) {
        localStorage.setItem('b2b_brands_v4', JSON.stringify(brands));
      }
    } catch (e) {
      console.warn("Failed to save brands to localStorage:", e);
    }
  }, [brands]);

  useEffect(() => {
    try {
      if (categories && categories.length > 0) {
        localStorage.setItem('b2b_categories_v4', JSON.stringify(categories));
      }
    } catch (e) {
      console.warn("Failed to save categories to localStorage:", e);
    }
  }, [categories]);

  useEffect(() => {
    try {
      if (kdvRates && kdvRates.length > 0) {
        localStorage.setItem('b2b_kdv_rates_v4', JSON.stringify(kdvRates));
      }
    } catch (e) {
      console.warn("Failed to save kdvRates to localStorage:", e);
    }
  }, [kdvRates]);

  // Helper to save server-side container disk backup so data is preserved even on database resets
  const saveDiskBackup = async (
    currentProducts: Product[],
    currentBrands: BrandInfo[],
    currentCategories: CategoryInfo[],
    currentKdv: number[]
  ) => {
    try {
      await fetch('/api/custom-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          products: currentProducts,
          brands: currentBrands,
          categories: currentCategories,
          kdvRates: currentKdv
        })
      });
    } catch (e) {
      console.warn("Failed to save container disk backup:", e);
    }
  };

  // Load custom data from Firestore Cloud on mount so changes never disappear on restarts
  useEffect(() => {
    async function loadCloudData() {
      try {
        setIsCloudLoading(true);
        // Ensure user is signed in anonymously under the hood to write/read securely
        await initAnonymousAuth();

        // 1. Fetch container disk backup (holds user's beloved custom products/categories/brands)
        let diskData: any = null;
        try {
          const res = await fetch('/api/custom-data');
          if (res.ok) {
            diskData = await res.json();
            console.log("Loaded container disk backup successfully:", diskData);
          }
        } catch (e) {
          console.warn("Failed to read disk backup, using compile time defaults:", e);
        }

        // Determine fallback defaults (absolutely prioritize server-side disk backup since it is the global shared authority)
        const localProds = localStorage.getItem('b2b_products_v4');
        const localBrands = localStorage.getItem('b2b_brands_v4');
        const localCats = localStorage.getItem('b2b_categories_v4');
        const localKdv = localStorage.getItem('b2b_kdv_rates_v4');

        let defaultProducts: Product[] = [];
        let defaultBrands: BrandInfo[] = [];
        let defaultCategories: CategoryInfo[] = [];
        let defaultKdv: number[] = [];

        // 1. Process server-side custom disk backup data (user_data.json) if it exists as the primary fallback
        if (diskData) {
          if (diskData.products && diskData.products.length > 0) {
            defaultProducts = diskData.products;
          }
          if (diskData.brands && diskData.brands.length > 0) {
            defaultBrands = diskData.brands;
          }
          if (diskData.categories && diskData.categories.length > 0) {
            defaultCategories = diskData.categories;
          }
          if (diskData.kdvRates && diskData.kdvRates.length > 0) {
            defaultKdv = diskData.kdvRates;
          }
        }

        // 2. Override or load local storage cache as the absolute current browser state
        try {
          if (localProds) {
            const parsedProds = JSON.parse(localProds) as Product[];
            if (parsedProds && parsedProds.length > 0) {
              defaultProducts = parsedProds;
            }
          }
          if (localBrands) {
            const parsedBrands = JSON.parse(localBrands) as BrandInfo[];
            if (parsedBrands && parsedBrands.length > 0) {
              defaultBrands = parsedBrands;
            }
          }
          if (localCats) {
            const parsedCats = JSON.parse(localCats) as CategoryInfo[];
            if (parsedCats && parsedCats.length > 0) {
              defaultCategories = parsedCats;
            }
          }
          if (localKdv) {
            const parsedKdv = JSON.parse(localKdv) as number[];
            if (parsedKdv && parsedKdv.length > 0) {
              defaultKdv = parsedKdv;
            }
          }
        } catch (e) {
          console.warn("Error parsing localStorage cache:", e);
        }

        // 3. Fallback to compiled compile-time templates ONLY when there is no custom data anywhere
        if (defaultProducts.length === 0) defaultProducts = [...INITIAL_PRODUCTS];
        if (defaultBrands.length === 0) defaultBrands = [...INITIAL_BRANDS];
        if (defaultCategories.length === 0) defaultCategories = [...INITIAL_CATEGORIES];
        if (defaultKdv.length === 0) defaultKdv = [...INITIAL_KDV];

        // Standardize base state with fallback priority first to minimize loading jumps
        setProducts(defaultProducts);
        setBrands(defaultBrands);
        setCategories(defaultCategories);
        setKdvRates(defaultKdv);

        // 4. Fetch from Firebase Firestore as the ultimate shared authority
        const dbProducts = await fetchProducts();
        if (dbProducts === null) {
          console.warn("Firestore system is in quota exceeded or local fallback state. Skipping database seeding.");
        } else if (dbProducts.length > 0) {
          // Firebase Firestore is active and has items. Trust it as the single, absolute source of truth!
          setProducts(dbProducts);
          localStorage.setItem('b2b_products_v4', JSON.stringify(dbProducts));
          
          const dbBrands = await fetchBrands();
          if (dbBrands && dbBrands.length > 0) {
            setBrands(dbBrands);
            localStorage.setItem('b2b_brands_v4', JSON.stringify(dbBrands));
          } else if (dbBrands !== null) {
            setBrands(defaultBrands);
            await syncBrandsInCloud(defaultBrands);
          }

          const dbCategories = await fetchCategories();
          if (dbCategories && dbCategories.length > 0) {
            setCategories(dbCategories);
            localStorage.setItem('b2b_categories_v4', JSON.stringify(dbCategories));
          } else if (dbCategories !== null) {
            setCategories(defaultCategories);
            await syncCategoriesInCloud(defaultCategories);
          }

          const dbKdv = await fetchKdvRates();
          if (dbKdv && dbKdv.length > 0) {
            const sortedKdv = dbKdv.sort((a, b) => b - a);
            setKdvRates(sortedKdv);
            localStorage.setItem('b2b_kdv_rates_v4', JSON.stringify(sortedKdv));
          } else if (dbKdv !== null) {
            setKdvRates(defaultKdv);
            await syncKdvRatesInCloud(defaultKdv);
          }

          // Force update local server-side custom disk backup to match Firestore authority perfectly
          await saveDiskBackup(
            dbProducts, 
            dbBrands && dbBrands.length > 0 ? dbBrands : defaultBrands, 
            dbCategories && dbCategories.length > 0 ? dbCategories : defaultCategories, 
            dbKdv && dbKdv.length > 0 ? dbKdv : defaultKdv
          );
        } else {
          // Firestore is blank/new, seed with local defaults
          console.log("Firestore catalog is blank, seeding initial catalog defaults under custom backup...");
          await syncProductsInCloud(defaultProducts);
          await syncBrandsInCloud(defaultBrands);
          await syncCategoriesInCloud(defaultCategories);
          await syncKdvRatesInCloud(defaultKdv);
          await saveDiskBackup(defaultProducts, defaultBrands, defaultCategories, defaultKdv);
        }
      } catch (err) {
        console.error("Failed to load/seed cloud catalog data:", err);
      } finally {
        setIsCloudLoading(false);
      }
    }
    loadCloudData();
  }, []);

  // Manage Admin Panel Dialog State
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);

  // Search & Filtering States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('Tümü');
  const [selectedCategory, setSelectedCategory] = useState<string>('Tümü');
  const [minPrice, setMinPrice] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<string>('');
  const [sortBy, setSortBy] = useState<string>('popular'); // popular, priceAsc, priceDesc, rating

  // Modal detailing States
  const [activeDetailProduct, setActiveDetailProduct] = useState<Product | null>(null);
  const [activeDetailSelections, setActiveDetailSelections] = useState<SelectedOptionState[]>([]);

  // Calculator Basket State
  const [basket, setBasket] = useState<CalculatorItem[]>([]);

  // Tab View state: Modeller, Hesaplama Tablosu veya B2B Yönetim Takip Paneli
  const [currentView, setCurrentView] = useState<'products' | 'calculator' | 'tracker'>('products');

  // Compute live basket total items and tax-inclusive subtotal for the header/basket widget
  const basketTotals = useMemo(() => {
    let totalItems = 0;
    let totalPrice = 0;
    basket.forEach((item) => {
      const lineUnitBase = item.basePrice;
      const lineUnitOptions = item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
      const singleUnitBeforeTax = lineUnitBase + lineUnitOptions;
      
      const singleUnitKdv = (singleUnitBeforeTax * item.kdvRate) / 100;
      
      const singleUnitGross = singleUnitBeforeTax + singleUnitKdv;
      totalPrice += singleUnitGross * item.quantity;
      totalItems += item.quantity;
    });
    return { totalItems, totalPrice };
  }, [basket]);

  // Mobile drawer state for the calculator (so mobile users don't miss it)
  const [isMobileCalcOpen, setIsMobileCalcOpen] = useState<boolean>(false);

  // Success toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Trigger brief feedback notification
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  // Filter & Sort computation
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      // Search term match
      const nameMatch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
      const descMatch = product.description.toLowerCase().includes(searchTerm.toLowerCase());
      const brandMatch = product.brand.toLowerCase().includes(searchTerm.toLowerCase());
      const specsMatch = Object.entries(product.specs || {}).some(([key, val]) =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      );
      const queryMatch = nameMatch || descMatch || brandMatch || specsMatch;

      // Brand filter matches
      const brandFilterMatch = selectedBrand === 'Tümü' || product.brand === selectedBrand;

      // Category filter matches
      let catFilterMatch = selectedCategory === 'Tümü' || product.category === selectedCategory;
      if (!catFilterMatch && selectedCategory !== 'Tümü') {
        const prodCatInfo = categories.find(c => c.id === product.category);
        if (prodCatInfo && prodCatInfo.parentId === selectedCategory) {
          catFilterMatch = true;
        }
      }

      // Price ranges
      const minP = minPrice ? parseFloat(minPrice) : 0;
      const maxP = maxPrice ? parseFloat(maxPrice) : Infinity;

      // Estimate final display price
      const approxPrice = product.basePrice;
      const priceFilterMatch = approxPrice >= minP && approxPrice <= maxP;

      return queryMatch && brandFilterMatch && catFilterMatch && priceFilterMatch;
    }).sort((a, b) => {
      if (sortBy === 'priceAsc') return a.basePrice - b.basePrice;
      if (sortBy === 'priceDesc') return b.basePrice - a.basePrice;
      return a.name.localeCompare(b.name);
    });
  }, [products, searchTerm, selectedBrand, selectedCategory, minPrice, maxPrice, sortBy, categories]);

  // Find which is the active main category
  const activeMainCatId = useMemo(() => {
    if (selectedCategory === 'Tümü') return null;
    const cat = categories.find(c => c.id === selectedCategory);
    if (!cat) return null;
    return cat.parentId || cat.id;
  }, [selectedCategory, categories]);

  // Find all sibling/child subcategories under that main category
  const subcategories = useMemo(() => {
    if (!activeMainCatId) return [];
    return categories.filter(c => c.parentId === activeMainCatId);
  }, [activeMainCatId, categories]);

  // Global Quick Statistics overview
  const statsOverview = useMemo(() => {
    const totalCount = products.length;
    const uniqueBrands = new Set(products.map(p => p.brand)).size;
    const avgPrice = products.reduce((sum, p) => sum + p.basePrice, 0) / (totalCount || 1);
    const mostPopularBrand = "Hummel Teamwear"; // Sport focus

    return {
      totalCount,
      uniqueBrands,
      avgPrice,
      mostPopularBrand
    };
  }, [products]);

  // Synchronize basket prices and KDV levels instantaneously when product catalog is revised
  React.useEffect(() => {
    setBasket((prevBasket) => {
      let changed = false;
      const updated = prevBasket.map((item) => {
        const prod = products.find((p) => p.id === item.productId);
        if (prod) {
          const itemBasePrice = prod.basePrice;
          const itemKdvRate = prod.kdvRate;
          const optionsImpact = item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
          const finalSingleUnitPrice = itemBasePrice + optionsImpact;

          if (
            item.basePrice !== itemBasePrice ||
            item.kdvRate !== itemKdvRate ||
            item.productName !== prod.name ||
            item.brand !== prod.brand ||
            item.category !== prod.category ||
            item.finalSingleUnitPrice !== finalSingleUnitPrice
          ) {
            changed = true;
            return {
              ...item,
              productName: prod.name,
              brand: prod.brand,
              category: prod.category,
              basePrice: itemBasePrice,
              kdvRate: itemKdvRate,
              finalSingleUnitPrice
            };
          }
        }
        return item;
      });
      return changed ? updated : prevBasket;
    });
  }, [products]);

  // Add Item configuration to calculation sheet
  const handleAddToCalculator = (product: Product, selectionDetails: SelectedOptionState[]) => {
    const formattedSelections: SelectedOptionState[] = [...selectionDetails];

    // Compute unit price
    const optionsImpact = formattedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
    const unitPrice = product.basePrice + optionsImpact;

    // Build calculator row item
    const newItem: CalculatorItem = {
      id: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`, // Unique row tracking
      productId: product.id,
      productName: product.name,
      brand: product.brand,
      category: product.category,
      quantity: 1,
      basePrice: product.basePrice,
      kdvRate: product.kdvRate,
      selectedSelections: formattedSelections,
      customDiscount: 0,
      finalSingleUnitPrice: unitPrice
    };

    setBasket((prev) => [...prev, newItem]);
    triggerToast(`"${product.name}" hesaplama listesine eklendi!`);
    setIsMobileCalcOpen(true); // Automatically open panel on mobile
  };

  // Modify Basket tools
  const handleUpdateQuantity = (itemId: string, newQty: number) => {
    setBasket((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (itemId: string) => {
    setBasket((prev) => prev.filter((item) => item.id !== itemId));
    triggerToast("Ürün hesaplama listesinden çıkartıldı.");
  };

  const handleClearAll = () => {
    setBasket([]);
    triggerToast("Tüm hesaplama tablosu sıfırlandı.");
  };

  // Reset all filters tool
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedBrand('Tümü');
    setSelectedCategory('Tümü');
    setMinPrice('');
    setMaxPrice('');
    setSortBy('popular');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 text-slate-800 antialiased font-sans pb-12 flex flex-col">
      {/* Visual background atmospheric elements - keeping body margins clean */}
      <div className="absolute top-0 left-0 right-0 h-48 bg-linear-to-b from-slate-100 to-transparent pointer-events-none" />

      {/* Primary Header */}
      <header className="bg-white border-b border-slate-100 relative z-10 py-4 px-4 md:px-8 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col gap-3">
          {/* Row 1: Logo & Title on Left, View Switcher & Live Cart on Right */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-2xl text-white shadow-md shadow-emerald-600/15">
                <Icons.Coins className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-xl font-black text-slate-900 tracking-tight">
                    Fiyat Rehberi ve Hesaplama Portalı
                  </h1>
                  <button
                    type="button"
                    id="btn-open-admin"
                    onClick={() => setIsAdminOpen(true)}
                    className="bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-[10px] px-2.5 py-1 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-xs uppercase tracking-wider select-none shrink-0"
                  >
                    <Icons.Sliders className="w-3.5 h-3.5 text-emerald-400" />
                    Katalog Paneli
                  </button>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-0.5">Marka ve kategori bazlı vergilendirilmiş detaylı fiyat listesi ve bütçe simülatörü</p>
              </div>
            </div>

            {/* Navigation Tab Switching & Live Cart Widget */}
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 w-full md:w-auto mt-2 md:mt-0">
              {/* Main Tabs switcher */}
              <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 border border-slate-200/50">
                <button
                  type="button"
                  onClick={() => setCurrentView('products')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    currentView === 'products'
                      ? 'bg-white text-emerald-800 shadow-xs border border-slate-200/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icons.Layers className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Modeller ({filteredProducts.length})</span>
                </button>
                
                <button
                  type="button"
                  onClick={() => setCurrentView('calculator')}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    currentView === 'calculator'
                      ? 'bg-white text-slate-800 shadow-xs border border-slate-200/10'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icons.Calculator className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Hesap Makinesi</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentView('tracker');
                    setIsMobileCalcOpen(false);
                  }}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-black rounded-xl transition-all cursor-pointer ${
                    currentView === 'tracker'
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-900 hover:bg-white/40'
                  }`}
                >
                  <Icons.Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>B2B Yönetim & Takip</span>
                </button>
              </div>

              {/* Quick Live Cart Badge & Go To Cart (Sepete Git / Fiyat) */}
              <button
                type="button"
                onClick={() => setCurrentView('calculator')}
                className={`flex items-center gap-2.5 p-1 pl-3.5 pr-1.5 rounded-2xl border transition-all cursor-pointer group relative ${
                  basketTotals.totalItems > 0
                    ? 'bg-emerald-50/50 border-emerald-300 text-emerald-950 hover:bg-emerald-50 focus:ring-2 focus:ring-emerald-500/20'
                    : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100/60'
                }`}
              >
                <div className="flex flex-col items-start leading-none gap-0.5 text-left">
                  <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block">SEPETE GİT</span>
                  <span className={`text-xs font-black ${basketTotals.totalItems > 0 ? 'text-emerald-700' : 'text-slate-655'}`}>
                    {basketTotals.totalPrice > 0 
                      ? `${basketTotals.totalPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL` 
                      : 'Oluştur'}
                  </span>
                </div>
                <div className={`p-2 rounded-xl transition-colors ${
                  basketTotals.totalItems > 0 
                    ? 'bg-emerald-600 text-white group-hover:bg-emerald-700'
                    : 'bg-slate-200 text-slate-500'
                }`}>
                  <Icons.ShoppingCart className="w-4 h-4" />
                </div>
                {basketTotals.totalItems > 0 && (
                  <div className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-extrabold text-[9px] px-1.5 py-0.5 rounded-full ring-2 ring-white shadow-xs animate-pulse">
                    {basketTotals.totalItems}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Row 2: Subtle stats bar and helpful live badge */}
          <div className="border-t border-slate-100 pt-3 flex flex-col sm:flex-row justify-between items-center text-[11px] text-slate-500 font-medium gap-2">
            <div className="flex items-center gap-1.5 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse inline-block" />
              <span>Hummel Teamwear Kulüp Entegre Fiyat Simülatörü Aktif</span>
            </div>
            <div className="flex items-center gap-3.5 text-slate-450 hover:text-slate-600 transition-colors">
              <span><strong>{statsOverview.totalCount}</strong> Farklı Model</span>
              <span className="text-slate-300">|</span>
              <span><strong>{statsOverview.uniqueBrands}</strong> Global Marka</span>
              <span className="text-slate-300">|</span>
              <span>En Popüler: <strong className="text-emerald-700 font-bold">{statsOverview.mostPopularBrand}</strong></span>
              <span className="text-slate-300">|</span>
              <span>Ort. Taban: <strong className="text-slate-700 font-extrabold">~{statsOverview.avgPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container Grid */}
      {isCloudLoading ? (
        <main className="max-w-md mx-auto w-full px-4 text-center mt-20 flex-1 flex flex-col items-center justify-center gap-4 relative z-10">
          <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xs flex flex-col items-center gap-4">
            <Icons.Loader2 className="w-10 h-10 text-emerald-600 animate-spin" />
            <div>
              <h3 className="font-black text-slate-800 text-sm tracking-tight uppercase">Sistem Eşitlemesi Yapılıyor</h3>
              <p className="text-slate-450 text-[11px] mt-1 font-semibold leading-normal">Bulut Veritabanı ve Yerel Yedekler Senkronize Ediliyor. Lütfen bekleyin...</p>
            </div>
          </div>
        </main>
      ) : currentView === 'products' ? (
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6 flex-1 flex flex-col gap-5 relative z-10">

          {/* Unified Filter Dashboard Panel */}
          <section className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex flex-col gap-4">
            
            {/* Row 1: Search & Sort Tools */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Icons.Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Ürün ismi, donanım, marka veya teknik özellik ara..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl focus:outline-hidden focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500 transition-colors"
                />
                {searchTerm && (
                  <button
                    onClick={() => setSearchTerm('')}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <Icons.X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Advanced sorting */}
              <div className="flex items-center gap-2 shrink-0">
                <Icons.ArrowUpDown className="w-4 h-4 text-slate-450" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="bg-slate-50 border border-slate-200 text-xs font-semibold py-2.5 px-3 rounded-2xl text-slate-700 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
                >
                  <option value="popular">Varsayılan Sıralama</option>
                  <option value="priceAsc">Fiyat: Düşükten Yükseğe</option>
                  <option value="priceDesc">Fiyat: Yüksekten Düşüğe</option>
                </select>
              </div>
            </div>

            {/* Row 2: Brand Tag Badges */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Marka Seçimi</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedBrand('Tümü')}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                    selectedBrand === 'Tümü'
                      ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  Tüm Markalar
                </button>
                {brands.map((b) => (
                  <button
                    key={b.name}
                    onClick={() => setSelectedBrand(b.name)}
                    className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer flex items-center gap-1 ${
                      selectedBrand === b.name
                        ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                        : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="text-[10px] opacity-70 font-semibold uppercase">{b.logo.length > 15 ? 'LOGO' : b.logo}</span>
                    <span>{b.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Row 3: Category Filter Toolbar */}
            <div className="border-t border-slate-100 pt-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Kategori Filtresi</span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                <button
                  onClick={() => setSelectedCategory('Tümü')}
                  className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer text-center h-18 ${
                    selectedCategory === 'Tümü'
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                      : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50/60 text-slate-600'
                  }`}
                >
                  <Icons.Layers className="w-4 h-4 mb-1 text-emerald-600" />
                  <span className="text-[11px] font-extrabold tracking-tight">Tüm Kategoriler</span>
                </button>
                {categories.filter(cat => !cat.parentId).map((cat) => {
                  const IconComp = (Icons as any)[cat.iconName] || Icons.HelpCircle;
                  const isSelected = selectedCategory === cat.id || activeMainCatId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex flex-col items-center justify-center p-2.5 rounded-2xl border transition-all cursor-pointer text-center h-18 ${
                        isSelected
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                          : 'bg-slate-50/30 border-slate-200 hover:bg-slate-50/60 text-slate-600'
                      }`}
                    >
                      <IconComp className={`w-4 h-4 mb-1 ${isSelected ? 'text-emerald-700' : 'text-slate-450'}`} />
                      <span className="text-[11px] font-extrabold tracking-tight">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Row 3.5: Subcategory Filter Toolbar */}
            <AnimatePresence mode="popLayout">
              {activeMainCatId && subcategories.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -10, height: 0 }}
                  animate={{ opacity: 1, y: 0, height: 'auto' }}
                  exit={{ opacity: 0, y: -10, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="bg-emerald-50/10 border border-emerald-100 p-3 rounded-2xl flex flex-col gap-2 overflow-hidden"
                >
                  <div className="flex items-center gap-1.5 px-2 bg-white/60 py-1 rounded-lg border border-slate-100 self-start">
                    <Icons.CornerDownRight className="w-3 h-3 text-emerald-600" />
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                      {categories.find(c => c.id === activeMainCatId)?.name} Alt Kategorileri
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 pl-4 py-1">
                    <button
                      onClick={() => setSelectedCategory(activeMainCatId)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                        selectedCategory === activeMainCatId
                          ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                    >
                      Tümü (Ana Kategori)
                    </button>
                    {subcategories.map(sub => (
                      <button
                        key={sub.id}
                        onClick={() => setSelectedCategory(sub.id)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl border transition-all cursor-pointer ${
                          selectedCategory === sub.id
                            ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                        }`}
                      >
                        {sub.name}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Row 4: Advanced Budget Filters & Clear */}
            {(minPrice || maxPrice || searchTerm || selectedBrand !== 'Tümü' || selectedCategory !== 'Tümü') && (
              <div className="border-t border-slate-105 pt-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-slate-550 font-bold whitespace-nowrap">Bütçe Aralığı (TL):</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minPrice}
                      onChange={(e) => setMinPrice(e.target.value)}
                      className="w-20 py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-hidden"
                    />
                    <span className="text-slate-400 font-bold text-xs">-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxPrice}
                      onChange={(e) => setMaxPrice(e.target.value)}
                      className="w-24 py-1 px-2.5 text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-lg focus:outline-hidden"
                    />
                  </div>
                </div>

                <button
                  onClick={handleResetFilters}
                  className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-slate-800 shadow-2xs border border-slate-200 rounded-xl px-2.5 py-1.5 hover:bg-slate-50 cursor-pointer"
                >
                  <Icons.RotateCcw className="w-3 h-3" />
                  Filtreleri Sıfırla
                </button>
              </div>
            )}
          </section>

          {/* Product Cards Grid Area */}
          <div className="flex justify-between items-center px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Görüntülenen Fiyat Listesi ({filteredProducts.length} Ürün bulundu)
            </span>
            <div className="text-[11px] text-slate-500 font-medium">Bütün fiyatlar peşin KDV dahil fiyatlar baz alınarak ve ödeme tipine göre hesaplanır.</div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-100 p-12 text-center shadow-xs flex flex-col items-center">
              <Icons.Info className="w-12 h-12 text-slate-300 mb-3" />
              <h3 className="font-extrabold text-lg text-slate-800">Uyumlu ürün bulunamadı.</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md">Seçtiğiniz kriterler veya arama terimine ait aktif ürün bulunmamaktadır. Lütfen filtrelerinizi gevşetip tekrar deneyin.</p>
              <button
                onClick={handleResetFilters}
                className="mt-4 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Filtreleri Sıfırla
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              <AnimatePresence mode="popLayout">
                {filteredProducts.map((p) => (
                  <ProductCard
                    key={p.id}
                    product={p}
                    brands={brands}
                    categories={categories}
                    onAddToCalculator={handleAddToCalculator}
                    onOpenDetail={(prod, initialSels) => {
                      setActiveDetailProduct(prod);
                      setActiveDetailSelections(initialSels);
                    }}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </main>
      ) : currentView === 'calculator' ? (
        /* Calculator Workspace View (Full Screen) */
        <main className="max-w-4xl mx-auto w-full px-4 md:px-8 mt-6 flex-1 flex flex-col gap-5 relative z-10">
          {/* Back toolbar */}
          <div className="flex flex-col sm:flex-row justify-between items-center bg-white border border-slate-100 p-4 px-5 rounded-3xl shadow-xs gap-3">
            <button
              type="button"
              onClick={() => setCurrentView('products')}
              className="group flex items-center gap-2 text-xs font-black text-slate-700 hover:text-emerald-700 cursor-pointer transition-colors"
            >
              <Icons.ArrowLeft className="w-4 h-4 text-emerald-600 group-hover:-translate-x-1 transition-transform" />
              <span>‹ Ürün Kataloğuna Geri Dön</span>
            </button>
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1.5">
              <Icons.Sparkles className="w-3.5 h-3.5 text-emerald-500 text-emerald-600 animate-pulse" />
              <span>Dijital Baskı Matrisi ve B2B kademeli iskontolar aktiftir.</span>
            </div>
          </div>
          
          <div className="w-full">
            <Calculator
              basket={basket}
              onUpdateQuantity={handleUpdateQuantity}
              onRemoveItem={handleRemoveItem}
              onClearAll={handleClearAll}
              onUpdateCustomProperties={(itemId, props) => {
                setBasket((prevBasket) =>
                  prevBasket.map((item) => (item.id === itemId ? { ...item, ...props } : item))
                );
              }}
            />
          </div>
        </main>
      ) : (
        /* Brand New B2B Enterprise Tracker and Management Dashboard Workspace */
        <main className="max-w-7xl mx-auto w-full px-4 md:px-8 mt-6 flex-1 flex flex-col gap-6 relative z-10 text-left">
          {/* Dashboard Header Bar */}
          <div className="bg-gradient-to-tr from-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-slate-800 shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-[9px] font-black tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded uppercase">
                B2B Kulüp Panel Sürümü v2.4
              </span>
              <h2 className="text-lg font-black mt-1">
                Gelişmiş Sipariş ve Üretim Takip Merkezi
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Live üretim bantları dökümü, çoklu branş bütçe bölüştürücü simülatörü ve akıllı beden dağılım asistanı.
              </p>
            </div>
            <button
              onClick={() => {
                setCurrentView('products');
                triggerToast("Kataloğa geri dönüldü!");
              }}
              className="bg-white/10 hover:bg-white/20 text-white text-xs font-bold px-4 py-2 rounded-xl transition-colors border border-white/10 cursor-pointer"
            >
              Kataloğa Dön
            </button>
          </div>

          {/* Core Panel 1: Live Interactive Production and Digital Print Tracker */}
          <div className="w-full">
            <ProductionTracker />
          </div>

          {/* Sub-Panel: Fabric Assortment and Packaging Simulator */}
          <div className="w-full">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xs flex flex-col gap-4 relative overflow-hidden">
              <div className="absolute top-4 right-4 z-20">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-3 py-1.5 rounded-xl border border-amber-200 uppercase tracking-widest animate-pulse">
                  Çok Yakında
                </span>
              </div>
              
              <div className="pointer-events-none opacity-40 select-none blur-[1.5px] w-full">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-2 bg-indigo-50 text-indigo-650 rounded-xl">
                      <Icons.Scale className="w-5 h-5 text-indigo-650" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm text-slate-900">Kumaş Asorti ve Paketleme Hesaplama Sistemi</h3>
                      <p className="text-[10px] text-slate-400 font-bold">Takım ve şube bazında toplu siparişler için kumaş tüketim, asorti katsayıları ve fire oranlarını simüle edin</p>
                    </div>
                  </div>
                </div>
                <SizingPredictor />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Floating alert/success feedback toast toast notification bar */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 left-6 z-50 bg-slate-900 border border-slate-820 text-white font-semibold text-xs py-3 px-5 rounded-2xl shadow-xl flex items-center gap-2"
          >
            <span className="bg-emerald-500 p-1 rounded-full text-slate-950 font-black"><Icons.Check className="w-3.5 h-3.5" /></span>
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail Specifications Modal markup */}
      <ProductDetailModal
        product={activeDetailProduct}
        selectedSelections={activeDetailSelections}
        categories={categories}
        brands={brands}
        onClose={() => {
          setActiveDetailProduct(null);
          setActiveDetailSelections([]);
        }}
        onAddToCalculator={handleAddToCalculator}
      />

      {/* Dynamic Products Admin Editor Panel */}
      <AdminPanelModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onUpdateProducts={(newProducts) => {
          setProducts(newProducts);
          syncProductsInCloud(newProducts);
          saveDiskBackup(newProducts, brands, categories, kdvRates);
        }}
        brands={brands}
        onUpdateBrands={(newBrands) => {
          setBrands(newBrands);
          syncBrandsInCloud(newBrands);
          saveDiskBackup(products, newBrands, categories, kdvRates);
        }}
        categories={categories}
        onUpdateCategories={(newCategories) => {
          setCategories(newCategories);
          syncCategoriesInCloud(newCategories);
          saveDiskBackup(products, brands, newCategories, kdvRates);
        }}
        kdvRates={kdvRates}
        onUpdateKdvRates={(newKdvRates) => {
          setKdvRates(newKdvRates);
          syncKdvRatesInCloud(newKdvRates);
          saveDiskBackup(products, brands, categories, newKdvRates);
        }}
        onResetToDefaults={() => {
          setProducts(INITIAL_PRODUCTS);
          setBrands(INITIAL_BRANDS);
          setCategories(INITIAL_CATEGORIES);
          setKdvRates(INITIAL_KDV);
          syncProductsInCloud(INITIAL_PRODUCTS);
          syncBrandsInCloud(INITIAL_BRANDS);
          syncCategoriesInCloud(INITIAL_CATEGORIES);
          syncKdvRatesInCloud(INITIAL_KDV);
          saveDiskBackup(INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_CATEGORIES, INITIAL_KDV);
        }}
      />
    </div>
  );
}
