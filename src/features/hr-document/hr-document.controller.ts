import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { ApiResponse } from '../../utils/api-response';
import { logger } from '../../utils/logger';
import { HRDocumentService } from './hr-document.service';
import { HRFolderService } from './hr-folder.service';
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
      const { name, file_url, document_type, folder_id, access_level } = req.body;

      if (!name || !file_url) {
        throw ApiError.badRequest('Document name and file_url are required');
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
        access_level: 'public',
        created_at: doc.submittedAt,
        source: 'onboarding',
      }));

      // Combine both sources
      const allDocuments = [...(hrDocuments || []), ...transformedOnboardingDocs];

      logger.info(
        `[getDocuments] Returning ${allDocuments?.length || 0} documents (${hrDocuments?.length || 0} HR + ${transformedOnboardingDocs?.length || 0} onboarding)`,
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
      const result = await HRDocumentService.deleteDocument(id);

      res.json(
        ApiResponse({
          data: result,
          message: 'Document deleted successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error deleting document: ${error}`);
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
      const userJobRole = req.user?.jobRole;
      logger.info(`[getFolders] User jobRole: ${userJobRole}`);

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
      const result = await HRFolderService.deleteFolder(id);

      res.json(
        ApiResponse({
          data: result,
          message: 'Folder deleted successfully',
        }),
      );
    } catch (error) {
      logger.error(`Error deleting folder: ${error}`);
      next(error);
    }
  }
}
