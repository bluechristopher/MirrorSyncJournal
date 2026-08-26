import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User 
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
import firebaseConfig from '../firebase-applet-config.json';
import type { UserPersona, JournalEntry } from './types';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
// Use explicit custom database ID from config if present
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || undefined);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
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
        cleaned[key] = sanitizeForFirestore(value);
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

export { onAuthStateChanged, type User };
