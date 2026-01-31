import { ApprovalRepository } from './pending-authorization.repository';

export class ApprovalService {
  static readonly getGroupedPending = async (page = 1, rows = 25) => {
    const [loans, leaves, employees] = await Promise.all([
      ApprovalRepository.getPendingLoans(rows),
      ApprovalRepository.getPendingLeaves(rows),
      ApprovalRepository.getPendingEmployees(rows),
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

  static readonly getBadgeCounts = async () => {
    const [loanCount, leaveCount, employeeCount] = await ApprovalRepository.getPendingCounts();
    const total = loanCount + leaveCount + employeeCount;

    return {
      total,
      breakdown: {
        loans: loanCount,
        leaves: leaveCount,
        employees: employeeCount,
      },
    };
  };

  static readonly getCheckerHistory = async (checkerId: number, page = 1, rows = 25) => {
    const { loans } = await ApprovalRepository.getApprovedByChecker(checkerId, rows);

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
}
