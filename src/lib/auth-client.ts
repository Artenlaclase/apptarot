import {
  getAuth,
  GoogleAuthProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  onAuthStateChanged,
  signOut,
  updatePassword,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { app } from './firebase';

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export async function registerWithEmail(email: string, password: string) {
  return createUserWithEmailAndPassword(auth, email, password);
}

export async function loginWithEmail(email: string, password: string) {
  return signInWithEmailAndPassword(auth, email, password);
}

export async function loginWithGoogle() {
  return signInWithPopup(auth, googleProvider);
}

async function getFreshIdToken(user: User): Promise<string> {
  return user.getIdToken(true);
}

export async function createServerSession(user?: User | UserCredential | null): Promise<void> {
  const resolvedUser = user && 'user' in user ? user.user : user ?? auth.currentUser;
  if (!resolvedUser) throw new Error('No authenticated user');

  const idToken = await getFreshIdToken(resolvedUser);

  const response = await fetch('/api/auth/session-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });

  if (!response.ok) {
    let message = 'No se pudo crear la sesion de servidor.';
    try {
      const data = (await response.json()) as { error?: string };
      if (data?.error) message = data.error;
    } catch {
      // keep default message
    }
    throw new Error(message);
  }
}

export async function logoutEverywhere(): Promise<void> {
  await fetch('/api/auth/session-logout', { method: 'POST' });
  await signOut(auth);
}

export async function updateCurrentUserPassword(newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No hay sesion iniciada.');
  await updatePassword(user, newPassword);
}

export { auth, onAuthStateChanged };
