import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();

    // Le o template original
    const templatePath = join(process.cwd(), 'ficha.docx');
    const templateBuffer = readFileSync(templatePath);

    // Abre o DOCX como ZIP
    const zip = await JSZip.loadAsync(templateBuffer);

    // Le o document.xml
    let documentXml = await zip.file('word/document.xml')?.async('string');

    if (!documentXml) {
      throw new Error('Template invalido');
    }

    // Substitui os campos
    const substitutions: Record<string, string> = {
      'PROFESSOR: ': `PROFESSOR: ${dados.professor || ''}`,
      'COMPONENTE/DISCIPLINA: ': `COMPONENTE/DISCIPLINA: ${dados.disciplina || ''}`,
      'ESTUDANTE: ': `ESTUDANTE: ${dados.aluno || ''}`,
      'TURMA: ': `TURMA: ${dados.turma || ''}`,
      'PEDAGOGA RESP.': `PEDAGOGA RESP.: ${dados.pedagoga || ''}`,
      'QUINZENA/DATA: ': `QUINZENA/DATA: ${dados.data || ''}`,
      'Nº DE AULAS:': `Nº DE AULAS: ${dados.numAulas || ''}`,
      'ENCAMINHAMENTO:': `ENCAMINHAMENTO: ${dados.encaminhamento || ''}`,
      'ROTEIRO DE ESTUDOS': `ROTEIRO DE ESTUDOS: ${dados.roteiro || ''}`,
      'OBSERVAÇÕES:': `OBSERVAÇÕES: ${dados.observacoes || ''}`,
    };

    // Aplica substituicoes
    for (const [key, value] of Object.entries(substitutions)) {
      // Escapa caracteres especiais XML
      const escapedValue = value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');

      // Substitui no XML
      const regex = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
      documentXml = documentXml.replace(regex, escapedValue);
    }

    // Atualiza o ZIP com o novo document.xml
    zip.file('word/document.xml', documentXml);

    // Gera o novo DOCX
    const newBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(new Uint8Array(newBuffer), {
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
