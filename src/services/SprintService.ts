import { Sprint } from '../models/Sprint';
import { CreateSprintDTO } from '../dto/CreateSprintDTO';
import { ISprintRepository } from '../repositories/ISprintRepository';
import { AuthorizationService } from './AuthorizationService';
import { AuditLoggerService } from './AuditLoggerService';
import { ValidationError } from '../utils/errors';

/**
 * Sprint service
 * Handles sprint management business logic
 */
export class SprintService {
  constructor(
    private sprintRepo: ISprintRepository,
    private authzService: AuthorizationService,
    private auditService: AuditLoggerService
  ) {}

  /**
   * Create a new sprint
   * Validates user permissions, sprint name length, and date range
   * Creates sprint with state "Planned" and logs audit event
   */
  async createSprint(
    projectId: string,
    dto: CreateSprintDTO,
    userId: string
  ): Promise<Sprint> {
    // Authorization check - require PM or Admin role
    await this.authzService.requireRole(userId, projectId, ['PM', 'Admin']);

    // Validate sprint name length (1-100 characters)
    if (dto.name.length < 1 || dto.name.length > 100) {
      throw new ValidationError('Sprint name must be between 1 and 100 characters');
    }

    // Validate start date < end date
    if (dto.startDate >= dto.endDate) {
      throw new ValidationError('Start date must be before end date');
    }

    // Create sprint with state "Planned"
    const sprint = await this.sprintRepo.create({
      projectId,
      name: dto.name,
      startDate: dto.startDate,
      endDate: dto.endDate,
    });

    // Log audit event
    await this.auditService.log({
      userId,
      actionType: 'SPRINT_CREATED',
      entityType: 'SPRINT',
      entityId: sprint.id,
      details: {
        name: sprint.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        state: sprint.state,
      },
    });

    return sprint;
  }

  /**
   * Transition sprint state based on dates
   * Updates sprint state: Planned → Active on start date, Active → Completed on end date
   * Logs audit event for state transitions
   */
  async transitionSprintState(sprintId: string, userId: string): Promise<Sprint> {
    const sprint = await this.sprintRepo.findById(sprintId);
    if (!sprint) {
      throw new ValidationError('Sprint not found');
    }

    const now = new Date();
    let newState = sprint.state;

    // Determine new state based on dates
    if (sprint.state === 'Planned' && now >= sprint.startDate) {
      newState = 'Active';
    } else if (sprint.state === 'Active' && now >= sprint.endDate) {
      newState = 'Completed';
    }

    // Only update if state changed
    if (newState !== sprint.state) {
      const updatedSprint = await this.sprintRepo.updateState(sprintId, newState);

      // Log audit event
      await this.auditService.log({
        userId,
        actionType: 'SPRINT_STATE_CHANGED',
        entityType: 'SPRINT',
        entityId: sprintId,
        details: {
          previousState: sprint.state,
          newState: newState,
        },
      });

      return updatedSprint;
    }

    return sprint;
  }
}
