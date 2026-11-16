import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { ArrowRight, BadgeCheck, Eye, EyeOff, LockKeyhole, Sparkles } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Form } from '@/components/ui/form';
import {
  getGetCurrentUserQueryKey,
  getGetDashboardSummaryQueryKey,
  getGetLeadsQueryKey,
  getGetSearchHistoryQueryKey,
  getGetSetupStatusQueryKey,
  useGetCurrentUser,
  useGetSetupStatus,
  useLogin,
  type LoginInput,
  type SessionUser,
} from '@workspace/api-client-react';
import { SetupNotice } from '@/components/SetupNotice';

const adminDemo = {
  email: import.meta.env.VITE_DEMO_ADMIN_EMAIL ?? 'admin@webwin.demo',
  password: import.meta.env.VITE_DEMO_ADMIN_PASSWORD ?? 'WebWinAdmin2026!',
};
const salesDemo = {
  email: import.meta.env.VITE_DEMO_SALES_EMAIL ?? 'sales@webwin.demo',
  password: import.meta.env.VITE_DEMO_SALES_PASSWORD ?? 'WebWinSales2026!',
};

// Login screen ek hi seedha kaam karta hai: sahi workspace session kholna.
export default function LoginPage() {
  const loginForm = useForm<LoginInput>({ defaultValues: { email: '', password: '' } });
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const currentUser = useGetCurrentUser({
    query: { queryKey: getGetCurrentUserQueryKey(), retry: false },
  });
  const setup = useGetSetupStatus({
    query: { queryKey: getGetSetupStatusQueryKey(), retry: 1 },
  });
  const login = useLogin();

  useEffect(() => {
    if (currentUser.data) setLocation('/dashboard');
  }, [currentUser.data, setLocation]);

  // Login ke baad dashboard ke visible queries fresh rehte hain.
  const submit = (values: LoginInput) => {
    setFormError('');
    if (!values.email.trim() || !values.password) {
      setFormError('Enter your work email and password to continue.');
      return;
    }
    login.mutate(
      { data: { email: values.email.trim(), password: values.password } },
      {
        onSuccess: (user: SessionUser) => {
          queryClient.setQueryData(getGetCurrentUserQueryKey(), user);
          void queryClient.invalidateQueries({ queryKey: getGetSetupStatusQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetLeadsQueryKey() });
          void queryClient.invalidateQueries({ queryKey: getGetSearchHistoryQueryKey() });
          setLocation('/dashboard');
        },
        onError: () => setFormError('We couldn’t sign you in. Check your details and try again.'),
      },
    );
  };

  const fillDemo = (account: typeof adminDemo) => {
    loginForm.setValue('email', account.email, { shouldDirty: true });
    loginForm.setValue('password', account.password, { shouldDirty: true });
    setFormError('');
  };
  const demoEnabled = setup.data?.demoLoginEnabled === true;

  return (
    <main className="login-layout app-frame">
      <section className="login-story" aria-label="WebWin introduction">
        <div className="story-top">
          <div className="brand-lockup brand-lockup-light">
            <span className="brand-symbol"><span /><span /><span /></span>
            <span>webwin</span>
          </div>
          <span className="story-edition">SALES DISCOVERY · V1</span>
        </div>
        <div className="story-content page-enter">
          <div className="story-kicker"><span className="kicker-dot" /> A clearer way to find your next conversation</div>
          <h1>Find the businesses<br />ready to be <em>found.</em></h1>
          <p>Search local businesses that Google Places doesn’t list a website for. Start a better sales conversation with the right context.</p>
          <div className="story-proof">
            <div className="proof-orbit" aria-hidden="true">
              <span className="orbit-line orbit-one" /><span className="orbit-line orbit-two" />
              <span className="orbit-core"><Sparkles size={19} /></span>
              <i className="orbit-node node-one" /><i className="orbit-node node-two" /><i className="orbit-node node-three" />
            </div>
            <div><strong>One focused workspace</strong><span>Discover, review, and keep every lead close.</span></div>
          </div>
        </div>
        <div className="story-bottom">
          <span>Built for thoughtful outreach.</span>
          <span className="story-mini-mark">WW<span>•</span>01</span>
        </div>
        <span className="story-arc arc-a" aria-hidden="true" />
        <span className="story-arc arc-b" aria-hidden="true" />
      </section>

      <section className="login-side">
        <div className="login-mobile-brand brand-lockup">
          <span className="brand-symbol"><span /><span /><span /></span><span>webwin</span>
        </div>
        <div className="login-card page-enter stagger-1">
          <div className="login-card-intro">
            <div className="login-icon"><LockKeyhole size={19} /></div>
            <p className="eyebrow">WELCOME BACK</p>
            <h2>Sign in to WebWin</h2>
            <p className="intro-copy">Your next great prospect could be a search away.</p>
          </div>
          <Form {...loginForm}>
          <form className="login-form" onSubmit={loginForm.handleSubmit(submit)} noValidate>
            <label className="field-label" htmlFor="login-email">Work email</label>
            <input
              className="text-input"
              id="login-email"
              data-testid="input-email"
              type="email"
              autoComplete="username"
              placeholder="you@company.com"
              {...loginForm.register('email')}
              required
            />
            <div className="password-label-line">
              <label className="field-label" htmlFor="login-password">Password</label>
            </div>
            <div className="password-wrap">
              <input
                className="text-input"
                id="login-password"
                data-testid="input-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Enter your password"
                {...loginForm.register('password')}
                required
              />
              <button
                type="button"
                className="password-toggle"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                data-testid="button-toggle-password"
                onClick={() => setShowPassword((visible) => !visible)}
              >{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button>
            </div>
            {(formError || login.isError) && (
              <p className="form-alert" role="alert" data-testid="status-login-error">{formError || 'Sign in failed. Please try again.'}</p>
            )}
            <button className="button-primary login-submit" type="submit" disabled={login.isPending} data-testid="button-login">
              {login.isPending ? <><span className="mini-spinner spinner-light" /> Signing you in…</> : <>Sign in <ArrowRight size={17} /></>}
            </button>
          </form>
          </Form>
          {demoEnabled && (
            <div className="demo-access">
              <div className="demo-title"><span><BadgeCheck size={15} /> Local development accounts</span><span>DEMO</span></div>
              <p>For local development only. Choose an account to fill the sign-in form.</p>
              <div className="demo-buttons">
                <button type="button" onClick={() => fillDemo(adminDemo)} data-testid="button-demo-admin">Use admin demo</button>
                <button type="button" onClick={() => fillDemo(salesDemo)} data-testid="button-demo-sales">Use sales demo</button>
              </div>
              <details className="demo-details">
                <summary>Show local demo credentials</summary>
                <div><span>Admin</span><code>{adminDemo.email}</code><code>{adminDemo.password}</code></div>
                <div><span>Sales</span><code>{salesDemo.email}</code><code>{salesDemo.password}</code></div>
              </details>
            </div>
          )}
          <div className="login-security"><span className="security-dot" /> Secure team access <span>·</span> Admin &amp; sales roles</div>
        </div>
        <div className="login-setup page-enter stagger-2">
          <SetupNotice compact />
        </div>
        <p className="login-footnote">WebWin <span>·</span> Business discovery workspace</p>
      </section>
    </main>
  );
}