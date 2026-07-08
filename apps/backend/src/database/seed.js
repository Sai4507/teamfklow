import pool, { query } from '../config/database.js';
import bcryptjs from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

const seed = async () => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('Seeding database...');
    
    // Create test users
    const adminUser = {
      id: uuidv4(),
      email: 'admin@teamflow.local',
      username: 'admin',
      password_hash: await bcryptjs.hash('admin123', 10),
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    };
    
    const pmUser = {
      id: uuidv4(),
      email: 'pm@teamflow.local',
      username: 'pm_user',
      password_hash: await bcryptjs.hash('pm123', 10),
      first_name: 'Project',
      last_name: 'Manager',
      role: 'project_manager'
    };
    
    const devUser1 = {
      id: uuidv4(),
      email: 'dev1@teamflow.local',
      username: 'developer1',
      password_hash: await bcryptjs.hash('dev123', 10),
      first_name: 'John',
      last_name: 'Developer',
      role: 'developer'
    };
    
    const devUser2 = {
      id: uuidv4(),
      email: 'dev2@teamflow.local',
      username: 'developer2',
      password_hash: await bcryptjs.hash('dev123', 10),
      first_name: 'Jane',
      last_name: 'Coder',
      role: 'developer'
    };
    
    const reviewerUser = {
      id: uuidv4(),
      email: 'reviewer@teamflow.local',
      username: 'reviewer',
      password_hash: await bcryptjs.hash('review123', 10),
      first_name: 'Code',
      last_name: 'Reviewer',
      role: 'reviewer'
    };
    
    const users = [adminUser, pmUser, devUser1, devUser2, reviewerUser];
    
    for (const user of users) {
      await client.query(
        `INSERT INTO users (id, email, username, password_hash, first_name, last_name, role)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        [user.id, user.email, user.username, user.password_hash, user.first_name, user.last_name, user.role]
      );
    }
    
    console.log('✓ Users created');
    
    // Create sample projects
    const project1 = {
      id: uuidv4(),
      name: 'TeamFlow Backend',
      description: 'Backend development for TeamFlow platform',
      key: 'TFB',
      owner_id: pmUser.id
    };
    
    const project2 = {
      id: uuidv4(),
      name: 'TeamFlow Frontend',
      description: 'Frontend development for TeamFlow platform',
      key: 'TFF',
      owner_id: pmUser.id
    };
    
    const projects = [project1, project2];
    
    for (const project of projects) {
      await client.query(
        `INSERT INTO projects (id, name, description, key, owner_id)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (key) DO NOTHING`,
        [project.id, project.name, project.description, project.key, project.owner_id]
      );
    }
    
    console.log('✓ Projects created');
    
    // Add project members
    const members = [
      { project_id: project1.id, user_id: pmUser.id, role: 'project_manager' },
      { project_id: project1.id, user_id: devUser1.id, role: 'developer' },
      { project_id: project1.id, user_id: devUser2.id, role: 'developer' },
      { project_id: project1.id, user_id: reviewerUser.id, role: 'reviewer' },
      { project_id: project2.id, user_id: pmUser.id, role: 'project_manager' },
      { project_id: project2.id, user_id: devUser1.id, role: 'developer' },
      { project_id: project2.id, user_id: reviewerUser.id, role: 'reviewer' },
    ];
    
    for (const member of members) {
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         ON CONFLICT (project_id, user_id) DO NOTHING`,
        [member.project_id, member.user_id, member.role]
      );
    }
    
    console.log('✓ Project members added');
    
    // Create sample tasks
    const task1 = {
      id: uuidv4(),
      project_id: project1.id,
      title: 'Setup authentication system',
      description: 'Implement JWT-based authentication',
      status: 'in_progress',
      priority: 'high',
      assignee_id: devUser1.id,
      reporter_id: pmUser.id,
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const task2 = {
      id: uuidv4(),
      project_id: project1.id,
      title: 'Create API endpoints',
      description: 'Implement CRUD endpoints for tasks',
      status: 'todo',
      priority: 'high',
      assignee_id: devUser2.id,
      reporter_id: pmUser.id,
      due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const task3 = {
      id: uuidv4(),
      project_id: project2.id,
      title: 'Build dashboard UI',
      description: 'Create dashboard with charts and metrics',
      status: 'review',
      priority: 'medium',
      assignee_id: devUser1.id,
      reporter_id: pmUser.id,
      due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
    
    const tasks = [task1, task2, task3];
    
    for (const task of tasks) {
      await client.query(
        `INSERT INTO tasks (id, project_id, title, description, status, priority, assignee_id, reporter_id, due_date)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [task.id, task.project_id, task.title, task.description, task.status, task.priority, task.assignee_id, task.reporter_id, task.due_date]
      );
    }
    
    console.log('✓ Tasks created');
    
    // Add task labels
    await client.query(
      `INSERT INTO task_labels (task_id, label)
       VALUES ($1, $2), ($1, $3), ($2, $4)`,
      [task1.id, 'backend', 'auth', task2.id, 'api']
    );
    
    console.log('✓ Task labels added');
    
    // Create activity logs
    for (const user of users) {
      await client.query(
        `INSERT INTO activity_logs (user_id, project_id, type, description, created_at)
         VALUES ($1, $2, $3, $4, NOW() - INTERVAL '1 day')`,
        [user.id, project1.id, 'user_added_to_project', `User ${user.username} was added to project`, ]
      );
    }
    
    console.log('✓ Activity logs created');
    
    await client.query('COMMIT');
    console.log('✓ Database seeding completed successfully');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('✗ Error seeding database:', error.message);
    throw error;
  } finally {
    client.release();
  }
};

const run = async () => {
  try {
    await seed();
    process.exit(0);
  } catch (error) {
    console.error('Seed failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

run();
