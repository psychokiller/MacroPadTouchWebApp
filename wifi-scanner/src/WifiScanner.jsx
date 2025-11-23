// src/WifiScanner.jsx
import { useState, useEffect, useCallback } from 'preact/hooks';

// --- Configuration ---
const SCAN_POLLING_INTERVAL_MS = 10000; // Poll every 10 seconds

// Inline CSS for the component (safer than external file if the loader fails)
const globalStyles = `
    body { font-family: Arial, sans-serif; margin: 20px; background-color: #f4f4f4; }
    .container { max-width: 600px; margin: auto; background: #fff; padding: 20px; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1); }
    h1, h2 { color: #333; text-align: center; }
    nav { text-align: center; margin-bottom: 20px; }
    nav a { margin: 0 10px; text-decoration: none; color: #007bff; }
    ul { list-style: none; padding: 0; }
    .network-item { display: flex; flex-wrap: wrap; align-items: center; padding: 10px; margin-bottom: 8px; border: 1px solid #ddd; border-radius: 4px; background-color: #f9f9f9; }
    .network-info { flex-grow: 1; display: flex; flex-direction: column; }
    .ssid { font-weight: bold; font-size: 1.1em; }
    .security { font-size: 0.8em; color: #666; }
    .connect-btn { background-color: #28a745; color: white; border: none; padding: 8px 15px; border-radius: 4px; cursor: pointer; margin-left: 10px; }
    .connect-btn:hover { background-color: #1e7e34; }
    .password-form { flex-basis: 100%; display: flex; margin-top: 10px; }
    .password-form input { flex-grow: 1; padding: 8px; border: 1px solid #ccc; border-radius: 4px 0 0 4px; }
    .password-form button { background-color: #007bff; color: white; padding: 8px 15px; border: none; border-radius: 0 4px 4px 0; cursor: pointer; }
    .password-form button:hover { background-color: #0056b3; }
    .status-message { padding: 10px; margin-bottom: 20px; border-radius: 4px; text-align: center; font-weight: bold; }
    .status-message.success { color: green; background-color: #e6ffe6; border: 1px solid green; }
    .status-message.error { color: red; background-color: #ffe6e6; border: 1px solid red; }
    .sta-status-box { 
        padding: 15px; 
        margin-bottom: 20px; 
        border-radius: 6px; 
        text-align: center;
        border: 1px solid #007bff;
        background-color: #eaf6ff;
    }
    .sta-status-connected {
        background-color: #d4edda;
        border-color: #155724;
        color: #155724;
    }
    .sta-status-disconnected {
        background-color: #f8d7da;
        border-color: #721c24;
        color: #721c24;
    }
    .sta-status-connecting {
        background-color: #fff3cd;
        border-color: #856404;
        color: #856404;
    }
`;

function WifiScanner() {
  const [networks, setNetworks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeSsid, setActiveSsid] = useState(null);
  const [passwordInput, setPasswordInput] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  
  // New state for STA connection status and saved configuration
  const [staStatus, setStaStatus] = useState({
      isConnected: false,
      savedSsid: null,
      ipAddress: null,
  });

  // --- Data Fetching Logic ---

  /**
   * Fetches both the network scan results and the current STA status/saved config.
   * NOTE: This assumes the '/api/wifi/scan' endpoint now returns a JSON object
   * containing both 'sta_status' and 'networks' arrays (see suggested backend change).
   */
  const fetchStatusAndNetworks = useCallback(async () => {
    // Only show loading on the first fetch to avoid flickering during polling
    if (networks.length === 0) setLoading(true); 
    setError(null);
    try {
      const response = await fetch('/api/wifi/scan');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      // 1. Update Networks: Check for missing SSIDs and assign a placeholder
      const cleanedNetworks = (data.networks || []).map(net => ({
          ...net,
          // If SSID is an empty string (common for hidden networks), use a placeholder
          ssid: net.ssid.trim() === "" ? "(Hidden Network)" : net.ssid 
      }));

      setNetworks(cleanedNetworks);
      
      // 2. Update STA Status
      if (data.sta_status) {
          setStaStatus({
              isConnected: data.sta_status.is_connected || false,
              savedSsid: data.sta_status.saved_ssid || null,
              ipAddress: data.sta_status.ip_address || null,
          });
      }

      console.log("Preact: Data fetched successfully.");
    } catch (e) {
      setError("Failed to load networks and status. Check server logs.");
      console.error("Fetch Error:", e);
    } finally {
      setLoading(false);
    }
  }, [networks.length]); // networks.length is a safe dependency to prevent repeated first-load effects

  // --- Polling Implementation (useEffect) ---
  useEffect(() => {
    // 1. Run the initial fetch immediately
    console.log("Preact: useEffect running, initiating first scan and setting up polling.");
    fetchStatusAndNetworks();

    // 2. Set up the interval for periodic fetching
    const intervalId = setInterval(() => {
        console.log(`Preact: Polling for networks/status (every ${SCAN_POLLING_INTERVAL_MS/1000}s)`);
        fetchStatusAndNetworks();
    }, SCAN_POLLING_INTERVAL_MS);

    // 3. Cleanup function: runs when the component unmounts or before re-running useEffect
    return () => {
      console.log("Preact: Cleaning up polling interval.");
      clearInterval(intervalId);
    };
  }, [fetchStatusAndNetworks]); // Dependency array ensures the interval is only created/destroyed when the function changes

  // --- Interaction Handlers (Unchanged) ---
  
  const connectNetwork = useCallback(async (ssid, password) => {
    // Only attempt to connect if the SSID is not the "Hidden Network" placeholder
    if (ssid === "(Hidden Network)") {
        setStatusMessage("To connect to a Hidden Network, you must manually set its name in a specific config page (not implemented here) or ensure your backend handles the connection by name.");
        return;
    }
    
    setStatusMessage('Connecting...');
    setActiveSsid(null); 

    try {
      const response = await fetch('/api/wifi/sta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ssid, password })
      });

      const result = await response.json();

      if (response.ok) {
        // Status message updated to reflect the new STA status logic
        setStatusMessage(`Success! Credentials saved. The device is now attempting to connect to ${ssid}. Polling will show connection status shortly.`);
        setPasswordInput('');
      } else {
        setStatusMessage(`Error: ${result.message || 'Failed to connect/save credentials.'}`);
      }

    } catch (e) {
      setStatusMessage('A network error occurred while trying to connect.');
      console.error("Connect Error:", e);
    }
  }, []);

  const toggleForm = (ssid, isOpen) => {
    if (isOpen) {
      connectNetwork(ssid, '');
    } else {
      setActiveSsid(activeSsid === ssid ? null : ssid);
      setPasswordInput('');
      setStatusMessage('');
    }
  };

  const handleSubmit = (event, ssid) => {
    event.preventDefault();
    if (passwordInput.length >= 8) {
      connectNetwork(ssid, passwordInput);
    } else {
      setStatusMessage('Password must be at least 8 characters.');
    }
  };
  
  // --- UI Helpers ---
  
  const getStatusClass = (status) => {
      if (status.isConnected) return 'sta-status-connected';
      if (status.savedSsid) return 'sta-status-connecting'; // Implicitly connecting if saved but not connected
      return 'sta-status-disconnected';
  };
  
  const getStatusText = (status) => {
      if (status.isConnected) {
          return `✅ Connected to ${status.savedSsid} (IP: ${status.ipAddress})`;
      }
      if (status.savedSsid) {
          return `⚠️ Saved: ${status.savedSsid}. Attempting to connect... (Last status: Disconnected)`;
      }
      return '❌ Not configured. Please select a network below.';
  };
  
  // --- Render Function ---

  return (
    <>
        {/* --- 1. STA Connection Status --- */}
        <div className={`sta-status-box ${getStatusClass(staStatus)}`}>
            <strong>Client Status:</strong> {getStatusText(staStatus)}
        </div>

        {/* --- 2. Action Status Message --- */}
        {statusMessage && (
          <p className={`status-message ${statusMessage.includes('Success') ? 'success' : 'error'}`}>
            {statusMessage}
          </p>
        )}

        <h2>Available Networks ({loading ? 'Scanning...' : networks.length})</h2>

        <div className="network-list">
          {/* Loading States */}
          {loading ? (
            <p style={{ textAlign: 'center', color: '#007bff' }}>Scanning for Wi-Fi networks...</p>
          ) : error ? (
            <p className="error" style={{ textAlign: 'center' }}>Error: {error}</p>
          ) : networks.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#888' }}>No Wi-Fi networks found.</p>
          ) : (
            
            <>
              {/* Network List */}
              <ul>
                {networks.map(network => (
                  <li className="network-item" key={network.ssid + network.is_open.toString()}>
                    <div className="network-info">
                      {/* Display the clean SSID or placeholder for Hidden Network */}
                      <span className="ssid">{network.ssid}</span>
                      <span className="security">
                          {network.is_open ? 'Open' : 'WPA/WPA2'} 
                          {network.ssid === staStatus.savedSsid && (
                              <span style={{ marginLeft: '10px', color: staStatus.isConnected ? 'green' : '#856404' }}>
                                  {staStatus.isConnected ? '(Current & Connected)' : '(Current, but disconnected)'}
                              </span>
                          )}
                      </span>
                    </div>
                    
                    <button 
                      className="connect-btn"
                      onClick={() => toggleForm(network.ssid, network.is_open)}
                      disabled={network.ssid === "(Hidden Network)"} // Disable connect for placeholder hidden networks
                    >
                      {network.is_open ? 'Connect' : (activeSsid === network.ssid ? 'Cancel' : 'Connect')}
                    </button>
                    
                    {/* Password Form */}
                    {activeSsid === network.ssid && !network.is_open && (
                      <form 
                        onSubmit={(e) => handleSubmit(e, network.ssid)} 
                        className="password-form" 
                        id={`form-${network.ssid}`}
                      >
                        <input 
                          type="password" 
                          placeholder="Enter password (min 8 characters)" 
                          required 
                          minLength="8" 
                          value={passwordInput}
                          onInput={(e) => setPasswordInput(e.target.value)}
                        />
                        <button type="submit">Connect</button>
                      </form>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p style={{ textAlign: 'center', marginTop: '20px' }}>
            List refreshes every {SCAN_POLLING_INTERVAL_MS/1000} seconds.
        </p>
    </>
  );
}

export default WifiScanner;
