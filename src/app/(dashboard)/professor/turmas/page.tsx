'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfessorLayout from '@/components/layout/ProfessorLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { Aluno, Envio } from '@/types';

interface AlunoComStatus extends Aluno {
  hasPending: boolean;
  periodoAtivo: boolean;
}

export default function TurmaAlunosPage() {
  const router = useRouter();
  const [alunos, setAlunos] = useState<AlunoComStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [turma, setTurma] = useState<any>(null);

  useEffect(() => {
    const turmaData = sessionStorage.getItem('professorTurma');
    if (!turmaData) {
      router.push('/professor/acesso');
      return;
    }
    const turmaParsed = JSON.parse(turmaData);
    setTurma(turmaParsed);
    loadAlunos(turmaParsed);
  }, []);

  const isPeriodoAtivo = (aluno: Aluno): boolean => {
    if (!aluno.domiciliar || !aluno.dataInicio || !aluno.dataFim) return false;
    const hoje = new Date().toISOString().split('T')[0];
    return hoje >= aluno.dataInicio && hoje <= aluno.dataFim;
  };

  const loadAlunos = async (turma: any) => {
    try {
      const [alunosRes, enviosRes] = await Promise.all([
        fetch(`/api/professor/dados?turmaId=${turma.id}&tipo=alunos`),
        fetch(`/api/professor/dados?turmaId=${turma.id}&tipo=envios`),
      ]);

      const alunosData = await alunosRes.json();
      const enviosData = await enviosRes.json();

      const alunosDaTurma = (alunosData.data || []).filter((a: Aluno) => isPeriodoAtivo(a));
      const enviosDaTurma = enviosData.data || [];

      const alunosComStatus: AlunoComStatus[] = alunosDaTurma.map((aluno: Aluno) => {
        const alunoEnvios = enviosDaTurma.filter((e: Envio) => e.alunoId === aluno.id);
        const temPendencia = alunoEnvios.length === 0 || alunoEnvios.some((e: Envio) => e.status === 'pendente');
        return { ...aluno, hasPending: temPendencia, periodoAtivo: true };
      });

      setAlunos(alunosComStatus);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarAtividade = (alunoId: string) => {
    router.push(`/professor/enviar?turmaId=${turma.id}&alunoId=${alunoId}`);
  };

  if (loading) return <PageLoading />;

  return (
    <ProfessorLayout>
      <PageHeader title={turma?.nome || 'Alunos'} description="Alunos com atividade domiciliar ativa" />
      {alunos.length === 0 ? (
        <EmptyState title="Nenhum aluno com domiciliar ativo" description="Nao ha alunos com periodo de domiciliar vigente nesta turma" />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alunos.map((aluno) => (
            <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{aluno.nome}</h3>
                  {aluno.hasPending ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pendente</span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Em dia</span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">Matricula: {aluno.matricula}</p>
                {aluno.dataInicio && aluno.dataFim && (
                  <p className="mt-1 text-sm text-gray-500">Periodo: {aluno.dataInicio} a {aluno.dataFim}</p>
                )}
                <div className="mt-4">
                  <Button onClick={() => handleEnviarAtividade(aluno.id)} size="sm">Enviar Atividade</Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ProfessorLayout>
  );
}
