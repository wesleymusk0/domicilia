import { NextRequest, NextResponse } from 'next/server';
import { gerarFicha } from '@/lib/services/ai/gerar-ficha';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();

    const buffer = await gerarFicha({
      professor: dados.professor || '',
      disciplina: dados.disciplina || '',
      aluno: dados.aluno || '',
      turma: dados.turma || '',
      pedagoga: dados.pedagoga || '',
      data: dados.data || '',
      numAulas: dados.numAulas || '',
      encaminhamento: dados.encaminhamento || '',
      roteiro: dados.roteiro || '',
      observacoes: dados.observacoes || '',
    });

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="ficha_${dados.aluno?.replace(/\s/g, '_') || 'atividade'}.docx"`,
      },
    });
  } catch (error: any) {
    console.error('Erro ao gerar ficha:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
