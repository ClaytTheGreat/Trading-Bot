/**
 * Enhanced Wallet Connection Module
 * Provides reliable wallet connection for MetaMask across Arbitrum, Avalanche C-Chain, and Ethereum networks
 */

class WalletConnection {
    constructor() {
        this.isConnected = false;
        this.address = null;
        this.network = null;
        this.balance = 0;
        this.provider = null;
        this.signer = null;
        this.chainId = null;
        this.supportedNetworks = {
            arbitrum: {
                chainId: '0xa4b1',
                chainName: 'Arbitrum One',
                nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io/']
            },
            avalanche: {
                chainId: '0xa86a',
                chainName: 'Avalanche C-Chain',
                nativeCurrency: {
                    name: 'Avalanche',
                    symbol: 'AVAX',
                    decimals: 18
                },
                rpcUrls: ['https://api.avax.network/ext/bc/C/rpc'],
                blockExplorerUrls: ['https://snowtrace.io/']
            },
            ethereum: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/'],
                blockExplorerUrls: ['https://etherscan.io/']
            }
        };
    }

    /**
     * Initialize wallet connection
     */
    async initialize() {
        console.log('Initializing wallet connection...');
        this.addToSystemLog('Initializing wallet connection...');
        
        // Check if MetaMask is installed
        if (this.isMetaMaskInstalled()) {
            console.log('MetaMask is installed');
            this.addToSystemLog('MetaMask detected');
            
            // Update UI
            this.updateConnectionUI(false);
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Check if already connected
            if (window.ethereum && window.ethereum.selectedAddress) {
                console.log('Already connected to wallet');
                this.addToSystemLog('Existing wallet connection detected');
                await this.connectWallet();
            }
        } else {
            console.log('MetaMask is not installed');
            this.addToSystemLog('MetaMask not detected');
            this.updateConnectionUI(false, true);
        }
    }

    /**
     * Check if MetaMask is installed
     */
    isMetaMaskInstalled() {
        return window.ethereum && window.ethereum.isMetaMask;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Connect MetaMask button
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            connectMetaMaskBtn.addEventListener('click', async () => {
                await this.connectWallet();
            });
        }
        
        // Connect wallet button in header
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', async () => {
                await this.connectWallet();
            });
        }
        
        // Network selector
        const networkSelect = document.getElementById('network-select');
        if (networkSelect) {
            networkSelect.addEventListener('change', async () => {
                const network = networkSelect.value;
                await this.switchNetwork(network);
            });
        }
        
        // Listen for account changes
        if (window.ethereum) {
            window.ethereum.on('accountsChanged', async (accounts) => {
                console.log('Account changed:', accounts);
                this.addToSystemLog('MetaMask account changed');
                
                if (accounts.length === 0) {
                    // User disconnected
                    this.handleDisconnect();
                } else {
                    // User switched accounts
                    await this.connectWallet();
                }
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', async (chainId) => {
                console.log('Chain changed:', chainId);
                this.addToSystemLog(`Network changed to chain ID: ${chainId}`);
                
                // Refresh connection
                await this.connectWallet();
            });
        }
    }

    /**
     * Connect wallet
     */
    async connectWallet() {
        try {
            console.log('Connecting wallet...');
            this.addToSystemLog('Connecting to MetaMask...');
            
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }
            
            // Request accounts with explicit permissions
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length === 0) {
                throw new Error('No accounts found');
            }
            
            // Get address
            this.address = accounts[0];
            console.log('Connected address:', this.address);
            this.addToSystemLog(`Connected to address: ${this.shortenAddress(this.address)}`);
            
            // Get chain ID
            this.chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            
            // Get network name
            this.network = this.getNetworkName(this.chainId);
            console.log('Network:', this.network);
            this.addToSystemLog(`Network: ${this.network}`);
            
            // Get balance
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.address, 'latest']
            });
            
            this.balance = parseInt(balance, 16) / 1e18;
            console.log('Balance:', this.balance);
            this.addToSystemLog(`Balance: ${this.balance.toFixed(4)} ${this.getNetworkCurrency()}`);
            
            // Update connection status
            this.isConnected = true;
            
            // Update UI
            this.updateConnectionUI(true);
            
            // Update network selector
            this.updateNetworkSelector();
            
            // Dispatch connection event
            this.dispatchConnectionEvent();
            
            return true;
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.addToSystemLog(`Error connecting wallet: ${error.message}`);
            
            // Show error notification
            this.showNotification('Error connecting wallet: ' + error.message, 'danger');
            
            // Update UI
            this.updateConnectionUI(false);
            
            return false;
        }
    }

    /**
     * Handle disconnect
     */
    handleDisconnect() {
        console.log('Wallet disconnected');
        this.addToSystemLog('Wallet disconnected');
        
        // Reset connection state
        this.isConnected = false;
        this.address = null;
        this.network = null;
        this.balance = 0;
        this.provider = null;
        this.signer = null;
        
        // Update UI
        this.updateConnectionUI(false);
        
        // Dispatch disconnection event
        this.dispatchDisconnectionEvent();
    }

    /**
     * Switch network
     */
    async switchNetwork(networkName) {
        try {
            console.log('Switching network to:', networkName);
            this.addToSystemLog(`Switching network to ${networkName}...`);
            
            if (!this.isConnected) {
                await this.connectWallet();
            }
            
            if (!window.ethereum) {
                throw new Error('MetaMask not installed');
            }
            
            const networkConfig = this.supportedNetworks[networkName];
            if (!networkConfig) {
                throw new Error('Unsupported network');
            }
            
            try {
                // Try to switch to the network
                await window.ethereum.request({
                    method: 'wallet_switchEthereumChain',
                    params: [{ chainId: networkConfig.chainId }]
                });
            } catch (switchError) {
                // This error code indicates that the chain has not been added to MetaMask
                if (switchError.code === 4902) {
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [networkConfig]
                    });
                } else {
                    throw switchError;
                }
            }
            
            // Update network selector
            this.updateNetworkSelector();
            
            // Show success notification
            this.showNotification(`Switched to ${networkConfig.chainName}`, 'success');
            
            return true;
        } catch (error) {
            console.error('Error switching network:', error);
            this.addToSystemLog(`Error switching network: ${error.message}`);
            
            // Show error notification
            this.showNotification('Error switching network: ' + error.message, 'danger');
            
            return false;
        }
    }

    /**
     * Update connection UI
     */
    updateConnectionUI(isConnected, isNotInstalled = false) {
        // Status indicator
        const statusIndicator = document.getElementById('status-indicator');
        const connectionStatus = document.getElementById('connection-status');
        
        if (statusIndicator && connectionStatus) {
            if (isConnected) {
                statusIndicator.classList.remove('disconnected');
                statusIndicator.classList.add('connected');
                connectionStatus.textContent = 'Connected';
            } else {
                statusIndicator.classList.remove('connected');
                statusIndicator.classList.add('disconnected');
                connectionStatus.textContent = isNotInstalled ? 'MetaMask Not Installed' : 'Disconnected';
            }
        }
        
        // Connect MetaMask button
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            if (isConnected) {
                connectMetaMaskBtn.textContent = 'Connected';
                connectMetaMaskBtn.disabled = true;
            } else {
                connectMetaMaskBtn.textContent = isNotInstalled ? 'MetaMask Not Installed' : 'Connect MetaMask';
                connectMetaMaskBtn.disabled = isNotInstalled;
            }
        }
        
        // Connect wallet button in header
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            if (isConnected) {
                connectWalletBtn.textContent = 'Connected';
                connectWalletBtn.disabled = true;
            } else {
                connectWalletBtn.textContent = 'Connect Wallet';
                connectWalletBtn.disabled = isNotInstalled;
            }
        }
        
        // Wallet details
        const walletDetails = document.getElementById('wallet-details');
        if (walletDetails) {
            walletDetails.style.display = isConnected ? 'block' : 'none';
        }
        
        // Wallet address
        const walletAddress = document.getElementById('wallet-address');
        if (walletAddress && this.address) {
            walletAddress.textContent = this.shortenAddress(this.address);
        }
        
        // Wallet network
        const walletNetwork = document.getElementById('wallet-network');
        if (walletNetwork && this.network) {
            walletNetwork.textContent = this.network;
        }
        
        // Wallet balance
        const walletBalance = document.getElementById('wallet-balance');
        if (walletBalance) {
            walletBalance.textContent = `${this.balance.toFixed(4)} ${this.getNetworkCurrency()}`;
        }
    }

    /**
     * Update network selector
     */
    updateNetworkSelector() {
        const networkSelect = document.getElementById('network-select');
        if (networkSelect && this.network) {
            networkSelect.value = this.network.toLowerCase();
        }
    }

    /**
     * Get network name from chain ID
     */
    getNetworkName(chainId) {
        const networks = {
            '0x1': 'Ethereum',
            '0xa86a': 'Avalanche',
            '0xa4b1': 'Arbitrum'
        };
        
        return networks[chainId] || 'Unknown';
    }

    /**
     * Get network currency
     */
    getNetworkCurrency() {
        const currencies = {
            'Ethereum': 'ETH',
            'Avalanche': 'AVAX',
            'Arbitrum': 'ETH'
        };
        
        return currencies[this.network] || 'ETH';
    }

    /**
     * Shorten address
     */
    shortenAddress(address) {
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    /**
     * Dispatch connection event
     */
    dispatchConnectionEvent() {
        const event = new CustomEvent('walletConnected', {
            detail: {
                address: this.address,
                network: this.network,
                balance: this.balance,
                chainId: this.chainId
            }
        });
        
        document.dispatchEvent(event);
    }

    /**
     * Dispatch disconnection event
     */
    dispatchDisconnectionEvent() {
        const event = new CustomEvent('walletDisconnected');
        document.dispatchEvent(event);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            notification.classList.add('fade-out');
            
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
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
}

// Initialize wallet connection when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize wallet connection
    window.walletConnection = new WalletConnection();
    window.walletConnection.initialize();
});
