import { User, Envio, LembreteConfig, ConfiguracaoGlobal } from '@/types';

export interface EmailService {
  sendWelcome(user: User, password: string): Promise<boolean>;
  sendConfirmation(envio: Envio): Promise<boolean>;
  sendNotification(envio: Envio, attachments?: { filename: string; content: Buffer }[]): Promise<boolean>;
  sendAIActivity(
    to: string,
    alunoNome: string,
    turmaNome: string,
    disciplina: string,
    texto: string,
    pdf: Buffer,
    docx: Buffer
  ): Promise<boolean>;
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

  private async send(to: string, subject: string, html: string, attachments?: { filename: string; content: Buffer }[]): Promise<boolean> {
    try {
      const body: any = { to, subject, html };
      if (attachments && attachments.length > 0) {
        body.attachments = attachments.map((a) => ({
          filename: a.filename,
          content: a.content.toString('base64'),
        }));
      }

      const response = await fetch('/api/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async sendWelcome(user: User, password: string): Promise<boolean> {
    const html = `
      <h2>Bem-vindo ao Sistema de Atividades Domiciliares!</h2>
      <p>OLA <strong>${user.name}</strong>,</p>
      <p>Voce foi cadastrado no sistema. Aqui estao seus dados de acesso:</p>
      <ul>
        <li><strong>E-mail:</strong> ${user.email}</li>
        <li><strong>Senha temporaria:</strong> ${password}</li>
      </ul>
      <p>Acesse o sistema: <a href="${process.env.NEXT_PUBLIC_APP_URL}">${process.env.NEXT_PUBLIC_APP_URL}</a></p>
      <p>Recomendamos que voce altere sua senha apos o primeiro acesso.</p>
      <p>Atenciosamente,<br>Equipe de Tecnologia</p>
    `;
    return this.send(user.email, 'Bem-vindo ao Sistema de Atividades Domiciliares', html);
  }

  async sendConfirmation(envio: Envio): Promise<boolean> {
    const html = `
      <h2>Atividade Enviada com Sucesso!</h2>
      <p>OLA,</p>
      <p>Sua atividade foi registrada no sistema:</p>
      <ul>
        <li><strong>Data:</strong> ${envio.dataEnvio}</li>
        <li><strong>Hora:</strong> ${envio.horaEnvio}</li>
        <li><strong>Disciplina:</strong> ${envio.disciplina}</li>
      </ul>
      <p>Atenciosamente,<br>Sistema de Atividades Domiciliares</p>
    `;
    return this.send(envio.professorEmail || '', 'Confirmacao de Envio de Atividade', html);
  }

  async sendNotification(envio: Envio, attachments?: { filename: string; content: Buffer }[]): Promise<boolean> {
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
      <p>${config?.assinaturaEmail ? config.assinaturaEmail.replace(/\n/g, '<br>') : 'Atenciosamente,<br>Sistema de Atividades Domiciliares'}</p>
    `;

    let destination = config?.emailDestinoNotificacoes || 'domiciliarmaluf@gmail.com';
    if (destination === 'cartoonlandiapr@gmail.com' || destination === 'provasmaluf@gmail.com' || !destination) {
      destination = 'domiciliarmaluf@gmail.com';
    }

    return this.send(
      destination,
      `Atividade Domiciliar - ${envio.alunoNome}`,
      html,
      attachments
    );
  }

  async sendAIActivity(
    to: string,
    alunoNome: string,
    turmaNome: string,
    disciplina: string,
    texto: string,
    pdf: Buffer,
    docx: Buffer
  ): Promise<boolean> {
    const html = `
      <h2>Atividade Gerada por IA</h2>
      <p>OLA,</p>
      <p>Uma atividade foi gerada automaticamente:</p>
      <ul>
        <li><strong>Aluno:</strong> ${alunoNome}</li>
        <li><strong>Turma:</strong> ${turmaNome}</li>
        <li><strong>Disciplina:</strong> ${disciplina}</li>
      </ul>
      <p>Em anexo, os arquivos para impressao (PDF) e edicao (DOCX).</p>
      <p>Atenciosamente,<br>Sistema de Atividades Domiciliares</p>
    `;

    return this.send(to, `Atividade IA - ${alunoNome} - ${disciplina}`, html, [
      { filename: `atividade_${alunoNome.replace(/\s/g, '_')}_${disciplina}.pdf`, content: pdf },
      { filename: `atividade_${alunoNome.replace(/\s/g, '_')}_${disciplina}.docx`, content: docx },
    ]);
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
      <h2>Lembrete - Atividade Domiciliar</h2>
      <p>OLA <strong>${professor.name}</strong>,</p>
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
      if (response.ok) return response.json();
    } catch {}
    return null;
  }
}

export const emailService: EmailService = new ResendEmailService();
