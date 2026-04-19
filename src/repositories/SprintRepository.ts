import { Pool } from 'pg';
import { Sprint } from '../models/Sprint';
import { ISprintRepository } from './ISprintRepository';

export class SprintRepository implements ISprintRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<Sprint | null> {
    const result = await this.pool.query(
      'SELECT id, project_id, name, start_date, end_date, state, created_at FROM sprints WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToSprint(result.rows[0]) : null;
  }

  async findByProjectId(projectId: string): Promise<Sprint[]> {
    const result = await this.pool.query(
      'SELECT id, project_id, name, start_date, end_date, state, created_at FROM sprints WHERE project_id = $1 ORDER BY created_at DESC',
      [projectId]
    );
    return result.rows.map((row) => this.mapToSprint(row));
  }

  async create(data: {
    projectId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }): Promise<Sprint> {
    const result = await this.pool.query(
      `INSERT INTO sprints (project_id, name, start_date, end_date, state, created_at)
       VALUES ($1, $2, $3, $4, 'Planned', NOW())
       RETURNING id, project_id, name, start_date, end_date, state, created_at`,
      [data.projectId, data.name, data.startDate, data.endDate]
    );
    return this.mapToSprint(result.rows[0]);
  }

  async updateState(id: string, state: string): Promise<Sprint> {
    const result = await this.pool.query(
      `UPDATE sprints SET state = $1 WHERE id = $2
       RETURNING id, project_id, name, start_date, end_date, state, created_at`,
      [state, id]
    );
    return this.mapToSprint(result.rows[0]);
  }

  private mapToSprint(row: any): Sprint {
    return {
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      name: row.name,
      startDate: row.start_date,
      endDate: row.end_date,
      state: row.state,
      createdAt: row.created_at,
    };
  }
}
