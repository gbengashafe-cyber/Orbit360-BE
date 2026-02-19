import multer from 'multer';
import path from 'path';
import { configUtil } from '../../../config/config-util';

const MAX_REPORT_SIZE = configUtil.payrollReportMaxFileSizeInMB();
const ABSOLUTE_STORAGE_PATH = path.join(process.cwd(), configUtil.payrollReportStoragePath());

const storage = multer.diskStorage({
  destination: ABSOLUTE_STORAGE_PATH,
  filename: (_req, file, cb) => {
    const uniquePrefix = Date.now();

    const fileName = `${uniquePrefix}-${file.originalname}`;
    cb(null, fileName);
  },
});

export const uploadReport = multer({
  storage,
  limits: {
    fileSize: MAX_REPORT_SIZE * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const allowedTypes = ['.xlsx', '.xls', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File format not allowed. Allowed file formats are: ${allowedTypes.join(', ')}`));
    }
  },
});
