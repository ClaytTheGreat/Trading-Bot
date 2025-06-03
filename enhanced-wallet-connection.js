/**
 * Enhanced Wallet Connection for GitHub Pages
 * 
 * This script provides robust wallet detection and connection functionality
 * specifically optimized for GitHub Pages deployment with improved detection
 * and UI synchronization.
 */

// Create global wallet connection object
window.walletConnectionSync = {
    isConnected: false,
    walletAddress: null,
    walletNetwork: null,
    walletBalance: null,
    detectionInterval: null,
    
    // Initialize wallet connection
    init: function() {
        console.log('Initializing enhanced wallet connection module...');
        this.detectWallet();
        this.setupEventListeners();
        
        // Set up continuous wallet detection to handle delayed injection
        this.setupContinuousDetection();
    },
    
    // Set up continuous wallet detection
    setupContinuousDetection: function() {
        console.log('Setting up continuous wallet detection...');
        
        // Clear any existing interval
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        // Check for wallet every 2 seconds until detected
        this.detectionInterval = setInterval(() => {
            // If wallet is already detected and connected, clear interval
            if (window.ethereum && this.isConnected) {
                clearInterval(this.detectionInterval);
                return;
            }
            
            // Check if wallet is now available (handles delayed injection)
            if (window.ethereum && !this.walletDetected) {
                console.log('Wallet detected during continuous check');
                this.walletDetected = true;
                this.updateWalletUI('detected');
                this.checkConnection();
                
                // If wallet is detected but not connected, keep interval for connection changes
                if (!this.isConnected) {
                    console.log('Wallet detected but not connected, continuing checks');
                } else {
                    clearInterval(this.detectionInterval);
                }
            }
        }, 2000);
    },
    
    // Detect if wallet is installed
    detectWallet: function() {
        console.log('Detecting wallet...');
        
        // Check for MetaMask or other EIP-1193 providers
        if (window.ethereum) {
            console.log('Ethereum provider detected');
            
            // Check specifically for MetaMask
            if (window.ethereum.isMetaMask) {
                console.log('MetaMask detected');
            } else {
                console.log('Non-MetaMask Ethereum provider detected');
            }
            
            this.walletDetected = true;
            this.updateWalletUI('detected');
            this.checkConnection();
        } else {
            console.log('No Ethereum provider detected');
            this.walletDetected = false;
            this.updateWalletUI('not-detected');
            
            // Check if running on mobile and suggest mobile wallet options
            if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
                console.log('Mobile device detected, suggesting mobile wallet options');
                this.suggestMobileWallets();
            }
        }
    },
    
    // Suggest mobile wallet options
    suggestMobileWallets: function() {
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            connectMetaMaskBtn.textContent = 'Get Mobile Wallet';
            connectMetaMaskBtn.onclick = function() {
                // Show notification with mobile wallet options
                if (window.showNotification) {
                    window.showNotification('For mobile: Try MetaMask Mobile, Trust Wallet, or Coinbase Wallet', 'info');
                }
                
                // Open MetaMask mobile page
                window.open('https://metamask.io/download/', '_blank');
            };
        }
    },
    
    // Setup event listeners for wallet
    setupEventListeners: function() {
        console.log('Setting up wallet event listeners...');
        
        // Connect wallet button
        const connectWalletBtn = document.getElementById('connect-wallet');
        if (connectWalletBtn) {
            connectWalletBtn.addEventListener('click', () => this.connectWallet());
        }
        
        // Connect MetaMask button
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        if (connectMetaMaskBtn) {
            connectMetaMaskBtn.addEventListener('click', () => this.connectWallet());
        }
        
        // Listen for account changes if ethereum provider exists
        if (window.ethereum) {
            // Listen for account changes
            window.ethereum.on('accountsChanged', (accounts) => {
                console.log('Accounts changed:', accounts);
                if (accounts.length > 0) {
                    this.handleAccountChange(accounts[0]);
                } else {
                    this.handleDisconnect();
                }
            });
            
            // Listen for chain changes
            window.ethereum.on('chainChanged', (chainId) => {
                console.log('Chain changed:', chainId);
                this.handleChainChange(chainId);
            });
            
            // Listen for connect events
            window.ethereum.on('connect', (connectInfo) => {
                console.log('Connected to wallet:', connectInfo);
            });
            
            // Listen for disconnect events
            window.ethereum.on('disconnect', (error) => {
                console.log('Disconnected from wallet:', error);
                this.handleDisconnect();
            });
        }
    },
    
    // Check if already connected
    checkConnection: async function() {
        console.log('Checking existing connection...');
        
        if (!window.ethereum) return;
        
        try {
            // Request accounts without prompting user
            const accounts = await window.ethereum.request({
                method: 'eth_accounts'
            });
            
            if (accounts.length > 0) {
                console.log('Already connected to account:', accounts[0]);
                this.handleAccountChange(accounts[0]);
            } else {
                console.log('No connected accounts found');
            }
        } catch (error) {
            console.error('Error checking connection:', error);
        }
    },
    
    // Connect wallet
    connectWallet: async function() {
        console.log('Connecting wallet...');
        
        if (!window.ethereum) {
            if (window.showNotification) {
                window.showNotification('Please install MetaMask to connect your wallet', 'error');
            }
            return;
        }
        
        try {
            // Show loading state
            this.updateWalletUI('connecting');
            
            // Request accounts
            const accounts = await window.ethereum.request({
                method: 'eth_requestAccounts'
            });
            
            if (accounts.length > 0) {
                console.log('Connected to account:', accounts[0]);
                this.handleAccountChange(accounts[0]);
            } else {
                console.log('No accounts returned');
                this.updateWalletUI('error');
                
                if (window.showNotification) {
                    window.showNotification('Failed to connect wallet', 'error');
                }
            }
        } catch (error) {
            console.error('Error connecting wallet:', error);
            this.updateWalletUI('error');
            
            // Handle user rejected request
            if (error.code === 4001) {
                if (window.showNotification) {
                    window.showNotification('You rejected the connection request', 'warning');
                }
            } else {
                if (window.showNotification) {
                    window.showNotification('Error connecting wallet: ' + error.message, 'error');
                }
            }
        }
    },
    
    // Handle account change
    handleAccountChange: async function(account) {
        console.log('Handling account change:', account);
        
        this.walletAddress = account;
        this.isConnected = true;
        
        // Update UI
        this.updateWalletUI('connected');
        
        // Get network
        await this.getNetwork();
        
        // Get balance
        await this.getBalance();
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('Wallet connected successfully', 'success');
        }
    },
    
    // Handle chain change
    handleChainChange: async function(chainId) {
        console.log('Handling chain change:', chainId);
        
        // Update network
        await this.getNetwork();
        
        // Update balance
        await this.getBalance();
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('Network changed to ' + this.walletNetwork, 'info');
        }
    },
    
    // Handle disconnect
    handleDisconnect: function() {
        console.log('Handling disconnect');
        
        this.isConnected = false;
        this.walletAddress = null;
        this.walletNetwork = null;
        this.walletBalance = null;
        
        // Update UI
        this.updateWalletUI('disconnected');
        
        // Show notification
        if (window.showNotification) {
            window.showNotification('Wallet disconnected', 'info');
        }
    },
    
    // Get current network
    getNetwork: async function() {
        console.log('Getting network...');
        
        if (!window.ethereum || !this.isConnected) return;
        
        try {
            const chainId = await window.ethereum.request({
                method: 'eth_chainId'
            });
            
            // Convert chain ID to network name
            switch (chainId) {
                case '0x1':
                    this.walletNetwork = 'Ethereum';
                    break;
                case '0xa4b1':
                    this.walletNetwork = 'Arbitrum';
                    break;
                case '0xa86a':
                    this.walletNetwork = 'Avalanche C-Chain';
                    break;
                default:
                    this.walletNetwork = 'Unknown (' + chainId + ')';
            }
            
            console.log('Current network:', this.walletNetwork);
            
            // Update network in UI
            const walletNetworkElement = document.getElementById('wallet-network');
            if (walletNetworkElement) {
                walletNetworkElement.textContent = this.walletNetwork;
            }
            
            // Update network selector
            const networkSelect = document.getElementById('network-select');
            if (networkSelect) {
                switch (chainId) {
                    case '0x1':
                        networkSelect.value = 'ethereum';
                        break;
                    case '0xa4b1':
                        networkSelect.value = 'arbitrum';
                        break;
                    case '0xa86a':
                        networkSelect.value = 'avalanche';
                        break;
                }
            }
        } catch (error) {
            console.error('Error getting network:', error);
        }
    },
    
    // Get wallet balance
    getBalance: async function() {
        console.log('Getting balance...');
        
        if (!window.ethereum || !this.isConnected || !this.walletAddress) return;
        
        try {
            const balance = await window.ethereum.request({
                method: 'eth_getBalance',
                params: [this.walletAddress, 'latest']
            });
            
            // Convert from wei to ETH
            const ethBalance = parseInt(balance, 16) / 1e18;
            this.walletBalance = ethBalance.toFixed(3) + ' ETH';
            
            console.log('Current balance:', this.walletBalance);
            
            // Update balance in UI
            const walletBalanceElement = document.getElementById('wallet-balance');
            if (walletBalanceElement) {
                walletBalanceElement.textContent = this.walletBalance;
            }
        } catch (error) {
            console.error('Error getting balance:', error);
        }
    },
    
    // Update wallet UI based on state
    updateWalletUI: function(state) {
        console.log('Updating wallet UI:', state);
        
        // Get UI elements
        const statusIndicator = document.getElementById('status-indicator');
        const connectionStatus = document.getElementById('connection-status');
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        const connectWalletBtn = document.getElementById('connect-wallet');
        const walletDetails = document.getElementById('wallet-details');
        
        // Update based on state
        switch (state) {
            case 'detected':
                // MetaMask is detected but not connected
                if (statusIndicator) statusIndicator.className = 'status-indicator disconnected';
                if (connectionStatus) connectionStatus.textContent = 'Disconnected';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Connect MetaMask';
                    connectMetaMaskBtn.className = 'btn btn-primary';
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Connect Wallet';
                    connectWalletBtn.className = 'btn btn-primary';
                }
                if (walletDetails) walletDetails.style.display = 'none';
                break;
                
            case 'not-detected':
                // MetaMask is not detected
                if (statusIndicator) statusIndicator.className = 'status-indicator disconnected';
                if (connectionStatus) connectionStatus.textContent = 'Disconnected';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Install MetaMask';
                    connectMetaMaskBtn.className = 'btn btn-secondary';
                    connectMetaMaskBtn.onclick = function() {
                        window.open('https://metamask.io/download/', '_blank');
                    };
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Install MetaMask';
                    connectWalletBtn.className = 'btn btn-secondary';
                    connectWalletBtn.onclick = function() {
                        window.open('https://metamask.io/download/', '_blank');
                    };
                }
                if (walletDetails) walletDetails.style.display = 'none';
                break;
                
            case 'connecting':
                // Connecting to MetaMask
                if (statusIndicator) statusIndicator.className = 'status-indicator disconnected';
                if (connectionStatus) connectionStatus.textContent = 'Connecting...';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Connecting...';
                    connectMetaMaskBtn.disabled = true;
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Connecting...';
                    connectWalletBtn.disabled = true;
                }
                if (walletDetails) walletDetails.style.display = 'none';
                break;
                
            case 'connected':
                // Connected to MetaMask
                if (statusIndicator) statusIndicator.className = 'status-indicator connected';
                if (connectionStatus) connectionStatus.textContent = 'Connected';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Connected';
                    connectMetaMaskBtn.className = 'btn connected';
                    connectMetaMaskBtn.disabled = false;
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Connected';
                    connectWalletBtn.className = 'btn connected';
                    connectWalletBtn.disabled = false;
                }
                if (walletDetails) walletDetails.style.display = 'block';
                
                // Update wallet address
                const walletAddressElement = document.getElementById('wallet-address');
                if (walletAddressElement && this.walletAddress) {
                    const shortAddress = this.walletAddress.substring(0, 6) + '...' + this.walletAddress.substring(this.walletAddress.length - 4);
                    walletAddressElement.textContent = shortAddress;
                }
                break;
                
            case 'disconnected':
                // Disconnected from MetaMask
                if (statusIndicator) statusIndicator.className = 'status-indicator disconnected';
                if (connectionStatus) connectionStatus.textContent = 'Disconnected';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Connect MetaMask';
                    connectMetaMaskBtn.className = 'btn btn-primary';
                    connectMetaMaskBtn.disabled = false;
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Connect Wallet';
                    connectWalletBtn.className = 'btn btn-primary';
                    connectWalletBtn.disabled = false;
                }
                if (walletDetails) walletDetails.style.display = 'none';
                break;
                
            case 'error':
                // Error connecting to MetaMask
                if (statusIndicator) statusIndicator.className = 'status-indicator disconnected';
                if (connectionStatus) connectionStatus.textContent = 'Connection Error';
                if (connectMetaMaskBtn) {
                    connectMetaMaskBtn.textContent = 'Retry Connection';
                    connectMetaMaskBtn.className = 'btn btn-danger';
                    connectMetaMaskBtn.disabled = false;
                }
                if (connectWalletBtn) {
                    connectWalletBtn.textContent = 'Retry Connection';
                    connectWalletBtn.className = 'btn btn-danger';
                    connectWalletBtn.disabled = false;
                }
                if (walletDetails) walletDetails.style.display = 'none';
                break;
        }
    }
};

// Initialize wallet connection when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing wallet connection...');
    
    // Initialize with a slight delay to ensure all elements are loaded
    setTimeout(() => {
        window.walletConnectionSync.init();
    }, 500);
});
