import { Project } from '../models/Project';
import { CreateProjectDTO } from '../dto/CreateProjectDTO';
import { IProjectRepository } from '../repositories/IProjectRepository';
import { IWorkflowRepository } from '../repositories/IWorkflowRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Project service
 * Handles project management business logic
 */
export class ProjectService {
  constructor(
    private projectRepo: IProjectRepository,
    private workflowRepo: IWorkflowRepository,
    private userRepo: IUserRepository
  ) {}

  /**
   * Create a new project with default workflows
   */
  async createProject(dto: CreateProjectDTO, ownerId: string): Promise<Project> {
    // Validate project name length
    if (dto.name.length < 1 || dto.name.length > 200) {
      throw new ValidationError('Project name must be between 1 and 200 characters');
    }

    // Create project
    const project = await this.projectRepo.create({
      name: dto.name,
      description: dto.description,
      ownerId,
    });

    // Create default workflows
    const defaultWorkflows = [
      { name: 'To Do', sequenceOrder: 1 },
      { name: 'In Progress', sequenceOrder: 2 },
      { name: 'Done', sequenceOrder: 3 },
    ];

    for (const workflow of defaultWorkflows) {
      await this.workflowRepo.create({
        projectId: project.id,
        name: workflow.name,
        sequenceOrder: workflow.sequenceOrder,
      });
    }

    // Add creator as project admin
    await this.projectRepo.addMember(project.id, ownerId, 'Admin');

    return project;
  }

  /**
   * Add a member to the project
   */
  async addMember(projectId: string, userId: string, role: string): Promise<void> {
    // Validate role
    const validRoles = ['Admin', 'PM', 'Dev', 'QA', 'Viewer'];
    if (!validRoles.includes(role)) {
      throw new ValidationError(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user exists
    const userExists = await this.userRepo.exists(userId);
    if (!userExists) {
      throw new NotFoundError('User not found');
    }

    // Check if already a member
    const isMember = await this.projectRepo.isMember(projectId, userId);
    if (isMember) {
      throw new ValidationError('User is already a project member');
    }

    // Add member
    await this.projectRepo.addMember(projectId, userId, role);
  }

  /**
   * Get project by ID
   */
  async getProjectById(projectId: string): Promise<Project> {
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }
    return project;
  }

  /**
   * Get all projects for a user
   */
  async getProjectsByUserId(userId: string): Promise<Project[]> {
    return this.projectRepo.findByUserId(userId);
  }

  /**
   * Delete a project
   */
  async deleteProject(projectId: string): Promise<void> {
    await this.projectRepo.delete(projectId);
  }
}
