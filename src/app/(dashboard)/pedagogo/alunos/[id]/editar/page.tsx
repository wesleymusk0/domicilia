'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Aluno, Turma } from '@/types';

export default function EditarAlunoPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    turmaId: '',
    responsavelNome: '',
    responsavelEmail: '',
    responsavelTelefone: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadData();
  }, [id, user]);

  const loadData = async () => {
    try {
      const [alunoData, turmasData] = await Promise.all([
        FirestoreService.getById<Aluno>(id),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
          whereEqual('active', true),
        ]),
      ]);

      if (alunoData) {
        setFormData({
          nome: alunoData.nome,
          matricula: alunoData.matricula,
          turmaId: alunoData.turmaId,
          responsavelNome: alunoData.responsavelNome,
          responsavelEmail: alunoData.responsavelEmail,
          responsavelTelefone: alunoData.responsavelTelefone,
        });
      }
      setTurmas(turmasData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      await FirestoreService.update(id, {
        nome: formData.nome,
        matricula: formData.matricula,
        turmaId: formData.turmaId,
        responsavelNome: formData.responsavelNome,
        responsavelEmail: formData.responsavelEmail,
        responsavelTelefone: formData.responsavelTelefone,
      });
      router.push('/pedagogo/alunos');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar aluno');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Editar Aluno" description="Atualize os dados do aluno" />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome do Aluno"
            value={formData.nome}
            onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
            placeholder="Nome completo do aluno"
            required
          />

          <Input
            label="Matrícula"
            value={formData.matricula}
            onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
            placeholder="Número da matrícula"
            required
          />

          <Select
            label="Turma"
            value={formData.turmaId}
            onChange={(e) => setFormData({ ...formData, turmaId: e.target.value })}
            options={turmas.map((t) => ({ value: t.id, label: t.nome }))}
            placeholder="Selecione a turma"
            required
          />

          <Input
            label="Nome do Responsável"
            value={formData.responsavelNome}
            onChange={(e) => setFormData({ ...formData, responsavelNome: e.target.value })}
            placeholder="Nome do responsável"
            required
          />

          <Input
            label="E-mail do Responsável"
            type="email"
            value={formData.responsavelEmail}
            onChange={(e) => setFormData({ ...formData, responsavelEmail: e.target.value })}
            placeholder="email@exemplo.com"
            required
          />

          <Input
            label="Telefone do Responsável"
            value={formData.responsavelTelefone}
            onChange={(e) => setFormData({ ...formData, responsavelTelefone: e.target.value })}
            placeholder="(11) 99999-9999"
          />

          {error && (
            <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
          )}

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" loading={saving}>
              Salvar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}
