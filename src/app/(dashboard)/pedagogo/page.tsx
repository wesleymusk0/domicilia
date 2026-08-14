'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { User, Turma, Aluno, Envio } from '@/types';

interface Stats {
  totalProfessores: number;
  totalTurmas: number;
  totalAlunos: number;
  enviosEnviados: number;
  enviosPendentes: number;
  enviosIA: number;
}

export default function PedagogoDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({
    totalProfessores: 0,
    totalTurmas: 0,
    totalAlunos: 0,
    enviosEnviados: 0,
    enviosPendentes: 0,
    enviosIA: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadStats();
  }, [user]);

  const loadStats = async () => {
    try {
      const [allProfessores, turmas, alunos, envios] = await Promise.all([
        FirestoreService.query<User>(DOC_TYPES.USER, [
          whereEqual('role', 'professor'),
        ]),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
          whereEqual('active', true),
        ]),
        FirestoreService.query<Aluno>(DOC_TYPES.ALUNO, [
          whereEqual('pedagogoId', user!.id),
          whereEqual('active', true),
        ]),
        FirestoreService.query<Envio>(DOC_TYPES.ENVIO, [
          whereEqual('pedagogoId', user!.id),
        ]),
      ]);

      const filteredProfessores = allProfessores.filter((p) =>
        p.pedagogoId === user!.id ||
        (p.pedagogoIds || []).includes(user!.id) ||
        (p.turmaIds || []).some((tid) => turmas.some((t) => t.id === tid))
      );

      setStats({
        totalProfessores: filteredProfessores.length,
        totalTurmas: turmas.length,
        totalAlunos: alunos.length,
        enviosEnviados: envios.filter((e) => e.status === 'enviado').length,
        enviosPendentes: envios.filter((e) => e.status === 'pendente').length,
        enviosIA: envios.filter((e) => e.status === 'gerado_ia').length,
      });
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Painel do Pedagogo"
        description={`Bem-vindo, ${user?.name}`}
      />

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Professores</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalProfessores}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Turmas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalTurmas}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Alunos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-gray-900">{stats.totalAlunos}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Atividades Enviadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-green-600">{stats.enviosEnviados}</p>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Pendentes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-yellow-600">{stats.enviosPendentes}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium text-gray-500">Geradas por IA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-purple-600">{stats.enviosIA}</p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
