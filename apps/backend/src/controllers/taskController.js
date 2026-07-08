import { query } from '../config/database.js';
import { paginate } from '../utils/helpers.js';

export const createTask = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { title, description, priority, assigneeId, dueDate, parentTaskId, labels } = req.body;
    const userId = req.user.id;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Check project membership
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query(
      `INSERT INTO tasks (project_id, title, description, priority, assignee_id, reporter_id, due_date, parent_task_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [projectId, title, description || null, priority || 'medium', assigneeId || null, userId, dueDate || null, parentTaskId || null]
    );
    
    const task = result.rows[0];
    
    // Add labels
    if (labels && Array.isArray(labels)) {
      for (const label of labels) {
        await query('INSERT INTO task_labels (task_id, label) VALUES ($1, $2)', [task.id, label]);
      }
    }
    
    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, type, description)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, projectId, task.id, 'task_created', `Task "${title}" created`]
    );
    
    // Create notification for assignee
    if (assigneeId && assigneeId !== userId) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, actor_id, related_task_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [assigneeId, 'task_assigned', 'Task Assigned', `You were assigned to task: ${title}`, userId, task.id]
      );
    }
    
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
};

export const getProjectTasks = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { page, limit, status, priority, assigneeId } = req.query;
    const userId = req.user.id;
    const { offset, limit: pageLimit } = paginate(page, limit);
    
    // Check project membership
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    let whereConditions = ['t.project_id = $1'];
    const values = [projectId];
    let paramCount = 2;
    
    if (status) {
      whereConditions.push(`t.status = $${paramCount}`);
      values.push(status);
      paramCount++;
    }
    
    if (priority) {
      whereConditions.push(`t.priority = $${paramCount}`);
      values.push(priority);
      paramCount++;
    }
    
    if (assigneeId) {
      whereConditions.push(`t.assignee_id = $${paramCount}`);
      values.push(assigneeId);
      paramCount++;
    }
    
    const whereClause = whereConditions.join(' AND ');
    
    const tasksResult = await query(
      `SELECT t.*, u.username as assignee_username, u.email as assignee_email
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE ${whereClause}
       ORDER BY t.due_date ASC, t.priority DESC
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      [...values, pageLimit, offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(*) FROM tasks t WHERE ${whereClause}`,
      values
    );
    
    res.json({
      tasks: tasksResult.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10) || 1,
      limit: pageLimit
    });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
};

export const getTaskById = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    const result = await query(
      `SELECT t.*, u.username as assignee_username
       FROM tasks t
       LEFT JOIN users u ON t.assignee_id = u.id
       WHERE t.id = $1`,
      [taskId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = result.rows[0];
    
    // Check project membership
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    // Get labels
    const labelsResult = await query('SELECT label FROM task_labels WHERE task_id = $1', [taskId]);
    task.labels = labelsResult.rows.map(r => r.label);
    
    // Get comments
    const commentsResult = await query(
      `SELECT c.*, u.username, u.email FROM comments c
       INNER JOIN users u ON c.author_id = u.id
       WHERE c.task_id = $1
       ORDER BY c.created_at ASC`,
      [taskId]
    );
    task.comments = commentsResult.rows;
    
    // Get attachments
    const attachmentsResult = await query(
      `SELECT * FROM task_attachments WHERE task_id = $1 ORDER BY created_at DESC`,
      [taskId]
    );
    task.attachments = attachmentsResult.rows;
    
    // Get dependencies
    const dependenciesResult = await query(
      `SELECT td.*, t.title as dependent_title, t.status as dependent_status
       FROM task_dependencies td
       INNER JOIN tasks t ON td.depends_on_id = t.id
       WHERE td.task_id = $1`,
      [taskId]
    );
    task.dependencies = dependenciesResult.rows;
    
    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to get task' });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const { title, description, status, priority, assigneeId, dueDate } = req.body;
    const userId = req.user.id;
    
    const taskResult = await query('SELECT * FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const task = taskResult.rows[0];
    
    // Check project membership
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [task.project_id, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query(
      `UPDATE tasks 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           status = COALESCE($3, status),
           priority = COALESCE($4, priority),
           assignee_id = COALESCE($5, assignee_id),
           due_date = COALESCE($6, due_date),
           updated_at = NOW()
       WHERE id = $7
       RETURNING *`,
      [title || null, description || null, status || null, priority || null, assigneeId || null, dueDate || null, taskId]
    );
    
    const updatedTask = result.rows[0];
    
    // Log activity
    const changes = {
      title: title !== task.title ? { old: task.title, new: title } : undefined,
      status: status !== task.status ? { old: task.status, new: status } : undefined,
      priority: priority !== task.priority ? { old: task.priority, new: priority } : undefined,
      assignee_id: assigneeId !== task.assignee_id ? { old: task.assignee_id, new: assigneeId } : undefined,
    };
    
    await query(
      `INSERT INTO activity_logs (user_id, project_id, task_id, type, description, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, task.project_id, taskId, status !== task.status ? 'task_status_changed' : 'task_updated', 'Task updated', JSON.stringify(changes)]
    );
    
    // Send notification for status change
    if (status !== task.status && task.assignee_id) {
      await query(
        `INSERT INTO notifications (user_id, type, title, message, actor_id, related_task_id)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [task.assignee_id, 'task_status_changed', 'Task Status Changed', `Task status changed to ${status}`, userId, taskId]
      );
    }
    
    res.json(updatedTask);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const { taskId } = req.params;
    const userId = req.user.id;
    
    const taskResult = await query('SELECT project_id FROM tasks WHERE id = $1', [taskId]);
    if (taskResult.rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    
    const projectId = taskResult.rows[0].project_id;
    
    // Check project membership
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    await query('DELETE FROM tasks WHERE id = $1', [taskId]);
    
    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
};
