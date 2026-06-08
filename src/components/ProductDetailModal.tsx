/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Product, SelectedOptionState, CategoryInfo, BrandInfo } from '../types';
import { DEFAULT_COLLAR_OPTIONS } from '../data';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ProductDetailModalProps {
  product: Product | null;
  selectedSelections: SelectedOptionState[];
  categories: CategoryInfo[];
  brands: BrandInfo[];
  onClose: () => void;
  onAddToCalculator: (product: Product, selectedSelections: SelectedOptionState[]) => void;
}

export function ProductDetailModal({ product, selectedSelections, categories, brands, onClose, onAddToCalculator }: ProductDetailModalProps) {
  const [currentImgIndex, setCurrentImgIndex] = React.useState<number>(0);

  const isJersey = useMemo(() => {
    if (!product) return false;
    const cat = (product.category || "").toLowerCase();
    const name = (product.name || "").toLowerCase();
    if (cat === 'formalar' || cat === 'forma-ust' || cat === 'basketbol-forma' || cat === 'futbol-forma' || cat.includes('forma') || cat.includes('jersey')) {
      return true;
    }
    if (name.includes('forma') || name.includes('jersey')) {
      return true;
    }
    return false;
  }, [product]);

  const collarList = useMemo(() => {
    if (!product) return [];
    const list = product.collarOptions && product.collarOptions.length > 0
      ? product.collarOptions.filter(c => c.enabled)
      : DEFAULT_COLLAR_OPTIONS.filter(c => c.enabled);
    return list;
  }, [product]);

  const [selectedCollar, setSelectedCollar] = React.useState<string>("Örme Bisiklet Yaka");

  React.useEffect(() => {
    if (collarList && collarList.length > 0) {
      const exists = collarList.find(c => c.name === selectedCollar);
      if (!exists) {
        setSelectedCollar(collarList[0].name);
      }
    }
  }, [collarList, selectedCollar]);

  const imagesList = useMemo(() => {
    return product ? (product.images && product.images.length > 0 ? product.images : [product.image]) : [];
  }, [product]);

  // Auto-slide effect for imagesList - belirli saniye aralıklarla diğer resme geçer
  React.useEffect(() => {
    if (imagesList.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImgIndex((prev) => (prev === imagesList.length - 1 ? 0 : prev + 1));
    }, 4000); // Transitions every 4 seconds

    return () => clearInterval(interval);
  }, [imagesList]);

  const categoryInfo = useMemo(() => {
    return product ? categories.find(c => c.id === product.category) : undefined;
  }, [categories, product]);

  const brandInfo = useMemo(() => {
    return product ? brands.find(b => b.name === product.brand) : undefined;
  }, [brands, product]);

  // Handle local variant selection within the modal
  const [localSelections, setLocalSelections] = React.useState<Record<string, string>>({});

  // Synchronize state when product opens or changes
  React.useEffect(() => {
    if (!product) return;
    const initial: Record<string, string> = {};
    (product.options || []).forEach(opt => {
      const active = selectedSelections.find(s => s.optionId === opt.id);
      if (active) {
        initial[opt.id] = active.choiceName;
      } else if (opt && opt.choices && opt.choices.length > 0) {
        initial[opt.id] = opt.choices[0].name;
      }
    });
    setLocalSelections(initial);
    setCurrentImgIndex(0);
    const savedCollar = selectedSelections.find(s => s.optionId === "yaka_tipi");
    if (savedCollar) {
      setSelectedCollar(savedCollar.choiceName);
    } else {
      setSelectedCollar("Örme Bisiklet Yaka");
    }
  }, [product, selectedSelections]);

  const currentSelectionsDetails = useMemo<SelectedOptionState[]>(() => {
    if (!product) return [];
    const list: SelectedOptionState[] = [];
    (product.options || []).forEach(opt => {
      const selectedChoiceName = localSelections[opt.id];
      if (opt && opt.choices) {
        const foundChoice = opt.choices.find(c => c.name === selectedChoiceName);
        if (foundChoice) {
          list.push({
            optionId: opt.id,
            optionName: opt.name,
            choiceName: foundChoice.name,
            priceInfluence: foundChoice.priceInfluence
          });
        }
      }
    });

    if (isJersey) {
      const foundCollar = collarList.find(c => c.name === selectedCollar);
      list.push({
        optionId: "yaka_tipi",
        optionName: "Yaka Tipi",
        choiceName: selectedCollar,
        priceInfluence: foundCollar ? foundCollar.priceInfluence : 0
      });
    }

    return list;
  }, [localSelections, product, selectedCollar, collarList]);

  // Calculate price dynamically
  const selectionsPriceImpact = useMemo(() => {
    return currentSelectionsDetails.reduce((sum, item) => sum + item.priceInfluence, 0);
  }, [currentSelectionsDetails]);

  const configuredBasePrice = product ? product.basePrice + selectionsPriceImpact : 0;

  // Taxes
  const kdvAmount = product ? (configuredBasePrice * product.kdvRate) / 100 : 0;
  const finalPrice = configuredBasePrice + kdvAmount;  if (!product) return null;

  return (
    <AnimatePresence>
      <div className="product-detail-modal-container fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 md:p-4 animate-fade-in" id="product-detail-modal">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs transition-opacity"
        />

        {/* Modal Wrapper */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ type: "spring", damping: 28, stiffness: 320 }}
          className="product-detail-modal-container relative transform overflow-hidden rounded-[1.75rem] md:rounded-[2rem] bg-white text-left shadow-2xl transition-all w-full max-w-[980px] border border-slate-150 flex flex-col md:flex-row h-[94vh] md:h-[82vh] min-h-[520px] md:min-h-[620px] z-10"
        >
          {/* Close button top right on floating design */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-900 p-2.5 rounded-full cursor-pointer z-30 transition-all active:scale-95 hidden md:flex items-center justify-center border border-slate-200/60"
          >
            <Icons.X className="w-4 h-4" />
          </button>

          {/* Left Section - Portrait Image Box (Tightly Fitted) & Basic Info */}
          <div className="w-full md:w-[360px] bg-white p-4 md:p-5 shrink-0 flex flex-col justify-between md:justify-start border-b md:border-b-0 md:border-r border-slate-100 h-[33%] md:h-full overflow-hidden">
            <div className="flex flex-row md:flex-col items-center md:items-stretch gap-3 md:gap-4 h-full md:h-auto">
              {/* Header/Close row on Mobile only */}
              <div className="flex md:hidden justify-between items-center absolute top-3 right-3 z-30">
                <button
                  onClick={onClose}
                  className="bg-slate-100/95 active:scale-95 p-1.5 rounded-full cursor-pointer border border-slate-200 shadow-2xs"
                >
                  <Icons.X className="w-3.5 h-3.5 text-slate-700" />
                </button>
              </div>

              {/* Tightly aligned Portrait Image Frame */}
              <div className="relative aspect-square md:aspect-[3/4] h-full md:h-[320px] w-auto md:w-full max-w-[150px] md:max-w-none rounded-xl md:rounded-2xl overflow-hidden bg-slate-50/50 border border-slate-100/80 flex items-center justify-center shrink-0" id="detail-portrait-frame">
                <motion.img
                  key={currentImgIndex}
                  src={imagesList[currentImgIndex]}
                  alt={product.name}
                  initial={{ opacity: 0.4 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0.4 }}
                  transition={{ duration: 0.2 }}
                  className="w-full h-full object-contain p-1.5 md:p-2"
                  referrerPolicy="no-referrer"
                />

                {imagesList.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
                      }}
                      className="absolute left-1.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1 md:p-1.5 rounded-full shadow-md cursor-pointer z-10"
                    >
                      <Icons.ChevronLeft className="w-3 h-3 md:w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setCurrentImgIndex(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
                      }}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1 md:p-1.5 rounded-full shadow-md cursor-pointer z-10"
                    >
                      <Icons.ChevronRight className="w-3 h-3 md:w-4 h-4" />
                    </button>
                  </>
                )}
              </div>

              {/* Diğer renkler / resimler ürün resminin hemen altında gösteriliyor */}
              {imagesList.length > 1 && (
                <div className="flex gap-2 justify-center md:justify-start overflow-x-auto scrollbar-hidden select-none py-1 w-full" id="detail-colors-strip">
                  {imagesList.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setCurrentImgIndex(idx)}
                      className={`w-11 h-11 rounded-lg overflow-hidden border shrink-0 cursor-pointer transition-all ${
                        idx === currentImgIndex ? 'border-emerald-600 scale-95 shadow-xs ring-2 ring-emerald-500/25' : 'border-slate-200 hover:border-slate-350'
                      }`}
                    >
                      <img src={img} alt="küçük resim" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Product Information - Dense layout on mobile, descriptive on desktop */}
              <div className="flex-1 md:flex-initial text-left pr-6 md:pr-0 md:mt-2 min-w-0" id="detail-prod-info">
                <h2 className="text-sm md:text-xl font-black text-slate-900 tracking-tight leading-tight line-clamp-2 md:line-clamp-none">
                  {product.name}
                </h2>
                <p className="hidden md:block text-xs text-slate-500 mt-1.5 leading-relaxed">
                  {product.description}
                </p>
              </div>
            </div>
          </div>

          {/* Right Section - Specs, Collar Options & Dynamic Calculation Controls */}
          <div className="w-full md:flex-1 p-4 md:p-6 lg:p-8 flex flex-col justify-between bg-slate-55/40 overflow-y-auto h-[67%] md:h-full border-t md:border-t-0 md:border-l border-slate-100/50">
            <div>
              {/* Technical Specifications Grid (Bento Style) */}
              <div className="text-left mb-4 md:mb-5">
                <div className="flex items-center justify-between mb-2 md:mb-3 pb-1 md:pb-2 border-b border-slate-200/50">
                  <h3 className="text-[9.5px] md:text-[10.5px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Icons.Settings2 className="w-3.5 h-3.5 text-slate-500" />
                    Teknik Özellikler
                  </h3>
                  {product.branch && (
                    <span className="inline-flex items-center gap-1 bg-white border border-slate-200/85 shadow-3xs px-2 py-0.5 rounded-full text-[8.5px] md:text-[10px] font-black text-slate-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      {product.branch.toUpperCase()}
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(product.specs)
                    .filter(([key, val]) => key.trim() !== '' && val.trim() !== '')
                    .map(([key, val]) => {
                      const lowercaseKey = key.toLowerCase();
                      let specIcon = <Icons.Info className="w-3.5 h-3.5 text-slate-400" />;
                      let accentBg = "bg-slate-50";

                      if (lowercaseKey.includes("koleksiyon")) {
                        specIcon = <Icons.Sparkles className="w-3.5 h-3.5 text-amber-500" />;
                        accentBg = "bg-amber-500/5";
                      } else if (lowercaseKey.includes("kumaş türü") || lowercaseKey.includes("kumas")) {
                        specIcon = <Icons.Layers className="w-3.5 h-3.5 text-indigo-500" />;
                        accentBg = "bg-indigo-500/5";
                      } else if (lowercaseKey.includes("kol tipi") || lowercaseKey.includes("kol ")) {
                        specIcon = <Icons.Shirt className="w-3.5 h-3.5 text-blue-500" />;
                        accentBg = "bg-blue-500/5";
                      } else if (lowercaseKey.includes("gramaj")) {
                        specIcon = <Icons.Scale className="w-3.5 h-3.5 text-emerald-500" />;
                        accentBg = "bg-emerald-500/5";
                      } else if (lowercaseKey.includes("kesim") || lowercaseKey.includes("kalıp") || lowercaseKey.includes("fit")) {
                        specIcon = <Icons.Maximize className="w-3.5 h-3.5 text-violet-500" />;
                        accentBg = "bg-violet-500/5";
                      } else if (lowercaseKey.includes("paket") || lowercaseKey.includes("içerik")) {
                        specIcon = <Icons.Package className="w-3.5 h-3.5 text-blue-500" />;
                        accentBg = "bg-blue-500/5";
                      }

                    return (
                      <div
                        key={key}
                        className="flex items-center gap-2 md:gap-3 p-2 md:p-2.5 rounded-xl border border-slate-200/55 bg-white shadow-3xs hover:border-slate-300 hover:shadow-2xs transition-all"
                      >
                        <div className={`p-1.5 md:p-2 rounded-lg shrink-0 ${accentBg}`}>
                          {specIcon}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase tracking-widest">{key}</p>
                          <p className="text-[10px] md:text-[11.5px] font-extrabold text-slate-800 truncate" title={val}>{val}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Collar Selection Section - Extracted & beautifully embedded in the configuration column */}
              {isJersey && (
                <div className="mb-4 md:mb-5">
                  <h3 className="text-[9.5px] md:text-[10.5px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5">
                    <Icons.Layers className="w-3.5 h-3.5 text-emerald-600" />
                    Yaka Stili Seçiniz
                  </h3>
                  <div className="grid grid-cols-4 gap-1 md:gap-1.5" id="detail-collar-grid">
                    {collarList.map((item) => {
                      const isSelected = selectedCollar === item.name;
                      
                      return (
                        <button
                          key={item.name}
                          type="button"
                          onClick={() => setSelectedCollar(item.name)}
                          className={`relative flex flex-col justify-center items-center p-1 md:p-1.5 rounded-xl text-center transition-all cursor-pointer focus:outline-hidden min-h-[44px] border ${
                            isSelected
                              ? 'bg-emerald-600 border-emerald-600 text-white shadow-3xs font-extrabold'
                              : 'bg-white border-slate-200 hover:border-slate-350 text-slate-700 hover:bg-slate-50 hover:shadow-4xs'
                          }`}
                        >
                          <div className="text-center min-w-0 w-full">
                            <span className={`text-[8.5px] sm:text-[9.5px] md:text-[10px] font-black leading-tight tracking-tight break-words block ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                              {item.name}
                            </span>
                          </div>
                          {item.priceInfluence !== 0 && (
                            <span className={`text-[7px] font-black px-1 py-0.2 mt-0.5 rounded-sm shrink-0 leading-none inline-block ${
                              isSelected 
                                ? 'bg-white/20 text-white' 
                                : item.priceInfluence > 0 
                                  ? 'bg-amber-100 text-amber-850' 
                                  : 'bg-rose-100 text-rose-850'
                            }`}>
                              {item.priceInfluence > 0 ? `+${item.priceInfluence}` : `${item.priceInfluence}`}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Configure Additional Options if exist */}
              {product.options && product.options.length > 0 && (
                <div className="mb-4 md:mb-5">
                  <h3 className="text-[9.5px] md:text-[10.5px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5">
                    <Icons.Sliders className="w-3.5 h-3.5 text-slate-500" />
                    Yapılandırma Seçenekleri
                  </h3>
                  <div className="space-y-2 md:space-y-3 bg-white p-3 rounded-2xl border border-slate-200/55 shadow-3xs">
                    {product.options.map((opt) => (
                      <div key={opt.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                        <span className="text-[9.5px] md:text-[10.5px] font-extrabold text-slate-500 uppercase tracking-wider shrink-0">{opt.name}:</span>
                        <div className="flex flex-wrap gap-1">
                          {(opt.choices || []).map((choice) => {
                            const isSelected = localSelections[opt.id] === choice.name;
                            return (
                              <button
                                key={choice.name}
                                type="button"
                                onClick={() => setLocalSelections(prev => ({ ...prev, [opt.id]: choice.name }))}
                                className={`text-[9.5px] md:text-[10.5px] font-black px-2.5 py-1 rounded-lg border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'bg-slate-900 border-slate-900 text-white shadow-3xs'
                                    : 'bg-white border-slate-200 hover:bg-slate-50/50 text-slate-700'
                                }`}
                              >
                                {choice.name}
                                {choice.priceInfluence !== 0 && (
                                  <span className="text-[8px] opacity-80 ml-1">
                                    ({choice.priceInfluence > 0 ? '+' : ''}{choice.priceInfluence} TL)
                                  </span>
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Dynamic Cost breakdown (Invoice Style) */}
              <div className="mb-4 md:mb-5">
                <h3 className="text-[9.5px] md:text-[10.5px] font-black text-slate-500 uppercase tracking-widest mb-2 border-b border-slate-200/60 pb-1.5 flex items-center gap-1.5">
                  <Icons.Receipt className="w-3.5 h-3.5 text-slate-500" />
                  Maliyet Hesaplama Tablosu
                </h3>
                
                <div className="bg-white border border-slate-200/75 rounded-2xl shadow-3xs overflow-hidden">
                  <div className="p-3 md:p-4 space-y-2">
                    <div className="flex justify-between items-center text-[10.5px] md:text-[11.5px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Icons.Compass className="w-3.5 h-3.5 text-slate-400" />
                        Ürün Taban Fiyatı
                      </span>
                      <span className="font-extrabold text-slate-750">{product.basePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>

                    {selectionsPriceImpact !== 0 && (
                      <div className="flex justify-between items-center text-[10.5px] md:text-[11.5px] bg-slate-50 p-1.5 rounded-lg">
                        <span className="text-slate-500 font-semibold flex items-center gap-1">
                          <Icons.PlusCircle className="w-3.5 h-3.5 text-emerald-500" />
                          Seçenek Fiyat Farkı
                        </span>
                        <span className="font-extrabold text-emerald-600">+{selectionsPriceImpact.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                      </div>
                    )}

                    <div className="flex justify-between items-center text-[10.5px] md:text-[11.5px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Icons.Coins className="w-3.5 h-3.5 text-slate-400" />
                        Yapılandırılmış Birim Fiyatı
                      </span>
                      <span className="font-extrabold text-slate-900">{configuredBasePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>

                    <div className="flex justify-between items-center text-[10.5px] md:text-[11.5px]">
                      <span className="text-slate-500 font-semibold flex items-center gap-1">
                        <Icons.Calculator className="w-3.5 h-3.5 text-slate-400" />
                        KDV Oranı (%{product.kdvRate})
                      </span>
                      <span className="font-extrabold text-amber-600">+{kdvAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
                    </div>
                  </div>

                  <div className="border-t border-dashed border-slate-250/50"></div>

                  <div className="bg-slate-900 text-white p-3 md:p-4 flex justify-between items-center">
                    <div>
                      <p className="text-[8px] md:text-[9.5px] font-black text-slate-400 uppercase tracking-widest">KDV DAHİL TOPLAM</p>
                      <p className="text-[8px] text-slate-500 font-medium leading-none">Birim Başına Maliyet</p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg md:text-2xl font-black text-emerald-400 tracking-tight leading-none">
                        {finalPrice.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons Footer */}
            <div className="border-t border-slate-200/80 pt-3 md:pt-4 flex items-center justify-end">
              <button
                id="btn-detail-add-calc"
                onClick={() => {
                   onAddToCalculator(product, currentSelectionsDetails);
                   onClose();
                }}
                className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-[12px] py-3 px-5 rounded-xl shadow-md transition-all cursor-pointer uppercase tracking-wider"
              >
                <Icons.Plus className="w-4 h-4" />
                Siparişe Ekle ve Hesapla
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
