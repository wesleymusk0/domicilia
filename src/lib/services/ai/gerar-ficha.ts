import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType, BorderStyle } from 'docx';

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

const b = { style: BorderStyle.SINGLE, size: 8, color: '000000' };
const cellBorders = { top: b, bottom: b, left: b, right: b };
const tb = { style: BorderStyle.SINGLE, size: 4, color: '000001' };
const thinBorders = { top: tb, bottom: tb, left: tb, right: tb };

function cell(label: string, value: string, span?: number) {
  const kids: any[] = [];
  if (label) kids.push(new Paragraph({ children: [new TextRun({ text: label, bold: true, font: 'Arial', size: 20 })], spacing: { after: 0, line: 240 }, alignment: AlignmentType.BOTH }));
  if (value) kids.push(new Paragraph({ children: [new TextRun({ text: value, font: 'Arial', size: 20 })], spacing: { after: 0, line: 240 }, alignment: AlignmentType.BOTH }));
  if (!kids.length) kids.push(new Paragraph({ children: [] }));
  return new TableCell({ width: { size: span ? 1380 + 1920 + 2252 : 4753, type: WidthType.DXA }, borders: cellBorders, columnSpan: span, children: kids });
}

function emptyLines(n: number) {
  return Array(n).fill(null).map(() => new Paragraph({ children: [], spacing: { after: 0, line: 240 }, indent: { left: 141 } }));
}

export async function gerarFicha(data: FichaData): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: { page: { margin: { top: 1000, right: 1000, bottom: 1000, left: 1000 } } },
      children: [
        new Paragraph({
          children: [new TextRun({ text: 'Encaminhamento de conteudo/atividade Domiciliar', bold: true, font: 'Arial', size: 28 })],
          spacing: { after: 57 },
          indent: { right: 288 },
          alignment: AlignmentType.BOTH,
        }),
        new Table({
          width: { size: 10305, type: WidthType.DXA },
          rows: [
            new TableRow({ children: [cell('PROFESSOR: ', data.professor), cell('COMPONENTE/DISCIPLINA: ', data.disciplina, 3)] }),
            new TableRow({ children: [cell('ESTUDANTE: ', data.aluno, 2), cell('TURMA: ', data.turma, 2)] }),
            new TableRow({ children: [cell('PEDAGOGA RESP. ', data.pedagoga, 2), cell('QUINZENA/DATA: ', data.data, 2)] }),
            new TableRow({ children: [cell('MES:', '', 2), cell('FICHA 1:', ''), cell('NO DE AULAS:', data.numAulas)] }),
          ],
        }),
        new Paragraph({ children: [], spacing: { after: 0, line: 240 } }),
        new Paragraph({
          children: [new TextRun({ text: 'ENCAMINHAMENTO:', font: 'Arial', size: 28 })],
          spacing: { after: 0, line: 240 },
          alignment: AlignmentType.BOTH,
        }),
        new Table({
          width: { size: 10230, type: WidthType.DXA },
          rows: [
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 10230, type: WidthType.DXA },
                  borders: thinBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'ROTEIRO DE ESTUDOS', bold: true, font: 'Arial', size: 28 })],
                      spacing: { after: 0, line: 240 },
                      indent: { left: 141 },
                    }),
                    ...emptyLines(18),
                  ],
                }),
              ],
            }),
            new TableRow({
              children: [
                new TableCell({
                  width: { size: 10230, type: WidthType.DXA },
                  borders: thinBorders,
                  children: [
                    new Paragraph({
                      children: [new TextRun({ text: 'OBSERVACOES:', font: 'Arial', size: 20 })],
                      spacing: { after: 0, line: 240 },
                    }),
                    ...emptyLines(4),
                  ],
                }),
              ],
            }),
          ],
        }),
        new Paragraph({ children: [], spacing: { after: 0, line: 240 } }),
        new Paragraph({
          children: [new TextRun({ text: 'DESENVOLVER A ATIVIDADE (TRABALHO/PROVA) NA SEQUENCIA OU ENVIAR AS MESMAS EM ANEXO.', font: 'Arial', size: 28, italics: true })],
          indent: { right: 288 },
          alignment: AlignmentType.BOTH,
        }),
      ],
    }],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}
