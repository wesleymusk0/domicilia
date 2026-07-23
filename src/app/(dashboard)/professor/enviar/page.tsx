'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ProfessorLayout from '@/components/layout/ProfessorLayout';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Select from '@/components/ui/Select';
import { PageLoading } from '@/components/ui/Loading';
import { storageProvider, validateFile, generateStoragePath } from '@/lib/services/storage';
import { Aluno, Turma } from '@/types';
import { getCurrentDate, getCurrentTime } from '@/lib/utils';

function EnviarAtividadeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const turmaId = searchParams.get('turmaId') || '';
  const alunoId = searchParams.get('alunoId') || '';

  const [aluno, setAluno] = useState<Aluno | null>(null);
  const [turma, setTurma] = useState<Turma | null>(null);
  const [formData, setFormData] = useState({ disciplina: '', comentarios: '' });
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const disciplinas = ['Portugues', 'Matematica', 'Ciencias', 'Historia', 'Geografia', 'Ingles', 'Educacao Fisica', 'Artes', 'Musica', 'Informatica'];

  useEffect(() => {
    const turmaData = sessionStorage.getItem('professorTurma');
    if (!turmaData) {
      router.push('/professor/acesso');
      return;
    }
    if (turmaId && alunoId) {
      loadData();
    } else {
      setLoading(false);
    }
  }, []);

  const loadData = async () => {
    try {
      const [alunoRes, turmaRes] = await Promise.all([
        fetch(`/api/professor/documento?id=${alunoId}`),
        fetch(`/api/professor/documento?id=${turmaId}`),
      ]);

      if (alunoRes.ok) {
        const alunoData = await alunoRes.json();
        if (alunoData.success) setAluno(alunoData.data);
      }

      if (turmaRes.ok) {
        const turmaData = await turmaRes.json();
        if (turmaData.success) setTurma(turmaData.data);
      }
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

      const turmaStorage = JSON.parse(sessionStorage.getItem('professorTurma') || '{}');

      const envioData = {
        atividadeId: '',
        alunoId,
        professorId: 'professor_' + Date.now(),
        turmaId,
        disciplina: formData.disciplina,
        versao: 1,
        status: 'enviado',
        arquivo: fileUpload,
        comentarios: formData.comentarios,
        dataEnvio: getCurrentDate(),
        horaEnvio: getCurrentTime(),
        pedagogoId: turma?.pedagogoId || '',
        alunoNome: aluno?.nome || '',
        professorNome: turmaStorage.nome || 'Professor',
        turmaNome: turma?.nome || '',
        professorEmail: '',
      };

      const envioRes = await fetch('/api/professor/documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo: 'envio', data: envioData }),
      });
      const envioResult = await envioRes.json();

      await fetch('/api/professor/documento', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'historico',
          data: {
            envioId: envioResult.id,
            versao: 1,
            arquivo: fileUpload,
            comentarios: formData.comentarios,
            dataEnvio: getCurrentDate(),
            horaEnvio: getCurrentTime(),
            professorId: envioData.professorId,
            professorNome: envioData.professorNome,
            alunoId,
            alunoNome: aluno?.nome || '',
            turmaId,
            turmaNome: turma?.nome || '',
            disciplina: formData.disciplina,
          },
        }),
      });

      setSuccess(true);
      setTimeout(() => router.push('/professor/turmas'), 2000);
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar atividade');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <PageLoading />;

  return (
    <ProfessorLayout>
      <PageHeader title="Enviar Atividade" description={aluno ? `Enviar para ${aluno.nome}` : ''} actions={<Button variant="outline" onClick={() => router.back()}>Voltar</Button>} />
      {success ? (
        <Card className="max-w-2xl"><div className="text-center py-12"><div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4"><span className="text-3xl text-green-600">✓</span></div><h3 className="text-lg font-medium text-gray-900">Atividade Enviada!</h3></div></Card>
      ) : (
        <Card className="max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-6">
            {aluno && <div className="bg-gray-50 p-4 rounded-lg"><h4 className="font-medium text-gray-900">Aluno: {aluno.nome}</h4><p className="text-sm text-gray-600">Turma: {turma?.nome}</p></div>}
            <Select label="Disciplina" value={formData.disciplina} onChange={(e) => setFormData({ ...formData, disciplina: e.target.value })} options={disciplinas.map((d) => ({ value: d, label: d }))} placeholder="Selecione" required />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Arquivo</label>
              <input type="file" accept=".pdf,.docx,.doc,.jpg,.jpeg,.png,.gif,.webp" onChange={handleFileChange} className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none" />
              <p className="mt-1 text-sm text-gray-500">PDF, DOCX, JPG, PNG (max 10MB)</p>
              {file && <p className="mt-2 text-sm text-green-600">{file.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Comentarios (opcional)</label>
              <textarea value={formData.comentarios} onChange={(e) => setFormData({ ...formData, comentarios: e.target.value })} rows={3} className="block w-full rounded-lg border border-gray-300 px-3 py-2 text-gray-900 shadow-sm focus:border-blue-500 focus:outline-none" placeholder="Observacoes..." />
            </div>
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={() => router.back()}>Cancelar</Button>
              <Button type="submit" loading={sending} disabled={!file || !formData.disciplina}>Enviar</Button>
            </div>
          </form>
        </Card>
      )}
    </ProfessorLayout>
  );
}

export default function EnviarAtividadePage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <EnviarAtividadeContent />
    </Suspense>
  );
}
