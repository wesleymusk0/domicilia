import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, getDocs, query, where } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '',
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function POST(request: NextRequest) {
  try {
    const { senha } = await request.json();

    // Busca configuracao
    const configQuery = query(collection(db, 'domicilia'), where('type', '==', 'configuracao'));
    const configSnap = await getDocs(configQuery);

    if (configSnap.empty) {
      return NextResponse.json({ error: 'Sistema nao configurado' }, { status: 400 });
    }

    const configData = configSnap.docs[0].data();
    const senhaProfessor = configData.senhaProfessor || 'professor123';

    if (senha !== senhaProfessor) {
      return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 });
    }

    // Busca todas as turmas
    const turmasQuery = query(collection(db, 'domicilia'), where('type', '==', 'turma'));
    const turmasSnap = await getDocs(turmasQuery);
    const turmas = turmasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json({ success: true, turmas });
  } catch (error: any) {
    console.error('Erro na API do professor:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
