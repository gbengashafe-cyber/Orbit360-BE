# Orbit360 HR Backend - Setup Guide

## Prerequisites

- Node.js v18+ 
- MySQL 8.0+
- npm or yarn

## Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Orbit360-BE
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Setup

Copy `.env.example` to `.env` and configure:
```bash
cp .env.example .env
```

Edit `.env` with your database credentials:
```
PORT=3000
NODE_ENV=development
LOG_LEVEL=info
DB_NAME=orbit360_hr
DB_USER=root
DB_PASSWORD=your_password
DB_HOST_NAME=localhost
DB_PORT=3306
DB_TYPE=mysql
```

### 4. Database Setup

#### Create Database
```bash
mysql -u root -p
> CREATE DATABASE orbit360_hr;
> EXIT;
```

#### Seed Database (Optional)
```bash
npm run seed
```

This will create:
- 4 Departments
- 4 Positions
- 3 Sample Employees
- Sample Attendance Records
- Sample Leave Requests
- Sample Payroll Records

## Running the Application

### Development Mode
```bash
npm run dev
```
Server runs on http://localhost:3000

### Production Build
```bash
npm run build
npm start
```

### Database Sync
The database automatically syncs on first connection. To force sync with alter:
```bash
# Add this to src/index.ts temporarily:
import { db } from "./db";
db.sync({ alter: true }).then(() => console.log("DB synced"));
```

## Project Structure

```
src/
├── config/              # Configuration files
│   ├── env.ts          # Environment variables validation
│   ├── development.json
│   └── production.json
├── controllers/         # Business logic
│   ├── department.controller.ts
│   ├── employee.controller.ts
│   ├── attendance.controller.ts
│   ├── leave.controller.ts
│   └── payroll.controller.ts
├── models/             # Sequelize models
│   ├── Department.ts
│   ├── Employee.ts
│   ├── Attendance.ts
│   ├── Leave.ts
│   ├── Payroll.ts
│   ├── Position.ts
│   └── index.ts        # Model associations
├── routes/             # API routes
│   ├── department.routes.ts
│   ├── employee.routes.ts
│   ├── attendance.routes.ts
│   ├── leave.routes.ts
│   └── payroll.routes.ts
├── utils/              # Utility functions
│   ├── api-error.ts
│   ├── global-error-handler.ts
│   ├── logger.ts
│   └── request-query-parser.ts
├── db/                 # Database
│   ├── index.ts        # Sequelize instance
│   └── seed.ts         # Database seeding
├── types/              # TypeScript definitions
│   └── express.d.ts    # Express extensions
├── app.ts              # Express app setup
└── index.ts            # Server entry point
```

## API Endpoints

### Base URL
```
http://localhost:3000/api
```

### Quick Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| GET | /departments | List all departments |
| POST | /departments | Create department |
| GET | /employees | List all employees |
| POST | /employees | Create employee |
| GET | /attendance | List attendance |
| POST | /attendance/check-in | Check in |
| POST | /attendance/check-out | Check out |
| GET | /leaves | List leave requests |
| POST | /leaves | Create leave request |
| POST | /leaves/:id/approve | Approve leave |
| GET | /payroll | List payroll records |
| POST | /payroll | Create payroll |

See `API_DOCS.md` for complete API documentation.

## Testing

### Test with cURL

```bash
# Health check
curl http://localhost:3000/api/health

# Get all departments
curl http://localhost:3000/api/departments

# Create department
curl -X POST http://localhost:3000/api/departments \
  -H "Content-Type: application/json" \
  -d '{"name":"IT","description":"IT Department"}'

# Check in
curl -X POST http://localhost:3000/api/attendance/check-in \
  -H "Content-Type: application/json" \
  -d '{"employeeId":1}'
```

### Test with Postman
1. Import the Postman collection (to be created)
2. Update environment variables with your base URL
3. Run requests

## Development Scripts

```bash
npm run dev        # Start development server with hot reload
npm run build      # Build TypeScript to JavaScript
npm run start      # Run production build
npm run lint       # Run ESLint
npm run lint:fix   # Fix linting issues
npm run format     # Format code with Prettier
npm run seed       # Seed database with sample data
```

## Code Style

- **Linter**: ESLint
- **Formatter**: Prettier

Run before committing:
```bash
npm run lint:fix
npm run format
```

## Database Models

### Department
```typescript
{
  id: number (PK)
  name: string (unique)
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

### Position
```typescript
{
  id: number (PK)
  title: string
  description?: string
  createdAt: Date
  updatedAt: Date
}
```

### Employee
```typescript
{
  id: number (PK)
  firstName: string
  lastName: string
  email: string (unique)
  phone: string
  hireDate: Date
  salary: decimal
  departmentId: number (FK)
  positionId: number (FK)
  status: 'active' | 'inactive'
  createdAt: Date
  updatedAt: Date
}
```

### Attendance
```typescript
{
  id: number (PK)
  employeeId: number (FK)
  date: Date
  checkIn?: Date
  checkOut?: Date
  status: 'present' | 'absent' | 'late'
  createdAt: Date
  updatedAt: Date
}
```

### Leave
```typescript
{
  id: number (PK)
  employeeId: number (FK)
  startDate: Date
  endDate: Date
  type: 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity'
  status: 'pending' | 'approved' | 'rejected'
  reason?: string
  createdAt: Date
  updatedAt: Date
}
```

### Payroll
```typescript
{
  id: number (PK)
  employeeId: number (FK)
  month: number (1-12)
  year: number
  baseSalary: decimal
  allowances?: decimal
  deductions?: decimal
  netSalary: decimal
  status: 'pending' | 'processed' | 'paid'
  createdAt: Date
  updatedAt: Date
}
```

## Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
- Ensure MySQL is running
- Check DB credentials in `.env`
- Verify database exists: `mysql -u root -p -e "SHOW DATABASES;"`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::3000
```
- Change PORT in `.env`
- Or kill process: `lsof -i :3000` and `kill -9 <PID>`

### TypeScript Compilation Error
```bash
npm run build
```
Check for TypeScript errors and fix them.

## Next Steps

1. Implement authentication (JWT)
2. Add request validation middleware (Zod/Joi)
3. Add email notifications
4. Add file upload (documents, profiles)
5. Add audit logging
6. Add API documentation (Swagger/OpenAPI)
7. Add unit and integration tests
8. Deploy to production

## Support

For issues or questions:
1. Check API_DOCS.md
2. Review code comments
3. Check git logs for recent changes
