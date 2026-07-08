# TeamFlow - Business Rules & Requirements

## Overview
This document defines all business rules, constraints, and requirements for the TeamFlow application.

## Authentication & Access Control

### Registration
- Email must be unique across system
- Username must be unique and 3-50 characters
- Password must be ≥ 8 characters
- Account is active immediately after registration
- Default role: Developer

### Login
- Email/password validation required
- Invalid credentials return generic error (no user enumeration)
- Account must be active (is_active = true)
- Login timestamp updated on successful authentication
- Failed logins do not lock account (no brute force protection in v1)

### Roles & Permissions

| Permission | Admin | PM | Dev | Reviewer |
|-----------|-------|----|----|----------|
| Create Project | ✅ | ✅ | ❌ | ❌ |
| Edit Project | ✅ | ✅ | ❌ | ❌ |
| Delete Project | ✅ | ✅ | ❌ | ❌ |
| Add Members | ✅ | ✅ | ❌ | ❌ |
| Remove Members | ✅ | ✅ | ❌ | ❌ |
| Create Task | ✅ | ✅ | ✅ | ❌ |
| Edit Task | ✅ | ✅ | ✅ | ❌ |
| Delete Task | ✅ | ✅ | ✅ | ❌ |
| Comment | ✅ | ✅ | ✅ | ✅ |
| Review RCA | ✅ | ✅ | ❌ | ✅ |

## Project Management

### Project Creation
- Owner is automatically added as project_manager
- Key must be unique (2-20 characters, alphanumeric)
- Name is required (1-255 characters)
- Description optional
- Default status: active (not archived)

### Project Members
- Users can only be added once per project
- Only project managers can add/remove members
- Owner cannot remove themselves
- Adding user sends notification
- Removing user logs activity

### Project Archival
- Archived projects don't appear in default lists
- Archived projects still accessible if known
- Archived projects cannot accept new tasks (planned)
- Cannot delete archived projects (must unarchive first)

## Task Management

### Task Creation
- Title required (1-255 characters)
- Description optional (unlimited)
- Status defaults to "todo"
- Priority defaults to "medium"
- Reporter = creator (automatic)
- Assignee optional
- Due date optional
- Can only be created in active projects

### Task Status Workflow

```
todo ──→ in_progress ──→ review ──→ done
 ↓                       ↑         ↓
 └────────→ blocked ─────┘────────┘
```

- Transitions must follow workflow
- Users cannot skip statuses
- Moving to "blocked" requires explanation
- Cannot move task if parent is "blocked"

### Task Priorities
- Low: Can wait
- Medium: Normal priority
- High: Important, needed soon
- Critical: Urgent, blocker

### Task Assignments
- Task can have 0 or 1 assignee
- Only project members can be assigned
- Assigning sends notification
- Reassigning logs change
- Unassigning logs change

### Task Dependencies

**Rules**
- Task A can depend on Task B
- If B is not "done", warning shown to A's assignee
- Circular dependencies prevented (A→B→A invalid)
- Warning does NOT block saving
- Blocking task title shown in warning

**Dependency Notification**
- Blocking task status change → notification to dependent task assignee
- "Task X is no longer blocking task Y"
- "Task X is now blocking task Y"

### Task Deletion
- Deletes all comments, attachments, dependencies
- Does NOT delete subtasks (reparent to null)
- Logs deletion activity

### Subtasks
- Can create task with parent_task_id
- Parent-child relationship preserved
- Deleting parent orphans children
- Filtered view option "Show subtasks"

## Comments & Discussion

### Comment Rules
- Author automatically set to logged-in user
- Can be threaded (reply to another comment)
- Rich text/markdown support (v2)
- Mentions with @ syntax: @username
- Mentioned users get notification

### Comment Notifications
- Trigger: "Task X commented by @username"
- Only when user specifically mentioned
- User who created task is NOT auto-mentioned
- Multiple mentions = single notification

### Comment Permissions
- Creator can edit own comment (v2)
- Creator can delete own comment
- PM/Admin can delete any comment
- Comments preserved in audit logs

## Attachments

### File Upload
- Max size: 10MB per file
- Allowed types: Images, PDF, Office, CSV, TXT
- Stored in: /uploads/{projectId}/{taskId}/
- Metadata stored in database
- Uploaded by automatically tracked

### File Download
- All project members can download
- Download link includes file ID
- Original filename preserved
- Download logged in activity

### File Deletion
- Uploader can delete own files
- PM/Admin can delete any file
- Physical file deleted + database record
- Deletion logged

## Notifications

### Notification Types

| Type | Trigger | Recipient |
|------|---------|-----------|
| task_assigned | Task assigned | Assignee |
| task_status_changed | Status updated | Assignee |
| comment_mentioned | @mention in comment | Mentioned user |
| task_commented | Comment added | Task watcher (v2) |
| rca_submitted | RCA submitted | Reviewers |
| review_approved | RCA approved | RCA creator |
| review_rejected | RCA rejected | RCA creator |

### Duplicate Prevention
- No duplicate of same type to same user for same resource
- Within 1 hour window
- Prevents spamming

### Email Notifications
- Optional (user can disable)
- Only sent if in_app notification created
- If email fails, in-app notification still sent
- User preference: email_notifications_enabled

### Notification Lifecycle
- Created when event occurs
- Marked read when user views
- Deleted when older than 90 days (planned)
- Can be archived by user (v2)

## Root Cause Analysis (RCA)

### RCA Workflow

```
draft ──→ submitted ──→ under_review ──→ approved ──→ closed
                              ↓
                           rejected ──→ draft (restart)
```

### RCA Status Rules
- Creator starts in "draft"
- Creator submits → "submitted" + reviewers notified
- System moves to "under_review" (automatic)
- All reviewers must decide → "approved" or "rejected"
- If rejected → back to "draft" for revision
- Creator approves final → "closed"

### Review Process
- **Multiple reviewers**: Each assigned individually
- **Decisions**: Approved, Rejected, or Pending
- **Comments mandatory**: Every decision requires explanation
- **Vote required**: All reviewers must vote
- **Rejection**: Any reviewer can reject (blocks approval)
- **Final decision**: All must approve for "approved" status

### RCA Permissions
- Creator can edit while in "draft" or "rejected"
- Reviewers cannot edit RCA details
- Reviewers can only add comments
- Only reviewer can delete own review

### RCA Attachments
- Same as task attachments
- 10MB max
- Same file types allowed
- Stored separately from tasks

## Activity Logging

### Logged Actions
- User registration
- User login/logout
- Project creation/update/deletion
- Task CRUD operations
- Task status changes
- Assignments
- Comments posted
- Files uploaded
- RCA submitted/reviewed
- Member added/removed

### Log Entry Format
```json
{
  "id": "uuid",
  "user_id": "uuid",
  "project_id": "uuid",
  "task_id": "uuid",
  "type": "task_created",
  "description": "Task 'Fix login bug' created",
  "changes": { "title": "", "status": "todo" },
  "created_at": "2026-07-08T20:53:36Z"
}
```

### Immutability
- Log entries cannot be edited
- Log entries cannot be deleted
- Admins can view but not modify
- Deletion of resource does NOT delete its logs

## Data Validation

### Email
- RFC 5322 format validation
- Case-insensitive for comparison
- Unique per user

### Username
- 3-50 characters
- Alphanumeric + underscore
- Unique per user
- Case-insensitive for comparison

### Dates
- ISO 8601 format
- Future dates only for due dates
- No time component (dates only)

### JSON Fields
- Valid JSON storage
- Typed appropriately
- Null handling defined

## Constraints & Limits

| Item | Limit | Reason |
|------|-------|--------|
| File size | 10MB | Storage, performance |
| Project name | 255 chars | UI display |
| Task title | 255 chars | Kanban card width |
| Comment | Unlimited | Rich discussion |
| Members/project | Unlimited | Scalability |
| Tasks/project | 100K | Database performance |
| Active projects | Unlimited | Business need |

## Edge Cases

### Deleted User
- User deleted → Tasks reassigned to owner
- User deleted → Comments kept but author nullified
- User deleted → Activity logs kept with null user
- User deleted → Refresh tokens deleted

### Deleted Project
- All tasks, comments, RCAs deleted
- All activity logs deleted
- All members removed
- Cannot be undone

### Deleted Task
- Comments/attachments deleted
- Dependencies deleted
- Activity logs kept
- Subtasks orphaned (parent_task_id → null)

## Performance Requirements

| Operation | Target |
|-----------|--------|
| Page load | < 2s |
| API response | < 500ms |
| Task list query | < 1s |
| Search | < 2s |
| Notification delivery | < 10s |

---

*Version: 1.0.0*  
*Last Updated: 2026-07-08*
