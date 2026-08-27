import { initializeApp, getApps, getApp, deleteApp, type FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged as firebaseOnAuthStateChanged,
  type User,
  type Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  getDocs, 
  query, 
  orderBy, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';

const defaultFallbackConfig = {
  projectId: "genaiacademy3",
  appId: "1:217104786977:web:default",
  apiKey: "AIzaSy_demo_client_key",
  authDomain: "genaiacademy3.firebaseapp.com",
  firestoreDatabaseId: "(default)",
  storageBucket: "genaiacademy3.firebasestorage.app",
  messagingSenderId: "217104786977",
};

// Determine initial config synchronously from environment variables if present
const getInitialConfig = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const appId = import.meta.env.VITE_FIREBASE_APP_ID;

  if (apiKey && apiKey !== 'AIzaSy_demo_client_key') {
    const pId = projectId || "genaiacademy3";
    return {
      projectId: pId,
      appId: appId || "1:217104786977:web:default",
      apiKey: apiKey,
      authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${pId}.firebaseapp.com`,
      firestoreDatabaseId: "(default)",
      storageBucket: `${pId}.firebasestorage.app`,
      messagingSenderId: "217104786977",
    };
  }
  return defaultFallbackConfig;
};

let currentConfig = getInitialConfig();
export let app: FirebaseApp = !getApps().length ? initializeApp(currentConfig) : getApp();
export let auth: Auth = getAuth(app);
export let db = getFirestore(app);

// Subscription manager so App.tsx always receives auth events even if auth instance re-initializes
type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();
let currentUnsubscribe: (() => void) | null = null;

function setupAuthSubscription() {
  if (currentUnsubscribe) {
    currentUnsubscribe();
  }
  currentUnsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
    listeners.forEach(listener => listener(user));
  });
}

// Attach initial auth listener immediately
setupAuthSubscription();

// Dynamic runtime config initialization from Express server
export async function initializeRuntimeFirebaseConfig(): Promise<boolean> {
  try {
    const res = await fetch('/api/firebase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config?.apiKey && data.config.apiKey !== 'AIzaSy_demo_client_key') {
        console.info('[Firebase] Loaded dynamic runtime config for project:', data.config.projectId);
        if (getApps().length) {
          await deleteApp(getApp());
        }
        app = initializeApp(data.config);
        auth = getAuth(app);
        db = getFirestore(app);
        setupAuthSubscription();
        return true;
      }
    }
  } catch (err) {
    console.warn('[Firebase] Runtime config fetch fallback:', err);
  }
  return false;
}

// Trigger runtime fetch automatically on page load
if (typeof window !== 'undefined') {
  initializeRuntimeFirebaseConfig();
}

// Custom wrapper exported for App.tsx that registers callbacks to the active Auth instance
export function onAuthStateChanged(_authInstance: Auth, callback: AuthListener): () => void {
  listeners.add(callback);
  callback(auth.currentUser);
  return () => {
    listeners.delete(callback);
  };
}

let isInitializing = false;
let initializedConfigKey = `${currentConfig.apiKey}:${currentConfig.projectId}`;

// Fetch dynamic runtime config from Secret Manager backend if not already set
export async function initializeRuntimeFirebase(): Promise<void> {
  if (isInitializing) return;
  isInitializing = true;
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.firebaseApiKey && data.firebaseApiKey !== 'AIzaSy_demo_client_key') {
        const configKey = `${data.firebaseApiKey}:${data.projectId}`;
        if (configKey !== initializedConfigKey) {
          const liveConfig = {
            projectId: data.projectId || "genaiacademy3",
            appId: data.appId || "1:217104786977:web:default",
            apiKey: data.firebaseApiKey,
            authDomain: data.authDomain || `${data.projectId || "genaiacademy3"}.firebaseapp.com`,
            firestoreDatabaseId: "(default)",
            storageBucket: `${data.projectId || "genaiacademy3"}.firebasestorage.app`,
            messagingSenderId: "217104786977",
          };
          
          if (getApps().length) {
            await deleteApp(app).catch(() => {});
          }
          
          app = initializeApp(liveConfig);
          auth = getAuth(app);
          db = getFirestore(app);
          initializedConfigKey = configKey;
          
          setupAuthSubscription();
        }
      }
    }
  } catch (e) {
    console.warn('Could not load dynamic firebase config from /api/config:', e);
  } finally {
    isInitializing = false;
  }
}

// Auto-run on module load in background
initializeRuntimeFirebase();

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
  await initializeRuntimeFirebase();
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

export const logOut = async (): Promise<void> => {
  await firebaseSignOut(auth);
};

// Ensure current user token is fresh before database calls
const ensureAuthToken = async () => {
  if (auth.currentUser) {
    try {
      await auth.currentUser.getIdToken();
    } catch {
      // ignore
    }
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

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
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
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== undefined) {
        // Prevent Firestore 1MB field limit crash by storing null instead of heavy base64 strings
        if (key === 'bannerImageUrl' && typeof value === 'string' && value.length > 500000) {
          cleaned[key] = null;
        } else {
          const sanitizedVal = sanitizeForFirestore(value);
          if (sanitizedVal !== undefined) {
            cleaned[key] = sanitizedVal;
          }
        }
      }
    }
    return cleaned as any;
  }
  return data;
}

// Database helper methods maintaining strict path isolation /users/{userId} and /users/{userId}/entries/{entryId}
export const getUserPersona = async (userId: string): Promise<UserPersona | null> => {
  const path = `users/${userId}`;
  try {
    await ensureAuthToken();
    const userDocRef = doc(db, 'users', userId);
    const snap = await getDoc(userDocRef);
    if (snap.exists()) {
      return snap.data() as UserPersona;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
};

export const saveUserPersona = async (userId: string, persona: Partial<UserPersona>): Promise<void> => {
  const path = `users/${userId}`;
  try {
    await ensureAuthToken();
    const userDocRef = doc(db, 'users', userId);
    const cleaned = sanitizeForFirestore({
      ...persona,
      userId,
      updatedAt: Date.now()
    });
    await setDoc(userDocRef, cleaned, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const getJournalEntries = async (userId: string): Promise<JournalEntry[]> => {
  const path = `users/${userId}/entries`;
  try {
    await ensureAuthToken();
    const entriesRef = collection(db, 'users', userId, 'entries');
    const q = query(entriesRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as JournalEntry[];
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
  }
};

export const saveJournalEntry = async (userId: string, entry: JournalEntry): Promise<void> => {
  const path = `users/${userId}/entries/${entry.id}`;
  try {
    await ensureAuthToken();
    const entryDocRef = doc(db, 'users', userId, 'entries', entry.id);
    const cleaned = sanitizeForFirestore(entry);
    await setDoc(entryDocRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
};

export const updateJournalEntry = async (userId: string, entryId: string, updates: Partial<JournalEntry>): Promise<void> => {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    await ensureAuthToken();
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    const cleaned = sanitizeForFirestore(updates);
    await updateDoc(entryDocRef, cleaned);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
};

export const deleteJournalEntry = async (userId: string, entryId: string): Promise<void> => {
  const path = `users/${userId}/entries/${entryId}`;
  try {
    await ensureAuthToken();
    const entryDocRef = doc(db, 'users', userId, 'entries', entryId);
    await deleteDoc(entryDocRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export const deleteAllJournalEntries = async (userId: string): Promise<void> => {
  const path = `users/${userId}/entries`;
  try {
    await ensureAuthToken();
    const entriesRef = collection(db, 'users', userId, 'entries');
    const snap = await getDocs(entriesRef);
    const deletePromises = snap.docs.map(docSnap => deleteDoc(docSnap.ref));
    await Promise.all(deletePromises);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
};

export type { User };
