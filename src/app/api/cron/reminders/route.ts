import { NextRequest, NextResponse } from 'next/server';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Aluno, Turma, Envio, User, LembreteConfig, ConfiguracaoGlobal } from '@/types';
import { emailService } from '@/lib/services/email';

export const runtime = 'nodejs';

function isPeriodoAtivo(aluno: Aluno): boolean {
  if (!aluno.domiciliar || !aluno.dataInicio || !aluno.dataFim) return false;
  const hoje = new Date().toISOString().split('T')[0];
  return hoje >= aluno.dataInicio && hoje <= aluno.dataFim;
}

export async function GET(request: NextRequest) {
  return handleRemindersCron();
}

export async function POST(request: NextRequest) {
  return handleRemindersCron();
}

async function handleRemindersCron() {
  try {
    const [todosAlunos, todasTurmas, todosEnvios, todosProfessores, lembretesConfig, configsGlobal] = await Promise.all([
      FirestoreService.getAllByType<Aluno>(DOC_TYPES.ALUNO),
      FirestoreService.getAllByType<Turma>(DOC_TYPES.TURMA),
      FirestoreService.getAllByType<Envio>(DOC_TYPES.ENVIO),
      FirestoreService.query<User>(DOC_TYPES.USER, [whereEqual('role', 'professor')]),
      FirestoreService.getAllByType<LembreteConfig>(DOC_TYPES.LEMBRETE),
      FirestoreService.getAllByType<ConfiguracaoGlobal>(DOC_TYPES.CONFIGURACAO),
    ]);

    const alunosAtivos = todosAlunos.filter((a) => a.active !== false && isPeriodoAtivo(a));
    const configGlobal = configsGlobal.length > 0 ? configsGlobal[0] : null;

    let lembretesEnviados = 0;

    for (const aluno of alunosAtivos) {
      const turma = todasTurmas.find((t) => t.id === aluno.turmaId);
      if (!turma) continue;

      const alunoEnvios = todosEnvios.filter((e) => e.alunoId === aluno.id && e.turmaId === turma.id);
      const temEnvioReal = alunoEnvios.some((e) => e.status === 'enviado' || e.status === 'gerado_ia');

      if (!temEnvioReal) {
        const profsTurma = todosProfessores.filter((p) => turma.professorIds?.includes(p.id));

        for (const prof of profsTurma) {
          const lembretePedagogo = lembretesConfig.find((l) => l.pedagogoId === turma.pedagogoId && l.ativo);

          const config = {
            textoEmail: lembretePedagogo?.textoEmail || configGlobal?.textoEmailLembrete || 'Lembrete: Você possui atividade domiciliar pendente.',
            assinatura: lembretePedagogo?.assinatura || configGlobal?.assinaturaEmail || 'Atenciosamente,\nCoordenação Pedagógica',
          };

          await emailService.sendReminder(
            prof,
            aluno.nome,
            turma.nome,
            prof.disciplinas?.[0] || 'Atividade Domiciliar',
            aluno.dataFim,
            config as any
          );
          lembretesEnviados++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      lembretesEnviados,
    });
  } catch (error: any) {
    console.error('Erro na rota de cron de lembretes:', error);
    return NextResponse.json({ error: error.message || 'Erro interno' }, { status: 500 });
  }
}
