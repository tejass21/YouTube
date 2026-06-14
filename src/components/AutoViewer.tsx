import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  RefreshCw, 
  Trash2, 
  Grid, 
  Clock, 
  Volume2, 
  VolumeX, 
  Layers,
  Sparkles,
  ExternalLink,
  Info,
  ShieldAlert,
  Terminal
} from 'lucide-react';

interface AutoViewerProps {
  quickUrl: string;
  setQuickUrl: (url: string) => void;
  activeViewerCount: number;
  setActiveViewerCount: (count: number) => void;
  totalViews: number;
  setTotalViews: (views: number | ((prev: number) => number)) => void;
  watchTime: number;
  setWatchTime: (time: number | ((prev: number) => number)) => void;
  addLog: (log: string) => void;
}

export const AutoViewer: React.FC<AutoViewerProps> = ({
  quickUrl,
  setQuickUrl,
  activeViewerCount,
  setActiveViewerCount,
  totalViews,
  setTotalViews,
  watchTime,
  setWatchTime,
  addLog
}) => {
  const [videoUrl, setVideoUrl] = useState(quickUrl || 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'); // Default placeholder
  const [videoId, setVideoId] = useState('');
  const [gridSize, setGridSize] = useState(4);
  const [isMuted, setIsMuted] = useState(true);
  const [isLooping, setIsLooping] = useState(true);
  const [reloadInterval, setReloadInterval] = useState(180); // 3 minutes default
  const [useRandomOffset, setUseRandomOffset] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [streamKeys, setStreamKeys] = useState<number[]>([]);
  const [individualReloadOffsets, setIndividualReloadOffsets] = useState<number[]>([]);
  const [elapsedTimes, setElapsedTimes] = useState<number[]>([]);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchTimeRef = useRef<NodeJS.Timeout | null>(null);

  // Parse YouTube video ID
  const extractVideoId = (url: string) => {
    if (!url) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Sync quick url from dashboard launch
  useEffect(() => {
    if (quickUrl) {
      setVideoUrl(quickUrl);
      const parsedId = extractVideoId(quickUrl);
      if (parsedId) {
        setVideoId(parsedId);
      }
    } else {
      const parsedId = extractVideoId(videoUrl);
      if (parsedId) {
        setVideoId(parsedId);
      }
    }
  }, [quickUrl, videoUrl]);

  // Handle URL Paste / Change
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVideoUrl(val);
    setQuickUrl(''); // Clear quick launch sync
    const parsedId = extractVideoId(val);
    if (parsedId) {
      setVideoId(parsedId);
    } else {
      setVideoId('');
    }
  };

  // Initialize/Start Stream Session
  const handleStartSession = () => {
    if (!videoId) {
      addLog('[ERROR] Invalid YouTube URL. Paste a correct video link.');
      alert('Please enter a valid YouTube video link!');
      return;
    }

    setIsRunning(true);
    setActiveViewerCount(gridSize);
    
    // Generate stream instances keys and setup customized refresh timers per stream
    const keys = Array.from({ length: gridSize }, (_, i) => Date.now() + i);
    setStreamKeys(keys);

    const offsets = Array.from({ length: gridSize }, () => {
      if (useRandomOffset) {
        // Injects standard ± random offset (from -15 to +15 seconds)
        return reloadInterval + (Math.floor(Math.random() * 31) - 15);
      }
      return reloadInterval;
    });
    setIndividualReloadOffsets(offsets);
    setElapsedTimes(Array(gridSize).fill(0));

    addLog(`[SYSTEM] Initialized Multi-Stream grid with ${gridSize} viewports. Video ID: ${videoId}`);
    addLog(`[SYSTEM] Autoplay: Muted, Refresh interval set to avg ${reloadInterval}s.`);
    
    setTotalViews(prev => prev + gridSize);
  };

  // Stop/Clear Stream Session
  const handleStopSession = () => {
    setIsRunning(false);
    setActiveViewerCount(0);
    setStreamKeys([]);
    addLog('[SYSTEM] Multi-Stream session stopped by user.');
  };

  // Trigger individual iframe reload
  const reloadStream = (index: number) => {
    setStreamKeys(prev => {
      const copy = [...prev];
      copy[index] = Date.now(); // Changing key forces React to re-mount iframe
      return copy;
    });
    
    setElapsedTimes(prev => {
      const copy = [...prev];
      copy[index] = 0;
      return copy;
    });

    // Recalculate refresh offset for organic flow
    if (useRandomOffset) {
      const newOffset = reloadInterval + (Math.floor(Math.random() * 31) - 15);
      setIndividualReloadOffsets(prev => {
        const copy = [...prev];
        copy[index] = Math.max(15, newOffset);
        return copy;
      });
    }

    setTotalViews(prev => prev + 1);
    addLog(`[STREAM ${index + 1}] Target cycle completed. Reloading player to register new view.`);
  };

  // Run countdown trackers for reloads
  useEffect(() => {
    if (isRunning && streamKeys.length > 0) {
      intervalRef.current = setInterval(() => {
        setElapsedTimes(prev => {
          const next = prev.map((time, index) => {
            const limit = individualReloadOffsets[index] || reloadInterval;
            if (time >= limit) {
              // Time to reload this stream!
              setTimeout(() => reloadStream(index), 0);
              return 0;
            }
            return time + 1;
          });
          return next;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning, streamKeys, reloadInterval, individualReloadOffsets]);

  // Accrue watch time in parent state
  useEffect(() => {
    if (isRunning) {
      watchTimeRef.current = setInterval(() => {
        // Watch time increment = active screens * speed * elapsed minute ratio
        const increment = (gridSize * playbackSpeed) / 60;
        setWatchTime(prev => prev + increment);
      }, 1000);
    }

    return () => {
      if (watchTimeRef.current) clearInterval(watchTimeRef.current);
    };
  }, [isRunning, gridSize, playbackSpeed]);

  // Quick helper to format elapsed timers
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Construct YouTube Embed Source URL
  const getEmbedUrl = (id: string, index: number) => {
    let url = `https://www.youtube.com/embed/${id}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=1&rel=0&showinfo=0&iv_load_policy=3`;
    if (isLooping) {
      url += `&loop=1&playlist=${id}`;
    }
    // Note: iframe API doesn't support setting speed in basic URL parameter reliably 
    // without API client loader, but looping/autoplays work perfectly.
    return url;
  };

  return (
    <div className="viewer-container">
      {/* Warning/Guide Banner for High Retention Views */}
      <div className="card retention-warning-card">
        <div className="warning-flex">
          <ShieldAlert className="warning-icon-large" size={32} />
          <div className="warning-content">
            <h4>Prevent YouTube View Drops (Views Drop Prevention Guide)</h4>
            <p>
              <strong>Why views drop:</strong> Direct browser-based Multi-Stream layouts use your local network IP and cookies. YouTube detects multiple streams playing the same video from the same IP at the same time and filters them out within 24-48 hours.
            </p>
            <p style={{ marginTop: '0.5rem' }}>
              <strong>Permanent Fix:</strong> Run our dedicated local stealth bot script (<code>view-bot.js</code>) from your terminal. It has integrated anti-fingerprinting, randomized mouse movements, ad-skipping, and full proxy rotation to ensure high retention!
            </p>
            <div className="terminal-guide">
              <Terminal size={14} className="terminal-icon" />
              <code>node view-bot.js</code>
            </div>
            <div className="proxy-recommendation">
              <strong>Tip:</strong> Open <code>view-bot.js</code> in your editor, configure your video URL, and add high-quality <strong>residential rotating proxies</strong> to the <code>proxies</code> array for best results!
            </div>
          </div>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="card config-card">
        <h3 className="card-title"><Layers size={20} className="purple" /> Stream Controller</h3>
        
        <div className="config-grid">
          {/* Target Video URL */}
          <div className="form-group col-span-8">
            <label className="form-label">YouTube Video URL</label>
            <div className="url-input-wrapper">
              <input 
                type="text" 
                placeholder="Paste YouTube Link (e.g. https://www.youtube.com/watch?v=...)" 
                className="input-field"
                value={videoUrl}
                onChange={handleUrlChange}
                disabled={isRunning}
              />
              {videoId && (
                <div className="url-preview-badge success">
                  Video Verified: {videoId}
                </div>
              )}
            </div>
          </div>

          {/* Grid Size */}
          <div className="form-group col-span-4">
            <label className="form-label">Viewer instances (Grid Sizing)</label>
            <select 
              className="select-field"
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={1}>1 Stream (1x1)</option>
              <option value={2}>2 Streams (1x2)</option>
              <option value={4}>4 Streams (2x2 Grid)</option>
              <option value={6}>6 Streams (2x3 Grid)</option>
              <option value={8}>8 Streams (2x4 Grid)</option>
              <option value={9}>9 Streams (3x3 Grid)</option>
              <option value={12}>12 Streams (3x4 Grid)</option>
              <option value={16}>16 Streams (4x4 Grid)</option>
            </select>
          </div>

          {/* Refresh Timer */}
          <div className="form-group col-span-3">
            <label className="form-label">Auto-Refresh Interval</label>
            <select
              className="select-field"
              value={reloadInterval}
              onChange={(e) => setReloadInterval(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={30}>30 Seconds (Fast test)</option>
              <option value={60}>1 Minute</option>
              <option value={180}>3 Minutes (Recommended)</option>
              <option value={300}>5 Minutes</option>
              <option value={600}>10 Minutes</option>
              <option value={1200}>20 Minutes</option>
            </select>
          </div>

          {/* Playback speed */}
          <div className="form-group col-span-3">
            <label className="form-label">Playback Speed</label>
            <select
              className="select-field"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
              disabled={isRunning}
            >
              <option value={0.5}>0.5x Speed (Slow)</option>
              <option value={1}>1.0x Speed (Normal)</option>
              <option value={1.5}>1.5x Speed (Fast)</option>
              <option value={2}>2.0x Speed (Turbo)</option>
            </select>
          </div>

          {/* Mute Toggles & Options */}
          <div className="form-group col-span-6 flex-row-center" style={{ gap: '1.5rem', marginTop: '1.25rem' }}>
            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={isMuted} 
                onChange={(e) => setIsMuted(e.target.checked)}
                disabled={isRunning}
              />
              <span className="checkbox-text">
                Autoplay Muted {isMuted ? <VolumeX size={14} className="muted-icon" /> : <Volume2 size={14} className="audio-icon" />}
              </span>
            </label>

            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={isLooping} 
                onChange={(e) => setIsLooping(e.target.checked)}
                disabled={isRunning}
              />
              <span className="checkbox-text">Loop Video</span>
            </label>

            <label className="checkbox-label">
              <input 
                type="checkbox" 
                checked={useRandomOffset} 
                onChange={(e) => setUseRandomOffset(e.target.checked)}
                disabled={isRunning}
              />
              <span className="checkbox-text">Organic Refresh Jitter</span>
            </label>
          </div>
        </div>

        {/* Action Controls */}
        <div className="action-row">
          {!isRunning ? (
            <button className="btn btn-primary" onClick={handleStartSession} style={{ flex: 1 }}>
              <Play size={16} fill="#ffffff" /> Start Multi-Viewer Session
            </button>
          ) : (
            <button className="btn btn-danger" onClick={handleStopSession} style={{ flex: 1 }}>
              <Pause size={16} fill="currentColor" /> Terminate Active Streams
            </button>
          )}

          <button 
            className="btn btn-secondary" 
            onClick={() => {
              if (!isRunning) return;
              // Reload all
              streamKeys.forEach((_, idx) => reloadStream(idx));
              addLog('[SYSTEM] Forced manual reload on all streaming instances.');
            }}
            disabled={!isRunning}
          >
            <RefreshCw size={16} /> Reload All Screens
          </button>
        </div>
      </div>

      {/* Grid Display */}
      {isRunning ? (
        <div className="grid-section">
          <div className="grid-header-meta">
            <span className="badge badge-purple">Active Session</span>
            <div className="grid-meta-item">
              <Clock size={14} />
              <span>Session speed factor: <strong>{playbackSpeed}x</strong></span>
            </div>
            <div className="grid-meta-item">
              <Layers size={14} />
              <span>Layout: <strong>{gridSize} instances</strong></span>
            </div>
          </div>

          <div className={`video-grid grid-size-${gridSize}`}>
            {streamKeys.map((key, index) => {
              const targetLimit = individualReloadOffsets[index] || reloadInterval;
              const currentElapsed = elapsedTimes[index] || 0;
              const percentage = (currentElapsed / targetLimit) * 100;

              return (
                <div key={`${key}-${index}`} className="video-card card">
                  <div className="video-card-header">
                    <span className="stream-label">Viewport #{index + 1}</span>
                    <span className="stream-timer">
                      Cycle: <strong>{formatTime(currentElapsed)} / {formatTime(targetLimit)}</strong>
                    </span>
                  </div>
                  
                  {/* Progress bar for auto-refresh */}
                  <div className="progress-bar-container">
                    <div 
                      className="progress-bar-fill" 
                      style={{ width: `${percentage}%` }}
                    />
                  </div>

                  <div className="iframe-wrapper">
                    <iframe
                      src={getEmbedUrl(videoId, index)}
                      title={`YouTube Stream Viewport ${index + 1}`}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      className="youtube-iframe"
                    />
                  </div>

                  <div className="video-card-controls">
                    <button 
                      className="btn btn-secondary btn-icon" 
                      title="Reload Individual Viewport"
                      onClick={() => reloadStream(index)}
                    >
                      <RefreshCw size={12} />
                    </button>
                    <a 
                      href={`https://www.youtube.com/watch?v=${videoId}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="btn btn-secondary btn-icon"
                      title="Open on YouTube"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="card empty-grid-card">
          <Info size={40} className="info-icon" />
          <h4>Viewer Grid Inactive</h4>
          <p>Configure parameters above and click "Start Multi-Viewer Session" to launch active streaming players.</p>
        </div>
      )}

      <style>{`
        .retention-warning-card {
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
          margin-top: 0.15rem;
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

        .proxy-recommendation {
          margin-top: 0.75rem;
          font-size: 0.825rem;
          color: #e2e8f0;
          background: rgba(255, 255, 255, 0.02);
          padding: 0.5rem 0.75rem;
          border-radius: 6px;
          border: 1px solid rgba(255, 255, 255, 0.03);
        }

        @keyframes pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        .viewer-container {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .config-card {
          padding: 1.75rem;
        }

        .config-grid {
          display: grid;
          grid-template-columns: repeat(12, 1fr);
          gap: 1.25rem;
          margin-top: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .url-input-wrapper {
          position: relative;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }

        .url-preview-badge {
          font-size: 0.75rem;
          font-weight: 700;
          color: var(--color-success);
          display: inline-block;
          margin-left: 0.25rem;
        }

        .flex-row-center {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          font-size: 0.9rem;
          font-weight: 600;
          color: var(--text-muted);
          transition: var(--transition-fast);
          user-select: none;
        }

        .checkbox-label:hover {
          color: var(--text-main);
        }

        .checkbox-label input[type="checkbox"] {
          accent-color: var(--color-primary);
          width: 16px;
          height: 16px;
          cursor: pointer;
        }

        .checkbox-text {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .audio-icon { color: var(--color-secondary); }
        .muted-icon { color: var(--text-dark); }

        .action-row {
          display: flex;
          gap: 1rem;
          border-top: 1px solid var(--border-color);
          padding-top: 1.5rem;
        }

        .grid-section {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .grid-header-meta {
          display: flex;
          align-items: center;
          gap: 1.25rem;
          font-size: 0.85rem;
          color: var(--text-muted);
        }

        .grid-meta-item {
          display: flex;
          align-items: center;
          gap: 0.35rem;
        }

        .grid-meta-item strong {
          color: var(--text-main);
        }

        /* Video Grid Layouts */
        .video-grid {
          display: grid;
          gap: 1rem;
        }

        .grid-size-1 { grid-template-columns: 1fr; }
        .grid-size-2 { grid-template-columns: repeat(2, 1fr); }
        .grid-size-4 { grid-template-columns: repeat(2, 1fr); }
        .grid-size-6 { grid-template-columns: repeat(3, 1fr); }
        .grid-size-8 { grid-template-columns: repeat(4, 1fr); }
        .grid-size-9 { grid-template-columns: repeat(3, 1fr); }
        .grid-size-12 { grid-template-columns: repeat(4, 1fr); }
        .grid-size-16 { grid-template-columns: repeat(4, 1fr); }

        .video-card {
          padding: 0.75rem;
          border-radius: 12px;
          background: #090c17;
          border: 1px solid var(--border-color);
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .video-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.775rem;
          font-weight: 600;
          color: var(--text-muted);
        }

        .stream-timer strong {
          color: var(--color-secondary);
          font-family: var(--font-mono);
        }

        .progress-bar-container {
          background: rgba(255, 255, 255, 0.03);
          border-radius: 99px;
          height: 4px;
          overflow: hidden;
          width: 100%;
        }

        .progress-bar-fill {
          background: linear-gradient(90deg, var(--color-primary), var(--color-secondary));
          height: 100%;
          border-radius: 99px;
          transition: width 1s linear;
        }

        .iframe-wrapper {
          position: relative;
          padding-top: 56.25%; /* 16:9 Aspect Ratio */
          width: 100%;
          background: #000000;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid rgba(255, 255, 255, 0.02);
        }

        .youtube-iframe {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }

        .video-card-controls {
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
          margin-top: 0.25rem;
        }

        .video-card-controls button,
        .video-card-controls a {
          padding: 0.4rem;
          font-size: 0.75rem;
          border-radius: 6px;
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

        @media (max-width: 1024px) {
          .grid-size-4, .grid-size-6, .grid-size-8, .grid-size-9, .grid-size-12, .grid-size-16 {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 600px) {
          .video-grid {
            grid-template-columns: 1fr !important;
          }
          .action-row {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};
