import 'express';
import { ParsedQs } from 'qs';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    requestIp?: string;
    requestPath?: string;
    user?: {
      id: number;
      email: string;
      jobRoleId: number;
      role: string;
      departmentId: number;
      permissions: string[];
      employeeRecord?: { id: number; supervisorId: number; [key: string]: any };
    };
    pagination: { page: number; rows: number };
    parsedQuery: ParsedQs;
    validatedBody: { [key: string]: any };
  }
}

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
  }
}
