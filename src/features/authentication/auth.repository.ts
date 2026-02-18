import bcrypt from 'bcryptjs';
import { User } from '../users/user.model';

export class AuthRepository {
  static readonly findLoginUser = async (email: string, password: string) => {
    const result = await User.findOne({
      attributes: ['id', 'email', 'password', 'status'],
      where: { email },
      logging: false,
      raw: true,
    });

    const passwordHash = result?.password ?? '$2b$10$invalidinvalidinvalidinvalidinvalidinvalid';

    const passwordIsCorrect = await bcrypt.compare(password, passwordHash);

    if (!passwordIsCorrect) {
      return null;
    }

    if (result && result.password) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars, sonarjs/no-unused-vars
      const { password: _, ...userWithoutPassword } = result;
      return userWithoutPassword;
    }

    return null;
  };
}
