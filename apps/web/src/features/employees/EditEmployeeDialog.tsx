import { updateEmployeeRequestSchema, type Employee } from '@water-pm/shared';
import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Field } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useUpdateEmployee } from './hooks';

export function EditEmployeeDialog({
  employee,
  onClose,
}: {
  employee: Employee;
  onClose: () => void;
}) {
  const updateEmployee = useUpdateEmployee(employee.id);
  const [name, setName] = useState(employee.name);
  const [mobile, setMobile] = useState(employee.mobile ?? '');
  const [role, setRole] = useState(employee.role);
  const [isActive, setIsActive] = useState(employee.isActive);
  const [fieldError, setFieldError] = useState<string | null>(null);

  const onSave = () => {
    const parsed = updateEmployeeRequestSchema.safeParse({
      version: employee.version,
      name: name.trim(),
      mobile,
      role: role.trim(),
      isActive,
    });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Please check the values');
      return;
    }
    setFieldError(null);
    updateEmployee.mutate(parsed.data, { onSuccess: onClose });
  };

  const error =
    fieldError ?? (updateEmployee.error instanceof ApiError ? updateEmployee.error.message : null);

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit employee</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <Field label="Name" htmlFor="emp-name">
            <Input id="emp-name" value={name} onChange={(e) => setName(e.target.value)} autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mobile" htmlFor="emp-mobile">
              <Input
                id="emp-mobile"
                inputMode="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
              />
            </Field>
            <Field label="Role" htmlFor="emp-role">
              <Input id="emp-role" value={role} onChange={(e) => setRole(e.target.value)} />
            </Field>
          </div>
          <Field label="Status" htmlFor="emp-active">
            <Select
              id="emp-active"
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </Select>
          </Field>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onSave}
              disabled={updateEmployee.isPending || !name.trim()}
            >
              {updateEmployee.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
