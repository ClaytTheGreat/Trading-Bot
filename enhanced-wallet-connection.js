/**
 * Enhanced Wallet Connection Module for Antarctic Exchange
 * 
 * This module provides robust wallet connection for the trading bot,
 * with specific optimizations for Antarctic Exchange and MetaMask integration.
 */

class EnhancedWalletConnection {
    constructor() {
        this.isConnected = false;
        this.address = null;
        this.chainId = null;
        this.provider = null;
        this.signer = null;
        this.networkName = null;
        this.balance = null;
        this.connectionStatus = 'disconnected'; // disconnected, connecting, connected, error
        this.errorMessage = null;
        this.connectionCallbacks = [];
        this.detectionInterval = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        
        // Supported networks
        this.supportedNetworks = {
            42161: {
                name: 'Arbitrum',
                currency: 'ETH',
                rpcUrl: 'https://arb1.arbitrum.io/rpc',
                explorerUrl: 'https://arbiscan.io'
            },
            43114: {
                name: 'Avalanche C-Chain',
                currency: 'AVAX',
                rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
                explorerUrl: 'https://snowtrace.io'
            },
            1: {
                name: 'Ethereum',
                currency: 'ETH',
                rpcUrl: 'https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161',
                explorerUrl: 'https://etherscan.io'
            }
        };
        
        // Default to Avalanche C-Chain
        this.preferredChainId = 43114;
    }
    
    /**
     * Initialize wallet connection
     */
    async initialize() {
        console.log('Initializing enhanced wallet connection...');
        
        // Check for existing connection
        await this.checkConnection();
        
        // Set up continuous wallet detection
        this.setupContinuousDetection();
        
        // Set up event listeners
        this.setupEventListeners();
        
        return {
            success: true,
            message: 'Wallet connection initialized',
            isConnected: this.isConnected,
            address: this.address,
            networkName: this.networkName
        };
    }
    
    /**
     * Check for existing wallet connection
     */
    async checkConnection() {
        try {
            // Check if MetaMask is installed
            if (window.ethereum) {
                this.provider = window.ethereum;
                
                // Check if already connected
                const accounts = await this.provider.request({ method: 'eth_accounts' });
                
                if (accounts && accounts.length > 0) {
                    // Get network information
                    const chainId = await this.provider.request({ method: 'eth_chainId' });
                    
                    // Set connection info
                    this.address = accounts[0];
                    this.chainId = parseInt(chainId, 16);
                    this.networkName = this.getNetworkName(this.chainId);
                    this.isConnected = true;
                    this.connectionStatus = 'connected';
                    
                    // Get balance
                    await this.updateBalance();
                    
                    console.log(`Wallet already connected: ${this.address} on ${this.networkName}`);
                    
                    // Update UI
                    this.updateConnectionUI();
                    
                    // Notify callbacks
                    this.notifyConnectionCallbacks({
                        connected: true,
                        address: this.address,
                        chainId: this.chainId,
                        networkName: this.networkName
                    });
                    
                    return true;
                }
            }
            
            // Not connected
            this.updateConnectionUI();
            return false;
        } catch (error) {
            console.error('Error checking wallet connection:', error);
            this.connectionStatus = 'error';
            this.errorMessage = error.message || 'Error checking connection';
            this.updateConnectionUI();
            return false;
        }
    }
    
    /**
     * Set up continuous wallet detection
     */
    setupContinuousDetection() {
        // Clear any existing interval
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        // Set up interval to check for wallet
        this.detectionInterval = setInterval(() => {
            // Check if MetaMask is installed
            if (window.ethereum && !this.provider) {
                console.log('MetaMask detected');
                this.provider = window.ethereum;
                this.updateConnectionUI();
                
                // Set up event listeners
                this.setupEventListeners();
                
                // Check for existing connection
                this.checkConnection();
            }
        }, 1000); // Check every second
    }
    
    /**
     * Set up wallet event listeners
     */
    setupEventListeners() {
        if (!this.provider) return;
        
        // Account changed
        this.provider.on('accountsChanged', (accounts) => {
            console.log('Accounts changed:', accounts);
            
            if (accounts.length === 0) {
                // Disconnected
                this.handleDisconnect();
            } else {
                // Account changed
                this.address = accounts[0];
                this.updateBalance();
                this.updateConnectionUI();
                
                // Notify callbacks
                this.notifyConnectionCallbacks({
                    connected: true,
                    address: this.address,
                    chainId: this.chainId,
                    networkName: this.networkName
                });
            }
        });
        
        // Chain changed
        this.provider.on('chainChanged', (chainId) => {
            console.log('Chain changed:', chainId);
            
            this.chainId = parseInt(chainId, 16);
            this.networkName = this.getNetworkName(this.chainId);
            this.updateBalance();
            this.updateConnectionUI();
            
            // Notify callbacks
            this.notifyConnectionCallbacks({
                connected: true,
                address: this.address,
                chainId: this.chainId,
                networkName: this.networkName
            });
        });
        
        // Disconnect
        this.provider.on('disconnect', (error) => {
            console.log('Wallet disconnected:', error);
            this.handleDisconnect();
        });
    }
    
    /**
     * Connect wallet
     */
    async connect() {
        try {
            this.connectionStatus = 'connecting';
            this.updateConnectionUI();
            
            // Check if MetaMask is installed
            if (!window.ethereum) {
                this.connectionStatus = 'error';
                this.errorMessage = 'MetaMask not installed';
                this.updateConnectionUI();
                
                // Show install MetaMask message
                this.showNotification('Please install MetaMask to connect your wallet', 'error');
                return false;
            }
            
            this.provider = window.ethereum;
            
            // Request accounts
            const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
            
            if (accounts && accounts.length > 0) {
                // Get network information
                const chainId = await this.provider.request({ method: 'eth_chainId' });
                
                // Set connection info
                this.address = accounts[0];
                this.chainId = parseInt(chainId, 16);
                this.networkName = this.getNetworkName(this.chainId);
                this.isConnected = true;
                this.connectionStatus = 'connected';
                
                // Get balance
                await this.updateBalance();
                
                console.log(`Wallet connected: ${this.address} on ${this.networkName}`);
                
                // Check if on supported network
                if (!this.supportedNetworks[this.chainId]) {
                    this.showNotification(`Connected to unsupported network: ${this.networkName}. Please switch to Avalanche C-Chain, Arbitrum, or Ethereum.`, 'warning');
                }
                
                // Update UI
                this.updateConnectionUI();
                
                // Notify callbacks
                this.notifyConnectionCallbacks({
                    connected: true,
                    address: this.address,
                    chainId: this.chainId,
                    networkName: this.networkName
                });
                
                return true;
            } else {
                this.connectionStatus = 'error';
                this.errorMessage = 'No accounts found';
                this.updateConnectionUI();
                
                this.showNotification('No accounts found. Please unlock your wallet and try again.', 'error');
                return false;
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            
            this.connectionStatus = 'error';
            this.errorMessage = error.message || 'Error connecting wallet';
            this.updateConnectionUI();
            
            this.showNotification(`Error connecting wallet: ${error.message || 'Unknown error'}`, 'error');
            return false;
        }
    }
    
    /**
     * Disconnect wallet
     */
    async disconnect() {
        // Note: MetaMask doesn't support programmatic disconnect
        // We can only clear our local state
        
        this.handleDisconnect();
        this.showNotification('Wallet disconnected', 'info');
        
        return true;
    }
    
    /**
     * Handle wallet disconnect
     */
    handleDisconnect() {
        this.isConnected = false;
        this.address = null;
        this.chainId = null;
        this.networkName = null;
        this.balance = null;
        this.connectionStatus = 'disconnected';
        this.errorMessage = null;
        
        // Update UI
        this.updateConnectionUI();
        
        // Notify callbacks
        this.notifyConnectionCallbacks({
            connected: false
        });
    }
    
    /**
     * Switch network
     * @param {number} chainId - Chain ID to switch to
     */
    async switchNetwork(chainId) {
        if (!this.isConnected || !this.provider) {
            this.showNotification('Please connect your wallet first', 'error');
            return false;
        }
        
        // Check if chain ID is supported
        if (!this.supportedNetworks[chainId]) {
            this.showNotification(`Network with chain ID ${chainId} is not supported`, 'error');
            return false;
        }
        
        try {
            // Try to switch to the network
            await this.provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x' + chainId.toString(16) }]
            });
            
            // Update preferred chain ID
            this.preferredChainId = chainId;
            
            return true;
        } catch (error) {
            // If the network is not added to MetaMask, add it
            if (error.code === 4902) {
                try {
                    const network = this.supportedNetworks[chainId];
                    
                    await this.provider.request({
                        method: 'wallet_addEthereumChain',
                        params: [{
                            chainId: '0x' + chainId.toString(16),
                            chainName: network.name,
                            nativeCurrency: {
                                name: network.currency,
                                symbol: network.currency,
                                decimals: 18
                            },
                            rpcUrls: [network.rpcUrl],
                            blockExplorerUrls: [network.explorerUrl]
                        }]
                    });
                    
                    // Update preferred chain ID
                    this.preferredChainId = chainId;
                    
                    return true;
                } catch (addError) {
                    console.error('Error adding network:', addError);
                    this.showNotification(`Error adding network: ${addError.message || 'Unknown error'}`, 'error');
                    return false;
                }
            } else {
                console.error('Error switching network:', error);
                this.showNotification(`Error switching network: ${error.message || 'Unknown error'}`, 'error');
                return false;
            }
        }
    }
    
    /**
     * Update wallet balance
     */
    async updateBalance() {
        if (!this.isConnected || !this.address || !this.provider) return;
        
        try {
            // Get balance
            const balance = await this.provider.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });
            
            // Convert from wei to ether
            this.balance = parseInt(balance, 16) / 1e18;
            
            // Update UI
            this.updateBalanceUI();
            
            return this.balance;
        } catch (error) {
            console.error('Error updating balance:', error);
            return null;
        }
    }
    
    /**
     * Get network name from chain ID
     * @param {number} chainId - Chain ID
     */
    getNetworkName(chainId) {
        return this.supportedNetworks[chainId]?.name || `Unknown (${chainId})`;
    }
    
    /**
     * Update connection UI
     */
    updateConnectionUI() {
        // Update wallet status display
        const statusElement = document.getElementById('wallet-status');
        const addressElement = document.getElementById('wallet-address');
        const networkElement = document.getElementById('wallet-network');
        const connectButton = document.getElementById('connect-wallet-btn');
        const disconnectButton = document.getElementById('disconnect-wallet-btn');
        const installButton = document.getElementById('install-metamask-btn');
        
        if (statusElement) {
            statusElement.className = 'status-indicator';
            
            switch (this.connectionStatus) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    statusElement.classList.add('status-connected');
                    break;
                    
                case 'connecting':
                    statusElement.textContent = 'Connecting...';
                    statusElement.classList.add('status-connecting');
                    break;
                    
                case 'error':
                    statusElement.textContent = 'Error';
                    statusElement.classList.add('status-error');
                    break;
                    
                case 'disconnected':
                default:
                    statusElement.textContent = 'Disconnected';
                    statusElement.classList.add('status-disconnected');
                    break;
            }
        }
        
        if (addressElement) {
            if (this.address) {
                // Format address as 0x1234...5678
                const formattedAddress = this.address.substring(0, 6) + '...' + this.address.substring(this.address.length - 4);
                addressElement.textContent = formattedAddress;
                addressElement.title = this.address;
            } else {
                addressElement.textContent = 'Not connected';
                addressElement.title = '';
            }
        }
        
        if (networkElement) {
            networkElement.textContent = this.networkName || 'Not connected';
        }
        
        // Update buttons
        if (connectButton) {
            connectButton.style.display = this.isConnected ? 'none' : 'inline-block';
        }
        
        if (disconnectButton) {
            disconnectButton.style.display = this.isConnected ? 'inline-block' : 'none';
        }
        
        if (installButton) {
            installButton.style.display = window.ethereum ? 'none' : 'inline-block';
        }
        
        // Update network selector if it exists
        const networkSelector = document.getElementById('network-selector');
        if (networkSelector && this.isConnected) {
            // Set the value to the current chain ID
            const options = networkSelector.options;
            for (let i = 0; i < options.length; i++) {
                if (parseInt(options[i].value) === this.chainId) {
                    networkSelector.selectedIndex = i;
                    break;
                }
            }
        }
    }
    
    /**
     * Update balance UI
     */
    updateBalanceUI() {
        const balanceElement = document.getElementById('wallet-balance');
        
        if (balanceElement && this.balance !== null) {
            const currency = this.supportedNetworks[this.chainId]?.currency || 'ETH';
            balanceElement.textContent = `${this.balance.toFixed(4)} ${currency}`;
        }
    }
    
    /**
     * Register connection callback
     * @param {Function} callback - Callback function
     */
    onConnectionChange(callback) {
        if (typeof callback === 'function') {
            this.connectionCallbacks.push(callback);
        }
    }
    
    /**
     * Notify connection callbacks
     * @param {Object} data - Connection data
     */
    notifyConnectionCallbacks(data) {
        this.connectionCallbacks.forEach(callback => {
            callback(data);
        });
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
        }
    }
    
    /**
     * Get connection status
     */
    getConnectionStatus() {
        return {
            isConnected: this.isConnected,
            address: this.address,
            chainId: this.chainId,
            networkName: this.networkName,
            balance: this.balance,
            status: this.connectionStatus,
            errorMessage: this.errorMessage
        };
    }
    
    /**
     * Get signer for transactions
     */
    getSigner() {
        if (!this.isConnected || !this.provider) return null;
        
        // Create ethers.js provider and signer
        if (!this.signer && window.ethers) {
            const ethersProvider = new window.ethers.providers.Web3Provider(this.provider);
            this.signer = ethersProvider.getSigner();
        }
        
        return this.signer;
    }
    
    /**
     * Sign message
     * @param {string} message - Message to sign
     */
    async signMessage(message) {
        if (!this.isConnected || !this.provider) {
            this.showNotification('Please connect your wallet first', 'error');
            return null;
        }
        
        try {
            // Get signer
            const signer = this.getSigner();
            
            if (!signer) {
                this.showNotification('Signer not available', 'error');
                return null;
            }
            
            // Sign message
            const signature = await signer.signMessage(message);
            
            return {
                success: true,
                signature: signature,
                message: message
            };
        } catch (error) {
            console.error('Error signing message:', error);
            this.showNotification(`Error signing message: ${error.message || 'Unknown error'}`, 'error');
            
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
    
    /**
     * Sign transaction for Antarctic Exchange
     * @param {Object} transaction - Transaction data
     */
    async signAntarcticTransaction(transaction) {
        if (!this.isConnected || !this.provider) {
            this.showNotification('Please connect your wallet first', 'error');
            return null;
        }
        
        try {
            // Get signer
            const signer = this.getSigner();
            
            if (!signer) {
                this.showNotification('Signer not available', 'error');
                return null;
            }
            
            // Create signature for Antarctic Exchange
            // This is a simplified example - actual implementation would depend on Antarctic Exchange's API
            const message = JSON.stringify({
                action: transaction.action,
                symbol: transaction.symbol,
                amount: transaction.amount,
                price: transaction.price,
                leverage: transaction.leverage,
                timestamp: Date.now()
            });
            
            // Sign message
            const signature = await signer.signMessage(message);
            
            return {
                success: true,
                signature: signature,
                message: message,
                transaction: transaction
            };
        } catch (error) {
            console.error('Error signing Antarctic transaction:', error);
            this.showNotification(`Error signing transaction: ${error.message || 'Unknown error'}`, 'error');
            
            return {
                success: false,
                error: error.message || 'Unknown error'
            };
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.walletConnection = new EnhancedWalletConnection();
    
    // Initialize
    window.walletConnection.initialize()
        .then(result => {
            console.log('Wallet connection initialized:', result);
            
            // Add event listeners for UI elements
            const connectButton = document.getElementById('connect-wallet-btn');
            if (connectButton) {
                connectButton.addEventListener('click', () => {
                    window.walletConnection.connect();
                });
            }
            
            const disconnectButton = document.getElementById('disconnect-wallet-btn');
            if (disconnectButton) {
                disconnectButton.addEventListener('click', () => {
                    window.walletConnection.disconnect();
                });
            }
            
            const installButton = document.getElementById('install-metamask-btn');
            if (installButton) {
                installButton.addEventListener('click', () => {
                    window.open('https://metamask.io/download.html', '_blank');
                });
            }
            
            const networkSelector = document.getElementById('network-selector');
            if (networkSelector) {
                networkSelector.addEventListener('change', () => {
                    const chainId = parseInt(networkSelector.value);
                    window.walletConnection.switchNetwork(chainId);
                });
            }
        })
        .catch(error => {
            console.error('Error initializing wallet connection:', error);
        });
});
