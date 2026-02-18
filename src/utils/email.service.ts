import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

// Email transporter configuration
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: env.MAIL_USERNAME || 'noreply@orbit360.com',
    pass: env.MAIL_PASSWORD || '',
  },
});

// Verify transporter connection
transporter
  .verify()
  .then(() => {
    logger.info('Email service configured successfully');
  })
  .catch((error) => {
    logger.warn(`Email service configuration issue: ${error.message}`);
  });

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  cc?: string | string[];
}

export const emailService = {
  /**
   * Send email
   */
  async sendEmail(options: EmailOptions) {
    try {
      const result = await transporter.sendMail({
        from: env.MAIL_USERNAME || 'noreply@orbit360.com',
        to: options.to,
        cc: options.cc,
        subject: options.subject,
        html: options.html,
      });

      logger.info(`Email sent successfully: ${result.messageId}`);
      return result;
    } catch (error) {
      logger.error(`Failed to send email: ${error}`);
      throw error;
    }
  },

  /**
   * Send leave request approval email to supervisor
   */
  async sendLeaveRequestEmail(
    supervisorEmail: string,
    supervisorName: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    reason: string,
    approvalLink: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Leave Request Approval Required</h2>
        
        <p>Hi ${supervisorName},</p>
        
        <p><strong>${employeeName}</strong> has submitted a leave request that requires your approval.</p>
        
        <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Type:</strong> ${leaveType}</li>
            <li><strong>Start Date:</strong> ${startDate}</li>
            <li><strong>End Date:</strong> ${endDate}</li>
            <li><strong>Reason:</strong> ${reason}</li>
          </ul>
        </div>
        
        <p>
          <a href="${approvalLink}" style="background-color: #1e40af; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
            Review & Approve Leave Request
          </a>
        </p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: supervisorEmail,
      subject: `Leave Request Approval Required - ${employeeName}`,
      html,
    });
  },

  /**
   * Send leave request confirmation email to employee
   */
  async sendLeaveRequestConfirmation(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    supervisorName: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Leave Request Submitted</h2>
        
        <p>Hi ${employeeName},</p>
        
        <p>Your leave request has been successfully submitted and is pending approval from <strong>${supervisorName}</strong>.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Type:</strong> ${leaveType}</li>
            <li><strong>Start Date:</strong> ${startDate}</li>
            <li><strong>End Date:</strong> ${endDate}</li>
          </ul>
        </div>
        
        <p>You will be notified once your request has been reviewed. You can track your request status in the leave management section of Orbit360.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: 'Leave Request Submitted',
      html,
    });
  },

  /**
   * Send leave approval notification to employee
   */
  async sendLeaveApprovalEmail(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    supervisorName: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Leave Request Approved</h2>
        
        <p>Hi ${employeeName},</p>
        
        <p>Great news! Your leave request has been <strong>approved</strong> by <strong>${supervisorName}</strong>.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Approved Leave Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Type:</strong> ${leaveType}</li>
            <li><strong>Start Date:</strong> ${startDate}</li>
            <li><strong>End Date:</strong> ${endDate}</li>
          </ul>
        </div>
        
        <p>Enjoy your well-deserved break!</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: 'Leave Request Approved',
      html,
    });
  },

  /**
   * Send leave rejection notification to employee
   */
  async sendLeaveRejectionEmail(
    employeeEmail: string,
    employeeName: string,
    leaveType: string,
    startDate: string,
    endDate: string,
    supervisorName: string,
    reason?: string,
  ) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #dc2626;">Leave Request Rejected</h2>
        
        <p>Hi ${employeeName},</p>
        
        <p>Unfortunately, your leave request has been <strong>rejected</strong> by <strong>${supervisorName}</strong>.</p>
        
        <div style="background-color: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Leave Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Type:</strong> ${leaveType}</li>
            <li><strong>Start Date:</strong> ${startDate}</li>
            <li><strong>End Date:</strong> ${endDate}</li>
            ${reason ? `<li><strong>Reason:</strong> ${reason}</li>` : ''}
          </ul>
        </div>
        
        <p>Please contact your supervisor for more information or to discuss alternative dates.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: 'Leave Request Rejected',
      html,
    });
  },

  /**
   * Send exit/resignation notification to HR
   */
  async sendExitSubmissionEmail(hrEmails: string | string[], employeeName: string, lastWorkingDay: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e40af;">Resignation Submitted – ${employeeName}</h2>
        
        <p>Dear HR Team,</p>
        
        <p><strong>${employeeName}</strong> has submitted a resignation request.</p>
        
        <div style="background-color: #f0f4f8; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Resignation Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Employee Name:</strong> ${employeeName}</li>
            <li><strong>Proposed Last Working Day:</strong> ${lastWorkingDay}</li>
          </ul>
        </div>
        
        <p>Please log in to Orbit360 to review and process the exit request.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: hrEmails,
      subject: `Resignation Submitted – ${employeeName}`,
      html,
    });
  },

  /**
   * Send exit approval notification to employee
   */
  async sendExitApprovalEmail(employeeEmail: string, employeeName: string, lastWorkingDay: string) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">Exit Request Approved</h2>
        
        <p>Dear ${employeeName},</p>
        
        <p>Your resignation has been <strong>accepted</strong>.</p>
        
        <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p><strong>Exit Details:</strong></p>
          <ul style="list-style: none; padding: 0;">
            <li><strong>Last Working Day:</strong> ${lastWorkingDay}</li>
          </ul>
        </div>
        
        <p>HR will contact you regarding clearance procedures and final settlement details.</p>
        
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          This is an automated email from Orbit360. Please do not reply to this email.
        </p>
      </div>
    `;

    return this.sendEmail({
      to: employeeEmail,
      subject: 'Exit Request Approved',
      html,
    });
  },
};
