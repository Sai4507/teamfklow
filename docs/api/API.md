# TeamFlow - Complete API Reference

## Base URL
`http://localhost:5000/api`

## Authentication
All endpoints (except `/auth/register` and `/auth/login`) require:
```
Authorization: Bearer <JWT_TOKEN>
```

## Authentication Endpoints

### Register User
- **Endpoint**: `POST /auth/register`
- **Body**: `{ email, username, password, firstName?, lastName? }`
- **Response**: `{ user, token, refreshToken }`

### Login
- **Endpoint**: `POST /auth/login`
- **Body**: `{ email, password }`
- **Response**: `{ user, token, refreshToken }`

### Refresh Token
- **Endpoint**: `POST /auth/refresh`
- **Body**: `{ refreshToken }`
- **Response**: `{ token }`

### Get Current User
- **Endpoint**: `GET /auth/me`
- **Response**: `{ id, email, username, role, theme, ... }`

### Update Profile
- **Endpoint**: `PUT /auth/profile`
- **Body**: `{ firstName?, lastName?, theme? }`
- **Response**: Updated user object

### Logout
- **Endpoint**: `POST /auth/logout`
- **Body**: `{ refreshToken }`

## Project Endpoints

### Create Project
- **Endpoint**: `POST /projects`
- **Body**: `{ name, description?, key }`
- **Response**: Project object

### List Projects
- **Endpoint**: `GET /projects?page=1&limit=20`
- **Response**: `{ projects, total, page, limit }`

### Get Project
- **Endpoint**: `GET /projects/:projectId`
- **Response**: Project object

### Update Project
- **Endpoint**: `PUT /projects/:projectId`
- **Body**: `{ name?, description? }`
- **Response**: Updated project

### Delete Project
- **Endpoint**: `DELETE /projects/:projectId`

### Add Project Member
- **Endpoint**: `POST /projects/:projectId/members`
- **Body**: `{ userId, role }`

### Remove Project Member
- **Endpoint**: `DELETE /projects/:projectId/members/:memberId`

### List Project Members
- **Endpoint**: `GET /projects/:projectId/members`

## Task Endpoints

### Create Task
- **Endpoint**: `POST /projects/:projectId/tasks`
- **Body**: `{ title, description?, priority?, assigneeId?, dueDate?, labels? }`
- **Response**: Task object

### List Project Tasks
- **Endpoint**: `GET /projects/:projectId/tasks?status=todo&priority=high`
- **Query**: `page, limit, status, priority, assigneeId`
- **Response**: `{ tasks, total, page, limit }`

### Get Task
- **Endpoint**: `GET /tasks/:taskId`
- **Response**: Task with comments, attachments, dependencies

### Update Task
- **Endpoint**: `PUT /tasks/:taskId`
- **Body**: `{ title?, description?, status?, priority?, assigneeId?, dueDate? }`

### Delete Task
- **Endpoint**: `DELETE /tasks/:taskId`

## Task Statuses
- `todo`
- `in_progress`
- `review`
- `done`
- `blocked`

## Task Priorities
- `low`
- `medium`
- `high`
- `critical`

## User Roles
- `admin` - Full system access
- `project_manager` - Project management
- `developer` - Task execution
- `reviewer` - Code/work review

## Response Format

### Success Response
```json
{
  "id": "uuid",
  "data": { ... }
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Status Codes
- `200` - OK
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `500` - Server Error

## Pagination
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20, max: 100)

## To Be Implemented
- Comment endpoints
- Attachment upload/download
- RCA endpoints
- Notification endpoints
- Search endpoints
- Dashboard/analytics endpoints
