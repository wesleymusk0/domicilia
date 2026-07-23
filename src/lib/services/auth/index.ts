import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { FirestoreService, DOC_TYPES } from '@/lib/services/firestore';
import { User, UserRole } from '@/types';

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    const user = await FirestoreService.getById<User>(firebaseUser.uid);

    if (!user) {
      throw new Error('Usuario nao encontrado no sistema');
    }

    if (user.type !== DOC_TYPES.USER) {
      throw new Error('Documento invalido');
    }

    if (!user.active) {
      throw new Error('Conta desabilitada. Contate o administrador.');
    }

    return user;
  }

  static async register(
    email: string,
    password: string,
    name: string,
    role: UserRole
  ): Promise<string> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Usa o UID do Firebase como ID do documento
    await FirestoreService.createAtId<User>(firebaseUser.uid, DOC_TYPES.USER, {
      uid: firebaseUser.uid,
      email,
      name,
      role,
      active: true,
    });

    return firebaseUser.uid;
  }

  static async logout(): Promise<void> {
    await signOut(auth);
  }

  static getCurrentUser(): FirebaseUser | null {
    return auth.currentUser;
  }

  static onAuthStateChange(callback: (user: FirebaseUser | null) => void): () => void {
    return onAuthStateChanged(auth, callback);
  }

  static async getUserData(uid: string): Promise<User | null> {
    const user = await FirestoreService.getById<User>(uid);
    if (user && user.type === DOC_TYPES.USER) {
      return user;
    }
    return null;
  }
}
