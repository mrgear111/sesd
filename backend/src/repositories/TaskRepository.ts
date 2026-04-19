import { Pool } from 'pg';
import { Task } from '../models/Task';
import { TaskFilters } from '../dto/TaskFilters';
import { ITaskRepository } from './ITaskRepository';

export class TaskRepository implements ITaskRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<Task | null> {
    const result = await this.pool.query(
      `SELECT id, project_id, workflow_id, title, description, assignee_id,
              reporter_id, due_date, priority, created_at, updated_at
       FROM tasks WHERE id = $1`,
      [id]
    );
    return result.rows[0] ? this.mapToTask(result.rows[0]) : null;
  }

  async findByProjectId(projectId: string, filters?: TaskFilters): Promise<Task[]> {
    let query = `
      SELECT id, project_id, workflow_id, title, description, assignee_id,
             reporter_id, due_date, priority, created_at, updated_at
      FROM tasks
      WHERE project_id = $1
    `;
    const params: any[] = [projectId];
    let paramIndex = 2;

    if (filters?.workflowId) {
      query += ` AND workflow_id = $${paramIndex}`;
      params.push(filters.workflowId);
      paramIndex++;
    }

    if (filters?.assigneeId) {
      query += ` AND assignee_id = $${paramIndex}`;
      params.push(filters.assigneeId);
      paramIndex++;
    }

    if (filters?.priority) {
      query += ` AND priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.search) {
      query += ` AND (title ILIKE $${paramIndex} OR description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.pool.query(query, params);
    return result.rows.map((row) => this.mapToTask(row));
  }

  async create(data: {
    projectId: string;
    workflowId: string;
    title: string;
    description: string;
    priority: string;
    reporterId: string;
    assigneeId?: string | null;
    dueDate?: Date | null;
  }): Promise<Task> {
    const result = await this.pool.query(
      `INSERT INTO tasks (project_id, workflow_id, title, description, assignee_id,
                          reporter_id, due_date, priority, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [
        data.projectId,
        data.workflowId,
        data.title,
        data.description,
        data.assigneeId || null,
        data.reporterId,
        data.dueDate || null,
        data.priority,
      ]
    );
    return this.mapToTask(result.rows[0]);
  }

  async updateStatus(taskId: string, workflowId: string): Promise<Task> {
    const result = await this.pool.query(
      `UPDATE tasks SET workflow_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [workflowId, taskId]
    );
    return this.mapToTask(result.rows[0]);
  }

  async updateAssignee(taskId: string, assigneeId: string | null): Promise<Task> {
    const result = await this.pool.query(
      `UPDATE tasks SET assignee_id = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, project_id, workflow_id, title, description, assignee_id,
                 reporter_id, due_date, priority, created_at, updated_at`,
      [assigneeId, taskId]
    );
    return this.mapToTask(result.rows[0]);
  }

  private mapToTask(row: any): Task {
    return {
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      workflowId: row.workflow_id.toString(),
      title: row.title,
      description: row.description,
      assigneeId: row.assignee_id ? row.assignee_id.toString() : null,
      reporterId: row.reporter_id.toString(),
      dueDate: row.due_date,
      priority: row.priority,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
