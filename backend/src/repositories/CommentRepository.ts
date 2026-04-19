import { Pool } from 'pg';
import { Comment } from '../models/Comment';
import { ICommentRepository } from './ICommentRepository';

export class CommentRepository implements ICommentRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<Comment | null> {
    const result = await this.pool.query(
      'SELECT id, task_id, user_id, content, created_at FROM comments WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToComment(result.rows[0]) : null;
  }

  async findByTaskId(taskId: string): Promise<Comment[]> {
    const result = await this.pool.query(
      'SELECT id, task_id, user_id, content, created_at FROM comments WHERE task_id = $1 ORDER BY created_at ASC',
      [taskId]
    );
    return result.rows.map((row) => this.mapToComment(row));
  }

  async create(data: { taskId: string; userId: string; content: string }): Promise<Comment> {
    const result = await this.pool.query(
      `INSERT INTO comments (task_id, user_id, content, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, task_id, user_id, content, created_at`,
      [data.taskId, data.userId, data.content]
    );
    return this.mapToComment(result.rows[0]);
  }

  private mapToComment(row: any): Comment {
    return {
      id: row.id.toString(),
      taskId: row.task_id.toString(),
      userId: row.user_id.toString(),
      content: row.content,
      createdAt: row.created_at,
    };
  }
}
