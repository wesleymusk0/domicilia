import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

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

export async function POST(request: NextRequest) {
  try {
    const { senha } = await request.json();
    const db = getAdminDb();

    const configSnap = await db.collection('domicilia').where('type', '==', 'configuracao').get();

    if (configSnap.empty) {
      return NextResponse.json(
        { error: 'Sistema nao configurado' },
        { status: 400, headers: corsHeaders() }
      );
    }

    const configData = configSnap.docs[0].data();
    const senhaProfessor = configData.senhaProfessor || 'professor123';

    if (senha !== senhaProfessor) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401, headers: corsHeaders() }
      );
    }

    const turmasSnap = await db.collection('domicilia').where('type', '==', 'turma').get();
    const turmas = turmasSnap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(
      { success: true, turmas },
      { headers: corsHeaders() }
    );
  } catch (error: any) {
    console.error('Erro na API do professor:', error);
    return NextResponse.json(
      { error: error.message || 'Erro interno' },
      { status: 500, headers: corsHeaders() }
    );
  }
}
