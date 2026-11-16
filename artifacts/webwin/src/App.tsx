import { type ReactNode, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import NotFound from '@/pages/not-found';
import DashboardPage from '@/pages/DashboardPage';
import LoginPage from '@/pages/LoginPage';
import {
  getGetCurrentUserQueryKey,
  useGetCurrentUser,
  type SessionUser,
} from '@workspace/api-client-react';
import { Route, Switch, useLocation, Router as WouterRouter } from 'wouter';

const queryClient = new QueryClient({
  defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 15_000 } },
});

// Session load ke waqt ek composed skeleton dikhate hain.
function AuthLoading() {
  return (
    <main className="auth-loading app-frame" aria-label="Loading WebWin workspace">
      <div className="auth-loading-brand"><span className="brand-symbol"><span /><span /><span /></span> webwin</div>
      <div className="auth-loading-card"><span className="skeleton skeleton-line short" /><span className="skeleton skeleton-number" /><span className="skeleton skeleton-line" /><span className="skeleton skeleton-line" /></div>
    </main>
  );
}

// Root ko session ke hisaab se sirf V1 ki do screens mein bhejte hain.
function RootRedirect({ user, isError }: { user?: SessionUser; isError: boolean }) {
  const [, setLocation] = useLocation();
  useEffect(() => {
    if (user) setLocation('/dashboard');
    else if (isError) setLocation('/login');
  }, [user, isError, setLocation]);
  return <AuthLoading />;
}

// Auth guard ke baad flat routes aur routed error boundary render hota hai.
function Router() {
  const session = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });
  return (
    <RoutedErrorBoundary>
      <Switch>
        <Route path="/login" component={LoginPage} />
        <Route path="/dashboard">
          {session.data ? <DashboardPage user={session.data} /> : session.isError ? <LoginRedirect /> : <AuthLoading />}
        </Route>
        <Route path="/">
          <RootRedirect user={session.data} isError={session.isError} />
        </Route>
        <Route component={NotFound} />
      </Switch>
    </RoutedErrorBoundary>
  );
}

// Protected route se login page par accessible navigation karte hain.
function LoginRedirect() {
  const [, setLocation] = useLocation();
  useEffect(() => setLocation('/login'), [setLocation]);
  return <AuthLoading />;
}

// Route badalne par boundary reset hoti hai aur agle page ka render chalta hai.
function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

// App-level providers API cache aur shared UI primitives ko ready karte hain.
function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
