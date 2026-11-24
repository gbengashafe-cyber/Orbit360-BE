import { Op } from 'sequelize';
import { logger } from '../../utils/logger';
import { Employee } from '../employee/employee.model';
import { User } from '../users/user.model';

/**
 * A recipient as an event knows it. Employee-facing events usually know the employee record;
 * user accounts are resolved from it with the existing email convention (users.email = employees.email).
 *
 * Phase 2 supports only individual recipients. Approver fan-out (supervisor, HR Officer, HR Manager,
 * Super Admin) is deferred (D4) and will be added here as new reference kinds.
 */
export type RecipientRef = { kind: 'user'; userId: number } | { kind: 'employee'; employeeId: number };
type UserRef = Extract<RecipientRef, { kind: 'user' }>;
type EmployeeRef = Extract<RecipientRef, { kind: 'employee' }>;

export type UnresolvedReason = 'user_not_found' | 'employee_not_found' | 'employee_has_no_user';
export type UnresolvedRecipient = { ref: RecipientRef; reason: UnresolvedReason };
export type ResolvedRecipients = { userIds: number[]; unresolved: UnresolvedRecipient[] };

// Logs carry ids only, never names or email addresses.
const describe = (ref: RecipientRef) => (ref.kind === 'user' ? `user ${ref.userId}` : `employee ${ref.employeeId}`);

const normaliseEmail = (email: string | null | undefined) => email?.trim().toLowerCase() || null;

/** Ids of existing, non-deleted users (users are paranoid, so soft-deleted accounts are excluded). */
const findExistingUserIds = async (refs: UserRef[]) => {
  if (!refs.length) return new Set<number>();
  const users = await User.findAll({
    where: { id: { [Op.in]: [...new Set(refs.map((ref) => ref.userId))] } },
    attributes: ['id'],
    logging: false,
  });
  return new Set(users.map((user) => user.id));
};

/** employeeId -> userId (or null when the employee exists but has no matching account). Missing employees are absent. */
const mapEmployeesToUsers = async (refs: EmployeeRef[]) => {
  const result = new Map<number, number | null>();
  if (!refs.length) return result;

  const employees = await Employee.findAll({
    where: { id: { [Op.in]: [...new Set(refs.map((ref) => ref.employeeId))] } },
    attributes: ['id', 'email'],
    logging: false,
  });

  const emails = [
    ...new Set(employees.map((employee) => normaliseEmail(employee.email)).filter((email): email is string => !!email)),
  ];
  const userIdByEmail = new Map<string, number>();
  if (emails.length) {
    const users = await User.findAll({ where: { email: { [Op.in]: emails } }, attributes: ['id', 'email'], logging: false });
    users.forEach((user) => {
      const email = normaliseEmail(user.email);
      if (email) userIdByEmail.set(email, user.id);
    });
  }

  employees.forEach((employee) => {
    const email = normaliseEmail(employee.email);
    result.set(employee.id, (email && userIdByEmail.get(email)) || null);
  });
  return result;
};

export class NotificationRecipients {
  /**
   * Resolves recipient references to existing user account ids.
   * Never guesses: anything that cannot be matched exactly is reported in `unresolved` and logged as a warning.
   * The result has no duplicate user ids, in the order the references were given.
   */
  static readonly resolve = async (refs: RecipientRef[], context = 'notification'): Promise<ResolvedRecipients> => {
    const [existingUserIds, employeeUsers] = await Promise.all([
      findExistingUserIds(refs.filter((ref): ref is UserRef => ref.kind === 'user')),
      mapEmployeesToUsers(refs.filter((ref): ref is EmployeeRef => ref.kind === 'employee')),
    ]);

    const userIds: number[] = [];
    const unresolved: UnresolvedRecipient[] = [];

    for (const ref of refs) {
      const { userId, reason } = NotificationRecipients.lookup(ref, existingUserIds, employeeUsers);
      if (userId === null) {
        unresolved.push({ ref, reason: reason as UnresolvedReason });
      } else if (!userIds.includes(userId)) {
        userIds.push(userId);
      }
    }

    unresolved.forEach(({ ref, reason }) => logger.warn(`[${context}] Recipient skipped: ${describe(ref)} (${reason})`));

    return { userIds, unresolved };
  };

  private static lookup(
    ref: RecipientRef,
    existingUserIds: Set<number>,
    employeeUsers: Map<number, number | null>,
  ): { userId: number | null; reason?: UnresolvedReason } {
    if (ref.kind === 'user') {
      return existingUserIds.has(ref.userId) ? { userId: ref.userId } : { userId: null, reason: 'user_not_found' };
    }
    if (!employeeUsers.has(ref.employeeId)) return { userId: null, reason: 'employee_not_found' };

    const userId = employeeUsers.get(ref.employeeId) ?? null;
    return userId === null ? { userId: null, reason: 'employee_has_no_user' } : { userId };
  }
}
