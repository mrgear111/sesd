import { Pool } from 'pg';
import * as bcrypt from 'bcrypt';
import { DatabaseConnection } from '../config/database';

/**
 * Seed data script for development environment
 * Creates sample users, projects, workflows, and tasks
 */
class DatabaseSeeder {
  private pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Create sample users
   * @returns Array of created user IDs
   */
  private async createUsers(): Promise<number[]> {
    console.log('Creating sample users...');

    const users = [
      {
        username: 'admin',
        email: 'admin@example.com',
        password: 'password123'
      },
      {
        username: 'john_doe',
        email: 'john@example.com',
        password: 'password123'
      },
      {
        username: 'jane_smith',
        email: 'jane@example.com',
        password: 'password123'
      }
    ];

    const userIds: number[] = [];

    for (const user of users) {
      const passwordHash = await this.hashPassword(user.password);
      const result = await this.pool.query(
        'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id',
        [user.username, user.email, passwordHash]
      );
      userIds.push(result.rows[0].id);
      console.log(`  ✓ Created user: ${user.username} (${user.email})`);
    }

    return userIds;
  }

  /**
   * Create sample projects
   * @param ownerIds - Array of user IDs to assign as project owners
   * @returns Array of created project IDs
   */
  private async createProjects(ownerIds: number[]): Promise<number[]> {
    console.log('\nCreating sample projects...');

    const projects = [
      {
        name: 'E-Commerce Platform',
        description: 'Building a modern e-commerce platform with React and Node.js',
        ownerId: ownerIds[0]
      },
      {
        name: 'Mobile App Development',
        description: 'Cross-platform mobile application using React Native',
        ownerId: ownerIds[1]
      }
    ];

    const projectIds: number[] = [];

    for (const project of projects) {
      const result = await this.pool.query(
        'INSERT INTO projects (name, description, owner_id) VALUES ($1, $2, $3) RETURNING id',
        [project.name, project.description, project.ownerId]
      );
      projectIds.push(result.rows[0].id);
      console.log(`  ✓ Created project: ${project.name}`);
    }

    return projectIds;
  }

  /**
   * Create default workflows for projects
   * @param projectIds - Array of project IDs
   */
  private async createWorkflows(projectIds: number[]): Promise<void> {
    console.log('\nCreating default workflows...');

    const defaultWorkflows = [
      { name: 'To Do', sequenceOrder: 1 },
      { name: 'In Progress', sequenceOrder: 2 },
      { name: 'Done', sequenceOrder: 3 }
    ];

    for (const projectId of projectIds) {
      for (const workflow of defaultWorkflows) {
        await this.pool.query(
          'INSERT INTO workflows (project_id, name, sequence_order) VALUES ($1, $2, $3)',
          [projectId, workflow.name, workflow.sequenceOrder]
        );
      }
      console.log(`  ✓ Created workflows for project ID: ${projectId}`);
    }
  }

  /**
   * Add project members
   * @param projectIds - Array of project IDs
   * @param userIds - Array of user IDs
   */
  private async addProjectMembers(projectIds: number[], userIds: number[]): Promise<void> {
    console.log('\nAdding project members...');

    // Add owner as Admin to first project
    await this.pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectIds[0], userIds[0], 'Admin']
    );
    console.log(`  ✓ Added ${userIds[0]} as Admin to project ${projectIds[0]}`);

    // Add other users as team members to first project
    await this.pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectIds[0], userIds[1], 'Dev']
    );
    console.log(`  ✓ Added ${userIds[1]} as Dev to project ${projectIds[0]}`);

    await this.pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectIds[0], userIds[2], 'QA']
    );
    console.log(`  ✓ Added ${userIds[2]} as QA to project ${projectIds[0]}`);

    // Add owner as Admin to second project
    await this.pool.query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [projectIds[1], userIds[1], 'Admin']
    );
    console.log(`  ✓ Added ${userIds[1]} as Admin to project ${projectIds[1]}`);
  }

  /**
   * Create sample tasks
   * @param projectIds - Array of project IDs
   * @param userIds - Array of user IDs
   */
  private async createTasks(projectIds: number[], userIds: number[]): Promise<void> {
    console.log('\nCreating sample tasks...');

    // Get workflow IDs for the first project
    const workflowResult = await this.pool.query(
      'SELECT id, name FROM workflows WHERE project_id = $1 ORDER BY sequence_order',
      [projectIds[0]]
    );
    const workflows = workflowResult.rows;

    const tasks = [
      {
        projectId: projectIds[0],
        workflowId: workflows[0].id, // To Do
        title: 'Set up project repository',
        description: 'Initialize Git repository and set up project structure',
        assigneeId: userIds[1],
        reporterId: userIds[0],
        priority: 'High'
      },
      {
        projectId: projectIds[0],
        workflowId: workflows[1].id, // In Progress
        title: 'Design database schema',
        description: 'Create ER diagram and define all database tables',
        assigneeId: userIds[1],
        reporterId: userIds[0],
        priority: 'High'
      },
      {
        projectId: projectIds[0],
        workflowId: workflows[0].id, // To Do
        title: 'Implement user authentication',
        description: 'Add JWT-based authentication with login and registration',
        assigneeId: userIds[1],
        reporterId: userIds[0],
        priority: 'Medium'
      },
      {
        projectId: projectIds[0],
        workflowId: workflows[2].id, // Done
        title: 'Create project documentation',
        description: 'Write README and API documentation',
        assigneeId: userIds[2],
        reporterId: userIds[0],
        priority: 'Low'
      }
    ];

    for (const task of tasks) {
      await this.pool.query(
        `INSERT INTO tasks 
         (project_id, workflow_id, title, description, assignee_id, reporter_id, priority) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          task.projectId,
          task.workflowId,
          task.title,
          task.description,
          task.assigneeId,
          task.reporterId,
          task.priority
        ]
      );
      console.log(`  ✓ Created task: ${task.title}`);
    }
  }

  /**
   * Clear all existing data from tables
   */
  private async clearData(): Promise<void> {
    console.log('Clearing existing data...');

    // Delete in reverse order of dependencies
    await this.pool.query('DELETE FROM audit_logs');
    await this.pool.query('DELETE FROM comments');
    await this.pool.query('DELETE FROM tasks');
    await this.pool.query('DELETE FROM sprints');
    await this.pool.query('DELETE FROM workflows');
    await this.pool.query('DELETE FROM project_members');
    await this.pool.query('DELETE FROM projects');
    await this.pool.query('DELETE FROM users');

    console.log('  ✓ All data cleared\n');
  }

  /**
   * Run the seeding process
   */
  async seed(): Promise<void> {
    try {
      console.log('Starting database seeding...\n');

      // Clear existing data
      await this.clearData();

      // Create sample data
      const userIds = await this.createUsers();
      const projectIds = await this.createProjects(userIds);
      await this.createWorkflows(projectIds);
      await this.addProjectMembers(projectIds, userIds);
      await this.createTasks(projectIds, userIds);

      console.log('\n✓ Database seeding completed successfully');
      console.log('\nSample credentials:');
      console.log('  Email: admin@example.com, Password: password123');
      console.log('  Email: john@example.com, Password: password123');
      console.log('  Email: jane@example.com, Password: password123');
    } catch (error) {
      console.error('\n✗ Seeding failed:', error);
      throw error;
    }
  }
}

/**
 * Main execution function
 */
async function main() {
  // Load database configuration from environment variables
  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'agile_dashboard',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres'
  };

  console.log('Database configuration:');
  console.log(`  Host: ${config.host}`);
  console.log(`  Port: ${config.port}`);
  console.log(`  Database: ${config.database}`);
  console.log(`  User: ${config.user}\n`);

  const pool = DatabaseConnection.getInstance(config);
  const seeder = new DatabaseSeeder(pool);

  try {
    await seeder.seed();
  } catch (error) {
    console.error('Seeding process failed:', error);
    process.exit(1);
  } finally {
    await DatabaseConnection.close();
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  main();
}

export { DatabaseSeeder };
