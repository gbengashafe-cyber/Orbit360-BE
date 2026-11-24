import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { NotificationController } from './notification.controller';
import { validateFeedQuery, validateNotificationIdParam, validateReadAllQuery } from './notification.validators';

const router = Router();

// Every route is authenticated and scoped to the session user. There is deliberately no create/broadcast route:
// notifications are created only by NotificationService inside the backend.
router.use(validateAuthToken);

router.get('/', validateFeedQuery, NotificationController.getFeed);
router.get('/unread-count', NotificationController.getUnreadCount);
router.patch('/read-all', validateReadAllQuery, NotificationController.markAllRead);
router.patch('/:id/read', validateNotificationIdParam, NotificationController.markRead);
router.patch('/:id/unread', validateNotificationIdParam, NotificationController.markUnread);

export { router as notificationRoutes };
