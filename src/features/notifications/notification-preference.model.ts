import { CreationOptional, DataTypes, ForeignKey, InferAttributes, InferCreationAttributes, Model } from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';
import { NotificationCategory, NOTIFICATION_CATEGORIES } from './notification.model';

export class NotificationPreference extends Model<
  InferAttributes<NotificationPreference>,
  InferCreationAttributes<NotificationPreference>
> {
  declare userId: ForeignKey<User['id']>;
  declare category: NotificationCategory;
  declare inAppEnabled: CreationOptional<boolean>;
  declare realtimeEnabled: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

NotificationPreference.init(
  {
    userId: { type: DataTypes.INTEGER, primaryKey: true, allowNull: false },
    category: { type: DataTypes.ENUM(...NOTIFICATION_CATEGORIES), primaryKey: true },
    inAppEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    realtimeEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    tableName: 'notification_preferences',
    timestamps: true,
  },
);

NotificationPreference.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user',
  onDelete: 'CASCADE',
  onUpdate: 'CASCADE',
});
User.hasMany(NotificationPreference, { foreignKey: 'userId', as: 'notificationPreferences' });
