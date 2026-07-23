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
  const [stats, setStats] = useState<Stats>({
    totalTurmas: 0,
    totalAlunos: 0,
    enviosEnviados: 0,
    enviosPendentes: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authLoading && user) {
      loadStats();
    } else if (!authLoading && !user) {
      setLoading(false);
    }
  }, [user, authLoading]);

  const loadStats = async () => {
    try {
      const [turmas, envios, alunos] = await Promise.all([
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('active', true),
        ]),
        FirestoreService.query<Envio>(DOC_TYPES.ENVIO, [
          whereEqual('professorId', user!.id),
        ]),
        FirestoreService.query<Aluno>(DOC_TYPES.ALUNO, [
          whereEqual('active', true),
        ]),
      ]);

      const professorTurmas = turmas.filter((t) =>
        (t.professorIds || []).includes(user!.id)
      );

      const turmaIds = professorTurmas.map((t) => t.id);
      const alunosNaTurma = alunos.filter((a) => turmaIds.includes(a.turmaId));

      setStats({
        totalTurmas: professorTurmas.length,
        totalAlunos: alunosNaTurma.length,
        enviosEnviados: envios.filter((e) => e.status === 'enviado').length,
        enviosPendentes: envios.filter((e) => e.status === 'pendente').length,
      });
    } catch (err: any) {
      console.error('Erro ao carregar estatisticas:', err);
      setError(err.message || 'Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <PageLoading />;

  if (error) {
    return (
      <DashboardLayout>
        <PageHeader title="Meu Painel" description={`Bem-vindo, ${user?.name}`} />
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageHeader title="Meu Painel" description={`Bem-vindo, ${user?.name}`} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Minhas Turmas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-900">{stats.totalTurmas}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Alunos</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-900">{stats.totalAlunos}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Atividades Enviadas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{stats.enviosEnviados}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Pendencias</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{stats.enviosPendentes}</p></CardContent></Card>
      </div>
    </DashboardLayout>
  );
}
