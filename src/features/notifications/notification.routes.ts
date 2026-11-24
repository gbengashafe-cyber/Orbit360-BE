import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { NotificationController } from './notification.controller';
import { NotificationPreferenceController } from './notification-preference.controller';
import {
  validateFeedQuery,
  validateNotificationIdParam,
  validatePreferenceUpdate,
  validateReadAllQuery,
  validateRealtimeAcknowledge,
  validateRealtimePollQuery,
} from './notification.validators';

const router = Router();

// Every route is authenticated and scoped to the session user. There is deliberately no create/broadcast route:
// notifications are created only by NotificationService inside the backend.
router.use(validateAuthToken);

router.get('/preferences', NotificationPreferenceController.getPreferences);
router.patch('/preferences', validatePreferenceUpdate, NotificationPreferenceController.updatePreference);
router.get('/realtime', validateRealtimePollQuery, NotificationPreferenceController.getRealtimePending);
router.post('/realtime/acknowledge', validateRealtimeAcknowledge, NotificationPreferenceController.acknowledgeRealtime);
router.get('/', validateFeedQuery, NotificationController.getFeed);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', validateReadAllQuery, NotificationController.markAllRead);
router.patch('/:id/read', validateNotificationIdParam, NotificationController.markRead);
router.patch('/:id/unread', validateNotificationIdParam, NotificationController.markUnread);

export { router as notificationRoutes };
