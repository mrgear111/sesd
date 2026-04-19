import { Task } from '../models/Task';
import { TaskFilters } from '../dto/TaskFilters';

/**
 * Interface for Task repository
 */
export interface ITaskRepository {
  findById(id: string): Promise<Task | null>;
  findByProjectId(projectId: string, filters?: TaskFilters): Promise<Task[]>;
  create(data: {
    projectId: string;
    workflowId: string;
    title: string;
    description: string;
    priority: string;
    reporterId: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
  }): Promise<Task>;
  updateStatus(taskId: string, workflowId: string): Promise<Task>;
  updateAssignee(taskId: string, assigneeId: string | null): Promise<Task>;
}
