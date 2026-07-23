'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Turma } from '@/types';

export default function ProfessorAcessoPage() {
  const router = useRouter();
  const [senha, setSenha] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [turmas, setTurmas] = useState<Turma[]>([]);
  const [acessou, setAcessou] = useState(false);

  const handleAcessar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/professor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senha }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao acessar');
      }

      setTurmas(data.turmas);
      setAcessou(true);
    } catch (err: any) {
      setError(err.message || 'Erro ao acessar');
    } finally {
      setLoading(false);
    }
  };

  const handleSelecionarTurma = (turma: Turma) => {
    sessionStorage.setItem('professorTurma', JSON.stringify(turma));
    router.push('/professor/turmas');
  };

  if (acessou) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-bold text-blue-600">Selecione sua Turma</CardTitle>
              <p className="mt-2 text-sm text-gray-500">Escolha a turma que voce leciona</p>
            </CardHeader>
          </Card>

          {turmas.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <p className="text-gray-500">Nenhuma turma cadastrada no sistema</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {turmas.map((turma) => (
                <Card key={turma.id} className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleSelecionarTurma(turma)}>
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900">{turma.nome}</h3>
                    <p className="mt-2 text-sm text-gray-500">{turma.ano} - {turma.serie}</p>
                    <p className="mt-2 text-sm text-gray-500">{(turma.alunoIds || []).length} alunos</p>
                    <div className="mt-4">
                      <Button size="sm" className="w-full">Selecionar</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          <div className="mt-6 text-center">
            <Button variant="outline" onClick={() => { setAcessou(false); setTurmas([]); }}>Voltar</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <Card variant="elevated" className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-blue-600">DomicilIA</CardTitle>
          <p className="mt-2 text-sm text-gray-500">Acesso do Professor</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAcessar} className="space-y-4">
            <Input label="Senha de Acesso" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} placeholder="Digite a senha" required />
            {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">{error}</p>}
            <Button type="submit" className="w-full" loading={loading}>Acessar</Button>
          </form>
          <div className="mt-4 text-center">
            <a href="/login" className="text-sm text-blue-600 hover:underline">Login administrativo</a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
