import type { RequestUser } from '@eduflow/shared';

declare global {
  namespace Express {
    interface Request {
      /** Set by `requireAuth` middleware when a valid access token is present. */
      user?: RequestUser;
    }
  }
}

export {};
