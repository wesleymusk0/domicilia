import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

export interface FichaData {
  alunoNome: string;
  turmaNome: string;
  disciplina: string;
  dataEnvio: string;
  professorNome: string;
  observacoes: string;
  atividadeRef: string;
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

  const cellPadding = { top: 80, bottom: 80, left: 100, right: 100 };

  const table = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Aluno(a):', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.alunoNome, size: 22 })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Turma:', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.turmaNome, size: 22 })] }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Disciplina:', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.disciplina, size: 22 })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Data:', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.dataEnvio, size: 22 })] }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Professor(a):', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.professorNome, size: 22 })] }),
            ],
          }),
          new TableCell({
            width: { size: 50, type: WidthType.PERCENTAGE },
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Referencia:', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.atividadeRef, size: 22 })] }),
            ],
          }),
        ],
      }),
      new TableRow({
        children: [
          new TableCell({
            width: { size: 100, type: WidthType.PERCENTAGE },
            columnSpan: 2,
            borders: cellBorders,
            children: [
              new Paragraph({ children: [new TextRun({ text: 'Observacoes:', bold: true, size: 22 })], spacing: { after: 100 } }),
              new Paragraph({ children: [new TextRun({ text: data.observacoes || 'Nenhuma observacao', size: 22 })] }),
            ],
          }),
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
            children: [new TextRun({ text: 'FICHA DE ATIVIDADE DOMICILIAR', bold: true, size: 32 })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 300 },
          }),
          new Paragraph({
            children: [new TextRun({ text: 'Sistema de Gerenciamento de Atividades', size: 20, color: '666666' })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 },
          }),
          table,
          new Paragraph({ children: [new TextRun({ text: '' })], spacing: { before: 600 } }),
          new Paragraph({
            children: [new TextRun({ text: '_________________________________', size: 22 })],
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
