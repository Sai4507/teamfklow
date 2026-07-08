import express from 'express';
import * as authController from '../controllers/authController.js';
import * as projectController from '../controllers/projectController.js';
import * as taskController from '../controllers/taskController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

// Auth routes (no auth required)
router.post('/auth/register', authController.register);
router.post('/auth/login', authController.login);
router.post('/auth/refresh', authController.refreshToken);

// Auth routes (auth required)
router.use(authMiddleware);

router.post('/auth/logout', authController.logout);
router.get('/auth/me', authController.getCurrentUser);
router.put('/auth/profile', authController.updateProfile);
router.put('/auth/notifications', authController.updateNotificationSettings);

// Project routes
router.post('/projects', projectController.createProject);
router.get('/projects', projectController.getProjects);
router.get('/projects/:projectId', projectController.getProjectById);
router.put('/projects/:projectId', projectController.updateProject);
router.delete('/projects/:projectId', projectController.deleteProject);
router.post('/projects/:projectId/members', projectController.addProjectMember);
router.delete('/projects/:projectId/members/:memberId', projectController.removeProjectMember);
router.get('/projects/:projectId/members', projectController.getProjectMembers);

// Task routes
router.post('/projects/:projectId/tasks', taskController.createTask);
router.get('/projects/:projectId/tasks', taskController.getProjectTasks);
router.get('/tasks/:taskId', taskController.getTaskById);
router.put('/tasks/:taskId', taskController.updateTask);
router.delete('/tasks/:taskId', taskController.deleteTask);

export default router;
