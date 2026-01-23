import compression from 'compression';
import config from 'config';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import swaggerUi from 'swagger-ui-express';
import { swaggerSpec } from './config/swagger';
import { db } from './db';
import { loadModels } from './db/loadModels';
import { authRoutes } from './features/authentication/auth.routes';
import { companyRoutes } from './features/company/company.routes';
import { complaintRoutes } from './features/complaints/complaint.routes';
import departmentRoutes from './features/department/department.routes';
import employeeRoutes from './features/employee/employee.routes';
import { exitRoutes } from './features/exit/exit.routes';
import { jobRoleRoutes } from './features/job-role/job-role.routes';
import { leaveRoutes } from './features/leave/leave.routes';
import { loanRoutes } from './features/loans/loan.routes';
import { onboardingRoutes } from './features/onboarding/onboarding.routes';
import payrollRoutes from './features/payroll/payroll.routes';
import { performanceRoutes } from './features/performance/performance.routes';
import { recruitmentRoutes } from './features/recruitment/recruitment.routes';
import { userRoutes } from './features/users/user.router';
import { ApiError } from './utils/api-error';
import { globalErrorHandler } from './utils/global-error-handler';
import { logger } from './utils/logger';
import { parsePageAndLimitNumber, parseQueryParams } from './utils/request-query-parser';

const allowedOrigins = config.get<string[]>('allowedOrigins');

loadModels();

// Sync database on startup
db.sync({ alter: true }).catch((err) => {
  logger.error('Database sync failed:', err);
});

const app = express();

app.use(helmet());
app.disable('x-powered-by');
app.use(compression());
app.disable('etag');

// Assign unique Id to all requests to match requests to responses in the log
app.use((req: Request, res, next) => {
  req.requestId = randomUUID();
  next();
});

const parseIp = (req: Request) =>
  (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for'])
    ?.split(',')
    .shift() || req.socket?.remoteAddress;

app.use(function (req: Request, res: Response, next: NextFunction) {
  req.requestIp = parseIp(req);
  req.requestPath = req?.baseUrl + req?.path;
  next();
});

morgan.token('requestId', function getId(req) {
  return req.requestId;
});

morgan.token('requestIp', function getId(req) {
  return req.requestIp;
});

morgan.token('path', function getId(req) {
  return req.requestPath;
});

// Access logging
app.use(
  morgan(
    '{"timestamp": ":date[iso]", "requestId": ":requestId", "protocol": "HTTP/:http-version", "clientIp": ":requestIp", "method": ":method", "path": ":path", "responseTimeInMs": ":response-time[digits]", "statusCode": :status, "referer": ":referrer", "contentLength": :res[content-length], "userAgent": ":user-agent"}',
    {
      stream: {
        write: (message: string) => {
          logger.http(message.trim());
        },
      },
    },
  ),
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// handle case where request body is empty
app.use((req: Request, res: Response, next: NextFunction) => {
  req.body = req.body ?? {};
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    optionsSuccessStatus: 200,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }),
);

app.use((req: Request, res: Response, next: NextFunction) => {
  const { page, rows } = req.query;
  req.pagination = parsePageAndLimitNumber(page, rows);
  req.parsedQuery = parseQueryParams(req.query);

  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/exits', exitRoutes);
app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/recruitment', recruitmentRoutes);
app.use('/api/v1/payrolls', payrollRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/job-roles', jobRoleRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/loans', loanRoutes);

// Swagger Documentation
app.use(
  '/api-docs',
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'Orbit360 HR API Docs',
  }),
);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  // eslint-disable-next-line custom/enforce-standard-response
  res.json({ status: 'ok', success: true, timestamp: new Date().toISOString() });
});

app.use((req: Request, res: Response, next: NextFunction) => {
  next(ApiError.notFound('Resource not found'));
});

app.use(globalErrorHandler);

export { app };
