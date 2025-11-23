// src/main.jsx
import { render } from 'preact';
import WifiScanner from './WifiScanner';

// Use a Self-Executing Anonymous Function (SEAF) and ensure DOMContentLoaded
(function() {
    console.log("main.jsx: Script file has loaded.");
    
    document.addEventListener('DOMContentLoaded', () => {
        console.log("main.jsx: DOMContentLoaded fired. Attempting to mount Preact.");
        
        try {
            const rootElement = document.getElementById('app');
            if (rootElement) {
                // Render the WifiScanner component into the #app div
                render(<WifiScanner />, rootElement);
                console.log("main.jsx: Preact component mounted successfully.");
            } else {
                 console.error("main.jsx: ERROR! Cannot find mounting element #app.");
            }

        } catch (e) {
            console.error("main.jsx: Preact Mounting FAILED!", e);
        }
    });
})();