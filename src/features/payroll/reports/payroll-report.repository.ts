import { InferAttributes } from 'sequelize';
import { User } from '../../users/user.model';
import { PayrollReport } from './payroll-report.model';

export class PayrollReportRepository {
  static async create(report: InferAttributes<PayrollReport>) {
    return await PayrollReport.create(report);
  }

  static async findAll({ page, rows }: { page: number; rows: number }) {
    const limit = rows;
    const offset = (page - 1) * rows;

    return PayrollReport.findAndCountAll({
      limit,
      offset,
      include: [
        {
          model: User,
          as: 'uploader',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
    });
  }

  static async delete(id: number) {
    return await PayrollReport.destroy({
      where: { id },
    });
  }

  static async findById(id: number) {
    return await PayrollReport.findByPk(id);
  }
}
