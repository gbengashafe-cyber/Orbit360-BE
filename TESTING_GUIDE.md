# Testing Leave & Exit Management APIs

## Prerequisites
1. MySQL database running on localhost:3306
2. Database `orbit360_hr` created
3. Node.js installed

## Quick Start

### 1. Start the Server
```bash
npm run dev
```

The server will start on http://localhost:3000

### 2. Sync Database (Create Tables)
```bash
npm run sync
```

This will create the new tables:
- `leaves`
- `leave_balances`
- `leave_types`
- `exits`

### 3. Test the Endpoints

You can use:
- **VS Code REST Client Extension** - Open `test-leave-exit.http` and click "Send Request"
- **Postman** - Import the requests from `test-leave-exit.http`
- **cURL** - See examples below

## cURL Test Examples

### Leave Management

#### Create Leave Request
```bash
curl -X POST http://localhost:3000/api/leaves \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-05T00:00:00.000Z",
    "type": "vacation",
    "reason": "Family vacation"
  }'
```

#### Get All Leaves
```bash
curl http://localhost:3000/api/leaves?page=1&rows=10
```

#### Get Leave Types
```bash
curl http://localhost:3000/api/leaves/types
```

#### Get Leave Balance
```bash
curl http://localhost:3000/api/leaves/balance/1?year=2024
```

#### Approve Leave
```bash
curl -X PATCH http://localhost:3000/api/leaves/1/status \
  -H "Content-Type: application/json" \
  -d '{"action": "approved"}'
```

### Exit Management

#### Create Exit Request
```bash
curl -X POST http://localhost:3000/api/exits \
  -H "Content-Type: application/json" \
  -d '{
    "employeeId": 1,
    "exitType": "resignation",
    "exitDate": "2024-03-01T00:00:00.000Z",
    "reason": "Better opportunity"
  }'
```

#### Get All Exits
```bash
curl http://localhost:3000/api/exits?page=1&rows=10
```

#### Approve Exit
```bash
curl -X PATCH http://localhost:3000/api/exits/1/approve \
  -H "Content-Type: application/json" \
  -d '{"action": "approved"}'
```

## Testing Notes

1. **Authentication**: Currently using mock auth (user id: 1, role: ADMIN, department: hr)
2. **Employee ID**: Make sure employee with ID 1 exists in your database
3. **Leave Types**: Valid types are: `sick`, `vacation`, `personal`, `maternity`, `paternity`
4. **Exit Types**: Valid types are: `resignation`, `termination`, `retirement`, `contract_end`
5. **Date Format**: Use ISO 8601 format: `YYYY-MM-DDTHH:mm:ss.sssZ`

## Expected Responses

### Success Response (201 Created)
```json
{
  "data": {
    "id": 1,
    "employeeId": 1,
    "startDate": "2024-02-01T00:00:00.000Z",
    "endDate": "2024-02-05T00:00:00.000Z",
    "type": "vacation",
    "reason": "Family vacation",
    "status": "pending"
  },
  "message": "Leave request created successfully"
}
```

### Error Response (400 Bad Request)
```json
{
  "message": "Employee ID is required",
  "statusCode": 400
}
```

## Troubleshooting

1. **Port already in use**: Change PORT in `.env` file
2. **Database connection error**: Check MySQL is running and credentials in `.env`
3. **Table doesn't exist**: Run `npm run sync` to create tables
4. **Foreign key constraint**: Ensure employee with the ID exists in `employees` table
