import { Pool } from 'pg';
import { Workflow } from '../models/Workflow';
import { IWorkflowRepository } from './IWorkflowRepository';

export class WorkflowRepository implements IWorkflowRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<Workflow | null> {
    const result = await this.pool.query(
      'SELECT id, project_id, name, sequence_order FROM workflows WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToWorkflow(result.rows[0]) : null;
  }

  async findByProjectId(projectId: string): Promise<Workflow[]> {
    const result = await this.pool.query(
      'SELECT id, project_id, name, sequence_order FROM workflows WHERE project_id = $1 ORDER BY sequence_order',
      [projectId]
    );
    return result.rows.map((row) => this.mapToWorkflow(row));
  }

  async create(data: {
    projectId: string;
    name: string;
    sequenceOrder: number;
  }): Promise<Workflow> {
    const result = await this.pool.query(
      `INSERT INTO workflows (project_id, name, sequence_order)
       VALUES ($1, $2, $3)
       RETURNING id, project_id, name, sequence_order`,
      [data.projectId, data.name, data.sequenceOrder]
    );
    return this.mapToWorkflow(result.rows[0]);
  }

  private mapToWorkflow(row: any): Workflow {
    return {
      id: row.id.toString(),
      projectId: row.project_id.toString(),
      name: row.name,
      sequenceOrder: row.sequence_order,
    };
  }
}
