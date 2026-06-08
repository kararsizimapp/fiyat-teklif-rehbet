/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Product, SelectedOptionState, BrandInfo, CategoryInfo } from '../types';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface ProductCardProps {
  key?: string | number;
  product: Product;
  brands: BrandInfo[];
  categories: CategoryInfo[];
  onAddToCalculator: (product: Product, selectedSelections: SelectedOptionState[]) => void;
  onOpenDetail: (product: Product, initialSelections: SelectedOptionState[]) => void;
}

export function ProductCard({ product, brands, categories, onAddToCalculator, onOpenDetail }: ProductCardProps) {
  // Store selected option states by option.id -> choice.name
  const [selections, setSelections] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    (product.options || []).forEach(opt => {
      if (opt && opt.choices && opt.choices.length > 0) {
        initial[opt.id] = opt.choices[0].name;
      }
    });
    return initial;
  });

  const [currentImgIndex, setCurrentImgIndex] = useState<number>(0);
  const imagesList = useMemo(() => {
    return product.images && product.images.length > 0 ? product.images : [product.image];
  }, [product.image, product.images]);

  const brandInfo = useMemo(() => {
    return brands.find(b => b.name === product.brand);
  }, [brands, product.brand]);

  const categoryInfo = useMemo(() => {
    return categories.find(c => c.id === product.category);
  }, [categories, product.category]);

  // Calculate dynamic current price based on selected options
  const selectionDetails = useMemo<SelectedOptionState[]>(() => {
    const list: SelectedOptionState[] = [];
    (product.options || []).forEach(opt => {
      const selectedChoiceName = selections[opt.id];
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
    return list;
  }, [selections, product.options]);

  const priceImpact = useMemo(() => {
    return selectionDetails.reduce((sum, item) => sum + item.priceInfluence, 0);
  }, [selectionDetails]);

  const configuredPrice = product.basePrice + priceImpact;

  // Breakdown tax estimations
  const kdvAmount = (configuredPrice * product.kdvRate) / 100;
  const totalPriceIncTax = configuredPrice + kdvAmount;

  const handleOptionChange = (optionId: string, choiceName: string) => {
    setSelections(prev => ({
      ...prev,
      [optionId]: choiceName
    }));
  };

  return (
    <motion.div
      id={`product-card-${product.id}`}
      layout
      initial={{ opacity: 0, x: -45 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 100, damping: 15 }}
      className="bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden flex flex-col h-full group/card"
    >
      {/* Product Image & Badges with portrait aspect to prevent empty sides */}
      <div className="relative aspect-[4/5] w-full bg-white overflow-hidden group flex items-center justify-center border-b border-slate-100">
        <div className="w-full h-full relative cursor-pointer flex items-center justify-center" onClick={() => onOpenDetail(product, selectionDetails)}>
          <motion.img
            key={currentImgIndex}
            src={imagesList[currentImgIndex]}
            alt={product.name}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0.4 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Quick look backdrop overlay on hover */}
        <div 
          onClick={() => onOpenDetail(product, selectionDetails)}
          className="absolute inset-0 bg-slate-900/5 opacity-0 group-hover/card:opacity-100 transition-opacity duration-300 flex items-center justify-center cursor-pointer z-10"
        >
          <div className="bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl text-slate-900 font-extrabold text-[11px] shadow-lg border border-white/40 flex items-center gap-2 transform translate-y-4 group-hover/card:translate-y-0 transition-all duration-300 select-none">
            <Icons.Eye className="w-4 h-4 text-emerald-650" />
            Hızlı Önizleme
          </div>
        </div>

        {/* Carousel Navigation Buttons - only show if there are multiple images */}
        {imagesList.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImgIndex(prev => (prev === 0 ? imagesList.length - 1 : prev - 1));
              }}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-20"
            >
              <Icons.ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setCurrentImgIndex(prev => (prev === imagesList.length - 1 ? 0 : prev + 1));
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 bg-white/95 hover:bg-white text-slate-800 p-1.5 rounded-full shadow-md cursor-pointer opacity-0 group-hover/card:opacity-100 transition-opacity duration-200 z-20"
            >
              <Icons.ChevronRight className="w-4 h-4" />
            </button>

            {/* Carousel Dots */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-20 bg-slate-900/40 backdrop-blur-3xs px-2.5 py-1 rounded-full">
              {imagesList.map((_, idx) => (
                <button
                  key={idx}
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentImgIndex(idx);
                  }}
                  className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${
                    idx === currentImgIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/80'
                  }`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Product Body */}
      <div className="p-4 flex-1 flex flex-col">
        {/* Dynamic Brand Logo Row with custom fallback */}
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-800">{product.brand}</span>
            {product.collection && (
              <span className="text-orange-500 font-extrabold text-[9px] uppercase tracking-wider">
                • {product.collection}
              </span>
            )}
          </div>
          
          {categoryInfo && (
            <span className="text-[9px] font-extrabold text-slate-400 bg-slate-50 border border-slate-100 px-1.5 py-0.5 rounded-md uppercase">
              {categoryInfo.name}
            </span>
          )}
        </div>

        <h3 className="font-extrabold text-sm text-slate-900 tracking-tight leading-snug line-clamp-2 mt-2 uppercase transition-all duration-300 hover:text-emerald-600">
          {product.name}
        </h3>

        {/* Pricing Segment */}
        <div className="mt-auto pt-3.5 border-t border-slate-100">
          <div className="flex items-baseline justify-between mb-2">
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Ürün Fiyatı</div>
              <div className="text-xl font-black text-slate-900 tracking-tight leading-none mt-1">
                {totalPriceIncTax.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-xs font-semibold select-none">TL</span>
              </div>
            </div>
            {/* Tax Info Dropdown badge */}
            <div className="text-right">
              <span className="inline-block text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-sm">
                KDV %{product.kdvRate} Dahil
              </span>
              <div className="text-[10px] text-slate-400 font-semibold mt-0.5">
                KDV Hariç: {configuredPrice.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
              </div>
            </div>
          </div>

          {/* Actions Column */}
          <div className="grid grid-cols-2 gap-2 mt-3.5">
            <button
              id={`btn-detail-${product.id}`}
              onClick={() => onOpenDetail(product, selectionDetails)}
              className="flex items-center justify-center gap-1.5 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 active:bg-slate-100 text-slate-700 font-semibold text-xs py-2.5 px-3 rounded-xl transition-all cursor-pointer"
            >
              <Icons.Eye className="w-3.5 h-3.5" />
              Detayları Gör
            </button>
            <button
              id={`btn-calc-add-${product.id}`}
              onClick={() => onAddToCalculator(product, selectionDetails)}
              className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs py-2.5 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <Icons.Plus className="w-3.5 h-3.5" />
              Hesapla
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
