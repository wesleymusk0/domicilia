import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase/admin';

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

    const db = getAdminDb();

    if (tipo === 'alunos') {
      const snap = await db.collection('domicilia').where('type', '==', 'aluno').where('turmaId', '==', turmaId).get();
      const alunos = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: alunos }, { headers: corsHeaders() });
    }

    if (tipo === 'envios') {
      const snap = await db.collection('domicilia').where('type', '==', 'envio').where('turmaId', '==', turmaId).get();
      const envios = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      return NextResponse.json({ success: true, data: envios }, { headers: corsHeaders() });
    }

    if (tipo === 'historico') {
      const snap = await db.collection('domicilia').where('type', '==', 'historico').where('turmaId', '==', turmaId).get();
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
