import { NextRequest, NextResponse } from 'next/server';
import { readFileSync } from 'fs';
import { join } from 'path';
import JSZip from 'jszip';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();

    const templatePath = join(process.cwd(), 'ficha.docx');
    const templateBuffer = readFileSync(templatePath);
    const zip = await JSZip.loadAsync(templateBuffer);
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('Template invalido');
    let xml = await xmlFile.async('string');

    // Remove do 2o "Encaminhamento" em diante (mantem so a 1a ficha)
    const segundoEncaminhamento = xml.indexOf('Encaminhamento de conte', xml.indexOf('Encaminhamento de conte') + 1);
    if (segundoEncaminhamento > 0) {
      // Encontra o inicio do paragrafo anterior ao segundo encaminhamento
      const antes = xml.lastIndexOf('<w:p', segundoEncaminhamento);
      xml = xml.substring(0, antes) + '</w:body></w:document>';
    }

    // Preenche os campos na unica ficha restante
    xml = xml.replace(/<w:t xml:space="preserve">PROFESSOR: <\/w:t>/g, `<w:t xml:space="preserve">PROFESSOR: ${dados.professor}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">COMPONENTE\/DISCIPLINA: <\/w:t>/g, `<w:t xml:space="preserve">COMPONENTE/DISCIPLINA: ${dados.disciplina}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">ESTUDANTE: <\/w:t>/g, `<w:t xml:space="preserve">ESTUDANTE: ${dados.aluno}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">TURMA: <\/w:t>/g, `<w:t xml:space="preserve">TURMA: ${dados.turma}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">PEDAGOGA RESP.<\/w:t>/g, `<w:t xml:space="preserve">PEDAGOGA RESP.: ${dados.pedagoga}</w:t>`);
    xml = xml.replace(/05\/02\/2026  a  27\/02\/2026 - /g, dados.data);

    zip.file('word/document.xml', xml);
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
