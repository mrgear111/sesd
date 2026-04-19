export type Priority = 'Low' | 'Medium' | 'High';

export interface Task {
  id: string;
  projectId: string;
  workflowId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  reporterId: string;
  dueDate: Date | null;
  priority: Priority;
  createdAt: Date;
  updatedAt: Date;
}
