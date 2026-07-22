import {
  userListSchema,
  userSchema,
  type CreateUserRequest,
  type UpdateUserRequest,
  type User,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const usersApi = {
  list: (): Promise<User[]> => api.get('/users', userListSchema),
  create: (body: CreateUserRequest): Promise<User> => api.post('/users', body, userSchema),
  update: (id: string, body: UpdateUserRequest): Promise<User> =>
    api.patch(`/users/${id}`, body, userSchema),
};
