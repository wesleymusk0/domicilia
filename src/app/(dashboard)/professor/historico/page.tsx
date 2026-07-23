'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Historico } from '@/types';
import { formatDateTime, formatFileSize } from '@/lib/utils';

export default function HistoricoProfessorPage() {
  const { user } = useAuth();
  const [historico, setHistorico] = useState<Historico[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) loadHistorico();
  }, [user]);

  const loadHistorico = async () => {
    try {
      const data = await FirestoreService.query<Historico>(DOC_TYPES.HISTORICO, [
        whereEqual('professorId', user!.id),
      ]);

      const sortedData = data.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      setHistorico(sortedData);
    } catch (error) {
      console.error('Erro ao carregar histórico:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Histórico de Envios"
        description="Visualize todas as suas entregas"
      />

      {historico.length === 0 ? (
        <EmptyState
          title="Nenhum envio registrado"
          description="Você ainda não enviou nenhuma atividade"
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Aluno</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Disciplina</TableHead>
                <TableHead>Versão</TableHead>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Arquivo</TableHead>
                <TableHead>Observações</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {historico.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="font-medium">{item.alunoNome}</div>
                  </TableCell>
                  <TableCell>{item.turmaNome}</TableCell>
                  <TableCell>{item.disciplina}</TableCell>
                  <TableCell>
                    <Badge variant="info">v{item.versao}</Badge>
                  </TableCell>
                  <TableCell>
                    {item.dataEnvio} às {item.horaEnvio}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="font-medium">{item.arquivo.nome}</p>
                      <p className="text-gray-500">
                        {formatFileSize(item.arquivo.tamanho)}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm text-gray-500 max-w-xs truncate">
                      {item.comentarios || '-'}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </DashboardLayout>
  );
}
