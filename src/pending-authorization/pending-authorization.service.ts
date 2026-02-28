import { EmployeeRepository } from '../features/employee/employee.repository';
import { ApiError } from '../utils/api-error';
import { AuthorizationRepository } from './pending-authorization.repository';

export type PendingModuleItemsProps = {
  moduleName: string;
  page: number;
  rows: number;
  userId: number;
  userEmployeeId: number;
  supervisorId: number;
};

export class AuthorizationService {
  static readonly getGroupedPending = async (page = 1, rows = 25) => {
    const [loans, leaves, employees] = await Promise.all([
      AuthorizationRepository.getPendingLoans(rows),
      AuthorizationRepository.getPendingLeaves(rows),
      AuthorizationRepository.getPendingEmployees(rows),
    ]);

    const allItems = [
      ...loans.map((item) => ({ ...item, entityType: 'loans' })),
      ...leaves.map((item) => ({ ...item, entityType: 'leaves' })),
      ...employees.map((item) => ({ ...item, entityType: 'employees' })),
    ];

    allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const startIndex = (page - 1) * rows;
    const paginatedSubset = allItems.slice(startIndex, startIndex + rows);

    const grouped = paginatedSubset.reduce(
      (acc: any, item: any) => {
        const { entityType, ...data } = item;
        if (!acc[entityType]) acc[entityType] = [];
        acc[entityType].push(data);
        return acc;
      },
      { loans: [], leaves: [], employees: [] },
    );

    return {
      data: grouped,
      pagination: {
        totalOnPage: paginatedSubset.length,
        page,
        rows,
      },
    };
  };

  static readonly getBadgeCounts = async (userPermissions: string[], userId: number, userEmployeeId: number) => {
    const authorizedModules = userPermissions
      .filter((perm) => perm.startsWith('APPROVE_'))
      .map((perm) => perm.replace('APPROVE_', ''));

    // If the user is a supervisor, add leaves module
    const supervisorSearch = await EmployeeRepository.readWithNoCompany({
      filters: { supervisorId: userEmployeeId },
      rows: 1,
      page: 1,
    });

    if (supervisorSearch.count) {
      authorizedModules.push('LEAVES');
    }

    if (authorizedModules.length === 0) {
      return { total: 0, breakdown: {} };
    }

    const results = await AuthorizationRepository.getCountsByModules(authorizedModules, userId, userEmployeeId);

    const breakdown: Record<string, number> = {};
    let total = 0;

    results.forEach(({ key, count }) => {
      breakdown[key] = count;
      total += count;
    });

    return { total, breakdown };
  };

  static readonly getCheckerHistory = async (checkerId: number, page = 1, rows = 25) => {
    const { loans } = await AuthorizationRepository.getApprovedByChecker(checkerId, rows);

    const groupedData = {
      loans: {
        loans,
      },
    };

    return {
      success: true,
      data: groupedData,
      summary: {
        totalItems: loans.length,
        checkerId,
        page,
      },
    };
  };

  static readonly getPendingModuleItems = async ({
    moduleName,
    page,
    rows,
    userId,
    userEmployeeId,
    supervisorId,
  }: PendingModuleItemsProps) => {
    const result = await AuthorizationRepository.getPendingByModule({
      moduleName,
      page,
      rows,
      userEmployeeId,
      supervisorId,
      userId,
    });

    if (!result) {
      throw ApiError.badRequest(`Invalid module type: ${moduleName}`);
    }

    return {
      data: result.rows,
      pagination: {
        total: result.count,
        page,
        rows,
        pages: Math.ceil(result.count / rows),
      },
    };
  };
}
