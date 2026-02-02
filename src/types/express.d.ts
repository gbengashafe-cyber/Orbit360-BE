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
      jobRole: string;
      role: string;
      departmentName: string;
      permissions: string[];
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
