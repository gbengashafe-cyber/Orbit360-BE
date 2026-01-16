# Testing API Endpoints with PHP

This guide shows how to test the new Performance, Recruitment, and Complaints endpoints using PHP.

## Prerequisites

- PHP 7.4 or higher
- cURL extension enabled
- Postman or VS Code REST Client (optional)

## Method 1: Using PHP cURL (Native)

### Basic cURL Helper Function

Create a `test-api.php` file:

```php
<?php

class APITester {
    private $baseUrl = 'http://localhost:3000/api/v1';
    
    public function request($method, $endpoint, $data = null) {
        $url = $this->baseUrl . $endpoint;
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
        ]);
        
        if ($data) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $statusCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        return [
            'status' => $statusCode,
            'data' => json_decode($response, true)
        ];
    }
}

$api = new APITester();

// Test
$result = $api->request('GET', '/performance/dashboard');
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

---

## Testing Performance Endpoints

### 1. Get Performance Dashboard

```php
<?php
require 'test-api.php';

// Get dashboard metrics
$result = $api->request('GET', '/performance/dashboard');
echo "Dashboard:\n";
echo json_encode($result['data'], JSON_PRETTY_PRINT);
?>
```

**Expected Response:**
```json
{
  "data": {
    "activeAppraisalCycles": 3,
    "pendingAppraisals": 12,
    "completedAppraisals": 45,
    "activeGoals": 87,
    "avgGoalCompletion": 72.50,
    "avgAppraisalRating": 3.75
  }
}
```

### 2. Create Goal

```php
<?php
require 'test-api.php';

$goalData = [
    'employee_id' => 5,
    'title' => 'Increase Sales by 20%',
    'description' => 'Achieve Q1 sales target of 20% growth',
    'target_value' => 100000,
    'start_date' => '2024-01-01T00:00:00Z',
    'end_date' => '2024-03-31T23:59:59Z',
    'assigned_by' => 'manager@example.com'
];

$result = $api->request('POST', '/performance/goals', $goalData);
echo "Create Goal Response:\n";
echo json_encode($result, JSON_PRETTY_PRINT);

// Check if successful
if ($result['status'] === 201) {
    $goalId = $result['data']['data']['id'];
    echo "\nGoal created with ID: $goalId\n";
}
?>
```

### 3. List Goals

```php
<?php
require 'test-api.php';

// List all goals with pagination
$result = $api->request('GET', '/performance/goals?page=1&rows=10');
echo "Goals List:\n";
echo json_encode($result, JSON_PRETTY_PRINT);

// List specific employee's goals
$result = $api->request('GET', '/performance/goals?employee_id=5&status=in_progress');
echo "\nEmployee 5 Active Goals:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 4. Get Goal by ID

```php
<?php
require 'test-api.php';

$goalId = 1;
$result = $api->request('GET', "/performance/goals/$goalId");
echo "Goal Details:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 5. Update Goal Progress

```php
<?php
require 'test-api.php';

$progressData = [
    'current_progress' => 50000,
    'completion_percentage' => 50,
    'status' => 'in_progress'
];

$result = $api->request('PATCH', '/performance/goals/1/progress', $progressData);
echo "Update Progress Response:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 6. Create Appraisal Cycle

```php
<?php
require 'test-api.php';

$cycleData = [
    'cycle_name' => 'Annual Appraisal 2024',
    'description' => 'Comprehensive performance review for the fiscal year',
    'start_date' => '2024-01-01T00:00:00Z',
    'end_date' => '2024-12-31T23:59:59Z',
    'review_deadline' => '2024-12-15T23:59:59Z',
    'created_by' => 'hr_manager@example.com',
    'department' => 'Engineering'
];

$result = $api->request('POST', '/performance/cycles', $cycleData);
echo "Create Appraisal Cycle:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 7. Activate Appraisal Cycle

```php
<?php
require 'test-api.php';

$result = $api->request('POST', '/performance/cycles/1/activate');
echo "Activate Cycle Response:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 8. Submit Appraisal

```php
<?php
require 'test-api.php';

$appraisalData = [
    'appraisal_cycle_id' => 1,
    'employee_id' => 5,
    'manager_id' => 2,
    'performance_summary' => 'Strong performer meeting all objectives',
    'strengths' => 'Leadership, Problem-solving, Communication',
    'areas_for_improvement' => 'Time management, Report writing'
];

$result = $api->request('POST', '/performance/appraisals', $appraisalData);
echo "Submit Appraisal:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 9. Review Appraisal

```php
<?php
require 'test-api.php';

$reviewData = [
    'overall_rating' => 4.5,
    'goals_achievement' => 90
];

$result = $api->request('POST', '/performance/appraisals/1/review', $reviewData);
echo "Review Appraisal:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

---

## Testing Recruitment Endpoints

### 1. Create Job Posting

```php
<?php
require 'test-api.php';

$jobData = [
    'title' => 'Senior Developer',
    'description' => 'We are looking for an experienced developer to join our team',
    'department' => 'Engineering',
    'location' => 'Remote',
    'employment_type' => 'full_time',
    'salary_range_min' => 100000,
    'salary_range_max' => 150000,
    'requirements' => '5+ years experience with TypeScript and Node.js',
    'created_by' => 'hr@example.com'
];

$result = $api->request('POST', '/recruitment/postings', $jobData);
echo "Create Job Posting:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 2. List Job Postings

```php
<?php
require 'test-api.php';

// Get all postings
$result = $api->request('GET', '/recruitment/postings');
echo "All Job Postings:\n";
echo json_encode($result, JSON_PRETTY_PRINT);

// Get active postings only
$result = $api->request('GET', '/recruitment/postings?status=active');
echo "\nActive Job Postings:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 3. Submit Job Application

```php
<?php
require 'test-api.php';

$applicationData = [
    'job_posting_id' => 1,
    'applicant_name' => 'John Doe',
    'applicant_email' => 'john@example.com',
    'applicant_phone' => '+1234567890',
    'resume_url' => 'https://example.com/resumes/john-doe.pdf',
    'cover_letter' => 'I am interested in this position because...'
];

$result = $api->request('POST', '/recruitment/applications', $applicationData);
echo "Submit Application:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 4. Schedule Interview

```php
<?php
require 'test-api.php';

$interviewData = [
    'interview_date' => '2024-02-20T14:00:00Z',
    'interview_notes' => 'Phone screening'
];

$result = $api->request('POST', '/recruitment/applications/1/schedule-interview', $interviewData);
echo "Schedule Interview:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 5. Get Recruitment Dashboard

```php
<?php
require 'test-api.php';

$result = $api->request('GET', '/recruitment/dashboard/stats');
echo "Recruitment Dashboard:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

---

## Testing Complaint Endpoints

### 1. Create Complaint

```php
<?php
require 'test-api.php';

$complaintData = [
    'employee_id' => 5,
    'complaint_type' => 'working_conditions',
    'title' => 'Poor Office Ventilation',
    'description' => 'The office air conditioning is not functioning properly, causing discomfort.',
    'severity' => 'medium',
    'reported_to' => 'hr@example.com'
];

$result = $api->request('POST', '/complaints', $complaintData);
echo "Create Complaint:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 2. List Complaints (HR Dashboard)

```php
<?php
require 'test-api.php';

// List all complaints
$result = $api->request('GET', '/complaints');
echo "All Complaints:\n";
echo json_encode($result, JSON_PRETTY_PRINT);

// Filter by severity
$result = $api->request('GET', '/complaints?severity=high&status=open');
echo "\nHigh Severity Open Complaints:\n";
echo json_encode($result, JSON_PRETTY_PRINT);

// Filter by type
$result = $api->request('GET', '/complaints?complaint_type=harassment');
echo "\nHarassment Complaints:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

### 3. Resolve Complaint

```php
<?php
require 'test-api.php';

$resolveData = [
    'resolution_notes' => 'Issue investigated and resolved. HVAC system has been repaired.'
];

$result = $api->request('POST', '/complaints/1/resolve', $resolveData);
echo "Resolve Complaint:\n";
echo json_encode($result, JSON_PRETTY_PRINT);
?>
```

---

## Method 2: Using Guzzle HTTP Client

Install via Composer:
```bash
composer require guzzlehttp/guzzle
```

### Example with Guzzle

```php
<?php
require 'vendor/autoload.php';

use GuzzleHttp\Client;

$client = new Client([
    'base_uri' => 'http://localhost:3000/api/v1/',
    'timeout'  => 5.0,
]);

try {
    // Get dashboard
    $response = $client->request('GET', 'performance/dashboard');
    $data = json_decode($response->getBody(), true);
    echo json_encode($data, JSON_PRETTY_PRINT);
    
    // Create goal
    $response = $client->request('POST', 'performance/goals', [
        'json' => [
            'employee_id' => 5,
            'title' => 'Increase Sales by 20%',
            'description' => 'Achieve Q1 sales target',
            'target_value' => 100000,
            'start_date' => '2024-01-01T00:00:00Z',
            'end_date' => '2024-03-31T23:59:59Z',
            'assigned_by' => 'manager@example.com'
        ]
    ]);
    
    echo "Status: " . $response->getStatusCode() . "\n";
    echo json_encode(json_decode($response->getBody(), true), JSON_PRETTY_PRINT);
    
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage();
}
?>
```

---

## Method 3: Using VS Code REST Client Extension

Create `test.http` file:

```http
### Performance Dashboard
GET http://localhost:3000/api/v1/performance/dashboard

### Create Goal
POST http://localhost:3000/api/v1/performance/goals
Content-Type: application/json

{
  "employee_id": 5,
  "title": "Increase Sales by 20%",
  "description": "Achieve Q1 sales target of 20% growth",
  "target_value": 100000,
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-03-31T23:59:59Z",
  "assigned_by": "manager@example.com"
}

### List Goals
GET http://localhost:3000/api/v1/performance/goals?page=1&rows=10

### Create Appraisal Cycle
POST http://localhost:3000/api/v1/performance/cycles
Content-Type: application/json

{
  "cycle_name": "Annual Appraisal 2024",
  "description": "Comprehensive performance review",
  "start_date": "2024-01-01T00:00:00Z",
  "end_date": "2024-12-31T23:59:59Z",
  "review_deadline": "2024-12-15T23:59:59Z",
  "created_by": "hr_manager@example.com"
}

### Submit Appraisal
POST http://localhost:3000/api/v1/performance/appraisals
Content-Type: application/json

{
  "appraisal_cycle_id": 1,
  "employee_id": 5,
  "manager_id": 2,
  "performance_summary": "Strong performer",
  "strengths": "Leadership, Problem-solving",
  "areas_for_improvement": "Time management"
}

### Review Appraisal
POST http://localhost:3000/api/v1/performance/appraisals/1/review
Content-Type: application/json

{
  "overall_rating": 4.5,
  "goals_achievement": 90
}

### Create Job Posting
POST http://localhost:3000/api/v1/recruitment/postings
Content-Type: application/json

{
  "title": "Senior Developer",
  "description": "We are looking for an experienced developer",
  "department": "Engineering",
  "location": "Remote",
  "employment_type": "full_time",
  "salary_range_min": 100000,
  "salary_range_max": 150000,
  "requirements": "5+ years experience",
  "created_by": "hr@example.com"
}

### Submit Application
POST http://localhost:3000/api/v1/recruitment/applications
Content-Type: application/json

{
  "job_posting_id": 1,
  "applicant_name": "John Doe",
  "applicant_email": "john@example.com",
  "applicant_phone": "+1234567890",
  "resume_url": "https://example.com/resumes/john-doe.pdf",
  "cover_letter": "I am interested in this position"
}

### Create Complaint
POST http://localhost:3000/api/v1/complaints
Content-Type: application/json

{
  "employee_id": 5,
  "complaint_type": "working_conditions",
  "title": "Poor Office Ventilation",
  "description": "The office AC is not functioning properly",
  "severity": "medium",
  "reported_to": "hr@example.com"
}

### List Complaints
GET http://localhost:3000/api/v1/complaints?severity=high&status=open

### Resolve Complaint
POST http://localhost:3000/api/v1/complaints/1/resolve
Content-Type: application/json

{
  "resolution_notes": "Issue has been resolved. HVAC system repaired."
}
```

Then click "Send Request" on each request block in VS Code.

---

## Common HTTP Status Codes

| Status | Meaning |
|--------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 204 | No Content (DELETE) |
| 400 | Bad Request (validation error) |
| 404 | Not Found |
| 500 | Server Error |

---

## Error Handling in PHP

```php
<?php
require 'test-api.php';

$goalData = [
    'employee_id' => 5,
    'title' => 'Test',  // Too short - will fail validation
    'description' => 'Goal description',
    'start_date' => '2024-01-01T00:00:00Z',
    'end_date' => '2024-03-31T23:59:59Z'
];

$result = $api->request('POST', '/performance/goals', $goalData);

if ($result['status'] === 201) {
    echo "Success: Goal created\n";
    echo "Goal ID: " . $result['data']['data']['id'] . "\n";
} else {
    echo "Error (Status: " . $result['status'] . ")\n";
    echo "Message: " . $result['data']['error']['message'] . "\n";
}
?>
```

---

## Tips for Testing

1. **Always verify dates are in ISO 8601 format**: `2024-01-15T10:30:00Z`
2. **Pagination defaults**: page=1, rows=10
3. **Status codes matter**: 201 = created, 200 = ok, 400 = validation error
4. **Use filter parameters**: `?status=active&severity=high`
5. **Check error messages**: They tell you exactly what's wrong
