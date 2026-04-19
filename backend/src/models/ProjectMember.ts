export type Role = 'Admin' | 'PM' | 'Dev' | 'QA' | 'Viewer';

export interface ProjectMember {
  projectId: string;
  userId: string;
  role: Role;
}
