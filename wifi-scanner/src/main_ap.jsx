// src/main_ap.jsx 
import { render } from 'preact';
import WifiApConfig from './WifiApConfig'; 

(function() {
    document.addEventListener('DOMContentLoaded', () => {
        const rootElement = document.getElementById('app');
        if (rootElement) {
            render(<WifiApConfig />, rootElement);
        }
    });
})();