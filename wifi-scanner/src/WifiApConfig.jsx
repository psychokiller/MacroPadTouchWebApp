// src/WifiApConfig.jsx
import { useState, useEffect } from 'preact/hooks';

const componentStyles = `
    .form-group { margin-top: 15px; }
    label { display: block; font-weight: bold; margin-bottom: 5px; }
    input[type='text'], input[type='password'] { 
        width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; 
    }
    button { 
        background-color: #007bff; color: white; padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer; 
        margin-top: 20px; width: 100%; font-size: 1.1em;
    }
    button:hover { background-color: #0056b3; }
    .status-message { 
        padding: 10px; margin-top: 15px; border-radius: 4px; text-align: center; font-weight: bold; 
    }
    .success { background-color: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
    .error { background-color: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
    .current-info { font-style: italic; color: #666; font-size: 0.9em; }
`;

function WifiApConfig() {
    const [ssid, setSsid] = useState('');
    const [password, setPassword] = useState('');
    const [currentConfig, setCurrentConfig] = useState({ ssid: '', password_mask: '' });
    const [status, setStatus] = useState({ message: '', type: '' });
    const [isLoading, setIsLoading] = useState(true);

    const fetchCurrentConfig = async () => {
        try {
            const response = await fetch('/api/wifi/ap');
            const data = response.ok ? await response.json() : { ssid: 'N/A', password_mask: 'N/A' };
            setCurrentConfig(data);
            setSsid(data.ssid); 
        } catch (e) {
            setStatus({ message: 'Network error while fetching configuration.', type: 'error' });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchCurrentConfig();
    }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!ssid.trim()) return;

        setStatus({ message: 'Saving configuration...', type: '' });
        setIsLoading(true);

        try {
            const response = await fetch('/api/wifi/ap', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ssid, password }),
            });

            const data = await response.json();

            if (response.ok) {
                setStatus({ message: data.message, type: 'success' });
                await fetchCurrentConfig(); 
            } else {
                setStatus({ message: data.message || 'Save failed.', type: 'error' });
            }
        } catch (e) {
            setStatus({ message: 'Network error during save operation.', type: 'error' });
        } finally {
            setIsLoading(false);
            setPassword(''); 
        }
    };

    return (
        <>
            <style>{componentStyles}</style>
            <div className="container">
                <h1>Access Point Configuration</h1>

                {isLoading ? (
                    <p style={{textAlign: 'center'}}>Loading current configuration...</p>
                ) : (
                    <form onSubmit={handleSubmit}>
                        
                        <div className="form-group">
                            <label htmlFor="ssid">SSID</label>
                            <p className="current-info">Current: <strong>{currentConfig.ssid || "Not Set"}</strong></p>
                            <input 
                                type="text" id="ssid" value={ssid}
                                onInput={(e) => setSsid(e.target.value)}
                                placeholder="Enter new SSID" required maxLength="32"
                            />
                        </div>

                        <div className="form-group">
                            <label htmlFor="password">Password (8-63 characters, leave blank for open network)</label>
                            <p className="current-info">Current: {currentConfig.password_mask || "Not Set/Open"}</p>
                            <input 
                                type="password" id="password" value={password}
                                onInput={(e) => setPassword(e.target.value)}
                                placeholder="Enter new password" minLength="0" maxLength="64"
                            />
                        </div>

                        <button type="submit" disabled={isLoading || !ssid.trim()}>
                            {isLoading ? 'Saving...' : 'Save Configuration'}
                        </button>
                    </form>
                )}

                {status.message && (
                    <div className={`status-message ${status.type}`}>
                        {status.message}
                    </div>
                )}
            </div>
        </>
    );
}

export default WifiApConfig;