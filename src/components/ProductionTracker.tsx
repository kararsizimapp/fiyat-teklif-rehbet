import React, { useState, useMemo, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { db, handleFirestoreError, OperationType, cleanUndefined, isCloudQuotaExceeded } from '../firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';

interface SheetRow {
  id: string; // Internal unique state ID
  siparisNo: string; // Column A
  temsilciEmail: string; // Column B
  temsilciIsim: string; // Secondary
  kulupAdi: string; // Column C
  brans: string; // Column D
  adet: number; // Column E
  currentStep: number; // Column F (0-6 representation)
  teslimTarihi: string; // Column G
  ozelNot: string; // Column H
}

export interface TrackerNotification {
  id: string;
  type: 'step_change' | 'new_order' | 'rep_change' | 'deleted' | 'system';
  timestamp: string;
  siparisNo: string;
  kulupAdi: string;
  brans: string;
  message: string;
  temsilciEmail: string;
  isRead: boolean;
}

const INITIAL_NOTIFICATIONS: TrackerNotification[] = [
  {
    id: 'not-1',
    type: 'step_change',
    timestamp: new Date(Date.now() - 4 * 60 * 1000).toISOString(),
    siparisNo: 'HM-78324',
    kulupAdi: 'Bahçeşehir Koleji Spor Akademisi',
    brans: 'Basketbol Takımı',
    message: 'Mustafa Can Aygün, siparişi "Arma Presi & Nakış" aşamasına güncelledi.',
    temsilciEmail: 'mustafacanaygun55@gmail.com',
    isRead: false
  },
  {
    id: 'not-2',
    type: 'new_order',
    timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    siparisNo: 'HM-55412',
    kulupAdi: 'Kolej Altyapı Voleybol Derneği',
    brans: 'Erkek Küçük Erkekler',
    message: 'Ahmet Şen tarafından yeni sipariş sisteme kaydedildi.',
    temsilciEmail: 'ahmet.sen@hummel.com',
    isRead: true
  },
  {
    id: 'not-3',
    type: 'rep_change',
    timestamp: new Date(Date.now() - 50 * 60 * 1000).toISOString(),
    siparisNo: 'HM-90234',
    kulupAdi: 'Samsun Gençlik ve Spor Kulübü',
    brans: 'Futbol A Takımı',
    message: 'Sipariş sorumlusu Elif Yılmaz olarak güncellendi.',
    temsilciEmail: 'elif.yilmaz@hummel.com',
    isRead: true
  }
];

// Initial mockup data directly representing the master Google Sheet
const INITIAL_SHEET_ROWS: SheetRow[] = [
  {
    id: 'row-1',
    siparisNo: 'HM-78324',
    temsilciEmail: 'mustafacanaygun55@gmail.com',
    temsilciIsim: 'Mustafa Can Aygün',
    kulupAdi: 'Bahçeşehir Koleji Spor Akademisi',
    brans: 'Basketbol Takımı',
    adet: 45,
    currentStep: 3,
    teslimTarihi: '15.06.2026',
    ozelNot: '+5 sponsor logosu ve arkaya sırt numara transfer baskıları sürmektedir.'
  },
  {
    id: 'row-2',
    siparisNo: 'HM-90234',
    temsilciEmail: 'elif.yilmaz@hummel.com',
    temsilciIsim: 'Elif Yılmaz',
    kulupAdi: 'Samsun Gençlik ve Spor Kulübü',
    brans: 'Futbol A Takımı',
    adet: 120,
    currentStep: 5,
    teslimTarihi: '10.06.2026',
    ozelNot: 'Dikiş tamamlanmış olup ütüleme, kalite kontrol ve barkod paketleme safhasına geçilmiştir.'
  },
  {
    id: 'row-3',
    siparisNo: 'HM-12984',
    temsilciEmail: 'mustafacanaygun55@gmail.com',
    temsilciIsim: 'Mustafa Can Aygün',
    kulupAdi: 'TED Koleji SK',
    brans: 'Voleybol Yıldız Kızlar',
    adet: 28,
    currentStep: 1,
    teslimTarihi: '22.06.2026',
    ozelNot: 'Tasarım onayı alınmış olup kumaş kalıpları lazerli optik tezgahlarda kesilmektedir.'
  },
  {
    id: 'row-4',
    siparisNo: 'HM-55412',
    temsilciEmail: 'ahmet.sen@hummel.com',
    temsilciIsim: 'Ahmet Şen',
    kulupAdi: 'Kolej Altyapı Voleybol Derneği',
    brans: 'Erkek Küçük Erkekler',
    adet: 60,
    currentStep: 2,
    teslimTarihi: '18.06.2026',
    ozelNot: 'Ön süblime sırt pürüzleri giderildi.'
  },
  {
    id: 'row-5',
    siparisNo: 'HM-66521',
    temsilciEmail: 'mustafacanaygun55@gmail.com',
    temsilciIsim: 'Mustafa Can Aygün',
    kulupAdi: 'İzmir Göztepe Altyapı',
    brans: 'Hentbol Yıldızlar',
    adet: 35,
    currentStep: 4,
    teslimTarihi: '30.06.2026',
    ozelNot: 'Özel dikiş istekleri uygulunıyor.'
  }
];

const STEPS = [
  { label: "Tasarım & Numune Onayı", icon: "Paintbrush", desc: "Forma 3D tasarımı ve logo yerleşimi onaylandı." },
  { label: "Optik Lazer Kesim", icon: "Scissors", desc: "Kumaş panelleri kalıplara göre milimetrik kesildi." },
  { label: "Dijital Süblime Baskı", icon: "Cpu", desc: "Renk pigmentleri yüksek ısıda gözeneklere işleniyor." },
  { label: "Arma Presi & Nakış", icon: "Shirt", desc: "Kulüp armaları ve nakış şeritler dikiliyor." },
  { label: "Konfeksiyon Dikim", icon: "Flame", desc: "Nefes alan dikiş iplikleriyle parçalar birleştiriliyor." },
  { label: "Kalite Güvence & Ütü", icon: "CheckSquare", desc: "Ölçü payları ve baskı mukavemetleri test ediliyor." },
  { label: "Paketleme & Sevkiyat", icon: "Truck", desc: "Karton askılı poşetlerle kargoya teslim edildi." }
];

const SALES_REPS = [
  { email: 'mustafacanaygun55@gmail.com', name: 'Mustafa Can Aygün (Siz)', role: 'Kıdemli Satış Temsilcisi' },
  { email: 'elif.yilmaz@hummel.com', name: 'Elif Yılmaz', role: 'Satış Danışmanı' },
  { email: 'ahmet.sen@hummel.com', name: 'Ahmet Şen', role: 'Eğitim Kurumları Koordinatörü' },
  { email: 'zeynep.kaya@hummel.com', name: 'Zeynep Kaya', role: 'Altyapı Kulüpleri Sorumlusu' }
];

export function ProductionTracker() {
  const [sheetRows, setSheetRows] = useState<SheetRow[]>(() => {
    try {
      const saved = localStorage.getItem('tracker_sheet_rows_v4');
      return saved ? JSON.parse(saved) : INITIAL_SHEET_ROWS;
    } catch {
      return INITIAL_SHEET_ROWS;
    }
  });

  const [activeRepEmail, setActiveRepEmail] = useState<string>('mustafacanaygun55@gmail.com');
  const [sheetUrl, setSheetUrl] = useState<string>('https://docs.google.com/spreadsheets/d/1xHummelTeamwear_B2B_Production_Track_v4_mustafa55/edit');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncLogs, setSyncLogs] = useState<string>('Grup yetkilendirmesi hazır. Google Sheets bağlantısı kuruldu.');
  
  // Selected visual order detail track state
  const [selectedOrderId, setSelectedOrderId] = useState<string>('row-1');
  const [showSheetEditor, setShowSheetEditor] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Add Row UI fields states
  const [newSiparisNo, setNewSiparisNo] = useState<string>('');
  const [newKulup, setNewKulup] = useState<string>('');
  const [newBrans, setNewBrans] = useState<string>('');
  const [newAdet, setNewAdet] = useState<number>(30);
  const [newRep, setNewRep] = useState<string>('mustafacanaygun55@gmail.com');
  const [newNot, setNewNot] = useState<string>('');

  // Live Tracking Notifications State and Settings
  const [notifications, setNotifications] = useState<TrackerNotification[]>(() => {
    try {
      const saved = localStorage.getItem('tracker_notifications_v4');
      return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
    } catch {
      return INITIAL_NOTIFICATIONS;
    }
  });
  const [notifFilter, setNotifFilter] = useState<'all' | 'mine' | 'unread'>('all');
  const [isSimulatorActive, setIsSimulatorActive] = useState<boolean>(true); // Active by default to demo real-time notifications
  const [recentToast, setRecentToast] = useState<TrackerNotification | null>(null);

  const [localQuotaExceeded, setLocalQuotaExceeded] = useState(isCloudQuotaExceeded);

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

  // Backup state to local storage when changed
  useEffect(() => {
    try {
      localStorage.setItem('tracker_sheet_rows_v4', JSON.stringify(sheetRows));
    } catch (e) {
      console.warn('Failed to backup sheet rows locally', e);
    }
  }, [sheetRows]);

  useEffect(() => {
    try {
      localStorage.setItem('tracker_notifications_v4', JSON.stringify(notifications));
    } catch (e) {
      console.warn('Failed to backup notifications locally', e);
    }
  }, [notifications]);

  // Synchronize dynamic Sheet Rows in Real-time from Firestore Cloud with safe fallback
  useEffect(() => {
    if (localQuotaExceeded) return;
    let active = true;
    let unsub: () => void = () => {};
    
    try {
      unsub = onSnapshot(collection(db, 'sheetRows'), async (snap) => {
        if (!active) return;
        try {
          if (!snap.empty) {
            const list: SheetRow[] = [];
            snap.forEach((d) => {
              list.push(d.data() as SheetRow);
            });
            setSheetRows(list);
          } else {
            console.log("Firestore sheetRows is blank. Attempting to seed from defaults...");
            if (localQuotaExceeded) return;
            try {
              for (const row of INITIAL_SHEET_ROWS) {
                await setDoc(doc(db, 'sheetRows', row.id), cleanUndefined(row));
              }
            } catch (seedErr) {
              console.warn("Could not seed sheetRows cloud data due to quota limits, running with local copy", seedErr);
            }
          }
        } catch (err) {
          console.warn("Sync error retrieving live sheetRows. Local-only mode active", err);
        }
      }, (error) => {
        console.warn("Firestore onSnapshot sheetRows fail-safe handler executed:", error);
        handleFirestoreError(error, OperationType.LIST, 'sheetRows');
        active = false;
        unsub(); // Stop listening immediately to stop network spam & console flood!
      });
    } catch (e) {
      console.warn("Failed to subscribe onSnapshot for sheetRows:", e);
    }
    
    return () => {
      active = false;
      unsub();
    };
  }, [localQuotaExceeded]);

  // Synchronize dynamic Notifications in Real-time from Firestore Cloud with safe fallback
  useEffect(() => {
    if (localQuotaExceeded) return;
    let active = true;
    let unsub: () => void = () => {};
    
    try {
      unsub = onSnapshot(collection(db, 'notifications'), async (snap) => {
        if (!active) return;
        try {
          if (!snap.empty) {
            const list: TrackerNotification[] = [];
            snap.forEach((d) => {
              list.push(d.data() as TrackerNotification);
            });
            // Sort descending by timestamp
            list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setNotifications(list);
          } else {
            console.log("Firestore notifications is blank. Attempting to seed from defaults...");
            if (localQuotaExceeded) return;
            try {
              for (const notif of INITIAL_NOTIFICATIONS) {
                await setDoc(doc(db, 'notifications', notif.id), cleanUndefined(notif));
              }
            } catch (seedErr) {
              console.warn("Could not seed notifications cloud data due to quota limits, running with local copy", seedErr);
            }
          }
        } catch (err) {
          console.warn("Sync error retrieving live notifications. Local-only mode active", err);
        }
      }, (error) => {
        console.warn("Firestore onSnapshot notifications fail-safe handler executed:", error);
        handleFirestoreError(error, OperationType.LIST, 'notifications');
        active = false;
        unsub(); // Stop listening immediately to stop network spam & console flood!
      });
    } catch (e) {
      console.warn("Failed to subscribe onSnapshot for notifications:", e);
    }
    
    return () => {
      active = false;
      unsub();
    };
  }, [localQuotaExceeded]);

  // Auto-clear toast alert after a short duration
  useEffect(() => {
    if (recentToast) {
      const timer = setTimeout(() => {
        setRecentToast(null);
      }, 4500);
      return () => clearTimeout(timer);
    }
  }, [recentToast]);

  // Helper to append notification to custom Firestore Collection
  const addNotification = async (notif: TrackerNotification) => {
    try {
      setNotifications(prev => {
        if (prev.some(n => n.id === notif.id)) return prev;
        const updated = [notif, ...prev];
        return updated.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      });
      setRecentToast(notif);
      if (localQuotaExceeded) return;
      await setDoc(doc(db, 'notifications', notif.id), cleanUndefined(notif));
    } catch (e) {
      console.warn("Could not sync notification to cloud database, showed internally:", e);
    }
  };

  // Background random simulator update process
  const simulateRandomUpdate = () => {
    if (sheetRows.length === 0) return;
    const randomIndex = Math.floor(Math.random() * sheetRows.length);
    const targetRow = sheetRows[randomIndex];
    
    const prevStepIndex = targetRow.currentStep;
    const nextStepIndex = (prevStepIndex + 1) % STEPS.length;
    
    const randomRep = SALES_REPS[Math.floor(Math.random() * SALES_REPS.length)];
    const cleanRepName = randomRep.name.replace(' (Siz)', '');

    const updatedRow = { 
      ...targetRow, 
      currentStep: nextStepIndex,
      temsilciEmail: randomRep.email,
      temsilciIsim: cleanRepName
    };
    
    setSheetRows(prev => prev.map(r => r.id === targetRow.id ? updatedRow : r));
    saveSingleRow(updatedRow);

    const newNotif: TrackerNotification = {
      id: `not-${Date.now()}`,
      type: 'step_change',
      timestamp: new Date().toISOString(),
      siparisNo: targetRow.siparisNo,
      kulupAdi: targetRow.kulupAdi,
      brans: targetRow.brans,
      message: `${cleanRepName}, "${targetRow.kulupAdi}" siparişini "${STEPS[nextStepIndex].label}" aşamasına güncelledi.`,
      temsilciEmail: randomRep.email,
      isRead: false
    };

    addNotification(newNotif);
    setSyncLogs(`→ [ARKA PLAN SİMÜLASYONU]: '${cleanRepName}' ${targetRow.siparisNo} nolu siparişi '${STEPS[nextStepIndex].label}' seviyesine güncelledi.`);
  };

  // Run simulator loop
  useEffect(() => {
    if (!isSimulatorActive) return;
    const interval = setInterval(() => {
      simulateRandomUpdate();
    }, 18000);
    return () => clearInterval(interval);
  }, [isSimulatorActive, sheetRows]);

  // Save a single row to cloud database
  const saveSingleRow = async (row: SheetRow) => {
    if (localQuotaExceeded) return;
    try {
      await setDoc(doc(db, 'sheetRows', row.id), cleanUndefined(row));
    } catch (e) {
      console.warn("Could not sync row change to cloud database. Saved locally.", e);
    }
  };

  // Sync animation handler
  const handleSheetsSync = () => {
    setIsSyncing(true);
    setSyncLogs('Google Sheets API ile bağlantı kuruluyor...');
    setTimeout(() => {
      setSyncLogs(`✓ google.api.sheets.v4 - Google Sheets dökümü başarıyla alındı.\n✓ '${activeRepEmail}' ait sütun verileri süzüldü.\n✓ Son Senkronizasyon: ${new Date().toLocaleTimeString()}`);
      setIsSyncing(false);
      
      const newNotif: TrackerNotification = {
        id: `not-${Date.now()}`,
        type: 'system',
        timestamp: new Date().toISOString(),
        siparisNo: 'TS-API',
        kulupAdi: 'Sistem Entegratörü',
        brans: 'Google Sheets',
        message: 'Google Sheets API senkronizasyonu tamamlandı. Tüm sipariş aşamaları eşitlendi.',
        temsilciEmail: activeRepEmail,
        isRead: false
      };
      addNotification(newNotif);
    }, 1200);
  };

  // Filter rows belonging to the active representative
  const repOrders = useMemo(() => {
    return sheetRows.filter(row => row.temsilciEmail === activeRepEmail);
  }, [sheetRows, activeRepEmail]);

  // Find currently detailed order
  const activeDetailOrder = useMemo(() => {
    const found = sheetRows.find(row => row.id === selectedOrderId);
    if (found) return found;
    // Fallback to first representative order if active is lost
    return repOrders[0] || sheetRows[0] || null;
  }, [sheetRows, selectedOrderId, repOrders]);

  // Handle direct step manipulation
  const handleSetStep = (rowId: string, stepIndex: number) => {
    let oldStepLabel = '';
    const row = sheetRows.find(r => r.id === rowId);
    if (!row) return;

    oldStepLabel = STEPS[row.currentStep].label;
    const updatedRow = { ...row, currentStep: stepIndex };

    setSheetRows(prev => prev.map(r => r.id === rowId ? updatedRow : r));
    saveSingleRow(updatedRow);
    
    // Simulate real-time API sync back logging
    const updatedRowRef = sheetRows.find(r => r.id === rowId);
    if (updatedRow) {
      const stepLabel = STEPS[stepIndex].label;
      setSyncLogs(`→ [YENİ SÜREÇ SÜTUN SEYRİ]: '${updatedRow.siparisNo}' siparişi süreci Google Sheets F sütununda '${stepLabel}' olarak güncellendi.`);
      
      // Push live notification
      const newNotif: TrackerNotification = {
        id: `not-${Date.now()}`,
        type: 'step_change',
        timestamp: new Date().toISOString(),
        siparisNo: updatedRow.siparisNo,
        kulupAdi: updatedRow.kulupAdi,
        brans: updatedRow.brans,
        message: `${updatedRow.temsilciIsim} siparişi "${stepLabel}" aşamasına ilerletti (Eski: "${oldStepLabel}").`,
        temsilciEmail: updatedRow.temsilciEmail,
        isRead: false
      };
      addNotification(newNotif);
    }
  };

  // Create new order row simulating addition to Google Sheet
  const handleAddRow = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiparisNo || !newKulup || !newBrans) {
      alert('Lütfen Sipariş No, Kulüp Adı ve Branş giriniz.');
      return;
    }

    const assignedRep = SALES_REPS.find(r => r.email === newRep);

    const newRowObj: SheetRow = {
      id: `row-${Date.now()}`,
      siparisNo: newSiparisNo.toUpperCase().trim(),
      temsilciEmail: newRep,
      temsilciIsim: assignedRep ? assignedRep.name.replace(' (Siz)', '') : 'Bilinmeyen Temsilci',
      kulupAdi: newKulup,
      brans: newBrans,
      adet: newAdet,
      currentStep: 0,
      teslimTarihi: '28.06.2026',
      ozelNot: newNot || 'Yeni eklenen sipariş kalemi.'
    };

    setSheetRows(prev => [...prev, newRowObj]);
    saveSingleRow(newRowObj);
    setSelectedOrderId(newRowObj.id);
    
    // Clear fields
    setNewSiparisNo('');
    setNewKulup('');
    setNewBrans('');
    setNewNot('');

    setSyncLogs(`→ [YENI ROW BAĞLANTISI]: ${newRowObj.siparisNo} no'lu yeni satır Google Sheets tablosuna başarıyla yazıldı.`);

    // Push notification for new order
    const newNotif: TrackerNotification = {
      id: `not-${Date.now()}`,
      type: 'new_order',
      timestamp: new Date().toISOString(),
      siparisNo: newRowObj.siparisNo,
      kulupAdi: newRowObj.kulupAdi,
      brans: newRowObj.brans,
      message: `${newRowObj.temsilciIsim}, yeni siparişi (${newRowObj.siparisNo} - ${newRowObj.kulupAdi}) portala ekledi.`,
      temsilciEmail: newRowObj.temsilciEmail,
      isRead: false
    };
    addNotification(newNotif);
  };

  // Remove row simulation
  const handleDeleteRow = async (id: string, code: string) => {
    if (confirm(`${code} no'lu sipariş satırını Google Sheets üzerinden tamamen silmek istediğinize emin misiniz?`)) {
      const rowToDelete = sheetRows.find(r => r.id === id);
      const nextRows = sheetRows.filter(r => r.id !== id);
      try {
        await deleteDoc(doc(db, 'sheetRows', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `sheetRows/${id}`);
      }
      setSheetRows(nextRows);
      setSyncLogs(`→ [SATIR SİLİNDİ]: ${code} siparişi satırı tablodan kaldırıldı.`);

      if (rowToDelete) {
        // Push notification for deleted row
        const newNotif: TrackerNotification = {
          id: `not-${Date.now()}`,
          type: 'deleted',
          timestamp: new Date().toISOString(),
          siparisNo: rowToDelete.siparisNo,
          kulupAdi: rowToDelete.kulupAdi,
          brans: rowToDelete.brans,
          message: `${code} no'lu sipariş satırı Google Sheets tablosundan kaldırıldı.`,
          temsilciEmail: rowToDelete.temsilciEmail,
          isRead: false
        };
        addNotification(newNotif);
      }
    }
  };

  // Selected representative data
  const currentRepInfo = useMemo(() => {
    return SALES_REPS.find(r => r.email === activeRepEmail) || SALES_REPS[0];
  }, [activeRepEmail]);

  return (
    <div className="relative overflow-hidden bg-slate-950 rounded-3xl p-8 md:p-14 border border-slate-850 shadow-2xl flex flex-col items-center justify-center text-center min-h-[540px]">
      {/* Decorative ambient glowing circles */}
      <div className="absolute top-0 left-1/4 w-80 h-80 bg-red-500/5 rounded-full blur-[100px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-indigo-500/5 rounded-full blur-[100px] translate-y-1/2 pointer-events-none" />

      <div className="relative z-10 max-w-xl flex flex-col items-center gap-6">
        {/* Modern High-contrast Geliştirme Aşamasında Badge */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-[11px] font-extrabold uppercase tracking-widest px-3.5 py-1.5 rounded-full animate-pulse"
        >
          <Icons.Wrench className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
          Geliştirme Aşamasında
        </motion.div>

        {/* Creative Visual Asset Block */}
        <div className="relative w-24 h-24 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center shadow-xl mt-3">
          <Icons.Rocket className="w-10 h-10 text-red-500 animate-bounce" style={{ animationDuration: '2.5s' }} />
          <div className="absolute -bottom-1 -right-1 bg-indigo-600 text-white p-1.5 rounded-xl border-2 border-slate-950 shadow-lg">
            <Icons.Clock className="w-3.5 h-3.5 animate-pulse" />
          </div>
        </div>

        {/* Typography-crafted Display Header */}
        <div className="space-y-4 mt-2">
          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight">
            Canlı Üretim Takip Sistemi <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-pink-500 to-indigo-400 font-extrabold">
              Çok Yakında Hizmetinizde!
            </span>
          </h2>
          <p className="text-slate-400 font-semibold text-xs md:text-sm max-w-lg leading-relaxed mx-auto">
            Google Sheets tablonuz ile tam entegre, anlık sipariş aşamalarını, dikiş, baskı ve sevkiyat durumlarını canlandırmaya yönelik geliştirmeler tamamlanıyor. Şu anda geçici olarak işlem yapılamamaktadır.
          </p>
        </div>

        {/* Modular Grid of Core Previews */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full mt-6 text-left">
          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4.5 flex gap-3.5 hover:border-slate-800 transition-all">
            <div className="p-3 bg-red-500/5 border border-red-500/10 rounded-xl text-red-400 h-11 w-11 flex items-center justify-center shrink-0">
              <Icons.FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-100">Google Sheets Bağlantısı</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                Arka plan excel verilerinize tam entegre çalışır, tüm süreçleri tek tuşla senkronize eder.
              </p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-900 rounded-2xl p-4.5 flex gap-3.5 hover:border-slate-800 transition-all">
            <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-xl text-indigo-400 h-11 w-11 flex items-center justify-center shrink-0">
              <Icons.Bell className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-extrabold text-slate-100">Anlık Takip & Bildirim</h4>
              <p className="text-[11px] text-slate-400 font-medium mt-1 leading-relaxed">
                Bantlardaki durum değişiklikleri ve önemli uyarılar otomatik bildirim merkezine akacaktır.
              </p>
            </div>
          </div>
        </div>

        {/* Current status footer bar */}
        <div className="w-full bg-slate-900/60 border border-slate-900 rounded-2xl p-3 px-4.5 flex items-center justify-between text-xs font-bold text-slate-400 mt-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Sunucu Modülü Durumu
          </div>
          <span className="font-extrabold text-[10px] tracking-wider uppercase text-indigo-400">Test & Optimizasyon</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col gap-6 text-left">
      
      {/* Top Config Header with Representative selection and Sheets url input */}
      <div className="bg-slate-50 border border-slate-200/60 p-5 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-5">
        
        {/* Left side: Rep User and Sheet connection bar */}
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center w-full xl:w-auto">
          {/* Active Sales Rep Select */}
          <div className="min-w-[240px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Aktif Satış Temsilcisi Oturumu (B2B Kullanıcısı)
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 px-2.5">
              <div className="bg-indigo-100 text-indigo-700 p-1.5 rounded-lg">
                <Icons.User className="w-4 h-4 text-indigo-600" />
              </div>
              <select
                value={activeRepEmail}
                onChange={(e) => {
                  setActiveRepEmail(e.target.value);
                  setSyncLogs(`Kullanıcı oturumu '${e.target.value}' olarak değiştirildi. Görünüm filtrelendi.`);
                }}
                className="w-full text-xs font-black text-slate-800 bg-transparent border-0 focus:outline-hidden focus:ring-0 cursor-pointer"
              >
                {SALES_REPS.map((rep) => (
                  <option key={rep.email} value={rep.email}>
                    {rep.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Connected Google Sheet Address */}
          <div className="flex-1 md:min-w-[320px]">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">
              Bağlı Google Sheets Arka Plan Dokümanı URL
            </label>
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-1.5 px-2.5 relative">
              <Icons.FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
              <input
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="Google Spreadsheet adresi veya ID girin..."
                className="w-full text-xs font-semibold text-slate-650 bg-transparent border-0 p-0 focus:outline-hidden focus:ring-0"
              />
            </div>
          </div>
        </div>

        {/* Right side: Sync Button and manual editor toggle */}
        <div className="flex items-center gap-2.5 w-full md:w-auto self-end xl:self-auto justify-end">
          <button
            type="button"
            onClick={() => setShowSheetEditor(!showSheetEditor)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-black rounded-xl border cursor-pointer transition-all ${
              showSheetEditor
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800 shadow-2xs'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Icons.Table className="w-3.5 h-3.5" />
            <span>{showSheetEditor ? 'Spreadsheet Görünümünü Kapat' : 'Canlı Google Sheets Düzenle'}</span>
          </button>

          <button
            type="button"
            onClick={handleSheetsSync}
            disabled={isSyncing}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs shrink-0 disabled:opacity-60"
          >
            <Icons.RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Senkronize Ediliyor...' : 'Şimdi Senkronize Et'}</span>
          </button>
        </div>

      </div>

      {/* Sync Logging Console Bar */}
      <div className="bg-slate-900 border border-slate-950 p-3 rounded-xl flex items-start gap-2.5 text-[11px] font-mono text-slate-300">
        <Icons.Terminal className="w-4 h-4 text-emerald-450 shrink-0 mt-0.5" />
        <div className="w-full text-left">
          <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider mb-0.5">Google Sheets Canlı Akış / Senkronizasyon Konsolu</span>
          <pre className="whitespace-pre-wrap font-mono leading-tight">{syncLogs}</pre>
        </div>
      </div>

      {/* Collapsible interactive Google Sheet rows data grid */}
      <AnimatePresence>
        {showSheetEditor && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden border border-slate-200 rounded-2xl bg-white"
          >
            <div className="bg-slate-100 p-4 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                  Google Sheets Veri Matrisi (Live Spreadsheet)
                </h4>
                <p className="text-[10px] text-slate-400 font-bold">Her satır bir siparişe ve temsilciye eşittir. Hücrelerdeki değişiklikler şemayı anında günceller.</p>
              </div>
              <span className="text-[9px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase">E-TABLOLAR API BAĞLANTISI</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-450 font-black">
                    <th className="p-3">Sipariş No (A)</th>
                    <th className="p-3">Sorumlu Temsilci (B)</th>
                    <th className="p-3">Kulüp Adı (C)</th>
                    <th className="p-3">Branş (D)</th>
                    <th className="p-3">Adet (E)</th>
                    <th className="p-3">Güncel Aşama (F)</th>
                    <th className="p-3">Sevk (G)</th>
                    <th className="p-3 text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sheetRows.map((row) => (
                    <tr key={row.id} className={`hover:bg-slate-50/50 ${row.temsilciEmail === activeRepEmail ? 'bg-indigo-50/20' : ''}`}>
                      <td className="p-3 font-mono font-black text-slate-900">{row.siparisNo}</td>
                      <td className="p-3">
                        <select
                          value={row.temsilciEmail}
                          onChange={(e) => {
                            const foundRep = SALES_REPS.find(rep => rep.email === e.target.value);
                            const updatedName = foundRep ? foundRep.name.replace(' (Siz)', '') : row.temsilciIsim;
                            const updatedRow = { ...row, temsilciEmail: e.target.value, temsilciIsim: updatedName };
                            setSheetRows(prev => prev.map(r => r.id === row.id ? updatedRow : r));
                            saveSingleRow(updatedRow);
                            setSyncLogs(`→ [TEMSİLCI REVİZYONU]: '${row.siparisNo}' sipariş sorumlusu '${e.target.value}' olarak atandı.`);
                            
                            const newNotif: TrackerNotification = {
                              id: `not-${Date.now()}`,
                              type: 'rep_change',
                              timestamp: new Date().toISOString(),
                              siparisNo: row.siparisNo,
                              kulupAdi: row.kulupAdi,
                              brans: row.brans,
                              message: `"${row.siparisNo}" kodlu iş için yeni atanan temsilci: ${updatedName}.`,
                              temsilciEmail: e.target.value,
                              isRead: false
                            };
                            addNotification(newNotif);
                          }}
                          className="bg-transparent border border-slate-200 font-semibold rounded-lg p-1 text-[11px] text-slate-800 focus:ring-1 focus:ring-emerald-500"
                        >
                          {SALES_REPS.map(rep => (
                            <option key={rep.email} value={rep.email}>{rep.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-extrabold text-slate-800">{row.kulupAdi}</td>
                      <td className="p-3 font-medium text-slate-550">{row.brans}</td>
                      <td className="p-3">
                        <input
                          type="number"
                          value={row.adet}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setSheetRows(prev => prev.map(r => r.id === row.id ? { ...r, adet: val } : r));
                          }}
                          onBlur={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            const updatedRow = { ...row, adet: val };
                            saveSingleRow(updatedRow);
                          }}
                          className="w-16 bg-transparent border border-slate-200 rounded-lg p-0.5 text-center font-bold"
                        />
                      </td>
                      <td className="p-3">
                        <select
                          value={row.currentStep}
                          onChange={(e) => handleSetStep(row.id, parseInt(e.target.value))}
                          className="bg-transparent border border-slate-200 font-extrabold rounded-lg p-1 text-[11px] text-emerald-800 focus:ring-1 focus:ring-emerald-500"
                        >
                          {STEPS.map((s, idx) => (
                            <option key={s.label} value={idx}>Adım {idx + 1}: {s.label}</option>
                          ))}
                        </select>
                      </td>
                      <td className="p-3 font-mono text-slate-500">{row.teslimTarihi}</td>
                      <td className="p-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row.id, row.siparisNo)}
                          className="p-1 px-2 hover:bg-red-50 text-red-650 hover:text-red-700 rounded-lg font-bold text-[10px] cursor-pointer"
                        >
                          Kaldır
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Simulated spreadsheet fast new row entry */}
            <form onSubmit={handleAddRow} className="bg-slate-50 p-4 border-t border-slate-200 grid grid-cols-2 md:grid-cols-6 gap-3 items-end">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1">Sipariş No (A)</label>
                <input
                  type="text"
                  required
                  placeholder="HM-XXXXX"
                  value={newSiparisNo}
                  onChange={(e) => setNewSiparisNo(e.target.value)}
                  className="w-full bg-white border border-slate-250 text-xs font-black p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1">Sorumlu (B)</label>
                <select
                  value={newRep}
                  onChange={(e) => setNewRep(e.target.value)}
                  className="w-full bg-white border border-slate-250 text-xs font-bold p-2 rounded-lg"
                >
                  {SALES_REPS.map(rep => (
                    <option key={rep.email} value={rep.email}>{rep.name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2 md:col-span-1">
                <label className="block text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1">Kulüp Adı (C)</label>
                <input
                  type="text"
                  required
                  placeholder="Üniversite / Kolej SK"
                  value={newKulup}
                  onChange={(e) => setNewKulup(e.target.value)}
                  className="w-full bg-white border border-slate-250 text-xs font-bold p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1">Branş (D)</label>
                <input
                  type="text"
                  required
                  placeholder="Futbol Altyapı, vb."
                  value={newBrans}
                  onChange={(e) => setNewBrans(e.target.value)}
                  className="w-full bg-white border border-slate-250 text-xs font-semibold p-2 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-[9px] font-black text-slate-550 uppercase tracking-wider mb-1">Adet (E)</label>
                <input
                  type="number"
                  min="5"
                  value={newAdet}
                  onChange={(e) => setNewAdet(parseInt(e.target.value) || 12)}
                  className="w-full bg-white border border-slate-250 text-xs font-black p-2 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="bg-slate-900 hover:bg-slate-850 text-white font-extrabold text-xs py-2 rounded-lg cursor-pointer h-9 shadow-xs"
              >
                + Yeni Satır Ekle
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Interactive Toast Alert */}
      <AnimatePresence>
        {recentToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 max-w-sm w-full bg-slate-900 border border-slate-750 text-white rounded-2xl p-4 shadow-xl flex items-start gap-3 text-left"
          >
            <div className={`p-2 rounded-xl border shrink-0 ${
              recentToast.type === 'step_change' ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400' :
              recentToast.type === 'new_order' ? 'bg-indigo-500/10 border-indigo-500 text-indigo-400' :
              recentToast.type === 'rep_change' ? 'bg-amber-500/10 border-amber-500 text-amber-400' :
              recentToast.type === 'deleted' ? 'bg-rose-500/10 border-rose-500 text-rose-400' :
              'bg-indigo-650/10 border-indigo-650 text-indigo-400'
            }`}>
              {recentToast.type === 'step_change' && <Icons.Shirt className="w-5 h-5" />}
              {recentToast.type === 'new_order' && <Icons.PlusCircle className="w-5 h-5" />}
              {recentToast.type === 'rep_change' && <Icons.UserPlus className="w-5 h-5" />}
              {recentToast.type === 'deleted' && <Icons.Trash className="w-5 h-5" />}
              {recentToast.type === 'system' && <Icons.Cpu className="w-5 h-5" />}
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <span className="text-[9px] font-mono font-black text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                  {recentToast.siparisNo}
                </span>
                <span className="text-[9px] text-indigo-400 font-extrabold animate-pulse">YENİ OYNAŞIM</span>
              </div>
              <p className="text-xs font-black leading-tight text-white">{recentToast.message}</p>
              <p className="text-[10px] text-slate-400 font-medium">{recentToast.kulupAdi}</p>
            </div>
            <button 
              onClick={() => setRecentToast(null)}
              className="text-slate-455 hover:text-white transition-colors p-0.5 cursor-pointer"
            >
              <Icons.X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Grid: Left Side Sales rep filters, Middle production stage tracker, Right Side notifications */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        
        {/* Left Column: Temsilciye Ait Siparişler Listesi */}
        <div className="xl:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-4">
          <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-extrabold text-indigo-700 uppercase tracking-widest block">{currentRepInfo.role}</span>
              <h4 className="text-xs font-black text-slate-900">{currentRepInfo.name} İşleri</h4>
            </div>
            <span className="text-[10px] font-black bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-lg">
              {repOrders.length} Sipariş
            </span>
          </div>

          {repOrders.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-100 rounded-xl">
              <Icons.ShieldAlert className="w-8 h-8 text-slate-350 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-500">Mevcut temsilci üzerinde aktif üretim kaydı bulunmamaktadır.</p>
              <button
                onClick={() => {
                  setNewRep(activeRepEmail);
                  setNewSiparisNo('HM-55' + Math.floor(100+Math.random()*900));
                  setNewKulup('Örnek Kulüp Vakfı');
                  setNewBrans('Genç Kızlar Basketbol');
                  setShowSheetEditor(true);
                }}
                className="mt-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-850 text-[10px] font-black py-1.5 px-3 rounded-lg"
              >
                + Bir Satır Sipariş Ata
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-[380px] overflow-y-auto pr-1">
              {repOrders.map((row) => {
                const isSelected = row.id === selectedOrderId;
                return (
                  <button
                    key={row.id}
                    onClick={() => setSelectedOrderId(row.id)}
                    className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer flex justify-between items-center ${
                      isSelected
                        ? 'bg-white border-indigo-500 shadow-sm ring-1 ring-indigo-500/10'
                        : 'bg-white border-slate-150 hover:bg-slate-100/50'
                    }`}
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-mono font-black text-emerald-750">{row.siparisNo}</span>
                        <span className="text-[9px] font-black text-slate-400">|</span>
                        <span className="text-[10px] font-bold text-slate-500">{row.brans}</span>
                      </div>
                      <h5 className="text-xs font-extrabold text-slate-900 leading-tight truncate max-w-[170px]">
                        {row.kulupAdi}
                      </h5>
                    </div>

                    <div className="text-right flex flex-col items-end shrink-0 pl-2">
                       <span className="text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Adım {row.currentStep + 1}</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-850 border border-emerald-100 px-1.5 py-0.5 rounded font-black max-w-[90px] truncate block leading-none">
                        {STEPS[row.currentStep].label.split(' ')[0]}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-slate-200">
            <span className="text-[9px] text-slate-400 font-bold block leading-relaxed">
              Google Sheets entegrasyonu sayesinde her temsilci kendisi adına atanmış olan hücre sütunlarındaki değerleri (Sipariş Durumu) bu terminalden canlı yönetip ilerletebilir.
            </span>
          </div>
        </div>

        {/* Middle Columns: Active Production Stage Tracker */}
        <div className="xl:col-span-2 flex flex-col gap-5 justify-between">
          
          {activeDetailOrder ? (
            <div className="flex flex-col gap-5">
              
              {/* Recapitulation of detail order */}
              <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">SİPARİŞ VEREN KULÜP</span>
                  <span className="text-xs font-black text-slate-950 mt-1 block leading-tight">{activeDetailOrder.kulupAdi}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">SİPARİŞ NO (SHEET COL A)</span>
                  <span className="text-xs font-mono font-black text-indigo-700 mt-1 block leading-tight">{activeDetailOrder.siparisNo}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">BRANŞ / ADET</span>
                  <span className="text-xs font-semibold text-slate-700 mt-1 block leading-tight">{activeDetailOrder.brans} / {activeDetailOrder.adet} Adet</span>
                </div>
                <div>
                  <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">PLANLANAN SEVK TARİHİ</span>
                  <span className="text-xs font-black text-slate-950 mt-1 block leading-tight">{activeDetailOrder.teslimTarihi}</span>
                </div>
              </div>

              {/* Progress Timeline Tracker */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-black text-slate-850 uppercase tracking-wider">Aktif Üretim Bandı Prosesi</span>
                  <span className="text-[10px] text-slate-400 font-semibold">Temsilci: <strong className="text-indigo-600 font-extrabold">{activeDetailOrder.temsilciIsim}</strong></span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-7 gap-3 mt-1">
                  {STEPS.map((step, idx) => {
                    const isCompleted = idx < activeDetailOrder.currentStep;
                    const isActive = idx === activeDetailOrder.currentStep;
                    const isPending = idx > activeDetailOrder.currentStep;

                    return (
                      <button
                        key={step.label}
                        type="button"
                        onClick={() => handleSetStep(activeDetailOrder.id, idx)}
                        className={`p-3 rounded-xl border text-left cursor-pointer transition-all ${
                          isActive
                            ? 'bg-emerald-50/70 border-emerald-400 shadow-md ring-2 ring-emerald-500/10'
                            : isCompleted
                              ? 'bg-slate-50 border-slate-200 opacity-80 hover:bg-emerald-50/20'
                              : 'bg-slate-50/10 border-slate-150 grayscale opacity-60 hover:opacity-85'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${
                            isActive 
                              ? 'bg-emerald-600 text-white animate-pulse'
                              : isCompleted 
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-slate-105 text-slate-400'
                          }`}>
                            Aşama {idx + 1}
                          </span>
                          
                          {isCompleted && (
                            <Icons.CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          )}
                          {isActive && (
                            <Icons.Hourglass className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
                          )}
                        </div>

                        <h5 className="text-[10px] font-black text-slate-900 leading-tight mb-1">{step.label}</h5>
                        <p className="text-[9px] text-slate-500 leading-tight font-semibold">{step.desc}</p>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Department Notes / Simulated edit */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900 rounded-2xl p-4 text-slate-100 gap-4">
                <div className="flex items-start gap-2.5">
                  <Icons.Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <div className="text-left">
                    <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-widest block">DEPARTMAN KALEM NOTLARI (ŞERH SÜTUNU)</span>
                    <input
                      type="text"
                      value={activeDetailOrder ? activeDetailOrder.ozelNot || '' : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setSheetRows(prev => prev.map(r => r.id === activeDetailOrder.id ? { ...r, ozelNot: val } : r));
                      }}
                      onBlur={(e) => {
                        if (activeDetailOrder) {
                          const updatedRow = { ...activeDetailOrder, ozelNot: e.target.value };
                          saveSingleRow(updatedRow);
                        }
                      }}
                      placeholder="Buraya not ekleyerek Google Sheets şerh hücresini güncelleyin..."
                      className="text-[11px] font-medium text-slate-300 mt-0.5 bg-transparent border-b border-white/10 hover:border-white/25 focus:border-emerald-450 focus:outline-hidden p-0 w-full"
                    />
                  </div>
                </div>

                <div className="flex gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      const nextStep = (activeDetailOrder.currentStep + 1) % STEPS.length;
                      handleSetStep(activeDetailOrder.id, nextStep);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-slate-950 font-black text-[11px] px-3.5 py-2 rounded-xl active:scale-95 transition-all cursor-pointer flex items-center gap-1 shrink-0"
                  >
                    <Icons.Play className="w-3.5 h-3.5 text-slate-950 fill-current" />
                    Bandı İlerlet (Adım Sürpriz)
                  </button>
                </div>
              </div>

            </div>
          ) : (
            <div className="p-16 text-center border border-dashed border-slate-200 rounded-3xl">
              <Icons.Inbox className="w-12 h-12 text-slate-350 mx-auto mb-3" />
              <h5 className="text-sm font-black text-slate-800">Detayı Görüntülenecek Sipariş Kalemi Bulunamadı</h5>
              <p className="text-xs text-slate-400 mt-1">Sol taraftaki listeden sorumlusu olduğunuz bir siparişi seçin veya yeni bir sipariş kaydı ekleyin.</p>
            </div>
          )}

        </div>

        {/* Right Column: Canlı Takip Bildirim Merkezi */}
        <div className="xl:col-span-1 bg-slate-50 border border-slate-150 rounded-2xl p-4 flex flex-col gap-4 justify-between">
          <div className="space-y-3">
            {/* Header */}
            <div className="border-b border-slate-200 pb-3 flex justify-between items-center">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icons.Bell className="w-4 h-4 text-indigo-700 animate-bounce" />
                  {notifications.filter(n => !n.isRead).length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white text-[8px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                      {notifications.filter(n => !n.isRead).length}
                    </span>
                  )}
                </div>
                <h4 className="text-xs font-black text-slate-900">Takip Bildirim Merkezi</h4>
              </div>

              <div className="flex items-center gap-1.5">
                {notifications.some(n => !n.isRead) && (
                  <button
                    type="button"
                    onClick={async () => {
                      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
                      if (localQuotaExceeded) return;
                      for (const n of notifications) {
                        if (!n.isRead) {
                          try {
                            await setDoc(doc(db, 'notifications', n.id), cleanUndefined({ ...n, isRead: true }));
                          } catch (e) {
                            console.warn("Could not sync bulk mark-as-read to cloud:", e);
                          }
                        }
                      }
                    }}
                    title="Tümünü Okundu Say"
                    className="p-1 hover:bg-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <Icons.CheckCheck className="w-3.5 h-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    type="button"
                    onClick={async () => {
                      setNotifications([]);
                      if (localQuotaExceeded) return;
                      for (const n of notifications) {
                        try {
                          await deleteDoc(doc(db, 'notifications', n.id));
                        } catch (e) {
                          console.warn("Could not sync delete to cloud:", e);
                        }
                      }
                    }}
                    title="Temizle"
                    className="p-1 hover:bg-slate-200 text-slate-650 hover:text-slate-900 rounded-lg transition-colors cursor-pointer"
                  >
                    <Icons.Trash className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Selector Tabs */}
            <div className="grid grid-cols-3 gap-1 bg-slate-200/60 p-0.5 rounded-lg text-[10px] font-black">
              <button
                type="button"
                onClick={() => setNotifFilter('all')}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  notifFilter === 'all'
                    ? 'bg-white text-indigo-955 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Tümü
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('mine')}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  notifFilter === 'mine'
                    ? 'bg-white text-indigo-955 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Benimkiler
              </button>
              <button
                type="button"
                onClick={() => setNotifFilter('unread')}
                className={`py-1 rounded text-center transition-all cursor-pointer ${
                  notifFilter === 'unread'
                    ? 'bg-white text-indigo-955 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Yeniler
              </button>
            </div>

            {/* List of Notification Logs */}
            <div className="flex flex-col gap-2 max-h-[340px] overflow-y-auto pr-1">
              {notifications.filter(n => {
                if (notifFilter === 'unread') return !n.isRead;
                if (notifFilter === 'mine') return n.temsilciEmail === activeRepEmail;
                return true;
              }).length === 0 ? (
                <div className="py-12 text-center bg-white border border-slate-100 rounded-xl">
                  <Icons.BellOff className="w-6 h-6 text-slate-350 mx-auto mb-2" />
                  <p className="text-[10px] text-slate-400 font-bold">Gösterilecek bildirim bulunamadı.</p>
                </div>
              ) : (
                notifications
                  .filter(n => {
                    if (notifFilter === 'unread') return !n.isRead;
                    if (notifFilter === 'mine') return n.temsilciEmail === activeRepEmail;
                    return true;
                  })
                  .map((notif) => (
                    <div
                      key={notif.id}
                      onClick={async () => {
                        // Mark as read on click
                        setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n));
                        if (!localQuotaExceeded) {
                          try {
                            await setDoc(doc(db, 'notifications', notif.id), cleanUndefined({ ...notif, isRead: true }));
                          } catch (e) {
                            console.warn("Could not mark single notification read in cloud:", e);
                          }
                        }
                        
                        // Select order if exists
                        const order = sheetRows.find(o => o.siparisNo === notif.siparisNo);
                        if (order) {
                          setSelectedOrderId(order.id);
                        }
                      }}
                      className={`p-2.5 rounded-lg border-l-4 border bg-white shadow-3xs cursor-pointer transition-all hover:bg-slate-100/50 flex flex-col gap-1 relative ${
                        notif.isRead ? 'border-slate-200 opacity-75' : 
                        notif.type === 'step_change' ? 'border-emerald-500 font-semibold' :
                        notif.type === 'new_order' ? 'border-indigo-500 font-semibold' :
                        notif.type === 'rep_change' ? 'border-amber-500 font-semibold' :
                        notif.type === 'deleted' ? 'border-rose-500 font-semibold' : 'border-slate-300 font-semibold'
                      }`}
                    >
                      <div className="flex justify-between items-center text-[8px] font-mono font-black uppercase tracking-wider">
                        <span className="flex items-center gap-1">
                          {getNotificationIcon(notif.type)}
                          <span className={`${notif.isRead ? 'text-slate-400' : 'text-slate-700'}`}>{notif.siparisNo}</span>
                        </span>
                        <span className="text-slate-400">
                          {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      
                      <p className="text-[10px] text-slate-800 leading-tight block">{notif.message}</p>
                      <span className="text-[9px] text-slate-400 font-medium truncate">{notif.kulupAdi}</span>
                      
                      {!notif.isRead && (
                        <span className="absolute top-2 right-2 w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      )}
                    </div>
                  ))
              )}
            </div>
          </div>

          {/* Interactive B2B Background Simulator Hub */}
          <div className="mt-auto pt-3 border-t border-slate-200 space-y-2.5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[9px] text-slate-400 font-extrabold uppercase block tracking-wider">SİPARİŞ GENEL AKIŞ SİMÜLASYONU</span>
                <span className="text-[10px] font-semibold text-slate-750">Arka plan olay canlandırıcı</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isSimulatorActive}
                  onChange={(e) => {
                    setIsSimulatorActive(e.target.checked);
                    setSyncLogs(`→ [SİMÜLATÖR]: Otomatik arka plan olay takibi ${e.target.checked ? 'AKTİFLEŞTİRİLDİ' : 'DURDURULDU'}.`);
                  }}
                  className="sr-only peer"
                />
                <div className="w-8 h-4 bg-slate-300 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-slate-350 after:border after:rounded-full after:h-3 after:w-3.5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            <button
              type="button"
              onClick={simulateRandomUpdate}
              className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 font-black text-[10px] py-1.5 px-3 rounded-lg cursor-pointer transition-all active:scale-[0.98] flex items-center justify-center gap-1"
            >
              <Icons.Sparkles className="w-3 h-3 text-indigo-700" />
              <span>+ Rastgele Sevk Olayı Tetikle</span>
            </button>
            
            <p className="text-[8px] text-slate-400 font-semibold leading-normal">
              Bu panel, diğer temsilciler e-tablo satırlarını güncellediğinde ekranınıza düşen anlık bildirim akışını simüle etmenizi sağlar.
            </p>
          </div>
        </div>

      </div>

    </div>
  );
}

const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'step_change':
      return <Icons.Shirt className="w-3 h-3 text-emerald-600" />;
    case 'new_order':
      return <Icons.PlusCircle className="w-3 h-3 text-indigo-650" />;
    case 'rep_change':
      return <Icons.UserPlus className="w-3 h-3 text-amber-600" />;
    case 'deleted':
      return <Icons.Trash className="w-3 h-3 text-rose-600" />;
    case 'system':
    default:
      return <Icons.Cpu className="w-3 h-3 text-indigo-700" />;
  }
};
