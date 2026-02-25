import { db } from './src/db';
import { HRDocumentDeletionRequest } from './src/features/hr-document/hr-document-deletion-request.model';

async function checkPendingDeletions() {
  try {
    const pending = await HRDocumentDeletionRequest.findAll({
      where: { status: 'PENDING_APPROVAL' },
      attributes: ['id', 'documentOrFolderId', 'deletionType', 'itemName', 'requestedBy', 'status', 'createdAt']
    });

    console.log(`Found ${pending.length} pending deletion requests:`);
    pending.forEach(req => {
      console.log(`ID: ${req.id}, Item: ${req.itemName} (${req.deletionType}), Requested by: ${req.requestedBy}, Status: ${req.status}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkPendingDeletions();
