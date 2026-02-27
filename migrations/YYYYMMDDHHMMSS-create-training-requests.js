'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('TrainingRequests', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
      },
      requesterId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Employees',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      supervisorId: {
        type: Sequelize.INTEGER,
        references: {
          model: 'Employees',
          key: 'id',
        },
      },
      trainingType: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trainingTitle: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      trainingDescription: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      priority: {
        type: Sequelize.ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'),
        defaultValue: 'MEDIUM',
      },
      businessJustification: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      skillsToGain: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      deliveryMethod: {
        type: Sequelize.ENUM('ONLINE', 'IN_PERSON', 'HYBRID', 'SELF_PACED'),
        allowNull: false,
      },
      preferredTimeframe: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      estimatedDuration: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      estimatedCost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: false,
      },
      trainingProvider: {
        type: Sequelize.STRING,
        allowNull: false,
      },
      requestScope: {
        type: Sequelize.ENUM('SELF', 'TEAM'),
        defaultValue: 'SELF',
      },
      numberOfTeamMembers: {
        type: Sequelize.INTEGER,
      },
      teamMemberIds: {
        type: Sequelize.JSON,
      },
      status: {
        type: Sequelize.ENUM(
          'PENDING',
          'SUPERVISOR_APPROVED',
          'SUPERVISOR_REJECTED',
          'HR_REVIEWING',
          'HR_APPROVED',
          'HR_REJECTED',
          'FINAL_APPROVED',
          'FINAL_REJECTED',
        ),
        defaultValue: 'PENDING',
        index: true,
      },
      supervisorApprovedAt: {
        type: Sequelize.DATE,
      },
      supervisorApprovedBy: {
        type: Sequelize.INTEGER,
      },
      supervisorRejectionReason: {
        type: Sequelize.TEXT,
      },
      hrApprovedAt: {
        type: Sequelize.DATE,
      },
      hrApprovedBy: {
        type: Sequelize.INTEGER,
      },
      hrRejectionReason: {
        type: Sequelize.TEXT,
      },
      finalApprovedAt: {
        type: Sequelize.DATE,
      },
      finalApprovedBy: {
        type: Sequelize.INTEGER,
      },
      finalRejectionReason: {
        type: Sequelize.TEXT,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('now'),
      },
    });

    // Add indexes for performance
    await queryInterface.addIndex('TrainingRequests', ['requesterId']);
    await queryInterface.addIndex('TrainingRequests', ['supervisorId']);
    await queryInterface.addIndex('TrainingRequests', ['status']);
    await queryInterface.addIndex('TrainingRequests', ['createdAt']);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TrainingRequests');
  },
};
