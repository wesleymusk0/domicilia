import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const execAsync = promisify(exec);

export async function POST(request: NextRequest) {
  try {
    const dados = await request.json();

    const templatePath = join(process.cwd(), 'ficha.docx');
    const outputPath = join(process.cwd(), 'tmp', `ficha_${Date.now()}.docx`);

    // Cria diretorio tmp se nao existir
    const tmpDir = join(process.cwd(), 'tmp');
    if (!existsSync(tmpDir)) {
      const { mkdirSync } = await import('fs');
      mkdirSync(tmpDir, { recursive: true });
    }

    // Copia template
    if (!existsSync(templatePath)) {
      return NextResponse.json({ error: 'Template ficha.docx nao encontrado' }, { status: 404 });
    }

    const templateBuffer = readFileSync(templatePath);
    writeFileSync(outputPath, templateBuffer);

    // Executa script Python para preencher
    const dadosJson = JSON.stringify(dados);
    await execAsync(`python scripts/preencher_ficha.py "${templatePath}" "${outputPath}" '${dadosJson}'`);

    // Le o arquivo gerado
    const outputBuffer = readFileSync(outputPath);

    // Remove arquivo temporario
    unlinkSync(outputPath);

    return new NextResponse(outputBuffer, {
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
