import { Comment } from '../models/Comment';

export interface ICommentRepository {
  findById(id: string): Promise<Comment | null>;
  findByTaskId(taskId: string): Promise<Comment[]>;
  create(data: { taskId: string; userId: string; content: string }): Promise<Comment>;
}
