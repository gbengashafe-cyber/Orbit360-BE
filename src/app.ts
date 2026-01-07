import compression from 'compression';
import config from 'config';
import cors from 'cors';
import express, { Request } from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { randomUUID } from 'node:crypto';
import authRoutes from './features/authentication/auth.routes';
import { companyRouter } from './features/company/company.routes';
import { deductionRouter } from './features/deductions/deduction.routes';
import departmentRoutes from './features/department/department.routes';
import employeeRoutes from './features/employee/employee.routes';
import { exitRoutes } from './features/exit/exit.routes';
import { leaveRoutes } from './features/leave/leave.routes';
import { onboardingRoutes } from './features/onboarding/onboarding.routes';
import payrollRoutes from './features/payroll/payroll.routes';
import positionRoutes from './features/position/position.routes';
import { userRoutes } from './features/users/user.router';
import { ApiError } from './utils/api-error';
import { globalErrorHandler } from './utils/global-error-handler';
import { logger } from './utils/logger';
import { parsePageAndLimitNumber, parseQueryParams } from './utils/request-query-parser';

const allowedOrigins = config.get<string[]>('allowedOrigins');

const app = express();

app.use(helmet());
app.disable('x-powered-by');
app.use(compression());
app.disable('etag');

/* Assign unique Id to all requests to match requests to responses in the log */
app.use((req, res, next) => {
  req.requestId = randomUUID();
  next();
});

const parseIp = (req: Request) =>
  (Array.isArray(req.headers['x-forwarded-for']) ? req.headers['x-forwarded-for'][0] : req.headers['x-forwarded-for'])
    ?.split(',')
    .shift() || req.socket?.remoteAddress;

app.use(function (req, res, next) {
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
app.use((req, res, next) => {
  req.body = req.body ?? {};
  next();
});

app.use(
  cors({
    origin: allowedOrigins,
    optionsSuccessStatus: 200,
    credentials: true,
  }),
);

app.use((req, res, next) => {
  const { page, rows } = req.query;
  req.pagination = parsePageAndLimitNumber(page, rows);
  req.parsedQuery = parseQueryParams(req.query);

  next();
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/v1/departments', departmentRoutes);
app.use('/api/v1/employees', employeeRoutes);
app.use('/api/v1/leaves', leaveRoutes);
app.use('/api/v1/exits', exitRoutes);
app.use('/api/v1/onboardings', onboardingRoutes);
app.use('/api/v1/payrolls', payrollRoutes);
app.use('/api/v1/positions', positionRoutes);
app.use('/api/v1/companies', companyRouter);
app.use('/api/v1/deductions', deductionRouter);
app.use('/api/v1/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  next(ApiError.notFound('Resource not found'));
});

app.use(globalErrorHandler);

export { app };
