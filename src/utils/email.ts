import { EmailOptions, emailService } from './email.service';

/**
 * Compatibility wrapper so modules can import { sendEmail } from './utils/email'
 */
export async function sendEmail(options: EmailOptions) {
  return emailService.sendEmail(options);
}

export default {
  sendEmail,
};
