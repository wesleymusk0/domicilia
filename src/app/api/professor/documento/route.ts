import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, getDoc, setDoc } from 'firebase/firestore';

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
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'id obrigatorio' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const docRef = doc(db, 'domicilia', id);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return NextResponse.json(
        { error: 'Documento nao encontrado' },
        { status: 404, headers: corsHeaders() }
      );
    }

    return NextResponse.json(
      { success: true, data: { id: docSnap.id, ...docSnap.data() } },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500, headers: corsHeaders() }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { tipo, data } = await request.json();

    if (!tipo || !data) {
      return NextResponse.json(
        { error: 'tipo e data obrigatorios' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const timestamp = new Date().toISOString();
    const docRef = doc(collection(db, 'domicilia'));
    await setDoc(docRef, {
      ...data,
      type: tipo,
      createdAt: timestamp,
      updatedAt: timestamp,
    });

    return NextResponse.json(
      { success: true, id: docRef.id },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Erro na API:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
