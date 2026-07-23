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

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders() });
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const turmaId = searchParams.get('turmaId');
    const tipo = searchParams.get('tipo') || 'alunos';

    if (!turmaId) {
      return NextResponse.json(
        { error: 'turmaId obrigatorio' },
        { status: 400, headers: corsHeaders() }
      );
    }

    if (tipo === 'alunos') {
      const q = query(collection(db, 'domicilia'), where('type', '==', 'aluno'), where('turmaId', '==', turmaId));
      const snap = await getDocs(q);
      const alunos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: alunos }, { headers: corsHeaders() });
    }

    if (tipo === 'envios') {
      const q = query(collection(db, 'domicilia'), where('type', '==', 'envio'), where('turmaId', '==', turmaId));
      const snap = await getDocs(q);
      const envios = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: envios }, { headers: corsHeaders() });
    }

    if (tipo === 'historico') {
      const q = query(collection(db, 'domicilia'), where('type', '==', 'historico'), where('turmaId', '==', turmaId));
      const snap = await getDocs(q);
      const historico = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: historico }, { headers: corsHeaders() });
    }

    return NextResponse.json(
      { error: 'Tipo invalido' },
      { status: 400, headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Erro na API do professor:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
