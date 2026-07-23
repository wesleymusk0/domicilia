'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ProfessorLayout from '@/components/layout/ProfessorLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { Historico } from '@/types';
import { formatFileSize } from '@/lib/utils';

export default function HistoricoProfessorPage() {
  const router = useRouter();
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const turmaData = sessionStorage.getItem('professorTurma');
    if (!turmaData) {
      router.push('/professor/acesso');
      return;
    }
    loadHistorico(JSON.parse(turmaData));
  }, []);

  const loadHistorico = async (turma: any) => {
    try {
      const res = await fetch(`/api/professor/dados?turmaId=${turma.id}&tipo=historico`);
      const data = await res.json();
      const sorted = (data.data || []).sort(
        (a: Historico, b: Historico) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setHistorico(sorted);
    } catch (error) {
      console.error('Erro ao carregar historico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <ProfessorLayout>
      <PageHeader title="Historico de Envios" description="Todas as suas entregas" />
      {historico.length === 0 ? (
        <EmptyState title="Nenhum envio registrado" description="Voce ainda nao enviou nenhuma atividade" />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Aluno</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Versao</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Observacoes</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {historico.map((item) => (
                <TableRow key={item.id}>
                  <TableCell><div className="font-medium">{item.alunoNome}</div></TableCell>
                  <TableCell>{item.disciplina}</TableCell>
                  <TableCell><Badge variant="info">v{item.versao}</Badge></TableCell>
                  <TableCell>{item.dataEnvio} as {item.horaEnvio}</TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{item.arquivo.nome}</p>
                      <p className="text-gray-500">{formatFileSize(item.arquivo.tamanho)}</p>
                    </div>
                  </TableCell>
                  <TableCell><p className="text-sm text-gray-500 max-w-xs truncate">{item.comentarios || '-'}</p></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </ProfessorLayout>
  );
}
