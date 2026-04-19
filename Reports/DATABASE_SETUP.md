# Database Setup Guide

This guide explains how to set up and manage the PostgreSQL database for the Agile Project Management Dashboard.

## Prerequisites

- PostgreSQL 15+ installed and running
- Node.js 18+ installed
- npm or yarn package manager

## Database Configuration

1. Create a PostgreSQL database:
```bash
createdb agile_dashboard
```

2. Copy the example environment file and configure your database credentials:
```bash
cp .env.example .env
```

3. Edit `.env` and update the database configuration:
```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agile_dashboard
DB_USER=postgres
DB_PASSWORD=your_password_here
```

## Database Schema

The application uses 8 database tables:

1. **users** - User accounts with authentication credentials
2. **projects** - Project information and ownership
3. **project_members** - Many-to-many relationship between users and projects with roles
4. **workflows** - Customizable workflow stages for each project
5. **tasks** - Task items with assignments, priorities, and workflow status
6. **comments** - Comments on tasks
7. **sprints** - Sprint planning and tracking
8. **audit_logs** - Complete audit trail of all system actions

## Running Migrations

The migration system automatically tracks which migrations have been applied and only runs new ones.

### Apply all pending migrations:
```bash
npm run migrate
```

This will:
- Create a `migrations_history` table to track applied migrations
- Execute all `.sql` files in `src/migrations/` in alphabetical order
- Skip migrations that have already been applied
- Run each migration in a transaction (rollback on error)

### Migration files:
- `001_create_users.sql` - Users table with authentication
- `002_create_projects.sql` - Projects table
- `003_create_project_members.sql` - Project membership with roles
- `004_create_workflows.sql` - Workflow stages
- `005_create_tasks.sql` - Tasks with assignments and priorities
- `006_create_comments.sql` - Task comments
- `007_create_sprints.sql` - Sprint management
- `008_create_audit_logs.sql` - Audit logging

## Seeding Development Data

The seed script populates the database with sample data for development and testing.

### Run the seed script:
```bash
npm run seed
```

This will:
- Clear all existing data from tables
- Create 3 sample users
- Create 2 sample projects
- Create default workflows (To Do, In Progress, Done) for each project
- Add project members with different roles
- Create sample tasks in various workflow stages

### Sample credentials created:
- **Admin User**: admin@example.com / password123
- **Developer**: john@example.com / password123
- **QA Tester**: jane@example.com / password123

## Database Connection Pool

The application uses a Singleton pattern for database connection pooling with the following configuration:

- **Minimum connections**: 2
- **Maximum connections**: 10
- **Idle timeout**: 30 seconds
- **Connection timeout**: 5 seconds

The connection pool is automatically managed and shared across all repository instances.

## Troubleshooting

### Migration fails with "relation already exists"
This means the table was created outside the migration system. You can either:
1. Drop the database and recreate it: `dropdb agile_dashboard && createdb agile_dashboard`
2. Manually insert the migration name into `migrations_history` table

### Cannot connect to database
- Verify PostgreSQL is running: `pg_isready`
- Check your `.env` file has correct credentials
- Ensure the database exists: `psql -l | grep agile_dashboard`

### Seed script fails
- Make sure migrations have been run first: `npm run migrate`
- Check that the database is empty or run seed again (it clears data automatically)

## Database Schema Diagram

```
users
  ├─ id (PK)
  ├─ username
  ├─ email (UNIQUE)
  ├─ password_hash
  └─ created_at

projects
  ├─ id (PK)
  ├─ name
  ├─ description
  ├─ owner_id (FK → users.id)
  └─ created_at

project_members
  ├─ project_id (FK → projects.id) (PK)
  ├─ user_id (FK → users.id) (PK)
  └─ role (Admin, PM, Dev, QA, Viewer)

workflows
  ├─ id (PK)
  ├─ project_id (FK → projects.id)
  ├─ name
  └─ sequence_order

tasks
  ├─ id (PK)
  ├─ project_id (FK → projects.id)
  ├─ workflow_id (FK → workflows.id)
  ├─ title
  ├─ description
  ├─ assignee_id (FK → users.id)
  ├─ reporter_id (FK → users.id)
  ├─ due_date
  ├─ priority (Low, Medium, High)
  ├─ created_at
  └─ updated_at

comments
  ├─ id (PK)
  ├─ task_id (FK → tasks.id)
  ├─ user_id (FK → users.id)
  ├─ content
  └─ created_at

sprints
  ├─ id (PK)
  ├─ project_id (FK → projects.id)
  ├─ name
  ├─ start_date
  ├─ end_date
  ├─ state (Planned, Active, Completed)
  └─ created_at

audit_logs
  ├─ id (PK)
  ├─ user_id (FK → users.id)
  ├─ action_type
  ├─ entity_type
  ├─ entity_id
  ├─ details (JSONB)
  └─ created_at
```

## Foreign Key Constraints

The schema enforces referential integrity with the following cascade rules:

- **ON DELETE CASCADE**: Deleting a parent record automatically deletes child records
  - users → projects, project_members, comments, audit_logs
  - projects → project_members, workflows, tasks, sprints
  - tasks → comments
  - workflows → (none, uses RESTRICT)

- **ON DELETE RESTRICT**: Prevents deletion if child records exist
  - workflows ← tasks (cannot delete workflow if tasks exist)
  - users ← tasks.reporter_id (cannot delete user who reported tasks)

- **ON DELETE SET NULL**: Sets foreign key to NULL when parent is deleted
  - users ← tasks.assignee_id (unassigns tasks when user is deleted)

## Indexes

All foreign key columns have indexes for optimal query performance:
- users.email
- projects.owner_id
- project_members.user_id
- workflows.project_id
- tasks.project_id, workflow_id, assignee_id, reporter_id
- comments.task_id, user_id
- sprints.project_id
- audit_logs.user_id, (entity_type, entity_id), created_at DESC
