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

    console.log('User found:', { email, found: !!result, storedPassword: result?.password?.substring(0, 20) });

    if (!result?.password) {
      console.log('No password found in database');
      return null;
    }

    // For testing - compare with plaintext
    const storedPass = result.password?.trim();
    const inputPass = password?.trim();
    const passwordIsCorrect = inputPass === storedPass;
    console.log('Password comparison:', {
      passwordIsCorrect,
      inputLength: inputPass?.length,
      storedLength: storedPass?.length,
      input: inputPass,
      stored: storedPass,
    });

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
