import React, { useState, useMemo } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';

interface SizingPredictorProps {
  onApplyDistribution?: (distribution: { [size: string]: number }) => void;
}

interface AsortiPreset {
  id: string;
  name: string;
  ratio: { [size: string]: number };
  description: string;
}

const PRESETS: AsortiPreset[] = [
  {
    id: 'adult-std',
    name: 'Yetişkin Standart Paket (1-2-2-1)',
    ratio: { XS: 0, S: 1, M: 2, L: 2, XL: 1, XXL: 0 },
    description: 'A Takımları ve yetişkin sporcular için dengeli S, M, L, XL asorti seti. (Kutu başı 6 adet)'
  },
  {
    id: 'junior-std',
    name: 'Altyapı Genç Paket (2-3-3-2)',
    ratio: { XS: 2, S: 3, M: 3, L: 2, XL: 0, XXL: 0 },
    description: 'Spor okulları ve genç altyapı akademileri için XS, S, M boyutlarında asorti seti. (Kutu başı 10 adet)'
  },
  {
    id: 'big-sizes',
    name: 'Geniş / Ağır Yapı Paketi (0-1-2-2-1)',
    ratio: { XS: 0, S: 0, M: 1, L: 2, XL: 2, XXL: 1 },
    description: 'Geniş omuzlu, profesyonel basketbol veya kalın yapılı ekipler için XXL katsayılı asorti. (Kutu başı 6 adet)'
  },
  {
    id: 'kids-mix',
    name: 'Mini Çocuk Karışık Paket (3-4-3)',
    ratio: { XS: 3, S: 4, M: 3, L: 0, XL: 0, XXL: 0 },
    description: 'En küçük yaş grupları (8-11 yaş) için özel yoğunlaştırılmış mini asorti. (Kutu başı 10 adet)'
  }
];

interface FabricQuality {
  id: string;
  name: string;
  weightGsm: number; // gr/m2
  consumptionPerPiece: number; // kg per item
  description: string;
}

const FABRICS: FabricQuality[] = [
  { id: 'interlock', name: 'Mikro Polyester Interlok (140g/m²)', weightGsm: 140, consumptionPerPiece: 0.32, description: 'Yüksek mukavemetli, ince, esnek ve terletmeyen forma tekstili.' },
  { id: 'kumlama', name: 'Kumlama Örme Performans (160g/m²)', weightGsm: 160, consumptionPerPiece: 0.36, description: 'Gözenekli nefes alabilir profesyonel maç formaları dokusu.' },
  { id: 'double-face', name: 'Dry-Fit Çift Yüzlü Pike (150g/m²)', weightGsm: 150, consumptionPerPiece: 0.34, description: 'İç yüzü pamuk hissi veren, çift katmanlı premium kumaş kalitesi.' },
  { id: 'suprem', name: 'Pamuk Penye Süprem (180g/m²)', weightGsm: 180, consumptionPerPiece: 0.40, description: 'Daha kalın, sunum tişörtleri ve seyahat eşofmanları için ideal ham kumaş.' }
];

export function SizingPredictor({ onApplyDistribution }: SizingPredictorProps) {
  const [selectedPresetId, setSelectedPresetId] = useState<string>('adult-std');
  const [packCount, setPackCount] = useState<number>(20);
  const [selectedFabricId, setSelectedFabricId] = useState<string>('interlock');
  
  // Custom ratios for custom adjustments
  const [customRatio, setCustomRatio] = useState<{ [size: string]: number }>({
    XS: 1, S: 2, M: 2, L: 2, XL: 1, XXL: 0
  });

  const activePreset = useMemo(() => {
    return PRESETS.find(p => p.id === selectedPresetId);
  }, [selectedPresetId]);

  const activeRatio: Record<string, number> = useMemo(() => {
    if (selectedPresetId === 'custom') {
      return customRatio;
    }
    return activePreset ? (activePreset.ratio as Record<string, number>) : { XS: 0, S: 1, M: 2, L: 2, XL: 1, XXL: 0 };
  }, [selectedPresetId, activePreset, customRatio]);

  const activeFabric = useMemo(() => {
    return FABRICS.find(f => f.id === selectedFabricId) || FABRICS[0];
  }, [selectedFabricId]);

  // Adjust custom ratios helper
  const handleRatioChange = (size: string, val: number) => {
    setCustomRatio(prev => ({
      ...prev,
      [size]: Math.max(0, val)
    }));
  };

  // Compute total ratios and items
  const itemsInSinglePack = useMemo(() => {
    return Object.values(activeRatio).reduce((sum: number, r: number) => sum + r, 0);
  }, [activeRatio]);

  const totalCalculatedItems = useMemo(() => {
    return itemsInSinglePack * packCount;
  }, [itemsInSinglePack, packCount]);

  // Calculate sizing distribution
  const distribution: Record<string, number> = useMemo(() => {
    const dist: Record<string, number> = {};
    Object.entries(activeRatio).forEach(([size, ratioVal]) => {
      dist[size] = (ratioVal as number) * packCount;
    });
    return dist;
  }, [activeRatio, packCount]);

  // Calculate fabric requirements
  const fabricStats = useMemo(() => {
    const totalKg = totalCalculatedItems * activeFabric.consumptionPerPiece;
    // Typical fabric width is 1.5 meters. GSM is gr/m2.
    // 1 meter length of fabric = 1.5m * weightGsm grams = (1.5 * weightGsm) / 1000 kg.
    const kgPerMeter = (1.5 * activeFabric.weightGsm) / 1000;
    const totalMeters = totalKg / (kgPerMeter || 1);
    
    return {
      totalKg: Math.round(totalKg * 10) / 10,
      totalMeters: Math.round(totalMeters * 10) / 10,
      wasteEstimateKg: Math.round((totalKg * 0.12) * 10) / 10 // Typically 12% waste on layout cutting
    };
  }, [totalCalculatedItems, activeFabric]);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <div className="bg-indigo-500/10 p-2.5 rounded-xl text-indigo-700">
          <Icons.Layers className="w-5 h-5 text-indigo-600" />
        </div>
        <div>
          <h3 className="font-extrabold text-base text-slate-900 leading-tight">
            Kumaş Asorti ve Paketleme Sistemi
          </h3>
          <p className="text-xs text-slate-500">Asorti katsayıları, paketleme matrisleri ve ham kumaş rulo sarfiyat simülasyonu</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 text-left">
        {/* Left column: Setup & Config */}
        <div className="space-y-4">
          
          {/* Preset Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-2">Asorti Paket Şablonu</label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPresetId(p.id)}
                  className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedPresetId === p.id
                      ? 'bg-indigo-550 border-indigo-600 text-white shadow-xs'
                      : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-800'
                  }`}
                >
                  <span className="text-xs font-black block">{p.name}</span>
                  <span className={`text-[10px] mt-1 block leading-normal ${selectedPresetId === p.id ? 'text-white/80' : 'text-slate-450'}`}>
                    {p.description}
                  </span>
                </button>
              ))}
              
              <button
                type="button"
                onClick={() => setSelectedPresetId('custom')}
                className={`flex flex-col p-3 rounded-2xl border text-left transition-all cursor-pointer md:col-span-2 ${
                  selectedPresetId === 'custom'
                    ? 'bg-indigo-550 border-indigo-600 text-white shadow-xs'
                    : 'bg-slate-50/50 border-slate-200 hover:bg-slate-50 text-slate-800'
                }`}
              >
                <span className="text-xs font-black block">⚙️ Özel Asorti Oranı Belirle</span>
                <span className={`text-[10px] mt-1 block leading-normal ${selectedPresetId === 'custom' ? 'text-white/80' : 'text-slate-450'}`}>
                  Beden oran katsayılarını manuel sıfırdan düzenleyerek siparişi hesaplayın.
                </span>
              </button>
            </div>
          </div>

          {/* If Custom, Show adjustments */}
          {selectedPresetId === 'custom' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="bg-indigo-50/40 p-4 border border-indigo-100 rounded-2xl"
            >
              <h4 className="text-xs font-extrabold text-indigo-950 mb-3 block">Münferit Paket Beden Katsayıları</h4>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
                {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <div key={sz} className="flex flex-col items-center">
                    <span className="text-xs font-black text-slate-700 bg-white border border-slate-200 w-8 h-8 rounded-full flex items-center justify-center mb-1.5 shadow-2xs">
                      {sz}
                    </span>
                    <input
                      type="number"
                      min="0"
                      max="20"
                      value={customRatio[sz] || 0}
                      onChange={(e) => handleRatioChange(sz, parseInt(e.target.value) || 0)}
                      className="w-full text-center bg-white border border-slate-200 rounded-xl py-1 text-xs font-extrabold text-slate-900 focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Number of Packs */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider">Planlanan Asorti Paket Adedi (Kutu)</label>
              <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg">{packCount} Kutu</span>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="1"
                max="500"
                value={packCount}
                onChange={(e) => setPackCount(parseInt(e.target.value) || 1)}
                className="w-full accent-indigo-600 bg-slate-100 h-1.5 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="number"
                min="1"
                value={packCount}
                onChange={(e) => setPackCount(parseInt(e.target.value) || 1)}
                className="w-16 text-center bg-slate-50 border border-slate-200 rounded-xl p-1 text-xs font-black"
              />
            </div>
          </div>

          {/* Fabric Quality selection */}
          <div>
            <label className="block text-[11px] font-bold text-slate-450 uppercase tracking-wider mb-2">Kumaş Kalitesi & Dokuması</label>
            <select
              value={selectedFabricId}
              onChange={(e) => setSelectedFabricId(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 text-slate-800 rounded-xl p-2.5 focus:outline-hidden focus:ring-1 focus:ring-indigo-500 font-extrabold font-semibold"
            >
              {FABRICS.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} - ({Math.round(f.consumptionPerPiece * 1000)} gr/adet)
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-400 mt-1 font-bold">
              ℹ️ {activeFabric.description}
            </p>
          </div>

        </div>

        {/* Right column: Outlining calculation results */}
        <div className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-200/50">
              <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Metraj ve Sarfiyat Özeti</span>
              <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-md flex items-center gap-1 uppercase">
                <Icons.TrendingUp className="w-3.5 h-3.5" /> Kesim Doğruluğu ~%99.2
              </span>
            </div>

            {/* Overall totals */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">TOPLAM ÜRETİM</span>
                <span className="text-sm font-black text-slate-900 mt-0.5 block">{totalCalculatedItems} Adet</span>
                <span className="text-[9px] text-slate-400 font-semibold">{packCount} Kutu × {itemsInSinglePack} ad.</span>
              </div>
              <div className="bg-white border border-slate-100 rounded-xl p-3 shadow-2xs">
                <span className="text-[9px] font-bold text-slate-400 block uppercase">PLANLANAN KUMAŞ</span>
                <span className="text-sm font-black text-indigo-700 mt-0.5 block">{fabricStats.totalKg} KG</span>
                <span className="text-[9px] text-slate-400 font-semibold">Yaklaşık {fabricStats.totalMeters} Metre Tül</span>
              </div>
            </div>

            {/* Size breakdown distribution list */}
            <div>
              <span className="text-[10px] font-black text-slate-400 block uppercase mb-2">Asorti Adet Dağılım Detayı</span>
              <div className="space-y-2">
                {Object.entries(distribution).map(([size, count]) => {
                  const percentage = totalCalculatedItems > 0 ? (count / totalCalculatedItems) * 100 : 0;
                  return (
                    <div key={size} className="flex items-center gap-3">
                      <span className="w-8 text-xs font-black text-slate-800">{size}</span>
                      <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-600 h-full rounded-full transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <span className="w-16 text-right text-xs font-extrabold text-slate-900">{count} Adet</span>
                      <span className="w-10 text-right text-[10px] font-bold text-slate-400">%{Math.round(percentage)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Wastage Estimate Alert */}
            <div className="p-3 bg-amber-50 border border-amber-100 rounded-xl flex items-start gap-2.5">
              <Icons.AlertOctagon className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-left">
                <span className="text-[9px] font-black text-amber-800 uppercase tracking-wider block">Yüzde Askı / Fire Hesabı</span>
                <p className="text-[10px] text-amber-700 font-bold leading-tight mt-0.5">
                  Lazer kesimde %12 şablon fire payı öngörülmektedir. Ekstra <strong>{fabricStats.wasteEstimateKg} KG</strong> fire payıyla birlikte top siparişi girilmesi tavsiye olunur.
                </p>
              </div>
            </div>

          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between gap-2">
            <p className="text-[9px] text-slate-450 font-bold leading-normal">
              Bu asorti matrisi kalıp yerleştirme yazılımına (CAD) entegre edilerek direkt pastal planına aktarılabilir.
            </p>
            {onApplyDistribution && (
              <button
                type="button"
                onClick={() => onApplyDistribution(distribution)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-2 px-3.5 rounded-xl shrink-0 flex items-center gap-1 shadow-xs active:scale-95 transition-all cursor-pointer"
              >
                <Icons.Check className="w-3.5 h-3.5" />
                Matrisi Uygula
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
