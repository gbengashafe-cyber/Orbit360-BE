import { NotificationService } from '../notifications/notification.service';
import { HRDocumentDeletionRequest } from './hr-document-deletion-request.model';

export class HRDocumentDeletionRequestRepository {
  static async create(data: {
    documentOrFolderId: string;
    deletionType: 'DOCUMENT' | 'FOLDER';
    itemName: string;
    requestedBy: number;
    requesterComment?: string;
  }) {
    const request = await HRDocumentDeletionRequest.create(data);
    await NotificationService.notify('DOCUMENTS_AUTHORIZATION', { recordId: request.id, userId: request.requestedBy });
    return request;
  }

  static async findById(id: number) {
    return HRDocumentDeletionRequest.findByPk(id);
  }

  static async findPendingByItemId(documentOrFolderId: string) {
    return HRDocumentDeletionRequest.findOne({
      where: {
        documentOrFolderId,
        status: 'PENDING_APPROVAL',
      },
    });
  }

  static async getPendingDeletions(page = 1, rows = 25) {
    const offset = (page - 1) * rows;
    const { rows: deletions, count } = await HRDocumentDeletionRequest.findAndCountAll({
      where: { status: 'PENDING_APPROVAL' },
      include: [
        {
          association: 'requester',
          attributes: ['id', 'firstName', 'lastName', 'email'],
        },
      ],
      order: [['createdAt', 'DESC']],
      limit: rows,
      offset,
    });

    return { deletions, count, page, rows };
  }

  static async approve(id: number, reviewedBy: number, reviewerComment?: string) {
    const deletion = await HRDocumentDeletionRequest.findByPk(id);
    if (!deletion) {
      return null;
    }

    const changes = {
      status: 'APPROVED',
      reviewedBy,
      reviewerComment,
      reviewedDate: new Date(),
    } as const;
    const [updated] = await HRDocumentDeletionRequest.update(changes, { where: { id, status: 'PENDING_APPROVAL' } });
    if (!updated) return null;
    deletion.set(changes);

    return deletion;
  }

  static async reject(id: number, reviewedBy: number, reviewerComment?: string) {
    const deletion = await HRDocumentDeletionRequest.findByPk(id);
    if (!deletion) {
      return null;
    }

    const changes = {
      status: 'REJECTED',
      reviewedBy,
      reviewerComment,
      reviewedDate: new Date(),
    } as const;
    const [updated] = await HRDocumentDeletionRequest.update(changes, { where: { id, status: 'PENDING_APPROVAL' } });
    if (!updated) return null;
    deletion.set(changes);

    return deletion;
  }

  static async delete(id: number) {
    return HRDocumentDeletionRequest.destroy({
      where: { id },
    });
  }
}

export default HRDocumentDeletionRequestRepository;
