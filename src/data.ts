/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Product, BrandInfo, CategoryInfo, CollarOption } from './types';

export const DEFAULT_COLLAR_OPTIONS: CollarOption[] = [
  {
    name: "Örme Bisiklet Yaka",
    desc: "Klasik yuvarlak kesim. Esnek örgü ribana yapısı ile boynu sıkmaz, müsabakada maksimum konfor sağlar.",
    tag: "En Popüler",
    iconKey: "Layers",
    priceInfluence: 0,
    enabled: true
  },
  {
    name: "Modern V-Yaka",
    desc: "Atletik ve dinamik görünüm. Profesyonel kesimi duruşu zenginleştirirken hareket özgürlüğü tanır.",
    tag: "Profesyonel",
    iconKey: "Maximize",
    priceInfluence: 20,
    enabled: true
  },
  {
    name: "Polo Yaka",
    desc: "Geleneksel ve resmi kulüp kimliği. Düğmeli dikiş kalitesiyle prestijli takımların ilk tercihi.",
    tag: "Klasik Kulüp",
    iconKey: "Award",
    priceInfluence: 50,
    enabled: true
  },
  {
    name: "Hakim Yaka",
    desc: "Yükselen futbol trendi dik yaka tarzı. Minimalist dikiş hatlarıyla asil ve dinamik duruş.",
    tag: "Dinamik Dik",
    iconKey: "ShieldCheck",
    priceInfluence: 40,
    enabled: true
  }
];

export const BRANDS: BrandInfo[] = [
  {
    name: "Hummel Teamwear",
    origin: "Danimarka / Türkiye",
    logo: "hummel",
    description: "Profesyonel spor kulüpleri, akademiler ve okul takımları için özel üretim teknik tekstil ve spor ekipmanları."
  },
  {
    name: "Nike Team",
    origin: "ABD",
    logo: "NIKE",
    description: "Global kulüp standartlarında, elit lig seviyesi profesyonel spor kıyafetleri ve top modelleri."
  },
  {
    name: "Adidas Squad",
    origin: "Almanya",
    logo: "adidas",
    description: "Klasik 3 çizgi tasarımlı, yüksek performans özellikli antrenman ve maç koleksiyonları."
  }
];

export const CATEGORIES: CategoryInfo[] = [
  {
    id: "giyim",
    name: "Giyim & Antrenman",
    iconName: "Shirt",
    description: "Eşofman takımları, antrenman pantolonları, tişörtler, kapüşonlu hoodie ve şort çeşitleri."
  },
  {
    id: "formalar",
    name: "Takım Formaları",
    iconName: "Shirt", // Use Shirt icon for Team Kits
    description: "Futbol, basketbol ve hentbol branşlarına özel baskısız ve baskı korumalı dijital formalar."
  },
  {
    id: "forma-ust",
    name: "Forma Üst",
    parentId: "formalar",
    iconName: "Shirt",
    description: "Maç ve antrenmanlarda üst giyim formaları, kısa kol ve uzun kol tasarımlar."
  },
  {
    id: "basketbol-forma",
    name: "Basketbol Forması",
    parentId: "formalar",
    iconName: "Trophy",
    description: "Kolsuz, profesyonel basketbol formaları ve takım setleri."
  },
  {
    id: "futbol-forma",
    name: "Futbol Forması",
    parentId: "formalar",
    iconName: "Activity",
    description: "Yüksek performanslı, nefes alabilen futbol forma modelleri."
  },
  {
    id: "dis-giyim",
    name: "Kaban & Dış Giyim",
    iconName: "Wind",
    description: "Soğuk hava antrenmanları için kabanlar, rüzgarlıklar, yağmurluklar ve şişme yelek modelleri."
  },
  {
    id: "toplar",
    name: "Profesyonel Toplar",
    iconName: "Circle",
    description: "FIFA, FIVB ve IHF standartlarında dikişli, dikişsiz dikey futbol, voleybol ve hentbol topları."
  },
  {
    id: "canta",
    name: "Spor Çantaları",
    iconName: "Briefcase",
    description: "Sırt çantaları, seyahat valizleri, krampon çantaları, sporcu taşıma ve malzeme torbaları."
  },
  {
    id: "ayakkabi",
    name: "Ayakkabı & Terlik",
    iconName: "Footprints",
    description: "Koşu, salon, kamp sporları, güreş antrenmanlarına uygun ayakkabılar ve sporcu terlikleri."
  },
  {
    id: "aksesuar",
    name: "Ekipman & Aksesuar",
    iconName: "Zap",
    description: "Antrenman yelekleri, kaleci eldivenleri, güç bandı, direnç loopları, şapka, bere, havlu ve boyunluk."
  },
  {
    id: "fileler",
    name: "Ağlar & Fileler",
    iconName: "Grid",
    description: "Kalın örgü nilon voleybol, basketbol, badminton fileleri ile farklı ebatlarda nizami futbol kale ağları."
  }
];

export const PRODUCTS: Product[] = [
  // Page 1: Target Koleksiyon
  {
    id: "target-esofman-ust-kamp",
    name: "Target Eşofman Üst (Kamp)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Target Koleksiyon",
    image: "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=500",
    images: [
      "https://images.unsplash.com/photo-1483721310020-03333e577078?auto=format&fit=crop&q=80&w=500",
      "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=500",
      "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=500"
    ],
    basePrice: 1350,
    kdvRate: 20,
    description: "Kamp ve lobi ortamlarında rüzgar kesen, termal nefes alan özel dokulu fermuarlı üst eşofman.",
    rating: 4.6,
    stock: 140,
    popularity: 90,
    specs: {
      "Koleksiyon": "Target",
      "Kullanım": "Kamp / Günlük",
      "Kumaş": "%100 İnterlok Polyester",
      "Cep Tipi": "Fermuarlı İki Cep",
      "Detay": "Nakış Hummel Chevron şeritleri"
    },
    options: [
      {
        id: "size",
        name: "Beden Seçimi",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 50 },
          { name: "Youth Çocuk (8-14 Yaş)", priceInfluence: -100 }
        ]
      },
      {
        id: "logo-print",
        name: "Kulüp Amblem Baskısı",
        choices: [
          { name: "Baskısız (Düz)", priceInfluence: 0 },
          { name: "Göğse Tek Renk Amblem Baskı", priceInfluence: 80 },
          { name: "Göğse Çok Renkli Dijital Baskı", priceInfluence: 120 }
        ]
      }
    ]
  },
  {
    id: "target-esofman-ust-antrenman",
    name: "Target Eşofman Üst (Antrenman)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Target Koleksiyon",
    image: "https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=500",
    basePrice: 1450,
    kdvRate: 20,
    description: "Vücut ısısını regüle eden, yüksek esneklik sunan dar kesim profesyonel antrenman fermuarlı üstü.",
    rating: 4.7,
    stock: 220,
    popularity: 95,
    specs: {
      "Koleksiyon": "Target",
      "Kullanım": "Aktif Antrenman",
      "Kumaş": "Likralı Elastan & Polyester Karışımı",
      "Teknoloji": "Hummel Cool-Zone (Nem Kontrolü)"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 50 }
        ]
      }
    ]
  },
  {
    id: "target-pantolon-antrenman",
    name: "Target Antrenman Pantolonu",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Target Koleksiyon",
    image: "https://images.unsplash.com/photo-1551854838-212c50b4c184?auto=format&fit=crop&q=80&w=500",
    basePrice: 1100,
    kdvRate: 20,
    description: "Daralan paça, bilek fermuarı ve yüksek elastik yapısı ile koşu ve manevralarda maksimum performans.",
    rating: 4.5,
    stock: 180,
    popularity: 88,
    specs: {
      "Koleksiyon": "Target",
      "Kullanım": "Aktif Antrenman & Koşu",
      "Paça Özelliği": "Fermuarlı Paça / Elastik Manşet"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  {
    id: "target-tshirt-kamp",
    name: "Target T-Shirt (Kamp/Polo)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Target Koleksiyon",
    image: "https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&q=80&w=500",
    basePrice: 480,
    kdvRate: 20,
    description: "Seyahatler ve sosyal alanlar için şık yaka duruşu, nefes alabilen petek dokulu premium pamuklu tişört.",
    rating: 4.4,
    stock: 350,
    popularity: 87,
    specs: {
      "Koleksiyon": "Target",
      "Yaka": "Klasik Düğmeli Polo Yaka",
      "Kumaş": "%70 Pamuk, %30 Polyester"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 30 }
        ]
      },
      {
        id: "printing",
        name: "Numara ve Sponsor Baskı",
        choices: [
          { name: "Baskısız", priceInfluence: 0 },
          { name: "Sadece Sırt Numarası", priceInfluence: 45 },
          { name: "Sırt Numarası + Sponsor Logosu (Ön)", priceInfluence: 95 }
        ]
      }
    ]
  },
  {
    id: "line-esofman-ust-kamp",
    name: "Line Eşofman Üst (Kamp)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Line Koleksiyon",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=500",
    basePrice: 1250,
    kdvRate: 20,
    description: "Omuz hattı boyunca uzanan simetrik şerit pencereleri ve kontrast renk blokları ile özgün takım tarzı.",
    rating: 4.5,
    stock: 95,
    popularity: 83,
    specs: {
      "Koleksiyon": "Line",
      "Kumaş": "Mikro Polyester Mat",
      "Kesim": "Standart Slim"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  {
    id: "line-yagmurluk",
    name: "Line Yağmurluk (Su Geçirmez)",
    brand: "Hummel Teamwear",
    category: "dis-giyim",
    collection: "Line Koleksiyon",
    image: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=500",
    basePrice: 1950,
    kdvRate: 20,
    description: "Drizzle-tech su itici membran, gizli kapüşon ve rüzgar geçirmez bantlı ceplere sahip teknik yağmurluk.",
    rating: 4.8,
    stock: 80,
    popularity: 94,
    specs: {
      "Koleksiyon": "Line",
      "Kaplama": "PU Parlak Su Geçirmez Katman",
      "Astar": "Nefes Alabilir File Astar",
      "Kapüşon": "Yaka İçi Gizlenebilir Hazne"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 80 }
        ]
      }
    ]
  },
  // Otantik Koleksiyon
  {
    id: "otantik-esofman-alt-kamp",
    name: "Otantik Eşofman Alt (Kamp)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Otantik Koleksiyon",
    image: "https://images.unsplash.com/photo-1506152983158-b4a74a01c721?auto=format&fit=crop&q=80&w=500",
    basePrice: 980,
    kdvRate: 20,
    description: "Ekstra yumuşak iç şardonlu, büzgülü bel kordonu ve örgü logo detayı ile yüksek konforlu eşofman altı.",
    rating: 4.6,
    stock: 130,
    popularity: 89,
    specs: {
      "Koleksiyon": "Otantik",
      "Kumaş": "Şardonlu Üç İplik Penye",
      "Tip": "Klasik Paça"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Dream Koleksiyon
  {
    id: "dream-sifir-kol",
    name: "Dream Sıfır Kol (Antrenman)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Dream Koleksiyon",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=500",
    basePrice: 390,
    kdvRate: 20,
    description: "Basketbol ve atletizm idmanlarına uygun, omuz hareket alanını kısıtlamayan esnek sıfır kol atlet.",
    rating: 4.3,
    stock: 210,
    popularity: 81,
    specs: {
      "Koleksiyon": "Dream",
      "Kol Kesimi": "Açık Sıfır Kol (Sleeveless)",
      "Kumaş": "%100 Dry-Fit Polyester"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  {
    id: "dream-ter-atleti",
    name: "Dream Ter Atleti",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "İçlik/Tayt/Underwear",
    image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=500",
    basePrice: 340,
    kdvRate: 20,
    description: "Ten üzerine doğrudan giyilerek terin anında üst katmana iletilmesini sağlayan mikro gözenekli atlet.",
    rating: 4.5,
    stock: 190,
    popularity: 86,
    specs: {
      "Koleksiyon": "Dream Underwear",
      "Teknoloji": "HyperVent Mesh Aero",
      "Kumaş": "%92 Poliamid, %8 Likra"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S-M Sıkı Kesim", priceInfluence: 0 },
          { name: "L-XL Standart", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Armin Pamuklu & Pro
  {
    id: "armin-pro-sweat-ust",
    name: "Armin Pro Pamuklu Sweat (Kapüşonlu)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Armin Pro Pamuklu",
    image: "https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&q=80&w=500",
    basePrice: 1750,
    kdvRate: 20,
    description: "Ultra kalın 3-İplik pamuklu premium hoodie. Kordonlu ayarlı kapüşon ve kanguru cebe sahip şık tasarım.",
    rating: 4.9,
    stock: 110,
    popularity: 97,
    specs: {
      "Koleksiyon": "Armin Pro",
      "Kumaş Tipi": "3-İplik Sık Örgü Pamuklu",
      "Kordon": "Metal Uçlu Kalın Çift Kordon",
      "Yumuşaklık": "Maximum Şardonlu Kadifemsi İç Yüzey"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 80 }
        ]
      }
    ]
  },
  // Underwear
  {
    id: "iclik-uzun-kol",
    name: "Termal İçlik Uzun Kol (Underwear)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "İçlik/Tayt/Underwear",
    image: "https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=500",
    basePrice: 780,
    kdvRate: 20,
    description: "Dikişsiz örme yapısı ile sürtünmeyi önleyen, kar ve soğuk havada vücut sıcaklığını muhafaza eden termal içlik.",
    rating: 4.7,
    stock: 240,
    popularity: 93,
    specs: {
      "Kategori": "Underwear",
      "Dikiş": "Seamless (Dikişsiz)",
      "Termal Seviye": "Dereceli Isı Yalıtımı Seviye 2"
    },
    options: [
      {
        id: "size",
        name: "Ölçü",
        choices: [
          { name: "XS/S", priceInfluence: 0 },
          { name: "M/L", priceInfluence: 0 },
          { name: "XL/XXL", priceInfluence: 40 }
        ]
      }
    ]
  },
  {
    id: "tayt-uzun-underwear",
    name: "Performans Uzun Tayt",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "İçlik/Tayt/Underwear",
    image: "https://images.unsplash.com/photo-1539185441755-769473a23570?auto=format&fit=crop&q=80&w=500",
    basePrice: 690,
    kdvRate: 20,
    description: "Futbol şortlarının altına veya kış koşularında kas desteği sağlayan, kompresyon özellikli uzun sporcu taytı.",
    rating: 4.6,
    stock: 170,
    popularity: 91,
    specs: {
      "Kategori": "Underwear / Tayt",
      "Özellik": "Kas kompresyonu ve laktik asit azaltımı",
      "Cinsiyet": "Unisex (Kadın & Erkek uyumlu)"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "XS", priceInfluence: 0 },
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Page 2: Aksesuar Tekstil & Direnç Güç Bantları
  {
    id: "antrenman-yelek-beep",
    name: "Antrenman Yeleği (BEEP)",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&q=80&w=500",
    basePrice: 190,
    kdvRate: 20,
    description: "Yüksek yırtılma mukavemetli file kumaştan üretilen, çift taraflı antrenman ayrım yeleği (bibs).",
    rating: 4.5,
    stock: 1200,
    popularity: 98,
    specs: {
      "Kategori": "Antrenman Yeleği",
      "Model": "BEEP No-Rip",
      "Kumaş": "Makro Gözenekli Özel File Polyester",
      "Paket": "1 Adet"
    },
    options: [
      {
        id: "color",
        name: "Renk",
        choices: [
          { name: "Neon Sarı", priceInfluence: 0 },
          { name: "Neon Nar Çiçeği", priceInfluence: 0 },
          { name: "Elektrik Mavi", priceInfluence: 0 },
          { name: "Fosforlu Yeşil", priceInfluence: 0 }
        ]
      },
      {
        id: "size",
        name: "Beden Kalıbı",
        choices: [
          { name: "Çocuk (Junior)", priceInfluence: 0 },
          { name: "Yetişkin (Senior)", priceInfluence: 10 }
        ]
      }
    ]
  },
  {
    id: "loop-bant-fitness",
    name: "Loop Direnç Bandı (600x50 mm)",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=500",
    basePrice: 110,
    kdvRate: 20,
    description: "Pilates, gluteus antrenmanları ve fizik tedavi egzersizleri için %100 doğal lateks halka bant (Loop).",
    rating: 4.4,
    stock: 600,
    popularity: 88,
    specs: {
      "Çap / Ebat": "600 x 50 mm",
      "Malzeme": "%100 Doğal Doğada Çözünür Lateks"
    },
    options: [
      {
        id: "level",
        name: "Sertlik / Kalınlık Seviyesi",
        choices: [
          { name: "Sarı - 0.4 mm (Süper Hafif)", priceInfluence: 0 },
          { name: "Mavi - 0.6 mm (Hafif-Orta)", priceInfluence: 10 },
          { name: "Yeşil - 0.8 mm (Orta)", priceInfluence: 20 },
          { name: "Siyah - 1.0 mm (Zor)", priceInfluence: 35 },
          { name: "Kırmızı - 1.2 mm (Süper Zor)", priceInfluence: 50 }
        ]
      }
    ]
  },
  {
    id: "guc-bandi-power",
    name: "Güç Bandı (2080 mm Uzun Elastik)",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&q=80&w=500",
    basePrice: 320,
    kdvRate: 20,
    description: "Barfiks destekleyici, crossfit hızlanma çalışmaları ve bütünsel direnç kuvvet antrenmanları için uzun kalın güç bandı.",
    rating: 4.7,
    stock: 450,
    popularity: 92,
    specs: {
      "Uzunluk": "2080 mm döngü çevresi",
      "Yapı": "Katmerli Eksiz Konstrüksiyon"
    },
    options: [
      {
        id: "width",
        name: "Genişlik Seviyesi (Direnç Gücü)",
        choices: [
          { name: "Sarı - 13 mm (Düşük Direnç)", priceInfluence: 0 },
          { name: "Mavi - 21 mm (Orta Direnç)", priceInfluence: 110 },
          { name: "Yeşil - 29 mm (Yüksek Direnç)", priceInfluence: 240 },
          { name: "Siyah - 32 mm (Profesyonel Ağır)", priceInfluence: 350 },
          { name: "Kırmızı - 45 mm (Ekstra Ağır Canavar)", priceInfluence: 520 }
        ]
      }
    ]
  },
  // Accessories
  {
    id: "clark-eldiven",
    name: "Clark Antrenman Eldiveni",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=500",
    basePrice: 380,
    kdvRate: 20,
    description: "Soğuk hava saha antrenmanları için silikon kaymaz avuç içi baskısına sahip rüzgar geçirmez termal polar eldiven.",
    rating: 4.6,
    stock: 140,
    popularity: 87,
    specs: {
      "Model": "Clark Fleece Tech",
      "Avuç İçi": "Kaymaz Silikon Grip Noktaları",
      "Özellik": "Dokunmatik Ekran Uyumlu İşaret Parmağı"
    },
    options: [
      {
        id: "size",
        name: "Ebat",
        choices: [
          { name: "Junior (Çocuk/Genç)", priceInfluence: 0 },
          { name: "S/M (Standart Yetişkin)", priceInfluence: 0 },
          { name: "L/XL (Geniş El)", priceInfluence: 20 }
        ]
      }
    ]
  },
  {
    id: "bere-clark",
    name: "Clark Örme Bere",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1576871337622-98d48d4aa53e?auto=format&fit=crop&q=80&w=500",
    basePrice: 290,
    kdvRate: 20,
    description: "Soğuk kış idmanlarında baş bölgesini sıcak tutan, ter biriktirmeyen çift katmanlı hafif akrilik bere.",
    rating: 4.5,
    stock: 300,
    popularity: 91,
    specs: {
      "Koleksiyon": "Clark",
      "Kumaş": "%100 İpli Boyalı Akrilik İplik",
      "Ölçü": "Standart Esnek (One Size)"
    },
    options: [
      {
        id: "color",
        name: "Renk Seçimi",
        choices: [
          { name: "Siyah Klasik", priceInfluence: 0 },
          { name: "Koyu Lacivert", priceInfluence: 0 },
          { name: "Melanj Gri", priceInfluence: 0 }
        ]
      }
    ]
  },
  {
    id: "havlu-towel",
    name: "Büyük Kulüp Havlusu (70x140 cm)",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "Aksesuar Tekstil",
    image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=500",
    basePrice: 420,
    kdvRate: 20,
    description: "Yüksek su emiciliğe sahip, duş ve saha kenarı için geniş ebatlı pamuk kadife sporcu havlusu.",
    rating: 4.8,
    stock: 120,
    popularity: 85,
    specs: {
      "Ölçü": "70 x 140 cm",
      "Kumaş": "%100 Penye Buklet Pamuk",
      "Metrekare Ağırlık": "450 gr/m2 Premium"
    },
    options: [
      {
        id: "embroidery",
        name: "Nakış İşleme Seçeneği",
        choices: [
          { name: "Düz Logolu (Standart)", priceInfluence: 0 },
          { name: "İsim / Sporcu Numarası Nakışlı", priceInfluence: 70 },
          { name: "Kulüp İsim Nakışlı Logolu", priceInfluence: 90 }
        ]
      }
    ]
  },
  // Page 3: Kaban / Anorak / Coat
  {
    id: "kaban-winner",
    name: "Winner Termal Şişme Kaban",
    brand: "Hummel Teamwear",
    category: "dis-giyim",
    collection: "Kaban / Anorak/Coat",
    image: "https://images.unsplash.com/photo-1544923246-77307dd654cb?auto=format&fit=crop&q=80&w=500",
    basePrice: 3850,
    kdvRate: 20,
    description: "Saha kenarında yedek kulübesinde, antrenör ve sporcular için tasarlanmış, boydan dolgulu suya dirençli kaban.",
    rating: 4.9,
    stock: 45,
    popularity: 96,
    specs: {
      "Koleksiyon": "Winner Professional",
      "Isı İzolasyonu": "Synthetic Down 350g Ultra Sıcak Dolgu",
      "Su Direnci": "3000 mm Su İtici Kaplama",
      "Fermuar": "Çift Yönlü Güçlendirilmiş SBS Kemik Fermuar"
    },
    options: [
      {
        id: "size",
        name: "Yetişkin Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 150 }
        ]
      },
      {
        id: "sponsor-baski",
        name: "Sırt Sponsor Logosu",
        choices: [
          { name: "Baskısız", priceInfluence: 0 },
          { name: "Sırt Bölgesine Büyük Kulüp İsim Baskı", priceInfluence: 150 }
        ]
      }
    ]
  },
  {
    id: "yelek-sisme-winner",
    name: "Winner Şişme Yelek",
    brand: "Hummel Teamwear",
    category: "dis-giyim",
    collection: "Kaban / Anorak/Coat",
    image: "https://images.unsplash.com/photo-1620138546344-7b2c0d011243?auto=format&fit=crop&q=80&w=500",
    basePrice: 2450,
    kdvRate: 20,
    description: "Kollarda serbestlik sağlayan, gövdeyi yün elyaf dolgusuyla rüzgardan koruyan dik yakalı sporcu şişme yeleği.",
    rating: 4.7,
    stock: 65,
    popularity: 90,
    specs: {
      "Koleksiyon": "Winner",
      "Dış Yüzey": "Yırtılmaz Micro Ripstop Naylon",
      "Cepler": "Fermuarlı Gizli Yan Cepler + İç Cep ve Kulaklık Çıkışı"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Socks
  {
    id: "futbol-corabi-prof",
    name: "Futbol Konç Çorabı (Uzun Prof)",
    brand: "Hummel Teamwear",
    category: "giyim",
    collection: "Sock/Çorap",
    image: "https://images.unsplash.com/photo-1580087442629-122e2329edd3?auto=format&fit=crop&q=80&w=500",
    basePrice: 190,
    kdvRate: 20,
    description: "Baldırı kavrayan elastik kanal örgüye sahip, taban kısmı ekstra konforlu havlu doku futbol müsabaka konçu.",
    rating: 4.8,
    stock: 850,
    popularity: 95,
    specs: {
      "Tip": "Diz Altı Futbol Konç (Uzun)",
      "Taban": "Darbe emici güçlendirilmiş havlu taban",
      "Malzeme": "%80 Poliamid, %15 Pamuk, %5 Likra"
    },
    options: [
      {
        id: "size",
        name: "Çorap Numarası",
        choices: [
          { name: "Boy 1 (31-35)", priceInfluence: -20 },
          { name: "Boy 2 (36-40)", priceInfluence: 0 },
          { name: "Boy 3 (41-45)", priceInfluence: 0 }
        ]
      },
      {
        id: "color",
        name: "Renk",
        choices: [
          { name: "Beyaz Klasik", priceInfluence: 0 },
          { name: "Siyah Mat", priceInfluence: 0 },
          { name: "Kırmızı Kor", priceInfluence: 0 },
          { name: "Kraliyet Mavisi", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Bags
  {
    id: "sirt-cantasi-modena",
    name: "Modena Sırt Çantası (25 Litre)",
    brand: "Hummel Teamwear",
    category: "canta",
    collection: "Çanta",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=500",
    basePrice: 1050,
    kdvRate: 20,
    description: "Egzersiz kıyafetleri, laptop gözü ve ayakkabı kompartmanı bulunan anatomik sırt süngerli günlük spor çantası.",
    rating: 4.6,
    stock: 120,
    popularity: 93,
    specs: {
      "Hacim / Ebat": "25 Litre / 44 x 30 x 18 cm",
      "Kumaş": "600D Su Geçirmez Oxford Kumaş",
      "Taşıma": "Destekli Nefes Alabilir S-Askı Kayışlar"
    },
    options: [
      {
        id: "color",
        name: "Renk",
        choices: [
          { name: "Siyah - Gri Kırçıllı", priceInfluence: 0 },
          { name: "Koyu Lacivert", priceInfluence: 0 },
          { name: "Asker Yeşili", priceInfluence: 0 }
        ]
      }
    ]
  },
  {
    id: "spor-canta-carry",
    name: "Carry Spor Taşıma Çantası (Büyük)",
    brand: "Hummel Teamwear",
    category: "canta",
    collection: "Çanta",
    image: "https://images.unsplash.com/photo-1511556532299-8f662fc26c06?auto=format&fit=crop&q=80&w=500",
    basePrice: 1550,
    kdvRate: 20,
    description: "Kamp seyahatleri ve deplasmanlar için silindir geniş hacimli, sıvı geçirmez yan cepli omuz askılı sporcu çantası.",
    rating: 4.7,
    stock: 90,
    popularity: 89,
    specs: {
      "Hacim Seçenekleri": "Taşıma kapasitesi yüksek güçlendirilmiş taban",
      "Kumaş": "Kopolimer kaplı su geçirmez ağır hizmet kumaşı"
    },
    options: [
      {
        id: "volume",
        name: "Ebat / Hacim Kapasitesi",
        choices: [
          { name: "Boy M (45x30x30 cm - 40 LT)", priceInfluence: 0 },
          { name: "Boy L (60x30x32 cm - 58 LT)", priceInfluence: 250 },
          { name: "Palermo 2 Tekerlekli Valiz Çanta (80 LT)", priceInfluence: 950 }
        ]
      }
    ]
  },
  // Page 3 & 4: Toplar
  {
    id: "futbol-topu-legend",
    name: "Legend Futbol Topu (Dikişsiz Hybrid)",
    brand: "Hummel Teamwear",
    category: "toplar",
    collection: "TOPLAR",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=500",
    basePrice: 1100,
    kdvRate: 20,
    description: "Fifa Basic onaylı sızdırmaz butil iç lastik, su emmeyen hibrit dikiş teknolojisi ile üretilmiş nizami futbol topu.",
    rating: 4.8,
    stock: 140,
    popularity: 97,
    specs: {
      "Yapı": "Hybrid Panel Birleştirme (Su Geçirmez)",
      "Katman": "4 Katmanlı EVA Köpük ve PU Suni Deri",
      "Kullanım": "Profesyonel Sentetik / Doğal Çim Maç ve Antrenman"
    },
    options: [
      {
        id: "size",
        name: "Top Boyutu",
        choices: [
          { name: "5 Numara (A Takım / Büyükler)", priceInfluence: 0 },
          { name: "4 Numara (Altyapı / 11-13 Yaş)", priceInfluence: -50 }
        ]
      }
    ]
  },
  {
    id: "voleybol-topu-force",
    name: "Force Voleybol Topu (Microfiber)",
    brand: "Hummel Teamwear",
    category: "toplar",
    collection: "TOPLAR",
    image: "https://images.unsplash.com/photo-1592656094267-764a450201c5?auto=format&fit=crop&q=80&w=500",
    basePrice: 950,
    kdvRate: 20,
    description: "FIVB nizami ölçülerine uygun, pürüzsüz micro gözenekli poliüretan yapıştırma panel salon voleybol topu.",
    rating: 4.6,
    stock: 80,
    popularity: 91,
    specs: {
      "Malzeme": "Japon üretimi kadife dokulu Soft-Touch PU",
      "Ağırlık": "260 - 280 gr standart",
      "Hava Basıncı": "0.30 - 0.325 kgf/cm2"
    },
    options: [
      {
        id: "model",
        name: "Segment Sürümü",
        choices: [
          { name: "Force Match Premium (Profesyonel Yapıştırma)", priceInfluence: 0 },
          { name: "HML-400 Training (Makineli Çift Dikiş)", priceInfluence: -150 },
          { name: "HML-300 Soft Ball (Okullar İçin Süper Yumuşak)", priceInfluence: -280 }
        ]
      }
    ]
  },
  {
    id: "basketbol-topu-enduro",
    name: "Enduro Basketbol Topu (Deri No 7)",
    brand: "Hummel Teamwear",
    category: "toplar",
    collection: "TOPLAR",
    image: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&q=80&w=500",
    basePrice: 1250,
    kdvRate: 20,
    description: "FIBA onaylı, derin kanal hatlarına sahip pürüzsüz kavrama sağlayan premium kompozit suni deri basketbol topu.",
    rating: 4.7,
    stock: 95,
    popularity: 92,
    specs: {
      "Model": "Enduro Pro Composite",
      "Kullanım Alanı": "Indoor & Outdoor (Salon ve Sokak)",
      "Malzeme": "Kompozit Kaymaz PU Deri"
    },
    options: [
      {
        id: "size",
        name: "Boy seçimi",
        choices: [
          { name: "7 Numara (Erkek Standart)", priceInfluence: 0 },
          { name: "6 Numara (Kadın / Yıldızlar)", priceInfluence: -20 },
          { name: "5 Numara (Küçükler)", priceInfluence: -60 }
        ]
      }
    ]
  },
  // Shoes & Slippers
  {
    id: "alovan-kosu-ayakkabisi",
    name: "Alovan Koşu & Antrenman Ayakkabısı",
    brand: "Hummel Teamwear",
    category: "ayakkabi",
    collection: "Ayakkabı & Terlik",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&q=80&w=500",
    basePrice: 2100,
    kdvRate: 20,
    description: "Phylon orta taban köpüğü sayesinde adımları hafifleten, file örgüsü ile ayağı serin ve kuru tutan koşu ayakkabısı.",
    rating: 4.7,
    stock: 75,
    popularity: 94,
    specs: {
      "Kategori": "Koşu / Yürüyüş",
      "Taban": "Esnek Phylon Foam + Aşınmaya Dayanıklı Kauçuk",
      "İç Taban": "Memory Foam Jel Masaj Desteği"
    },
    options: [
      {
        id: "shoe-size",
        name: "Ayak Numarası",
        choices: [
          { name: "39", priceInfluence: 0 },
          { name: "40", priceInfluence: 0 },
          { name: "41", priceInfluence: 0 },
          { name: "42", priceInfluence: 0 },
          { name: "43", priceInfluence: 0 },
          { name: "44", priceInfluence: 50 },
          { name: "45", priceInfluence: 80 }
        ]
      }
    ]
  },
  {
    id: "parsus-kamp-ayakkabisi",
    name: "Parsus Kamp & Outdoor Ayakkabı",
    brand: "Hummel Teamwear",
    category: "ayakkabi",
    collection: "Ayakkabı & Terlik",
    image: "https://images.unsplash.com/photo-1520639888713-7851133b1ed0?auto=format&fit=crop&q=80&w=500",
    basePrice: 2650,
    kdvRate: 20,
    description: "Kamp ortamları, outdoor doğa yürüyüşleri ve engebeli zeminler için tırtıklı kaymaz tabanlı, burun korumalı dayanıklı ayakkabı.",
    rating: 4.6,
    stock: 45,
    popularity: 88,
    specs: {
      "Kategori": "Kamp / Doğal Koşullar / Trekking",
      "Su Direnci": "Hummel-Tex Suya Dayanıklı Membran Yarım Koruma"
    },
    options: [
      {
        id: "size",
        name: "Numara",
        choices: [
          { name: "40", priceInfluence: 0 },
          { name: "41", priceInfluence: 0 },
          { name: "42", priceInfluence: 0 },
          { name: "43", priceInfluence: 0 }
        ]
      }
    ]
  },
  // Nets
  {
    id: "voleybol-file-4mm",
    name: "Nizami Voleybol Filesi (4 mm Kalın)",
    brand: "Hummel Teamwear",
    category: "fileler",
    collection: "AĞLAR",
    image: "https://images.unsplash.com/photo-1544698310-74ea9d1c8258?auto=format&fit=crop&q=80&w=500",
    basePrice: 1850,
    kdvRate: 20,
    description: "Güneş ışınlarına ve suya son derece dayanıklı düğümsüz yüksek mukavemetli nilon ipten oluşan nizami voleybol ağı.",
    rating: 4.8,
    stock: 35,
    popularity: 82,
    specs: {
      "İp Kalınlığı": "4.0 mm Yüksek Mukavemetli Naylon",
      "Ebatlar": "9.50 mt x 1.00 mt (Uluslararası Nizami)",
      "Üst Bant": "Dört dikişli branda kumaş, çelik kablolu"
    },
    options: [
      {
        id: "cable",
        name: "Gergi Kablosu Türü",
        choices: [
          { name: "Çelik Kablolu İçi Tel Gergi", priceInfluence: 0 },
          { name: "İthal Kevlar Hafif Kopmaz Halatlı", priceInfluence: 280 }
        ]
      }
    ]
  },
  {
    id: "futbol-kale-filesi",
    name: "Futbol Kale Filesi (Profesyonel Çift)",
    brand: "Hummel Teamwear",
    category: "fileler",
    collection: "AĞLAR",
    image: "https://images.unsplash.com/photo-1624880351366-4fe48cb2536e?auto=format&fit=crop&q=80&w=500",
    basePrice: 4200,
    kdvRate: 20,
    description: "Nizami iki adet futbol kalesi için profesyonel örgü kale filesi seti. Kar ve fırtınaya karşı kırılmaz UV korumalı.",
    rating: 4.9,
    stock: 20,
    popularity: 91,
    specs: {
      "Paket İçeriği": "2 Adet Kale Filesi (Çift)",
      "İp Niteliği": "6.0 mm Sık Dokuma Düğümsüz Polipropilen"
    },
    options: [
      {
        id: "dimension",
        name: "Kale Ebadı",
        choices: [
          { name: "Profesyonel Nizami (7.32 x 2.44 mt - Derinlik: 200 cm)", priceInfluence: 0 },
          { name: "Halı Saha Standart (5.00 x 2.00 mt - Derinlik: 100 cm)", priceInfluence: -1250 },
          { name: "Minyatür Kale File Ebadı (1.60 x 1.00 mt)", priceInfluence: -3100 }
        ]
      }
    ]
  },
  // Goalkeeper gloves
  {
    id: "kaleci-eldiveni-pro",
    name: "Hummel Pro Kaleci Eldiveni",
    brand: "Hummel Teamwear",
    category: "aksesuar",
    collection: "KALECİ ELDİVENLERİ",
    image: "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&q=80&w=500",
    basePrice: 1150,
    kdvRate: 20,
    description: "Süper yumuşak 4mm Alman Elite Lateks avuç yapısı ve parmak kırılmalarını önleyen çıkarılabilir kemikli kaleci eldiveni.",
    rating: 4.8,
    stock: 50,
    popularity: 96,
    specs: {
      "Avuç İçi Lateks": "4mm Super Grip German Latex",
      "Koruma": "Parmak koruma kemikli (Çıkarılabilir)",
      "Bileklik": "Çift tur elastik cırt cırt kilit sistemi"
    },
    options: [
      {
        id: "size",
        name: "Eldiven Ölçüsü",
        choices: [
          { name: "8 Numara (Junior/Medium)", priceInfluence: 0 },
          { name: "9 Numara (Yetişkin Orta)", priceInfluence: 0 },
          { name: "10 Numara (Yetişkin Geniş)", priceInfluence: 0 },
          { name: "11 Numara (Maksimum El Uzunluğu)", priceInfluence: 40 }
        ]
      }
    ]
  },
  // Jerseys
  {
    id: "forma-elegance-ust",
    name: "Elegance Futbol Forma Üst",
    brand: "Hummel Teamwear",
    category: "formalar",
    collection: "FORMALAR",
    image: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&q=80&w=500",
    basePrice: 580,
    kdvRate: 20,
    description: "Nefes alan kumlama gözenekli kumaşı, modern örgü bisiklet yakası ile takım müsabakaları için üretilmiş elit maç forması.",
    rating: 4.7,
    stock: 450,
    popularity: 98,
    specs: {
      "Model": "Hummel Elegance Jersey",
      "Kumaş": "%100 Petek Gözenekli Dry-Zone Polyester",
      "Baskı Uyumu": "Yüksek Isı Transfer Süblime ve Flok Baskıya Uyumlu"
    },
    options: [
      {
        id: "size",
        name: "Maç Bedeni",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 40 }
        ]
      },
      {
        id: "set-completion",
        name: "Kombin Seçeneği",
        choices: [
          { name: "Sadece Forma Üst", priceInfluence: 0 },
          { name: "Forma + Eşleşen Elegance Spor Şortu", priceInfluence: 340 },
          { name: "Tam Set (Forma + Şort + Konç Çorap)", priceInfluence: 480 }
        ]
      }
    ]
  },
  {
    id: "basket-forma-royal",
    name: "Royal Basketbol Forma Takımı Şortlu",
    brand: "Hummel Teamwear",
    category: "formalar",
    collection: "FORMALAR",
    image: "https://images.unsplash.com/photo-1519766304817-4f37bda74a27?auto=format&fit=crop&q=80&w=500",
    basePrice: 920,
    kdvRate: 20,
    description: "Açık askı omuz kesimli geniş kalıplı basketbol forma üstü ve elastik büzgülü kordonlu basketbol uzun şortu dahil çift set.",
    rating: 4.6,
    stock: 180,
    popularity: 92,
    specs: {
      "Branş": "Basketbol Profesyonel",
      "Kalıp": "Geniş (Athletic Loose Fit)",
      "Paket İçeriği": "Basketbol Askılı Forma + Şort (Çift)"
    },
    options: [
      {
        id: "size",
        name: "Beden",
        choices: [
          { name: "S", priceInfluence: 0 },
          { name: "M", priceInfluence: 0 },
          { name: "L", priceInfluence: 0 },
          { name: "XL", priceInfluence: 0 },
          { name: "XXL", priceInfluence: 50 }
        ]
      },
      {
        id: "numbering",
        name: "Numaralandırma Şeması",
        choices: [
          { name: "Baskısız Boş Set", priceInfluence: 0 },
          { name: "Ön ve Arka Çift Karakter Numara Baskılı", priceInfluence: 80 },
          { name: "Numara + Sırt İsim Baskı Tekniği", priceInfluence: 140 }
        ]
      }
    ]
  }
];
