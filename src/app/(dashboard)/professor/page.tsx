'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Turma, Envio, Aluno } from '@/types';

interface Stats {
  totalTurmas: number;
  totalAlunos: number;
  enviosEnviados: number;
  enviosPendentes: number;
}

export default function ProfessorDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [stats, setStats] = useState<Stats>({ totalTurmas: 0, totalAlunos: 0, enviosEnviados: 0, enviosPendentes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) loadStats();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const isPeriodoAtivo = (aluno: Aluno): boolean => {
    if (!aluno.domiciliar || !aluno.dataInicio || !aluno.dataFim) return false;
    const hoje = new Date().toISOString().split('T')[0];
    return hoje >= aluno.dataInicio && hoje <= aluno.dataFim;
  };

  const loadStats = async () => {
    try {
      const [todasTurmas, todosAlunos, todosEnvios] = await Promise.all([
        FirestoreService.getAllByType<Turma>(DOC_TYPES.TURMA),
        FirestoreService.getAllByType<Aluno>(DOC_TYPES.ALUNO),
        FirestoreService.query<Envio>(DOC_TYPES.ENVIO, [whereEqual('professorId', user!.id)]),
      ]);

      const minhasTurmas = todasTurmas.filter((t) => (t.professorIds || []).includes(user!.id));
      setTurmas(minhasTurmas);

      const turmaIds = minhasTurmas.map((t) => t.id);
      const alunosAtivos = todosAlunos.filter((a) => turmaIds.includes(a.turmaId) && isPeriodoAtivo(a));

      setStats({
        totalTurmas: minhasTurmas.length,
        totalAlunos: alunosAtivos.length,
        enviosEnviados: todosEnvios.filter((e) => e.status === 'enviado').length,
        enviosPendentes: todosEnvios.filter((e) => e.status === 'pendente').length,
      });
    } catch (err) {
      console.error('Erro ao carregar estatisticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Meu Painel" description={`Bem-vindo, ${user?.name}`} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Minhas Turmas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-900">{stats.totalTurmas}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Alunos Domiciliares</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-900">{stats.totalAlunos}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Enviadas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{stats.enviosEnviados}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Pendencias</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{stats.enviosPendentes}</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
