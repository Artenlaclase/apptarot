// src/lib/firebase.js
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore, 
  connectFirestoreEmulator,
  initializeFirestore
} from "firebase/firestore";
import { 
  persistentLocalCache, 
  persistentMultipleTabManager 
} from "firebase/firestore";

// Firebase configuration using environment variables
const firebaseConfig = {
  apiKey: import.meta.env.PUBLIC_FIREBASE_API_KEY,
  authDomain: import.meta.env.PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.PUBLIC_FIREBASE_APP_ID
};

// ✅ Prevent duplicate initialization error
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firestore with persistent local cache
let db;
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
export function handleFirebaseError(error) {
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