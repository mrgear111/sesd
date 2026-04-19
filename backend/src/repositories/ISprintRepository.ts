import { Sprint } from '../models/Sprint';

export interface ISprintRepository {
  findById(id: string): Promise<Sprint | null>;
  findByProjectId(projectId: string): Promise<Sprint[]>;
  create(data: {
    projectId: string;
    name: string;
    startDate: Date;
    endDate: Date;
  }): Promise<Sprint>;
  updateState(id: string, state: string): Promise<Sprint>;
}
