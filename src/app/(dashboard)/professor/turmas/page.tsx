'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Turma } from '@/types';

export default function TurmasProfessorPage() {
  const { user, loading: authLoading } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && user) loadTurmas();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading]);

  const loadTurmas = async () => {
    try {
      const todasTurmas = await FirestoreService.getAllByType<Turma>(DOC_TYPES.TURMA);
      const minhasTurmas = todasTurmas.filter((t) => (t.professorIds || []).includes(user!.id));
      setTurmas(minhasTurmas);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Minhas Turmas" description="Selecione uma turma para ver os alunos" />
      {turmas.length === 0 ? (
        <EmptyState title="Nenhuma turma atribuida" description="Entre em contato com o pedagogo para atribuir turmas" />
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {turmas.map((turma) => (
            <Link key={turma.id} href={`/professor/turmas/${turma.id}`}>
              <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                <div className="p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{turma.nome}</h3>
                  <p className="mt-2 text-sm text-gray-500">{turma.ano} - {turma.serie}</p>
                  <p className="mt-2 text-sm text-gray-500">{(turma.alunoIds || []).length} alunos</p>
                  <div className="mt-4"><Button variant="outline" size="sm">Ver Alunos</Button></div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
