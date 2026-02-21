import { Router } from 'express';
import { validateAuthToken } from '../authentication/auth.middleware';
import { HRDocumentController } from './hr-document.controller';

const router = Router();

// Documents
router.post('/documents', validateAuthToken, HRDocumentController.createDocument);
router.get('/documents', validateAuthToken, HRDocumentController.getDocuments);
router.get('/documents/:id', validateAuthToken, HRDocumentController.getDocumentById);
router.put('/documents/:id', validateAuthToken, HRDocumentController.updateDocument);
router.delete('/documents/:id', validateAuthToken, HRDocumentController.deleteDocument);

// Folders
router.post('/folders', validateAuthToken, HRDocumentController.createFolder);
router.get('/folders', validateAuthToken, HRDocumentController.getFolders);
router.get('/folders/:id', validateAuthToken, HRDocumentController.getFolderById);
router.put('/folders/:id', validateAuthToken, HRDocumentController.updateFolder);
router.delete('/folders/:id', validateAuthToken, HRDocumentController.deleteFolder);

export { router as hrDocumentRoutes };
