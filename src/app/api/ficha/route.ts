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

    // Remove fontes
    Object.keys(zip.files).filter(f => f.startsWith('word/fonts/')).forEach(f => zip.remove(f));

    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('Template invalido');
    let xml = await xmlFile.async('string');

    // Remove paginas 2-5
    const idx = xml.indexOf('Encaminhamento de conte', xml.indexOf('Encaminhamento de conte') + 1);
    if (idx > 0) xml = xml.substring(0, xml.lastIndexOf('<w:p', idx)) + '</w:body></w:document>';

    // Substitui fontes
    xml = xml.replace(/w:ascii="[^"]*"/g, 'w:ascii="Arial"');
    xml = xml.replace(/w:cs="[^"]*"/g, 'w:cs="Arial"');
    xml = xml.replace(/w:eastAsia="[^"]*"/g, 'w:eastAsia="Arial"');
    xml = xml.replace(/w:hAnsi="[^"]*"/g, 'w:hAnsi="Arial"');

    // Substitui textos diretamente nos <w:t>
    xml = xml.replace(/>PROFESSOR: <\//g, `>PROFESSOR: ${dados.professor}</`);
    xml = xml.replace(/>COMPONENTE\/DISCIPLINA: <\//g, `>COMPONENTE/DISCIPLINA: ${dados.disciplina}</`);
    xml = xml.replace(/>ESTUDANTE: <\//g, `>ESTUDANTE: ${dados.aluno}</`);
    xml = xml.replace(/>TURMA: <\//g, `>TURMA: ${dados.turma}</`);
    xml = xml.replace(/>PEDAGOGA RESP.<\//g, `>PEDAGOGA RESP.: ${dados.pedagoga}</`);
    xml = xml.replace(/>QUINZENA\/DATA: <\//g, `>QUINZENA/DATA: ${dados.data}</`);
    xml = xml.replace(/>MÊS:<\//g, `>MES: ${dados.data}</`);
    xml = xml.replace(/>Nº DE AULAS:<\//g, `>NO DE AULAS: ${dados.numAulas}</`);

    // Remove valor antigo do QUINZENA/DATA se existir
    xml = xml.replace(/>05\/02\/2026  a  27\/02\/2026 - <\//g, `>${dados.data}</`);

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
