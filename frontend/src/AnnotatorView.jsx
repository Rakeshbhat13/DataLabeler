import { useCallback, useEffect, useState } from 'react';
import { apiGet, apiPost } from './api';

export default function AnnotatorView({ datasetId }) {
  const [item, setItem] = useState(null);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchNext = useCallback(async () => {
    setError(null);
    setItem(null);
    setDone(false);
    setLoading(true);
    try {
      const data = await apiGet(`/datasets/${datasetId}/next`);
      if (data?.error) return setError(data.error);
      if (data.done) return setDone(true);
      setItem(data);
    } finally {
      setLoading(false);
    }
  }, [datasetId]);

  useEffect(() => {
    const timer = setTimeout(() => fetchNext(), 0);
    return () => clearTimeout(timer);
  }, [fetchNext, refreshKey]);

  async function handleLabel(label) {
    if (!item) return;
    setError(null);
    setLoading(true);
    try {
      const data = await apiPost(`/datapoints/${item._id}/label`, { label });
      if (data.error) return setError(data.error);
      setRefreshKey(key => key + 1);
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="card done-card">
        <div className="done-icon">🎉</div>
        <h2 style={{ fontSize: '24px' }}>All Items Labeled!</h2>
        <p style={{ color: 'var(--text-muted)', maxWidth: '400px' }}>
          Great job! Every data point in this dataset has been reviewed and annotated.
        </p>
        <button className="secondary-btn" onClick={() => setRefreshKey(k => k + 1)}>
          🔄 Check For New Items
        </button>
      </div>
    );
  }

  if (loading && !item) {
    return (
      <div className="card hint">
        ⏳ Fetching next item to annotate...
      </div>
    );
  }

  if (!item) {
    return (
      <div className="card hint">
        No item available. {error && <div className="error">⚠️ {error}</div>}
      </div>
    );
  }

  return (
    <div className="panel">
      <div className="card">
        <div className="card-title-row">
          <h2>🏷️ Review Data Point</h2>
          <span style={{ fontSize: '12px', color: 'var(--text-subtle)' }}>
            Item ID: {item._id}
          </span>
        </div>

        <div className="annotation-box">
          {item.rawText}
        </div>

        <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '12px' }}>
          Select Sentiment Label:
        </p>

        <div className="button-row">
          <button className="btn-positive" onClick={() => handleLabel('Positive')} disabled={loading}>
            👍 Positive
          </button>
          <button className="btn-negative" onClick={() => handleLabel('Negative')} disabled={loading}>
            👎 Negative
          </button>
          <button className="btn-neutral" onClick={() => handleLabel('Neutral')} disabled={loading}>
            😐 Neutral
          </button>
        </div>

        {error && <div className="error">⚠️ {error}</div>}
      </div>
    </div>
  );
}
