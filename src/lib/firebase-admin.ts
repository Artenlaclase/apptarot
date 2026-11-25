import { cert, getApps, initializeApp, applicationDefault } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const projectId = import.meta.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = import.meta.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = import.meta.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) return null;

  return {
    projectId,
    clientEmail,
    privateKey: String(privateKeyRaw).replace(/\\n/g, '\n'),
  };
}

const serviceAccount = getServiceAccount();

let adminApp: ReturnType<typeof getApps>[number] | null = null;

try {
  adminApp = getApps().length
    ? getApps()[0]
    : initializeApp(
        serviceAccount
          ? {
              credential: cert(serviceAccount),
            }
          : {
              // Fallback for local development when Admin env vars are not set.
              // Requires ADC (gcloud auth application-default login) for privileged operations.
              credential: applicationDefault(),
              projectId: import.meta.env.PUBLIC_FIREBASE_PROJECT_ID,
            }
      );
} catch (error) {
  console.warn('[firebase-admin] Firebase Admin SDK not initialized:', error);
}

function makeUnavailableProxy<T>(name: string): T {
  return new Proxy(
    {},
    {
      get() {
        throw new Error(
          `[firebase-admin] ${name} unavailable. Configure FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY in .env.`
        );
      },
    }
  ) as T;
}

export const adminAuth = adminApp ? getAuth(adminApp) : makeUnavailableProxy<ReturnType<typeof getAuth>>('Auth');
export const adminDb = adminApp ? getFirestore(adminApp) : makeUnavailableProxy<ReturnType<typeof getFirestore>>('Firestore');
