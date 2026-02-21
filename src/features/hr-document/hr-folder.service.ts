import { HRFolder } from './hr-folder.model';
import { HRDocument } from './hr-document.model';
import { ApiError } from '../../utils/api-error';
import { logger } from '../../utils/logger';

export class HRFolderService {
  /**
   * Create a folder
   */
  static async createFolder(name: string, parent_folder_id?: string) {
    try {
      // Check if parent folder exists (if provided)
      if (parent_folder_id) {
        const parentFolder = await HRFolder.findByPk(parent_folder_id);
        if (!parentFolder) {
          throw ApiError.notFound('Parent folder not found');
        }
      }

      const folder = await HRFolder.create({
        name,
        parent_folder_id: parent_folder_id || undefined,
      });
      return folder;
    } catch (error) {
      logger.error(`Error creating folder: ${error}`);
      throw error;
    }
  }

  /**
   * Get all folders
   */
  static async getFolders() {
    try {
      const folders = await HRFolder.findAll({
        order: [['created_at', 'ASC']],
      });
      return folders;
    } catch (error) {
      logger.error(`Error fetching folders: ${error}`);
      throw error;
    }
  }

  /**
   * Get root folders (no parent)
   */
  static async getRootFolders() {
    try {
      const folders = await HRFolder.findAll({
        where: { parent_folder_id: undefined },
        order: [['created_at', 'ASC']],
      });
      return folders;
    } catch (error) {
      logger.error(`Error fetching root folders: ${error}`);
      throw error;
    }
  }

  /**
   * Get folder by ID
   */
  static async getFolderById(id: string) {
    try {
      const folder = await HRFolder.findByPk(id);
      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }
      return folder;
    } catch (error) {
      logger.error(`Error fetching folder: ${error}`);
      throw error;
    }
  }

  /**
   * Get subfolders of a folder
   */
  static async getSubfolders(parent_folder_id: string) {
    try {
      const subfolders = await HRFolder.findAll({
        where: { parent_folder_id },
        order: [['created_at', 'ASC']],
      });
      return subfolders;
    } catch (error) {
      logger.error(`Error fetching subfolders: ${error}`);
      throw error;
    }
  }

  /**
   * Get folder hierarchy
   */
  static async getFolderHierarchy(parent_folder_id?: string) {
    try {
      const folders = await HRFolder.findAll({
        where: { parent_folder_id: parent_folder_id || undefined },
        order: [['created_at', 'ASC']],
      });

      // Recursively get subfolders
      const hierarchyPromises = folders.map(async (folder) => {
        const subfolders = await this.getFolderHierarchy(folder.id);
        return {
          ...folder.toJSON(),
          children: subfolders,
        };
      });

      return Promise.all(hierarchyPromises);
    } catch (error) {
      logger.error(`Error fetching folder hierarchy: ${error}`);
      throw error;
    }
  }

  /**
   * Update folder
   */
  static async updateFolder(id: string, updates: any) {
    try {
      const folder = await HRFolder.findByPk(id);
      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }

      await folder.update(updates);
      return folder;
    } catch (error) {
      logger.error(`Error updating folder: ${error}`);
      throw error;
    }
  }

  /**
   * Delete folder (cascade deletes documents)
   */
  static async deleteFolder(id: string) {
    try {
      const folder = await HRFolder.findByPk(id);
      if (!folder) {
        throw ApiError.notFound('Folder not found');
      }

      // Delete all documents in this folder
      await HRDocument.destroy({ where: { folder_id: id } });

      // Recursively delete subfolders
      const subfolders = await this.getSubfolders(id);
      for (const subfolder of subfolders) {
        await this.deleteFolder(subfolder.id);
      }

      await folder.destroy();
      return { id };
    } catch (error) {
      logger.error(`Error deleting folder: ${error}`);
      throw error;
    }
  }

  /**
   * Get folder statistics
   */
  static async getFolderStats(folder_id: string) {
    try {
      const documentCount = await HRDocument.count({
        where: { folder_id },
      });

      const subfolderCount = await HRFolder.count({
        where: { parent_folder_id: folder_id },
      });

      return {
        folder_id,
        document_count: documentCount,
        subfolder_count: subfolderCount,
      };
    } catch (error) {
      logger.error(`Error fetching folder stats: ${error}`);
      throw error;
    }
  }
}
