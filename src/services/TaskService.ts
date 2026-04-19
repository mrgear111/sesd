import { Task } from '../models/Task';
import { CreateTaskDTO } from '../dto/CreateTaskDTO';
import { TaskFilters } from '../dto/TaskFilters';
import { ITaskRepository } from '../repositories/ITaskRepository';
import { IProjectRepository } from '../repositories/IProjectRepository';
import { IUserRepository } from '../repositories/IUserRepository';
import { WorkflowEngine } from './WorkflowEngine';
import { AuthorizationService } from './AuthorizationService';
import { ValidationError, NotFoundError } from '../utils/errors';

/**
 * Task service
 * Handles task management business logic
 */
export class TaskService {
  constructor(
    private taskRepo: ITaskRepository,
    private projectRepo: IProjectRepository,
    private userRepo: IUserRepository,
    private workflowEngine: WorkflowEngine,
    private authzService: AuthorizationService
  ) {}

  /**
   * Create a new task
   */
  async createTask(
    projectId: string,
    dto: CreateTaskDTO,
    reporterId: string
  ): Promise<Task> {
    // Authorization checks
    await this.authzService.requireProjectMember(reporterId, projectId);
    await this.authzService.requireRole(reporterId, projectId, ['Dev', 'QA', 'PM', 'Admin']);

    // Validate title length
    if (dto.title.length < 1 || dto.title.length > 200) {
      throw new ValidationError('Title must be between 1 and 200 characters');
    }

    // Validate priority
    const validPriorities = ['Low', 'Medium', 'High'];
    if (!validPriorities.includes(dto.priority)) {
      throw new ValidationError(`Priority must be one of: ${validPriorities.join(', ')}`);
    }

    // Verify project exists
    const project = await this.projectRepo.findById(projectId);
    if (!project) {
      throw new NotFoundError('Project not found');
    }

    // Get default workflow
    const defaultWorkflow = await this.workflowEngine.getDefaultWorkflow(projectId);

    // Create task
    const task = await this.taskRepo.create({
      projectId,
      title: dto.title,
      description: dto.description,
      priority: dto.priority,
      workflowId: defaultWorkflow.id,
      reporterId,
      assigneeId: dto.assigneeId || null,
      dueDate: dto.dueDate || null,
    });

    return task;
  }

  /**
   * Get tasks by project with optional filters
   */
  async getTasksByProject(projectId: string, filters?: TaskFilters): Promise<Task[]> {
    return this.taskRepo.findByProjectId(projectId, filters);
  }

  /**
   * Get task by ID
   */
  async getTaskById(taskId: string): Promise<Task> {
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }
    return task;
  }

  /**
   * Change task status (move to different workflow)
   */
  async changeTaskStatus(
    taskId: string,
    targetWorkflowId: string,
    userId: string
  ): Promise<Task> {
    // Get current task
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization checks
    await this.authzService.requireProjectMember(userId, task.projectId);
    await this.authzService.requireRole(userId, task.projectId, ['Dev', 'QA', 'PM', 'Admin']);

    // Validate workflow belongs to same project
    const isValid = await this.workflowEngine.validateWorkflowTransition(
      task.projectId,
      targetWorkflowId
    );
    if (!isValid) {
      throw new ValidationError('Invalid workflow for this project');
    }

    // Update task status
    const updatedTask = await this.taskRepo.updateStatus(taskId, targetWorkflowId);

    return updatedTask;
  }

  /**
   * Assign task to a user
   */
  async assignTask(taskId: string, assigneeId: string | null, userId: string): Promise<Task> {
    // Get current task
    const task = await this.taskRepo.findById(taskId);
    if (!task) {
      throw new NotFoundError('Task not found');
    }

    // Authorization checks
    await this.authzService.requireRole(userId, task.projectId, ['PM', 'Admin']);

    // If assigning to someone, verify they exist and are project member
    if (assigneeId) {
      const userExists = await this.userRepo.exists(assigneeId);
      if (!userExists) {
        throw new NotFoundError('Assignee user not found');
      }

      const isMember = await this.projectRepo.isMember(task.projectId, assigneeId);
      if (!isMember) {
        throw new ValidationError('Assignee is not a project member');
      }
    }

    // Update assignment
    const updatedTask = await this.taskRepo.updateAssignee(taskId, assigneeId);

    return updatedTask;
  }
}
