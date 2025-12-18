import { Permission } from "./permission.model";

class PermissionRepository {
  static getPermissionByName = async (name) => {
    return Permission.findOne({ where: { name } });
  };
}

export { PermissionRepository };
