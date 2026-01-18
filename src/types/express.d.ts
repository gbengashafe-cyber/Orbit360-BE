import 'express';
import { ParsedQs } from 'qs';
import { InferAttributes } from 'sequelize';
import { JobRolePermissions } from '../features/permissions/permission.model';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    requestIp?: string;
    requestPath?: string;
    user?: {
      id: number | string;
      jobRole: string;
      role: string;
      department: string;
      permissions: InferAttributes<JobRolePermissions>[];
    };
    pagination: { page: number; rows: number };
    parsedQuery: ParsedQs;
    validatedBody?: { [key: string]: any };
  }
}

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
  }
}
