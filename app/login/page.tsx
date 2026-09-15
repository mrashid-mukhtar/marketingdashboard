'use client';
import { useState, Suspense } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get('callbackUrl') || '/';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    const res = await signIn('credentials', { email, password, redirect: false });
    setBusy(false);
    if (res?.error) {
      setError('Invalid email or password.');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f6fa', fontFamily: 'system-ui,sans-serif' }}>
      <form onSubmit={submit} style={{ background: '#fff', padding: '2.5rem', borderRadius: 12, width: 340, boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: '#2563eb', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>31</div>
          <div>
            <b style={{ display: 'block', fontSize: 15 }}>31G</b>
            <span style={{ fontSize: 12, color: '#64748b' }}>Digital Operations</span>
          </div>
        </div>
        <h1 style={{ fontSize: 18, margin: '0 0 4px' }}>Sign in</h1>
        <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px' }}>Use your 31G team account.</p>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 12 }}>
          Email
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #d8dee8', borderRadius: 8 }} />
        </label>
        <label style={{ display: 'block', fontSize: 13, marginBottom: 16 }}>
          Password
          <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
            style={{ display: 'block', width: '100%', marginTop: 4, padding: '8px 10px', border: '1px solid #d8dee8', borderRadius: 8 }} />
        </label>
        {error && <p style={{ color: '#dc2626', fontSize: 13, marginBottom: 12 }}>{error}</p>}
        <button type="submit" disabled={busy}
          style={{ width: '100%', padding: '10px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
