import { Outlet } from 'react-router-dom';
import { AuthBootstrap } from '@/providers/auth-bootstrap';

export function RootLayout() {
  return (
    <>
      <AuthBootstrap />
      <Outlet />
    </>
  );
}
