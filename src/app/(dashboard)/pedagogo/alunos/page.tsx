'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/Table';
import { EmptyState } from '@/components/ui/EmptyState';
import { PageLoading } from '@/components/ui/Loading';
import { Modal } from '@/components/ui/Modal';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Aluno, Turma } from '@/types';
import { formatDate } from '@/lib/utils';

export default function AlunosPedagogoPage() {
  const { user } = useAuth();
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [alunosData, turmasData] = await Promise.all([
        FirestoreService.query<Aluno>(DOC_TYPES.ALUNO, [whereEqual('pedagogoId', user!.id)]),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [whereEqual('pedagogoId', user!.id)]),
      ]);
      setAlunos(alunosData);
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTurmaNome = (turmaId: string) => {
    return turmas.find((t) => t.id === turmaId)?.nome || '-';
  };

  const isDomiciliarAtivo = (aluno: Aluno) => {
    if (!aluno.domiciliar || !aluno.dataInicio || !aluno.dataFim) return false;
    const hoje = new Date().toISOString().split('T')[0];
    return hoje >= aluno.dataInicio && hoje <= aluno.dataFim;
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await FirestoreService.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir aluno:', error);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Alunos" description="Gerencie os alunos das suas turmas" actions={<Link href="/pedagogo/alunos/novo"><Button>Novo Aluno</Button></Link>} />
      {alunos.length === 0 ? (
        <EmptyState title="Nenhum aluno cadastrado" description="Comece cadastrando um novo aluno" action={<Link href="/pedagogo/alunos/novo"><Button>Cadastrar Aluno</Button></Link>} />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Nome</TableHead>
                <TableHead>Matricula</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Domiciliar</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead>Acoes</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell><div className="font-medium">{aluno.nome}</div></TableCell>
                  <TableCell>{aluno.matricula}</TableCell>
                  <TableCell>{getTurmaNome(aluno.turmaId)}</TableCell>
                  <TableCell>
                    {aluno.domiciliar ? (
                      isDomiciliarAtivo(aluno) ? (
                        <Badge variant="success">Ativo</Badge>
                      ) : (
                        <Badge variant="warning">Expirado</Badge>
                      )
                    ) : (
                      <Badge variant="default">Nao</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {aluno.domiciliar && aluno.dataInicio && aluno.dataFim ? (
                      <span className="text-sm text-gray-600">
                        {formatDate(aluno.dataInicio)} a {formatDate(aluno.dataFim)}
                      </span>
                    ) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/pedagogo/alunos/${aluno.id}/editar`}><Button variant="outline" size="sm">Editar</Button></Link>
                      <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, id: aluno.id })}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })} title="Confirmar Exclusao">
        <p className="text-gray-600">Tem certeza que deseja excluir este aluno?</p>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false, id: null })}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
