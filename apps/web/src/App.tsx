import { Navigate, Route, Routes } from 'react-router-dom';
import { RequireAuth, RequireOwner } from '@/components/RequireAuth';
import { DashboardPage } from '@/pages/DashboardPage';
import { LoginPage } from '@/pages/LoginPage';
import { ChangePasswordPage } from '@/pages/ChangePasswordPage';
import { UsersPage } from '@/pages/UsersPage';

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<RequireAuth />}>
        <Route index element={<DashboardPage />} />
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
