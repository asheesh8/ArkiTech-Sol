import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from './AppShell';
import { WorkspaceProvider } from './WorkspaceProvider';

const DashboardPage = lazy(() => import('../features/dashboard/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const LeadsPage = lazy(() => import('../features/leads/LeadsPage').then((module) => ({ default: module.LeadsPage })));
const LeadDetailPage = lazy(() => import('../features/leads/LeadDetailPage').then((module) => ({ default: module.LeadDetailPage })));
const PitchPage = lazy(() => import('../features/pitch/PitchPage').then((module) => ({ default: module.PitchPage })));
const ClientsPage = lazy(() => import('../features/clients/ClientsPage').then((module) => ({ default: module.ClientsPage })));
const ClientDetailPage = lazy(() => import('../features/clients/ClientDetailPage').then((module) => ({ default: module.ClientDetailPage })));
const SettingsPage = lazy(() => import('../features/settings/SettingsPage').then((module) => ({ default: module.SettingsPage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WorkspaceProvider>
        <BrowserRouter>
          <Suspense fallback={<div className="route-skeleton"><i /><i /><i /></div>}>
            <Routes>
              <Route path="login" element={<LoginPage />} />
              <Route element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="leads" element={<LeadsPage />} />
                <Route path="leads/:leadId" element={<LeadDetailPage />} />
                <Route path="pitch" element={<PitchPage />} />
                <Route path="clients" element={<ClientsPage />} />
                <Route path="clients/:clientId" element={<ClientDetailPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
        <Toaster position="top-right" toastOptions={{ className: 'app-toast' }} />
      </WorkspaceProvider>
    </QueryClientProvider>
  );
}
