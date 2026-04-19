import { Workflow } from '../models/Workflow';

export interface IWorkflowRepository {
  findById(id: string): Promise<Workflow | null>;
  findByProjectId(projectId: string): Promise<Workflow[]>;
  create(data: { projectId: string; name: string; sequenceOrder: number }): Promise<Workflow>;
}
