import type { Request } from 'express';
import type { Role } from '@water-pm/shared';

/** Shape attached to `request.user` by the AuthGuard after a valid session. */
export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export interface RequestWithUser extends Request {
  user?: AuthenticatedUser;
}
