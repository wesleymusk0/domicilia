import { initializeApp, getApps } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

export const firebaseConfig = {
  apiKey: "AIzaSyCDHRBsCdYRh8naxEClHC0sXLHl58SaYAY",
  authDomain: "domicilia-systematrix.firebaseapp.com",
  projectId: "domicilia-systematrix",
  storageBucket: "domicilia-systematrix.firebasestorage.app",
  messagingSenderId: "512465281481",
  appId: "1:512465281481:web:2362601972757a0fcf8818",
  measurementId: "G-QEH7LEY7ZL"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
