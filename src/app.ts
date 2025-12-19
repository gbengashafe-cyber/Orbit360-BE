import compression from "compression";
import config from "config";
import cors from "cors";
import express, { Request } from "express";
import helmet from "helmet";
import morgan from "morgan";
import { randomUUID } from "node:crypto";
import { companyRoutes } from "./features/company/company.routes";
import attendanceRoutes from "./routes/attendance.routes";
import authRoutes from "./routes/auth.routes";
import departmentRoutes from "./routes/department.routes";
import employeeRoutes from "./routes/employee.routes";
import leaveRoutes from "./routes/leave.routes";
import payrollRoutes from "./routes/payroll.routes";
import positionRoutes from "./routes/position.routes";
import { ApiError } from "./utils/api-error";
import { globalErrorHandler } from "./utils/global-error-handler";
import { logger } from "./utils/logger";
import { parsePageAndLimitNumber, parseQueryParams } from "./utils/request-query-parser";

const allowedOrigins = config.get<string[]>("allowedOrigins");

const app = express();

app.use(helmet());
app.disable("x-powered-by");
app.use(compression());
app.disable("etag");

/* Assign unique Id to all requests to match requests to responses in the log */
app.use((req, res, next) => {
  req.requestId = randomUUID();
  next();
});

const parseIp = (req: Request) =>
  (Array.isArray(req.headers["x-forwarded-for"]) ? req.headers["x-forwarded-for"][0] : req.headers["x-forwarded-for"])
    ?.split(",")
    .shift() || req.socket?.remoteAddress;

app.use(function (req, res, next) {
  req.requestIp = parseIp(req);
  req.requestPath = req?.baseUrl + req?.path;
  next();
});

morgan.token("requestId", function getId(req) {
  return req.requestId;
});

morgan.token("requestIp", function getId(req) {
  return req.requestIp;
});

morgan.token("path", function getId(req) {
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
  req.body.pagination = parsePageAndLimitNumber(page, rows);
  req.body.query = parseQueryParams(req.query.q);

  next();
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/v1/departments", departmentRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/leaves", leaveRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/payroll", payrollRoutes);
app.use("/api/positions", positionRoutes);
app.use("/api/v1/companies", companyRoutes);

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((req, res, next) => {
  next(ApiError.notFound("Resource not found"));
});

app.use(globalErrorHandler);

export { app };
