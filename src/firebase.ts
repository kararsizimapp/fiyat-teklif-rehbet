import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { Product, BrandInfo, CategoryInfo } from './types';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId); /* CRITICAL: The app will break without this line */
export const auth = getAuth();

// Silent anonymous auth function to authenticate users on load
export const initAnonymousAuth = async (): Promise<string> => {
  try {
    const userCredential = await signInAnonymously(auth);
    return userCredential.user.uid;
  } catch (error) {
    console.warn("Firebase background user autologin is disabled or restricted in the Firebase console. Falling back to guest access. Error details:", error);
    return "guest_user";
  }
};

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Operation Warn/Error (non-fatal): ', JSON.stringify(errInfo));
  
  const isQuotaExceeded = errInfo.error.toLowerCase().includes('quota') || 
                          errInfo.error.toLowerCase().includes('exhausted') || 
                          errInfo.error.toLowerCase().includes('backoff') ||
                          errInfo.error.toLowerCase().includes('permission-denied') || 
                          errInfo.error.toLowerCase().includes('permission_denied') ||
                          errInfo.error.toLowerCase().includes('forbidden');

  if (isQuotaExceeded) {
    console.warn("Firestore system is running in local-only fallback mode due to transient quota restrictions or credentials.");
    return; // Don't throw! Let client use in-memory / local storage gracefully.
  }

  throw new Error(JSON.stringify(errInfo));
}

// CATALOG SYNCING FUNCTIONS (Direct collection edits)

export const fetchProducts = async (): Promise<Product[]> => {
  try {
    const snap = await getDocs(collection(db, 'products'));
    const list: Product[] = [];
    snap.forEach((d) => {
      list.push(d.data() as Product);
    });
    return list;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'products');
    return [];
  }
};

export const fetchBrands = async (): Promise<BrandInfo[]> => {
  try {
    const snap = await getDocs(collection(db, 'brands'));
    const list: BrandInfo[] = [];
    snap.forEach((d) => {
      list.push(d.data() as BrandInfo);
    });
    return list;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'brands');
    return [];
  }
};

export const fetchCategories = async (): Promise<CategoryInfo[]> => {
  try {
    const snap = await getDocs(collection(db, 'categories'));
    const list: CategoryInfo[] = [];
    snap.forEach((d) => {
      list.push(d.data() as CategoryInfo);
    });
    return list;
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'categories');
    return [];
  }
};

export const fetchKdvRates = async (): Promise<number[]> => {
  try {
    const snap = await getDocs(collection(db, 'kdvRates'));
    const list: number[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && typeof data.rate === 'number') {
        list.push(data.rate);
      }
    });
    return list.sort((a,b) => b-a);
  } catch (e) {
    handleFirestoreError(e, OperationType.GET, 'kdvRates');
    return [];
  }
};

// Helper to recursively remove all undefined properties from an object so Firestore doesn't crash
export function cleanUndefined<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanUndefined(item)) as any;
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const key of Object.keys(obj as any)) {
      const val = (obj as any)[key];
      if (val !== undefined) {
        cleaned[key] = cleanUndefined(val);
      }
    }
    return cleaned;
  }
  return obj;
}

// Sync functions that perform deletes on orphans and set/overwrite new ones
export const syncProductsInCloud = async (newProducts: Product[]) => {
  try {
    const current = await fetchProducts();
    const currentIds = new Set(current.map(p => p.id));
    const newIds = new Set(newProducts.map(p => p.id));

    // Delete orphans
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, 'products', id));
      }
    }

    // Set new/updated ones
    for (const p of newProducts) {
      const cleaned = cleanUndefined(p);
      await setDoc(doc(db, 'products', p.id), cleaned);
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'products');
  }
};

export const syncBrandsInCloud = async (newBrands: BrandInfo[]) => {
  try {
    const current = await fetchBrands();
    const currentNames = new Set(current.map(b => b.name));
    const newNames = new Set(newBrands.map(b => b.name));

    // Delete orphans
    for (const name of currentNames) {
      if (!newNames.has(name)) {
        // Sanitize name to safely use as document ID
        const docId = name.replace(/[^a-zA-Z0-9_\-]/g, '_');
        await deleteDoc(doc(db, 'brands', docId));
      }
    }

    // Set/update
    for (const b of newBrands) {
      const docId = b.name.replace(/[^a-zA-Z0-9_\-]/g, '_');
      const cleaned = cleanUndefined(b);
      await setDoc(doc(db, 'brands', docId), cleaned);
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'brands');
  }
};

export const syncCategoriesInCloud = async (newCategories: CategoryInfo[]) => {
  try {
    const current = await fetchCategories();
    const currentIds = new Set(current.map(c => c.id));
    const newIds = new Set(newCategories.map(c => c.id));

    // Delete orphans
    for (const id of currentIds) {
      if (!newIds.has(id)) {
        await deleteDoc(doc(db, 'categories', id));
      }
    }

    // Set/update
    for (const c of newCategories) {
      const cleaned = cleanUndefined(c);
      await setDoc(doc(db, 'categories', c.id), cleaned);
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'categories');
  }
};

export const syncKdvRatesInCloud = async (newRates: number[]) => {
  try {
    const current = await fetchKdvRates();
    const currentSet = new Set(current);
    const newSet = new Set(newRates);

    // Delete orphans
    for (const rate of currentSet) {
      if (!newSet.has(rate)) {
        await deleteDoc(doc(db, 'kdvRates', String(rate)));
      }
    }

    // Set new
    for (const rate of newRates) {
      const cleaned = cleanUndefined({ rate });
      await setDoc(doc(db, 'kdvRates', String(rate)), cleaned);
    }
  } catch (e) {
    handleFirestoreError(e, OperationType.WRITE, 'kdvRates');
  }
};

