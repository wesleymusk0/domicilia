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
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({
    open: false,
    id: null,
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    try {
      const [alunosData, turmasData] = await Promise.all([
        FirestoreService.query<Aluno>(DOC_TYPES.ALUNO, [
          whereEqual('pedagogoId', user!.id),
        ]),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
        ]),
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
    return turmas.find((t) => t.id === turmaId)?.nome || 'Turma não encontrada';
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
      <PageHeader
        title="Alunos"
        description="Gerencie os alunos das suas turmas"
        actions={
          <Link href="/pedagogo/alunos/novo">
            <Button>Novo Aluno</Button>
          </Link>
        }
      />

      {alunos.length === 0 ? (
        <EmptyState
          title="Nenhum aluno cadastrado"
          description="Comece cadastrando um novo aluno"
          action={
            <Link href="/pedagogo/alunos/novo">
              <Button>Cadastrar Aluno</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Nome</TableHead>
                <TableHead>Matrícula</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {alunos.map((aluno) => (
                <TableRow key={aluno.id}>
                  <TableCell>
                    <div className="font-medium">{aluno.nome}</div>
                  </TableCell>
                  <TableCell>{aluno.matricula}</TableCell>
                  <TableCell>{getTurmaNome(aluno.turmaId)}</TableCell>
                  <TableCell>{aluno.responsavelNome}</TableCell>
                  <TableCell>
                    <Badge variant={aluno.active ? 'success' : 'danger'}>
                      {aluno.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/pedagogo/alunos/${aluno.id}/editar`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ open: true, id: aluno.id })}
                      >
                        Excluir
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, id: null })}
        title="Confirmar Exclusão"
      >
        <p className="text-gray-600">
          Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false, id: null })}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Excluir
          </Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
