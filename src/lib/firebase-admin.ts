import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';

function getServiceAccount() {
  const projectId = import.meta.env.FIREBASE_ADMIN_PROJECT_ID;
  const clientEmail = import.meta.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const privateKeyRaw = import.meta.env.FIREBASE_ADMIN_PRIVATE_KEY;

  if (!projectId || !clientEmail || !privateKeyRaw) {
    throw new Error('Missing Firebase Admin env vars. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL and FIREBASE_ADMIN_PRIVATE_KEY.');
  }

  return {
    projectId,
    clientEmail,
    privateKey: String(privateKeyRaw).replace(/\\n/g, '\n'),
  };
}

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert(getServiceAccount()),
    });

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
