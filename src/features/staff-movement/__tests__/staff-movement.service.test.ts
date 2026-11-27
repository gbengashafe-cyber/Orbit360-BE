import { strict as assert } from 'node:assert';
import { after, test } from 'node:test';
import { randomUUID } from 'node:crypto';
import { Transaction } from 'sequelize';
import { db } from '../../../db';
import { Company } from '../../company/company.model';
import { Department } from '../../department/department.model';
import { User } from '../../users/user.model';
import { JobRole } from '../../job-role/job-role.model';
import { Employee } from '../../employee/employee.model';
import { JobRolePermissions } from '../../permissions/permission.model';
import { StaffMovementService } from '../staff-movement.service';
import { approverRoles, principalFor, requireStageActor } from '../staff-movement.authority';
import {
  MovementAssignmentSnapshot,
  MovementHodAssignment,
  MovementApprovalStage,
  MovementAudit,
  MovementCategory,
  MovementRequest,
  MovementWorkflowVersion,
} from '../staff-movement.models';
import { transitionMovement } from '../staff-movement.transitions';
import { REQUIRED_APPROVAL_STAGES } from '../staff-movement.foundation';

after(() => db.close());

test('scoped configuration, delegated authority, audited transitions and immutable published history', async (t) => {
  const transaction = await db.transaction();
  const options = { transaction };
  const nested = db.transaction.bind(db);
  // Exercise each real service transaction as a savepoint and roll back the entire fixture.
  t.mock.method(db, 'transaction', (action: (tx: Transaction) => Promise<unknown>) => nested(options, action));
  try {
    const tag = randomUUID().slice(0, 8);
    const company = await Company.create({ name: 'Movement test ' + tag }, options);
    const department = await Department.create({ companyId: company.id, name: 'Test' }, options);
    const other = await Department.create({ companyId: company.id, name: 'Other' }, options);
    const reviewerRole = await JobRole.create({ title: 'Test role', departmentId: department.id }, options);
    const managerRole = await JobRole.create({ title: 'Config role', departmentId: department.id }, options);
    const actor = async (index: number, jobRoleId: number) => {
      const email = tag + index + '@example.invalid';
      const user = await User.create(
        {
          firstName: 'Test',
          lastName: 'Fixture',
          email,
          password: 'fixture',
          status: 'ACTIVE',
          jobRoleId,
          departmentId: department.id,
        },
        options,
      );
      const employee = await Employee.create(
        {
          companyId: company.id,
          departmentId: department.id,
          jobRoleId,
          staffId: tag + index,
          firstName: 'Test',
          lastName: 'Fixture',
          email,
          createdBy: user.id,
          dob: new Date('1990-01-01'),
          hireDate: new Date('2020-01-01'),
          phone: '000',
          gender: 'F',
          nationality: 'Test',
          address: 'Fixture',
          annualHousingAllowance: 0,
          annualTransportAllowance: 0,
          annualLeaveAllowance: 0,
          annualOtherAllowances: 0,
          bankName: 'Test',
          bankCode: '000',
          accountName: 'Fixture',
          accountNumber: '000',
          nokName: 'Fixture',
          nokAddress: 'Fixture',
          nokRelationship: 'Other',
          nokPhone: '000',
          beneficiaryName: 'Fixture',
          beneficiaryRelationship: 'Other',
          beneficiaryPhone: '000',
          leaveEntitlement: 0,
          annualRentAmount: 0,
          annualBasicSalary: 0,
          nhfApplicable: false,
          status: 'ACTIVE',
        },
        options,
      );
      return { user, employee };
    };
    const manager = await actor(1, managerRole.id);
    const principal = await actor(2, reviewerRole.id);
    const delegate = await actor(3, reviewerRole.id);
    const configure = <T>(action: (s: StaffMovementService) => Promise<T>) =>
      StaffMovementService.configure(manager.user.id, action);
    await assert.rejects(
      configure((s) => s.list('workflows')),
      /permission/,
    );
    await JobRolePermissions.create({ jobRoleId: managerRole.id, permission: 'MANAGE_STAFF_MOVEMENT_CONFIGURATION' }, options);
    for (const permission of ['REVIEW_STAFF_MOVEMENT', 'APPROVE_STAFF_MOVEMENT'])
      await JobRolePermissions.create({ jobRoleId: reviewerRole.id, permission }, options);
    await assert.rejects(
      configure((s) => s.createMasterData('branch', { companyId: company.id + 1, name: 'Outside', code: 'X' })),
    );
    const categoryId = Number((await MovementCategory.findOne(options))!.get('id'));
    const wid = Number((await configure((s) => s.createWorkflow(categoryId, 'Test'))).get('id'));
    const stages = REQUIRED_APPROVAL_STAGES.map((stageCode) => ({
      stageCode,
      authority: stageCode.startsWith('HR_') ? 'HR_OFFICER' : stageCode,
      mandatory: true,
      scope: stageCode.endsWith('HOD') ? 'DEPARTMENT' : 'ORGANIZATION',
      settings: {},
    }));
    const vid = Number((await configure((s) => s.createVersion(wid, stages, { generation: 1 }))).get('id'));
    await configure((s) => s.activateVersion(wid, vid));
    const request = await MovementRequest.create(
      {
        employeeId: manager.employee.id,
        initiatedBy: manager.user.id,
        categoryId,
        workflowVersionId: vid,
        revision: 1,
        status: 'DRAFT',
        effectiveDate: '2030-01-01',
      },
      options,
    );
    const second = await configure((s) => s.createVersion(wid, stages, { generation: 2 }));
    await configure((s) => s.activateVersion(wid, Number(second.get('id'))));
    const historical = await MovementWorkflowVersion.findByPk(
      Number((await request.reload(options)).get('workflowVersionId')),
      options,
    );
    assert.deepEqual(historical?.get('settings'), { generation: 1 });
    assert.equal(historical?.get('status'), 'RETIRED');
    await assert.rejects(historical!.update({ settings: {} }, options));
    await assert.rejects(historical!.destroy(options));
    const stage = await MovementApprovalStage.findOne({ where: { versionId: vid }, ...options });
    await assert.rejects(stage!.update({ mandatory: false }, options));
    await assert.rejects(stage!.destroy(options));
    await assert.rejects(
      MovementApprovalStage.create({ ...stages[0], stageCode: 'EXTRA', stageOrder: 9, versionId: vid }, options),
    );
    await assert.rejects(request.update({ workflowVersionId: second.get('id') }, options));
    await assert.rejects(MovementRequest.update({ status: 'APPROVED' }, { where: { id: request.get('id') }, ...options }));
    const requestId = Number(request.get('id'));
    await assert.rejects(transitionMovement(requestId, 1, 'APPROVED', manager.user.id), /Invalid/);
    await assert.rejects(transitionMovement(requestId, 1, 'WITHDRAWN', delegate.user.id), /maker/);
    const failAudit = t.mock.method(MovementAudit, 'create', async () => {
      throw Error('Injected audit failure');
    });
    await assert.rejects(transitionMovement(requestId, 1, 'WITHDRAWN', manager.user.id), /Injected/);
    await assert.rejects(
      configure((s) => s.createWorkflow(categoryId, 'Must roll back')),
      /Injected/,
    );
    const slot = async () =>
      (
        await db.query('SELECT status, revision, active_slot FROM sm_requests WHERE id=:requestId', {
          replacements: { requestId },
          transaction,
        })
      )[0][0];
    assert.deepEqual(await slot(), { status: 'DRAFT', revision: 1, active_slot: 1 });
    failAudit.mock.restore();
    assert.equal(
      (await configure((s) => s.list('workflows'))).some((w) => w.get('name') === 'Must roll back'),
      false,
    );
    assert.deepEqual(await transitionMovement(requestId, 1, 'WITHDRAWN', manager.user.id), { status: 'WITHDRAWN', revision: 2 });
    assert.deepEqual(await slot(), { status: 'WITHDRAWN', revision: 2, active_slot: null });
    await assert.rejects(transitionMovement(requestId, 1, 'WITHDRAWN', manager.user.id), /Stale/);
    assert.deepEqual(await configure((s) => s.validateHeadcount(-1, department.id, '2026-12-01')), {
      validation: 'MANUAL_REQUIRED',
    });

    const dates = { startsOn: '2020-01-01', endsOn: '2099-12-31' };
    const hod = { ...dates, employeeId: principal.employee.id, departmentId: department.id, acting: false };
    await assert.rejects(
      configure((s) => s.assignHod({ ...hod, startsOn: '2026-02-30' })),
      /dates/,
    );
    await configure((s) => s.assignHod(hod));
    await assert.rejects(
      configure((s) => s.assignHod(hod)),
      /Overlapping/,
    );
    for (const role of ['CURRENT_HOD', 'RECEIVING_HOD', ...approverRoles]) {
      const isHod = role.endsWith('HOD');
      const assignment = { ...dates, userId: principal.user.id, authority: role };
      const args = {
        actorId: delegate.user.id,
        makerId: manager.user.id,
        subjectId: manager.employee.id,
        department,
        role,
        stageScope: isHod ? 'DEPARTMENT' : 'ORGANIZATION',
      };
      if (!isHod) await configure((s) => s.assignApprover(assignment));
      const grant = {
        ...dates,
        principalUserId: principal.user.id,
        delegateUserId: delegate.user.id,
        departmentId: department.id,
        scope: role,
      };
      await assert.rejects(
        configure((s) => s.createDelegation({ ...grant, delegateUserId: principal.user.id })),
        /Independent/,
      );
      await assert.rejects(
        configure((s) => s.createDelegation({ ...grant, endsOn: '2100-01-01' })),
        /principal/,
      );
      const delegation = await configure((s) => s.createDelegation(grant));
      await requireStageActor(args, transaction);
      if (role === 'CURRENT_HOD') {
        // Seed a historical pending record directly, without implementing submission.
        await db.query("UPDATE sm_requests SET status='PENDING_CURRENT_HOD', revision=3 WHERE id=:requestId", {
          replacements: { requestId },
          transaction,
        });
        await MovementAssignmentSnapshot.create(
          { requestId, kind: 'CURRENT', assignment: { departmentId: department.id } },
          options,
        );
        await assert.rejects(transitionMovement(requestId, 3, 'RETURNED', manager.user.id), /authority/);
        assert.deepEqual(await transitionMovement(requestId, 3, 'RETURNED', delegate.user.id), {
          status: 'RETURNED',
          revision: 4,
        });
      }
      await assert.rejects(requireStageActor({ ...args, department: other }, transaction));
      await assert.rejects(requireStageActor({ ...args, makerId: principal.user.id }, transaction));
      await assert.rejects(requireStageActor({ ...args, makerId: delegate.user.id }, transaction));
      await delegate.employee.update({ status: 'SUSPENDED' }, options);
      await assert.rejects(requireStageActor(args, transaction));
      await delegate.employee.update({ status: 'ACTIVE' }, options);
      assert.equal(await principalFor(department, role, '2100-01-01', '2100-01-01', transaction), null);
      await configure((s) => s.revokeDelegation(Number(delegation.get('id'))));
      await assert.rejects(requireStageActor(args, transaction));
      if (!isHod) {
        const replacement = await configure((s) => s.createDelegation(grant));
        const assignments = await configure((s) => s.list('approverAssignments'));
        const original = assignments.find((a) => a.get('authority') === role)!;
        await configure((s) => s.revokeApprover(Number(original.get('id'))));
        await configure((s) => s.assignApprover(assignment));
        await assert.rejects(requireStageActor(args, transaction));
        await configure((s) => s.revokeDelegation(Number(replacement.get('id'))));
      }
    }
    const audit = await MovementAudit.findOne({ where: { actorUserId: manager.user.id, action: 'TRANSITION' }, ...options });
    assert.deepEqual(audit?.get('changes'), { from: 'DRAFT', to: 'WITHDRAWN', revision: 2 });
    await assert.rejects(audit!.update({ action: 'ALTER' }, options));
    await assert.rejects(MovementAudit.destroy({ where: { id: audit!.get('id') }, ...options }));
  } finally {
    await transaction.rollback();
  }
});

test('HOD resolution rejects ambiguous persisted assignments', async (t) => {
  const department = Department.build({ id: 1, name: 'Test', companyId: 1 });
  const assignment = MovementHodAssignment.build({ id: 1, employeeId: 7 });
  t.mock.method(MovementHodAssignment, 'findAll', async () => [assignment, assignment]);
  await db.transaction(async (transaction) => {
    assert.equal(await principalFor(department, 'CURRENT_HOD', '2026-12-01', '2026-12-01', transaction), null);
  });
});

test('HOD resolution rejects an employee without a linked account', async (t) => {
  const department = Department.build({ id: 1, name: 'Test', companyId: 1 });
  t.mock.method(MovementHodAssignment, 'findAll', async () => [MovementHodAssignment.build({ employeeId: 7 })]);
  const employee = Employee.build();
  employee.set({ id: 7, departmentId: 1, email: 'missing@example.invalid' });
  t.mock.method(Employee, 'findByPk', async () => employee);
  t.mock.method(User, 'findAll', async () => []);
  await db.transaction(async (transaction) => {
    assert.equal(await principalFor(department, 'RECEIVING_HOD', '2026-12-01', '2026-12-01', transaction), null);
  });
});
