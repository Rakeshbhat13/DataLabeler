import { useEffect, useState } from 'react';
import ManagerView from './ManagerView.jsx';
import AnnotatorView from './AnnotatorView.jsx';
import AuthView from './AuthView.jsx';
import { apiGet } from './api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(() => {
    const stored = window.localStorage.getItem('token');
    const role = window.localStorage.getItem('role');
    const email = window.localStorage.getItem('email');
    return stored && role && email ? { token: stored, role, email } : null;
  });
  const [datasetId, setDatasetId] = useState('');
  const [availableDatasets, setAvailableDatasets] = useState([]);
  const [error, setError] = useState(null);

  function handleAuth({ token, role, email }) {
    window.localStorage.setItem('token', token);
    window.localStorage.setItem('role', role);
    window.localStorage.setItem('email', email);
    setUser({ token, role, email });
  }

  async function loadDatasets() {
    setError(null);
    const data = await apiGet('/datasets');
    if (data.error) return setError(data.error);
    setAvailableDatasets(data);
  }

  useEffect(() => {
    if (user?.role === 'annotator') {
      loadDatasets();
    }
  }, [user]);

  function logout() {
    window.localStorage.removeItem('token');
    window.localStorage.removeItem('role');
    window.localStorage.removeItem('email');
    setUser(null);
    setDatasetId('');
    setAvailableDatasets([]);
  }

  if (!user) return <AuthView onAuth={handleAuth} />;

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand-container">
          <div className="brand-icon">✨</div>
          <div>
            <div className="brand-title">DataLabeler</div>
            <div className="brand-subtitle">AI Dataset Annotation Platform</div>
          </div>
        </div>
        <div className="role-switch">
          <div className="role-badge">{user.role}</div>
          <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>{user.email}</span>
          <button className="logout-btn" onClick={logout}>Sign Out</button>
        </div>
      </header>

      <main>
        {user.role === 'manager' ? (
          <ManagerView />
        ) : (
          <section className="panel">
            <div className="card">
              <div className="card-title-row">
                <h2>🏷️ Annotator Workspace</h2>
              </div>
              <label>
                Select a Dataset
                <select value={datasetId} onChange={e => setDatasetId(e.target.value)}>
                  <option value="">Choose a dataset...</option>
                  {availableDatasets.map(ds => (
                    <option key={ds._id} value={ds._id}>
                      {ds.name} {ds.description ? `— ${ds.description}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {datasetId ? (
              <AnnotatorView datasetId={datasetId} />
            ) : (
              <div className="card hint">
                ⚡ Select a dataset from the list above to start labeling items.
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
