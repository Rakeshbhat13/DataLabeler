import { useState } from 'react';
import { apiPost } from './api';

export default function AuthView({ onAuth }) {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('manager');
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    setError(null);
    if (!email || !password) return setError('Email and password are required');

    setLoading(true);
    try {
      if (mode === 'register') {
        const data = await apiPost('/auth/register', { email, password, role });
        if (data.error) return setError(data.error);
        setMode('login');
        setError(null);
        alert('Registration successful! Please login.');
        return;
      }

      const data = await apiPost('/auth/login', { email, password });
      if (data.error) return setError(data.error);
      onAuth({ token: data.token, role: data.role, email: data.email });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-wrapper">
      <div className="card auth-card">
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div className="brand-icon" style={{ margin: '0 auto 12px auto', width: '56px', height: '56px', fontSize: '28px' }}>✨</div>
          <h1 className="brand-title" style={{ fontSize: '28px' }}>DataLabeler</h1>
          <p className="brand-subtitle">AI Dataset Annotation Studio</p>
        </div>

        <div className="toggle-row">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => { setMode('login'); setError(null); }} type="button">
            Sign In
          </button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => { setMode('register'); setError(null); }} type="button">
            Create Account
          </button>
        </div>

        <label>
          Email Address
          <input 
            type="email" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            placeholder="name@company.com" 
          />
        </label>
        
        <label>
          Password
          <input 
            type="password" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            placeholder="••••••••" 
          />
        </label>

        {mode === 'register' && (
          <label>
            Select Role
            <select value={role} onChange={e => setRole(e.target.value)}>
              <option value="manager">📊 Manager (Create & Manage Datasets)</option>
              <option value="annotator">🏷️ Annotator (Label Data Points)</option>
            </select>
          </label>
        )}

        <button onClick={submit} disabled={loading} style={{ width: '100%', marginTop: '12px' }}>
          {loading ? 'Please wait...' : mode === 'login' ? 'Sign In to Workspace →' : 'Register Account →'}
        </button>

        {error && <div className="error">⚠️ {error}</div>}
      </div>
    </div>
  );
}
