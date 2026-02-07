import config from 'config';
import path from 'node:path';
import { createTransport, TransportOptions } from 'nodemailer';
import hbs from 'nodemailer-express-handlebars';
import { env } from '../config/env';
import { logger } from './logger';

const mailSender = config.get('mail.mailSender') as string;
const mailServer = config.get('mail.server');
const mailServerPort = config.get('mail.serverPort');
console.log('🚀 ~ mailServer:', mailServer);
console.log('🚀 ~ mailServerPort:', mailServerPort);
console.log('🚀 ~ env.MAIL_USERNAME:', env.MAIL_USERNAME);
console.log('🚀 ~ env.MAIL_PASSWORD:', env.MAIL_PASSWORD);

const transporter = createTransport({
  host: mailServer,
  port: mailServerPort,
  secure: mailServerPort === 465,
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
  static readonly sendMail = async ({ from = mailSender, to, subject, body, attachments }: MailOptions) => {
    // if (process.env.NODE_ENV !== 'production') return new Promise((resolve) => setTimeout(resolve, 1500, true));

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
    } catch (error) {
      logger.error({ message: 'Mail sending failed.', error });
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
    } catch (error) {
      logger.error({ message: 'Mail sending failed.', error });
      return false;
    }
  };
}

MailUtil.sendMail({ to: 'oluabiolaseun@gmail.com', subject: 'Testing', body: 'Testing' });
