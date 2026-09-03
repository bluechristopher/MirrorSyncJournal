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
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  uploadString,
  getDownloadURL,
  deleteObject,
  listAll,
  type FirebaseStorage
} from 'firebase/storage';
import type { UserPersona, JournalEntry, JournalPhoto } from './types';

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
export let storage: FirebaseStorage = getStorage(app);

// Subscription manager so App.tsx always receives auth events even if auth instance re-initializes
type AuthListener = (user: User | null) => void;
const listeners = new Set<AuthListener>();
let currentUnsubscribe: (() => void) | null = null;

function setupAuthSubscription() {
  if (currentUnsubscribe) {
    currentUnsubscribe();
    currentUnsubscribe = null;
  }
  try {
    currentUnsubscribe = firebaseOnAuthStateChanged(auth, (user) => {
      listeners.forEach(listener => listener(user));
    });
  } catch (e) {
    console.warn('[Firebase] Auth listener subscription note:', e);
  }
}

// Attach initial auth listener immediately
setupAuthSubscription();

// Dynamic runtime config initialization from Express server
let isInitializing = false;
export async function initializeRuntimeFirebaseConfig(): Promise<boolean> {
  if (isInitializing) return false;
  isInitializing = true;
  try {
    const res = await fetch('/api/firebase-config');
    if (res.ok) {
      const data = await res.json();
      if (data.success && data.config?.apiKey && data.config.apiKey !== 'AIzaSy_demo_client_key') {
        // Skip re-initialization if config is already active
        if (currentConfig.apiKey === data.config.apiKey && currentConfig.projectId === data.config.projectId) {
          return true;
        }

        console.info('[Firebase] Updating to runtime config for project:', data.config.projectId);
        
        // Detach active listener prior to switching app instance
        if (currentUnsubscribe) {
          currentUnsubscribe();
          currentUnsubscribe = null;
        }

        const appName = `mirrorsync_runtime`;
        const existingRuntimeApp = getApps().find(a => a.name === appName);
        if (existingRuntimeApp) {
          app = existingRuntimeApp;
        } else {
          app = initializeApp(data.config, appName);
        }

        currentConfig = data.config;
        auth = getAuth(app);
        db = getFirestore(app);
        storage = getStorage(app);
        setupAuthSubscription();
        return true;
      }
    }
  } catch (err) {
    console.warn('[Firebase] Runtime config fetch fallback:', err);
  } finally {
    isInitializing = false;
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

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export const signInWithGoogle = async (): Promise<User> => {
  await initializeRuntimeFirebaseConfig();
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

// ============================================================================
// 📸 Cloud Storage Asset Management (Photos & AI Generated Banners)
// ============================================================================

/**
 * Client-side image compressor using HTML Canvas
 * Resizes images to max 800px width and compresses to memory-saving JPEG at 0.75 quality
 */
export async function compressImage(
  file: File | Blob, 
  maxWidth = 800, 
  quality = 0.75
): Promise<Blob> {
  if (typeof window === 'undefined') return file;
  
  return new Promise((resolve) => {
    // If SVG or GIF, preserve original format without raster conversion
    if ('type' in file && (file.type === 'image/svg+xml' || file.type === 'image/gif')) {
      return resolve(file);
    }

    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      let { width, height } = img;

      // Restrict width to maxWidth (600px), scaling height proportionally
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        return resolve(file);
      }

      // Fill with white background to handle transparency cleanly in JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);

      // Export as memory-saving JPEG at target quality (default 0.6)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(file);
    };

    img.src = objectUrl;
  });
}

/**
 * Converts a File or Blob into a base64 Data URL (used for local Demo mode & instant preview)
 */
export function fileToDataUrl(file: File | Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Module-level cache: if Cloud Storage is blocked (e.g. CORS not configured on bucket), fallback directly to Firestore
let isCloudStorageBlocked = false;

/**
 * Uploads a photo to Cloud Storage under /users/{userId}/entries/{entryId}/photos/{photoId}_{fileName},
 * or automatically falls back to in-database storage if Storage is disabled or restricted
 */
export async function uploadJournalPhoto(
  userId: string,
  entryId: string,
  file: File | Blob,
  fileName?: string,
  caption?: string
): Promise<JournalPhoto> {
  const photoId = `photo_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = (fileName || 'journal_photo.jpg').replace(/[^a-zA-Z0-9._-]/g, '_').replace(/\.[^/.]+$/, '') + '.jpg';
  const path = `users/${userId}/entries/${entryId}/photos/${photoId}_${cleanName}`;

  // Always compress to 800px max width at 0.75 JPEG quality for memory & bandwidth savings
  const compressed = await compressImage(file, 800, 0.75);

  if (isCloudStorageBlocked) {
    const dataUrl = await fileToDataUrl(compressed);
    return {
      id: photoId,
      url: dataUrl,
      name: cleanName,
      size: compressed.size,
      createdAt: Date.now(),
      caption: caption || undefined,
    };
  }

  try {
    await ensureAuthToken();
    const photoStorageRef = storageRef(storage, path);
    
    const snapshot = await uploadBytes(photoStorageRef, compressed, {
      contentType: 'image/jpeg',
      customMetadata: {
        userId,
        entryId,
        photoId,
        uploadedAt: String(Date.now()),
      }
    });

    const downloadUrl = await getDownloadURL(snapshot.ref);

    return {
      id: photoId,
      url: downloadUrl,
      storagePath: path,
      name: cleanName,
      size: compressed.size,
      createdAt: Date.now(),
      caption: caption || undefined,
    };
  } catch (storageError: any) {
    isCloudStorageBlocked = true;
    console.warn('[Firebase Storage] Cloud Storage upload bypassed/failed (e.g. CORS or bucket permissions). Falling back to Firestore in-document compressed JPEG storage:', storageError?.message || storageError);
    // Cloud Storage fallback: store compressed JPEG base64 Data URL directly in Firestore entry
    const dataUrl = await fileToDataUrl(compressed);
    return {
      id: photoId,
      url: dataUrl,
      name: cleanName,
      size: compressed.size,
      createdAt: Date.now(),
      caption: caption || undefined,
    };
  }
}

/**
 * Deletes a single photo from Cloud Storage
 */
export async function deleteJournalPhoto(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    await ensureAuthToken();
    const photoRef = storageRef(storage, storagePath);
    await deleteObject(photoRef);
  } catch (_error: any) {
    // Silently proceed
  }
}

/**
 * Uploads a generated banner image (Data URL or Blob or Fetch URL) to Cloud Storage with automatic fallback
 * Compresses to max 600px width JPEG at 0.6 quality for memory savings & reliable Firestore fallback.
 */
export async function uploadBannerImageToStorage(
  userId: string,
  entryId: string,
  dataUrlOrBlobOrUrl: string | Blob
): Promise<{ url: string; storagePath?: string }> {
  const timestamp = Date.now();
  const path = `users/${userId}/entries/${entryId}/banner/banner_${timestamp}.jpg`;

  try {
    let sourceBlob: Blob;
    if (typeof dataUrlOrBlobOrUrl === 'string') {
      if (dataUrlOrBlobOrUrl.startsWith('data:')) {
        const res = await fetch(dataUrlOrBlobOrUrl);
        sourceBlob = await res.blob();
      } else if (dataUrlOrBlobOrUrl.startsWith('http://') || dataUrlOrBlobOrUrl.startsWith('https://') || dataUrlOrBlobOrUrl.startsWith('/api/')) {
        const res = await fetch(dataUrlOrBlobOrUrl);
        sourceBlob = await res.blob();
      } else {
        sourceBlob = new Blob([dataUrlOrBlobOrUrl], { type: 'image/jpeg' });
      }
    } else {
      sourceBlob = dataUrlOrBlobOrUrl;
    }

    // Always compress banner to 800px max width at 0.75 JPEG quality
    const compressed = await compressImage(sourceBlob, 800, 0.75);

    // If storage was already flagged as blocked (e.g. CORS preflight failure), skip directly to Firestore base64 fallback
    if (isCloudStorageBlocked) {
      const dataUrl = await fileToDataUrl(compressed);
      return { url: dataUrl };
    }

    try {
      await ensureAuthToken();
      const bannerStorageRef = storageRef(storage, path);
      const snapshot = await uploadBytes(bannerStorageRef, compressed, {
        contentType: 'image/jpeg',
        customMetadata: { userId, entryId, uploadedAt: String(timestamp) }
      });
      const downloadUrl = await getDownloadURL(snapshot.ref);
      return { url: downloadUrl, storagePath: path };
    } catch (_storageErr) {
      isCloudStorageBlocked = true;
      // Cloud Storage not set up or restricted -> fallback to compressed JPEG Data URL for Firestore
      const dataUrl = await fileToDataUrl(compressed);
      return { url: dataUrl };
    }
  } catch (_processErr) {
    // If anything fails in processing, return original string if available
    const fallbackStr = typeof dataUrlOrBlobOrUrl === 'string' ? dataUrlOrBlobOrUrl : '';
    return { url: fallbackStr };
  }
}

/**
 * Deletes any file by its Cloud Storage path
 */
export async function deleteCloudStorageFile(storagePath: string): Promise<void> {
  if (!storagePath) return;
  try {
    await ensureAuthToken();
    const fileRef = storageRef(storage, storagePath);
    await deleteObject(fileRef);
  } catch (_error: any) {
    // Silently proceed
  }
}

/**
 * Purges ALL photos and banner assets associated with an entry from Cloud Storage
 */
export async function deleteAllEntryStorageFiles(userId: string, entryId: string): Promise<void> {
  if (!userId || !entryId) return;

  const folderPaths = [
    `users/${userId}/entries/${entryId}/photos`,
    `users/${userId}/entries/${entryId}/banner`,
  ];

  try {
    await ensureAuthToken();
    for (const folderPath of folderPaths) {
      try {
        const folderRef = storageRef(storage, folderPath);
        const res = await listAll(folderRef);
        await Promise.all(res.items.map((itemRef) => deleteObject(itemRef).catch(() => {})));
      } catch (_err) {
        // Silently continue
      }
    }
  } catch (_e) {
    // Silently continue
  }
}

export type { User };

