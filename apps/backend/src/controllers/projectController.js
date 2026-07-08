import { query } from '../config/database.js';
import { paginate } from '../utils/helpers.js';

export const createProject = async (req, res) => {
  try {
    const { name, description, key } = req.body;
    const userId = req.user.id;
    
    if (!name || !key) {
      return res.status(400).json({ error: 'Name and key are required' });
    }
    
    // Check if key already exists
    const existingProject = await query('SELECT id FROM projects WHERE key = $1', [key]);
    if (existingProject.rows.length > 0) {
      return res.status(400).json({ error: 'Project key already exists' });
    }
    
    const result = await query(
      `INSERT INTO projects (name, description, key, owner_id)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, description || null, key, userId]
    );
    
    const project = result.rows[0];
    
    // Add owner as project member
    await query(
      'INSERT INTO project_members (project_id, user_id, role) VALUES ($1, $2, $3)',
      [project.id, userId, 'project_manager']
    );
    
    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, project_id, type, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, project.id, 'project_created', `Project "${name}" created`]
    );
    
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page, limit } = req.query;
    const { offset, limit: pageLimit } = paginate(page, limit);
    
    const result = await query(
      `SELECT DISTINCT p.* FROM projects p
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND p.is_archived = false
       ORDER BY p.updated_at DESC
       LIMIT $2 OFFSET $3`,
      [userId, pageLimit, offset]
    );
    
    const countResult = await query(
      `SELECT COUNT(DISTINCT p.id) FROM projects p
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND p.is_archived = false`,
      [userId]
    );
    
    res.json({
      projects: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      page: parseInt(page, 10) || 1,
      limit: pageLimit
    });
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ error: 'Failed to get projects' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Check if user is member of project
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query('SELECT * FROM projects WHERE id = $1', [projectId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ error: 'Failed to get project' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { name, description } = req.body;
    const userId = req.user.id;
    
    // Check permission
    const permissionCheck = await query(
      `SELECT pm.role FROM project_members pm
       WHERE pm.project_id = $1 AND pm.user_id = $2`,
      [projectId, userId]
    );
    
    if (permissionCheck.rows.length === 0 || permissionCheck.rows[0].role !== 'project_manager') {
      return res.status(403).json({ error: 'Only project managers can update project' });
    }
    
    const result = await query(
      `UPDATE projects 
       SET name = COALESCE($1, name),
           description = COALESCE($2, description),
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [name || null, description || null, projectId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, project_id, type, description, changes)
       VALUES ($1, $2, $3, $4, $5)`,
      [userId, projectId, 'project_updated', 'Project updated', JSON.stringify({ name, description })]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ error: 'Failed to update project' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Check permission - only admin or owner can delete
    const project = await query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
    
    if (project.rows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }
    
    if (project.rows[0].owner_id !== userId && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Only owner or admin can delete project' });
    }
    
    await query('DELETE FROM projects WHERE id = $1', [projectId]);
    
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
};

export const addProjectMember = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { userId, role } = req.body;
    const currentUserId = req.user.id;
    
    if (!userId || !role) {
      return res.status(400).json({ error: 'User ID and role are required' });
    }
    
    // Check permission
    const permissionCheck = await query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, currentUserId]
    );
    
    if (permissionCheck.rows.length === 0 || permissionCheck.rows[0].role !== 'project_manager') {
      return res.status(403).json({ error: 'Only project managers can add members' });
    }
    
    const result = await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3
       RETURNING *`,
      [projectId, userId, role]
    );
    
    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, project_id, type, description)
       VALUES ($1, $2, $3, $4)`,
      [currentUserId, projectId, 'user_added_to_project', `User added with role ${role}`]
    );
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Add project member error:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
};

export const removeProjectMember = async (req, res) => {
  try {
    const { projectId, memberId } = req.params;
    const userId = req.user.id;
    
    // Check permission
    const permissionCheck = await query(
      `SELECT role FROM project_members
       WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );
    
    if (permissionCheck.rows.length === 0 || permissionCheck.rows[0].role !== 'project_manager') {
      return res.status(403).json({ error: 'Only project managers can remove members' });
    }
    
    await query(
      'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, memberId]
    );
    
    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, project_id, type, description)
       VALUES ($1, $2, $3, $4)`,
      [userId, projectId, 'user_removed_from_project', 'User removed from project']
    );
    
    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove project member error:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
};

export const getProjectMembers = async (req, res) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;
    
    // Check if user is member of project
    const memberCheck = await query(
      'SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2',
      [projectId, userId]
    );
    
    if (memberCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied' });
    }
    
    const result = await query(
      `SELECT pm.id, pm.project_id, pm.user_id, pm.role, pm.joined_at,
              u.email, u.username, u.first_name, u.last_name, u.avatar_url
       FROM project_members pm
       INNER JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY pm.joined_at DESC`,
      [projectId]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Get project members error:', error);
    res.status(500).json({ error: 'Failed to get members' });
  }
};
