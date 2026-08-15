import { useState } from 'react';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useCreateEmployee, useEmployees } from './hooks';

const ADD_VALUE = '__add__';

/**
 * Pick an existing employee or add a new one inline (so a technician can be
 * created without leaving the visit form). Controlled by `value` (employee id).
 */
export function EmployeePicker({
  value,
  onChange,
  autoFocus,
}: {
  value: string;
  onChange: (id: string) => void;
  autoFocus?: boolean;
}) {
  const employees = useEmployees();
  const createEmployee = useCreateEmployee();
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  // Keep inactive staff out of the list, unless one is already selected here.
  const list = (employees.data ?? []).filter((e) => e.isActive || e.id === value);

  const onAdd = () => {
    const name = newName.trim();
    if (!name) return;
    createEmployee.mutate(
      { name },
      {
        onSuccess: (employee) => {
          onChange(employee.id);
          setNewName('');
          setAdding(false);
        },
      },
    );
  };

  if (adding) {
    const error = createEmployee.error instanceof ApiError ? createEmployee.error.message : null;
    return (
      <div className="space-y-1.5">
        <div className="flex gap-2">
          <Input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="New employee name"
          />
          <Button
            type="button"
            onClick={onAdd}
            disabled={createEmployee.isPending || !newName.trim()}
          >
            {createEmployee.isPending ? 'Adding…' : 'Add'}
          </Button>
          <Button type="button" variant="outline" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-xs text-destructive">{error}</p>}
      </div>
    );
  }

  return (
    <Select
      autoFocus={autoFocus}
      value={value}
      onChange={(e) => (e.target.value === ADD_VALUE ? setAdding(true) : onChange(e.target.value))}
    >
      <option value="">— Select employee —</option>
      {list.map((employee) => (
        <option key={employee.id} value={employee.id}>
          {employee.name}
          {employee.role ? ` (${employee.role})` : ''}
        </option>
      ))}
      <option value={ADD_VALUE}>+ Add new employee…</option>
    </Select>
  );
}
