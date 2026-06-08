/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { CalculatorItem } from '../types';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QuotationContractModal } from './QuotationContractModal';

interface CalculatorProps {
  basket: CalculatorItem[];
  onUpdateQuantity: (itemId: string, newQty: number) => void;
  onRemoveItem: (itemId: string) => void;
  onClearAll: () => void;
  onUpdateCustomProperties?: (itemId: string, properties: Partial<CalculatorItem>) => void;
}

export function Calculator({ 
  basket, 
  onUpdateQuantity, 
  onRemoveItem, 
  onClearAll,
  onUpdateCustomProperties 
}: CalculatorProps) {
  // Calculator settings state
  const [globalDiscount, setGlobalDiscount] = useState<number>(0);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [installmentMonths, setInstallmentMonths] = useState<number>(1); // 1 = Tek Çekim (Peşin)
  const [interestRate, setInterestRate] = useState<number>(3.5); // Monthly interest %

  // AI evaluation states
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Expanded items in the basket for Baskı Matrisi / Customization Details
  const [expandedItemCustomizer, setExpandedItemCustomizer] = useState<{ [itemId: string]: boolean }>({});

  // Corporate contract modal trigger list
  const [isContractOpen, setIsContractOpen] = useState<boolean>(false);

  // Compute total dynamic items quantity
  const totalItemCount = useMemo(() => {
    return basket.reduce((acc, current) => acc + current.quantity, 0);
  }, [basket]);

  // Kademeli Sipariş İskonto ve Bayi Seviye Motoru (Tiered B2B Pricing)
  const b2bTierInfo = useMemo(() => {
    return { 
      tier: 'Standart Alıcı', 
      discount: 0, 
      badge: 'Standart Üye', 
      color: 'bg-slate-800 text-slate-400 border border-slate-700/60', 
      nextTierQty: null 
    };
  }, []);

  // Math computations including Customization Hub Print fees
  const totals = useMemo(() => {
    let rawProductBase = 0;
    let optionTotalCost = 0;
    let totalOtv = 0;
    let totalKdv = 0;
    let customizationTotalFees = 0;

    basket.forEach((item) => {
      // 1. Calculate active options impact
      const lineUnitOptions = item.selectedSelections.reduce((sum, sel) => sum + sel.priceInfluence, 0);
      
      // 2. Customization Hub Printing additions fee math:
      // Sırt İsmi (+100 TL), Sırt No (+50 TL), Sponsor Logo (+80 TL), Arma tipi (+120 TL)
      let customFeePerUnit = 0;
      if (item.customPlayerName && item.customPlayerName.trim().length > 0) {
        customFeePerUnit += 100;
      }
      if (item.customPlayerNumber && item.customPlayerNumber.trim().length > 0) {
        customFeePerUnit += 50;
      }
      if (item.customSleeveLogo && item.customSleeveLogo.trim().length > 0) {
        customFeePerUnit += 80;
      }
      if (item.customCrestStyle && item.customCrestStyle !== 'Baskısız' && item.customCrestStyle.trim().length > 0) {
        customFeePerUnit += 120;
      }

      customizationTotalFees += customFeePerUnit * item.quantity;

      const singleUnitBeforeTax = item.basePrice + lineUnitOptions + customFeePerUnit;

      const singleUnitKdv = (singleUnitBeforeTax * item.kdvRate) / 100;

      rawProductBase += item.basePrice * item.quantity;
      optionTotalCost += lineUnitOptions * item.quantity;
      totalOtv = 0;
      totalKdv += singleUnitKdv * item.quantity;
    });

    const subTotalIncTax = rawProductBase + optionTotalCost + customizationTotalFees + totalKdv;

    // Apply Tiered B2B Wholesale discount
    const b2bDiscountAmount = (subTotalIncTax * b2bTierInfo.discount) / 100;
    const priceAfterB2bDiscount = subTotalIncTax - b2bDiscountAmount;

    // Apply campaign global discount
    const discountAmount = (priceAfterB2bDiscount * globalDiscount) / 100;
    const priceAfterDiscount = priceAfterB2bDiscount - discountAmount;

    // Add shipping fee
    const priceAfterShipping = priceAfterDiscount + (basket.length > 0 ? shippingFee : 0);

    // Installment interest calculations (Taksit ve Vade Farkı)
    const originalTotalWithShipping = priceAfterShipping;
    let interestCost = 0;
    let finalGrossTotal = originalTotalWithShipping;

    if (installmentMonths > 1) {
      const interestMultiplier = (installmentMonths * (interestRate / 100));
      interestCost = originalTotalWithShipping * interestMultiplier;
      finalGrossTotal = originalTotalWithShipping + interestCost;
    }

    const monthlyPaymentVal = finalGrossTotal / installmentMonths;

    return {
      rawProductBase,
      optionTotalCost,
      customizationTotalFees,
      totalOtv,
      totalKdv,
      subTotalIncTax,
      b2bDiscountAmount,
      discountAmount,
      priceAfterDiscount,
      priceAfterShipping,
      interestCost,
      finalGrossTotal,
      monthlyPaymentVal
    };
  }, [basket, b2bTierInfo.discount, globalDiscount, shippingFee, installmentMonths, interestRate]);

  // Revert installments to 1 if basket amount falls below 20,000 TL
  const isInstallmentAllowed = totals.subTotalIncTax >= 20000;

  React.useEffect(() => {
    if (!isInstallmentAllowed && installmentMonths > 1) {
      setInstallmentMonths(1);
    }
  }, [isInstallmentAllowed, installmentMonths]);

  // Handle local print quotation triggered programmatically
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const basketLinesHtml = basket.map(item => {
      const optionsStr = item.selectedSelections.length > 0 
        ? item.selectedSelections.map(s => `${s.optionName}: ${s.choiceName}`).join(', ') 
        : 'Standart Opsiyon';
      
      const customNotes = [
        item.customPlayerName ? `Sırt İsmi: ${item.customPlayerName}` : '',
        item.customPlayerNumber ? `Sırt No: ${item.customPlayerNumber}` : '',
        item.customSleeveLogo ? `Sponsor: ${item.customSleeveLogo}` : '',
        item.customCrestStyle ? `Arma: ${item.customCrestStyle}` : ''
      ].filter(Boolean).join(' | ') || 'Baskısız';

      const singleUnitPrice = item.basePrice + item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
      const kdvAmount = (singleUnitPrice * item.kdvRate) / 100;
      const totalCol = (singleUnitPrice + kdvAmount) * item.quantity;

      return `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 12px; font-size: 13px; color: #1e293b;">
            <strong>${item.productName}</strong><br>
            <span style="font-size: 11px; color: #64748b;">${item.brand} | ${optionsStr}</span><br>
            <span style="font-size: 10px; color: #0284c7; font-weight: bold;">[Baskı Özelleştirme] ${customNotes}</span>
          </td>
          <td style="padding: 12px; font-size: 13px; text-align: center; color: #334155;">${item.quantity} adet</td>
          <td style="padding: 12px; font-size: 13px; text-align: right; color: #334155;">%${item.kdvRate}</td>
          <td style="padding: 12px; font-size: 13px; text-align: right; color: #0f172a; font-weight: 600;">
            ${totalCol.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
          </td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Fiyat Hesaplama Özet Raporu</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 40px; color: #0f172a; line-height: 1.5; }
            .header { display: flex; justify-between: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 20px; margin-bottom: 30px; }
            .logo { font-size: 20px; font-weight: 800; color: #059669; }
            .details { font-size: 12px; color: #475569; text-align: right; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 35px; }
            th { background-color: #f1f5f9; padding: 12px; font-size: 11px; text-transform: uppercase; font-weight: 700; text-align: left; color: #475569; }
            .totals { width: 330px; margin-left: auto; space-y: 10px; }
            .row { display: flex; justify-content: space-between; font-size: 13px; padding: 6px 0; border-bottom: 1px solid #f1f5f9; }
            .grand-total { border-top: 2px solid #0f172a; border-bottom: none; font-size: 18px; font-weight: 900; color: #059669; padding-top: 10px; }
            .notes { margin-top: 50px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; padding-top: 15px; }
          </style>
        </head>
        <body>
          <div class="header" style="display: flex; justify-content: space-between; align-items: center;">
            <div>
              <div class="logo">Ürün Fiyat Listesi & Hesaplama</div>
              <div style="font-size: 13px; color: #64748b; margin-top: 4px;">Detaylı Fiyat Teklifi ve Vergi Özeti</div>
            </div>
            <div class="details">
              <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br>
              <strong>Belge No:</strong> PR-${Math.floor(Math.random() * 89999 + 10000)}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="text-align: left;">Ürün ve Yapılandırma detayı</th>
                <th style="text-align: center; width: 80px;">Adet</th>
                <th style="text-align: right; width: 60px;">KDV</th>
                <th style="text-align: right; width: 140px;">Toplam Tutar</th>
              </tr>
            </thead>
            <tbody>
              ${basketLinesHtml}
            </tbody>
          </table>

          <div class="totals">
            <div class="row">
              <span>Ürünler Taban Toplamı:</span>
              <span>${(totals.rawProductBase).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            <div class="row">
              <span>Donanım Opsiyon Farkları:</span>
              <span>+${(totals.optionTotalCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            <div class="row">
              <span>Baskı / Arma Matris Maliyetleri:</span>
              <span>+${(totals.customizationTotalFees).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            <div class="row">
              <span>Toplam KDV Vergisi:</span>
              <span>+${(totals.totalKdv).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            ${totals.b2bDiscountAmount > 0 ? `
              <div class="row" style="color: #10b981; font-weight: bold;">
                <span>Kademeli B2B Sipariş İskonto (%${b2bTierInfo.discount}):</span>
                <span>-${(totals.b2bDiscountAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
            ${globalDiscount > 0 ? `
              <div class="row">
                <span>Ek Promosyon İndirimi (%${globalDiscount}):</span>
                <span style="color: #dc2626;">-${(totals.discountAmount).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
            <div class="row">
              <span>Yurtiçi Kargo Bedeli:</span>
              <span>+${(totals.priceAfterDiscount > 0 ? shippingFee : 0).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            ${installmentMonths > 1 ? `
              <div class="row">
                <span>Bank Vade Farkı (${installmentMonths} Taksit / Aylık %${interestRate}):</span>
                <span>+${(totals.interestCost).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
            <div class="row grand-total">
              <span>GENEL TOPLAM:</span>
              <span>${(totals.finalGrossTotal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            ${installmentMonths > 1 ? `
              <div class="row" style="border: none; font-size: 11px; color: #475569; font-weight: bold; text-align: right; justify-content: flex-end; gap: 8px;">
                <span>AYLIK TAKSİT:</span>
                <span style="font-size: 14px; color: #000;">${installmentMonths} Ay x ${(totals.monthlyPaymentVal).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
          </div>

          <div class="notes">
            <strong>Yasal Bilgilendirme Notu:</strong><br>
            Bu hesaplama dökümü bilgilendirme amaçlı olup resmi fatura yerine geçmez. Seçilen ürünlerin vergi oranları (KDV, ÖTV), Türkiye Cumhuriyeti vergi yükümlülüklerine ve ürün kategorilerine göre otomatik yansıtılmıştır. Gerçek satın alımlarda satıcı fiyat politikası farklılık gösterebilir.
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Sipariş ve Excel Aktarım Köprüsü (WhatsApp)
  const handleWhatsAppShare = () => {
    if (basket.length === 0) return;

    let text = `*HUMMEL TEAMWEAR KURUMSAL SİPARİŞİ AND TEKLİF DETAYI*\n`;
    text += `===============================================\n`;
    text += `Sipariş No: HM-${Math.floor(Math.random() * 89999 + 10000)}\n`;
    text += `Tarih: ${new Date().toLocaleDateString('tr-TR')}\n\n`;
    text += `*TALEP EDİLEN ÜRÜNLER & ÖZELLEŞTİRMELER:*\n`;

    basket.forEach((item, idx) => {
      const customs = [
        item.customPlayerName ? `İsim: ${item.customPlayerName}` : '',
        item.customPlayerNumber ? `No: ${item.customPlayerNumber}` : '',
        item.customSleeveLogo ? `Logo: ${item.customSleeveLogo}` : '',
        item.customCrestStyle ? `Arma: ${item.customCrestStyle}` : ''
      ].filter(Boolean).join(' | ') || 'Özelleştirme Yok';

      text += `${idx + 1}. *${item.productName}* (${item.brand})\n`;
      text += `   - Miktar: ${item.quantity} Adet\n`;
      text += `   - Yapılandırma: ${customs}\n\n`;
    });

    text += `-----------------------------------------------\n`;
    text += `*Ödeme Şekli:* ${installmentMonths > 1 ? `${installmentMonths} Ay Taksitli` : 'Peşin / Tek Çekim'}\n`;
    text += `*HESAPLANAN TOPLAM TUTAR:* *${totals.finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL*\n\n`;
    text += `_Siparişimizin üretime alınması ve onaylanması hususunu rica ederiz._`;

    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // WhatsApp Sipariş ve Excel Aktarım Köprüsü (CSV / Excel İhracat)
  const handleExportCSV = () => {
    if (basket.length === 0) return;

    // Headers with Turkish-BOM so Excel loads chars beautifully
    let csvContent = "\uFEFF";
    csvContent += "Urun Kodu;Urun Adi;Marka;Miktar;Sirt Ismi;Sirt Numarasi;Sponsor Logo;Arma Tipi;Birim Fiyat;KDV Orani;Toplam Tutar\r\n";

    basket.forEach((item) => {
      const selectionsPrice = item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
      const grossSinglePrice = (item.basePrice + selectionsPrice) * (1 + (item.otvRate / 100)) * (1 + (item.kdvRate / 100));
      
      csvContent += `${item.productId};` +
                    `"${item.productName}";` +
                    `"${item.brand}";` +
                    `${item.quantity};` +
                    `"${item.customPlayerName || ''}";` +
                    `"${item.customPlayerNumber || ''}";` +
                    `"${item.customSleeveLogo || ''}";` +
                    `"${item.customCrestStyle || 'Baskısız'}";` +
                    `${item.basePrice.toFixed(2)};` +
                    `%${item.kdvRate};` +
                    `${(grossSinglePrice * item.quantity).toFixed(2)}\r\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `hummel_b2b_siparis_teklifi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Send product state to server-side Gemini AI for comprehensive shopping advice
  const analyzeWithAI = async () => {
    if (basket.length === 0) return;
    setAiLoading(true);
    setAiError(null);
    setAiResponse(null);

    try {
      const response = await fetch('/api/analyze-basket', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          basket,
          globalDiscount,
          shippingFee,
          installmentMonths,
          interestRate,
          totals
        })
      });

      if (!response.ok) {
        throw new Error('Yapay zeka sunucusuna bağlanırken teknik bir hata meydana geldi.');
      }

      const val = await response.json();
      setAiResponse(val.advice);
    } catch (err: any) {
      setAiError(err.message || 'Bir hata oluştu.');
    } finally {
      setAiLoading(false);
    }
  };

  const toggleCustomizer = (itemId: string) => {
    setExpandedItemCustomizer(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  return (
    <div className="bg-slate-900 text-slate-100 rounded-3xl border border-slate-850 shadow-2xl p-6 relative flex flex-col h-full" id="calculator-panel">
      {/* Visual background atmospheric elements */}
      <div className="absolute top-0 right-0 w-44 h-44 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-550/5 rounded-full blur-2xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-850 pb-4 mb-4 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-500 p-2 rounded-xl text-slate-950">
            <Icons.Calculator className="w-5 h-5 font-black" />
          </div>
          <div className="text-left">
            <h2 className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
              B2B Hesaplama & Baskı Merkezi <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-bold px-2 py-0.5 rounded-full">Matris</span>
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">Baskı özelleştirmeli anlık takım teklif paneli</p>
          </div>
        </div>
        {basket.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-[10px] bg-slate-800/80 hover:bg-rose-950/40 hover:text-rose-450 active:scale-95 text-slate-400 font-bold px-2.5 py-1.5 rounded-lg border border-slate-700/60 transition-all cursor-pointer flex items-center gap-1"
          >
            <Icons.Trash2 className="w-3.5 h-3.5" />
            Temizle
          </button>
        )}
      </div>



      {/* Product List Segment */}
      <div className="flex-1 overflow-y-auto min-h-[160px] max-h-[380px] mb-4 space-y-2.5 pr-1.5 scrollbar-thin scrollbar-white">
        <AnimatePresence initial={false}>
          {basket.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-32 rounded-2xl border-2 border-dashed border-slate-800 flex flex-col items-center justify-center text-center p-4"
            >
              <Icons.ShoppingBag className="w-8 h-8 text-slate-600 mb-2 animate-bounce" />
              <p className="text-xs font-bold text-slate-400 leading-snug">Kampanya / Hesaplama listesi boş.</p>
              <p className="text-[10px] text-slate-550 mt-1">Ürün listesindeki "Hesaplama Tablosuna Ekle" butonunu kullanarak takım ürünleri yerleştirin.</p>
            </motion.div>
          ) : (
            basket.map((item) => {
              const itemOptionsPrice = item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
              
              // Customization printing additions
              let customPrintedFee = 0;
              if (item.customPlayerName && item.customPlayerName.trim().length > 0) customPrintedFee += 100;
              if (item.customPlayerNumber && item.customPlayerNumber.trim().length > 0) customPrintedFee += 50;
              if (item.customSleeveLogo && item.customSleeveLogo.trim().length > 0) customPrintedFee += 80;
              if (item.customCrestStyle && item.customCrestStyle !== 'Baskısız' && item.customCrestStyle.trim().length > 0) customPrintedFee += 120;

              const singleBeforeTax = item.basePrice + itemOptionsPrice + customPrintedFee;
              const unitKdv = (singleBeforeTax * item.kdvRate) / 100;
              const unitTotalIncTax = singleBeforeTax + unitKdv;

              const isCustomizerExpanded = !!expandedItemCustomizer[item.id];

              return (
                <motion.div
                  id={`calc-item-${item.id}`}
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20, scale: 0.95 }}
                  className="bg-slate-950/70 border border-slate-850 rounded-2xl p-3 flex flex-col gap-2"
                >
                  <div className="flex gap-3 items-center">
                    <div className="flex-1 min-w-0 text-left">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold text-white truncate mr-2">{item.productName}</span>
                        <button
                          onClick={() => onRemoveItem(item.id)}
                          className="text-slate-500 hover:text-rose-450 active:scale-95 transition-colors p-0.5 cursor-pointer"
                        >
                          <Icons.X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      {/* Brands + Category summary */}
                      <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {item.brand}
                      </div>

                      {item.selectedSelections.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.selectedSelections.map((s, sIdx) => (
                            <span key={sIdx} className="bg-slate-900 border border-slate-800 text-slate-300 text-[10px] font-bold px-1.5 py-0.5 rounded-md leading-none flex items-center gap-0.5">
                              {s.optionName}: <strong className="text-white font-black">{s.choiceName}</strong>
                              {s.priceInfluence !== 0 && (
                                <span className={`text-[8.5px] font-bold px-1 rounded-sm leading-none ml-1 ${
                                  s.priceInfluence > 0 ? 'bg-amber-950/40 text-amber-400' : 'bg-rose-950/40 text-rose-400'
                                }`}>
                                  {s.priceInfluence > 0 ? `+${s.priceInfluence}` : s.priceInfluence} TL
                                </span>
                              )}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Tax & quantity display */}
                      <div className="flex justify-between items-center mt-2.5">
                        {/* Quantity tools */}
                        <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                          <button
                            onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                            className="bg-slate-800 hover:bg-slate-755 p-1 rounded-md text-white active:scale-90 transition-all cursor-pointer"
                          >
                            <Icons.Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="text-xs font-bold text-white px-2 min-w-[16px] text-center">{item.quantity}</span>
                          <button
                            onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            className="bg-slate-800 hover:bg-slate-755 p-1 rounded-md text-white active:scale-90 transition-all cursor-pointer"
                          >
                            <Icons.Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>

                        {/* Item Subtotal with taxes */}
                        <div className="text-right">
                          <div className="text-xs font-black text-emerald-400 tracking-tight">
                            {(unitTotalIncTax * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
                          </div>
                          <div className="text-[9px] text-slate-500 font-semibold">
                            Adet: {unitTotalIncTax.toLocaleString('tr-TR', { maximumFractionDigits: 0 })} TL
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Logo, İsim ve Sırt Numarası Baskı Matrisi (Customization Hub Collapse Toggle) */}
                  <div className="border-t border-slate-900/60 pt-2 flex flex-col gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleCustomizer(item.id)}
                      className="flex items-center justify-between text-[10px] font-black text-blue-400 hover:text-blue-300 transition-colors uppercase cursor-pointer"
                    >
                      <span className="flex items-center gap-1.5">
                        <Icons.Palette className="w-3.5 h-3.5 text-blue-500" />
                        Logo & İsim ve Sırt Numarası Baskı Matrisi
                      </span>
                      <span>
                        {isCustomizerExpanded ? 'Seçenekleri Gizle ▴' : 'Baskı Detaylarını Düzenle ▾'}
                      </span>
                    </button>

                    <AnimatePresence>
                      {isCustomizerExpanded && onUpdateCustomProperties && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="bg-slate-950/80 border border-slate-900 rounded-xl p-3 grid grid-cols-2 gap-2 text-left"
                        >
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sırt Oyuncu İsmi (+100 TL)</label>
                            <input
                              type="text"
                              value={item.customPlayerName || ''}
                              onChange={(e) => onUpdateCustomProperties(item.id, { customPlayerName: e.target.value })}
                              placeholder="Örn: DEMİR"
                              className="bg-slate-900 text-xs font-bold text-white border border-slate-800 p-1.5 rounded-md focus:outline-hidden focus:border-blue-500 uppercase"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Sırt Numarası (+50 TL)</label>
                            <input
                              type="text"
                              maxLength={3}
                              value={item.customPlayerNumber || ''}
                              onChange={(e) => onUpdateCustomProperties(item.id, { customPlayerNumber: e.target.value })}
                              placeholder="Örn: 9"
                              className="bg-slate-900 text-xs font-bold text-white border border-slate-800 p-1.5 rounded-md focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Kol Sponsoru (+80 TL)</label>
                            <input
                              type="text"
                              value={item.customSleeveLogo || ''}
                              onChange={(e) => onUpdateCustomProperties(item.id, { customSleeveLogo: e.target.value })}
                              placeholder="Örn: Sponsor A.Ş."
                              className="bg-slate-900 text-xs font-bold text-white border border-slate-800 p-1.5 rounded-md focus:outline-hidden focus:border-blue-500"
                            />
                          </div>

                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Arma Pres Tarzı (+120 TL)</label>
                            <select
                              value={item.customCrestStyle || ''}
                              onChange={(e) => onUpdateCustomProperties(item.id, { customCrestStyle: e.target.value })}
                              className="bg-slate-900 text-xs font-bold text-white border border-slate-800 p-1.5 rounded-md focus:outline-hidden"
                            >
                              <option value="Baskısız">Armasız (Baskısız)</option>
                              <option value="Süblimasyon Entegre">Süblime Entegre (Düz)</option>
                              <option value="Nakış Dokuma Arma">Dokuma Nakış Sıcak Pres</option>
                              <option value="3D Kabartmalı Silikon">3D Kabartma Kadife Silikon</option>
                            </select>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

      {/* Dynamic Sliders and Config Parameters */}
      {basket.length > 0 && (
        <div className="space-y-4 border-t border-slate-800/80 pt-4 mb-4">
          <div className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest flex items-center gap-1">
            <Icons.Settings className="w-3.5 h-3.5 text-slate-400" />
            Ödeme ve Simülasyon Ayarları
          </div>

          {/* Discount Slider */}
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1.5">
              <span className="text-slate-300 flex items-center gap-1">
                <Icons.Percent className="w-3 h-3 text-emerald-500" /> Kampanya Ek İndirimi
              </span>
              <span className="text-emerald-400 font-extrabold">%{globalDiscount}</span>
            </div>
            <input
              type="range"
              min="0"
              max="50"
              step="1"
              value={globalDiscount}
              onChange={(e) => setGlobalDiscount(parseInt(e.target.value))}
              className="w-full accent-emerald-555 bg-slate-800 h-1.5 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="grid grid-cols-2 gap-3.5 text-left">
            {/* Installments selector */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Icons.CreditCard className="w-3 h-3 text-blue-400" /> Taksit Sayısı
              </label>
              <select
                value={installmentMonths}
                onChange={(e) => setInstallmentMonths(parseInt(e.target.value))}
                className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value={1}>Tek Çekim (Peşin)</option>
                <option value={2} disabled={!isInstallmentAllowed}>
                  2 Taksit {!isInstallmentAllowed ? '(Kilitli)' : ''}
                </option>
                <option value={3} disabled={!isInstallmentAllowed}>
                  3 Taksit {!isInstallmentAllowed ? '(Kilitli)' : ''}
                </option>
                <option value={6} disabled={!isInstallmentAllowed}>
                  6 Taksit {!isInstallmentAllowed ? '(Kilitli)' : ''}
                </option>
                <option value={12} disabled={!isInstallmentAllowed}>
                  12 Taksit {!isInstallmentAllowed ? '(Kilitli)' : ''}
                </option>
              </select>
              {!isInstallmentAllowed && (
                <div className="text-[9px] text-amber-500/90 font-medium leading-tight flex items-start gap-0.5 mt-1">
                  <Icons.AlertTriangle className="w-3 h-3 shrink-0" />
                  <span>Taksit imkanı 20.000 TL ve üzeri için seçilebilir.</span>
                </div>
              )}
            </div>

            {/* Custom Shipping Fee */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                <Icons.Truck className="w-3 h-3 text-amber-505" /> Kargo Bedeli
              </label>
              <select
                value={shippingFee}
                onChange={(e) => setShippingFee(parseInt(e.target.value))}
                className="w-full text-xs bg-slate-950 border border-slate-800 text-slate-200 rounded-lg p-2 focus:ring-1 focus:ring-emerald-500 focus:outline-hidden"
              >
                <option value={0}>Ücretsiz Kargo</option>
                <option value={150}>Yurtiçi Standart (150 TL)</option>
                <option value={350}>Uçak Kargo Hızlı (350 TL)</option>
              </select>
            </div>
          </div>

          {/* Monthly Bank Interest Slider for Installments */}
          {installmentMonths > 1 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-slate-950/80 border border-slate-850 rounded-2xl p-3 text-left"
            >
              <div className="flex justify-between text-[11px] font-semibold mb-1">
                <span className="text-slate-400">Aylık Banka Komisyon Oranı</span>
                <span className="text-blue-400 font-extrabold">%{interestRate}</span>
              </div>
              <input
                type="range"
                min="1.0"
                max="6.0"
                step="0.1"
                value={interestRate}
                onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                className="w-full accent-blue-500 bg-slate-800 h-1 appearance-none cursor-pointer"
              />
              <div className="text-[9px] text-slate-500 mt-1 leading-snug">Taksitli işlemlerde bankaların yansıttığı tahmini aylık vade farkı oranıdır.</div>
            </motion.div>
          )}
        </div>
      )}

      {/* Bill/Invoice Breakdown Area */}
      {basket.length > 0 ? (
        <div className="bg-slate-950 border border-slate-850 rounded-2xl p-4.5 space-y-2.5 shadow-inner mt-auto text-left">
          <div className="flex justify-between text-xs text-slate-400">
            <span>Ürün Taban Değeri:</span>
            <span>{totals.rawProductBase.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Donanım Opsiyon Farkları:</span>
            <span>+{totals.optionTotalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Dijital Baskı & Matris Farkı:</span>
            <span>+{totals.customizationTotalFees.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
          </div>
          <div className="flex justify-between text-xs text-slate-400">
            <span>Yasal KDV Toplamı:</span>
            <span>+{totals.totalKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
          </div>

          {b2bTierInfo.discount > 0 && (
            <div className="flex justify-between text-xs text-emerald-400 font-black">
              <span>Otomatik B2B İndirimi (-%{b2bTierInfo.discount}):</span>
              <span>-{totals.b2bDiscountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
          )}

          {globalDiscount > 0 && (
            <div className="flex justify-between text-xs text-rose-455 font-bold">
              <span>Ek Promosyon İndirimi (-%{globalDiscount}):</span>
              <span>-{totals.discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
          )}

          {shippingFee > 0 && (
            <div className="flex justify-between text-xs text-slate-450">
              <span>Kargo Bedeli:</span>
              <span>+{shippingFee.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
          )}

          {installmentMonths > 1 && totals.interestCost > 0 && (
            <div className="flex justify-between text-xs text-blue-400 font-bold">
              <span>Banka Vade Farkı ({installmentMonths} Ay):</span>
              <span>+{totals.interestCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
          )}

          <div className="border-t border-slate-800 pt-3 flex justify-between items-end">
            <div>
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Ödenecek Tutar</span>
              <div className="text-[9px] text-slate-550 font-medium">Vergiler ve masraflar dahil</div>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-emerald-400 tracking-tight">
                {totals.finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} TL
              </span>
            </div>
          </div>

          {/* Monthly Payment details fallback if installments selected */}
          {installmentMonths > 1 && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-2.5 flex justify-between items-center text-xs mt-2">
              <span className="text-slate-300 font-semibold">Taksitli Ödeme Planı:</span>
              <span className="font-extrabold text-white text-sm">
                {installmentMonths} Ay x {totals.monthlyPaymentVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL
              </span>
            </div>
          )}

          {/* Action buttons list */}
          <div className="flex flex-col gap-2.5 mt-4 pt-4 border-t border-slate-850">
            {/* Row 1: Print PDF & AI Analysis */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center justify-center gap-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-100 font-bold text-xs py-2.5 rounded-xl border border-slate-700 cursor-pointer transition-all"
              >
                <Icons.Printer className="w-3.5 h-3.5" />
                Yazdır / PDF Al
              </button>
              <button
                onClick={analyzeWithAI}
                disabled={aiLoading}
                className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs py-2.5 rounded-xl cursor-pointer disabled:opacity-50 transition-all shadow-xs"
              >
                <Icons.Sparkles className="w-3.5 h-3.5 text-slate-950 fill-current" />
                AI Analizi Al
              </button>
            </div>

            {/* Row 2: WhatsApp Share & CSV download */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-700 active:scale-95 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all shadow-xs border border-green-500/10"
              >
                <Icons.Share2 className="w-3.5 h-3.5" />
                WhatsApp Paylaş
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="flex items-center justify-center gap-1.5 bg-blue-650 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs py-2.5 rounded-xl cursor-pointer transition-all"
              >
                <Icons.FileSpreadsheet className="w-3.5 h-3.5" />
                Excel (CSV) Aktar
              </button>
            </div>

            {/* Row 3: Corporate Contract Exporter */}
            <button
              type="button"
              onClick={() => setIsContractOpen(true)}
              className="flex items-center justify-center gap-1.5 bg-linear-to-r from-indigo-650 to-purple-700 hover:opacity-95 active:scale-95 text-white font-extrabold text-xs py-3 rounded-xl cursor-pointer transition-all shadow-sm"
            >
              <Icons.FileText className="w-4 h-4 text-emerald-400" />
              Tek Tıkla Kurumsal Sözleşme İhraç Et
            </button>
          </div>
        </div>
      ) : null}

      {/* AI Advice Output Popover / Segment */}
      <AnimatePresence>
        {(aiLoading || aiResponse || aiError) && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            className="mt-4 bg-slate-950 border border-emerald-900/60 rounded-2xl p-4.5 relative overflow-hidden flex flex-col text-left"
          >
            {/* Top info and close */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-black text-emerald-400">
                <Icons.Sparkles className="w-3.5 h-3.5" />
                Gemini AI Alışveriş Danışmanı
              </div>
              <button
                onClick={() => {
                  setAiResponse(null);
                  setAiError(null);
                }}
                className="text-slate-500 hover:text-slate-300 transition-colors p-0.5 cursor-pointer"
              >
                <Icons.X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* AI Body */}
            {aiLoading && (
              <div className="flex flex-col items-center justify-center py-5 text-center">
                <Icons.RefreshCw className="w-6 h-6 animate-spin text-emerald-500 mb-2" />
                <span className="text-xs text-slate-400 font-medium animate-pulse">Seçilen ürünler analiz ediliyor, bütçe tüyoları hazırlanıyor...</span>
              </div>
            )}

            {aiError && (
              <div className="text-xs text-rose-400 p-2.5 bg-rose-950/20 border border-rose-900/35 rounded-lg flex items-start gap-1.5">
                <Icons.AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{aiError}</span>
              </div>
            )}

            {aiResponse && (
              <div className="text-xs text-slate-300 leading-relaxed max-h-[220px] overflow-y-auto whitespace-pre-wrap pr-1">
                {aiResponse}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Single click B2B quotation and distribution contract exporter modal */}
      <QuotationContractModal
        isOpen={isContractOpen}
        onClose={() => setIsContractOpen(false)}
        basket={basket}
        totals={totals}
        globalDiscount={globalDiscount}
        installmentMonths={installmentMonths}
      />
    </div>
  );
}
