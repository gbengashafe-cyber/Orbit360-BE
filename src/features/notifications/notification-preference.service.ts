import { ApiError } from '../../utils/api-error';
import { db } from '../../db';
import { Employee } from '../employee/employee.model';
import { NotificationCategory, NOTIFICATION_CATEGORIES } from './notification.model';
import { NotificationPreference } from './notification-preference.model';

const EMPLOYEE_CATEGORIES: readonly NotificationCategory[] = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'EXIT'];

const CATEGORY_PERMISSIONS: Partial<Record<NotificationCategory, readonly string[]>> = {
  LOAN: ['LIST_LOANS', 'MANAGE_LOANS', 'APPROVE_LOANS'],
  TRAINING: ['LIST_TRAINING_REQUESTS', 'MANAGE_TRAINING_REQUESTS', 'APPROVE_TRAINING_REQUESTS'],
  COMPLAINT: ['MANAGE_COMPLAINTS', 'APPROVE_COMPLAINTS'],
  EXIT: ['MANAGE_EXITS', 'APPROVE_EXITS'],
};

export type NotificationPreferenceUser = { id: number; email: string; permissions?: string[] };

const preferencesFor = (preference?: NotificationPreference) => ({
  inAppEnabled: preference?.inAppEnabled ?? true,
  realtimeEnabled: preference?.realtimeEnabled ?? true,
});

export class NotificationPreferenceService {
  private static readonly availableCategories = async (user: NotificationPreferenceUser) => {
    const employee = await Employee.findOne({ where: { email: user.email }, attributes: ['id'], logging: false });
    const permissions = new Set((user.permissions ?? []).map((permission) => permission.toUpperCase()));

    return NOTIFICATION_CATEGORIES.filter((category) => {
      if (category === 'GENERAL') return true;
      if (employee && EMPLOYEE_CATEGORIES.includes(category)) return true;
      return (CATEGORY_PERMISSIONS[category] ?? []).some((permission) => permissions.has(permission));
    });
  };

  static readonly list = async (user: NotificationPreferenceUser) => {
    const categories = await this.availableCategories(user);
    const records = await NotificationPreference.findAll({
      where: { userId: user.id, category: categories },
      logging: false,
    });
    const byCategory = new Map(records.map((preference) => [preference.category, preference]));

    return categories.map((category) => ({ category, ...preferencesFor(byCategory.get(category)) }));
  };

  static readonly update = async (
    user: NotificationPreferenceUser,
    category: NotificationCategory,
    values: { inAppEnabled?: boolean; realtimeEnabled?: boolean },
  ) => {
    const categories = await this.availableCategories(user);
    if (!categories.includes(category)) {
      throw ApiError.forbidden('You are not authorized to manage preferences for this category.');
    }

    return db.transaction(async (transaction) => {
      const [preference] = await NotificationPreference.findOrCreate({
        where: { userId: user.id, category },
        defaults: { userId: user.id, category, inAppEnabled: true, realtimeEnabled: true },
        transaction,
      });
      await preference.update(values, { transaction });
      return { category, ...preferencesFor(preference) };
    });
  };
}
