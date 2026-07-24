'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfessorLayout from '@/components/layout/ProfessorLayout';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PageHeader } from '@/components/ui/PageHeader';
import { PageLoading } from '@/components/ui/Loading';
import { Envio, Aluno } from '@/types';

interface Stats {
  totalAlunos: number;
  enviosEnviados: number;
  enviosPendentes: number;
}

export default function ProfessorDashboard() {
  const router = useRouter();
  const [turma, setTurma] = useState<any>(null);
  const [stats, setStats] = useState<Stats>({ totalAlunos: 0, enviosEnviados: 0, enviosPendentes: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const turmaData = sessionStorage.getItem('professorTurma');
    if (!turmaData) {
      router.push('/professor/acesso');
      return;
    }
    const turmaParsed = JSON.parse(turmaData);
    setTurma(turmaParsed);
    loadStats(turmaParsed);
  }, []);

  const isPeriodoAtivo = (aluno: Aluno): boolean => {
    if (!aluno.domiciliar || !aluno.dataInicio || !aluno.dataFim) return false;
    const hoje = new Date().toISOString().split('T')[0];
    return hoje >= aluno.dataInicio && hoje <= aluno.dataFim;
  };

  const loadStats = async (turma: any) => {
    try {
      const [alunosRes, enviosRes] = await Promise.all([
        fetch(`/api/professor/dados?turmaId=${turma.id}&tipo=alunos`),
        fetch(`/api/professor/dados?turmaId=${turma.id}&tipo=envios`),
      ]);

      const alunosData = await alunosRes.json();
      const enviosData = await enviosRes.json();

      const alunos = (alunosData.data || []).filter((a: Aluno) => isPeriodoAtivo(a));
      const envios = enviosData.data || [];

      setStats({
        totalAlunos: alunos.length,
        enviosEnviados: envios.filter((e: Envio) => e.status === 'enviado').length,
        enviosPendentes: envios.filter((e: Envio) => e.status === 'pendente').length,
      });
    } catch (err) {
      console.error('Erro ao carregar estatisticas:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <ProfessorLayout>
      <PageHeader title={turma?.nome || 'Minha Turma'} description={`${turma?.ano} - ${turma?.serie}`} />
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Alunos Domiciliares</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-gray-900">{stats.totalAlunos}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Enviadas</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-green-600">{stats.enviosEnviados}</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="text-sm font-medium text-gray-500">Pendencias</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold text-yellow-600">{stats.enviosPendentes}</p></CardContent></Card>
      </div>
    </ProfessorLayout>
  );
}
