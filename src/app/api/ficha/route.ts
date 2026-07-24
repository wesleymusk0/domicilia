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

    // Remove as fontes embutidas (reduz tamanho drasticamente)
    const fontFiles = Object.keys(zip.files).filter(f => f.startsWith('word/fonts/'));
    fontFiles.forEach(f => zip.remove(f));

    // Remove referencias as fontes no [Content_Types].xml
    const contentTypes = zip.file('[Content_Types].xml');
    if (contentTypes) {
      let ct = await contentTypes.async('string');
      fontFiles.forEach(f => {
        const partName = '/' + f;
        const regex = new RegExp(`<Override PartName="${partName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^/]*/>`, 'g');
        ct = ct.replace(regex, '');
      });
      zip.file('[Content_Types].xml', ct);
    }

    // Remove referencias as fontes no word/_rels/document.xml.rels
    const rels = zip.file('word/_rels/document.xml.rels');
    if (rels) {
      let relsXml = await rels.async('string');
      fontFiles.forEach(f => {
        const target = f.replace('word/', '');
        const regex = new RegExp(`<Relationship[^>]*Target="${target.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"[^/]*/>`, 'g');
        relsXml = relsXml.replace(regex, '');
      });
      zip.file('word/_rels/document.xml.rels', relsXml);
    }

    // Modifica o document.xml
    const xmlFile = zip.file('word/document.xml');
    if (!xmlFile) throw new Error('Template invalido');
    let xml = await xmlFile.async('string');

    // Remove do 2o "Encaminhamento" em diante (mantem so a 1a ficha)
    const segundoEnc = xml.indexOf('Encaminhamento de conte', xml.indexOf('Encaminhamento de conte') + 1);
    if (segundoEnc > 0) {
      const antes = xml.lastIndexOf('<w:p', segundoEnc);
      xml = xml.substring(0, antes) + '</w:body></w:document>';
    }

    // Substitui as fontes embutidas por Arial
    xml = xml.replace(/w:ascii="[^"]*" w:cs="[^"]*" w:eastAsia="[^"]*" w:hAnsi="[^"]*"/g, 'w:ascii="Arial" w:cs="Arial" w:eastAsia="Arial" w:hAnsi="Arial"');

    // Preenche os campos
    xml = xml.replace(/<w:t xml:space="preserve">PROFESSOR: <\/w:t>/g, `<w:t xml:space="preserve">PROFESSOR: ${dados.professor}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">COMPONENTE\/DISCIPLINA: <\/w:t>/g, `<w:t xml:space="preserve">COMPONENTE/DISCIPLINA: ${dados.disciplina}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">ESTUDANTE: <\/w:t>/g, `<w:t xml:space="preserve">ESTUDANTE: ${dados.aluno}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">TURMA: <\/w:t>/g, `<w:t xml:space="preserve">TURMA: ${dados.turma}</w:t>`);
    xml = xml.replace(/<w:t xml:space="preserve">PEDAGOGA RESP.<\/w:t>/g, `<w:t xml:space="preserve">PEDAGOGA RESP.: ${dados.pedagoga}</w:t>`);
    xml = xml.replace(/05\/02\/2026  a  27\/02\/2026 - /g, dados.data);

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
