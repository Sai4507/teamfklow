# TeamFlow - System Architecture

## Overview

TeamFlow is a 3-tier web application:

```
┌─────────────────────────┐
│   React Frontend        │  Client Layer
│   (SPA, Vite)          │
└───────────┬─────────────┘
            │ HTTP/REST
            ↓
┌─────────────────────────┐
│  Express.js Backend     │  Business Logic Layer
│  (Node.js)             │
└───────────┬─────────────┘
            │ SQL
            ↓
┌─────────────────────────┐
│  PostgreSQL Database    │  Data Layer
│  (Relational)          │
└─────────────────────────┘
```

## Frontend Architecture

### Technology Stack
- **React 18**: Component-based UI framework
- **Vite**: Lightning-fast build tool
- **Zustand**: Lightweight state management
- **React Router**: Client-side routing
- **Tailwind CSS**: Utility-first styling
- **Axios**: HTTP client for API calls

### Component Structure

```
src/
  ├── components/        # Reusable UI components
  ├── pages/            # Page-level components
  ├── context/          # Zustand stores (state management)
  ├── services/         # API service functions
  ├── utils/            # Helper utilities
  ├── styles/           # CSS and styling
  ├── App.jsx           # Root component
  └── main.jsx          # Entry point
```

### State Management (Zustand)

```javascript
// Auth store
useAuthStore() {
  user, token, login(), logout(), initialize()
}

// Theme store
useThemeStore() {
  theme, toggleTheme(), setTheme()
}

// Project store (TBD)
useProjectStore() {
  projects, currentProject, ...
}
```

### Data Flow
1. Component mounts
2. useEffect hooks dispatch API calls
3. Data stored in Zustand stores
4. Components subscribe to store changes
5. UI re-renders on state updates

## Backend Architecture

### Technology Stack
- **Express.js**: Web framework
- **Node.js**: Runtime environment
- **PostgreSQL**: Relational database
- **JWT**: Authentication mechanism
- **Bcryptjs**: Password hashing

### Application Structure

```
src/
  ├── config/          # Configuration (database, JWT, etc.)
  ├── controllers/     # Request handlers
  ├── routes/          # API route definitions
  ├── middleware/      # Auth, logging, error handling
  ├── services/        # Business logic (TBD)
  ├── utils/           # Helper functions
  ├── database/        # Migrations and seeds
  └── index.js         # Server entry point
```

### Request-Response Cycle

```
HTTP Request
    ↓
Express Middleware (CORS, bodyParser, etc.)
    ↓
Auth Middleware (verify JWT)
    ↓
Route Handler
    ↓
Controller Function
    ↓
Database Query
    ↓
Response Serialization
    ↓
HTTP Response
```

### Controller Pattern

```javascript
export const createTask = async (req, res) => {
  try {
    // Validate input
    // Check permissions
    // Query database
    // Log activity
    // Create notifications
    // Send response
  } catch (error) {
    // Error handling
  }
}
```

## Database Architecture

### Schema Design

**Core Entities**
- Users: Authentication and profiles
- Projects: Team workspaces
- Tasks: Work items
- RCAs: Incident analysis

**Relationships**
- Users ← → Projects (many-to-many via project_members)
- Users → Tasks (assignee, reporter)
- Tasks ← → Tasks (parent/child, dependencies)
- Tasks ← → Comments
- RCAs ← → Comments
- Users ← → Notifications

**Indexing Strategy**
- Primary keys on all tables
- Foreign key indexes
- Search column indexes (email, username)
- Status and date indexes for filtering

### Table Statistics

| Table | Purpose | Rows |
|-------|---------|------|
| users | User accounts | 100-1K |
| projects | Team projects | 10-100 |
| project_members | Membership | 50-500 |
| tasks | Work items | 1K-10K |
| task_dependencies | Task relationships | 500-5K |
| comments | Discussions | 10K-100K |
| rcas | Incident reports | 100-1K |
| notifications | User notifications | 100K+ |
| activity_logs | Audit trail | 1M+ |

## API Architecture

### Endpoint Organization

```
/api
  /auth          # Authentication
  /projects      # Project management
    /:projectId
      /members   # Team management
      /tasks     # Task management
  /tasks         # Task operations
  /rcas          # RCA management
  /comments      # Commenting
  /attachments   # File operations
  /notifications # Notifications
  /search        # Global search
```

### Error Handling

```javascript
// Structured error response
{
  error: "Descriptive message",
  code: "ERROR_CODE",
  details: { ... }
}
```

### Authentication Flow

```
User enters credentials
    ↓
POST /auth/login
    ↓
Verify password
    ↓
Generate JWT token + refresh token
    ↓
Store refresh token in DB
    ↓
Return tokens to client
    ↓
Client stores in localStorage
    ↓
Include token in Authorization header
```

## Security Architecture

### Authentication
- Password hashing: Bcryptjs (10 rounds)
- JWT tokens: 7-day expiration
- Refresh tokens: 30-day expiration
- Token refresh mechanism for continuous sessions

### Authorization
- Role-based access control (RBAC)
- Per-project permissions
- Middleware-based verification
- Resource ownership checks

### Data Protection
- SQL parameterized queries (prevent injection)
- Input validation on all endpoints
- CORS policy enforcement
- Sensitive data encryption (passwords)

## Performance Considerations

### Database Optimization
- Indexed columns for frequent queries
- Connection pooling (20 concurrent)
- Query result pagination
- Lazy loading relationships

### Frontend Optimization
- Code splitting with Vite
- Lazy component loading
- Zustand for efficient state updates
- Tailwind CSS purging in production

### Caching Strategy
- Client-side caching via localStorage
- Browser caching for static assets
- No server-side caching (TTL: 0)
- Real-time data updates

## Scalability

### Current Limitations
- Single database instance
- File storage on local disk
- No message queue
- No search indexing

### Future Improvements
- Database replication
- Cloud storage (S3, GCS)
- Message queue (RabbitMQ, Redis)
- Full-text search (Elasticsearch)
- Caching layer (Redis)
- CDN for static assets

## Deployment Architecture

### Development
```
npm run dev
├── Frontend: http://localhost:3000
└── Backend: http://localhost:5000
```

### Production
```
Docker Containers
├── Frontend (Nginx)
├── Backend (Node.js)
└── Database (PostgreSQL)
```

## Monitoring & Logging

### Backend Logging
- Query execution time (> 1s logged)
- Error stack traces
- Request/response logging (dev only)
- Activity event logging

### Frontend Logging
- Component errors
- API errors
- User actions (future)
- Performance metrics (future)

## Design Decisions

### Why Zustand over Redux?
- Simpler API
- Smaller bundle size
- Less boilerplate
- Sufficient for current needs

### Why Express.js?
- Minimal framework, easy to extend
- Large ecosystem
- Good community support
- Perfect for REST APIs

### Why PostgreSQL?
- ACID compliance
- Complex queries
- Relational data model
- Excellent performance

### Why JWT over sessions?
- Stateless authentication
- Better for distributed systems
- Easier to scale horizontally
- Mobile-friendly

---

*Last Updated: 2026-07-08*
