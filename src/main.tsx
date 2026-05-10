import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { HelmetProvider } from 'react-helmet-async';
import { RouterProvider } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppSplash } from '@/components/shared/app-splash';
import { getEnv } from '@/config/env';
import { AppQueryProvider } from '@/providers/query-provider';
import { router } from '@/router';
import '@/styles/globals.css';

getEnv();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <AppQueryProvider>
        <Suspense fallback={<AppSplash />}>
          <RouterProvider router={router} />
        </Suspense>
        <Toaster richColors position="top-center" />
      </AppQueryProvider>
    </HelmetProvider>
  </StrictMode>,
);
