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
import { Turma, User } from '@/types';
import { formatDate } from '@/lib/utils';

export default function TurmasPedagogoPage() {
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [professores, setProfessores] = useState<User[]>([]);
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
      const [turmasData, professoresData] = await Promise.all([
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
        ]),
        FirestoreService.query<User>(DOC_TYPES.USER, [
          whereEqual('role', 'professor'),
          whereEqual('pedagogoId', user!.id),
        ]),
      ]);
      setTurmas(turmasData);
      setProfessores(professoresData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProfessorNames = (professorIds: string[]) => {
    return professorIds
      .map((id) => professores.find((p) => p.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await FirestoreService.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir turma:', error);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Turmas"
        description="Gerencie as turmas do pedagogo"
        actions={
          <Link href="/pedagogo/turmas/nova">
            <Button>Nova Turma</Button>
          </Link>
        }
      />

      {turmas.length === 0 ? (
        <EmptyState
          title="Nenhuma turma cadastrada"
          description="Comece cadastrando uma nova turma"
          action={
            <Link href="/pedagogo/turmas/nova">
              <Button>Cadastrar Turma</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Nome</TableHead>
                <TableHead>Ano</TableHead>
                <TableHead>S�rie</TableHead>
                <TableHead>Professores</TableHead>
                <TableHead>Alunos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>A��es</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {turmas.map((turma) => (
                <TableRow key={turma.id}>
                  <TableCell>
                    <div className="font-medium">{turma.nome}</div>
                  </TableCell>
                  <TableCell>{turma.ano}</TableCell>
                  <TableCell>{turma.serie}</TableCell>
                  <TableCell>{getProfessorNames(turma.professorIds || [])}</TableCell>
                  <TableCell>{(turma.alunoIds || []).length} alunos</TableCell>
                  <TableCell>
                    <Badge variant={turma.active ? 'success' : 'danger'}>
                      {turma.active ? 'Ativa' : 'Inativa'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/pedagogo/turmas/${turma.id}/editar`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => setDeleteModal({ open: true, id: turma.id })}
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
        title="Confirmar Exclus�o"
      >
        <p className="text-gray-600">
          Tem certeza que deseja excluir esta turma? Esta a��o n�o pode ser desfeita.
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
