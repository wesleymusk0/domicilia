import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const path = formData.get('path') as string;

    if (!file || !path) {
      return NextResponse.json({ error: 'Arquivo e path são obrigatórios' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuração Supabase não encontrada' }, { status: 500 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2);
    const ext = file.name.split('.').pop();
    const fileName = `${timestamp}-${randomString}.${ext}`;
    const fullPath = `${path}/${fileName}`;

    const uploadUrl = `${supabaseUrl}/storage/v1/object/domicilia/${fullPath}`;

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
    apikey: supabaseKey,
    Authorization: `Bearer ${supabaseKey}`,
    "Content-Type": file.type || "application/octet-stream",
    "x-upsert": "false",
},
      body: Buffer.from(arrayBuffer),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Supabase upload error:', errorText);
      throw new Error('Falha no upload para Supabase');
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/domicilia/${fullPath}`;

    return NextResponse.json({
      url: publicUrl,
      path: fullPath,
      nome: file.name,
      tipo: file.type,
      tamanho: file.size,
    });
  } catch (error: any) {
    console.error('Erro no upload:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json({ error: 'Path é obrigatório' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuração Supabase não encontrada' }, { status: 500 });
    }

    const deleteUrl = `${supabaseUrl}/storage/v1/object/domicilia/${path}`;

    const response = await fetch(deleteUrl, {
      method: 'DELETE',
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`,
      },
    });

    if (!response.ok) {
      console.error('Supabase delete error');
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao deletar:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
