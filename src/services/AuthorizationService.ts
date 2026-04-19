import { IProjectRepository } from '../repositories/IProjectRepository';
import { ForbiddenError } from '../utils/errors';

/**
 * Authorization service
 * Handles role-based access control and permission checks
 */
export class AuthorizationService {
  constructor(private projectRepo: IProjectRepository) {}

  /**
   * Require user to be a member of the project
   * @throws ForbiddenError if user is not a project member
   */
  async requireProjectMember(userId: string, projectId: string): Promise<void> {
    const isMember = await this.projectRepo.isMember(projectId, userId);
    if (!isMember) {
      throw new ForbiddenError('User is not a project member');
    }
  }

  /**
   * Require user to have one of the specified roles in the project
   * @throws ForbiddenError if user doesn't have required role
   */
  async requireRole(
    userId: string,
    projectId: string,
    allowedRoles: string[]
  ): Promise<void> {
    const role = await this.projectRepo.getMemberRole(projectId, userId);
    if (!role || !allowedRoles.includes(role)) {
      throw new ForbiddenError(
        `User does not have required role. Required: ${allowedRoles.join(', ')}`
      );
    }
  }

  /**
   * Require user to be the project owner
   * @throws ForbiddenError if user is not the owner
   */
  async requireOwner(userId: string, projectId: string): Promise<void> {
    const project = await this.projectRepo.findById(projectId);
    if (!project || project.ownerId !== userId) {
      throw new ForbiddenError('User is not the project owner');
    }
  }
}
