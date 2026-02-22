import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { hasRequiredPermission } from '../../utils/check-permission';
import { HRDocumentController } from './hr-document.controller';

const router = Router();

// Initialize default folders - HR only
router.post(
  '/initialize',
  validateAuthToken,
  hasRequiredPermission('MANAGE_DOCUMENTS'),
  HRDocumentController.initializeDefaultFolders,
);

// Documents - Create/Update/Delete require MANAGE_DOCUMENTS permission, but GET is open for all authenticated users
router.post('/documents', validateAuthToken, hasRequiredPermission('MANAGE_DOCUMENTS'), HRDocumentController.createDocument);
router.get('/documents', validateAuthToken, HRDocumentController.getDocuments); // All users can view (filtered by access_level)
router.get('/documents/:id', validateAuthToken, HRDocumentController.getDocumentById); // All users can view (filtered by access_level)
router.put('/documents/:id', validateAuthToken, hasRequiredPermission('MANAGE_DOCUMENTS'), HRDocumentController.updateDocument);
router.delete(
  '/documents/:id',
  validateAuthToken,
  hasRequiredPermission('MANAGE_DOCUMENTS'),
  HRDocumentController.deleteDocument,
);

// Folders - Create/Update/Delete require MANAGE_DOCUMENTS permission, but GET is open for all authenticated users
router.post('/folders', validateAuthToken, hasRequiredPermission('MANAGE_DOCUMENTS'), HRDocumentController.createFolder);
router.get('/folders', validateAuthToken, HRDocumentController.getFolders); // All users can view (filtered by public docs)
router.get('/folders/:id', validateAuthToken, HRDocumentController.getFolderById); // All users can view
router.put('/folders/:id', validateAuthToken, hasRequiredPermission('MANAGE_DOCUMENTS'), HRDocumentController.updateFolder);
router.delete('/folders/:id', validateAuthToken, hasRequiredPermission('MANAGE_DOCUMENTS'), HRDocumentController.deleteFolder);

export { router as hrDocumentRoutes };
