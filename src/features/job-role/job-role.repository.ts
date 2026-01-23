import { InferAttributes, InferCreationAttributes, Op } from 'sequelize';
import { JobRolePermissions } from '../permissions/permission.model';
import { JobRole } from './job-role.model';

class JobRoleRepository {
  static readonly getJobRolePermissions = async (jobRoleName: string) => {
    const results = await JobRolePermissions.findAll({
      where: { jobRole: jobRoleName.toUpperCase() },
      attributes: ['permission'],
      raw: true,
    });
    console.log(`JobRolePermissions query for ${jobRoleName}:`, results);
    return results;
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
