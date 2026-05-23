import { Router, Request, Response } from 'express';
import { query } from '../../config/database.js';
import { verifyToken, requireRole } from '../../middleware/auth.js';
import {
  sendCreated,
  sendOk,
  sendBadRequest,
  sendForbidden,
  sendNotFound,
  sendInternalError,
} from '../../utils/response.js';
import type {
  IssueRow,
  IssueType,
  IssueStatus,
  IssueWithReporter,
  QueryParam,
  ReporterSummary,
} from '../../types/index.js';

const router = Router();

const isIssueType = (value: string): value is IssueType =>
  value === 'bug' || value === 'feature_request';

const isIssueStatus = (value: string): value is IssueStatus =>
  value === 'open' || value === 'in_progress' || value === 'resolved';

// POST /api/issues - Create Issue
router.post(
  '/',
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { title, description, type } = req.body as {
        title?: string;
        description?: string;
        type?: string;
      };
      const reporterId = req.user?.id;

      if (!reporterId) {
        sendForbidden(res, 'User not authenticated');
        return;
      }

      if (!title || !description || !type) {
        sendBadRequest(res, 'Title, description, and type are required');
        return;
      }

      if (title.length > 150) {
        sendBadRequest(res, 'Title must not exceed 150 characters');
        return;
      }

      if (description.length < 20) {
        sendBadRequest(res, 'Description must be at least 20 characters');
        return;
      }

      if (!isIssueType(type)) {
        sendBadRequest(res, 'Type must be bug or feature_request');
        return;
      }

      const result = await query<IssueRow>(
        `INSERT INTO issues (title, description, type, reporter_id, status)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
        [title, description, type, reporterId, 'open']
      );

      const issue = result.rows[0];

      sendCreated(res, 'Issue created successfully', {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter_id: issue.reporter_id,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
      });
    } catch (error) {
      console.error('Create issue error:', error);
      sendInternalError(res, 'Failed to create issue', (error as Error).message);
    }
  }
);

// GET /api/issues - Get All Issues
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { sort = 'newest', type, status } = req.query;

    let whereClause = '';
    const params: QueryParam[] = [];
    let paramCount = 1;

    if (typeof type === 'string' && isIssueType(type)) {
      whereClause += `type = $${paramCount++}`;
      params.push(type);
    }

    if (typeof status === 'string' && isIssueStatus(status)) {
      if (whereClause) whereClause += ' AND ';
      whereClause += `status = $${paramCount++}`;
      params.push(status);
    }

    const orderBy =
      sort === 'oldest'
        ? 'ORDER BY created_at ASC'
        : 'ORDER BY created_at DESC';

    const sqlQuery = `
      SELECT id, title, description, type, status, reporter_id, created_at, updated_at
      FROM issues
      ${whereClause ? 'WHERE ' + whereClause : ''}
      ${orderBy}
    `;

    const result = await query<IssueRow>(sqlQuery, params);

    const issuesWithReporters: IssueWithReporter[] = await Promise.all(
      result.rows.map(async (issue) => {
        const reporterResult = await query<ReporterSummary>(
          'SELECT id, name, role FROM users WHERE id = $1',
          [issue.reporter_id]
        );

        return {
          id: issue.id,
          title: issue.title,
          description: issue.description,
          type: issue.type,
          status: issue.status,
          reporter: reporterResult.rows[0] ?? null,
          created_at: issue.created_at,
          updated_at: issue.updated_at,
        };
      })
    );

    sendOk(res, undefined, issuesWithReporters);
  } catch (error) {
    console.error('Get issues error:', error);
    sendInternalError(res, 'Failed to retrieve issues', (error as Error).message);
  }
});

// GET /api/issues/:id - Get Single Issue
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const result = await query<IssueRow>(
      'SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE id = $1',
      [id]
    );

    if (result.rows.length === 0) {
      sendNotFound(res, 'Issue not found');
      return;
    }

    const issue = result.rows[0];

    const reporterResult = await query<ReporterSummary>(
      'SELECT id, name, role FROM users WHERE id = $1',
      [issue.reporter_id]
    );

    sendOk(res, undefined, {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: reporterResult.rows[0],
      created_at: issue.created_at,
      updated_at: issue.updated_at,
    });
  } catch (error) {
    console.error('Get issue error:', error);
    sendInternalError(res, 'Failed to retrieve issue', (error as Error).message);
  }
});

// PATCH /api/issues/:id - Update Issue
router.patch(
  '/:id',
  verifyToken,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { title, description, type, status } = req.body as {
        title?: string;
        description?: string;
        type?: string;
        status?: string;
      };
      const userId = req.user?.id;
      const userRole = req.user?.role;

      if (!userId || !userRole) {
        sendForbidden(res, 'User not authenticated');
        return;
      }

      const issueResult = await query<IssueRow>(
        'SELECT id, reporter_id, status, title, description, type, created_at, updated_at FROM issues WHERE id = $1',
        [id]
      );

      if (issueResult.rows.length === 0) {
        sendNotFound(res, 'Issue not found');
        return;
      }

      const issue = issueResult.rows[0];

      if (userRole !== 'maintainer') {
        if (issue.reporter_id !== userId || issue.status !== 'open') {
          sendForbidden(res, 'You do not have permission to update this issue');
          return;
        }

        if (status !== undefined) {
          sendForbidden(res, 'Only maintainers can change issue status');
          return;
        }
      }

      const updateFields: string[] = [];
      const params: QueryParam[] = [];
      let paramCount = 1;

      if (title !== undefined) {
        if (title.length > 150) {
          sendBadRequest(res, 'Title must not exceed 150 characters');
          return;
        }
        updateFields.push(`title = $${paramCount++}`);
        params.push(title);
      }

      if (description !== undefined) {
        if (description.length < 20) {
          sendBadRequest(res, 'Description must be at least 20 characters');
          return;
        }
        updateFields.push(`description = $${paramCount++}`);
        params.push(description);
      }

      if (type !== undefined) {
        if (!isIssueType(type)) {
          sendBadRequest(res, 'Type must be bug or feature_request');
          return;
        }
        updateFields.push(`type = $${paramCount++}`);
        params.push(type);
      }

      if (status !== undefined) {
        if (!isIssueStatus(status)) {
          sendBadRequest(res, 'Status must be open, in_progress, or resolved');
          return;
        }
        updateFields.push(`status = $${paramCount++}`);
        params.push(status);
      }

      if (updateFields.length === 0) {
        sendBadRequest(res, 'No fields to update');
        return;
      }

      updateFields.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      const updateQuery = `
        UPDATE issues
        SET ${updateFields.join(', ')}
        WHERE id = $${paramCount}
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
      `;

      const result = await query<IssueRow>(updateQuery, params);
      const updatedIssue = result.rows[0];

      sendOk(res, 'Issue updated successfully', {
        id: updatedIssue.id,
        title: updatedIssue.title,
        description: updatedIssue.description,
        type: updatedIssue.type,
        status: updatedIssue.status,
        reporter_id: updatedIssue.reporter_id,
        created_at: updatedIssue.created_at,
        updated_at: updatedIssue.updated_at,
      });
    } catch (error) {
      console.error('Update issue error:', error);
      sendInternalError(res, 'Failed to update issue', (error as Error).message);
    }
  }
);

// DELETE /api/issues/:id - Delete Issue
router.delete(
  '/:id',
  verifyToken,
  requireRole(['maintainer']),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;

      const issueResult = await query<{ id: number }>(
        'SELECT id FROM issues WHERE id = $1',
        [id]
      );

      if (issueResult.rows.length === 0) {
        sendNotFound(res, 'Issue not found');
        return;
      }

      await query('DELETE FROM issues WHERE id = $1', [id]);

      sendOk(res, 'Issue deleted successfully');
    } catch (error) {
      console.error('Delete issue error:', error);
      sendInternalError(res, 'Failed to delete issue', (error as Error).message);
    }
  }
);

export default router;
