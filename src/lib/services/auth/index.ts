import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
  createUserWithEmailAndPassword,
} from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { User, UserRole } from '@/types';

export class AuthService {
  static async login(email: string, password: string): Promise<User> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const firebaseUser = userCredential.user;

    // Busca pelo campo uid (Firebase Auth UID), nao pelo ID do documento
    const users = await FirestoreService.query<User>(DOC_TYPES.USER, [
      whereEqual('uid', firebaseUser.uid),
    ]);

    if (users.length === 0) {
      throw new Error('Usuario nao encontrado no sistema');
    }

    const user = users[0];

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

    // Cria documento com ID = Firebase Auth UID
    await FirestoreService.createAtId<User>(firebaseUser.uid, DOC_TYPES.USER, {
      uid: firebaseUser.uid,
      email,
      name,
      role,
      active: true,
      domiciliar: false,
      dataInicio: '',
      dataFim: '',
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
    // Busca pelo campo uid
    const users = await FirestoreService.query<User>(DOC_TYPES.USER, [
      whereEqual('uid', uid),
    ]);
    return users.length > 0 ? users[0] : null;
  }
}
