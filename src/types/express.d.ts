import 'express';

declare module 'express-serve-static-core' {
  interface Request {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
    user?: { id: number | string; role: string };
  }
}

declare module 'http' {
  interface IncomingMessage {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
  }
}
