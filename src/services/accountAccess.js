import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { PROGRESS_STORAGE_KEY, progressStore } from '../utils/progressStorage';

const validName = value => typeof value === 'string' && value.trim().length > 0 && value.length <= 200;
const listeners = new Set();

let session = null;

function publish(next) {
  session = next;
  listeners.forEach(listener => listener());
}

// Restaura o progresso da nuvem para o navegador e atualiza as telas
async function restoreProgressFromCloud(cloudProgress) {
  try {
    if (cloudProgress) {
      window.localStorage.setItem(PROGRESS_STORAGE_KEY, cloudProgress);
    } else {
      window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
    }
    await progressStore.loadProgress();
  } catch (error) {
    console.error('Erro ao restaurar progresso:', error);
  }
}

// Escuta qualquer nova estrela ou atividade concluída e salva no Firestore automaticamente
let lastSyncedRaw = null;
progressStore.subscribeProgress(() => {
  const user = auth.currentUser;
  if (!user) return;

  const currentRaw = window.localStorage.getItem(PROGRESS_STORAGE_KEY);
  if (currentRaw && currentRaw !== lastSyncedRaw) {
    lastSyncedRaw = currentRaw;
    updateDoc(doc(db, 'usuarios', user.uid), {
      progresso: currentRaw
    }).catch(err => console.error('Erro ao salvar progresso na nuvem:', err));
  }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    lastSyncedRaw = null;
    window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
    await progressStore.loadProgress();
    publish(null);
    return;
  }

  try {
    const userDocRef = doc(db, 'usuarios', user.uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      const data = userSnap.data();
      lastSyncedRaw = data.progresso || null;
      await restoreProgressFromCloud(lastSyncedRaw);

      publish(Object.freeze({
        uid: user.uid,
        email: user.email,
        responsibleName: data.responsibleName,
        userName: data.userName,
        demo: data.isPremium === true
      }));
    } else {
      publish(null);
    }
  } catch (error) {
    console.error('Erro ao buscar perfil no Firestore:', error);
    publish(null);
  }
});

export function getCurrentSession() {
  return session;
}

export function subscribeSession(listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export async function signOut() {
  lastSyncedRaw = null;
  window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
  await progressStore.loadProgress();
  await firebaseSignOut(auth);
  publish(null);
}

export class InvalidAccountCredentials extends Error {
  constructor() {
    super('invalid-account-credentials');
    this.name = 'InvalidAccountCredentials';
  }
}

export class AccountServiceUnavailable extends Error {
  constructor() {
    super('account-service-unavailable');
    this.name = 'AccountServiceUnavailable';
  }
}

export async function activatePremiumDemonstration() {
  const user = auth.currentUser;
  if (!user || !session) throw new AccountServiceUnavailable();

  const userDocRef = doc(db, 'usuarios', user.uid);
  await updateDoc(userDocRef, { isPremium: true });

  const next = Object.freeze({
    ...session,
    demo: true
  });
  publish(next);
  return next;
}

export async function requestAccountAccess(mode, credentials) {
  const email = credentials?.email?.trim();
  const password = credentials?.password;

  if (!email || !password) {
    throw new InvalidAccountCredentials();
  }

  if (mode === 'create') {
    const responsibleName = credentials?.responsibleName?.trim();
    const userName = credentials?.userName?.trim();

    if (!validName(responsibleName) || !validName(userName)) {
      throw new InvalidAccountCredentials();
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Ao criar uma conta nova, garante que ela comece zerada (sem herdar dados antigos do navegador)
      lastSyncedRaw = null;
      window.localStorage.removeItem(PROGRESS_STORAGE_KEY);
      await progressStore.loadProgress();

      await setDoc(doc(db, 'usuarios', user.uid), {
        email,
        responsibleName,
        userName,
        isPremium: false,
        progresso: null,
        criadoEm: new Date().toISOString()
      });

      const newSession = Object.freeze({
        uid: user.uid,
        email: user.email,
        responsibleName,
        userName,
        demo: false
      });

      publish(newSession);
      return newSession;
    } catch (error) {
      if (error.code === 'auth/email-already-in-use' || error.code === 'auth/weak-password' || error.code === 'auth/invalid-email') {
        throw new InvalidAccountCredentials();
      }
      throw new AccountServiceUnavailable();
    }
  }

  if (mode === 'sign-in') {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userSnap = await getDoc(doc(db, 'usuarios', user.uid));
      const data = userSnap.exists() ? userSnap.data() : { responsibleName: 'Responsável', userName: 'Usuário', isPremium: false, progresso: null };

      lastSyncedRaw = data.progresso || null;
      await restoreProgressFromCloud(lastSyncedRaw);

      const loggedSession = Object.freeze({
        uid: user.uid,
        email: user.email,
        responsibleName: data.responsibleName,
        userName: data.userName,
        demo: data.isPremium === true
      });

      publish(loggedSession);
      return loggedSession;
    } catch {
      throw new InvalidAccountCredentials();
    }
  }

  throw new AccountServiceUnavailable();
}
