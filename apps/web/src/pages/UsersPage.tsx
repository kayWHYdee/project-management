import type { Role, User } from '@water-pm/shared';
import { ApiError } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CreateUserDialog } from '@/features/users/CreateUserDialog';
import { useUpdateUser, useUsers } from '@/features/users/hooks';
import { useSession } from '@/features/auth/hooks';

export function UsersPage() {
  const { user: currentUser } = useSession();
  const users = useUsers();
  const updateUser = useUpdateUser();

  const actionError = updateUser.error instanceof ApiError ? updateUser.error.message : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">Manage who can access Water PM.</p>
        </div>
        <CreateUserDialog />
      </div>

      {actionError && (
        <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {actionError}
        </p>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.isPending && (
              <TableRow>
                <TableCell colSpan={5} className="py-6 text-center text-muted-foreground">
                  Loading…
                </TableCell>
              </TableRow>
            )}
            {users.data?.map((row) => (
              <UserRow
                key={row.id}
                user={row}
                isSelf={row.id === currentUser?.id}
                busy={updateUser.isPending}
                onRoleChange={(role) => updateUser.mutate({ id: row.id, body: { role } })}
                onToggleActive={() =>
                  updateUser.mutate({ id: row.id, body: { isActive: !row.isActive } })
                }
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

interface UserRowProps {
  user: User;
  isSelf: boolean;
  busy: boolean;
  onRoleChange: (role: Role) => void;
  onToggleActive: () => void;
}

function UserRow({ user, isSelf, busy, onRoleChange, onToggleActive }: UserRowProps) {
  return (
    <TableRow className={user.isActive ? undefined : 'opacity-60'}>
      <TableCell className="font-medium">
        {user.name}
        {isSelf && <span className="ml-2 text-xs text-muted-foreground">(you)</span>}
      </TableCell>
      <TableCell className="text-muted-foreground">{user.email}</TableCell>
      <TableCell>
        <Select
          className="h-9 w-32"
          value={user.role}
          disabled={busy}
          onChange={(event) => onRoleChange(event.target.value as Role)}
        >
          <option value="OWNER">Owner</option>
          <option value="EDITOR">Editor</option>
          <option value="VIEWER">Viewer</option>
        </Select>
      </TableCell>
      <TableCell>
        {user.isActive ? (
          <Badge variant="success">Active</Badge>
        ) : (
          <Badge variant="muted">Inactive</Badge>
        )}
      </TableCell>
      <TableCell className="text-right">
        <Button
          variant={user.isActive ? 'outline' : 'default'}
          size="sm"
          disabled={busy}
          onClick={onToggleActive}
        >
          {user.isActive ? 'Deactivate' : 'Activate'}
        </Button>
      </TableCell>
    </TableRow>
  );
}
