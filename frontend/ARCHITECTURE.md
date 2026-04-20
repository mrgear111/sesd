# Frontend Architecture

## Component Hierarchy

```
App Layout (layout.tsx)
│
├── Home Page (page.tsx)
│
├── Login Page (login/page.tsx)
│
├── Register Page (register/page.tsx)
│
└── Projects Page (projects/page.tsx)
    │
    └── Project Details Page (projects/[id]/page.tsx)
        ├── Navbar
        ├── Overview Tab
        │   ├── Project Info Card
        │   ├── Workflows Card
        │   └── Statistics Card
        │
        ├── Tasks Tab
        │   └── KanbanBoard
        │       ├── Filter Controls
        │       ├── Workflow Columns (dynamic)
        │       │   └── Task Cards (draggable)
        │       ├── Create Task Modal
        │       └── TaskDetailsModal
        │           ├── Task Info Display
        │           ├── Edit Form
        │           └── Comments Section
        │
        ├── Sprints Tab
        │   └── SprintList
        │       ├── Sprint Cards
        │       │   ├── Progress Bar
        │       │   └── Task Preview
        │       ├── Create Sprint Modal
        │       └── Edit Sprint Modal
        │
        └── Members Tab
            └── Members List
```

## Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                         User Action                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    React Component                           │
│  (useState, useEffect, event handlers)                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Client                              │
│  (frontend/lib/api.ts)                                       │
│  - Handles authentication (JWT token)                        │
│  - Makes HTTP requests                                       │
│  - Error handling                                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Backend API                               │
│  (https://sesd-nqw8.onrender.com)                           │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database                                │
│  (PostgreSQL)                                                │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Response Data                             │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Component State Update                          │
│  (setState triggers re-render)                               │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      UI Update                               │
│  (React renders updated component)                           │
└─────────────────────────────────────────────────────────────┘
```

## State Management

### Local Component State (useState)

Each component manages its own state:

```typescript
// Project Details Page
const [project, setProject] = useState<ProjectDetailsResponse | null>(null);
const [tasks, setTasks] = useState<Task[]>([]);
const [sprints, setSprints] = useState<Sprint[]>([]);
const [activeTab, setActiveTab] = useState<TabType>('overview');

// Kanban Board
const [users, setUsers] = useState<User[]>([]);
const [filterAssignee, setFilterAssignee] = useState<string>('');
const [filterPriority, setFilterPriority] = useState<string>('');

// Task Details Modal
const [comments, setComments] = useState<Comment[]>([]);
const [isEditing, setIsEditing] = useState(false);
```

### Props Drilling

Data flows down through props:

```
ProjectDetailsPage
  ├── tasks → KanbanBoard
  │            ├── workflows
  │            ├── tasks
  │            └── onTasksChange
  │
  └── sprints → SprintList
               ├── sprints
               ├── tasks
               └── onSprintsChange
```

### Callback Pattern

Child components notify parents of changes:

```typescript
// Parent provides callback
<KanbanBoard onTasksChange={setTasks} />

// Child calls callback after API update
const fetchTasks = async () => {
  const data = await api.get(`/api/projects/${projectId}/tasks`);
  onTasksChange(data); // Updates parent state
};
```

## API Integration Pattern

### Standard CRUD Flow

```typescript
// 1. Fetch data on mount
useEffect(() => {
  fetchData();
}, []);

// 2. Fetch function
const fetchData = async () => {
  try {
    const data = await api.get('/api/endpoint');
    setState(data);
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// 3. Create/Update/Delete
const handleCreate = async (formData) => {
  setLoading(true);
  try {
    await api.post('/api/endpoint', formData);
    fetchData(); // Refresh list
  } catch (err: any) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

## Component Communication

### Parent-Child Communication

```
Parent Component
  │
  ├─ Props Down ──────────────────┐
  │                                │
  │                                ▼
  │                         Child Component
  │                                │
  └─ Callbacks Up ◄───────────────┘
```

### Sibling Communication

```
Parent Component (shared state)
  │
  ├─ Props ──────► Sibling A (reads state)
  │
  └─ Props ──────► Sibling B (updates via callback)
                      │
                      └─ Callback ──► Parent updates state
                                        │
                                        └─ Re-renders Sibling A
```

## Routing Structure

```
/ (root)
│
├── /login
│   └── Login form
│
├── /register
│   └── Registration form
│
├── /projects
│   ├── Projects list
│   └── Create project form
│
└── /projects/[id]
    ├── Overview tab
    ├── Tasks tab (Kanban)
    ├── Sprints tab
    └── Members tab
```

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    User visits page                          │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│              Check localStorage for token                    │
└─────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
                No token            Has token
                    │                   │
                    ▼                   ▼
         ┌──────────────────┐  ┌──────────────────┐
         │ Redirect to      │  │ Add token to     │
         │ /login           │  │ API headers      │
         └──────────────────┘  └──────────────────┘
                                        │
                                        ▼
                              ┌──────────────────┐
                              │ Make API request │
                              └──────────────────┘
                                        │
                              ┌─────────┴─────────┐
                              │                   │
                          Success            401 Error
                              │                   │
                              ▼                   ▼
                    ┌──────────────────┐  ┌──────────────────┐
                    │ Show data        │  │ Clear token      │
                    │                  │  │ Redirect to      │
                    │                  │  │ /login           │
                    └──────────────────┘  └──────────────────┘
```

## Modal Management

```
Component with Modal
  │
  ├── State: isOpen (boolean)
  │
  ├── Open Modal ──────► setIsOpen(true)
  │                           │
  │                           ▼
  │                    Modal Component
  │                           │
  │                           ├── Backdrop (click to close)
  │                           ├── Content
  │                           └── Close button
  │                                   │
  └── Close Modal ◄──────────────────┘
       setIsOpen(false)
```

## Drag and Drop Flow

```
User starts dragging task
  │
  ▼
onDragStart
  │ Store taskId in dataTransfer
  │
  ▼
User drags over workflow column
  │
  ▼
onDragOver
  │ Prevent default (allow drop)
  │
  ▼
User drops task
  │
  ▼
onDrop
  │ Get taskId from dataTransfer
  │ Get target workflowId
  │
  ▼
API call: PATCH /api/tasks/:id/workflow
  │
  ▼
Refresh tasks list
  │
  ▼
UI updates with new task position
```

## Error Handling Strategy

```
Try-Catch Block
  │
  ├── Try
  │   ├── API call
  │   └── Success: Update state
  │
  └── Catch
      ├── Extract error message
      ├── Set error state
      └── Display error to user
          │
          ├── Red alert box
          └── Error message text
```

## Loading States

```
Component Lifecycle
  │
  ├── Initial: loading = true
  │   └── Show LoadingSpinner
  │
  ├── Fetching: loading = true
  │   └── Show spinner or disable buttons
  │
  └── Complete: loading = false
      └── Show data or enable buttons
```

## Type Safety Flow

```
Backend Model (TypeScript)
  │
  ▼
Frontend Type Definition (types/index.ts)
  │
  ▼
Component Props Interface
  │
  ▼
Component Implementation
  │
  ├── Type-safe props
  ├── Type-safe state
  └── Type-safe API responses
      │
      ▼
Compile-time type checking
  │
  └── Runtime type safety
```

## Performance Optimizations

### 1. Code Splitting
- Each route is a separate chunk
- Modals loaded on-demand
- Components lazy-loaded

### 2. Client-Side Filtering
```
Tasks array (in memory)
  │
  ▼
Filter function (instant)
  │
  ▼
Filtered tasks (no API call)
```

### 3. Optimistic Updates
```
User action (e.g., drag task)
  │
  ├── Update UI immediately
  │   └── User sees instant feedback
  │
  └── API call in background
      │
      ├── Success: Keep UI as-is
      └── Error: Revert UI + show error
```

### 4. Minimal Re-renders
- Local state in child components
- Callbacks memoized where needed
- Conditional rendering

## Styling Architecture

### Tailwind CSS Utility Classes

```
Component JSX
  │
  ├── Utility classes (inline)
  │   ├── Layout: flex, grid, space-x-4
  │   ├── Colors: bg-white/10, text-white
  │   ├── Effects: backdrop-blur-xl, rounded-2xl
  │   └── Responsive: md:grid-cols-2, lg:grid-cols-3
  │
  └── Compiled to CSS
      │
      └── Optimized production bundle
```

### Design Tokens

```
Colors:
  - Primary: indigo-900, purple-900, pink-800
  - Accent: blue-400, purple-500
  - Text: white, blue-100, blue-200
  - Backgrounds: white/10, white/20
  - Borders: white/20, white/30

Effects:
  - Blur: backdrop-blur-md, backdrop-blur-xl
  - Shadows: shadow-xl, shadow-2xl
  - Transitions: transition-all, hover:scale-105

Spacing:
  - Padding: p-4, p-6, p-8
  - Margin: mb-4, mb-6, mb-8
  - Gap: gap-4, gap-6, space-x-4
```

## Security Considerations

### 1. Authentication
- JWT token stored in localStorage
- Token sent in Authorization header
- Automatic redirect on 401

### 2. Authorization
- Owner-only actions (edit/delete project)
- User can only delete own comments
- Backend validates all permissions

### 3. Input Validation
- Required fields enforced
- Max length limits
- Type validation via TypeScript

### 4. XSS Prevention
- React escapes content by default
- No dangerouslySetInnerHTML used
- User input sanitized

## Deployment Architecture

```
Developer
  │
  ├── Push to Git
  │
  ▼
GitHub Repository
  │
  ├── Webhook trigger
  │
  ▼
Vercel
  │
  ├── Install dependencies
  ├── Run build (npm run build)
  ├── Generate static pages
  └── Deploy to CDN
      │
      ▼
Production URL
(https://sesd-nine.vercel.app)
  │
  ├── Serves static assets
  ├── Server-side renders dynamic routes
  └── Connects to backend API
      │
      ▼
Backend API
(https://sesd-nqw8.onrender.com)
```

## Conclusion

This architecture provides:
- ✅ Clear separation of concerns
- ✅ Type-safe data flow
- ✅ Efficient state management
- ✅ Scalable component structure
- ✅ Maintainable codebase
- ✅ Production-ready deployment
