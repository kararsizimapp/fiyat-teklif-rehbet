/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from "express";
import path from "path";
import fs from "fs/promises";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Allow 50MB payload for uploaded Base64 images to prevent payload limits
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const DATA_FILE = path.join(process.cwd(), "user_data.json");

  // Get persisted custom-data
  app.get("/api/custom-data", async (req, res) => {
    try {
      await fs.access(DATA_FILE);
      const content = await fs.readFile(DATA_FILE, "utf-8");
      res.json(JSON.parse(content));
    } catch {
      res.json({ products: null, brands: null, categories: null, kdvRates: null });
    }
  });

  // Save persisted custom-data
  app.post("/api/custom-data", async (req, res) => {
    try {
      const { products, brands, categories, kdvRates } = req.body;
      const dataToSave = { products, brands, categories, kdvRates };
      await fs.writeFile(DATA_FILE, JSON.stringify(dataToSave, null, 2), "utf-8");
      res.json({ success: true });
    } catch (error: any) {
      console.error("Save custom data error:", error);
      res.status(500).json({ error: error.message || "Veriler kaydedilemedi." });
    }
  });

  // API Routes FIRST
  app.post("/api/analyze-basket", async (req, res) => {
    try {
      const { basket, globalDiscount, shippingFee, installmentMonths, interestRate, totals } = req.body;

      if (!process.env.GEMINI_API_KEY) {
        return res.json({ advice: "Sistemde GEMINI_API_KEY bulunamadı. Lütfen AI Studio ayarlarından ekleyiniz." });
      }

      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });

      // Prepare basket items text
      const itemsSummary = basket.map((item: any) => {
        const optionDetails = item.selectedSelections.map((s: any) => `${s.optionName}: ${s.choiceName}`).join(', ');
        return `- ${item.brand} ${item.productName} (${item.quantity} adet) [Opsiyonlar: ${optionDetails}]`;
      }).join('\n');

      const prompt = `Sen Türkiye spor kulübü pazarı, spor kıyafetleri (tekstil), antrenman ürünlerini, futbol/voleybol toplarını ve kulüp malzemelerini çok iyi bilen, profesyonel bir akıllı bütçe, spor donanımı ve ürün danışmanısın.
Kullanıcı Hummel takımları ve spor ekipmanları kataloğumuzdan bir fiyat teklifi listesi oluşturdu. Bu sepeti inceleyip Türkçe dilinde rehberlik yapmanı istiyoruz.

Sepet Bilgileri:
${itemsSummary}

Hesaplama Detayları:
- Kampanya İndirimi: %${globalDiscount}
- Kargo Ücreti: ${shippingFee} TL
- Taksit Sayısı: ${installmentMonths > 1 ? `${installmentMonths} Ay` : 'Peşin (Tek Çekim)'} ${installmentMonths > 3 ? `(Aylık %${interestRate} vade farkı ile)` : ''}
- Toplam Ürün Taban Fiyatı (+Opsiyonlar): ${(totals.rawProductBase + totals.optionTotalCost).toLocaleString('tr-TR')} TL
- Toplam ÖTV: ${totals.totalOtv.toLocaleString('tr-TR')} TL
- Toplam KDV: ${totals.totalKdv.toLocaleString('tr-TR')} TL
- Ödenecek Toplam Tutar: ${totals.finalGrossTotal.toLocaleString('tr-TR')} TL
${installmentMonths > 1 ? `- Aylık Taksit: ${totals.monthlyPaymentVal.toLocaleString('tr-TR')} TL` : ''}

Lütfen şu başlıklar altında kısa, samimi ve son derece bilgilendirici (maksimum 300 kelime) bir rapor sun:
1. 💡 **Bütçe ve Kombinasyon Analizi**: Seçilen spor kıyafetleri ve kulüp malzemelerinin (formalar, toplar, kabanlar) birbiriyle uyumu ve takım kiti kombinasyonu olarak uygunluğu hakkında hızlı yorum.
2. 🏷️ **Fırsat ve Tasarruf İpuçları**: Örneğin peşin veya 3 taksit seçeneği varsa (vade farksız) faiz ödememek adına bunu kullanmasını önermek veya toplu kulüp alımlarında tasarruf tüyoları.
3. 📦 **Kritik Tavsiye**: Bu ürünlerden en yüksek fiyatlı veya en verimli olan teknik spor ürünleri (örneğin kaban dolgusu, hybrid toplar, dikişsiz içlik kalitesi) hakkında sporcuları mutlu edecek pratik bir donanım/kullanım tüyosu.

Lütfen doğrudan başlıklarla yanıt ver, gereksiz giriş veya selamlaşma paragrafları kullanma. Profesyonel ve net ol.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ advice: response.text });
    } catch (error: any) {
      console.error("Gemini AI error:", error);
      res.status(500).json({ error: error.message || "Yapay zeka yanıtı üretilemedi." });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
