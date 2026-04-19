export type SprintState = 'Planned' | 'Active' | 'Completed';

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate: Date;
  endDate: Date;
  state: SprintState;
  createdAt: Date;
}
