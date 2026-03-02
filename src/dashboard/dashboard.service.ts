import { DashboardRepository, DashboardStatsParams } from './dashboard.repository';

export class DashboardService {
  static readonly getDashboard = async ({ startDate, endDate, departmentId }: DashboardStatsParams) => {
    const [metrics, leaves, pendingLoanRequests, attritionTrend, genderResult] = await Promise.all([
      DashboardRepository.getGeneralMetrics(departmentId),
      DashboardRepository.getLeaveCounts({ departmentId, startDate, endDate }),
      DashboardRepository.getPendingLoanRequests(),
      DashboardRepository.getAttritionTrend({ departmentId, startDate, endDate }),
      DashboardRepository.getGenderDistribution(departmentId),
    ]);

    const genderLabels: Record<string, string> = {
      M: 'Male',
      F: 'Female',
    };

    const genderDistribution = genderResult.map((item) => ({
      name: genderLabels[item.name] || item.name,
      value: Number(item.value),
    }));

    const headcount = metrics?.totalHeadcount || 0;
    const exits = metrics?.totalExited || 0;

    return {
      overview: {
        totalHeadcount: headcount,
        pendingLeaveRequests: leaves?.pendingRequests || 0,
        pendingLoanRequests: pendingLoanRequests || 0,
        currentlyOnLeave: leaves?.currentlyOnLeave || 0,
        attritionRate: headcount + exits > 0 ? ((exits / (headcount + exits)) * 100).toFixed(2) + '%' : '0%',
      },
      salaryDistribution: {
        average: metrics?.avgSalary?.toFixed(2),
        min: metrics?.minSalary || 0,
        max: metrics?.maxSalary || 0,
      },
      genderDistribution,
      attritionTrend,
    };
  };
}
