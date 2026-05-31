import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
    private readonly logger = new Logger(EmailService.name);
    private transporter: nodemailer.Transporter;

    constructor(private readonly config: ConfigService) {
        this.transporter = nodemailer.createTransport({
            host:   config.get<string>('SMTP_HOST', 'smtp.gmail.com'),
            port:   config.get<number>('SMTP_PORT', 587),
            secure: config.get<boolean>('SMTP_SECURE', false),
            auth: {
                user: config.get<string>('SMTP_USER'),
                pass: config.get<string>('SMTP_PASS'),
            },
        });
    }

    async sendPasswordReset(to: string, name: string, resetUrl: string): Promise<void> {
        const from = this.config.get<string>('SMTP_FROM', 'noreply@learnhub.ua');
        try {
            await this.transporter.sendMail({
                from: `"LearnHub" <${from}>`,
                to,
                subject: 'Скидання пароля',
                html: `
          <div style="font-family: 'Helvetica Neue', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 24px; color: #0a0a0a;">
            <p style="font-size: 1.3rem; font-weight: 600; margin: 0 0 8px;">Привіт, ${name} 👋</p>
            <p style="color: #5a5a5a; margin: 0 0 32px;">Ми отримали запит на скидання пароля для твого акаунта.</p>
            <a href="${resetUrl}"
               style="display: inline-block; padding: 12px 28px; background: #0a0a0a; color: #fafafa;
                      text-decoration: none; border-radius: 8px; font-weight: 500; font-size: 0.95rem;">
              Скинути пароль
            </a>
            <p style="margin: 32px 0 0; font-size: 0.85rem; color: #9a9a9a;">
              Посилання дійсне 1 годину. Якщо ти не запитував скидання — просто ігноруй цей лист.
            </p>
          </div>
        `,
            });
        } catch (err) {
            this.logger.error(`Failed to send reset email to ${to}`, err);
        }
    }
}