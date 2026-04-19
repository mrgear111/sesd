import { Workflow } from '../models/Workflow';
import { IWorkflowRepository } from '../repositories/IWorkflowRepository';
import { NotFoundError } from '../utils/errors';

/**
 * Workflow engine
 * Manages workflow stages and validates transitions
 */
export class WorkflowEngine {
  constructor(private workflowRepo: IWorkflowRepository) {}

  /**
   * Get the default workflow for a project (lowest sequence order)
   */
  async getDefaultWorkflow(projectId: string): Promise<Workflow> {
    const workflows = await this.workflowRepo.findByProjectId(projectId);
    if (workflows.length === 0) {
      throw new NotFoundError('No workflows found for project');
    }
    // Return workflow with lowest sequence order
    return workflows.sort((a, b) => a.sequenceOrder - b.sequenceOrder)[0];
  }

  /**
   * Validate that a workflow transition is valid
   * (workflow belongs to the same project)
   */
  async validateWorkflowTransition(
    projectId: string,
    targetWorkflowId: string
  ): Promise<boolean> {
    const workflow = await this.workflowRepo.findById(targetWorkflowId);
    if (!workflow) {
      return false;
    }
    return workflow.projectId === projectId;
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(workflowId: string): Promise<Workflow> {
    const workflow = await this.workflowRepo.findById(workflowId);
    if (!workflow) {
      throw new NotFoundError('Workflow not found');
    }
    return workflow;
  }

  /**
   * Get all workflows for a project
   */
  async getWorkflowsByProject(projectId: string): Promise<Workflow[]> {
    return this.workflowRepo.findByProjectId(projectId);
  }
}
