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
import { User, Turma } from '@/types';
import { formatDate } from '@/lib/utils';

export default function ProfessoresPedagogoPage() {
  const { user } = useAuth();
  const [professores, setProfessores] = useState<User[]>([]);
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
      const [professoresData, turmasData] = await Promise.all([
        FirestoreService.query<User>(DOC_TYPES.USER, [
          whereEqual('role', 'professor'),
          whereEqual('pedagogoId', user!.id),
        ]),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
        ]),
      ]);
      setProfessores(professoresData);
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTurmaNames = (turmaIds: string[]) => {
    return turmaIds
      .map((id) => turmas.find((t) => t.id === id)?.nome)
      .filter(Boolean)
      .join(', ');
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await FirestoreService.update(id, { active: !currentActive });
      loadData();
    } catch (error) {
      console.error('Erro ao atualizar professor:', error);
    }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await FirestoreService.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      loadData();
    } catch (error) {
      console.error('Erro ao excluir professor:', error);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Professores"
        description="Gerencie os professores das suas turmas"
        actions={
          <Link href="/pedagogo/professores/novo">
            <Button>Novo Professor</Button>
          </Link>
        }
      />

      {professores.length === 0 ? (
        <EmptyState
          title="Nenhum professor cadastrado"
          description="Comece cadastrando um novo professor"
          action={
            <Link href="/pedagogo/professores/novo">
              <Button>Cadastrar Professor</Button>
            </Link>
          }
        />
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <tr>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Turmas</TableHead>
                <TableHead>Disciplinas</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Ações</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {professores.map((professor) => (
                <TableRow key={professor.id}>
                  <TableCell>
                    <div className="font-medium">{professor.name}</div>
                  </TableCell>
                  <TableCell>{professor.email}</TableCell>
                  <TableCell>{getTurmaNames(professor.turmaIds || [])}</TableCell>
                  <TableCell>{(professor.disciplinas || []).join(', ')}</TableCell>
                  <TableCell>
                    <Badge variant={professor.active ? 'success' : 'danger'}>
                      {professor.active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/pedagogo/professores/${professor.id}/editar`}>
                        <Button variant="outline" size="sm">
                          Editar
                        </Button>
                      </Link>
                      <Button
                        variant={professor.active ? 'danger' : 'secondary'}
                        size="sm"
                        onClick={() => handleToggleActive(professor.id, professor.active)}
                      >
                        {professor.active ? 'Desabilitar' : 'Reabilitar'}
                      </Button>
                    </div>
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
