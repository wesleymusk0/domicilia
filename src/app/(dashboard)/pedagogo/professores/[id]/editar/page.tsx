'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { User, Turma } from '@/types';

export default function EditarProfessorPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const id = params.id as string;

  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    turmaIds: [] as string[],
    disciplinas: [] as string[],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const disciplinasOptions = [
    'Português', 'Matemática', 'Ciências', 'História', 'Geografia',
    'Inglês', 'Educação Física', 'Artes', 'Música', 'Informática',
  ];

  useEffect(() => {
    if (user) loadData();
  }, [id, user]);

  const loadData = async () => {
    try {
      const [professorData, turmasData] = await Promise.all([
        FirestoreService.getById<User>(id),
        FirestoreService.query<Turma>(DOC_TYPES.TURMA, [
          whereEqual('pedagogoId', user!.id),
          whereEqual('active', true),
        ]),
      ]);

      if (professorData) {
        setFormData({
          name: professorData.name,
          email: professorData.email,
          turmaIds: professorData.turmaIds || [],
          disciplinas: professorData.disciplinas || [],
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
        name: formData.name,
        email: formData.email,
        turmaIds: formData.turmaIds,
        disciplinas: formData.disciplinas,
      });
      router.push('/pedagogo/professores');
    } catch (err: any) {
      setError(err.message || 'Erro ao atualizar professor');
    } finally {
      setSaving(false);
    }
  };

  const toggleTurma = (turmaId: string) => {
    setFormData((prev) => ({
      ...prev,
      turmaIds: prev.turmaIds.includes(turmaId)
        ? prev.turmaIds.filter((id) => id !== turmaId)
        : [...prev.turmaIds, turmaId],
    }));
  };

  const toggleDisciplina = (disciplina: string) => {
    setFormData((prev) => ({
      ...prev,
      disciplinas: prev.disciplinas.includes(disciplina)
        ? prev.disciplinas.filter((d) => d !== disciplina)
        : [...prev.disciplinas, disciplina],
    }));
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Editar Professor" description="Atualize os dados do professor" />

      <Card className="max-w-2xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Nome Completo"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Nome do professor"
            required
          />

          <Input
            label="E-mail"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="email@exemplo.com"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Turmas</label>
            <div className="grid grid-cols-2 gap-2">
              {turmas.map((turma) => (
                <label
                  key={turma.id}
                  className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.turmaIds.includes(turma.id)}
                    onChange={() => toggleTurma(turma.id)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{turma.nome}</span>
                               </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Disciplinas</label>
            <div className="grid grid-cols-2 gap-2">
              {disciplinasOptions.map((disciplina) => (
                <label
                  key={disciplina}
                  className="flex items-center space-x-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={formData.disciplinas.includes(disciplina)}
                    onChange={() => toggleDisciplina(disciplina)}
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">{disciplina}</span>
                </label>
              ))}
            </div>
          </div>

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
