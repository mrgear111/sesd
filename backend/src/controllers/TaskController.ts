import { Request, Response, NextFunction } from 'express';
import { TaskService } from '../services/TaskService';
import { AuthorizationService } from '../services/AuthorizationService';
import { TaskFilters } from '../dto/TaskFilters';

/**
 * Task controller
 * Handles HTTP requests for task management
 */
export class TaskController {
  constructor(
    private taskService: TaskService,
    private authzService: AuthorizationService
  ) {}

  /**
   * POST /api/projects/:projectId/tasks
   * Creates a new task
   */
  async createTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const taskData = req.body;
      const task = await this.taskService.createTask(projectId, taskData, req.user.id);
      res.status(201).json(task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/projects/:projectId/tasks
   * Lists tasks with optional filters
   */
  async listTasks(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectId = req.params.projectId as string;
      const filters: TaskFilters = {
        workflowId: req.query.workflowId as string | undefined,
        assigneeId: req.query.assigneeId as string | undefined,
        priority: req.query.priority as string | undefined,
        search: req.query.search as string | undefined,
      };
      await this.authzService.requireProjectMember(req.user.id, projectId);
      const tasks = await this.taskService.getTasksByProject(projectId, filters);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId/status
   * Updates task workflow status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const { workflowId } = req.body;
      const task = await this.taskService.changeTaskStatus(taskId, workflowId, req.user.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }

  /**
   * PATCH /api/tasks/:taskId/assign
   * Assigns task to a user
   */
  async assignTask(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const taskId = req.params.taskId as string;
      const { assigneeId } = req.body;
      const task = await this.taskService.assignTask(taskId, assigneeId, req.user.id);
      res.json(task);
    } catch (error) {
      next(error);
    }
  }
}
