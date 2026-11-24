import { Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { NotificationCategory } from './notification.model';
import { NotificationPreferenceService, NotificationPreferenceUser } from './notification-preference.service';
import { NotificationRepository } from './notification.repository';
import { toNotificationView } from './notification.controller';

const currentUser = (req: Request): NotificationPreferenceUser => {
  if (!req.user?.id || !req.user.email) throw ApiError.unauthenticated('Authentication failed');
  return { id: Number(req.user.id), email: req.user.email, permissions: req.user.permissions ?? [] };
};

export class NotificationPreferenceController {
  static readonly getPreferences = async (req: Request, res: Response) => {
    const data = await NotificationPreferenceService.list(currentUser(req));
    res.json(ApiResponse({ data, message: 'Notification preferences fetched successfully' }));
  };

  static readonly updatePreference = async (req: Request, res: Response) => {
    const { category, ...values } = res.locals.preferenceUpdate as {
      category: string;
      inAppEnabled?: boolean;
      realtimeEnabled?: boolean;
    };
    const data = await NotificationPreferenceService.update(currentUser(req), category as NotificationCategory, values);
    res.json(ApiResponse({ data, message: 'Notification preference updated successfully' }));
  };

  static readonly getRealtimePending = async (req: Request, res: Response) => {
    const { rows } = res.locals.realtimePollQuery as { rows: number };
    const pending = await NotificationRepository.findRealtimePending(Number(req.user?.id), rows);
    const hasMore = pending.length > rows;
    const page = hasMore ? pending.slice(0, rows) : pending;
    res.json(
      ApiResponse({
        data: page.map(toNotificationView),
        pagination: { rows, hasMore },
        message: 'Pending real-time notifications fetched successfully',
      }),
    );
  };

  static readonly acknowledgeRealtime = async (req: Request, res: Response) => {
    const { ids } = res.locals.realtimeAcknowledge as { ids: number[] };
    const acknowledged = await NotificationRepository.acknowledgeRealtime(Number(req.user?.id), ids);
    res.json(ApiResponse({ data: { acknowledged }, message: 'Real-time notifications acknowledged successfully' }));
  };
}
