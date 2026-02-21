import { NextFunction, Request, Response } from 'express';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';
import { HRDocument } from './hr-document.model';
import { HRFolder } from './hr-folder.model';

export class HRDocumentController {
  // Documents
  static async createDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, file_url, document_type, folder_id, access_level } = req.body;

      const document = await HRDocument.create({
        name,
        file_url,
        document_type: document_type || 'other',
        folder_id,
        access_level: access_level || 'private',
        created_by: String(req.user?.id),
      });

      res.status(201).json({
        data: document,
        message: 'Document created successfully',
      });
    } catch (error) {
      logger.error(`Error creating document: ${error}`);
      next(error);
    }
  }

  static async getDocuments(req: Request, res: Response, next: NextFunction) {
    try {
      const documents = await HRDocument.findAll({
        order: [['created_at', 'DESC']],
      });

      res.json({
        data: documents,
      });
    } catch (error) {
      logger.error(`Error fetching documents: ${error}`);
      next(error);
    }
  }

  static async getDocumentById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await HRDocument.findByPk(id);

      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      res.json({ data: document });
    } catch (error) {
      logger.error(`Error fetching document: ${error}`);
      next(error);
    }
  }

  static async updateDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const document = await HRDocument.findByPk(id);
      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      await document.update(updates);
      res.json({
        data: document,
        message: 'Document updated successfully',
      });
    } catch (error) {
      logger.error(`Error updating document: ${error}`);
      next(error);
    }
  }

  static async deleteDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const document = await HRDocument.findByPk(id);

      if (!document) {
        throw ApiError.notFound('Document not found');
      }

      await document.destroy();
      res.json({
        data: { id },
        message: 'Document deleted successfully',
      });
    } catch (error) {
      logger.error(`Error deleting document: ${error}`);
      next(error);
    }
  }

  // Folders
  static async createFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, parent_folder_id } = req.body;

      const folder = await HRFolder.create({
        name,
        parent_folder_id,
      });

      res.status(201).json({
        data: folder,
        message: 'Folder created successfully',
      });
    } catch (error) {
      logger.error(`Error creating folder: ${error}`);
      next(error);
    }
  }

  static async getFolders(req: Request, res: Response, next: NextFunction) {
    try {
      const folders = await HRFolder.findAll({
        order: [['created_at', 'ASC']],
      });

      res.json({
        data: folders,
      });
    } catch (error) {
      logger.error(`Error fetching folders: ${error}`);
      next(error);
    }
  }

  static async getFolderById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const folder = await HRFolder.findByPk(id);

      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }

      res.json({ data: folder });
    } catch (error) {
      logger.error(`Error fetching folder: ${error}`);
      next(error);
    }
  }

  static async updateFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const updates = req.body;

      const folder = await HRFolder.findByPk(id);
      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }

      await folder.update(updates);
      res.json({
        data: folder,
        message: 'Folder updated successfully',
      });
    } catch (error) {
      logger.error(`Error updating folder: ${error}`);
      next(error);
    }
  }

  static async deleteFolder(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const folder = await HRFolder.findByPk(id);

      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }

      // Optionally: delete all documents in folder
      await HRDocument.destroy({ where: { folder_id: id } });

      await folder.destroy();
      res.json({
        data: { id },
        message: 'Folder deleted successfully',
      });
    } catch (error) {
      logger.error(`Error deleting folder: ${error}`);
      next(error);
    }
  }
}
