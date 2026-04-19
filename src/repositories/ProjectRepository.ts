import { Pool } from 'pg';
import { Project } from '../models/Project';
import { IProjectRepository } from './IProjectRepository';

export class ProjectRepository implements IProjectRepository {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async findById(id: string): Promise<Project | null> {
    const result = await this.pool.query(
      'SELECT id, name, description, owner_id, created_at FROM projects WHERE id = $1',
      [id]
    );
    return result.rows[0] ? this.mapToProject(result.rows[0]) : null;
  }

  async findByUserId(userId: string): Promise<Project[]> {
    const result = await this.pool.query(
      `SELECT DISTINCT p.id, p.name, p.description, p.owner_id, p.created_at 
       FROM projects p
       LEFT JOIN project_members pm ON p.id = pm.project_id
       WHERE p.owner_id = $1 OR pm.user_id = $1
       ORDER BY p.created_at DESC`,
      [userId]
    );
    return result.rows.map((row) => this.mapToProject(row));
  }

  async create(data: {
    name: string;
    description: string;
    ownerId: string;
  }): Promise<Project> {
    const result = await this.pool.query(
      `INSERT INTO projects (name, description, owner_id, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, name, description, owner_id, created_at`,
      [data.name, data.description, data.ownerId]
    );
    return this.mapToProject(result.rows[0]);
  }

  async delete(id: string): Promise<void> {
    await this.pool.query('DELETE FROM projects WHERE id = $1', [id]);
  }

  async addMember(projectId: string, userId: string, role: string): Promise<void> {
    await this.pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectId, userId, role]
    );
  }

  async isMember(projectId: string, userId: string): Promise<boolean> {
    const result = await this.pool.query(
      'SELECT 1 FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return result.rows.length > 0;
  }

  async getMemberRole(projectId: string, userId: string): Promise<string | null> {
    const result = await this.pool.query(
      'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    return result.rows[0]?.role || null;
  }

  private mapToProject(row: any): Project {
    return {
      id: row.id.toString(),
      name: row.name,
      description: row.description,
      ownerId: row.owner_id.toString(),
      createdAt: row.created_at,
    };
  }
}
