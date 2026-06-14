import { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { AutoViewer } from './components/AutoViewer';
import { ProxyViewer } from './components/ProxyViewer';
import { SubPromoter } from './components/SubPromoter';
import { SubUnlocker } from './components/SubUnlocker';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [coins, setCoins] = useState(450); // Starting wallet coins
  const [activeViewerCount, setActiveViewerCount] = useState(0);
  const [watchTime, setWatchTime] = useState(0.0);
  const [totalViews, setTotalViews] = useState(0);
  const [subscribersGenerated, setSubscribersGenerated] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [quickUrl, setQuickUrl] = useState('');

  // Add system events to the console log
  const addLog = (message: string) => {
    setLogs(prev => [message, ...prev.slice(0, 49)]); // Cap at 50 logs for performance
  };

  // Run initialization logs
  useEffect(() => {
    addLog('[SYSTEM] YTBoost Core Engine v1.2.0 initialized.');
    addLog('[SYSTEM] Proxy emulation layer standby.');
    addLog('[SYSTEM] Awaiting input URL stream configurations.');
  }, []);

  // Quick launch video from Dashboard quick form
  const quickLaunchVideo = (url: string) => {
    setQuickUrl(url);
    addLog(`[SYSTEM] Quick-launching stream from Dashboard: ${url}`);
  };

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Dashboard 
            coins={coins}
            activeViewerCount={activeViewerCount}
            watchTime={watchTime}
            totalViews={totalViews}
            subscribersGenerated={subscribersGenerated}
            logs={logs}
            setActiveTab={setActiveTab}
            quickLaunchVideo={quickLaunchVideo}
          />
        );
      case 'viewer':
        return (
          <AutoViewer 
            quickUrl={quickUrl}
            setQuickUrl={setQuickUrl}
            activeViewerCount={activeViewerCount}
            setActiveViewerCount={setActiveViewerCount}
            totalViews={totalViews}
            setTotalViews={setTotalViews}
            watchTime={watchTime}
            setWatchTime={setWatchTime}
            addLog={addLog}
          />
        );
      case 'proxy_viewer':
        return (
          <ProxyViewer />
        );
      case 'promoter':
        return (
          <SubPromoter 
            coins={coins}
            setCoins={setCoins}
            subscribersGenerated={subscribersGenerated}
            setSubscribersGenerated={setSubscribersGenerated}
            addLog={addLog}
          />
        );
      case 'unlocker':
        return (
          <SubUnlocker 
            addLog={addLog}
            setSubscribersGenerated={setSubscribersGenerated}
          />
        );
      default:
        return (
          <Dashboard 
            coins={coins}
            activeViewerCount={activeViewerCount}
            watchTime={watchTime}
            totalViews={totalViews}
            subscribersGenerated={subscribersGenerated}
            logs={logs}
            setActiveTab={setActiveTab}
            quickLaunchVideo={quickLaunchVideo}
          />
        );
    }
  };

  return (
    <div className="app-container">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        coins={coins}
      />
      <main className="main-content">
        <Header activeTab={activeTab} />
        {renderActiveTab()}
      </main>
    </div>
  );
}

export default App;
