import React, { useState } from 'react';
import { 
  UserPlus, 
  Copy, 
  ExternalLink, 
  Check, 
  Coins, 
  Share2, 
  Sparkles,
  Info,
  UserCheck
} from 'lucide-react';

interface SubPromoterProps {
  coins: number;
  setCoins: (coins: number | ((prev: number) => number)) => void;
  subscribersGenerated: number;
  setSubscribersGenerated: (subs: number | ((prev: number) => number)) => void;
  addLog: (log: string) => void;
}

interface MockChannel {
  id: string;
  name: string;
  category: string;
  subs: string;
  reward: number;
  url: string;
  subscribed: boolean;
}

export const SubPromoter: React.FC<SubPromoterProps> = ({
  coins,
  setCoins,
  subscribersGenerated,
  setSubscribersGenerated,
  addLog
}) => {
  const [channelInput, setChannelInput] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  // List promotion form state
  const [promoChannelName, setPromoChannelName] = useState('');
  const [promoChannelUrl, setPromoChannelUrl] = useState('');
  const [promoCost, setPromoCost] = useState(250);

  // Sub validating state
  const [validatingId, setValidatingId] = useState<string | null>(null);

  // Mock list of exchange channels
  const [exchangeChannels, setExchangeChannels] = useState<MockChannel[]>([
    { id: 'ch1', name: 'TechVibe Reviews', category: 'Technology', subs: '12.4K', reward: 50, url: 'https://youtube.com/@techvibe', subscribed: false },
    { id: 'ch2', name: 'Chill Lofi Beats', category: 'Music', subs: '45.1K', reward: 50, url: 'https://youtube.com/@chilllofi', subscribed: false },
    { id: 'ch3', name: 'FitLife Gym Hacks', category: 'Fitness', subs: '8.2K', reward: 60, url: 'https://youtube.com/@fitlife', subscribed: false },
    { id: 'ch4', name: 'GamerZone Pro', category: 'Gaming', subs: '105K', reward: 40, url: 'https://youtube.com/@gamerzone', subscribed: false },
    { id: 'ch5', name: 'Chef Mario Eats', category: 'Food & Cooking', subs: '3.1K', reward: 75, url: 'https://youtube.com/@chefmario', subscribed: false },
  ]);

  // Handle auto-sub link generation
  const handleGenerateLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!channelInput.trim()) return;

    let target = channelInput.trim();
    let subUrl = '';

    // Parse different YouTube Channel structures
    if (target.includes('youtube.com/')) {
      // It's a full URL
      if (target.includes('?')) {
        // Strip existing parameters
        target = target.split('?')[0];
      }
      
      if (target.endsWith('/')) {
        target = target.slice(0, -1);
      }

      subUrl = `${target}?sub_confirmation=1`;
    } else if (target.startsWith('@')) {
      // It's a handle
      subUrl = `https://youtube.com/${target}?sub_confirmation=1`;
    } else if (target.startsWith('UC') && target.length === 24) {
      // It's a Channel ID
      subUrl = `https://youtube.com/channel/${target}?sub_confirmation=1`;
    } else {
      // Default to handle prefix
      subUrl = `https://youtube.com/@${target}?sub_confirmation=1`;
    }

    setGeneratedLink(subUrl);
    setIsCopied(false);
    addLog(`[PROMO] Generated subscription prompt link: ${subUrl}`);
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
    addLog('[SYSTEM] Subscription link copied to clipboard.');
  };

  // Handle Subscribing in exchange
  const handleSubscribeClick = (channel: MockChannel) => {
    if (channel.subscribed) return;

    addLog(`[EXCHANGE] Opening ${channel.name} to complete subscription action...`);
    window.open(`${channel.url}?sub_confirmation=1`, '_blank');
    
    setValidatingId(channel.id);
    
    // Simulate validation period
    setTimeout(() => {
      setExchangeChannels(prev => prev.map(ch => {
        if (ch.id === channel.id) {
          return { ...ch, subscribed: true };
        }
        return ch;
      }));
      
      setCoins(prev => prev + channel.reward);
      setValidatingId(null);
      addLog(`[EXCHANGE] Subscription confirmed! Awarded +${channel.reward} coins for ${channel.name}.`);
    }, 4000);
  };

  // Add channel to exchange list
  const handleAddChannelToPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoChannelName || !promoChannelUrl) {
      alert('Please fill out all fields!');
      return;
    }

    if (coins < promoCost) {
      alert('Insufficient Coins in your wallet to feature your channel!');
      addLog(`[ERROR] Promotion failed. Insufficient funds. Required: ${promoCost} coins.`);
      return;
    }

    // Deduct coins
    setCoins(prev => prev - promoCost);

    // Append to list
    const newChan: MockChannel = {
      id: `ch-${Date.now()}`,
      name: promoChannelName,
      category: 'User Channel',
      subs: '0.1K',
      reward: 50,
      url: promoChannelUrl,
      subscribed: false
    };

    setExchangeChannels(prev => [newChan, ...prev]);
    setSubscribersGenerated(prev => prev + 1); // Track a generated promoter channel

    setPromoChannelName('');
    setPromoChannelUrl('');
    addLog(`[EXCHANGE] Added channel "${promoChannelName}" to listing. Deducted ${promoCost} coins.`);
    alert('Your channel has been added to the exchange pool successfully!');
  };

  return (
    <div className="promoter-container">
      {/* Link Generator */}
      <div className="card promo-generator-card">
        <h3 className="card-title"><UserPlus size={20} className="pink" /> Auto-Subscribe Link Generator</h3>
        <p className="card-subtitle" style={{ marginBottom: '1.2rem' }}>
          Create a link that automatically prompts visitors to subscribe to your channel. Paste your channel URL, handle, or ID below.
        </p>

        <form onSubmit={handleGenerateLink} className="generator-form">
          <input 
            type="text" 
            placeholder="e.g. @LinusTechTips or https://youtube.com/channel/UC..." 
            className="input-field"
            value={channelInput}
            onChange={(e) => setChannelInput(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Generate Link
          </button>
        </form>

        {generatedLink && (
          <div className="generated-output-box">
            <div className="link-text-container">
              <span className="link-label">SHAREABLE PROMO LINK:</span>
              <span className="link-value">{generatedLink}</span>
            </div>
            <div className="link-actions">
              <button className="btn btn-secondary btn-icon" onClick={handleCopyLink} title="Copy Link">
                {isCopied ? <Check size={16} style={{ color: 'var(--color-success)' }} /> : <Copy size={16} />}
              </button>
              <a href={generatedLink} target="_blank" rel="noopener noreferrer" className="btn btn-secondary btn-icon" title="Test Link">
                <ExternalLink size={16} />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="dashboard-grid" style={{ marginTop: '0.5rem' }}>
        {/* Exchange Board */}
        <div className="card col-span-7 exchange-card">
          <div className="card-header">
            <div>
              <h3 className="card-title"><Coins size={18} className="yellow" /> Coin Exchange Board (Sub4Sub)</h3>
              <span className="card-subtitle">Subscribe to other creators to earn coins. Use coins to list your channel.</span>
            </div>
            <span className="badge badge-cyan">SIMULATED POOL</span>
          </div>

          <div className="exchange-list">
            {exchangeChannels.map(ch => (
              <div key={ch.id} className="exchange-item">
                <div className="channel-avatar-mock">
                  {ch.name.substring(0, 2).toUpperCase()}
                </div>
                <div className="channel-details">
                  <div className="channel-name">{ch.name}</div>
                  <div className="channel-meta">
                    <span className="cat">{ch.category}</span>
                    <span className="dot">•</span>
                    <span>{ch.subs} subs</span>
                  </div>
                </div>

                <div className="channel-reward-tag">
                  <Coins size={12} className="coin-icon" />
                  <span>+{ch.reward}</span>
                </div>

                <button
                  className={`btn btn-sm ${ch.subscribed ? 'btn-success-disabled' : 'btn-primary'}`}
                  onClick={() => handleSubscribeClick(ch)}
                  disabled={ch.subscribed || validatingId !== null}
                >
                  {validatingId === ch.id ? (
                    <span className="loading-spinner">Validating...</span>
                  ) : ch.subscribed ? (
                    <>Subscribed <UserCheck size={14} /></>
                  ) : (
                    <>Subscribe <ExternalLink size={14} /></>
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Your Channel Form */}
        <div className="card col-span-5 feature-card">
          <h3 className="card-title"><Sparkles size={18} className="pink" /> Feature Your Channel</h3>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
            List your channel on the Exchange Board so other members subscribe. Subscriptions are verified organically.
          </p>

          <form onSubmit={handleAddChannelToPromo} className="feature-form">
            <div className="form-group">
              <label className="form-label">Channel Display Name</label>
              <input 
                type="text" 
                placeholder="e.g. Satish Tech Vlog" 
                className="input-field"
                value={promoChannelName}
                onChange={(e) => setPromoChannelName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">YouTube Link / Handle</label>
              <input 
                type="text" 
                placeholder="https://youtube.com/@SatishTech" 
                className="input-field"
                value={promoChannelUrl}
                onChange={(e) => setPromoChannelUrl(e.target.value)}
              />
            </div>

            <div className="promotion-cost-panel">
              <div className="cost-detail">
                <span>Listing Fee:</span>
                <span className="cost-value">
                  <Coins size={14} className="coin-icon" />
                  {promoCost} Coins
                </span>
              </div>
              <div className="wallet-check">
                Your Wallet: <strong>{coins} Coins</strong>
              </div>
            </div>

            <button 
              type="submit" 
              className="btn btn-accent" 
              style={{ width: '100%', marginTop: '0.5rem' }}
              disabled={coins < promoCost}
            >
              List Channel Now
            </button>
          </form>

          {coins < promoCost && (
            <div className="cost-warning-alert">
              <Info size={14} />
              <span>You need {(promoCost - coins)} more coins. Subscribe to other channels on the left to earn coins.</span>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .promoter-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .generator-form {
          display: flex;
          gap: 0.75rem;
          margin-top: 1.25rem;
        }

        .generator-form .input-field {
          flex: 1;
        }

        .generated-output-box {
          margin-top: 1.25rem;
          background: rgba(7, 9, 19, 0.6);
          border: 1px dashed var(--border-glow);
          border-radius: 12px;
          padding: 1rem;
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 1.5rem;
        }

        .link-text-container {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          overflow: hidden;
        }

        .link-label {
          font-size: 0.7rem;
          font-weight: 800;
          color: var(--color-primary);
          letter-spacing: 0.05em;
        }

        .link-value {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--text-main);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .link-actions {
          display: flex;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        .link-actions button,
        .link-actions a {
          padding: 0.5rem;
          border-radius: 8px;
        }

        .exchange-card {
          display: flex;
          flex-direction: column;
        }

        .exchange-list {
          display: flex;
          flex-direction: column;
          gap: 0.85rem;
          margin-top: 1rem;
          overflow-y: auto;
          max-height: 350px;
          padding-right: 0.25rem;
        }

        .exchange-item {
          display: flex;
          align-items: center;
          background: rgba(7, 9, 19, 0.4);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.85rem 1rem;
          gap: 1rem;
          transition: var(--transition-fast);
        }

        .exchange-item:hover {
          border-color: rgba(255, 255, 255, 0.06);
          background: rgba(7, 9, 19, 0.7);
        }

        .channel-avatar-mock {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: linear-gradient(135deg, var(--bg-tertiary) 0%, rgba(139, 92, 246, 0.2) 100%);
          border: 1px solid var(--border-color);
          color: var(--color-primary);
          font-weight: 800;
          font-size: 0.85rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .channel-details {
          flex: 1;
        }

        .channel-name {
          font-weight: 700;
          font-size: 0.95rem;
        }

        .channel-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          display: flex;
          align-items: center;
          gap: 0.4rem;
          margin-top: 0.1rem;
        }

        .channel-meta .cat {
          color: var(--color-secondary);
          font-weight: 600;
        }

        .channel-reward-tag {
          display: flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.85rem;
          font-weight: 800;
          color: #f59e0b;
          background: rgba(245, 158, 11, 0.08);
          border: 1px solid rgba(245, 158, 11, 0.15);
          padding: 0.35rem 0.65rem;
          border-radius: 8px;
        }

        .btn-sm {
          padding: 0.5rem 1rem;
          font-size: 0.8rem;
          border-radius: 8px;
        }

        .btn-success-disabled {
          background: rgba(16, 185, 129, 0.1);
          color: var(--color-success);
          border: 1px solid rgba(16, 185, 129, 0.2);
          cursor: not-allowed;
        }

        .loading-spinner {
          animation: pulse-glow 1s infinite alternate;
        }

        .feature-card {
          display: flex;
          flex-direction: column;
        }

        .promotion-cost-panel {
          background: rgba(7, 9, 19, 0.6);
          border-radius: 12px;
          border: 1px solid var(--border-color);
          padding: 0.9rem;
          margin: 0.5rem 0;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
        }

        .cost-detail {
          display: flex;
          justify-content: space-between;
          font-weight: 700;
          font-size: 0.9rem;
        }

        .cost-value {
          color: #f59e0b;
          display: flex;
          align-items: center;
          gap: 0.25rem;
        }

        .wallet-check {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-align: right;
        }

        .cost-warning-alert {
          margin-top: 0.75rem;
          background: rgba(239, 68, 68, 0.05);
          border: 1px solid rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          font-size: 0.775rem;
          border-radius: 10px;
          padding: 0.75rem;
          display: flex;
          gap: 0.5rem;
          line-height: 1.4;
        }

        @media (max-width: 768px) {
          .generator-form {
            flex-direction: column;
          }
          .generated-output-box {
            flex-direction: column;
            align-items: flex-start;
          }
          .link-actions {
            width: 100%;
            justify-content: flex-end;
          }
        }
      `}</style>
    </div>
  );
};
