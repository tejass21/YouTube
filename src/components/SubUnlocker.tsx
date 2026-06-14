import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  FileText, 
  ExternalLink, 
  Copy, 
  Check, 
  Eye, 
  Sparkles,
  RefreshCw,
  Info
} from 'lucide-react';

const YoutubeIcon: React.FC<{ size?: number; className?: string }> = ({ size = 24, className = '' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
    <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" />
  </svg>
);

interface SubUnlockerProps {
  addLog: (log: string) => void;
  setSubscribersGenerated: (subs: number | ((prev: number) => number)) => void;
}

interface Campaign {
  id: string;
  title: string;
  channelUrl: string;
  lockedLink: string;
  fileSize: string;
  downloads: number;
}

export const SubUnlocker: React.FC<SubUnlockerProps> = ({ addLog, setSubscribersGenerated }) => {
  // Campaign creator state
  const [title, setTitle] = useState('My Secret GTA 5 Mod Pack');
  const [channelUrl, setChannelUrl] = useState('https://youtube.com/@techvibe');
  const [lockedLink, setLockedLink] = useState('https://mega.nz/file/secret-file-download-key');
  const [fileSize, setFileSize] = useState('18.4 MB');

  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: '1', title: 'React Dashboard Template.zip', channelUrl: 'https://youtube.com/@techvibe', lockedLink: 'https://github.com/secret', fileSize: '4.2 MB', downloads: 142 },
    { id: '2', title: 'Photoshop LUTs Pack v2.zip', channelUrl: 'https://youtube.com/@chilllofi', lockedLink: 'https://drive.google.com/...', fileSize: '125 MB', downloads: 89 },
  ]);

  // Visitor simulator state
  const [simStep, setSimStep] = useState(1); // 1: Initial (Locked), 2: Clicked Sub, 3: Verifying, 4: Unlocked
  const [simVerifying, setSimVerifying] = useState(false);
  const [isCopied, setIsCopied] = useState<string | null>(null);

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !channelUrl || !lockedLink) {
      alert('Please fill out all fields to create a lock campaign!');
      return;
    }

    const newCamp: Campaign = {
      id: Date.now().toString(),
      title,
      channelUrl,
      lockedLink,
      fileSize: fileSize || 'N/A',
      downloads: 0
    };

    setCampaigns(prev => [newCamp, ...prev]);
    addLog(`[LOCK] New Campaign created: "${title}" locked behind ${channelUrl}`);
    alert('Subscription lock gate created successfully! Check the Campaigns list.');
    
    // Reset form fields
    setTitle('');
    setFileSize('10 MB');
  };

  // Copy campaign link simulation
  const handleCopyCampLink = (id: string) => {
    const link = `https://ytboost.net/unlock/camp-${id}`;
    navigator.clipboard.writeText(link);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
    addLog(`[SYSTEM] Campaign URL copied: ${link}`);
  };

  // Visitor Simulation Handlers
  const handleSimSubClick = () => {
    addLog(`[SIMULATION] Visitor clicked "Subscribe Channel". Opening channel page...`);
    window.open(channelUrl.includes('?sub_confirmation=') ? channelUrl : `${channelUrl}?sub_confirmation=1`, '_blank');
    setSimStep(2);
  };

  const handleSimVerifyClick = () => {
    setSimVerifying(true);
    setSimStep(3);
    addLog('[SIMULATION] Verifying subscription on-chain API mock check...');
    
    setTimeout(() => {
      setSimVerifying(false);
      setSimStep(4);
      setSubscribersGenerated(prev => prev + 1); // Award a simulated organic subscriber
      addLog('[SIMULATION] Subscription confirmed! Content unlocked for visitor.');
    }, 3000);
  };

  const resetSimulation = () => {
    setSimStep(1);
    setSimVerifying(false);
  };

  return (
    <div className="unlocker-container">
      <div className="dashboard-grid">
        {/* Campaign Builder Form */}
        <div className="card col-span-5 builder-card">
          <h3 className="card-title"><Lock size={20} className="purple" /> Create Lock Campaign</h3>
          <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
            Set up the resource info and the YouTube target. Visitors will be forced to subscribe to unlock the resource.
          </p>

          <form onSubmit={handleCreateCampaign} className="campaign-form">
            <div className="form-group">
              <label className="form-label">Resource Title (What are they downloading?)</label>
              <input 
                type="text" 
                placeholder="e.g. Free Presets Pack.zip" 
                className="input-field"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">YouTube Channel to Promote</label>
              <input 
                type="text" 
                placeholder="e.g. https://youtube.com/@MyChannel" 
                className="input-field"
                value={channelUrl}
                onChange={(e) => setChannelUrl(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Locked Link / Redirect URL</label>
              <input 
                type="text" 
                placeholder="e.g. https://mega.nz/file/... or Google Drive Link" 
                className="input-field"
                value={lockedLink}
                onChange={(e) => setLockedLink(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Resource File Size (Optional)</label>
              <input 
                type="text" 
                placeholder="e.g. 24.5 MB" 
                className="input-field"
                value={fileSize}
                onChange={(e) => setFileSize(e.target.value)}
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              Create Lock Gate
            </button>
          </form>
        </div>

        {/* Campaign Live Mock Preview */}
        <div className="card col-span-7 preview-card">
          <div className="card-header">
            <div>
              <h3 className="card-title"><Eye size={18} className="cyan" /> Visitor View Preview</h3>
              <span className="card-subtitle">Test the subscriber verification flow that your visitors experience.</span>
            </div>
            <button className="btn btn-secondary btn-icon" onClick={resetSimulation} title="Reset Simulation">
              <RefreshCw size={14} />
            </button>
          </div>

          <div className="preview-simulation-boundary">
            <div className="locked-page-mockup">
              {/* Mock Page Header */}
              <div className="mockup-header">
                <YoutubeIcon size={22} className="mock-youtube-icon" />
                <span>YTUnlock Gateway</span>
              </div>

              {/* Lock card */}
              <div className="lock-content-box">
                <div className="file-info-header">
                  <FileText size={32} className="file-icon" />
                  <div className="file-title-wrap">
                    <div className="file-title">{title || 'Your Locked Resource Name'}</div>
                    <div className="file-meta">File Size: {fileSize || 'N/A'} • Status: {simStep === 4 ? 'Unlocked' : 'Locked'}</div>
                  </div>
                </div>

                {/* Steps container */}
                <div className="steps-container">
                  {/* Step 1 */}
                  <div className={`step-item ${simStep >= 2 ? 'completed' : 'active'}`}>
                    <div className="step-number">1</div>
                    <div className="step-details">
                      <div className="step-title">Subscribe to Channel</div>
                      <div className="step-desc">Subscribe to the creator's channel to verify eligibility.</div>
                    </div>
                    <button 
                      className={`btn btn-sm ${simStep >= 2 ? 'btn-secondary' : 'btn-accent'}`} 
                      onClick={handleSimSubClick}
                      disabled={simStep === 4}
                    >
                      {simStep >= 2 ? 'Done' : 'Subscribe'} <ExternalLink size={12} />
                    </button>
                  </div>

                  {/* Step 2 */}
                  <div className={`step-item ${simStep === 1 ? 'disabled' : simStep === 2 ? 'active' : simStep === 3 ? 'active' : 'completed'}`}>
                    <div className="step-number">2</div>
                    <div className="step-details">
                      <div className="step-title">Verify Subscription</div>
                      <div className="step-desc">Confirm that you have completed step 1.</div>
                    </div>
                    <button 
                      className={`btn btn-sm ${simStep < 2 ? 'btn-secondary disabled' : simStep === 2 ? 'btn-primary' : simStep === 3 ? 'btn-secondary' : 'btn-secondary'}`}
                      onClick={handleSimVerifyClick}
                      disabled={simStep !== 2}
                    >
                      {simVerifying ? 'Checking...' : simStep >= 4 ? 'Verified' : 'Verify'}
                    </button>
                  </div>
                </div>

                {/* Unlock Status Alert */}
                <div className="unlock-button-zone">
                  {simStep === 4 ? (
                    <div className="unlocked-reveal-container">
                      <div className="unlock-success-msg">
                        <Unlock size={18} className="unlock-icon" />
                        <span>Link unlocked! Thank you for subscribing.</span>
                      </div>
                      <a href={lockedLink} target="_blank" rel="noopener noreferrer" className="btn btn-primary download-unlocked-btn">
                        Download File <ExternalLink size={16} />
                      </a>
                    </div>
                  ) : (
                    <div className="locked-state-footer">
                      <Lock size={16} className="locked-icon" />
                      <span>Follow the steps above to unlock download.</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Campaigns Listing */}
      <div className="card list-campaigns-card" style={{ marginTop: '1.5rem' }}>
        <h3 className="card-title">Active Campaign Gates</h3>
        <p className="card-subtitle" style={{ marginBottom: '1.25rem' }}>
          Copy the generated URL below to place in your video description or comment sections.
        </p>

        <div className="campaign-table-container">
          <table className="campaign-table">
            <thead>
              <tr>
                <th>Resource Name</th>
                <th>YouTube Channel</th>
                <th>File Size</th>
                <th>Active Views</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.map(camp => (
                <tr key={camp.id}>
                  <td>
                    <div className="table-resource-title">
                      <FileText size={14} className="purple" style={{ marginRight: '0.4rem' }} />
                      {camp.title}
                    </div>
                  </td>
                  <td>
                    <span className="table-channel-link">{camp.channelUrl}</span>
                  </td>
                  <td>{camp.fileSize}</td>
                  <td>
                    <span className="badge badge-cyan">{camp.downloads} views</span>
                  </td>
                  <td>
                    <div className="table-actions">
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => handleCopyCampLink(camp.id)}
                      >
                        {isCopied === camp.id ? (
                          <><Check size={12} style={{ color: 'var(--color-success)' }} /> Copied</>
                        ) : (
                          <><Copy size={12} /> Copy Link</>
                        )}
                      </button>
                      <button 
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setTitle(camp.title);
                          setChannelUrl(camp.channelUrl);
                          setLockedLink(camp.lockedLink);
                          setFileSize(camp.fileSize);
                          resetSimulation();
                          addLog(`[LOCK] Loaded campaign "${camp.title}" into simulator.`);
                        }}
                      >
                        Load Preview
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <style>{`
        .unlocker-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .preview-simulation-boundary {
          border: 1px solid var(--border-color);
          background: #030408;
          border-radius: 12px;
          padding: 1.5rem;
          margin-top: 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .locked-page-mockup {
          background: #090c17;
          border: 1px solid var(--border-glow);
          border-radius: 16px;
          max-width: 480px;
          width: 100%;
          box-shadow: var(--shadow-lg);
          overflow: hidden;
        }

        .mockup-header {
          background: rgba(239, 68, 68, 0.08);
          border-bottom: 1px solid rgba(239, 68, 68, 0.15);
          padding: 0.75rem 1.25rem;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
          font-size: 0.85rem;
          color: #fca5a5;
        }

        .mock-youtube-icon {
          color: #ef4444;
          fill: #ef4444;
        }

        .lock-content-box {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.25rem;
        }

        .file-info-header {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-color);
          border-radius: 10px;
          padding: 0.85rem;
        }

        .file-icon {
          color: var(--color-primary);
        }

        .file-title-wrap {
          flex: 1;
        }

        .file-title {
          font-weight: 700;
          font-size: 0.95rem;
          line-height: 1.3;
        }

        .file-meta {
          font-size: 0.75rem;
          color: var(--text-muted);
          margin-top: 0.15rem;
        }

        .steps-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .step-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          border-radius: 10px;
          padding: 0.75rem 1rem;
          border: 1px solid var(--border-color);
          background: rgba(255, 255, 255, 0.01);
          transition: var(--transition-fast);
        }

        .step-item.active {
          border-color: var(--border-glow);
          background: rgba(139, 92, 246, 0.03);
        }

        .step-item.completed {
          border-color: rgba(16, 185, 129, 0.15);
          background: rgba(16, 185, 129, 0.02);
        }

        .step-item.disabled {
          opacity: 0.5;
        }

        .step-number {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 800;
          font-size: 0.75rem;
          background: var(--bg-tertiary);
          color: var(--text-muted);
          border: 1px solid var(--border-color);
        }

        .step-item.active .step-number {
          background: var(--color-primary);
          color: #ffffff;
          border-color: var(--color-primary);
        }

        .step-item.completed .step-number {
          background: var(--color-success);
          color: #ffffff;
          border-color: var(--color-success);
        }

        .step-details {
          flex: 1;
        }

        .step-title {
          font-size: 0.85rem;
          font-weight: 700;
        }

        .step-desc {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-top: 0.1rem;
        }

        .step-item.disabled button {
          cursor: not-allowed;
          pointer-events: none;
        }

        .unlock-button-zone {
          border-top: 1px solid var(--border-color);
          padding-top: 1rem;
        }

        .locked-state-footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          font-size: 0.8rem;
          color: var(--text-muted);
          font-weight: 600;
        }

        .locked-icon {
          color: var(--color-danger);
        }

        .unlocked-reveal-container {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          align-items: center;
          animation: unlockReveal 0.4s ease-out;
        }

        @keyframes unlockReveal {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .unlock-success-msg {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          color: var(--color-success);
          font-size: 0.85rem;
          font-weight: 700;
        }

        .unlock-icon {
          color: var(--color-success);
          animation: pulse-glow 1s infinite alternate;
        }

        .download-unlocked-btn {
          width: 100%;
          background: linear-gradient(135deg, var(--color-success) 0%, #059669 100%);
          box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
        }

        .download-unlocked-btn:hover {
          box-shadow: 0 8px 20px rgba(16, 185, 129, 0.5);
        }

        /* Campaign Table */
        .campaign-table-container {
          overflow-x: auto;
          width: 100%;
        }

        .campaign-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .campaign-table th {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-muted);
          padding: 0.75rem 1rem;
          border-bottom: 1px solid var(--border-color);
          font-weight: 700;
        }

        .campaign-table td {
          padding: 1rem;
          border-bottom: 1px solid var(--border-color);
          font-size: 0.875rem;
        }

        .campaign-table tr:last-child td {
          border-bottom: none;
        }

        .table-resource-title {
          font-weight: 700;
          display: flex;
          align-items: center;
        }

        .table-channel-link {
          color: var(--color-secondary);
          font-family: var(--font-mono);
          font-size: 0.8rem;
          max-width: 220px;
          display: inline-block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .table-actions {
          display: flex;
          gap: 0.5rem;
        }

        @media (max-width: 1024px) {
          .col-span-5, .col-span-7 {
            grid-column: span 12;
          }
        }
      `}</style>
    </div>
  );
};
