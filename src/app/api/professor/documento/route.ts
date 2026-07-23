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

    const db = getAdminDb();
    const docSnap = await db.collection('domicilia').doc(id).get();

    if (!docSnap.exists) {
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

    const db = getAdminDb();
    const timestamp = new Date().toISOString();

    const docRef = await db.collection('domicilia').add({
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
