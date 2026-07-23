'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { Turma } from '@/types';

export default function NovoAlunoPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    matricula: '',
    turmaId: '',
    responsavelNome: '',
    responsavelEmail: '',
    responsavelTelefone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) loadTurmas();
  }, [user]);

  const loadTurmas = async () => {
    try {
      const data = await FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
        whereEqual('pedagogoId', user!.id),
        whereEqual('active', true),
      ]);
      setTurmas(data);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const alunoId = await FirestoreService.create(DOC_TYPES.ALUNO, {
        nome: formData.nome,
        matricula: formData.matricula,
        turmaId: formData.turmaId,
        pedagogoId: user!.id,
        responsavelNome: formData.responsavelNome,
        responsavelEmail: formData.responsavelEmail,
        responsavelTelefone: formData.responsavelTelefone,
        active: true,
      });

      const turma = turmas.find((t) => t.id === formData.turmaId);
      if (turma) {
        await FirestoreService.update(formData.turmaId, {
          alunoIds: [...(turma.alunoIds || []), alunoId],
        });
      }

      router.push('/pedagogo/alunos');
    } catch (err: any) {
      setError(err.message || 'Erro ao cadastrar aluno');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageHeader title="Novo Aluno" description="Cadastre um novo aluno" />

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
            <Button type="submit" loading={loading}>
              Cadastrar
            </Button>
          </div>
        </form>
      </Card>
    </DashboardLayout>
  );
}
