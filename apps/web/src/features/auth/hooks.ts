import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SessionUser } from '@water-pm/shared';
import { authApi } from './api';

const SESSION_KEY = ['session'] as const;

export function useSession() {
  const query = useQuery({
    queryKey: SESSION_KEY,
    queryFn: authApi.me,
    staleTime: 30_000,
    retry: false,
  });
  return {
    user: query.data ?? null,
    isLoading: query.isPending,
    isAuthenticated: !!query.data,
  };
}

/** OWNER and EDITOR may mutate data; VIEWER is read-only. */
export function useCanWrite(): boolean {
  const { user } = useSession();
  return user?.role === 'OWNER' || user?.role === 'EDITOR';
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (user: SessionUser) => {
      queryClient.setQueryData(SESSION_KEY, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(SESSION_KEY, null);
      queryClient.clear();
    },
  });
}

export function useChangePassword() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.changePassword,
    onSuccess: () => {
      // Server revokes all sessions on a password change; force re-login.
      queryClient.setQueryData(SESSION_KEY, null);
      queryClient.clear();
    },
  });
}
