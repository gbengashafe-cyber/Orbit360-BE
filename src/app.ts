import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express, { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import config from 'config';
import { swaggerSpec } from './config/swagger';
import { dashboardRoutes } from './dashboard/dashboard.routes';
import { authRoutes } from './features/authentication/auth.routes';
import { companyRoutes } from './features/company/company.routes';
import { complaintRoutes } from './features/complaints/complaint.routes';
import departmentRoutes from './features/department/department.routes';
import { employeeRoutes } from './features/employee/employee.routes';
import { exitRoutes } from './features/exit/exit.routes';
import { hrDocumentRoutes } from './features/hr-document/hr-document.routes';
import { jobRoleRoutes } from './features/job-role/job-role.routes';
import { leaveRoutes } from './features/leave/leave.routes';
import { loanTypeRoutes } from './features/loans/loan-types/loan-types.routes';
import { loanRoutes } from './features/loans/loan.routes';
import { onboardingRoutes } from './features/onboarding/onboarding.routes';
import payrollRoutes from './features/payroll/payroll.routes';
import { payrollReportRoutes } from './features/payroll/reports/payroll-report.routes';
import { performanceRoutes } from './features/performance/performance.routes';
import { recruitmentRoutes } from './features/recruitment/recruitment.routes';
import { userRoutes } from './features/users/user.router';
import { authorizationRoutes } from './pending-authorization/pending-authorization.routes';
import { ApiError } from './utils/api-error';
import { globalErrorHandler } from './utils/global-error-handler';
import { logger } from './utils/logger';
import { parsePageAndLimitNumber, parseQueryParams } from './utils/request-query-parser';

const allowedOrigins = config.get<string | string[]>('allowedOrigins');

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

app.use(cookieParser());

const PAYROLL_REPORT_FOLDER = config.get<string>('payrollReport.storagePath');
app.use(`/${PAYROLL_REPORT_FOLDER}`, express.static(path.join(process.cwd(), PAYROLL_REPORT_FOLDER)));

app.use(
  express.json({
    strict: false,
    limit: '1mb',
    verify: (req: Request, res, buf) => {
      if (buf.toString().trim() === 'null' || buf.toString().trim() === 'undefined') {
        req.body = {};
      }
    },
  }),
);

app.use(express.urlencoded({ extended: true, limit: '1mb' }));

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
  // handle case where request body is empty
  req.body = req.body ?? {};
  const { page, rows } = req.query;
  req.pagination = parsePageAndLimitNumber(page, rows);
  req.parsedQuery = parseQueryParams(req.query);

  next();
});

// API Routes
app.use((req: Request, res: Response, next: NextFunction) => {
  if (req.path.includes('/auth/login')) {
    console.log('Auth login request received:', {
      path: req.path,
      method: req.method,
      bodyKeys: Object.keys(req.body),
    });
  }
  next();
});

app.use('/api/auth', authRoutes);
app.use('/api/v1/complaints', complaintRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/exits', exitRoutes);
app.use('/api/v1/hr-documents', hrDocumentRoutes);
app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/recruitment', recruitmentRoutes);
app.use('/api/v1/payrolls/uploads', payrollReportRoutes);
app.use('/api/v1/payrolls', payrollRoutes);
app.use('/api/v1/performance', performanceRoutes);
app.use('/api/v1/companies', companyRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/job-roles', jobRoleRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/loans/types', loanTypeRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/pending-authorization', authorizationRoutes);

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
