import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { HRDocumentService } from './hr-document.service';
import { HRFolderService } from './hr-folder.service';
import { HRDocumentDeletionRequestRepository } from './hr-document-deletion-request.repository';
import { HRFolder } from './hr-folder.model';
import { Onboarding } from '../onboarding/onboarding.model';

const DEFAULT_FOLDERS = [
  'Employee Contracts',
  'Company Policies',
  'Performance Reviews',
  'Onboarding Documents',
  'Memos & Announcements',
  'Templates',
];

export class HRDocumentController {
  // ============ INITIALIZATION ============

  static async initializeDefaultFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const userRole = req.user?.role;
      logger.info(`[initializeDefaultFolders] Called by user with role: ${userRole}`);

      // Check if folders already exist
      const existingFolders = await HRFolderService.getFolders();
      if (existingFolders && existingFolders.length > 0) {
        logger.info(`[initializeDefaultFolders] Folders already exist (${existingFolders.length})`);
        return res.json(
          ApiResponse({
            data: existingFolders,
            message: 'Default folders already exist',
          }),
        );
      }

      // Create default folders
      const createdFolders: HRFolder[] = [];
      for (const folderName of DEFAULT_FOLDERS) {
        const folder = await HRFolderService.createFolder(folderName);
        createdFolders.push(folder);
      }

      logger.info(`[initializeDefaultFolders] Created ${createdFolders.length} default folders`);

      res.status(201).json(
        ApiResponse({
          data: createdFolders,
          message: `${createdFolders.length} default folders created successfully`,
        }),
      );
    } catch (error) {
      logger.error(`Error initializing default folders: ${error}`);
      next(error);
    }
  }

  // ============ DOCUMENTS ============

  static async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, document_type, folder_id, access_level } = req.body;
      const files = (req as any).files || [];

      // Check if file was uploaded or file_url provided
      let file_url = req.body.file_url;

      if (!name) {
        throw ApiError.badRequest('Document name is required');
      }

      // If file is uploaded, save to disk
      if (files.length > 0) {
        const file = files[0];
        // Generate unique filename
        const timestamp = Date.now();
        const fileName = `doc_${timestamp}_${file.originalname}`;
        const uploadDir = 'public/documents';

        // Ensure directory exists
        const fs = await import('fs');
        if (!fs.existsSync(uploadDir)) {
          fs.mkdirSync(uploadDir, { recursive: true });
        }

        // Write file to disk
        const filePath = `${uploadDir}/${fileName}`;
        fs.writeFileSync(filePath, file.buffer);

        // Store relative URL
        file_url = `/documents/${fileName}`;
      } else if (!file_url) {
        throw ApiError.badRequest('Either file upload or file_url is required');
      }

      // Validate that folder exists if folder_id is provided
      if (folder_id) {
        const folder = await HRFolderService.getFolderById(folder_id);
        if (!folder) {
          throw ApiError.badRequest('Specified folder does not exist');
        }
      }

      const document = await HRDocumentService.createDocument(
        name,
        file_url,
        document_type,
        folder_id,
        access_level,
        String(req.user?.id),
      );

      res.status(201).json(
        ApiResponse({
          data: document,
          message: 'Document created successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error creating document: ${error}`);
      next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      logger.info(`[getDocuments] Request received. User: ${req.user?.id}, Role: ${req.user?.role}`);

      const { folder_id, search, document_type } = req.query;
      const userPermissions = req.user?.permissions || [];
      const hasManageDocsPermission = userPermissions.includes('MANAGE_DOCUMENTS');

      // Get HR documents
      let hrDocuments: any;

      if (search) {
        hrDocuments = await HRDocumentService.searchDocuments(String(search));
      } else if (document_type) {
        hrDocuments = await HRDocumentService.getDocumentsByType(String(document_type));
      } else if (folder_id) {
        hrDocuments = await HRDocumentService.getDocuments(String(folder_id));
      } else {
        hrDocuments = await HRDocumentService.getDocuments();
      }

      // Filter documents based on user permissions
      // HR (MANAGE_DOCUMENTS) can see all documents
      // Employees can only see public documents
      if (!hasManageDocsPermission) {
        hrDocuments = (hrDocuments || []).filter((doc: any) => doc.access_level === 'public');
      }

      // Get Onboarding Documents folder
      const onboardingFolder = await HRFolder.findOne({
        where: { name: 'Onboarding Documents' } as any,
      });
      // Only use it if it has no parent (is a root folder)
      const onboardingFolderId =
        onboardingFolder?.parent_folder_id === null || onboardingFolder?.parent_folder_id === undefined
          ? onboardingFolder?.id
          : null;

      // Get onboarding documents (which are "public" company documents)
      const onboardingDocuments = await Onboarding.findAll({
        where: { status: 'submitted' },
        attributes: ['id', 'documentType', 'documentName', 'documentUrl', 'submittedAt'],
        limit: 100,
        order: [['submittedAt', 'DESC']],
      });

      // Transform onboarding documents to match HR document format
      const transformedOnboardingDocs = onboardingDocuments.map((doc: any) => ({
        id: `onboarding_${doc.id}`,
        name: doc.documentName,
        document_type: doc.documentType.toLowerCase().replace(/\s+/g, '_'),
        file_url: doc.documentUrl,
        folder_id: onboardingFolderId || null,
        access_level: 'public',
        created_at: doc.submittedAt,
        source: 'onboarding',
      }));

      // Combine both sources
      const allDocuments = [...(hrDocuments || []), ...transformedOnboardingDocs];

      logger.info(
        `[getDocuments] Returning ${allDocuments?.length || 0} documents (${hrDocuments?.length || 0} HR + ${transformedOnboardingDocs?.length || 0} onboarding). User has MANAGE_DOCUMENTS permission: ${hasManageDocsPermission}`,
      );

      res.json(
        ApiResponse({
          data: allDocuments || [],
          message: 'Documents fetched successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error fetching documents: ${error}`);
      next(error);
    }
  }

  static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await HRDocumentService.getDocumentById(id);
      const userPermissions = req.user?.permissions || [];
      const hasManageDocsPermission = userPermissions.includes('MANAGE_DOCUMENTS');

      // Check access: HR can see all, employees can only see public
      if (!hasManageDocsPermission && document && document.access_level !== 'public') {
        throw ApiError.forbidden('You do not have permission to access this document');
      }

      res.json(ApiResponse({ data: document, message: 'Document fetched successfully' }));
    } catch (error) {
      logger.error(`Error fetching document: ${error}`);
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const document = await HRDocumentService.updateDocument(id, updates);

      res.json(
        ApiResponse({
          data: document,
          message: 'Document updated successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error updating document: ${error}`);
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { requesterComment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthenticated('User ID is required');
      }

      // Create pending deletion request
      const deletionRequest = await HRDocumentService.requestDocumentDeletion(id, userId, requesterComment);

      res.json(
        ApiResponse({
          data: deletionRequest,
          message: 'Document deletion request submitted for HR manager approval',
        }),
      );
    } catch (error) {
      logger.error(`Error requesting document deletion: ${error}`);
      next(error);
    }
  }

  // ============ FOLDERS ============

  static async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, parent_folder_id } = req.body;

      if (!name) {
        throw ApiError.badRequest('Folder name is required');
      }

      const folder = await HRFolderService.createFolder(name, parent_folder_id);

      res.status(201).json(
        ApiResponse({
          data: folder,
          message: 'Folder created successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error creating folder: ${error}`);
      next(error);
    }
  }

  static async getFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const userJobRole = req.user?.jobRoleId;
      const userPermissions = req.user?.permissions || [];
      const hasManageDocsPermission = userPermissions.includes('MANAGE_DOCUMENTS');
      logger.info(`[getFolders] User jobRoleId: ${userJobRole}, hasManageDocsPermission: ${hasManageDocsPermission}`);

      const { hierarchy, parent_id } = req.query;

      let folders: any;

      if (hierarchy === 'true') {
        // Get full hierarchy
        folders = await HRFolderService.getFolderHierarchy(parent_id ? String(parent_id) : undefined);
      } else if (parent_id) {
        // Get subfolders of a specific folder
        folders = await HRFolderService.getSubfolders(String(parent_id));
      } else {
        // Get only root folders (no parent)
        folders = await HRFolderService.getRootFolders();

        // Auto-initialize if no folders exist
        if (!folders || folders.length === 0) {
          logger.info('[getFolders] No folders found. Auto-initializing default folders...');
          for (const folderName of DEFAULT_FOLDERS) {
            await HRFolderService.createFolder(folderName);
          }
          folders = await HRFolderService.getRootFolders();
        }
      }

      // Filter folders for non-HR users: only show folders with public documents
      if (!hasManageDocsPermission && folders) {
        const allDocuments = await HRDocumentService.getDocuments();
        const publicDocumentFolderIds = new Set(
          (allDocuments || [])
            .filter((doc: any) => doc.access_level === 'public')
            .map((doc: any) => doc.folder_id)
            .filter(Boolean),
        );

        // Keep folders that have public documents or are empty (to show folder structure)
        folders = folders.filter((folder: any) => publicDocumentFolderIds.has(folder.id) || !folder.parent_folder_id);
      }

      logger.info(`[getFolders] Returning ${folders?.length || 0} folders`);

      res.json(
        ApiResponse({
          data: folders,
          message: 'Folders fetched successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error fetching folders: ${error}`);
      next(error);
    }
  }

  static async getFolderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const folder = await HRFolderService.getFolderById(id);

      res.json(ApiResponse({ data: folder, message: 'Folder fetched successfully' }));
    } catch (error) {
      logger.error(`Error fetching folder: ${error}`);
      next(error);
    }
  }

  static async updateFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const folder = await HRFolderService.updateFolder(id, updates);

      res.json(
        ApiResponse({
          data: folder,
          message: 'Folder updated successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error updating folder: ${error}`);
      next(error);
    }
  }

  static async deleteFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { requesterComment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthenticated('User ID is required');
      }

      // Create pending deletion request
      const deletionRequest = await HRFolderService.requestFolderDeletion(id, userId, requesterComment);

      res.json(
        ApiResponse({
          data: deletionRequest,
          message: 'Folder deletion request submitted for HR manager approval',
        }),
      );
    } catch (error) {
      logger.error(`Error requesting folder deletion: ${error}`);
      next(error);
    }
  }

  // ============ DELETION REQUESTS ============

  static async getPendingDeletions(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, rows = 25 } = req.query;
      const { deletions, count } = await HRDocumentDeletionRequestRepository.getPendingDeletions(Number(page), Number(rows));

      res.json(
        ApiResponse({
          data: deletions,
          pagination: {
            total: count,
            page: Number(page),
            rows: Number(rows),
            pages: Math.ceil(count / Number(rows)),
          },
          message: 'Pending deletion requests fetched successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error fetching pending deletions: ${error}`);
      next(error);
    }
  }

  static async approveDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewerComment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthenticated('User ID is required');
      }

      // Approve the deletion request
      const approved = await HRDocumentDeletionRequestRepository.approve(Number(id), userId, reviewerComment);

      if (!approved) {
        throw ApiError.notFound('Deletion request not found');
      }

      // Now delete the actual document or folder
      if (approved.deletionType === 'DOCUMENT') {
        await HRDocumentService.deleteDocument(approved.documentOrFolderId);
      } else if (approved.deletionType === 'FOLDER') {
        await HRFolderService.deleteFolder(approved.documentOrFolderId);
      }

      logger.info(
        `[approveDeletion] ${approved.deletionType} (ID: ${approved.documentOrFolderId}) deletion approved by user ${userId}. Comment: ${reviewerComment || 'N/A'}`,
      );

      res.json(
        ApiResponse({
          data: approved,
          message: `${approved.deletionType.toLowerCase()} deletion approved and deleted successfully`,
        }),
      );
    } catch (error) {
      logger.error(`Error approving deletion: ${error}`);
      next(error);
    }
  }

  static async rejectDeletion(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { reviewerComment } = req.body;
      const userId = req.user?.id;

      if (!userId) {
        throw ApiError.unauthenticated('User ID is required');
      }

      // Validate that rejection reason is provided
      if (!reviewerComment || reviewerComment.trim() === '') {
        throw ApiError.badRequest('Rejection reason is required');
      }

      // Reject the deletion request
      const rejected = await HRDocumentDeletionRequestRepository.reject(Number(id), userId, reviewerComment);

      if (!rejected) {
        throw ApiError.notFound('Deletion request not found');
      }

      logger.info(`[rejectDeletion] ${rejected.deletionType} deletion rejected by user ${userId}. Reason: ${reviewerComment}`);

      res.json(
        ApiResponse({
          data: rejected,
          message: `${rejected.deletionType.toLowerCase()} deletion request rejected`,
        }),
      );
    } catch (error) {
      logger.error(`Error rejecting deletion: ${error}`);
      next(error);
    }
  }
}
