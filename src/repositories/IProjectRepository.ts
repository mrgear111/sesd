import { Project } from '../models/Project';

/**
 * Interface for Project repository
 */
export interface IProjectRepository {
  findById(id: string): Promise<Project | null>;
  findByUserId(userId: string): Promise<Project[]>;
  create(data: { name: string; description: string; ownerId: string }): Promise<Project>;
  delete(id: string): Promise<void>;
  addMember(projectId: string, userId: string, role: string): Promise<void>;
  isMember(projectId: string, userId: string): Promise<boolean>;
  getMemberRole(projectId: string, userId: string): Promise<string | null>;
}
