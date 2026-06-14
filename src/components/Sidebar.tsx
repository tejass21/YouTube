import React from 'react';
import { 
  LayoutDashboard, 
  Tv, 
  UserPlus, 
  Lock, 
  Coins, 
  Zap,
  Menu,
  X,
  Globe
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  coins: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, coins }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: 'var(--color-primary)' },
    { id: 'viewer', label: 'Auto-Viewer', icon: Tv, color: 'var(--color-secondary)' },
    { id: 'proxy_viewer', label: 'Proxy Viewer', icon: Globe, color: '#06b6d4' },
    { id: 'promoter', label: 'Sub Promoter', icon: UserPlus, color: 'var(--color-accent)' },
    { id: 'unlocker', label: 'Content Unlocker', icon: Lock, color: '#f59e0b' },
  ];

  return (
    <>
      {/* Mobile Toggle Button */}
      <button 
        className="mobile-nav-toggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Navigation"
      >
        {isOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <aside className={`sidebar-container ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-logo-container">
            <Zap className="brand-icon" size={24} />
          </div>
          <span className="brand-name">YT<span className="text-gradient">Boost</span></span>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`nav-item ${isActive ? 'active' : ''}`}
                style={{ '--accent-color': item.color } as React.CSSProperties}
              >
                <Icon className="nav-icon" size={20} />
                <span className="nav-label">{item.label}</span>
                {isActive && <div className="nav-indicator" />}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="wallet-card">
            <div className="wallet-header">
              <Coins size={16} className="coin-icon" />
              <span>Wallet Balance</span>
            </div>
            <div className="wallet-value">
              {coins.toLocaleString()} <span className="wallet-unit">Coins</span>
            </div>
            <div className="wallet-badge">VIP Active</div>
          </div>
          <div className="developer-tag">
            <span>YTBoost v1.2.0</span>
          </div>
        </div>
      </aside>

      {/* CSS specific to Sidebar and Layout */}
      <style>{`
        .sidebar-container {
          width: 260px;
          background: rgba(13, 17, 39, 0.9);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-right: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          height: 100vh;
          padding: 2rem 1.25rem;
          transition: var(--transition-normal);
          z-index: 100;
          position: sticky;
          top: 0;
        }

        .sidebar-brand {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-bottom: 3rem;
          padding-left: 0.5rem;
        }

        .brand-logo-container {
          background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%);
          width: 38px;
          height: 38px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);
        }

        .brand-icon {
          color: #ffffff;
          fill: #ffffff;
        }

        .brand-name {
          font-family: var(--font-primary);
          font-size: 1.4rem;
          font-weight: 800;
          letter-spacing: -0.03em;
        }

        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          flex: 1;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          padding: 0.9rem 1rem;
          border-radius: 12px;
          border: 1px solid transparent;
          background: transparent;
          color: var(--text-muted);
          font-family: var(--font-primary);
          font-size: 0.95rem;
          font-weight: 600;
          text-align: left;
          cursor: pointer;
          position: relative;
          transition: var(--transition-normal);
          width: 100%;
        }

        .nav-item:hover {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.02);
          border-color: rgba(255, 255, 255, 0.03);
          transform: translateX(4px);
        }

        .nav-item.active {
          color: var(--text-main);
          background: rgba(255, 255, 255, 0.04);
          border-color: var(--border-color);
        }

        .nav-icon {
          transition: var(--transition-normal);
        }

        .nav-item.active .nav-icon {
          color: var(--accent-color);
          filter: drop-shadow(0 0 8px var(--accent-color));
        }

        .nav-indicator {
          position: absolute;
          right: 12px;
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent-color);
          box-shadow: 0 0 10px var(--accent-color);
        }

        .sidebar-footer {
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .wallet-card {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.08) 0%, rgba(6, 182, 212, 0.05) 100%);
          border: 1px solid var(--border-glow);
          border-radius: 16px;
          padding: 1.15rem;
          box-shadow: var(--shadow-sm);
        }

        .wallet-header {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .coin-icon {
          color: #f59e0b;
        }

        .wallet-value {
          font-size: 1.35rem;
          font-weight: 800;
          margin-top: 0.4rem;
          letter-spacing: -0.02em;
        }

        .wallet-unit {
          font-size: 0.85rem;
          color: var(--text-muted);
          font-weight: 500;
        }

        .wallet-badge {
          display: inline-block;
          margin-top: 0.5rem;
          font-size: 0.65rem;
          font-weight: 800;
          color: var(--color-secondary);
          background: rgba(6, 182, 212, 0.1);
          padding: 0.2rem 0.6rem;
          border-radius: 99px;
          border: 1px solid rgba(6, 182, 212, 0.2);
        }

        .developer-tag {
          font-size: 0.75rem;
          color: var(--text-dark);
          text-align: center;
          font-family: var(--font-mono);
        }

        .mobile-nav-toggle {
          display: none;
          position: fixed;
          top: 1rem;
          left: 1rem;
          z-index: 200;
          background: var(--bg-secondary);
          border: 1px solid var(--border-color);
          color: var(--text-main);
          width: 42px;
          height: 42px;
          border-radius: 10px;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        @media (max-width: 768px) {
          .mobile-nav-toggle {
            display: flex;
          }

          .sidebar-container {
            position: fixed;
            top: 0;
            left: -260px;
            height: 100vh;
            transition: 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          }

          .sidebar-container.open {
            left: 0;
            box-shadow: 20px 0 80px rgba(0, 0, 0, 0.8);
          }
        }
      `}</style>
    </>
  );
};
