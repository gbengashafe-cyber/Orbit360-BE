import "express";

declare module "express-serve-static-core" {
  interface Request {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
    pagination?: { page: number; rows: number };
  }
}

declare module "http" {
  interface IncomingMessage {
    requestId?: string;
    requestIp?: string;
    requestPath?: string;
  }
}
