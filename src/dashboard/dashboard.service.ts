import { DashboardRepository, DashboardStatsParams } from './dashboard.repository';

export class DashboardService {
  static readonly getDashboard = async ({ startDate, endDate, department }: DashboardStatsParams) => {
    const [metrics, leaves, attritionTrend, genderResult] = await Promise.all([
      DashboardRepository.getGeneralMetrics(department),
      DashboardRepository.getLeaveCounts({ department, startDate, endDate }),
      DashboardRepository.getAttritionTrend({ department, startDate, endDate }),
      DashboardRepository.getGenderDistribution(department),
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
    const terminations = metrics?.totalTerminations || 0;

    return {
      overview: {
        totalHeadcount: headcount,
        pendingLeaveRequests: leaves?.pendingRequests || 0,
        currentlyOnLeave: leaves?.currentlyOnLeave || 0,
        attritionRate: headcount + terminations > 0 ? ((terminations / (headcount + terminations)) * 100).toFixed(2) + '%' : '0%',
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
