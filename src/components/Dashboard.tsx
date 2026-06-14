import React, { useEffect, useState } from 'react';
import { 
  Tv, 
  UserCheck, 
  Clock, 
  TrendingUp, 
  Terminal as TerminalIcon, 
  Zap, 
  ArrowRight,
  ShieldAlert
} from 'lucide-react';

interface DashboardProps {
  coins: number;
  activeViewerCount: number;
  watchTime: number;
  totalViews: number;
  subscribersGenerated: number;
  logs: string[];
  setActiveTab: (tab: string) => void;
  quickLaunchVideo: (url: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  coins,
  activeViewerCount,
  watchTime,
  totalViews,
  subscribersGenerated,
  logs,
  setActiveTab,
  quickLaunchVideo
}) => {
  const [quickUrl, setQuickUrl] = useState('');
  const [chartData, setChartData] = useState([20, 45, 28, 60, 55, 80, 95]);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate live chart data drift slightly
      setChartData(prev => {
        const next = [...prev];
        next.shift();
        const last = next[next.length - 1];
        const randomChange = Math.floor(Math.random() * 21) - 10;
        next.push(Math.max(10, Math.min(150, last + randomChange)));
        return next;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleQuickLaunch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrl.trim()) return;
    quickLaunchVideo(quickUrl);
    setActiveTab('viewer');
  };

  // SVG Chart path calculation
  const getSvgPath = () => {
    const width = 500;
    const height = 150;
    const maxVal = Math.max(...chartData, 100);
    const points = chartData.map((val, index) => {
      const x = (index / (chartData.length - 1)) * width;
      const y = height - (val / maxVal) * height * 0.8 - 10;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const getSvgAreaPath = () => {
    const width = 500;
    const height = 150;
    const linePath = getSvgPath();
    return `${linePath} L ${width},${height} L 0,${height} Z`;
  };

  return (
    <div className="dashboard-wrapper">
      {/* Overview Cards */}
      <div className="dashboard-grid">
        {/* Card 1: Active Streams */}
        <div className="card card-glow-purple stat-widget col-span-3">
          <div className="card-header">
            <span className="card-subtitle">Active Streamers</span>
            <Tv className="stat-icon purple" size={20} />
          </div>
          <div className="stat-value">{activeViewerCount}</div>
          <div className="stat-trend stat-trend-up">
            <Zap size={12} className="pulse-icon" />
            <span>Refreshes auto-cycling</span>
          </div>
        </div>

        {/* Card 2: Generated Views */}
        <div className="card card-glow-cyan stat-widget col-span-3">
          <div className="card-header">
            <span className="card-subtitle">Total Auto-Views</span>
            <TrendingUp className="stat-icon cyan" size={20} />
          </div>
          <div className="stat-value">{totalViews.toLocaleString()}</div>
          <div className="stat-trend stat-trend-up">
            <span>+{activeViewerCount * 4} views/hr speed</span>
          </div>
        </div>

        {/* Card 3: Watch Time */}
        <div className="card card-glow-purple stat-widget col-span-3">
          <div className="card-header">
            <span className="card-subtitle">Generated Watch Time</span>
            <Clock className="stat-icon pink" size={20} />
          </div>
          <div className="stat-value">
            {watchTime < 60 
              ? `${watchTime.toFixed(1)}m` 
              : `${(watchTime / 60).toFixed(1)}h`
            }
          </div>
          <div className="stat-trend stat-trend-up">
            <span>+{activeViewerCount} mins/min accumulation</span>
          </div>
        </div>

        {/* Card 4: Subscribers Promoted */}
        <div className="card card-glow-cyan stat-widget col-span-3">
          <div className="card-header">
            <span className="card-subtitle">Promo Subscribers</span>
            <UserCheck className="stat-icon green" size={20} />
          </div>
          <div className="stat-value">+{subscribersGenerated}</div>
          <div className="stat-trend stat-trend-up">
            <span>Organic referral conversion</span>
          </div>
        </div>
      </div>

      {/* Main Section */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        {/* Performance Chart */}
        <div className="card col-span-7 chart-card">
          <div className="card-header">
            <div>
              <h3 className="card-title">Watch Time Accrual</h3>
              <span className="card-subtitle">Live representation of multi-stream performance (mins)</span>
            </div>
            <span className="badge badge-purple">LIVE</span>
          </div>
          <div className="chart-container">
            <svg viewBox="0 0 500 150" className="chart-svg">
              <defs>
                <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Grid Lines */}
              <line x1="0" y1="30" x2="500" y2="30" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="70" x2="500" y2="70" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              <line x1="0" y1="110" x2="500" y2="110" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
              
              {/* Fill Area */}
              <path d={getSvgAreaPath()} fill="url(#chartGrad)" />
              {/* Line */}
              <path d={getSvgPath()} fill="none" stroke="var(--color-primary)" strokeWidth="3" />
              
              {/* Dots */}
              {chartData.map((val, index) => {
                const maxVal = Math.max(...chartData, 100);
                const x = (index / (chartData.length - 1)) * 500;
                const y = 150 - (val / maxVal) * 150 * 0.8 - 10;
                return (
                  <circle 
                    key={index} 
                    cx={x} 
                    cy={y} 
                    r="4" 
                    fill="var(--color-secondary)" 
                    stroke="var(--bg-secondary)" 
                    strokeWidth="2" 
                  />
                );
              })}
            </svg>
          </div>
        </div>

        {/* Console Logs */}
        <div className="card col-span-5 console-card">
          <div className="card-header">
            <h3 className="card-title"><TerminalIcon size={18} /> Operation Log</h3>
            <span className="badge badge-cyan">SYSTEM</span>
          </div>
          <div className="console-terminal">
            {logs.map((log, index) => (
              <div key={index} className="console-line">
                <span className="console-timestamp">[{new Date().toLocaleTimeString()}]</span>{' '}
                <span className="console-message">{log}</span>
              </div>
            ))}
            {logs.length === 0 && (
              <div className="console-empty">Console idle. Awaiting user interaction...</div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Launch Area */}
      <div className="dashboard-grid" style={{ marginTop: '1.5rem' }}>
        <div className="card col-span-6 quick-launch-card">
          <h3 className="card-title"><Zap size={18} className="yellow" /> Quick Launch Auto-Viewer</h3>
          <p className="card-subtitle" style={{ marginBottom: '1.2rem' }}>
            Paste a YouTube URL below to instantly spin up 4 concurrent streaming instances.
          </p>
          <form onSubmit={handleQuickLaunch} className="quick-form">
            <input 
              type="text" 
              placeholder="https://www.youtube.com/watch?v=..." 
              className="input-field"
              value={quickUrl}
              onChange={(e) => setQuickUrl(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Launch <ArrowRight size={16} />
            </button>
          </form>
        </div>

        <div className="card col-span-6 info-card">
          <div className="info-alert">
            <ShieldAlert size={20} className="warning-icon" />
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Organic View Generation Note</h4>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                To simulate realistic viewer behaviors, YTBoost cycles streams in loops, alternates playback speeds, and injects random delay variations. Keep tabs active for consistent accumulation.
              </p>
            </div>
          </div>
          <div className="action-buttons-row">
            <button className="btn btn-secondary" onClick={() => setActiveTab('promoter')}>
              Configure Auto-Subscribe
            </button>
            <button className="btn btn-secondary" onClick={() => setActiveTab('unlocker')}>
              Create Lock Gateway
            </button>
          </div>
        </div>
      </div>

      <style>{`
        .col-span-3 { grid-column: span 3; }
        .col-span-4 { grid-column: span 4; }
        .col-span-5 { grid-column: span 5; }
        .col-span-6 { grid-column: span 6; }
        .col-span-7 { grid-column: span 7; }

        .stat-icon {
          padding: 0.4rem;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.03);
        }

        .stat-icon.purple { color: var(--color-primary); background: rgba(139, 92, 246, 0.1); }
        .stat-icon.cyan { color: var(--color-secondary); background: rgba(6, 182, 212, 0.1); }
        .stat-icon.pink { color: var(--color-accent); background: rgba(236, 72, 153, 0.1); }
        .stat-icon.green { color: var(--color-success); background: rgba(16, 185, 129, 0.1); }

        .chart-card {
          display: flex;
          flex-direction: column;
        }

        .chart-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 150px;
          padding-top: 1rem;
        }

        .chart-svg {
          width: 100%;
          height: auto;
          overflow: visible;
        }

        .console-card {
          display: flex;
          flex-direction: column;
        }

        .console-terminal {
          background: #04060f;
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 12px;
          padding: 1rem;
          font-family: var(--font-mono);
          font-size: 0.8rem;
          height: 150px;
          overflow-y: auto;
          flex: 1;
          display: flex;
          flex-direction: column-reverse; /* Shows latest logs on bottom, auto-scroll */
        }

        .console-line {
          margin-bottom: 0.4rem;
          line-height: 1.4;
          word-break: break-all;
        }

        .console-timestamp {
          color: var(--text-dark);
        }

        .console-message {
          color: #a7f3d0;
        }

        .console-empty {
          color: var(--text-dark);
          text-align: center;
          margin-top: 3.5rem;
        }

        .quick-form {
          display: flex;
          gap: 0.75rem;
        }

        .quick-form .input-field {
          flex: 1;
        }

        .yellow {
          color: #f59e0b;
        }

        .info-card {
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 1rem;
        }

        .info-alert {
          background: rgba(245, 158, 11, 0.05);
          border: 1px solid rgba(245, 158, 11, 0.15);
          border-radius: 12px;
          padding: 0.9rem;
          display: flex;
          gap: 0.75rem;
          align-items: flex-start;
        }

        .warning-icon {
          color: #f59e0b;
          flex-shrink: 0;
          margin-top: 0.1rem;
        }

        .action-buttons-row {
          display: flex;
          gap: 0.75rem;
        }

        .action-buttons-row button {
          flex: 1;
          font-size: 0.85rem;
        }

        @media (max-width: 1024px) {
          .col-span-3, .col-span-5, .col-span-6, .col-span-7 {
            grid-column: span 6;
          }
        }

        @media (max-width: 768px) {
          .col-span-3, .col-span-5, .col-span-6, .col-span-7 {
            grid-column: span 12;
          }
          .quick-form {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
