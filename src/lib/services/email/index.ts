import { User, Envio, LembreteConfig, ConfiguracaoGlobal } from '@/types';

export interface EmailService {
  sendWelcome(user: User, password: string): Promise<boolean>;
  sendConfirmation(envio: Envio): Promise<boolean>;
  sendNotification(envio: Envio): Promise<boolean>;
  sendReminder(
    professor: User,
    aluno: string,
    turma: string,
    disciplina: string,
    prazo: string,
    config: LembreteConfig
  ): Promise<boolean>;
}

class ResendEmailService implements EmailService {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.RESEND_API_KEY || '';
  }

  private async send(to: string, subject: string, html: string): Promise<boolean> {
    try {
      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to, subject, html }),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendWelcome(user: User, password: string): Promise<boolean> {
    const html = `
      <h2>Bem-vindo ao Sistema de Atividades Domiciliares!</h2>
      <p>Olá <strong>${user.name}</strong>,</p>
      <p>Você foi cadastrado no sistema. Aqui estão seus dados de acesso:</p>
      <ul>
        <li><strong>E-mail:</strong> ${user.email}</li>
        <li><strong>Senha temporária:</strong> ${password}</li>
      </ul>
      <p>Acesse o sistema: <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a></p>
      <p>Recomendamos que você altere sua senha após o primeiro acesso.</p>
      <p>Atenciosamente,<br>Equipe de Tecnologia</p>
    `;

    return this.send(user.email, 'Bem-vindo ao Sistema de Atividades Domiciliares', html);
  }

  async sendConfirmation(envio: Envio): Promise<boolean> {
    const html = `
      <h2>Atividade Enviada com Sucesso!</h2>
      <p>Olá,</p>
      <p>Sua atividade foi registrada no sistema:</p>
      <ul>
        <li><strong>Data:</strong> ${envio.dataEnvio}</li>
        <li><strong>Hora:</strong> ${envio.horaEnvio}</li>
        <li><strong>Disciplina:</strong> ${envio.disciplina}</li>
        <li><strong>Versão:</strong> ${envio.versao}</li>
      </ul>
      <p>Atenciosamente,<br>Sistema de Atividades Domiciliares</p>
    `;

    return this.send(envio.professorEmail || '', 'Confirmação de Envio de Atividade', html);
  }

  async sendNotification(envio: Envio): Promise<boolean> {
    const config = await this.getConfig();
    const html = `
      <h2>Nova Atividade Recebida</h2>
      <p>Uma nova atividade foi enviada:</p>
      <ul>
        <li><strong>Aluno:</strong> ${envio.alunoNome}</li>
        <li><strong>Professor:</strong> ${envio.professorNome}</li>
        <li><strong>Turma:</strong> ${envio.turmaNome}</li>
        <li><strong>Disciplina:</strong> ${envio.disciplina}</li>
        <li><strong>Data:</strong> ${envio.dataEnvio}</li>
      </ul>
      <p>Atenciosamente,<br>${config?.assinaturaEmail || 'Sistema de Atividades Domiciliares'}</p>
    `;

    return this.send(
      config?.emailDestinoNotificacoes || 'provasmaluf@gmail.com',
      `Nova Atividade - ${envio.alunoNome}`,
      html
    );
  }

  async sendReminder(
    professor: User,
    aluno: string,
    turma: string,
    disciplina: string,
    prazo: string,
    config: LembreteConfig
  ): Promise<boolean> {
    const html = `
      <h2>Lembrete de Atividade Domiciliar</h2>
      <p>Olá <strong>${professor.name}</strong>,</p>
      <p>${config.textoEmail}</p>
      <ul>
        <li><strong>Aluno:</strong> ${aluno}</li>
        <li><strong>Turma:</strong> ${turma}</li>
        <li><strong>Disciplina:</strong> ${disciplina}</li>
        <li><strong>Prazo:</strong> ${prazo}</li>
      </ul>
      <p><a href="${process.env.NEXT_PUBLIC_APP_URL}">Acessar Sistema</a></p>
      <p>${config.assinatura}</p>
    `;

    return this.send(professor.email, 'Lembrete - Atividade Domiciliar Pendente', html);
  }

  private async getConfig(): Promise<ConfiguracaoGlobal | null> {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        return response.json();
      }
    } catch {}
    return null;
  }
}

export const emailService: EmailService = new ResendEmailService();
