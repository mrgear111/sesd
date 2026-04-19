import { Request, Response, NextFunction } from 'express';
import { ProjectService } from '../services/ProjectService';
import { AuthorizationService } from '../services/AuthorizationService';

/**
 * Project controller
 * Handles HTTP requests for project management
 */
export class ProjectController {
  constructor(
    private projectService: ProjectService,
    private authzService: AuthorizationService
  ) {}

  /**
   * POST /api/projects
   * Creates a new project
   */
  async createProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { name, description } = req.body;
      const project = await this.projectService.createProject(
        { name, description },
        req.user.id
      );
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId
   * Retrieves project details
   */
  async getProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      await this.authzService.requireProjectMember(req.user.id, projectId);
      const project = await this.projectService.getProjectById(projectId);
      res.json(project);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects
   * Lists all projects for current user
   */
  async listProjects(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projects = await this.projectService.getProjectsByUserId(req.user.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/projects/:projectId/members
   * Adds a member to the project
   */
  async addMember(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { userId, role } = req.body;
      await this.authzService.requireRole(req.user.id, projectId, ['Admin']);
      await this.projectService.addMember(projectId, userId, role);
      res.status(201).json({ message: 'Member added successfully' });
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/projects/:projectId
   * Deletes a project
   */
  async deleteProject(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      await this.authzService.requireRole(req.user.id, projectId, ['Admin']);
      await this.projectService.deleteProject(projectId);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
