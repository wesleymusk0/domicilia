'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
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
import { User } from '@/types';
import { formatDate } from '@/lib/utils';

export default function PedagogosPage() {
  const [pedagogos, setPedagogos] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; id: string | null }>({ open: false, id: null });

  useEffect(() => { loadPedagogos(); }, []);

  const loadPedagogos = async () => {
    try {
      const data = await FirestoreService.query<User>(DOC_TYPES.USER, [whereEqual('role', 'pedagogo')]);
      setPedagogos(data);
    } catch (error) { console.error('Erro ao carregar pedagogos:', error); }
    finally { setLoading(false); }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      await FirestoreService.update(id, { active: !currentActive });
      loadPedagogos();
    } catch (error) { console.error('Erro ao atualizar pedagogo:', error); }
  };

  const handleDelete = async () => {
    if (!deleteModal.id) return;
    try {
      await FirestoreService.delete(deleteModal.id);
      setDeleteModal({ open: false, id: null });
      loadPedagogos();
    } catch (error) { console.error('Erro ao excluir pedagogo:', error); }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Pedagogos" description="Gerencie os pedagogos do sistema"
        actions={<Link href="/admin/pedagogos/novo"><Button>Novo Pedagogo</Button></Link>} />
      {pedagogos.length === 0 ? (
        <EmptyState title="Nenhum pedagogo cadastrado" description="Comece cadastrando um novo pedagogo"
          action={<Link href="/admin/pedagogos/novo"><Button>Cadastrar Pedagogo</Button></Link>} />
      ) : (
        <Card>
          <Table>
            <TableHeader><tr>
              <TableHead>Nome</TableHead><TableHead>E-mail</TableHead><TableHead>Status</TableHead><TableHead>Cadastro</TableHead><TableHead>Acoes</TableHead>
            </tr></TableHeader>
            <TableBody>
              {pedagogos.map((pedagogo) => (
                <TableRow key={pedagogo.id}>
                  <TableCell><div className="font-medium">{pedagogo.name}</div></TableCell>
                  <TableCell>{pedagogo.email}</TableCell>
                  <TableCell><Badge variant={pedagogo.active ? 'success' : 'danger'}>{pedagogo.active ? 'Ativo' : 'Inativo'}</Badge></TableCell>
                  <TableCell>{formatDate(pedagogo.createdAt)}</TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Link href={`/admin/pedagogos/${pedagogo.id}/editar`}><Button variant="outline" size="sm">Editar</Button></Link>
                      <Button variant={pedagogo.active ? 'danger' : 'secondary'} size="sm" onClick={() => handleToggleActive(pedagogo.id, pedagogo.active)}>
                        {pedagogo.active ? 'Bloquear' : 'Reativar'}
                      </Button>
                      <Button variant="danger" size="sm" onClick={() => setDeleteModal({ open: true, id: pedagogo.id })}>Excluir</Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
      <Modal isOpen={deleteModal.open} onClose={() => setDeleteModal({ open: false, id: null })} title="Confirmar Exclusao">
        <p className="text-gray-600">Tem certeza que deseja excluir este pedagogo? Esta acao nao pode ser desfeita.</p>
        <div className="mt-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setDeleteModal({ open: false, id: null })}>Cancelar</Button>
          <Button variant="danger" onClick={handleDelete}>Excluir</Button>
        </div>
      </Modal>
    </DashboardLayout>
  );
}
