import React, { useState } from 'react';
import * as Icons from 'lucide-react';
import { motion } from 'motion/react';
import { CalculatorItem } from '../types';

interface QuotationContractModalProps {
  isOpen: boolean;
  onClose: () => void;
  basket: CalculatorItem[];
  totals: {
    rawProductBase: number;
    optionTotalCost: number;
    totalOtv: number;
    totalKdv: number;
    subTotalIncTax: number;
    discountAmount: number;
    priceAfterDiscount: number;
    priceAfterShipping: number;
    interestCost: number;
    finalGrossTotal: number;
    monthlyPaymentVal: number;
  };
  globalDiscount: number;
  installmentMonths: number;
}

export function QuotationContractModal({
  isOpen,
  onClose,
  basket,
  totals,
  globalDiscount,
  installmentMonths
}: QuotationContractModalProps) {
  const [clubName, setClubName] = useState<string>("Samsun Gençlik ve Spor Kulübü");
  const [authorizedPerson, setAuthorizedPerson] = useState<string>("Mustafa Can Aygün");
  const [taxOffice, setTaxOffice] = useState<string>("Samsun Kurumlar V.D.");
  const [deliveryType, setDeliveryType] = useState<string>("Hummel Lojistik Deplasman Adresi Teslimat");
  const [contractNotes, setContractNotes] = useState<string>("Resmi altyapı akademisi ve spor okulu formaları Hummel Teamwear teknolojisiyle dikiş ve dijital baskı garantilidir.");

  if (!isOpen) return null;

  const handlePrintContract = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const documentNo = `HM-CON-${Math.floor(Math.random() * 899999 + 100000)}`;
    const lineHtml = basket.map((item, idx) => {
      const selectionsStr = item.selectedSelections.map(s => `${s.optionName}: ${s.choiceName}`).join(', ') || 'Standart';
      const singleBase = item.basePrice;
      const singleOptions = item.selectedSelections.reduce((sum, s) => sum + s.priceInfluence, 0);
      const grossSingle = (singleBase + singleOptions) * (1 + (item.kdvRate / 100));
      return `
        <tr style="border-bottom: 1px solid #cbd5e1;">
          <td style="padding: 10px; font-size: 11px; text-align: center;">${idx + 1}</td>
          <td style="padding: 10px; font-size: 11px;">
            <strong>${item.productName}</strong><br>
            <span style="font-size: 10px; color: #475569;">${item.brand} | Yapılandırma: ${selectionsStr}</span>
          </td>
          <td style="padding: 10px; font-size: 11px; text-align: center;">${item.quantity} Adet</td>
          <td style="padding: 10px; font-size: 11px; text-align: right;">${(singleBase + singleOptions).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
          <td style="padding: 10px; font-size: 11px; text-align: right;">%${item.kdvRate}</td>
          <td style="padding: 10px; font-size: 11px; text-align: right; font-weight: bold;">${(grossSingle * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Kurumsal Satış Sözleşmesi ve Fiyat Teklifi</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; padding: 45px; color: #0f172a; line-height: 1.4; font-size: 12px; }
            .contract-header { border-bottom: 2px solid #059669; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
            .logo-text { font-size: 24px; font-weight: 900; color: #059669; tracking-tight: -0.05em; }
            .title-block { text-align: center; margin-bottom: 25px; text-transform: uppercase; }
            .parties-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            .parties-table td { padding: 8px; border: 1px solid #e2e8f0; vertical-align: top; }
            .clause { margin-bottom: 15px; }
            .clause-title { font-weight: bold; font-size: 12px; text-transform: uppercase; color: #1e293b; margin-bottom: 4px; }
            table.items { width: 100%; border-collapse: collapse; margin: 15px 0; }
            table.items th { background-color: #f8fafc; padding: 10px; border: 1px solid #cbd5e1; font-weight: bold; text-align: left; font-size: 10px; text-transform: uppercase; }
            table.items td { border: 1px solid #cbd5e1; }
            .totals-block { width: 330px; margin-left: auto; margin-top: 15px; }
            .totals-row { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px dashed #e2e8f0; }
            .grand-total { font-size: 15px; font-weight: bold; color: #059669; border: none; padding-top: 8px; border-top: 2px solid #059669; }
            .signatures { display: flex; justify-content: space-between; margin-top: 45px; }
            .signature-box { width: 220px; text-align: center; border-top: 1px solid #000; padding-top: 10px; font-size: 11px; }
          </style>
        </head>
        <body>
          <div class="contract-header">
            <div>
              <div class="logo-text">hummel teamwear</div>
              <div style="font-size: 11px; color: #475569;">Kurumsal Tedarik ve Müşteri İlişkileri Direktörlüğü</div>
            </div>
            <div style="text-align: right; font-size: 11px;">
              <strong>Sözleşme No:</strong> ${documentNo}<br>
              <strong>Tarih:</strong> ${new Date().toLocaleDateString('tr-TR')}<br>
              <strong>Geçerlilik:</strong> 30 Takvim Günü
            </div>
          </div>

          <div class="title-block">
            <h2 style="margin: 0; font-size: 15px; font-weight: 850; tracking-tight: -0.02em;">KURUMSAL TEKSTİL TEDARİK VE MÜSABAKA SETLERİ SÖZLEŞMESİ</h2>
          </div>

          <table class="parties-table">
            <tr>
              <td style="width: 50%;">
                <strong>YÜKLENİCİ (SATICI):</strong><br>
                Hummel Spor Malzemeleri A.Ş.<br>
                Mersis No: 0465039234800012<br>
                Büyükdere Cad. No: 121, Şişli / İstanbul
              </td>
              <td>
                <strong>ALICI (KULÜP / KURUM):</strong><br>
                <strong>${clubName}</strong><br>
                <strong>Yetkili Temsilci:</strong> ${authorizedPerson}<br>
                <strong>Vergi Dairesi & No:</strong> ${taxOffice}<br>
                <strong>Sevk Tercihi:</strong> ${deliveryType}
              </td>
            </tr>
          </table>

          <div class="clause">
            <div class="clause-title">Madde 1 — Sözleşme Konusu ve Kapsamı</div>
            <div class="clause-text">Yüklenici, işbu sözleşme kapsamında Alıcı kulübün / okulun spor akademisi ve A Takım müsabakalarında kullanması amacıyla aşağıda dökümü yapılan özel tasarım dijital süblime kumlama formaları, eşofman takımlarını, koruyucu teknik spor dış giyim rüzgarlıkları ve entegre aksesuarları temin etmekle mükelleftir.</div>
          </div>

          <table class="items">
            <thead>
              <tr>
                <th style="width: 40px; text-align: center;">No</th>
                <th>Ürün ve Yapılandırma Açıklaması</th>
                <th style="width: 70px; text-align: center;">Adet</th>
                <th style="width: 100px; text-align: right;">Birim Taban (TL)</th>
                <th style="width: 55px; text-align: right;">KDV %</th>
                <th style="width: 120px; text-align: right;">KDV Dahil Toplam</th>
              </tr>
            </thead>
            <tbody>
              ${lineHtml}
            </tbody>
          </table>

          <div class="totals-block">
            <div class="totals-row">
              <span>Ürünler Taban Tutarı:</span>
              <span>${totals.rawProductBase.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            <div class="totals-row">
              <span>Ek donanım ve Arma İlavesi:</span>
              <span>+${totals.optionTotalCost.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            <div class="totals-row">
              <span>Toplam KDV %20 Vergisi:</span>
              <span>+${totals.totalKdv.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            ${totals.discountAmount > 0 ? `
              <div class="totals-row" style="color: #dc2626; font-weight: bold;">
                <span>Sözleşme İskontosu (-%${globalDiscount}):</span>
                <span>-${totals.discountAmount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
            <div class="totals-row grand-total">
              <span>ÖDENECEK SÖZLEŞME BEDELİ:</span>
              <span>${totals.finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
            </div>
            ${installmentMonths > 1 ? `
              <div class="totals-row" style="border: none; font-size: 11px; padding-top: 5px; justify-content: flex-end; gap: 8px;">
                <strong>Seçilen Vade Detayı:</strong>
                <span>${installmentMonths} Ay Taksit x ${totals.monthlyPaymentVal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
            ` : ''}
          </div>

          <div class="clause" style="margin-top: 15px;">
            <div class="clause-title">Madde 2 — Ödeme ve Vadelendirme Şartları</div>
            <div class="clause-text">Alıcı, toplam sözleşme bedeli olan <strong>${totals.finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</strong> bedeli, sözleşme imzasını takip eden 3 (üç) iş günü içerisinde yüklenicinin belirtilen resmi TL IBAN hesabına peşin veya mutabık kalınan ${installmentMonths > 1 ? `${installmentMonths} eşit taksitte` : 'tek çekimde'} ödemekle yükümlüdür. Ödemenin gecikmesi durumunda her takvim günü için temerrüt faizi yansıtılır.</div>
          </div>

          <div class="clause">
            <div class="clause-title">Madde 3 — Üretim, Lojistik ve Teslimat Süreleri</div>
            <div class="clause-text">Dijital kulüp armaları ve sırt numara transfer baskılarının vektörel olarak Alıcı tarafından onaylanmasını müteakip, üretim takvimi 15 (On Beş) iş günü olarak belirlenmiştir. Tamamlanan takım tekstil malları, Hummel sevkiyat güvencesiyle belirtilen deplasman/kamp adresine sevk edilecektir.</div>
          </div>

          <div class="clause">
            <div class="clause-title">Ek Müşteri Talepleri ve Notlar</div>
            <div class="clause-text" style="font-style: italic; background-color: #f8fafc; padding: 8px; border-left: 3px solid #059669;">
              ${contractNotes}
            </div>
          </div>

          <p style="font-size: 10px; color: #64748b; margin-top: 25px;">İşbu sözleşme 3 (üç) ana maddeden oluşmakta olup Alıcı ve Yüklenici temsilcileri tarafından mutabakatla imza altına alınmıştır.</p>

          <div class="signatures">
            <div class="signature-box">
              <strong>YÜKLENİCİ TEMSİLCİSİ</strong><br>
              Hummel Kurumsal Satış Md.<br>
              Kaşe / İmza
            </div>
            <div class="signature-box">
              <strong>ALICI TEMSİLCİSİ</strong><br>
              ${authorizedPerson}<br>
              İmza
            </div>
          </div>

          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[90vh]">
        
        {/* Modal Top */}
        <div className="bg-slate-900 text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Icons.FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-extrabold text-base tracking-tight text-white">Sözleşme ve Kurumsal Teklif Hazırlama</h3>
              <p className="text-[10px] text-slate-400 font-medium">B2B okullar, kolejler ve kulüpler için PDF sözleşme baskı motoru</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            <Icons.X className="w-5 h-5" />
          </button>
        </div>

        {/* Form fields */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kurum / Kulüp Adı</label>
              <input
                type="text"
                value={clubName}
                onChange={(e) => setClubName(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Yetkili/Temsilci T.C. veya Ad Soyad</label>
              <input
                type="text"
                value={authorizedPerson}
                onChange={(e) => setAuthorizedPerson(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-bold p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Vergi Dairesi / No</label>
              <input
                type="text"
                value={taxOffice}
                onChange={(e) => setTaxOffice(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
            <div className="flex flex-col gap-1.5 text-left">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teslimat / Sevk Şekli</label>
              <input
                type="text"
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="bg-slate-50 border border-slate-200 text-xs font-semibold p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5 text-left">
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Sözleşme Notları & Teknik Şartlar</label>
            <textarea
              rows={3}
              value={contractNotes}
              onChange={(e) => setContractNotes(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs font-medium p-2.5 rounded-lg text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-emerald-500 resize-none"
            />
          </div>

          {/* Quick summaries list */}
          <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
            <h4 className="text-xs font-extrabold text-emerald-950 mb-2">Hukuki & Mali Özet</h4>
            <div className="grid grid-cols-2 gap-3.5 text-left">
              <div className="text-[11px] font-medium text-emerald-800">
                <span className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider">SÖZLEŞME BEDELİ</span>
                <span className="text-sm font-black text-slate-900">{totals.finalGrossTotal.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} TL</span>
              </div>
              <div className="text-[11px] font-medium text-emerald-800">
                <span className="block text-slate-400 text-[9px] font-bold uppercase tracking-wider">ÖDEME PLANLI</span>
                <span className="text-sm font-black text-slate-900">{installmentMonths > 1 ? `${installmentMonths} Ay Taksitli` : 'Peşin / Tek Çekim'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="border-t border-slate-100 p-4 bg-slate-50 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="text-xs font-extrabold px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-white transition-colors cursor-pointer"
          >
            İptal Et
          </button>
          <button
            type="button"
            onClick={handlePrintContract}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs py-2.5 px-6 rounded-xl cursor-pointer flex items-center gap-1.5 shadow-sm active:scale-95 transition-all"
          >
            <Icons.FileDown className="w-4 h-4" />
            Tek Tıkla PDF İhraç Et
          </button>
        </div>
      </div>
    </div>
  );
}
