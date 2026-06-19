import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { Toaster } from 'react-hot-toast';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const BusinessFinderPage = lazy(() => import('../features/finder/BusinessFinderPage').then((module) => ({ default: module.BusinessFinderPage })));
const LoginPage = lazy(() => import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })));

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } },
});

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div className="route-skeleton"><i /><i /><i /></div>}>
          <Routes>
            <Route path="/" element={<BusinessFinderPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
        <Toaster position="top-right" toastOptions={{ className: 'app-toast' }} />
      </BrowserRouter>
    </QueryClientProvider>
  );
}
