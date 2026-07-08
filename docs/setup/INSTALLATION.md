# TeamFlow - Setup & Installation Guide

## System Requirements

- **Node.js**: 18.x or later
- **npm**: 9.x or later
- **PostgreSQL**: 12.x or later
- **Git**: 2.x or later
- **RAM**: 2GB minimum
- **Disk**: 500MB minimum

## Installation Steps

### 1. Clone Repository

```bash
git clone <repository-url>
cd teamflow
```

### 2. Install Dependencies

```bash
# Install root dependencies
npm install

# Dependencies installed for both apps automatically
```

### 3. Create Environment File

```bash
cp .env.example .env
```

### 4. Configure Database

#### Option A: Local PostgreSQL

```bash
# Create user and database
sudo -u postgres psql

CREATE USER teamflow_user WITH PASSWORD 'teamflow_password';
CREATE DATABASE teamflow OWNER teamflow_user;
GRANT ALL PRIVILEGES ON DATABASE teamflow TO teamflow_user;
\q
```

#### Option B: Docker PostgreSQL

```bash
docker run --name teamflow-db \
  -e POSTGRES_USER=teamflow_user \
  -e POSTGRES_PASSWORD=teamflow_password \
  -e POSTGRES_DB=teamflow \
  -p 5432:5432 \
  -d postgres:15
```

### 5. Update Environment Variables

Edit `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USER=teamflow_user
DB_PASSWORD=teamflow_password
DB_NAME=teamflow

# JWT
JWT_SECRET=your-strong-secret-key-here-change-this

# Ports
PORT=5000
CLIENT_URL=http://localhost:3000
API_URL=http://localhost:5000
```

### 6. Run Database Migrations

```bash
npm run db:migrate
```

Expected output:
```
✓ Migration completed: 001_initial_schema.sql
✓ Migration completed successfully
```

### 7. Seed Database (Optional)

```bash
npm run db:seed
```

This creates demo users and sample data:
- 5 users with different roles
- 2 projects
- 3 sample tasks
- Activity logs

### 8. Start Development Environment

```bash
npm run dev
```

You should see:
```
Frontend: http://localhost:3000
Backend: http://localhost:5000
```

## Verification

### Check Backend Health

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-07-08T20:53:36Z"}
```

### Check Frontend

Open http://localhost:3000 in browser

You should see the TeamFlow login page

## Demo Login

Use these credentials to test:

```
Admin Account:
  Email: admin@teamflow.local
  Password: admin123

Project Manager:
  Email: pm@teamflow.local
  Password: pm123

Developer:
  Email: dev1@teamflow.local
  Password: dev123

Reviewer:
  Email: reviewer@teamflow.local
  Password: review123
```

## Database Management

### View Database

```bash
psql -U teamflow_user -d teamflow -h localhost
```

### Useful Queries

```sql
-- List all users
SELECT id, email, username, role FROM users;

-- List all projects
SELECT id, name, key, owner_id FROM projects;

-- List all tasks
SELECT id, title, status, priority FROM tasks;

-- Check migrations
SELECT * FROM migrations;
```

### Reset Database

```bash
# Drop and recreate
npm run db:reset

# Then re-seed
npm run db:seed
```

## Troubleshooting

### Database Connection Error

```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Solution**:
1. Check PostgreSQL is running: `pg_isready`
2. Verify connection string in `.env`
3. Check credentials match database setup

### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solution**:
1. Change port in `.env`: `PORT=5001`
2. Or kill process: `lsof -ti:5000 | xargs kill -9`

### Module Not Found

```
Error: Cannot find module 'express'
```

**Solution**: Reinstall dependencies

```bash
rm -rf node_modules apps/*/node_modules
npm install
```

### Migration Failed

```
Error: relation "users" already exists
```

**Solution**: Database already migrated. Check migrations table:

```bash
psql -U teamflow_user -d teamflow -c "SELECT * FROM migrations;"
```

## Production Deployment

### Environment Variables

Create `.env.production`:

```env
NODE_ENV=production
PORT=5000
JWT_SECRET=<strong-random-secret>
DB_HOST=<production-db-host>
DB_USER=<prod-user>
DB_PASSWORD=<strong-password>
```

### Build for Production

```bash
npm run build
```

### Start Production Server

```bash
NODE_ENV=production npm start
```

## Database Backup

### Backup

```bash
pg_dump -U teamflow_user -d teamflow > backup_$(date +%Y%m%d).sql
```

### Restore

```bash
psql -U teamflow_user -d teamflow < backup_20260708.sql
```

## Monitoring

### Check Logs

```bash
# Frontend logs (console)
# Check browser console (F12)

# Backend logs
# Check terminal where npm run dev was executed
```

### Database Performance

```sql
-- Check slow queries
SELECT * FROM pg_stat_statements 
WHERE mean_exec_time > 1000
ORDER BY mean_exec_time DESC;
```

## Development Tools

### API Testing

Use Postman or curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@teamflow.local","password":"admin123"}'

# Get projects (requires token)
curl http://localhost:5000/api/projects \
  -H "Authorization: Bearer <token>"
```

### Database Browser

Install DBeaver or pgAdmin for GUI access

## Next Steps

1. ✅ Installation complete
2. 📖 Read [Business Rules](./BUSINESS_RULES.md)
3. 🏗️ Review [Architecture](./architecture/ARCHITECTURE.md)
4. 📚 Check [API Reference](./api/API.md)
5. 🧪 Run tests: `npm run test`
6. 🚀 Start developing!

## Support

For issues:
1. Check troubleshooting section above
2. Review logs carefully
3. Verify all prerequisites are met
4. Check database connection

---

*Version: 1.0.0*  
*Last Updated: 2026-07-08*
