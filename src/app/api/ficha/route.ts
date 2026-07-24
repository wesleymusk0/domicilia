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
    const zip = await JSZip.loadAsync(templateBuffer);
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('Template invalido');
    let xml = await xmlFile.async('string');

    // Substitui QUINZENA/DATA (ja tem valor "05/02/2026 a 27/02/2026")
    xml = xml.replace(
      /05\/02\/2026  a  27\/02\/2026 - /g,
      dados.data || ''
    );

    // Substitui PROFESSOR (campo vazio apos o label)
    xml = xml.replace(
      /<w:t xml:space="preserve">PROFESSOR: <\/w:t>/g,
      `<w:t xml:space="preserve">PROFESSOR: ${dados.professor}</w:t>`
    );

    // Substitui COMPONENTE/DISCIPLINA
    xml = xml.replace(
      /<w:t xml:space="preserve">COMPONENTE\/DISCIPLINA: <\/w:t>/g,
      `<w:t xml:space="preserve">COMPONENTE/DISCIPLINA: ${dados.disciplina}</w:t>`
    );

    // Substitui ESTUDANTE
    xml = xml.replace(
      /<w:t xml:space="preserve">ESTUDANTE: <\/w:t>/g,
      `<w:t xml:space="preserve">ESTUDANTE: ${dados.aluno}</w:t>`
    );

    // Substitui TURMA
    xml = xml.replace(
      /<w:t xml:space="preserve">TURMA: <\/w:t>/g,
      `<w:t xml:space="preserve">TURMA: ${dados.turma}</w:t>`
    );

    // Substitui PEDAGOGA RESP.
    xml = xml.replace(
      /<w:t xml:space="preserve">PEDAGOGA RESP.<\/w:t>/g,
      `<w:t xml:space="preserve">PEDAGOGA RESP.: ${dados.pedagoga}</w:t>`
    );

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
