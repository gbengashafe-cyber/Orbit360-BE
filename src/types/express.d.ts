import 'express';
import { ParsedQs } from 'qs';

declare module 'express-serve-static-core' {
  interface Request {
    requestId: string;
    requestIp?: string;
    requestPath?: string;
    user?: { id: number | string; position: string; role: string; department: string };
    pagination: { page: number; rows: number };
    parsedQuery: ParsedQs;
  }
}

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
  }
}
