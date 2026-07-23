import { initializeApp, getApps, cert, type App } from 'firebase-admin/app';
import { getFirestore, type Firestore } from 'firebase-admin/firestore';

let app: App;
let db: Firestore;

function getApp(): App {
  if (!app) {
    if (getApps().length > 0) {
      app = getApps()[0];
    } else {
      // Em desenvolvimento, usa as credenciais do cliente
      // Em producao, usa_SERVICE_ACCOUNT_KEY ou GOOGLE_APPLICATION_CREDENTIALS
      const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        app = initializeApp({ credential: cert(serviceAccount), projectId });
      } else if (projectId) {
        // Modo emulator ou desenvolvimento
        app = initializeApp({ projectId });
      } else {
        app = initializeApp({ projectId: 'domicilia-dev' });
      }
    }
  }
  return app;
}

export function getAdminDb(): Firestore {
  if (!db) {
    db = getFirestore(getApp());
  }
  return db;
}
