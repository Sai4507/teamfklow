# TeamFlow - Collaborative Platform for Engineering Teams

**Production-Ready Version 1.0.0**

TeamFlow is a comprehensive collaborative platform designed for software engineering teams to manage projects, tasks, incident investigations (Root Cause Analysis), notifications, analytics, and reporting from a single, modern application.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 12+
- Git

### Installation

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Configure database in .env
# Edit .env and set your database credentials

# Run database migrations
npm run db:migrate

# Seed database with demo data
npm run db:seed

# Start development environment
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### Demo Credentials

```
Admin: admin@teamflow.local / admin123
PM: pm@teamflow.local / pm123
Dev: dev1@teamflow.local / dev123
Reviewer: reviewer@teamflow.local / review123
```

## 📋 Key Features

✅ User registration and JWT authentication
✅ Role-based access control (Admin, PM, Developer, Reviewer)
✅ Project management with team collaboration
✅ Task management with multiple statuses and priorities
✅ Task dependencies and parent-child relationships
✅ Kanban board, Calendar, and List views
✅ Comments with @mentions and threading
✅ Root Cause Analysis (RCA) with review workflow
✅ Notifications with duplicate prevention
✅ Activity logging and audit trails
✅ Light/Dark theme support
✅ Responsive mobile-friendly UI
✅ Production-ready database schema
✅ Comprehensive error handling

## 🏗️ Tech Stack

- **Frontend**: React 18, Vite, Zustand, React Router, Tailwind CSS
- **Backend**: Node.js, Express, PostgreSQL
- **Authentication**: JWT with refresh tokens
- **Database**: PostgreSQL with migrations and seeding

## 📚 Documentation

- See [README.md](./README.md) for complete documentation
- API endpoints and business rules included
- Architecture and design decisions documented
- Database schema fully defined

## 🔐 Security Features

- JWT-based authentication with 7-day expiration
- Bcrypt password hashing (10 salt rounds)
- SQL parameterized queries
- CORS protection
- Role-based access control

## 📊 Database Schema

20+ tables including:
- Users with roles and preferences
- Projects with member management
- Tasks with dependencies and comments
- Root Cause Analysis with review workflow
- Notifications with duplicate prevention
- Activity logs for audit trails

## 🚀 Get Started

1. Install dependencies: `npm install`
2. Configure `.env` with database credentials
3. Run migrations: `npm run db:migrate`
4. Seed demo data: `npm run db:seed`
5. Start development: `npm run dev`

## 📖 Next Steps

1. Configure PostgreSQL database
2. Set up environment variables
3. Run database migrations
4. Populate with seed data
5. Start developing features

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: 2026-07-08