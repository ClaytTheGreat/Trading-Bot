/**
 * Simplified AI Debugging Agent for MetaMask Connectivity
 * 
 * This module provides basic error detection and recovery for MetaMask connectivity
 * without adding unnecessary complexity to the UI.
 */

class SimpleMetaMaskDebugger {
    constructor() {
        this.isMetaMaskInstalled = false;
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 3;
        this.debugLog = [];
        this.monitoringActive = false;
    }

    /**
     * Initialize the debugging agent
     */
    initialize() {
        this.log('MetaMask debugging agent initializing...');
        
        // Check if MetaMask is installed
        this.isMetaMaskInstalled = typeof window.ethereum !== 'undefined' && window.ethereum.isMetaMask;
        
        if (this.isMetaMaskInstalled) {
            this.log('MetaMask detected');
            
            // Set up event listeners for MetaMask events
            this.setupEventListeners();
            
            // Start monitoring connection status
            this.startMonitoring();
        } else {
            this.log('MetaMask not detected');
        }
        
        return this.isMetaMaskInstalled;
    }

    /**
     * Set up event listeners for MetaMask events
     */
    setupEventListeners() {
        if (!window.ethereum) return;
        
        // Listen for connection status changes
        window.ethereum.on('connect', () => {
            this.log('MetaMask connected event received');
            this.isConnected = true;
        });
        
        window.ethereum.on('disconnect', () => {
            this.log('MetaMask disconnected event received');
            this.isConnected = false;
            this.attemptReconnection();
        });
        
        // Listen for errors
        window.ethereum.on('error', (error) => {
            this.log(`MetaMask error: ${error.message}`);
            this.handleError(error);
        });
    }

    /**
     * Start monitoring connection status
     */
    startMonitoring() {
        if (this.monitoringActive) return;
        
        this.monitoringActive = true;
        this.log('Connection monitoring started');
        
        // Check connection status periodically
        setInterval(() => {
            this.checkConnectionStatus();
        }, 10000); // Check every 10 seconds
    }

    /**
     * Check current connection status
     */
    async checkConnectionStatus() {
        if (!window.ethereum) return;
        
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const wasConnected = this.isConnected;
            this.isConnected = accounts && accounts.length > 0;
            
            // If connection was lost, attempt to reconnect
            if (wasConnected && !this.isConnected) {
                this.log('Connection lost, attempting to reconnect...');
                this.attemptReconnection();
            }
        } catch (error) {
            this.log(`Error checking connection status: ${error.message}`);
        }
    }

    /**
     * Attempt to reconnect to MetaMask
     */
    async attemptReconnection() {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.log('Maximum reconnection attempts reached');
            this.addToSystemLog('Connection issues detected. Please try reconnecting manually.');
            return;
        }
        
        this.connectionAttempts++;
        this.log(`Reconnection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
        
        try {
            // Try to reconnect using the main wallet connection module
            if (window.walletConnection && typeof window.walletConnection.connect === 'function') {
                await window.walletConnection.connect();
            }
        } catch (error) {
            this.log(`Reconnection attempt failed: ${error.message}`);
        }
    }

    /**
     * Handle MetaMask errors
     */
    handleError(error) {
        // Log the error
        this.log(`Handling error: ${error.message}`);
        
        // Add to system log
        this.addToSystemLog(`MetaMask error: ${error.message}`);
        
        // Check for common errors and suggest solutions
        if (error.message.includes('User rejected')) {
            this.addToSystemLog('Connection rejected. Please check MetaMask and try again.');
        } else if (error.message.includes('chain ID')) {
            this.addToSystemLog('Network error. Please check if you\'re connected to the correct network.');
        } else if (error.message.includes('already pending')) {
            this.addToSystemLog('MetaMask has a pending request. Please check your MetaMask extension.');
        }
    }

    /**
     * Log a debug message
     */
    log(message) {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] ${message}`;
        
        // Add to internal log
        this.debugLog.push(logEntry);
        
        // Log to console
        console.log(`[MetaMask Debug] ${message}`);
        
        // Limit log size
        if (this.debugLog.length > 100) {
            this.debugLog.shift();
        }
    }

    /**
     * Add message to system log
     */
    addToSystemLog(message) {
        const systemLog = document.getElementById('system-log');
        if (systemLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'log-time';
            timestamp.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.textContent = message;
            
            logEntry.appendChild(timestamp);
            logEntry.appendChild(logMessage);
            systemLog.appendChild(logEntry);
            
            // Scroll to bottom
            systemLog.scrollTop = systemLog.scrollHeight;
        }
    }

    /**
     * Get debug log
     */
    getDebugLog() {
        return this.debugLog;
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskAvailable() {
        return this.isMetaMaskInstalled;
    }

    /**
     * Check if connected to MetaMask
     */
    isMetaMaskConnected() {
        return this.isConnected;
    }
}

// Initialize the debugger when the document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize the debugger
    window.metaMaskDebugger = new SimpleMetaMaskDebugger();
    window.metaMaskDebugger.initialize();
});
