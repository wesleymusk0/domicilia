'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PageLoading } from '@/components/ui/Loading';
import { FirestoreService, DOC_TYPES, whereEqual } from '@/lib/services/firestore';
import { storageProvider, validateFile, generateStoragePath } from '@/lib/services/storage';
import { emailService } from '@/lib/services/email';
import { Aluno, Turma, User, Envio, Historico } from '@/types';
import { getCurrentDate, getCurrentTime, getTimestamp } from '@/lib/utils';

function EnviarAtividadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();

  const turmaId = searchParams.get('turmaId') || '';
  const alunoId = searchParams.get('alunoId') || '';

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [disciplinas, setDisciplinas] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    disciplina: '',
    comentarios: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (user && turmaId && alunoId) loadData();
  }, [user, turmaId, alunoId]);

  const loadData = async () => {
    try {
      const [alunoData, turmaData, userData] = await Promise.all([
        FirestoreService.getById<Aluno>(alunoId),
        FirestoreService.getById<Turma>(turmaId),
        FirestoreService.getById<User>(user!.id),
      ]);

      setAluno(alunoData);
      setTurma(turmaData);
      setDisciplinas(userData?.disciplinas || []);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo inválido');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!file) {
      setError('Selecione um arquivo para enviar');
      return;
    }

    setSending(true);

    try {
      const storagePath = generateStoragePath(turmaId, alunoId, formData.disciplina, file.name);
      const fileUpload = await storageProvider.upload(file, storagePath);

      const existingEnvios = await FirestoreService.query<Envio>(DOC_TYPES.ENVIO, [
        whereEqual('alunoId', alunoId),
        whereEqual('disciplina', formData.disciplina),
      ]);

      const versao = existingEnvios.length + 1;

      const envioData = {
        atividadeId: '',
        alunoId,
        professorId: user!.id,
        turmaId,
        disciplina: formData.disciplina,
        versao,
        status: 'enviado' as const,
        arquivo: fileUpload,
        comentarios: formData.comentarios,
        dataEnvio: getCurrentDate(),
        horaEnvio: getCurrentTime(),
        pedagogoId: turma?.pedagogoId || '',
        alunoNome: aluno?.nome || '',
        professorNome: user?.name || '',
        turmaNome: turma?.nome || '',
        professorEmail: user?.email || '',
      };

      const envioId = await FirestoreService.create<Envio>(DOC_TYPES.ENVIO, envioData);

      const historicoData = {
        envioId,
        versao,
        arquivo: fileUpload,
        comentarios: formData.comentarios,
        dataEnvio: getCurrentDate(),
        horaEnvio: getCurrentTime(),
        professorId: user!.id,
        professorNome: user?.name || '',
        alunoId,
        alunoNome: aluno?.nome || '',
        turmaId,
        turmaNome: turma?.nome || '',
        disciplina: formData.disciplina,
      };

      await FirestoreService.create<Historico>(DOC_TYPES.HISTORICO, historicoData);

      await emailService.sendConfirmation(envioData as Envio);
      await emailService.sendNotification(envioData as Envio);

      setSuccess(true);
      setTimeout(() => {
        router.push(`/professor/turmas/${turmaId}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar atividade');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader
        title="Enviar Atividade"
        description={aluno ? `Enviar atividade para ${aluno.nome}` : 'Carregando...'}
        actions={
          <Button variant="outline" onClick={() => router.back()}>
            Voltar
          </Button>
        }
      />

      {success ? (
        <Card className="max-w-2xl">
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900">Atividade Enviada com Sucesso!</h3>
            <p className="mt-2 text-sm text-gray-500">
              Um e-mail de confirmação foi enviado para você.
            </p>
          </div>
        </Card>
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {aluno && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Dados do Aluno</h4>
                <p className="text-sm text-gray-600">Nome: {aluno.nome}</p>
                <p className="text-sm text-gray-600">Matrícula: {aluno.matricula}</p>
                {turma && <p className="text-sm text-gray-600">Turma: {turma.nome}</p>}
              </div>
            )}

            <Select
              label="Disciplina"
              value={formData.disciplina}
              onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })}
              options={disciplinas.map((d) => ({ value: d, label: d }))}
              placeholder="Selecione a disciplina"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Arquivo da Atividade
              </label>
              <input
                type="file"
                accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp"
                onChange={handleFileChange}
                className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-gray-500">
                Formatos aceitos: PDF, DOCX, JPG, PNG, GIF, WEBP (máximo 10MB)
              </p>
              {file && (
                <p className="mt-2 text-sm text-green-600">
                  Arquivo selecionado: {file.name}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comentários (opcional)
              </label>
              <textarea
                value={formData.comentarios}
                onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })}
                rows={3}
                className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Adicione observações sobre a atividade..."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>
            )}

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Cancelar
              </Button>
              <Button type="submit" loading={sending} disabled={!file || !formData.disciplina}>
                Enviar Atividade
              </Button>
            </div>
          </form>
        </Card>
      )}
    </DashboardLayout>
  );
}

export default function EnviarAtividadePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EnviarAtividadeContent />
    </Suspense>
  );
}
