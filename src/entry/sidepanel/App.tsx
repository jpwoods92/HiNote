import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Database } from 'lucide-react';
import { useCurrentTab } from '@/hooks/useCurrentTab';
import { db } from '@/db';

function App() {
  const { tab, error } = useCurrentTab();
  const [dbStatus, setDbStatus] = useState<string>('Initializing...');

  useEffect(() => {
    // Verify DB connection
    db.open()
      .then(() => setDbStatus('Connected'))
      .catch((err: { message: string }) => setDbStatus(`Error: ${err.message}`));
  }, []);

  const isConnected = !!tab && !error;

  return (
    <div className="p-4 w-full h-screen flex flex-col gap-4">
      <header className="border-b pb-4">
        <h1 className="text-xl font-bold text-indigo-600 flex items-center gap-2">
          Highlight & Note
        </h1>
      </header>

      {/* Connection Status Badge */}
      <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
        isConnected ? 'bg-green-50 border-green-200 text-green-700' : 'bg-red-50 border-red-200 text-red-700'
      }`}>
        {isConnected ? <Wifi size={16} /> : <WifiOff size={16} />}
        <span>{isConnected ? 'Extension Connected' : 'Connection Failed'}</span>
      </div>

      {/* Tab Info */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-2">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Tab</h2>
        {tab ? (
          <>
            <p className="font-medium truncate" title={tab.title}>{tab.title}</p>
            <p className="text-xs text-gray-400 truncate" title={tab.url}>{tab.url}</p>
          </>
        ) : (
          <p className="text-sm text-gray-400 italic">Loading tab info...</p>
        )}
      </div>

      {/* Database Status */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 space-y-2 mt-auto">
        <div className="flex items-center gap-2 text-gray-600">
          <Database size={16} />
          <span className="text-sm font-medium">Local Storage (Dexie)</span>
        </div>
        <p className="text-xs text-gray-500">Status: {dbStatus}</p>
      </div>
    </div>
  );
}

export default App;
