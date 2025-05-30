/**
 * AI Debugging Agent for MetaMask Connectivity
 * 
 * This module implements an AI-powered debugging agent that automatically
 * detects and fixes MetaMask connectivity issues across Ethereum, Arbitrum,
 * and Avalanche networks.
 */

class AIMetaMaskDebugger {
    constructor() {
        this.isMetaMaskInstalled = false;
        this.isMetaMaskConnected = false;
        this.currentAccount = null;
        this.currentChainId = null;
        this.connectionAttempts = 0;
        this.maxConnectionAttempts = 5;
        this.debugLog = [];
        this.errorPatterns = this.initializeErrorPatterns();
        this.recoveryStrategies = this.initializeRecoveryStrategies();
        this.networkConfigs = this.initializeNetworkConfigs();
        this.autoFixEnabled = true;
        this.monitoringInterval = null;
    }

    /**
     * Initialize the AI debugging agent
     */
    async initialize() {
        this.log('AI MetaMask Debugging Agent initializing...');
        
        // Set up event listeners for UI elements
        this.setupEventListeners();
        
        // Start connection monitoring
        this.startMonitoring();
        
        // Initial MetaMask detection with retry logic
        await this.detectMetaMaskWithRetry();
        
        this.log('AI MetaMask Debugging Agent initialized');
        this.updateDebugUI('AI MetaMask Debugging Agent initialized and monitoring connection');
    }

    /**
     * Set up event listeners for UI elements
     */
    setupEventListeners() {
        // Connect button
        const connectButton = document.getElementById('connect-wallet');
        if (connectButton) {
            connectButton.addEventListener('click', () => this.connectMetaMask());
        }
        
        // Debug check button
        const debugButton = document.getElementById('debug-check');
        if (debugButton) {
            debugButton.addEventListener('click', () => this.runDiagnostics());
        }
        
        // Network buttons
        const networkButtons = document.querySelectorAll('.network-btn');
        networkButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const network = button.getAttribute('data-network');
                await this.switchNetwork(network);
            });
        });
    }

    /**
     * Start monitoring MetaMask connection
     */
    startMonitoring() {
        this.log('Starting connection monitoring');
        
        // Clear any existing monitoring
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
        }
        
        // Set up monitoring interval
        this.monitoringInterval = setInterval(() => {
            this.checkConnectionStatus();
        }, 5000); // Check every 5 seconds
    }

    /**
     * Check current connection status
     */
    async checkConnectionStatus() {
        try {
            // Skip if MetaMask is not installed
            if (!window.ethereum || !window.ethereum.isMetaMask) {
                return;
            }
            
            // Check if accounts are available
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            const wasConnected = this.isMetaMaskConnected;
            this.isMetaMaskConnected = accounts && accounts.length > 0;
            
            // Update current account
            if (this.isMetaMaskConnected) {
                this.currentAccount = accounts[0];
            } else {
                this.currentAccount = null;
            }
            
            // Check for connection state changes
            if (wasConnected && !this.isMetaMaskConnected) {
                this.log('Connection lost, attempting to reconnect...');
                this.updateDebugUI('Connection lost, attempting to reconnect...');
                this.attemptReconnection();
            }
            
            // Update UI
            this.updateConnectionUI();
            
        } catch (error) {
            this.log(`Error checking connection status: ${error.message}`);
            this.updateDebugUI(`Error checking connection status: ${error.message}`);
        }
    }

    /**
     * Attempt to reconnect to MetaMask
     */
    async attemptReconnection() {
        if (this.connectionAttempts >= this.maxConnectionAttempts) {
            this.log('Maximum reconnection attempts reached');
            this.updateDebugUI('Maximum reconnection attempts reached. Please try connecting manually.');
            return;
        }
        
        this.connectionAttempts++;
        this.log(`Reconnection attempt ${this.connectionAttempts}/${this.maxConnectionAttempts}`);
        
        try {
            await this.connectMetaMask();
        } catch (error) {
            this.log(`Reconnection attempt failed: ${error.message}`);
            this.updateDebugUI(`Reconnection attempt failed: ${error.message}`);
            
            // Try again after a delay
            setTimeout(() => {
                this.attemptReconnection();
            }, 2000);
        }
    }

    /**
     * Detect MetaMask with retry logic
     */
    async detectMetaMaskWithRetry(retries = 3, delay = 1000) {
        for (let i = 0; i < retries; i++) {
            const detected = await this.detectMetaMask();
            if (detected) {
                return true;
            }
            
            this.log(`MetaMask detection attempt ${i+1}/${retries} failed, retrying in ${delay}ms...`);
            await this.sleep(delay);
            delay *= 1.5; // Exponential backoff
        }
        
        this.log('Failed to detect MetaMask after multiple attempts');
        this.updateDebugUI('Failed to detect MetaMask after multiple attempts. Please ensure MetaMask is installed and refresh the page.');
        return false;
    }

    /**
     * Detect if MetaMask is installed
     */
    async detectMetaMask() {
        try {
            this.log('Detecting MetaMask...');
            this.updateDebugUI('Detecting MetaMask...');
            
            // Check if ethereum object exists
            if (!window.ethereum) {
                this.log('window.ethereum not found');
                this.updateDebugUI('MetaMask not detected: window.ethereum not found');
                this.isMetaMaskInstalled = false;
                this.showMetaMaskNotInstalled();
                return false;
            }
            
            // Check if it's MetaMask
            if (!window.ethereum.isMetaMask) {
                this.log('window.ethereum exists but is not MetaMask');
                this.updateDebugUI('MetaMask not detected: window.ethereum exists but is not MetaMask');
                this.isMetaMaskInstalled = false;
                this.showMetaMaskNotInstalled();
                return false;
            }
            
            // MetaMask is installed
            this.log('MetaMask detected');
            this.updateDebugUI('✓ MetaMask detected');
            this.isMetaMaskInstalled = true;
            
            // Check if already connected
            await this.checkIfAlreadyConnected();
            
            // Set up MetaMask event listeners
            this.setupMetaMaskEventListeners();
            
            return true;
        } catch (error) {
            this.log(`Error detecting MetaMask: ${error.message}`);
            this.updateDebugUI(`Error detecting MetaMask: ${error.message}`);
            this.isMetaMaskInstalled = false;
            this.showMetaMaskNotInstalled();
            return false;
        }
    }

    /**
     * Check if MetaMask is already connected
     */
    async checkIfAlreadyConnected() {
        try {
            this.log('Checking if already connected to MetaMask...');
            this.updateDebugUI('Checking if already connected to MetaMask...');
            
            // Get accounts
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            
            if (accounts && accounts.length > 0) {
                this.log(`Already connected to account: ${this.formatAddress(accounts[0])}`);
                this.updateDebugUI(`✓ Already connected to account: ${this.formatAddress(accounts[0])}`);
                this.handleAccountsChanged(accounts);
                return true;
            } else {
                this.log('Not connected to any accounts');
                this.updateDebugUI('Not connected to any accounts');
                return false;
            }
        } catch (error) {
            this.log(`Error checking connection: ${error.message}`);
            this.updateDebugUI(`Error checking connection: ${error.message}`);
            return false;
        }
    }

    /**
     * Connect to MetaMask
     */
    async connectMetaMask() {
        try {
            this.log('Connecting to MetaMask...');
            this.updateDebugUI('Connecting to MetaMask...');
            this.showStatus('info', 'Connecting to MetaMask...');
            
            // Check if MetaMask is installed
            if (!this.isMetaMaskInstalled) {
                this.log('Cannot connect: MetaMask not installed');
                this.updateDebugUI('Cannot connect: MetaMask not installed');
                this.showStatus('error', 'MetaMask not installed');
                return false;
            }
            
            // Request account access
            const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            this.log(`Accounts received: ${accounts.length}`);
            this.updateDebugUI(`✓ Accounts received: ${accounts.length}`);
            
            if (accounts.length > 0) {
                // Handle accounts
                this.handleAccountsChanged(accounts);
                
                // Hide status message
                this.hideStatus();
                
                // Reset connection attempts
                this.connectionAttempts = 0;
                
                return true;
            } else {
                this.log('No accounts received');
                this.updateDebugUI('No accounts received');
                this.showStatus('error', 'No accounts received from MetaMask');
                return false;
            }
        } catch (error) {
            this.log(`Error connecting to MetaMask: ${error.message}`);
            this.updateDebugUI(`Error connecting to MetaMask: ${error.message}`);
            
            // Show error message
            this.showStatus('error', `Error connecting to MetaMask: ${error.message}`);
            
            // Try to auto-fix the error
            if (this.autoFixEnabled) {
                this.attemptAutoFix(error);
            }
            
            return false;
        }
    }

    /**
     * Handle accounts changed
     */
    handleAccountsChanged(accounts) {
        if (accounts.length === 0) {
            // User disconnected
            this.isMetaMaskConnected = false;
            this.currentAccount = null;
            
            this.log('Wallet disconnected');
            this.updateDebugUI('Wallet disconnected');
            
            // Update UI
            this.updateConnectionUI();
        } else {
            // Account connected or changed
            this.isMetaMaskConnected = true;
            this.currentAccount = accounts[0];
            
            // Get current chain ID
            this.getCurrentChainId();
            
            // Update UI
            this.updateConnectionUI();
            
            // Log
            if (accounts[0] !== this.currentAccount) {
                this.log(`Account changed: ${this.formatAddress(accounts[0])}`);
                this.updateDebugUI(`Account changed: ${this.formatAddress(accounts[0])}`);
            } else {
                this.log(`Wallet connected: ${this.formatAddress(accounts[0])}`);
                this.updateDebugUI(`Wallet connected: ${this.formatAddress(accounts[0])}`);
            }
        }
    }

    /**
     * Get current chain ID
     */
    async getCurrentChainId() {
        try {
            this.log('Getting chain ID...');
            this.updateDebugUI('Getting chain ID...');
            
            const chainId = await window.ethereum.request({ method: 'eth_chainId' });
            this.currentChainId = chainId;
            
            this.log(`Chain ID: ${chainId}`);
            this.updateDebugUI(`✓ Chain ID: ${chainId}`);
            
            // Update network display
            this.updateNetworkDisplay(chainId);
            
            return chainId;
        } catch (error) {
            this.log(`Error getting chain ID: ${error.message}`);
            this.updateDebugUI(`Error getting chain ID: ${error.message}`);
            return null;
        }
    }

    /**
     * Set up MetaMask event listeners
     */
    setupMetaMaskEventListeners() {
        if (typeof window.ethereum !== 'undefined') {
            // Remove any existing listeners to prevent duplicates
            window.ethereum.removeListener('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.removeListener('chainChanged', this.handleChainChanged.bind(this));
            window.ethereum.removeListener('disconnect', this.handleDisconnect.bind(this));
            
            // Add listeners
            window.ethereum.on('accountsChanged', this.handleAccountsChanged.bind(this));
            window.ethereum.on('chainChanged', this.handleChainChanged.bind(this));
            window.ethereum.on('disconnect', this.handleDisconnect.bind(this));
            
            this.log('MetaMask event listeners set up');
            this.updateDebugUI('✓ MetaMask event listeners set up');
        }
    }

    /**
     * Handle chain changed event
     */
    handleChainChanged(chainId) {
        this.log(`Chain changed: ${chainId}`);
        this.updateDebugUI(`Chain changed: ${chainId}`);
        
        // Update current chain ID
        this.currentChainId = chainId;
        
        // Update network display
        this.updateNetworkDisplay(chainId);
        
        // Add to system log
        this.addToSystemLog(`Network changed: ${this.getNetworkName(chainId)}`);
    }

    /**
     * Handle disconnect event
     */
    handleDisconnect(error) {
        // Update state
        this.isMetaMaskConnected = false;
        this.currentAccount = null;
        
        // Update UI
        this.updateConnectionUI();
        
        // Log
        this.log(`Wallet disconnected: ${error ? error.message : 'Unknown reason'}`);
        this.updateDebugUI(`Wallet disconnected: ${error ? error.message : 'Unknown reason'}`);
        this.addToSystemLog(`Wallet disconnected: ${error ? error.message : 'Unknown reason'}`);
    }

    /**
     * Switch network
     */
    async switchNetwork(network) {
        try {
            this.log(`Switching to ${network}...`);
            this.updateDebugUI(`Switching to ${network}...`);
            
            // Check if MetaMask is installed
            if (!this.isMetaMaskInstalled) {
                this.log('MetaMask not installed, cannot switch networks');
                this.updateDebugUI('MetaMask not installed, cannot switch networks');
                this.addToSystemLog('MetaMask not installed, cannot switch networks');
                return false;
            }
            
            // Check if connected
            if (!this.isMetaMaskConnected) {
                this.log('Wallet not connected, please connect first');
                this.updateDebugUI('Wallet not connected, please connect first');
                this.showStatus('warning', 'Please connect your wallet first before switching networks');
                
                setTimeout(() => {
                    this.hideStatus();
                }, 3000);
                
                return false;
            }
            
            // Try to switch to the selected network
            let success = false;
            
            if (network === 'ethereum') {
                success = await this.switchToEthereum();
            } else if (network === 'arbitrum') {
                success = await this.switchToArbitrum();
            } else if (network === 'avalanche') {
                success = await this.switchToAvalanche();
            }
            
            if (success) {
                this.log(`✓ Switched to ${network}`);
                this.updateDebugUI(`✓ Switched to ${network}`);
                
                // Update active button
                this.updateActiveNetworkButton(network);
                
                return true;
            } else {
                this.log(`Failed to switch to ${network}`);
                this.updateDebugUI(`Failed to switch to ${network}`);
                return false;
            }
        } catch (error) {
            this.log(`Error switching to ${network}: ${error.message}`);
            this.updateDebugUI(`Error switching to ${network}: ${error.message}`);
            this.addToSystemLog(`Error switching network: ${error.message}`);
            return false;
        }
    }

    /**
     * Switch to Ethereum Mainnet
     */
    async switchToEthereum() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x1' }],
            });
            return true;
        } catch (error) {
            this.log(`Error switching to Ethereum: ${error.message}`);
            this.updateDebugUI(`Error switching to Ethereum: ${error.message}`);
            this.addToSystemLog(`Error switching to Ethereum: ${error.message}`);
            return false;
        }
    }

    /**
     * Switch to Arbitrum
     */
    async switchToArbitrum() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xa4b1' }],
            });
            return true;
        } catch (error) {
            // This error code indicates that the chain has not been added to MetaMask
            if (error.code === 4902) {
                try {
                    this.log('Adding Arbitrum network...');
                    this.updateDebugUI('Adding Arbitrum network...');
                    
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [this.networkConfigs.arbitrum],
                    });
                    return true;
                } catch (addError) {
                    this.log(`Error adding Arbitrum network: ${addError.message}`);
                    this.updateDebugUI(`Error adding Arbitrum network: ${addError.message}`);
                    this.addToSystemLog(`Error adding Arbitrum network: ${addError.message}`);
                    return false;
                }
            }
            this.log(`Error switching to Arbitrum: ${error.message}`);
            this.updateDebugUI(`Error switching to Arbitrum: ${error.message}`);
            this.addToSystemLog(`Error switching to Arbitrum: ${error.message}`);
            return false;
        }
    }

    /**
     * Switch to Avalanche
     */
    async switchToAvalanche() {
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0xa86a' }],
            });
            return true;
        } catch (error) {
            // This error code indicates that the chain has not been added to MetaMask
            if (error.code === 4902) {
                try {
                    this.log('Adding Avalanche network...');
                    this.updateDebugUI('Adding Avalanche network...');
                    
                    await window.ethereum.request({
                        method: 'wallet_addEthereumChain',
                        params: [this.networkConfigs.avalanche],
                    });
                    return true;
                } catch (addError) {
                    this.log(`Error adding Avalanche network: ${addError.message}`);
                    this.updateDebugUI(`Error adding Avalanche network: ${addError.message}`);
                    this.addToSystemLog(`Error adding Avalanche network: ${addError.message}`);
                    return false;
                }
            }
            this.log(`Error switching to Avalanche: ${error.message}`);
            this.updateDebugUI(`Error switching to Avalanche: ${error.message}`);
            this.addToSystemLog(`Error switching to Avalanche: ${error.message}`);
            return false;
        }
    }

    /**
     * Update network display
     */
    updateNetworkDisplay(chainId) {
        let networkName = this.getNetworkName(chainId);
        const currentNetworkElement = document.getElementById('current-network');
        if (currentNetworkElement) {
            currentNetworkElement.textContent = networkName;
        }
        
        // Update active button
        this.updateActiveNetworkButton(this.getNetworkKey(chainId));
    }

    /**
     * Update active network button
     */
    updateActiveNetworkButton(network) {
        const networkButtons = document.querySelectorAll('.network-btn');
        networkButtons.forEach(btn => btn.classList.remove('active'));
        
        if (network) {
            const activeButton = document.querySelector(`[data-network="${network}"]`);
            if (activeButton) {
                activeButton.classList.add('active');
            }
        }
    }

    /**
     * Get network key from chain ID
     */
    getNetworkKey(chainId) {
        switch (chainId) {
            case '0x1':
                return 'ethereum';
            case '0xa4b1':
                return 'arbitrum';
            case '0xa86a':
                return 'avalanche';
            default:
                return null;
        }
    }

    /**
     * Get network name from chain ID
     */
    getNetworkName(chainId) {
        switch (chainId) {
            case '0x1':
                return 'Ethereum Mainnet';
            case '0xa4b1':
                return 'Arbitrum One';
            case '0xa86a':
                return 'Avalanche C-Chain';
            default:
                return `Unknown Network (${chainId})`;
        }
    }

    /**
     * Update connection UI
     */
    updateConnectionUI() {
        const walletStatus = document.getElementById('wallet-status');
        const walletAddress = document.getElementById('wallet-address');
        const connectButton = document.getElementById('connect-wallet');
        
        if (this.isMetaMaskConnected && this.currentAccount) {
            // Connected
            if (walletStatus) {
                walletStatus.textContent = 'Connected';
                walletStatus.className = 'status status-success';
            }
            
            if (walletAddress) {
                walletAddress.textContent = this.formatAddress(this.currentAccount);
            }
            
            if (connectButton) {
                connectButton.textContent = 'Wallet Connected';
            }
        } else {
            // Not connected
            if (walletStatus) {
                walletStatus.textContent = 'Not Connected';
                walletStatus.className = 'status status-danger';
            }
            
            if (walletAddress) {
                walletAddress.textContent = '-';
            }
            
            if (connectButton) {
                connectButton.textContent = 'Connect MetaMask';
            }
        }
    }

    /**
     * Show MetaMask not installed message
     */
    showMetaMaskNotInstalled() {
        const connectButton = document.getElementById('connect-wallet');
        
        // Update UI
        this.isMetaMaskInstalled = false;
        this.addToSystemLog('MetaMask not detected');
        
        // Show installation instructions
        this.showStatus('info', `
            <p><strong>MetaMask Not Detected</strong></p>
            <p>Please install MetaMask to use the wallet connection feature:</p>
            <ol>
                <li>Visit <a href="https://metamask.io/download/" target="_blank" style="color: white;">metamask.io/download</a></li>
                <li>Install the extension for your browser</li>
                <li>Create or import a wallet</li>
                <li>Refresh this page</li>
            </ol>
        `);
        
        // Disable connect button
        if (connectButton) {
            connectButton.disabled = true;
            connectButton.textContent = 'MetaMask Not Installed';
        }
    }

    /**
     * Show status message
     */
    showStatus(type, message) {
        const metamaskStatus = document.getElementById('metamask-status');
        if (metamaskStatus) {
            metamaskStatus.style.display = 'block';
            metamaskStatus.className = type;
            metamaskStatus.innerHTML = message;
        }
    }

    /**
     * Hide status message
     */
    hideStatus() {
        const metamaskStatus = document.getElementById('metamask-status');
        if (metamaskStatus) {
            metamaskStatus.style.display = 'none';
        }
    }

    /**
     * Run diagnostics
     */
    async runDiagnostics() {
        this.log('Running MetaMask diagnostics...');
        
        let diagnosticResults = 'MetaMask Diagnostics:\n';
        
        // Check if window.ethereum exists
        diagnosticResults += `window.ethereum exists: ${window.ethereum ? '✓' : '✗'}\n`;
        
        if (window.ethereum) {
            // Check if it's MetaMask
            diagnosticResults += `isMetaMask property: ${window.ethereum.isMetaMask ? '✓' : '✗'}\n`;
            diagnosticResults += `isMetaMaskInstalled (our var): ${this.isMetaMaskInstalled ? '✓' : '✗'}\n`;
            diagnosticResults += `isMetaMaskConnected (our var): ${this.isMetaMaskConnected ? '✓' : '✗'}\n`;
            diagnosticResults += `currentAccount: ${this.currentAccount || 'none'}\n`;
            diagnosticResults += `currentChainId: ${this.currentChainId || 'unknown'}\n`;
            
            // Try to get accounts
            try {
                const accounts = await window.ethereum.request({ method: 'eth_accounts' });
                diagnosticResults += `eth_accounts result: ${accounts.length > 0 ? accounts[0] : 'No accounts'}\n`;
            } catch (error) {
                diagnosticResults += `eth_accounts error: ${error.message}\n`;
            }
            
            // Check provider state
            diagnosticResults += `Provider state: ${window.ethereum.isConnected() ? 'Connected' : 'Disconnected'}\n`;
            
            // Check selected address
            diagnosticResults += `selectedAddress: ${window.ethereum.selectedAddress || 'none'}\n`;
            
            // Check if locked
            const isLocked = !(window.ethereum.selectedAddress);
            diagnosticResults += `Wallet locked: ${isLocked ? 'Yes' : 'No'}\n`;
            
            // Check permissions
            try {
                const permissions = await window.ethereum.request({ method: 'wallet_getPermissions' });
                diagnosticResults += `Permissions: ${permissions.length > 0 ? 'Granted' : 'None'}\n`;
            } catch (error) {
                diagnosticResults += `Permissions error: ${error.message}\n`;
            }
        }
        
        // Update debug UI
        this.updateDebugUI(diagnosticResults);
        
        // Add to system log
        this.addToSystemLog('MetaMask diagnostics completed');
        
        return diagnosticResults;
    }

    /**
     * Attempt to automatically fix common errors
     */
    async attemptAutoFix(error) {
        this.log(`Attempting to auto-fix error: ${error.message}`);
        this.updateDebugUI(`Attempting to auto-fix error: ${error.message}`);
        
        // Find matching error pattern
        for (const pattern of this.errorPatterns) {
            if (error.message.includes(pattern.match) || (error.code && error.code === pattern.code)) {
                this.log(`Found matching error pattern: ${pattern.name}`);
                this.updateDebugUI(`Found matching error pattern: ${pattern.name}`);
                
                // Get recovery strategy
                const strategy = this.recoveryStrategies[pattern.strategy];
                if (strategy) {
                    this.log(`Applying recovery strategy: ${pattern.strategy}`);
                    this.updateDebugUI(`Applying recovery strategy: ${pattern.strategy}`);
                    
                    // Execute recovery strategy
                    await strategy.call(this);
                    return;
                }
            }
        }
        
        this.log('No matching error pattern found for auto-fix');
        this.updateDebugUI('No matching error pattern found for auto-fix');
    }

    /**
     * Initialize error patterns
     */
    initializeErrorPatterns() {
        return [
            { name: 'User Rejected', match: 'User rejected', code: 4001, strategy: 'userRejected' },
            { name: 'Already Processing', match: 'Request of type', strategy: 'alreadyProcessing' },
            { name: 'Unauthorized', match: 'Unauthorized', strategy: 'unauthorized' },
            { name: 'Chain Not Added', code: 4902, strategy: 'chainNotAdded' },
            { name: 'Provider Not Found', match: 'provider not found', strategy: 'providerNotFound' },
            { name: 'Disconnected', match: 'disconnected', strategy: 'reconnect' },
            { name: 'Network Error', match: 'network error', strategy: 'networkError' },
            { name: 'Internal Error', match: 'internal error', strategy: 'internalError' },
            { name: 'Invalid Parameters', match: 'invalid parameters', strategy: 'invalidParameters' }
        ];
    }

    /**
     * Initialize recovery strategies
     */
    initializeRecoveryStrategies() {
        return {
            userRejected: async function() {
                this.showStatus('warning', 'Connection request was rejected. Please try again and approve the connection in MetaMask.');
                setTimeout(() => this.hideStatus(), 5000);
            },
            
            alreadyProcessing: async function() {
                this.showStatus('info', 'MetaMask is busy processing another request. Please wait a moment and try again.');
                setTimeout(() => this.hideStatus(), 5000);
                
                // Try again after a delay
                setTimeout(() => this.connectMetaMask(), 3000);
            },
            
            unauthorized: async function() {
                this.showStatus('warning', 'Unauthorized. Please unlock your MetaMask wallet and try again.');
                setTimeout(() => this.hideStatus(), 5000);
            },
            
            chainNotAdded: async function() {
                // This is handled in the network switching functions
                this.showStatus('info', 'Network not added to MetaMask. Adding it automatically...');
                setTimeout(() => this.hideStatus(), 3000);
            },
            
            providerNotFound: async function() {
                this.showStatus('error', 'MetaMask provider not found. Please refresh the page or reinstall MetaMask.');
                
                // Try to detect MetaMask again
                setTimeout(() => this.detectMetaMaskWithRetry(), 2000);
            },
            
            reconnect: async function() {
                this.showStatus('info', 'Connection lost. Attempting to reconnect...');
                
                // Try to reconnect
                setTimeout(() => this.connectMetaMask(), 1000);
            },
            
            networkError: async function() {
                this.showStatus('warning', 'Network error. Please check your internet connection and try again.');
                setTimeout(() => this.hideStatus(), 5000);
                
                // Try again after a delay
                setTimeout(() => this.connectMetaMask(), 3000);
            },
            
            internalError: async function() {
                this.showStatus('error', 'MetaMask internal error. Please refresh the page and try again.');
                setTimeout(() => this.hideStatus(), 5000);
            },
            
            invalidParameters: async function() {
                this.showStatus('error', 'Invalid parameters. Please refresh the page and try again.');
                setTimeout(() => this.hideStatus(), 5000);
            }
        };
    }

    /**
     * Initialize network configurations
     */
    initializeNetworkConfigs() {
        return {
            ethereum: {
                chainId: '0x1',
                chainName: 'Ethereum Mainnet',
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://mainnet.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161'],
                blockExplorerUrls: ['https://etherscan.io']
            },
            arbitrum: {
                chainId: '0xa4b1',
                chainName: 'Arbitrum One',
                nativeCurrency: {
                    name: 'Ether',
                    symbol: 'ETH',
                    decimals: 18
                },
                rpcUrls: ['https://arb1.arbitrum.io/rpc'],
                blockExplorerUrls: ['https://arbiscan.io']
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
                blockExplorerUrls: ['https://snowtrace.io']
            }
        };
    }

    /**
     * Format address for display
     */
    formatAddress(address) {
        if (!address) return '-';
        return address.substring(0, 6) + '...' + address.substring(address.length - 4);
    }

    /**
     * Add message to debug log
     */
    log(message) {
        const timestamp = new Date().toISOString();
        this.debugLog.push(`[${timestamp}] ${message}`);
        
        // Keep log size manageable
        if (this.debugLog.length > 100) {
            this.debugLog.shift();
        }
        
        console.log(`[AI MetaMask Debugger] ${message}`);
    }

    /**
     * Update debug UI
     */
    updateDebugUI(message) {
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo) {
            debugInfo.innerHTML = message;
        }
    }

    /**
     * Add message to system log
     */
    addToSystemLog(message) {
        const systemLog = document.getElementById('system-log');
        if (!systemLog) return;
        
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

    /**
     * Sleep function for delays
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Export the AI debugger
window.AIMetaMaskDebugger = AIMetaMaskDebugger;
