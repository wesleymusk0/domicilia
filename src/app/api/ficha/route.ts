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

    // Remove fontes embutidas
    Object.keys(zip.files).filter(f => f.startsWith('word/fonts/')).forEach(f => zip.remove(f));

    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('Template invalido');
    let xml = await xmlFile.async('string');

    // Remove paginas 2-5
    const segundoEnc = xml.indexOf('Encaminhamento de conte', xml.indexOf('Encaminhamento de conte') + 1);
    if (segundoEnc > 0) {
      const antes = xml.lastIndexOf('<w:p', segundoEnc);
      xml = xml.substring(0, antes) + '</w:body></w:document>';
    }

    // Substitui fontes
    xml = xml.replace(/w:ascii="[^"]*" w:cs="[^"]*" w:eastAsia="[^"]*" w:hAnsi="[^"]*"/g, 'w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"');

    // PROFESSOR - adiciona valor apos o label
    xml = xml.replace(
      /(<w:t xml:space="preserve">PROFESSOR: <\/w:t>)([\s\S]*?)(<w:t xml:space="preserve">COMPONENTE)/,
      `$1${dados.professor}$3`
    );

    // COMPONENTE/DISCIPLINA
    xml = xml.replace(
      /(<w:t xml:space="preserve">COMPONENTE\/DISCIPLINA: <\/w:t>)([\s\S]*?)(<\/w:r>)/,
      `$1${dados.disciplina}$3`
    );

    // ESTUDANTE
    xml = xml.replace(
      /(<w:t xml:space="preserve">ESTUDANTE: <\/w:t>)([\s\S]*?)(<w:t xml:space="preserve">TURMA)/,
      `$1${dados.aluno}$3`
    );

    // TURMA
    xml = xml.replace(
      /(<w:t xml:space="preserve">TURMA: <\/w:t>)([\s\S]*?)(<\/w:r>)/,
      `$1${dados.turma}$3`
    );

    // PEDAGOGA RESP. - valor vem depois do label na mesma celula
    xml = xml.replace(
      /(<w:t xml:space="preserve">PEDAGOGA RESP.<\/w:t>)([\s\S]*?)(<w:t xml:space="preserve">QUINZENA)/,
      `$1 ${dados.pedagoga}$3`
    );

    // QUINZENA/DATA - substitui o valor existente
    xml = xml.replace(
      /(<w:t xml:space="preserve">QUINZENA\/DATA: <\/w:t>)([\s\S]*?)(<w:t xml:space="preserve">)([\s\S]*?)(<\/w:t>)/,
      `$1$3${dados.data}$5`
    );

    // MÊS
    xml = xml.replace(
      /(<w:t xml:space="preserve">MÊS:<\/w:t>)([\s\S]*?)(<\/w:r>)/,
      `$1 ${dados.data}$3`
    );

    // Nº DE AULAS
    xml = xml.replace(
      /(<w:t xml:space="preserve">Nº DE AULAS:<\/w:t>)([\s\S]*?)(<\/w:r>)/,
      `$1 ${dados.numAulas}$3`
    );

    zip.file('word/document.xml', xml);

    const newBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

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
