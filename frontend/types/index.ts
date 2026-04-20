// User types
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  createdAt: string;
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: 'Owner' | 'Member';
  joinedAt: string;
  user?: User;
}

// Workflow types
export interface Workflow {
  id: string;
  projectId: string;
  name: string;
  sequenceOrder: number;
}

// Task types
export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  projectId: string;
  workflowId: string;
  sprintId?: string | null;
  title: string;
  description: string;
  assigneeId: string | null;
  reporterId: string;
  dueDate: string | null;
  priority: Priority;
  createdAt: string;
  updatedAt: string;
  assignee?: User | null;
  reporter?: User;
  workflow?: Workflow;
}

// Sprint types
export type SprintState = 'Planned' | 'Active' | 'Completed';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: string;
  endDate: string;
  state: SprintState;
  createdAt: string;
  tasks?: Task[];
}

// Comment types
export interface Comment {
  id: string;
  taskId: string;
  userId: string;
  content: string;
  createdAt: string;
  user?: User;
}

// API Response types
export interface ProjectDetailsResponse extends Project {
  members: ProjectMember[];
  workflows: Workflow[];
}
