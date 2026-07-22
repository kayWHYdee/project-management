import {
  sessionUserSchema,
  type ChangePasswordRequest,
  type LoginRequest,
  type SessionUser,
} from '@water-pm/shared';
import { api, ApiError } from '@/lib/api';

export const authApi = {
  /** Returns the current user, or null when there is no valid session. */
  async me(): Promise<SessionUser | null> {
    try {
      return await api.get('/auth/me', sessionUserSchema);
    } catch (error) {
      if (error instanceof ApiError && error.statusCode === 401) {
        return null;
      }
      throw error;
    }
  },
  login: (body: LoginRequest): Promise<SessionUser> =>
    api.post('/auth/login', body, sessionUserSchema),
  logout: (): Promise<void> => api.post('/auth/logout', undefined),
  changePassword: (body: ChangePasswordRequest): Promise<void> =>
    api.post('/auth/change-password', body),
};
