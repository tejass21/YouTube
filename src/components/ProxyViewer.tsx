import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Globe, 
  Clock, 
  Terminal, 
  Sparkles, 
  Layers, 
  Cpu, 
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  List
} from 'lucide-react';

interface SessionState {
  id: number;
  status: string;
  proxyIp?: string;
  proxyUrl?: string;
  viewCount: number;
  elapsed: number;
  target: number;
  running: boolean;
  logs: string[];
}

export const ProxyViewer: React.FC = () => {
  const [videoUrl, setVideoUrl] = useState('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  const [searchQuery, setSearchQuery] = useState('rickroll');
  const [frameCount, setFrameCount] = useState(4);
  const [proxies, setProxies] = useState<string[]>([
    'http://username:password@ip:port',
    'http://username:password@ip:port',
    'http://username:password@ip:port',
    'http://username:password@ip:port'
  ]);
  const [targetViews, setTargetViews] = useState(10);
  const [minWatch, setMinWatch] = useState(30);
  const [maxWatch, setMaxWatch] = useState(58);
  const [isRunning, setIsRunning] = useState(false);
  const [sessions, setSessions] = useState<Record<number, SessionState>>({});
  const [serverConnected, setServerConnected] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);

  // Sync proxy list length with frameCount
  useEffect(() => {
    setProxies(prev => {
      const copy = [...prev];
      if (copy.length < frameCount) {
        while (copy.length < frameCount) {
          copy.push('');
        }
      } else if (copy.length > frameCount) {
        return copy.slice(0, frameCount);
      }
      return copy;
    });
  }, [frameCount]);

  // Connect to backend WebSocket
  useEffect(() => {
    const connectWS = () => {
      const ws = new WebSocket('ws://localhost:3001');

      ws.onopen = () => {
        console.log('[WS] Connected to bot-server');
        setServerConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'init') {
            setSessions(data.sessions);
            // Determine if any session is actively running
            const running = Object.values(data.sessions).some((s: any) => s.running);
            setIsRunning(running);
          } else if (data.type === 'session_update') {
            setSessions(prev => {
              const updated = { ...prev, [data.session.id]: data.session };
              const running = Object.values(updated).some(s => s.running);
              setIsRunning(running);
              return updated;
            });
          }
        } catch (err) {
          console.error('[WS] Error parsing message', err);
        }
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        setServerConnected(false);
        setIsRunning(false);
        // Retry connection after 3 seconds
        setTimeout(connectWS, 3000);
      };

      wsRef.current = ws;
    };

    connectWS();

    // Check if server is running on load
    fetch('http://localhost:3001/api/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'ok') setServerConnected(true);
      })
      .catch(() => setServerConnected(false));

    return () => {
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const handleProxyChange = (index: number, val: string) => {
    setProxies(prev => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  };

  const handleAutoFetchProxies = async () => {
    try {
      const res = await fetch('https://api.proxyscrape.com/v2/?request=displayproxies&protocol=http&timeout=5000&country=all&ssl=all&anonymity=anonymous');
      if (res.ok) {
        const text = await res.text();
        const rawList = text.split('\n')
          .map(p => p.trim())
          .filter(p => p.length > 4 && p.includes(':'));
        
        // Take up to frameCount proxies randomly
        const shuffled = [...rawList].sort(() => 0.5 - Math.random());
        const selected = shuffled.slice(0, frameCount).map(p => `http://${p}`);
        
        setProxies(prev => {
          const copy = [...prev];
          for (let i = 0; i < frameCount; i++) {
            if (selected[i]) {
              copy[i] = selected[i];
            }
          }
          return copy;
        });
      } else {
        alert('Failed to fetch free proxies from public API.');
      }
    } catch (err) {
      alert('Error fetching proxies: ' + (err as Error).message);
    }
  };

  const startAll = async () => {
    if (!videoUrl) {
      alert('Please enter a valid YouTube Video URL');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          videoUrl,
          searchQuery,
          proxies,
          targetViews,
          minWatch,
          maxWatch
        })
      });

      const data = await response.json();
      if (data.success) {
        setIsRunning(true);
      } else {
        alert('Failed to start session: ' + data.error);
      }
    } catch (err) {
      alert('Failed to connect to backend bot-server. Is it running? run "node bot-server.js" first.');
    }
  };

  const stopAll = async () => {
    try {
      await fetch('http://localhost:3001/api/stop', { method: 'POST' });
      setIsRunning(false);
    } catch (err) {
      console.error(err);
    }
  };

  const reloadSession = async (id: number) => {
    try {
      await fetch(`http://localhost:3001/api/reload/${id}`, { method: 'POST' });
    } catch (err) {
      console.error(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'watching': return '#10b981'; // Green
      case 'navigating':
      case 'detecting_ip': return '#3b82f6'; // Blue
      case 'cooldown': return '#f59e0b'; // Orange
      case 'complete': return '#a78bfa'; // Purple
      case 'stopped': return '#ef4444'; // Red
      default: return '#6b7280'; // Gray
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="proxy-viewer-container">
      {/* Server Status Header banner */}
      {!serverConnected && (
        <div className="card connection-error-card">
          <div className="warning-flex">
            <AlertTriangle className="warning-icon-large" size={32} />
            <div className="warning-content">
              <h4>Bot Server Offline</h4>
              <p>
                To run multi-IP browser sessions, the dedicated Puppeteer server must be running. Run the following command in a new terminal inside your project directory:
              </p>
              <div className="terminal-guide">
                <Terminal size={14} className="terminal-icon" />
                <code>node bot-server.js</code>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Control Panel */}
      <div className="card config-card">
        <h3 className="card-title">
          <Cpu size={20} className="purple" /> Multi-IP Puppeteer Controller
        </h3>

        <div className="config-grid">
          {/* Target Video URL */}
          <div className="form-group col-span-6">
            <label className="form-label">YouTube Video URL</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="VLOG or Shorts URL..."
              value={videoUrl}
              onChange={(e) => setVideoUrl(e.target.value)}
              disabled={isRunning}
            />
          </div>

          {/* Search Query */}
          <div className="form-group col-span-6">
            <label className="form-label">Organic Search Query (Keyword)</label>
            <input 
              type="text" 
              className="input-field"
              placeholder="e.g. video title or search tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              disabled={isRunning}
            />
          </div>

          {/* Viewports / Frame Count */}
          <div className="form-group col-span-4">
            <label className="form-label">Number of Viewports (IPs)</label>
            <select
              className="select-field"
              value={frameCount}
              onChange={(e) => setFrameCount(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={1}>1 Frame (1 IP)</option>
              <option value={2}>2 Frames (2 IPs)</option>
              <option value={4}>4 Frames (4 IPs)</option>
              <option value={6}>6 Frames (6 IPs)</option>
              <option value={8}>8 Frames (8 IPs)</option>
              <option value={12}>12 Frames (12 IPs)</option>
            </select>
          </div>

          {/* Target Views */}
          <div className="form-group col-span-4">
            <label className="form-label">Target Views (Per IP)</label>
            <input 
              type="number" 
              className="input-field"
              value={targetViews}
              onChange={(e) => setTargetViews(Number(e.target.value))}
              disabled={isRunning}
            />
          </div>

          {/* Watch Time Range */}
          <div className="form-group col-span-4">
            <label className="form-label">Watch Time Range (Seconds)</label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input 
                type="number" 
                className="input-field"
                style={{ textAlign: 'center' }}
                value={minWatch}
                onChange={(e) => setMinWatch(Number(e.target.value))}
                disabled={isRunning}
              />
              <span style={{ color: 'var(--text-muted)' }}>to</span>
              <input 
                type="number" 
                className="input-field"
                style={{ textAlign: 'center' }}
                value={maxWatch}
                onChange={(e) => setMaxWatch(Number(e.target.value))}
                disabled={isRunning}
              />
            </div>
          </div>
        </div>

        {/* Dynamic Proxy Inputs */}
        <div className="proxy-inputs-section">
          <div className="proxy-inputs-header">
            <h4 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Globe size={16} className="cyan" /> Proxy IP Configurations ({frameCount} required)
            </h4>
            <button 
              className="btn btn-secondary btn-sm"
              onClick={handleAutoFetchProxies}
              disabled={isRunning}
              style={{ padding: '0.3rem 0.75rem', fontSize: '0.8rem' }}
            >
              <Sparkles size={12} /> Auto-Fetch Free Proxies
            </button>
          </div>

          <div className="proxy-inputs-grid">
            {Array.from({ length: frameCount }).map((_, idx) => (
              <div className="proxy-input-row" key={idx}>
                <span className="proxy-idx">IP #{idx + 1}</span>
                <input 
                  type="text" 
                  className="input-field input-sm"
                  placeholder="http://ip:port OR http://user:pass@ip:port (leave blank for local IP)"
                  value={proxies[idx] || ''}
                  onChange={(e) => handleProxyChange(idx, e.target.value)}
                  disabled={isRunning}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Master Control Buttons */}
        <div className="action-row">
          {!isRunning ? (
            <button 
              className="btn btn-primary" 
              onClick={startAll} 
              disabled={!serverConnected}
              style={{ flex: 1 }}
            >
              <Play size={16} fill="#ffffff" /> Start Multi-IP Sessions
            </button>
          ) : (
            <button 
              className="btn btn-danger" 
              onClick={stopAll} 
              style={{ flex: 1 }}
            >
              <Pause size={16} fill="currentColor" /> Terminate All Sessions
            </button>
          )}
        </div>
      </div>

      {/* Active Sessions Grid */}
      {Object.keys(sessions).length > 0 ? (
        <div className="sessions-section">
          <div className="sessions-header">
            <h3 className="section-title"><Layers size={18} /> Active Puppeteer Grid</h3>
            <span className="badge badge-purple">{Object.keys(sessions).length} Nodes Running</span>
          </div>

          <div className="sessions-grid">
            {Object.values(sessions).map((session) => {
              const percentage = session.target > 0 ? (session.elapsed / session.target) * 100 : 0;
              const statusColor = getStatusColor(session.status);

              return (
                <div key={session.id} className="card session-card">
                  {/* Card Header */}
                  <div className="session-card-header">
                    <span className="session-name">Node #{session.id}</span>
                    <span 
                      className="session-status"
                      style={{ color: statusColor, background: `${statusColor}1A`, border: `1px solid ${statusColor}33` }}
                    >
                      {session.status.toUpperCase()}
                    </span>
                  </div>

                  {/* Proxy Details */}
                  <div className="session-details">
                    <div className="detail-item">
                      <span className="detail-label">Active IP:</span>
                      <span className="detail-val text-gradient" style={{ fontWeight: 700 }}>
                        {session.proxyIp || 'Emulating...'}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label">Target Views:</span>
                      <span className="detail-val">{session.viewCount} completed</span>
                    </div>
                  </div>

                  {/* Live Progress Bar */}
                  {session.status === 'watching' && (
                    <div className="progress-section">
                      <div className="progress-labels">
                        <span className="label-time"><Clock size={12} /> {formatTime(session.elapsed)}</span>
                        <span className="label-target">{formatTime(session.target)}</span>
                      </div>
                      <div className="progress-bar-container">
                        <div 
                          className="progress-bar-fill"
                          style={{ width: `${percentage}%`, background: `linear-gradient(90deg, var(--color-primary), ${statusColor})` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Worker Console Logs */}
                  <div className="session-logs-container">
                    <div className="logs-title"><Terminal size={12} /> Node Logs</div>
                    <div className="logs-window">
                      {session.logs && session.logs.slice(0, 3).map((log, lIdx) => (
                        <div className="log-line" key={lIdx}>{log}</div>
                      ))}
                      {(!session.logs || session.logs.length === 0) && (
                        <div className="log-empty">Waiting for session log events...</div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="session-card-actions">
                    <button 
                      className="btn btn-secondary btn-xs"
                      onClick={() => reloadSession(session.id)}
                      disabled={!session.running}
                    >
                      <RefreshCw size={12} /> Reboot Node
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card empty-grid-card">
          <List size={40} className="info-icon" />
          <h4>No Active Puppeteer Sessions</h4>
          <p>Configure inputs above and click "Start Multi-IP Sessions" to spin up background Chromium instances.</p>
        </div>
      )}

      <style>{`
        .proxy-viewer-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .connection-error-card {
          background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(220, 38, 38, 0.03) 100%);
          border: 1px solid rgba(239, 68, 68, 0.2);
          border-left: 4px solid #ef4444;
          padding: 1.5rem;
        }

        .warning-flex {
          display: flex;
          gap: 1.25rem;
          align-items: flex-start;
        }

        .warning-icon-large {
          color: #ef4444;
          flex-shrink: 0;
          animation: pulse 2s infinite;
        }

        .warning-content h4 {
          color: #fca5a5;
          font-size: 1.05rem;
          margin-bottom: 0.5rem;
          font-weight: 700;
        }

        .warning-content p {
          font-size: 0.875rem;
          line-height: 1.5;
          color: var(--text-muted);
        }

        .terminal-guide {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          background: #030712;
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: #34d399;
          margin-top: 0.75rem;
          width: fit-content;
        }

        .terminal-icon {
          color: #10b981;
        }

        .proxy-inputs-section {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 1rem;
          margin-top: 1rem;
          margin-bottom: 1.25rem;
        }

        .proxy-inputs-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          padding-bottom: 0.75rem;
          margin-bottom: 0.75rem;
        }

        .proxy-inputs-grid {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
          max-height: 250px;
          overflow-y: auto;
          padding-right: 0.5rem;
        }

        .proxy-input-row {
          display: flex;
          align-items: center;
          gap: 1rem;
        }

        .proxy-idx {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--text-muted);
          min-width: 60px;
        }

        .action-row {
          display: flex;
          gap: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.25rem;
        }

        .sessions-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .sessions-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .section-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin: 0;
          font-size: 1.2rem;
          font-weight: 700;
        }

        .sessions-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 1rem;
        }

        .session-card {
          padding: 1.25rem;
          background: #090c17;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          position: relative;
          overflow: hidden;
        }

        .session-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .session-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .session-status {
          font-size: 0.65rem;
          font-weight: 800;
          padding: 0.2rem 0.5rem;
          border-radius: 99px;
        }

        .session-details {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
          font-size: 0.8rem;
        }

        .detail-item {
          display: flex;
          justify-content: space-between;
        }

        .detail-label {
          color: var(--text-muted);
        }

        .detail-val {
          font-weight: 600;
        }

        .progress-section {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .progress-labels {
          display: flex;
          justify-content: space-between;
          font-size: 0.75rem;
          font-family: var(--font-mono);
          color: var(--text-muted);
        }

        .label-time {
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .progress-bar-container {
          height: 5px;
          background: rgba(255, 255, 255, 0.03);
          border-radius: 99px;
          overflow: hidden;
        }

        .progress-bar-fill {
          height: 100%;
          border-radius: 99px;
          transition: width 1s linear;
        }

        .session-logs-container {
          background: #03050c;
          border: 1px solid rgba(255, 255, 255, 0.03);
          border-radius: 8px;
          padding: 0.5rem 0.75rem;
        }

        .logs-title {
          font-size: 0.7rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-dark);
          margin-bottom: 0.35rem;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .logs-window {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          font-family: var(--font-mono);
          font-size: 0.7rem;
          max-height: 60px;
          overflow-y: auto;
        }

        .log-line {
          color: #86efac;
          line-height: 1.3;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .log-empty {
          color: var(--text-dark);
          font-style: italic;
        }

        .session-card-actions {
          display: flex;
          justify-content: flex-end;
          margin-top: auto;
          padding-top: 0.5rem;
          border-top: 1px solid rgba(255, 255, 255, 0.03);
        }

        .btn-xs {
          padding: 0.25rem 0.5rem;
          font-size: 0.75rem;
        }

        .empty-grid-card {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 4rem 2rem;
          color: var(--text-muted);
          gap: 0.75rem;
          background: rgba(13, 17, 39, 0.3);
        }

        .info-icon {
          color: var(--border-glow);
        }

        .empty-grid-card h4 {
          color: var(--text-main);
          font-size: 1.1rem;
        }

        .empty-grid-card p {
          max-width: 400px;
          font-size: 0.85rem;
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
};
