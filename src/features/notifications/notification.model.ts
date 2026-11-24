import {
  CreationOptional,
  DataTypes,
  ForeignKey,
  InferAttributes,
  InferCreationAttributes,
  Model,
  NonAttribute,
} from 'sequelize';
import { db } from '../../db';
import { User } from '../users/user.model';

export const NOTIFICATION_CATEGORIES = ['LEAVE', 'LOAN', 'TRAINING', 'RELIEVER', 'COMPLAINT', 'GENERAL'] as const;
export type NotificationCategory = (typeof NOTIFICATION_CATEGORIES)[number];

/**
 * Who a notification is for, relative to the originating record.
 * Stored as VARCHAR so later phases can add values without a migration.
 * - REQUESTER:   the employee who submitted the request (Phase 2+)
 * - RELIEVER:    the employee assigned to cover someone's leave (Phase 2+)
 * - DIRECT:      explicitly listed user accounts (general notifications)
 * - ACTOR_QUEUE: approvers who must act (supervisor / HR). Deferred until the Employee Hub is signed off (D4).
 * - BROADCAST:   every active user (announcements). Deferred.
 */
export const NOTIFICATION_AUDIENCES = ['REQUESTER', 'RELIEVER', 'DIRECT', 'ACTOR_QUEUE', 'BROADCAST'] as const;
export type NotificationAudience = (typeof NOTIFICATION_AUDIENCES)[number];

export const NOTIFICATION_ENTITY_TYPES = ['leave', 'loan', 'training_request', 'complaint'] as const;
export type NotificationEntityType = (typeof NOTIFICATION_ENTITY_TYPES)[number];

export class Notification extends Model<InferAttributes<Notification>, InferCreationAttributes<Notification>> {
  declare id: CreationOptional<number>;
  declare recipientUserId: ForeignKey<User['id']>;
  declare category: NotificationCategory;
  declare eventType: string;
  declare audience: NotificationAudience;
  declare title: string;
  declare message: string;
  declare entityType: CreationOptional<string | null>;
  declare entityId: CreationOptional<string | null>;
  declare actorUserId: CreationOptional<ForeignKey<User['id']> | null>;
  declare metadata: CreationOptional<Record<string, unknown> | null>;
  declare dedupeKey: string;
  declare readAt: CreationOptional<Date | null>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;

  declare recipient?: NonAttribute<User>;
  declare actor?: NonAttribute<User>;
}

Notification.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    recipientUserId: { type: DataTypes.INTEGER, allowNull: false },
    category: { type: DataTypes.ENUM(...NOTIFICATION_CATEGORIES), allowNull: false },
    eventType: { type: DataTypes.STRING(64), allowNull: false, validate: { notEmpty: true } },
    audience: {
      type: DataTypes.STRING(32),
      allowNull: false,
      validate: { isIn: [NOTIFICATION_AUDIENCES as unknown as string[]] },
    },
    title: { type: DataTypes.STRING(150), allowNull: false, validate: { notEmpty: true } },
    message: { type: DataTypes.TEXT, allowNull: false, validate: { notEmpty: true } },
    entityType: { type: DataTypes.STRING(40), allowNull: true },
    entityId: { type: DataTypes.STRING(40), allowNull: true },
    actorUserId: { type: DataTypes.INTEGER, allowNull: true },
    metadata: { type: DataTypes.JSON, allowNull: true },
    dedupeKey: { type: DataTypes.STRING(191), allowNull: false, validate: { notEmpty: true } },
    readAt: { type: DataTypes.DATE, allowNull: true },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  {
    sequelize: db,
    modelName: 'Notification',
    tableName: 'notifications',
    timestamps: true,
    // Mirrors migrations/20261124120000-create-notifications.cjs (the migration is the source of truth).
    indexes: [
      { name: 'notifications_recipient_dedupe_unique', unique: true, fields: ['recipient_user_id', 'dedupe_key'] },
      { name: 'notifications_recipient_read_idx', fields: ['recipient_user_id', 'read_at'] },
      { name: 'notifications_recipient_feed_idx', fields: ['recipient_user_id', 'created_at', 'id'] },
      { name: 'notifications_recipient_category_feed_idx', fields: ['recipient_user_id', 'category', 'created_at', 'id'] },
    ],
  },
);

Notification.belongsTo(User, { foreignKey: 'recipientUserId', as: 'recipient', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Notification.belongsTo(User, { foreignKey: 'actorUserId', as: 'actor', onDelete: 'SET NULL', onUpdate: 'CASCADE' });
