import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from './api';

function safeCsvValue(value) {
  if (value == null) return '';
  const text = String(value).replace(/"/g, '""');
  return text.includes(',') || text.includes('\n') || text.includes('"')
    ? `"${text}"`
    : text;
}

function toCsv(items) {
  const columns = ['rawText', 'label', 'labeledBy', 'labeledAt'];
  const header = columns.join(',');
  const rows = items.map(item =>
    columns.map(col => safeCsvValue(item[col])).join(',')
  );
  return [header, ...rows].join('\n');
}

export default function ManagerView() {
  const [datasets, setDatasets] = useState([]);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [items, setItems] = useState('');
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState(null);

  const fetchDatasets = useCallback(async () => {
    const data = await apiGet('/datasets');
    if (data?.error) return setError(data.error);
    setDatasets(data || []);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => fetchDatasets(), 0);
    return () => clearTimeout(timer);
  }, [fetchDatasets]);

  async function createDataset() {
    setError(null);
    if (!name) return setError('Dataset name is required');
    setLoading(true);
    try {
      const data = await apiPost('/datasets', { name, description });
      if (data.error) return setError(data.error);
      setDatasets(prev => [data, ...prev]);
      setSelectedId(data._id);
      setName('');
      setDescription('');
      setProgress(null);
    } finally {
      setLoading(false);
    }
  }

  async function uploadItems() {
    setError(null);
    if (!selectedId) return setError('Select a dataset first');
    const itemsArray = items
      .split('\n')
      .map(line => line.trim())
      .filter(Boolean);
    if (!itemsArray.length) return setError('Enter at least one line');

    setLoading(true);
    try {
      const data = await apiPost(`/datasets/${selectedId}/upload`, { items: itemsArray });
      if (data.error) return setError(data.error);
      setItems('');
      loadProgress(selectedId);
    } finally {
      setLoading(false);
    }
  }

  async function loadProgress(id) {
    if (!id) return;
    const data = await apiGet(`/datasets/${id}/progress`);
    if (data.error) return setError(data.error);
    setProgress(data);
  }

  async function exportDataset() {
    setError(null);
    if (!selectedId) return setError('Select a dataset first');

    setLoading(true);
    try {
      const data = await apiGet(`/datasets/${selectedId}/export`);
      if (data.error) return setError(data.error);
      const csv = toCsv(data.items || []);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      const safeName = selectedDataset?.name?.replace(/[^a-zA-Z0-9-_ ]/g, '_') || 'dataset';
      link.download = `${safeName}_export.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  }

  function copyDatasetId(id, e) {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  const selectedDataset = datasets.find(d => d._id === selectedId);

  return (
    <div className="panel">
      {/* Dashboard Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Total Datasets</div>
          <div style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', marginTop: '4px' }}>
            {datasets.length}
          </div>
        </div>
        <div className="card" style={{ padding: '20px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Selected Dataset</div>
          <div style={{ fontSize: '16px', fontWeight: '700', color: '#A5B4FC', marginTop: '8px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {selectedDataset ? selectedDataset.name : 'None Selected'}
          </div>
        </div>
      </div>

      {/* Create Dataset Section */}
      <section className="card">
        <div className="card-title-row">
          <h2>➕ Create New Dataset</h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          <label>
            Dataset Name
            <input 
              value={name} 
              onChange={e => setName(e.target.value)} 
              placeholder="e.g., Customer Reviews Sentiment 2026" 
            />
          </label>
          <label>
            Description
            <input 
              value={description} 
              onChange={e => setDescription(e.target.value)} 
              placeholder="Brief overview of data labeling goals..." 
            />
          </label>
        </div>
        <button type="button" onClick={createDataset} disabled={loading}>
          {loading ? 'Creating...' : 'Create Dataset'}
        </button>
      </section>

      {/* Dataset Grid List */}
      <section className="card">
        <div className="card-title-row">
          <h2>📁 Your Datasets ({datasets.length})</h2>
        </div>
        {datasets.length === 0 ? (
          <div className="hint">No datasets created yet. Create one above!</div>
        ) : (
          <div className="dataset-grid">
            {datasets.map(ds => (
              <div 
                key={ds._id} 
                className={`dataset-item-card ${selectedId === ds._id ? 'selected' : ''}`}
                onClick={() => { setSelectedId(ds._id); loadProgress(ds._id); }}
              >
                <div className="dataset-name">{ds.name}</div>
                <div className="dataset-desc">{ds.description || 'No description provided.'}</div>
                <div className="dataset-footer">
                  <span>ID: {ds._id.substring(0, 8)}...</span>
                  <button 
                    className="secondary-btn" 
                    style={{ padding: '4px 10px', fontSize: '11px' }}
                    onClick={(e) => copyDatasetId(ds._id, e)}
                  >
                    {copiedId === ds._id ? 'Copied! ✓' : 'Copy ID'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Upload Items Section */}
      {selectedId && (
        <section className="card">
          <div className="card-title-row">
            <h2>📥 Upload Data Points to "{selectedDataset?.name}"</h2>
          </div>
          <label>
            Raw Data Text (enter one text item per line)
            <textarea 
              value={items} 
              onChange={e => setItems(e.target.value)} 
              placeholder={"Great service and fast delivery!\nItem arrived damaged and late.\nProduct works as expected."} 
              rows={6} 
            />
          </label>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button onClick={uploadItems} disabled={loading}>
              {loading ? 'Uploading...' : 'Upload Text Lines'}
            </button>
            <button className="secondary-btn" onClick={() => loadProgress(selectedId)}>
              🔄 Refresh Progress
            </button>
          </div>
        </section>
      )}

      {/* Progress Monitor Section */}
      {progress && (
        <section className="card">
          <div className="card-title-row">
            <h2>📊 Labeling Progress</h2>
            <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
              {progress.labeled} of {progress.total} items labeled
            </span>
          </div>
          <div className="progress-container">
            <div className="progress-header">
              <span>Overall Completion</span>
              <span>{progress.percent}%</span>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${progress.percent}%` }} />
            </div>
          </div>
          <div style={{ marginTop: '16px' }}>
            <button className="secondary-btn" onClick={exportDataset} disabled={loading}>
              {loading ? 'Preparing export…' : 'Export Dataset CSV'}
            </button>
          </div>
        </section>
      )}

      {error && <div className="error">⚠️ {error}</div>}
    </div>
  );
}
