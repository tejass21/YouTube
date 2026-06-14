import React, { useEffect, useState } from 'react';
import { ShieldCheck, Wifi, Activity, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
}

export const Header: React.FC<HeaderProps> = ({ activeTab }) => {
  const [latency, setLatency] = useState(35);
  const [activeUsers, setActiveUsers] = useState(1420);

  useEffect(() => {
    const interval = setInterval(() => {
      // Simulate micro-fluctuations in metrics
      setLatency(prev => Math.max(12, Math.min(80, prev + Math.floor(Math.random() * 11) - 5)));
      setActiveUsers(prev => prev + Math.floor(Math.random() * 5) - 2);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const getTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Command Center';
      case 'viewer': return 'Multi-Stream Auto Viewer';
      case 'promoter': return 'Subscriber Promoter';
      case 'unlocker': return 'Content Lock Gate Builder';
      default: return 'YTBoost';
    }
  };

  const getSubTitle = () => {
    switch (activeTab) {
      case 'dashboard': return 'Monitor active viewer sessions, check credit exchange status and platform metrics.';
      case 'viewer': return 'Launch and manage multiple concurrent YouTube stream loops to increase views and watch time.';
      case 'promoter': return 'Generate high-conversion subscription links and exchange credits for channel subscribers.';
      case 'unlocker': return 'Build high-performance landing pages that unlock files or text only after subscribing.';
      default: return 'Grow your YouTube channel authority.';
    }
  };

  return (
    <header className="header-container">
      <div className="header-titles">
        <h1 className="header-title text-gradient">{getTitle()}</h1>
        <p className="header-subtitle">{getSubTitle()}</p>
      </div>

      <div className="header-metrics">
        {/* Network status */}
        <div className="metric-tag">
          <Wifi size={14} className="metric-icon cyan" />
          <span>Latency: <strong className="metric-val">{latency}ms</strong></span>
        </div>

        {/* Global users status */}
        <div className="metric-tag">
          <Activity size={14} className="metric-icon pink" />
          <span>Active Nodes: <strong className="metric-val">{activeUsers.toLocaleString()}</strong></span>
        </div>

        {/* System integrity */}
        <div className="metric-tag system-status">
          <ShieldCheck size={14} className="metric-icon green" />
          <span className="status-dot green-dot" />
          <span>Core Operational</span>
        </div>
      </div>

      <style>{`
        .header-container {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 1.75rem;
          border-bottom: 1px solid var(--border-color);
          margin-bottom: 2rem;
          flex-wrap: wrap;
          gap: 1.5rem;
        }

        .header-titles {
          flex: 1;
          min-width: 280px;
        }

        .header-title {
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -0.02em;
          margin-bottom: 0.25rem;
        }

        .header-subtitle {
          font-size: 0.9rem;
          color: var(--text-muted);
          max-width: 600px;
        }

        .header-metrics {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .metric-tag {
          background: rgba(22, 28, 60, 0.4);
          border: 1px solid var(--border-color);
          padding: 0.5rem 0.85rem;
          border-radius: 10px;
          font-size: 0.775rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 600;
        }

        .metric-val {
          color: var(--text-main);
          font-family: var(--font-mono);
        }

        .metric-icon.cyan { color: var(--color-secondary); }
        .metric-icon.pink { color: var(--color-accent); }
        .metric-icon.green { color: var(--color-success); }

        .system-status {
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.05);
          color: #a7f3d0;
        }

        .status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
        }

        .green-dot {
          background-color: var(--color-success);
          box-shadow: 0 0 8px var(--color-success);
          animation: pulse-dot 1.5s infinite;
        }

        @keyframes pulse-dot {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }

        @media (max-width: 768px) {
          .header-container {
            padding-top: 3.5rem; /* Allow space for mobile menu toggle button */
          }
        }
      `}</style>
    </header>
  );
};
