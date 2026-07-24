import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';
import { readFileSync } from 'fs';
import { join } from 'path';

export interface FichaData {
  professor: string;
  disciplina: string;
  aluno: string;
  turma: string;
  pedagoga: string;
  data: string;
  numAulas: string;
  encaminhamento: string;
  roteiro: string;
  observacoes: string;
}

export async function gerarFicha(data: FichaData): Promise<Buffer> {
  const borderStyle = {
    style: BorderStyle.SINGLE,
    size: 1,
    color: '000000',
  };

  const cellBorders = {
    top: borderStyle,
    bottom: borderStyle,
    left: borderStyle,
    right: borderStyle,
  };

  const makeCell = (label: string, value: string, width: number = 50) => {
    return new TableCell({
      width: { size: width, type: WidthType.PERCENTAGE },
      borders: cellBorders,
      children: [
        new Paragraph({
          children: [new TextRun({ text: label, bold: true, size: 20 })],
          spacing: { after: 50 },
        }),
        new Paragraph({
          children: [new TextRun({ text: value || '________________', size: 20 })],
        }),
      ],
    });
  };

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          makeCell('PROFESSOR:', data.professor),
          makeCell('DISCIPLINA:', data.disciplina),
        ],
      }),
      new TableRow({
        children: [
          makeCell('ESTUDANTE:', data.aluno),
          makeCell('TURMA:', data.turma),
        ],
      }),
      new TableRow({
        children: [
          makeCell('PEDAGOGA RESP.:', data.pedagoga),
          makeCell('DATA:', data.data),
        ],
      }),
      new TableRow({
        children: [
          makeCell('Nº DE AULAS:', data.numAulas),
          makeCell('QUINZENA:', data.data),
        ],
      }),
    ],
  });

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } },
        },
        children: [
          new Paragraph({
            children: [new TextRun({ text: 'Encaminhamento de conteudo/atividade Domiciliar', bold: true, size: 28 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          table,
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 200 } }),
          new Paragraph({
            children: [new TextRun({ text: 'Conteudos e atividades trimestrais.', size: 20, italics: true })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'ENCAMINHAMENTO:', bold: true, size: 22 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: data.encaminhamento || '________________', size: 22 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'ROTEIRO DE ESTUDOS:', bold: true, size: 22 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: data.roteiro || '________________', size: 22 })],
            spacing: { after: 200 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'OBSERVACOES:', bold: true, size: 22 })],
            spacing: { after: 100 },
          }),
          new Paragraph({
            children: [new TextRun({ text: data.observacoes || '________________', size: 22 })],
            spacing: { after: 400 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'DESENVOLVER A ATIVIDADE (TRABALHO/PROVA) NA SEQUENCIA OU ENVIAR AS MESMAS EM ANEXO.', size: 18, italics: true })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: '________________________________________', size: 22 })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Assinatura do Professor(a)', size: 18, color: '666666' })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 100 },
          }),
        ],
      },
    ],
  });

  const buffer = await Packer.toBuffer(doc);
  return Buffer.from(buffer);
}
