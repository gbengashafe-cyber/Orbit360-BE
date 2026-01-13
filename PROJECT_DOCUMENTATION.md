# Orbit360 HR Management System - Backend

## Table of Contents
1. [Overview](#overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [Getting Started](#getting-started)
5. [Environment Configuration](#environment-configuration)
6. [Database Setup](#database-setup)
7. [API Documentation](#api-documentation)
8. [Features](#features)
   - 8.1 [Leave Management](#1-leave-management)
   - 8.2 [Exit Management](#2-exit-management)
   - 8.3 [Onboarding](#3-onboarding-document-tracking)
   - 8.4 [Employee Management](#4-employee-management)
   - 8.5 [Payroll Management](#5-payroll-management)
   - 8.6 [Recruitment Management](#6-recruitment-management)
   - 8.7 [Staff Complaint Management](#7-staff-complaint-management)
9. [Authentication & Authorization](#authentication--authorization)
10. [Development Guidelines](#development-guidelines)
11. [Deployment](#deployment)

---

## Overview

Orbit360 is a comprehensive HR Management System designed to streamline employee management, payroll processing, leave management, exit management, and onboarding processes. The backend is built with Node.js, Express, and TypeScript, providing a robust and scalable API.

### Key Features
- Employee Management
- Leave Management with Balance Tracking
- Exit Management (Resignation, Termination, etc.)
- Onboarding Document Tracking
- Payroll Processing
- Department & Position Management
- Role-Based Access Control (RBAC)
- Attendance Tracking
- Recruitment & Job Postings
- Staff Complaint Management

---

## Technology Stack

### Core Technologies
- **Runtime**: Node.js
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.x
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT (JSON Web Tokens)
- **Validation**: Zod
- **Documentation**: Swagger/OpenAPI 3.0

### Key Dependencies
```json
{
  "express": "^5.2.1",
  "sequelize": "^6.37.7",
  "mysql2": "^3.15.3",
  "typescript": "^5.9.3",
  "zod": "^4.2.1",
  "jsonwebtoken": "^9.0.3",
  "swagger-ui-express": "latest",
  "winston": "^3.19.0",
  "helmet": "^8.1.0",
  "cors": "^2.8.5"
}
```

---

## Project Structure

```
Orbit360-BE/
├── src/
│   ├── config/              # Configuration files
│   │   ├── swagger.ts       # Swagger configuration
│   │   ├── env.ts           # Environment variables
│   │   ├── development.json
│   │   └── production.json
│   ├── db/                  # Database setup
│   │   ├── index.ts         # Database connection
│   │   ├── loadModels.ts    # Model loader
│   │   ├── sync.ts          # Database sync
│   │   └── seed.ts          # Database seeding
│   ├── features/            # Feature modules
│   │   ├── authentication/  # Auth module
│   │   ├── employee/        # Employee management
│   │   ├── leave/           # Leave management
│   │   ├── exit/            # Exit management
│   │   ├── onboarding/      # Onboarding documents
│   │   ├── payroll/         # Payroll processing
│   │   ├── department/      # Department management
│   │   ├── position/        # Position management
│   │   ├── company/         # Company management
│   │   ├── deductions/      # Payroll deductions
│   │   ├── recruitment/     # Job postings & recruitment
│   │   ├── complaints/      # Staff complaint management
│   │   └── users/           # User management
│   ├── swagger/             # API documentation
│   │   ├── leave.yaml
│   │   ├── exit.yaml
│   │   └── onboarding.yaml
│   ├── utils/               # Utility functions
│   │   ├── api-error.ts     # Error handling
│   │   ├── api-response.ts  # Response formatting
│   │   ├── logger.ts        # Winston logger
│   │   ├── jwt.ts           # JWT utilities
│   │   └── check-permission.ts # Authorization
│   ├── types/               # TypeScript types
│   ├── app.ts               # Express app setup
│   └── index.ts             # Entry point
├── logs/                    # Application logs
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
└── README.md
```

### Feature Module Structure
Each feature follows a consistent structure:
```
feature/
├── feature.model.ts         # Sequelize model
├── feature.controller.ts    # Request handlers
├── feature.routes.ts        # Route definitions
├── feature.validators.ts    # Zod validation schemas
└── feature.repository.ts    # Data access layer (optional)
```

---

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MySQL (v8 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Orbit360-BE
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Create database**
```bash
mysql -u root -p
CREATE DATABASE orbit360_hr;
```

5. **Sync database tables**
```bash
npm run sync
```

6. **Seed database (optional)**
```bash
npm run seed
```

7. **Start development server**
```bash
npm run dev
```

The server will start on `http://localhost:3000`

---

## Environment Configuration

### Required Environment Variables

```env
# Server Configuration
PORT=3000
NODE_ENV=development
LOG_LEVEL=info

# Database Configuration
DB_NAME=orbit360_hr
DB_USER=root
DB_PASSWORD=your_password
DB_HOST_NAME=localhost
DB_PORT=3306
DB_TYPE=mysql

# JWT Configuration
JWT_SECRET=your_jwt_secret_key

# OAuth (Optional)
GOOGLE_CLIENT_ID=optional_for_now
GOOGLE_CLIENT_SECRET=optional_for_now

# Other
NODE_CONFIG_DIR=src/config
```

### Configuration Files
- `src/config/development.json` - Development settings
- `src/config/production.json` - Production settings

---

## Database Setup

### Database Schema

The system uses the following main tables:

#### Core Tables
- **employees** - Employee information
- **departments** - Department data
- **positions** - Job positions
- **companies** - Company information
- **users** - System users

#### HR Management Tables
- **leaves** - Leave requests
- **leave_types** - Leave type configurations
- **leave_balances** - Employee leave balances
- **exits** - Exit requests
- **onboardings** - Onboarding documents
- **payrolls** - Payroll records
- **deductions** - Payroll deductions
- **attendance** - Attendance records
- **job_postings** - Job openings and postings
- **job_applications** - Candidate applications
- **complaints** - Staff complaints and grievances

### Database Commands

```bash
# Sync database (create/update tables)
npm run sync

# Seed database with sample data
npm run seed

# Clear database
npm run clear-db
```

---

## API Documentation

### Accessing API Documentation

Once the server is running, access the interactive API documentation at:

**Swagger UI**: http://localhost:3000/api-docs

### API Versioning

All API endpoints are versioned under `/api/v1/` except authentication:
- Authentication: `/api/auth`
- All other endpoints: `/api/v1/{resource}`

### Base URL
```
http://localhost:3000/api/v1
```

### Common Response Format

**Success Response:**
```json
{
  "data": { ... },
  "message": "Operation successful"
}
```

**Error Response:**
```json
{
  "message": "Error description",
  "statusCode": 400,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "path": "/api/v1/resource"
}
```

**Paginated Response:**
```json
{
  "data": [...],
  "pagination": {
    "total": 100,
    "page": 1,
    "rows": 10,
    "pages": 10
  }
}
```

---

## Features

### 1. Leave Management

**Endpoints:**
- `POST /api/v1/leaves` - Create leave request
- `GET /api/v1/leaves` - Get all leaves (HR only)
- `GET /api/v1/leaves/employee/:employeeId` - Get employee leaves
- `GET /api/v1/leaves/:id` - Get leave by ID
- `GET /api/v1/leaves/types` - Get leave types
- `GET /api/v1/leaves/balance/:employeeId` - Get leave balance
- `PATCH /api/v1/leaves/:id/status` - Approve/decline leave (HR only)
- `DELETE /api/v1/leaves/:id` - Cancel leave

**Leave Types:**
- Sick Leave
- Vacation
- Personal Leave
- Maternity Leave
- Paternity Leave

**Status Flow:**
`pending` → `approved` / `rejected`

### 2. Exit Management

**Endpoints:**
- `POST /api/v1/exits` - Create exit request
- `GET /api/v1/exits` - Get all exits (HR only)
- `GET /api/v1/exits/employee/:employeeId` - Get employee exits
- `GET /api/v1/exits/:id` - Get exit by ID
- `PATCH /api/v1/exits/:id/approve` - Approve/reject exit (HR only)

**Exit Types:**
- Resignation
- Termination
- Retirement
- Contract End

**Status Flow:**
`pending` → `approved` / `rejected`

### 3. Onboarding (Document Tracking)

**Endpoints:**
- `POST /api/v1/onboardings` - Create document (HR only)
- `GET /api/v1/onboardings` - Get all documents (HR only)
- `GET /api/v1/onboardings/employee/:employeeId` - Get employee documents
- `GET /api/v1/onboardings/:id` - Get document by ID
- `PATCH /api/v1/onboardings/:id` - Update document status (HR only)

**Document Status Flow:**
`pending` → `submitted` → `approved` / `rejected`

### 4. Employee Management

**Endpoints:**
- `POST /api/v1/employees` - Create employee (HR only)
- `GET /api/v1/employees` - Get all employees (HR only)
- `GET /api/v1/employees/:id` - Get employee by ID (HR only)
- `PUT /api/v1/employees/:id` - Update employee (HR only)

### 5. Payroll Management

**Endpoints:**
- `POST /api/v1/payrolls` - Generate payroll (HR only)
- `GET /api/v1/payrolls` - Get all payrolls
- `GET /api/v1/payrolls/employee/:employeeId` - Get employee payrolls
- `GET /api/v1/payrolls/:id` - Get payroll by ID
- `PUT /api/v1/payrolls/:id` - Update payroll
- `POST /api/v1/payrolls/:id/process` - Mark as processed
- `POST /api/v1/payrolls/:id/pay` - Mark as paid

### 6. Recruitment Management

**Endpoints:**

**Job Postings:**
- `POST /api/v1/recruitment/postings` - Create job posting (HR only)
- `GET /api/v1/recruitment/postings` - List all postings
- `GET /api/v1/recruitment/postings/:id` - Get posting by ID
- `PUT /api/v1/recruitment/postings/:id` - Update posting (HR only)
- `POST /api/v1/recruitment/postings/:id/approve` - Approve posting (MD only)
- `POST /api/v1/recruitment/postings/:id/reject` - Reject posting (MD only)
- `POST /api/v1/recruitment/postings/:id/close` - Close posting (HR only)
- `DELETE /api/v1/recruitment/postings/:id` - Delete posting (HR only)

**Job Applications:**
- `POST /api/v1/recruitment/applications` - Submit application
- `GET /api/v1/recruitment/applications` - List all applications (HR only)
- `GET /api/v1/recruitment/applications/:id` - Get application details
- `GET /api/v1/recruitment/applications/by-posting/:jobPostingId` - Get applications for a job
- `PUT /api/v1/recruitment/applications/:id/status` - Update status & rating (HR only)
- `POST /api/v1/recruitment/applications/:id/schedule-interview` - Schedule interview (HR only)
- `POST /api/v1/recruitment/applications/:id/send-offer` - Send offer (HR only)
- `POST /api/v1/recruitment/applications/:id/hire` - Hire candidate (HR only)
- `POST /api/v1/recruitment/applications/:id/reject` - Reject candidate (HR only)
- `DELETE /api/v1/recruitment/applications/:id` - Delete application (HR only)

**Dashboard:**
- `GET /api/v1/recruitment/dashboard/stats` - Get recruitment KPIs

**Job Posting Status Flow:**
`draft` → `pending_approval` → `active` / `rejected` → `closed` / `on_hold`

**Application Status Flow:**
`applied` → `under_review` → `interview_scheduled` → `interviewed` → `offered` → `hired` / `rejected`

See detailed documentation: [RECRUITMENT_QUICK_START.md](RECRUITMENT_QUICK_START.md)

### 7. Staff Complaint Management

**Endpoints:**
- `POST /api/v1/complaints` - Create complaint (employees)
- `GET /api/v1/complaints` - List all complaints (HR only, with filtering)
- `GET /api/v1/complaints/:id` - Get complaint details
- `PUT /api/v1/complaints/:id` - Update complaint (HR only)
- `POST /api/v1/complaints/:id/resolve` - Resolve complaint (HR only)
- `POST /api/v1/complaints/:id/close` - Close complaint (HR only)
- `DELETE /api/v1/complaints/:id` - Delete complaint (HR only)

**Complaint Types:**
- Harassment
- Discrimination
- Safety
- Wage Dispute
- Working Conditions
- Other

**Severity Levels:**
- Low
- Medium
- High
- Critical

**Status Flow:**
`open` → `under_review` → `resolved` → `closed`

**HR Dashboard Filtering:**
- Filter by status (open, under_review, resolved, closed)
- Filter by severity (low, medium, high, critical)
- Filter by complaint type
- Filter by employee

See detailed documentation: [COMPLAINTS_API.md](COMPLAINTS_API.md)

---

## Authentication & Authorization

### Authentication

The system uses JWT (JSON Web Tokens) for authentication.

**Current Implementation:**
- Mock authentication in development
- User object attached to request: `{ id, role, position, department }`

**Future Implementation:**
- JWT token generation on login
- Token validation middleware
- Refresh token mechanism

### Authorization

Two-level authorization system:

#### 1. Permission-Based Access Control
```typescript
hasRequiredPermission('PERMISSION_NAME')
```

**Common Permissions:**
- `MANAGE_EMPLOYEES`
- `MANAGE_LEAVES`
- `APPROVE_LEAVES`
- `MANAGE_EXITS`
- `APPROVE_EXITS`
- `MANAGE_ONBOARDING`
- `MANAGE_PAYROLL`

#### 2. Department-Based Access Control
```typescript
isInAllowedDepartment(['HR', 'FINANCE'])
```

**Usage Example:**
```typescript
router.get(
  '/',
  validateAuthToken,
  isInAllowedDepartment(['HR']),
  hasRequiredPermission('MANAGE_LEAVES'),
  LeaveController.getAll
);
```

---

## Development Guidelines

### Code Style

- **Language**: TypeScript (strict mode)
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Naming Conventions**:
  - Files: `kebab-case.ts`
  - Classes: `PascalCase`
  - Functions/Variables: `camelCase`
  - Constants: `UPPER_SNAKE_CASE`

### Git Workflow

```bash
# Format code
npm run format

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Adding a New Feature

1. **Create feature directory**
```bash
mkdir src/features/new-feature
```

2. **Create required files**
```
new-feature/
├── new-feature.model.ts
├── new-feature.controller.ts
├── new-feature.routes.ts
└── new-feature.validators.ts
```

3. **Register routes in app.ts**
```typescript
import { newFeatureRoutes } from './features/new-feature/new-feature.routes';
app.use('/api/v1/new-feature', newFeatureRoutes);
```

4. **Add Swagger documentation**
```bash
# Create swagger/new-feature.yaml
```

### Error Handling

Use the `ApiError` utility class:
```typescript
import { ApiError } from '../../utils/api-error';

// Bad Request (400)
throw ApiError.badRequest('Invalid input');

// Not Found (404)
throw ApiError.notFound('Resource not found');

// Forbidden (403)
throw ApiError.forbidden('Access denied');

// Internal Server Error (500)
throw ApiError.internalServerError('Something went wrong');
```

### Logging

Use the Winston logger:
```typescript
import { logger } from '../../utils/logger';

logger.info('Information message');
logger.error('Error message');
logger.debug('Debug message');
logger.warn('Warning message');
```

---

## Deployment

### Production Build

```bash
# Build TypeScript to JavaScript
npm run build

# Start production server
npm start
```

### Environment Setup

1. Set `NODE_ENV=production`
2. Configure production database
3. Set secure JWT secret
4. Enable HTTPS
5. Configure CORS for production domains

### Docker Deployment (Optional)

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Testing

### Manual Testing

Use the provided test files:
- `test-leave-exit.http` - REST Client tests
- `TESTING_GUIDE.md` - Testing instructions

### API Testing Tools
- Swagger UI: http://localhost:3000/api-docs
- Postman
- cURL
- VS Code REST Client

---

## Troubleshooting

### Common Issues

**Port already in use:**
```bash
# Change PORT in .env file
PORT=3001
```

**Database connection error:**
```bash
# Check MySQL is running
mysql -u root -p

# Verify credentials in .env
```

**Table doesn't exist:**
```bash
# Run database sync
npm run sync
```

**Foreign key constraint:**
```bash
# Ensure referenced records exist
# Check employee exists before creating leave/exit
```

---

## Support & Contact

For issues, questions, or contributions:
- Create an issue in the repository
- Contact the development team
- Check API documentation at `/api-docs`

---

## License

[Add your license information here]

---

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Leave Management
- Exit Management
- Onboarding Document Tracking
- Employee Management
- Payroll Processing
- Swagger Documentation
- Recruitment & Job Postings Management
  - Job posting creation with MD approval workflow
  - Job application tracking
  - Interview scheduling
  - Offer management
  - Recruitment dashboard with KPIs
- Staff Complaint Management
  - Employee complaint submission
  - HR dashboard for complaint tracking
  - Multi-type complaint support (harassment, discrimination, safety, wage dispute, working conditions)
  - Severity-based categorization
  - Complaint resolution workflow
