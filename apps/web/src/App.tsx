import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireOwner } from '@/components/RequireAuth';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { UsersPage } from '@/pages/UsersPage';
import { ClientsPage } from '@/pages/ClientsPage';
import { ClientDetailPage } from '@/pages/ClientDetailPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { ItemsPage } from '@/pages/ItemsPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
        <Route path="clients" element={<ClientsPage />} />
        <Route path="clients/:id" element={<ClientDetailPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="projects/:id" element={<ProjectDetailPage />} />
        <Route path="items" element={<ItemsPage />} />
        <Route
          path="settings/users"
          element={
            <RequireOwner>
              <UsersPage />
            </RequireOwner>
          }
        />
        <Route path="settings/password" element={<ChangePasswordPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
