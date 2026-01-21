import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { JobRolePermissions } from '../permissions/permission.model';
import { JobRole } from './job-role.model';

class JobRoleRepository {
  static readonly getJobRolePermissions = async (jobRoleName: string) => {
    const result = await JobRolePermissions.findAll({ where: { jobRole: jobRoleName }, attributes: ['permission'] });

    const permissions = result.flatMap((_result) => _result.permission);
    return permissions;
  };

  static readonly create = (position: InferCreationAttributes<JobRole>) => {
    return JobRole.create(position);
  };

  static readonly read = async ({ page, rows, query }) => {
    const whereCondition = query ? { title: { [Op.substring]: query } } : {};

    return JobRole.findAndCountAll({ where: whereCondition, limit: rows, offset: (page - 1) * rows });
  };

  static readonly readById = async (id) => {
    return JobRole.findByPk(id, { include: [{ model: JobRolePermissions }] });
  };

  static readonly update = async (id, role: InferAttributes<JobRole>) => {
    return JobRole.update(role, { where: { id } });
  };
}

export { JobRoleRepository };
