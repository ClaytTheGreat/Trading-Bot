/**
 * Enhanced Wallet Connection Synchronization Module
 * Ensures consistent wallet connection state across UI elements
 */

class WalletConnectionSync {
    constructor() {
        this.isConnected = false;
        this.walletAddress = null;
        this.walletNetwork = null;
        this.walletBalance = null;
        this.connectionListeners = [];
        this.disconnectionListeners = [];
        this.networkChangeListeners = [];
        this.errorListeners = [];
        this.lastError = null;
        this.autoReconnectEnabled = true;
        this.autoReconnectAttempts = 0;
        this.maxAutoReconnectAttempts = 3;
        this.reconnectInterval = 5000; // 5 seconds
        this.reconnectTimer = null;
        this.debugMode = true;
    }

    /**
     * Initialize wallet connection synchronization
     */
    initialize() {
        this.log('Initializing wallet connection synchronization...');
        
        // Update UI elements initially
        this.updateUIElements();
        
        // Set up event listeners for MetaMask
        this.setupMetaMaskListeners();
        
        // Check if MetaMask is already connected
        this.checkExistingConnection();
        
        // Set up UI button listeners
        this.setupUIListeners();
        
        return true;
    }
    
    /**
     * Set up MetaMask event listeners
     */
    setupMetaMaskListeners() {
        if (window.ethereum) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                this.log('MetaMask accounts changed:', accounts);
                
                if (accounts.length === 0) {
                    // User disconnected their wallet
                    this.handleDisconnect('User disconnected wallet');
                } else {
                    // User switched accounts
                    this.walletAddress = accounts[0];
                    this.updateUIElements();
                    this.notifyConnectionListeners();
                }
            });
            
            // Listen for chain/network changes
            window.ethereum.on('chainChanged', (chainId) => {
                this.log('MetaMask chain changed:', chainId);
                
                // Update network information
                this.updateNetworkInfo(chainId);
                
                // Notify listeners
                this.notifyNetworkChangeListeners(chainId);
                
                // Update UI
                this.updateUIElements();
            });
            
            // Listen for connection events
            window.ethereum.on('connect', (connectInfo) => {
                this.log('MetaMask connected:', connectInfo);
                
                // Check if we have an address
                if (this.walletAddress) {
                    this.isConnected = true;
                    this.updateUIElements();
                    this.notifyConnectionListeners();
                } else {
                    // We need to request accounts
                    this.connectWallet();
                }
            });
            
            // Listen for disconnect events
            window.ethereum.on('disconnect', (error) => {
                this.log('MetaMask disconnected:', error);
                this.handleDisconnect('Provider disconnected');
            });
        }
    }
    
    /**
     * Check if MetaMask is already connected
     */
    async checkExistingConnection() {
        if (window.ethereum) {
            try {
                // Check if we're already connected
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                
                if (accounts.length > 0) {
                    this.log('Found existing connection:', accounts[0]);
                    
                    // We're already connected
                    this.walletAddress = accounts[0];
                    this.isConnected = true;
                    
                    // Get network info
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    this.updateNetworkInfo(chainId);
                    
                    // Get balance
                    await this.updateBalance();
                    
                    // Update UI
                    this.updateUIElements();
                    
                    // Notify listeners
                    this.notifyConnectionListeners();
                    
                    return true;
                }
            } catch (error) {
                this.log('Error checking existing connection:', error);
                this.handleError(error);
            }
        }
        
        return false;
    }
    
    /**
     * Set up UI button listeners
     */
    setupUIListeners() {
        // Connect wallet button in header
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => {
                if (this.isConnected) {
                    this.disconnectWallet();
                } else {
                    this.connectWallet();
                }
            });
        }
        
        // Connect MetaMask button in wallet card
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            connectMetaMaskBtn.addEventListener('click', () => {
                this.connectWallet();
            });
        }
    }
    
    /**
     * Connect wallet
     */
    async connectWallet() {
        if (window.ethereum) {
            try {
                this.log('Connecting wallet...');
                
                // Request accounts
                const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
                
                if (accounts.length > 0) {
                    this.walletAddress = accounts[0];
                    this.isConnected = true;
                    
                    // Get network info
                    const chainId = await window.ethereum.request({ method: 'eth_chainId' });
                    this.updateNetworkInfo(chainId);
                    
                    // Get balance
                    await this.updateBalance();
                    
                    // Update UI
                    this.updateUIElements();
                    
                    // Notify listeners
                    this.notifyConnectionListeners();
                    
                    // Log success
                    this.log('Wallet connected successfully:', this.walletAddress);
                    
                    // Add to system log
                    this.addToSystemLog('Wallet connected: ' + this.formatAddress(this.walletAddress));
                    this.addToSystemLog('Network: ' + this.walletNetwork);
                    this.addToSystemLog('Balance: ' + this.walletBalance);
                    
                    return true;
                }
            } catch (error) {
                this.log('Error connecting wallet:', error);
                this.handleError(error);
            }
        } else {
            this.handleError(new Error('MetaMask not installed'));
            this.addToSystemLog('Error: MetaMask not installed');
        }
        
        return false;
    }
    
    /**
     * Disconnect wallet
     */
    disconnectWallet() {
        this.log('Disconnecting wallet...');
        
        // We can't actually disconnect via MetaMask API, but we can reset our state
        this.isConnected = false;
        this.walletAddress = null;
        this.walletNetwork = null;
        this.walletBalance = null;
        
        // Update UI
        this.updateUIElements();
        
        // Notify listeners
        this.notifyDisconnectionListeners();
        
        // Add to system log
        this.addToSystemLog('Wallet disconnected');
        
        return true;
    }
    
    /**
     * Handle disconnect event
     */
    handleDisconnect(reason) {
        this.log('Handling disconnect:', reason);
        
        // Reset state
        this.isConnected = false;
        this.walletAddress = null;
        this.walletNetwork = null;
        this.walletBalance = null;
        
        // Update UI
        this.updateUIElements();
        
        // Notify listeners
        this.notifyDisconnectionListeners();
        
        // Add to system log
        this.addToSystemLog('Wallet disconnected: ' + reason);
        
        // Try to reconnect if enabled
        if (this.autoReconnectEnabled && this.autoReconnectAttempts < this.maxAutoReconnectAttempts) {
            this.autoReconnectAttempts++;
            
            this.log('Attempting to reconnect... Attempt ' + this.autoReconnectAttempts + ' of ' + this.maxAutoReconnectAttempts);
            this.addToSystemLog('Attempting to reconnect... Attempt ' + this.autoReconnectAttempts + ' of ' + this.maxAutoReconnectAttempts);
            
            // Set up reconnect timer
            if (this.reconnectTimer) {
                clearTimeout(this.reconnectTimer);
            }
            
            this.reconnectTimer = setTimeout(() => {
                this.connectWallet();
            }, this.reconnectInterval);
        }
    }
    
    /**
     * Handle error
     */
    handleError(error) {
        this.log('Handling error:', error);
        
        // Store error
        this.lastError = error;
        
        // Notify listeners
        this.notifyErrorListeners(error);
        
        // Check if MetaMask is installed
        if (!window.ethereum) {
            // Update UI to show MetaMask not installed
            const statusIndicator = document.getElementById('status-indicator');
            const connectionStatus = document.getElementById('connection-status');
            const connectMetaMaskBtn = document.getElementById('connect-metamask');
            
            if (statusIndicator) {
                statusIndicator.className = 'status-indicator disconnected';
            }
            
            if (connectionStatus) {
                connectionStatus.textContent = 'MetaMask Not Installed';
            }
            
            if (connectMetaMaskBtn) {
                connectMetaMaskBtn.textContent = 'Install MetaMask';
                connectMetaMaskBtn.addEventListener('click', () => {
                    window.open('https://metamask.io/download.html', '_blank');
                });
            }
        }
    }
    
    /**
     * Update network information
     */
    updateNetworkInfo(chainId) {
        // Convert chainId to decimal if it's hex
        if (typeof chainId === 'string' && chainId.startsWith('0x')) {
            chainId = parseInt(chainId, 16);
        }
        
        // Set network name based on chain ID
        switch (chainId) {
            case 1:
                this.walletNetwork = 'Ethereum';
                break;
            case 42161:
                this.walletNetwork = 'Arbitrum';
                break;
            case 43114:
                this.walletNetwork = 'Avalanche C-Chain';
                break;
            default:
                this.walletNetwork = 'Unknown (' + chainId + ')';
        }
        
        this.log('Updated network info:', this.walletNetwork);
    }
    
    /**
     * Update wallet balance
     */
    async updateBalance() {
        if (window.ethereum && this.walletAddress) {
            try {
                // Get balance
                const balance = await window.ethereum.request({
                    method: 'eth_getBalance',
                    params: [this.walletAddress, 'latest']
                });
                
                // Convert from wei to ETH
                const ethBalance = parseInt(balance, 16) / 1e18;
                
                // Format balance
                this.walletBalance = ethBalance.toFixed(4) + ' ETH';
                
                this.log('Updated balance:', this.walletBalance);
                
                return true;
            } catch (error) {
                this.log('Error updating balance:', error);
                this.handleError(error);
            }
        }
        
        return false;
    }
    
    /**
     * Update UI elements based on connection state
     */
    updateUIElements() {
        this.log('Updating UI elements. Connected:', this.isConnected);
        
        // Header connect button
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            if (this.isConnected) {
                connectWalletBtn.textContent = 'Disconnect';
                connectWalletBtn.classList.add('connected');
            } else {
                connectWalletBtn.textContent = 'Connect Wallet';
                connectWalletBtn.classList.remove('connected');
            }
        }
        
        // Status indicator
        const statusIndicator = document.getElementById('status-indicator');
        if (statusIndicator) {
            statusIndicator.className = 'status-indicator ' + (this.isConnected ? 'connected' : 'disconnected');
        }
        
        // Connection status text
        const connectionStatus = document.getElementById('connection-status');
        if (connectionStatus) {
            connectionStatus.textContent = this.isConnected ? 'Connected' : 'Disconnected';
        }
        
        // Connect MetaMask button
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            if (this.isConnected) {
                connectMetaMaskBtn.textContent = 'Disconnect';
                connectMetaMaskBtn.classList.add('connected');
            } else {
                connectMetaMaskBtn.textContent = window.ethereum ? 'Connect MetaMask' : 'Install MetaMask';
                connectMetaMaskBtn.classList.remove('connected');
            }
        }
        
        // Wallet details section
        const walletDetails = document.getElementById('wallet-details');
        if (walletDetails) {
            walletDetails.style.display = this.isConnected ? 'block' : 'none';
        }
        
        // Wallet address
        const walletAddressElement = document.getElementById('wallet-address');
        if (walletAddressElement && this.walletAddress) {
            walletAddressElement.textContent = this.formatAddress(this.walletAddress);
        }
        
        // Wallet network
        const walletNetworkElement = document.getElementById('wallet-network');
        if (walletNetworkElement && this.walletNetwork) {
            walletNetworkElement.textContent = this.walletNetwork;
        }
        
        // Wallet balance
        const walletBalanceElement = document.getElementById('wallet-balance');
        if (walletBalanceElement && this.walletBalance) {
            walletBalanceElement.textContent = this.walletBalance;
        }
        
        // Update network selector to match current network
        if (this.isConnected && this.walletNetwork) {
            const networkSelect = document.getElementById('network-select');
            if (networkSelect) {
                // Find option that matches current network
                for (let i = 0; i < networkSelect.options.length; i++) {
                    if (networkSelect.options[i].text.toLowerCase() === this.walletNetwork.toLowerCase()) {
                        networkSelect.selectedIndex = i;
                        break;
                    }
                }
            }
        }
        
        // Remove any connection notifications
        const notifications = document.querySelectorAll('.notification');
        notifications.forEach(notification => {
            if (notification.textContent.includes('Connect your wallet') || 
                notification.textContent.includes('MetaMask not detected')) {
                notification.remove();
            }
        });
        
        // Enable/disable trading buttons based on connection state
        const startTradingBtn = document.getElementById('start-trading');
        const stopTradingBtn = document.getElementById('stop-trading');
        
        if (startTradingBtn && stopTradingBtn) {
            if (this.isConnected) {
                startTradingBtn.disabled = false;
                // Stop trading remains disabled until trading is started
            } else {
                startTradingBtn.disabled = true;
                stopTradingBtn.disabled = true;
            }
        }
    }
    
    /**
     * Format wallet address for display
     */
    formatAddress(address) {
        if (!address) return '';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }
    
    /**
     * Add event listener for connection events
     */
    addConnectionListener(callback) {
        if (typeof callback === 'function') {
            this.connectionListeners.push(callback);
            return true;
        }
        return false;
    }
    
    /**
     * Add event listener for disconnection events
     */
    addDisconnectionListener(callback) {
        if (typeof callback === 'function') {
            this.disconnectionListeners.push(callback);
            return true;
        }
        return false;
    }
    
    /**
     * Add event listener for network change events
     */
    addNetworkChangeListener(callback) {
        if (typeof callback === 'function') {
            this.networkChangeListeners.push(callback);
            return true;
        }
        return false;
    }
    
    /**
     * Add event listener for error events
     */
    addErrorListener(callback) {
        if (typeof callback === 'function') {
            this.errorListeners.push(callback);
            return true;
        }
        return false;
    }
    
    /**
     * Notify connection listeners
     */
    notifyConnectionListeners() {
        const data = {
            address: this.walletAddress,
            network: this.walletNetwork,
            balance: this.walletBalance
        };
        
        this.connectionListeners.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                this.log('Error in connection listener callback:', error);
            }
        });
    }
    
    /**
     * Notify disconnection listeners
     */
    notifyDisconnectionListeners() {
        this.disconnectionListeners.forEach(callback => {
            try {
                callback();
            } catch (error) {
                this.log('Error in disconnection listener callback:', error);
            }
        });
    }
    
    /**
     * Notify network change listeners
     */
    notifyNetworkChangeListeners(chainId) {
        this.networkChangeListeners.forEach(callback => {
            try {
                callback(chainId, this.walletNetwork);
            } catch (error) {
                this.log('Error in network change listener callback:', error);
            }
        });
    }
    
    /**
     * Notify error listeners
     */
    notifyErrorListeners(error) {
        this.errorListeners.forEach(callback => {
            try {
                callback(error);
            } catch (err) {
                this.log('Error in error listener callback:', err);
            }
        });
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
     * Log message to console if debug mode is enabled
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[WalletConnectionSync]', ...args);
        }
    }
}

// Initialize wallet connection sync when document is ready
document.addEventListener('DOMContentLoaded', function() {
    window.walletConnectionSync = new WalletConnectionSync();
    window.walletConnectionSync.initialize();
});
