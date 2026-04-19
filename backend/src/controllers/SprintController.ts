import { Request, Response, NextFunction } from 'express';
import { SprintService } from '../services/SprintService';
import { ISprintRepository } from '../repositories/ISprintRepository';
import { AuthorizationService } from '../services/AuthorizationService';

/**
 * Sprint controller
 * Handles HTTP requests for sprint management
 */
export class SprintController {
  constructor(
    private sprintService: SprintService,
    private sprintRepo: ISprintRepository,
    private authzService: AuthorizationService
  ) {}

  /**
   * POST /api/projects/:projectId/sprints
   * Creates a new sprint
   */
  async createSprint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const { name, startDate, endDate } = req.body;
      const sprint = await this.sprintService.createSprint(
        projectId,
        {
          name,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
        },
        req.user.id
      );
      res.status(201).json(sprint);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/sprints
   * Lists all sprints for a project
   */
  async listSprints(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      await this.authzService.requireProjectMember(req.user.id, projectId);
      const sprints = await this.sprintRepo.findByProjectId(projectId);
      res.json(sprints);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/sprints/:sprintId
   * Retrieves sprint details
   */
  async getSprint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sprintId = req.params.sprintId as string;
      const sprint = await this.sprintRepo.findById(sprintId);
      if (!sprint) {
        res.status(404).json({ message: 'Sprint not found' });
        return;
      }
      res.json(sprint);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/sprints/:sprintId
   * Updates sprint state
   */
  async updateSprint(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sprintId = req.params.sprintId as string;
      const sprint = await this.sprintService.transitionSprintState(sprintId, req.user.id);
      res.json(sprint);
    } catch (error) {
      next(error);
    }
  }

  /**
   * DELETE /api/sprints/:sprintId
   * Deletes a sprint (placeholder - not implemented in service)
   */
  async deleteSprint(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Note: Delete functionality not implemented in SprintService
      // This is a placeholder for future implementation
      res.status(501).json({ message: 'Delete sprint not implemented' });
    } catch (error) {
      next(error);
    }
  }
}
