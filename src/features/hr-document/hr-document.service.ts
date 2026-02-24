import { HRDocument } from './hr-document.model';
import { HRFolder } from './hr-folder.model';
import { HRDocumentDeletionRequest } from './hr-document-deletion-request.model';
import { HRDocumentDeletionRequestRepository } from './hr-document-deletion-request.repository';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

export class HRDocumentService {
  /**
   * Create a document
   */
  static async createDocument(
    name: string,
    file_url: string,
    document_type?: string,
    folder_id?: string | null,
    access_level?: string,
    created_by?: string,
  ) {
    try {
      const document = await HRDocument.create({
        name,
        file_url,
        document_type: (document_type as 'contract' | 'policy' | 'memo' | 'performance_review' | 'other') || 'other',
        folder_id: folder_id && folder_id.trim() ? folder_id : null,
        access_level: (access_level as 'private' | 'public') || 'private',
        created_by,
      });
      return document;
    } catch (error) {
      logger.error(`Error creating document: ${error}`);
      throw error;
    }
  }

  /**
   * Get all documents with optional folder filter
   */
  static async getDocuments(folder_id?: string) {
    try {
      const where: any = {};
      if (folder_id) {
        where.folder_id = folder_id;
      }

      const documents = await HRDocument.findAll({
        where,
        order: [['created_at', 'DESC']],
      });
      return documents;
    } catch (error) {
      logger.error(`Error fetching documents: ${error}`);
      throw error;
    }
  }

  /**
   * Get documents by folder with pagination
   */
  static async getDocumentsByFolder(folder_id: string, page: number = 1, limit: number = 10) {
    try {
      const offset = (page - 1) * limit;

      const { count, rows: documents } = await HRDocument.findAndCountAll({
        where: { folder_id },
        limit,
        offset,
        order: [['created_at', 'DESC']],
      });

      return {
        documents,
        total: count,
        page,
        pages: Math.ceil(count / limit),
      };
    } catch (error) {
      logger.error(`Error fetching documents by folder: ${error}`);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  static async getDocumentById(id: string) {
    try {
      const document = await HRDocument.findByPk(id);
      if (!document) {
        throw ApiError.notFound('Document not found');
      }
      return document;
    } catch (error) {
      logger.error(`Error fetching document: ${error}`);
      throw error;
    }
  }

  /**
   * Update document
   */
  static async updateDocument(id: string, updates: any) {
    try {
      const document = await HRDocument.findByPk(id);
      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      await document.update(updates);
      return document;
    } catch (error) {
      logger.error(`Error updating document: ${error}`);
      throw error;
    }
  }

  /**
   * Request document deletion (creates pending authorization)
   */
  static async requestDocumentDeletion(id: string, requestedBy: number, requesterComment?: string) {
    try {
      const document = await HRDocument.findByPk(id);
      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      // Check if there's already a pending deletion request
      const existingRequest = await HRDocumentDeletionRequestRepository.findPendingByItemId(id);
      if (existingRequest) {
        throw ApiError.conflict('A deletion request for this document is already pending approval');
      }

      const deletionRequest = await HRDocumentDeletionRequestRepository.create({
        documentOrFolderId: id,
        deletionType: 'DOCUMENT',
        itemName: document.name,
        requestedBy,
        requesterComment,
      });

      logger.info(`[requestDocumentDeletion] Document deletion requested: ${id} by user ${requestedBy}`);
      return deletionRequest;
    } catch (error) {
      logger.error(`Error requesting document deletion: ${error}`);
      throw error;
    }
  }

  /**
   * Delete document (only after approval)
   */
  static async deleteDocument(id: string) {
    try {
      const document = await HRDocument.findByPk(id);
      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      await document.destroy();
      return { id };
    } catch (error) {
      logger.error(`Error deleting document: ${error}`);
      throw error;
    }
  }

  /**
   * Search documents by name
   */
  static async searchDocuments(search_term: string) {
    try {
      const { Op } = await import('sequelize');
      const documents = await HRDocument.findAll({
        where: {
          name: {
            [Op.like]: `%${search_term}%`,
          },
        },
        order: [['created_at', 'DESC']],
      });
      return documents;
    } catch (error) {
      logger.error(`Error searching documents: ${error}`);
      throw error;
    }
  }

  /**
   * Get documents by type
   */
  static async getDocumentsByType(document_type: string) {
    try {
      const documents = await HRDocument.findAll({
        where: { document_type },
        order: [['created_at', 'DESC']],
      });
      return documents;
    } catch (error) {
      logger.error(`Error fetching documents by type: ${error}`);
      throw error;
    }
  }
}
