'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Aluno, Envio } from '@/types';

interface AlunoWithStatus extends Aluno {
  hasPending: boolean;
  lastEnvio?: Envio;
}

export default function TurmaAlunosPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const turmaId = params.id as string;

  const [alunos, setAlunos] = useState<AlunoWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadAlunos();
  }, [turmaId, user]);

  const loadAlunos = async () => {
    try {
      const [alunosData, enviosData] = await Promise.all([
        FirestoreService.query<Aluno>(DOC_TYPES.ALUNO, [
          whereEqual('turmaId', turmaId),
          whereEqual('active', true),
        ]),
        FirestoreService.query<Envio>(DOC_TYPES.ENVIO, [
          whereEqual('turmaId', turmaId),
          whereEqual('professorId', user!.id),
        ]),
      ]);

      const alunosWithStatus: AlunoWithStatus[] = alunosData.map((aluno) => {
        const alunoEnvios = enviosData.filter((e) => e.alunoId === aluno.id);
        const lastEnvio = alunoEnvios.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];

        const hasPending = !lastEnvio || lastEnvio.status === 'pendente';

        return {
          ...aluno,
          hasPending,
          lastEnvio,
        };
      });

      setAlunos(alunosWithStatus);
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEnviarAtividade = (alunoId: string) => {
    router.push(`/professor/enviar?turmaId=${turmaId}&alunoId=${alunoId}`);
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Alunos da Turma"
        description="Selecione um aluno para enviar atividade"
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        }
      />

      {alunos.length === 0 ? (
        <EmptyState
          title="Nenhum aluno encontrado"
          description="Não há alunos cadastrados nesta turma"
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {alunos.map((aluno) => (
            <Card key={aluno.id} className="hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">{aluno.nome}</h3>
                  {aluno.hasPending ? (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Pendente
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      Em dia
                    </span>
                  )}
                </div>
                <p className="mt-2 text-sm text-gray-500">
                  Matrícula: {aluno.matricula}
                </p>
                {aluno.lastEnvio && (
                  <p className="mt-1 text-sm text-gray-500">
                    Último envio: {aluno.lastEnvio.dataEnvio}
                  </p>
                )}
                <div className="mt-4">
                  <Button
                    onClick={() => handleEnviarAtividade(aluno.id)}
                    size="sm"
                  >
                    Enviar Atividade
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
