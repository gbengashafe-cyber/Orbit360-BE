import config from 'config';
import path from 'node:path';
import { createTransport, TransportOptions } from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import { env } from '../config/env';
import { logger } from './logger';

const mailSender = config.get<string>('mail.mailSender');

// eslint-disable-next-line sonarjs/no-clear-text-protocols
const transporter = createTransport({
  host: config.get<string>('mail.server'),
  port: config.get<number>('mail.serverPort'),
  secure: false,
  requireTLS: true,
  auth: {
    user: env.MAIL_USERNAME,
    pass: env.MAIL_PASSWORD,
  },
  tls: {
    rejectUnauthorized: false,
  },
  pool: true,
  maxConnections: 5,
} as TransportOptions);

transporter.use(
  'compile',
  hbs({
    viewEngine: {
      extname: '.hbs',
      layoutsDir: path.resolve('./src/views/email/layouts'),
      partialsDir: path.resolve('./src/views/email/partials'),
    },
    viewPath: path.resolve('./src/views/email'),
    extName: '.hbs',
  }),
);

export type MailOptions = {
  from?: string;
  to: string[] | string;
  subject: string;
  body: string;
  isHTML?: boolean;
  attachments?: any[];
};

export type MailWithTemplateOptions = {
  from?: string;
  to: string[] | string;
  subject: string;
  body: string;
  template: string;
  isHTML?: boolean;
  attachments?: any[];
  context: Record<string, any>;
};

export class MailUtil {
  static readonly sendMail = async ({ from = mailSender, to, subject, body, attachments = [] }: MailOptions) => {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: body,
        attachments,
      });
      logger.info(`Mail sent successfully. response: ${info.response}`);
      return true;
    } catch (error: any) {
      logger.error({
        message: 'Mail sending failed.',
        error: error?.message || error,
        code: error?.code,
        command: error?.command,
      });
      return false;
    }
  };

  static readonly sendMailWithTemplate = async ({
    from = mailSender,
    to,
    subject,
    body,
    attachments,
  }: MailWithTemplateOptions) => {
    try {
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html: body,
        attachments,
      });
      logger.info(`Mail sent successfully. response: ${info.response}`);
      return true;
    } catch (error: any) {
      logger.error({
        message: 'Mail sending failed.',
        error: error?.message || error,
        code: error?.code,
        command: error?.command,
      });
      return false;
    }
  };
}
