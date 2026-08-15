import {
  employeeDetailSchema,
  employeeListSchema,
  employeeSchema,
  type CreateEmployeeRequest,
  type Employee,
  type EmployeeDetail,
  type UpdateEmployeeRequest,
} from '@water-pm/shared';
import { api } from '@/lib/api';

export const employeesApi = {
  list: (search?: string): Promise<Employee[]> =>
    api.get(
      `/employees${search ? `?search=${encodeURIComponent(search)}` : ''}`,
      employeeListSchema,
    ),
  get: (id: string): Promise<EmployeeDetail> => api.get(`/employees/${id}`, employeeDetailSchema),
  create: (body: CreateEmployeeRequest): Promise<Employee> =>
    api.post('/employees', body, employeeSchema),
  update: (id: string, body: UpdateEmployeeRequest): Promise<Employee> =>
    api.patch(`/employees/${id}`, body, employeeSchema),
  remove: (id: string): Promise<void> => api.delete(`/employees/${id}`),
};
