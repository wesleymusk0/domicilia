'use client';

import { ReactNode, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

const professorNav: NavItem[] = [
  { label: 'Dashboard', href: '/professor', icon: '📊' },
  { label: 'Meus Alunos', href: '/professor/turmas', icon: '🎒' },
  { label: 'Enviar Atividade', href: '/professor/enviar', icon: '📝' },
  { label: 'Historico', href: '/professor/historico', icon: '📜' },
];

export default function ProfessorLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const turmaData = typeof window !== 'undefined' ? sessionStorage.getItem('professorTurma') : null;
  const turma = turmaData ? JSON.parse(turmaData) : null;

  const handleSair = () => {
    sessionStorage.removeItem('professorTurma');
    router.push('/professor/acesso');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <aside className={cn(
        'fixed left-0 top-0 z-40 h-screen border-r border-gray-200 bg-white transition-all duration-300',
        collapsed ? 'w-16' : 'w-64'
      )}>
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center justify-between border-b border-gray-200 px-4">
            {!collapsed && <span className="text-lg font-bold text-blue-600">DomicilIA</span>}
            <button onClick={() => setCollapsed(!collapsed)} className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
              {collapsed ? '→' : '←'}
            </button>
          </div>

          <nav className="flex-1 space-y-1 px-3 py-4">
            {professorNav.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/professor' && pathname.startsWith(item.href));
              return (
                <Link key={item.href} href={item.href} className={cn(
                  'flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'
                )}>
                  <span className="text-lg">{item.icon}</span>
                  {!collapsed && <span className="ml-3">{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-gray-200 p-4">
            {!collapsed && turma && (
              <div className="mb-3">
                <div className="flex items-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-600">
                    {getInitials(turma.nome)}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium text-gray-900">{turma.nome}</p>
                    <p className="text-xs text-gray-500">Professor</p>
                  </div>
                </div>
              </div>
            )}
            <button onClick={handleSair} className="flex w-full items-center rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50">
              <span className="text-lg">🚪</span>
              {!collapsed && <span className="ml-3">Sair</span>}
            </button>
          </div>
        </div>
      </aside>

      <main className={cn('p-8 transition-all duration-300', collapsed ? 'ml-16' : 'ml-64')}>
        {children}
      </main>
    </div>
  );
}
