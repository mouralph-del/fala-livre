import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD2xUMn1N4NK0lOvMkI88psIroWeo1oAD8",
  authDomain: "://firebaseapp.com",
  projectId: "fala-livre-9c4af",
  storageBucket: "fala-livre-9c4af.firebasestorage.app",
  messagingSenderId: "964513814111",
  appId: "1:964513814111:web:58ad64e094111befb5edea"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
