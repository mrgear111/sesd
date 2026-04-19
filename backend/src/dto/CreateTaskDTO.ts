import { Priority } from '../models/Task';

export interface CreateTaskDTO {
  title: string;
  description: string;
  priority: Priority;
  assigneeId?: string;
  dueDate?: Date;
}
