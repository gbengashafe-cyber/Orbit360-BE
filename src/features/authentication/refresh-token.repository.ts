import { CreationAttributes } from 'sequelize';
import { RefreshToken } from './refresh-token.model';

export class RefreshTokenRepository {
  static readonly save = (token: CreationAttributes<RefreshToken>) => {
    return RefreshToken.create(token);
  };

  static readonly readById = (id: string) => {
    return RefreshToken.findByPk(id);
  };

  static readonly revoke = (id: string) => {
    return RefreshToken.update({ revokedAt: new Date(), revokeReason: 'Rotation' }, { where: { id } });
  };
}
