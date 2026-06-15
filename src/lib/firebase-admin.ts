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

const adminApp = getApps().length
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

export const adminAuth = getAuth(adminApp);
export const adminDb = getFirestore(adminApp);
