import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const file = formData.get('file') as File | null;
    const path = formData.get('path') as string | null;

    if (!file || !path) {
      return NextResponse.json(
        { error: 'Arquivo e path são obrigatórios.' },
        { status: 400 }
      );
    }

    const ext = file.name.includes('.')
      ? file.name.split('.').pop()
      : '';

    const fileName = `${Date.now()}-${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
    const fullPath = `${path}/${fileName}`;

    const { error } = await supabase.storage
      .from('domicilia')
      .upload(fullPath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'application/octet-stream',
      });

    if (error) {
      console.error('Erro Supabase Upload:', error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    const {
      data: { publicUrl },
    } = supabase.storage
      .from('domicilia')
      .getPublicUrl(fullPath);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      path: fullPath,
      nome: file.name,
      tipo: file.type,
      tamanho: file.size,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message ?? 'Erro interno.',
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { path } = await request.json();

    if (!path) {
      return NextResponse.json(
        { error: 'Path é obrigatório.' },
        { status: 400 }
      );
    }

    const { error } = await supabase.storage
      .from('domicilia')
      .remove([path]);

    if (error) {
      console.error('Erro Supabase Delete:', error);

      return NextResponse.json(
        {
          error: error.message,
          details: error,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
    });
  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        error: err.message ?? 'Erro interno.',
      },
      { status: 500 }
    );
  }
}