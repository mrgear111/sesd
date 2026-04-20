# Quick Start Guide

## Getting Started

### 1. Install Dependencies
```bash
cd frontend
npm install
```

### 2. Configure Environment
Create a `.env.local` file:
```env
NEXT_PUBLIC_API_URL=https://sesd-nqw8.onrender.com
```

For local backend development:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run Development Server
```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### 4. Build for Production
```bash
npm run build
npm start
```

## User Flow

### First Time Setup

1. **Register**: Go to `/register` and create an account
   - Username (3-50 characters)
   - Email (valid email format)
   - Password (minimum 8 characters)

2. **Login**: Go to `/login` with your credentials
   - JWT token stored in localStorage
   - Redirects to `/projects`

### Working with Projects

1. **Create Project**: Click "New Project" button
   - Enter project name (required, max 200 chars)
   - Add description (optional)
   - Click "Create Project"

2. **View Project**: Click on any project card
   - Opens project details page
   - Default tab: Overview

3. **Edit Project** (Owner only):
   - Click "Edit" button in project header
   - Update name or description
   - Click "Update Project"

4. **Delete Project** (Owner only):
   - Click "Delete" button in project header
   - Confirm deletion
   - Redirects to projects list

### Managing Tasks

1. **View Tasks**: Go to "Tasks" tab in project details
   - See Kanban board with workflow columns
   - Tasks organized by workflow (To Do, In Progress, Done, etc.)

2. **Create Task**: Click "New Task" button
   - Title (required, max 200 chars)
   - Description (optional)
   - Priority: Low, Medium, or High
   - Workflow: Select column
   - Assignee: Select user or leave unassigned
   - Click "Create Task"

3. **Move Task**: Drag and drop task card to different workflow column
   - Task updates automatically
   - No confirmation needed

4. **View Task Details**: Click on any task card
   - Opens modal with full details
   - Shows comments section

5. **Edit Task**: In task details modal
   - Click edit icon (pencil)
   - Update any field
   - Click "Save Changes"

6. **Delete Task**: In task details modal
   - Click delete icon (trash)
   - Confirm deletion

7. **Filter Tasks**:
   - Use "All Assignees" dropdown to filter by user
   - Use "All Priorities" dropdown to filter by priority
   - Click "Clear Filters" to reset

### Adding Comments

1. **View Comments**: Open task details modal
   - Scroll to comments section
   - See all comments with author and timestamp

2. **Add Comment**:
   - Type in comment textarea
   - Click "Add Comment"
   - Comment appears immediately

3. **Delete Comment** (Own comments only):
   - Click delete icon on your comment
   - Confirm deletion

### Managing Sprints

1. **View Sprints**: Go to "Sprints" tab in project details
   - See all sprints sorted by state
   - Active sprints shown first

2. **Create Sprint**: Click "New Sprint" button
   - Name (required, max 200 chars)
   - Start Date (required)
   - End Date (required)
   - State: Planned, Active, or Completed
   - Click "Create Sprint"

3. **Edit Sprint**: Click edit icon on sprint card
   - Update any field
   - Click "Update Sprint"

4. **Delete Sprint**: Click delete icon on sprint card
   - Confirm deletion
   - Tasks in sprint are not deleted

5. **View Sprint Progress**:
   - Progress bar shows completion percentage
   - Based on tasks in "Done" workflow
   - See task count and preview

### Viewing Members

1. **View Members**: Go to "Members" tab in project details
   - See all project members
   - Owner badge shown for project owner
   - Member badge for other users

## Tips & Tricks

### Keyboard Navigation
- **Tab**: Navigate between form fields
- **Enter**: Submit forms
- **Escape**: Close modals (when implemented)

### Drag and Drop
- Click and hold task card
- Drag to target workflow column
- Release to drop
- Works on desktop and tablet

### Filters
- Combine assignee and priority filters
- Filters apply to all workflow columns
- Clear filters to see all tasks

### Mobile Usage
- Swipe to scroll Kanban board horizontally
- Tap task card to view details
- Use hamburger menu for navigation (if added)

### Performance
- Tasks load once per project visit
- Filters apply client-side (instant)
- Drag-drop updates immediately
- Comments refresh after adding

## Troubleshooting

### "Unauthorized" Error
- Token expired or invalid
- Solution: Logout and login again

### Tasks Not Loading
- Check network connection
- Verify API URL in `.env.local`
- Check browser console for errors

### Drag-Drop Not Working
- Ensure JavaScript is enabled
- Try refreshing the page
- Check if using supported browser

### Modal Not Closing
- Click outside modal area
- Click X button in modal header
- Refresh page if stuck

### Build Errors
```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild
npm run build
```

## Browser Support

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Responsive design

## API Endpoints Reference

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Projects
- `GET /api/projects` - List all projects
- `POST /api/projects` - Create project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/projects/:projectId/tasks` - List tasks
- `POST /api/projects/:projectId/tasks` - Create task
- `PATCH /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task
- `PATCH /api/tasks/:id/workflow` - Move task

### Sprints
- `GET /api/projects/:projectId/sprints` - List sprints
- `POST /api/projects/:projectId/sprints` - Create sprint
- `PATCH /api/sprints/:id` - Update sprint
- `DELETE /api/sprints/:id` - Delete sprint

### Comments
- `GET /api/tasks/:taskId/comments` - List comments
- `POST /api/tasks/:taskId/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

### Users
- `GET /api/users` - List all users

## Next Steps

1. Explore the Overview tab for project statistics
2. Create your first task in the Tasks tab
3. Set up a sprint in the Sprints tab
4. Invite team members (via backend API)
5. Start tracking your project progress!

## Need Help?

- Check `IMPLEMENTATION.md` for detailed feature documentation
- Review `README.md` for project overview
- Check browser console for error messages
- Verify backend API is running and accessible
