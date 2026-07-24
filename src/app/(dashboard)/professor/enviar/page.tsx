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
import { FirestoreService, DOC_TYPES } from '@/lib/services/firestore';
import { storageProvider, validateFile, generateStoragePath } from '@/lib/services/storage';
import { emailService } from '@/lib/services/email';
import { gerarFicha } from '@/lib/services/ai/gerar-ficha';
import { Aluno, Turma, Envio, Historico } from '@/types';
import { getCurrentDate, getCurrentTime } from '@/lib/utils';

function EnviarAtividadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const turmaId = searchParams.get('turmaId') || '';
  const alunoId = searchParams.get('alunoId') || '';

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({
    disciplina: '',
    comentarios: '',
    observacoes: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const disciplinas = user?.disciplinas || ['Portugues', 'Matematica', 'Ciencias', 'Historia', 'Geografia', 'Ingles', 'Educacao Fisica', 'Artes', 'Musica', 'Informatica'];

  useEffect(() => {
    if (!authLoading && user && turmaId && alunoId) loadData();
    else if (!authLoading) setLoading(false);
  }, [user, authLoading, turmaId, alunoId]);

  const loadData = async () => {
    try {
      const [alunoData, turmaData] = await Promise.all([
        FirestoreService.getById<Aluno>(alunoId),
        FirestoreService.getById<Turma>(turmaId),
      ]);
      setAluno(alunoData);
      setTurma(turmaData);
    } catch (err) {
      console.error('Erro ao carregar dados:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const validation = validateFile(selectedFile);
      if (!validation.valid) {
        setError(validation.error || 'Arquivo invalido');
        return;
      }
      setFile(selectedFile);
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!file) { setError('Selecione um arquivo'); return; }
    setSending(true);

    try {
      const storagePath = generateStoragePath(turmaId, alunoId, formData.disciplina, file.name);
      const fileUpload = await storageProvider.upload(file, storagePath);

      const envioData = {
        atividadeId: '',
        alunoId,
        professorId: user!.id,
        professorNome: user!.name,
        turmaId,
        disciplina: formData.disciplina,
        versao: 1,
        status: 'enviado' as const,
        arquivo: fileUpload,
        comentarios: formData.comentarios,
        dataEnvio: getCurrentDate(),
        horaEnvio: getCurrentTime(),
        pedagogoId: turma?.pedagogoId || '',
        alunoNome: aluno?.nome || '',
        turmaNome: turma?.nome || '',
        professorEmail: user!.email,
      };

      const envioId = await FirestoreService.create<Envio>(DOC_TYPES.ENVIO, envioData);

      await FirestoreService.create<Historico>(DOC_TYPES.HISTORICO, {
        envioId,
        versao: 1,
        arquivo: fileUpload,
        comentarios: formData.comentarios,
        dataEnvio: getCurrentDate(),
        horaEnvio: getCurrentTime(),
        professorId: user!.id,
        professorNome: user!.name,
        alunoId,
        alunoNome: aluno?.nome || '',
        turmaId,
        turmaNome: turma?.nome || '',
        disciplina: formData.disciplina,
      });

      // Gera ficha DOCX
      const fichaBuffer = await gerarFicha({
        alunoNome: aluno?.nome || '',
        turmaNome: turma?.nome || '',
        disciplina: formData.disciplina,
        dataEnvio: getCurrentDate(),
        professorNome: user!.name,
        observacoes: formData.observacoes,
        atividadeRef: envioId,
      });

      const fichaAttachment = {
        filename: `ficha_${aluno?.nome?.replace(/\s/g, '_')}_${formData.disciplina}.docx`,
        content: fichaBuffer,
      };

      // Envia emails com ficha anexada
      await emailService.sendConfirmation(envioData as Envio);
      await emailService.sendNotification(envioData as Envio, [fichaAttachment]);

      setSuccess(true);
      setTimeout(() => router.push(`/professor/turmas/${turmaId}`), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar atividade');
    } finally {
      setSending(false);
    }
  };

  if (authLoading || loading) return <PageLoading />;

  return (
    <DashboardLayout>
      <PageHeader title="Enviar Atividade" description={aluno ? `Enviar para ${aluno.nome}` : ''} actions={<Button variant="outline" onClick={() => router.back()}>Voltar</Button>} />
      {success ? (
        <Card className="max-w-2xl"><div className="text-center py-12"><div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4"><span className="text-3xl text-green-600">✓</span></div><h3 className="text-lg font-medium text-gray-900">Atividade Enviada!</h3><p className="mt-2 text-sm text-gray-500">Ficha DOCX gerada e enviada por email</p></div></Card>
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {aluno && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium text-gray-900">Aluno: {aluno.nome}</h4>
                <p className="text-sm text-gray-600">Turma: {turma?.nome}</p>
              </div>
            )}

            <Select label="Disciplina" value={formData.disciplina} onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })} options={disciplinas.map((d) => ({ value: d, label: d }))} placeholder="Selecione" required />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Atividade (PDF, DOCX ou Imagem)</label>
              <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
              <p className="mt-1 text-sm text-gray-500">PDF, DOCX, JPG, PNG (max 10MB)</p>
              {file && <p className="mt-2 text-sm text-green-600">{file.name}</p>}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-900 mb-3">Ficha de Atividade (DOCX)</h4>
              <p className="text-sm text-gray-500 mb-3">Preencha os dados da ficha que sera gerada em DOCX e enviada junto com a atividade</p>
              <Input label="Observacoes" value={formData.observacoes} onChange={(e) => setFormData({ ...formData, observacoes: e.target.value })} placeholder="Observacoes sobre a atividade (opcional)" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios (opcional)</label>
              <textarea value={formData.comentarios} onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })} rows={3} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none" placeholder="Observacoes..." />
            </div>

            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">Anexos que serao enviados:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Arquivo da atividade (seu upload)</li>
                <li>• Ficha de atividade.docx (gerada automaticamente)</li>
              </ul>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" loading={sending} disabled={!file || !formData.disciplina}>Enviar</Button>
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
