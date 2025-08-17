// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import type { FirebaseApp } from "firebase/app";
import { 
  getFirestore, 
  initializeFirestore,
  collection,
  getDocs,
  type Firestore,
  type FirestoreError
} from "firebase/firestore";
import { 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// Define la interfaz para la configuración de Firebase
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

// Firebase configuration using environment variables
const firebaseConfig: FirebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY as string,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN as string,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID as string,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID as string,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID as string
};

// ✅ Prevent duplicate initialization error
const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache
let db: Firestore;
try {
  if (typeof window !== 'undefined') { // Only use persistence in browser environment
    // Initialize with persistence enabled
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    });
    console.log('Firebase initialized with persistent cache');
  } else {
    // Standard initialization for SSR
    db = getFirestore(app);
  }
} catch (err) {
  console.error('Error initializing Firebase with persistence:', err);
  // Fallback to standard initialization
  db = getFirestore(app);
}

// Connect to emulator for local development (uncomment if needed)
/*
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  connectFirestoreEmulator(db, 'localhost', 8080);
  console.log('Connected to Firestore emulator');
}
*/

// Export the Firestore instance
export { db };

// Error handling for FirebaseError
export function handleFirebaseError(error: FirestoreError): string {
  console.error('Firebase error:', error.code, error.message);
  
  switch (error.code) {
    case 'permission-denied':
      return 'Acceso denegado. Verifica los permisos de Firestore.';
    case 'unavailable':
      return 'Servicio no disponible. Comprueba tu conexión a internet.';
    case 'not-found':
      return 'El documento solicitado no existe.';
    case 'cancelled':
      return 'La operación fue cancelada.';
    default:
      return 'Error al conectar con la base de datos. Inténtalo más tarde.';
  }
}

// Interface for card data
export interface Card {
  id: string;
  name: string;
  type: 'major' | 'minor';
  suit?: string;
  description?: string;
  image_url?: string;
}

// Function to get all cards from Firestore
export async function getAllCards(): Promise<Card[]> {
  try {
    const querySnapshot = await getDocs(collection(db, 'cards'));
    const cards: Card[] = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.nombre || data.name || 'Sin nombre',
        type: data.arcano === 'mayor' ? 'major' : 'minor',
        suit: data.palo || data.suit,
        description: data.descripcion || data.description,
        image_url: data.imagem || data.image_url || data.imagen
      } as Card;
    });
    
    return cards;
  } catch (error) {
    console.error('Error fetching cards:', error);
    throw error;
  }
}

// Export types for better TypeScript support
export type { FirebaseApp, Firestore, FirestoreError };