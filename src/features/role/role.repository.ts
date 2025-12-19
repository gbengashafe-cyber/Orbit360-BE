import { Role } from "./role.model";

class RoleRepository {
  static getRoleByName = async (name) => {
    return Role.findOne({ where: { name } });
  };
}

export { RoleRepository };
