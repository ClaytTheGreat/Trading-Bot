/**
 * Simplified Wallet Connection Module for Trading Bot
 * Supports Arbitrum, Avalanche C-Chain, and Ethereum networks
 */

// Network configuration
const NETWORKS = {
  // Ethereum Mainnet
  ETHEREUM: {
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
  // Arbitrum One
  ARBITRUM: {
    chainId: '0xa4b1', // 42161 in decimal
    chainName: 'Arbitrum One',
    nativeCurrency: {
      name: 'Ether',
      symbol: 'ETH',
      decimals: 18
    },
    rpcUrls: ['https://arb1.arbitrum.io/rpc'],
    blockExplorerUrls: ['https://arbiscan.io']
  },
  // Avalanche C-Chain
  AVALANCHE: {
    chainId: '0xa86a', // 43114 in decimal
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

// Wallet connection status
let walletConnected = false;
let currentAccount = null;
let currentChainId = null;
let provider = null;

// Initialize wallet connection
async function initWallet() {
  // Check if MetaMask is installed
  if (typeof window.ethereum !== 'undefined') {
    console.log('MetaMask is installed!');
    provider = window.ethereum;
    
    // Register event listeners
    registerEthereumEvents();
    
    // Check if already connected
    const accounts = await provider.request({ method: 'eth_accounts' });
    if (accounts.length > 0) {
      handleAccountsChanged(accounts);
    }
    
    // Get current chain ID
    try {
      currentChainId = await provider.request({ method: 'eth_chainId' });
      handleChainChanged(currentChainId);
    } catch (error) {
      console.error('Error getting chain ID:', error);
    }
    
    // Update UI
    updateWalletUI();
    
    return true;
  } else {
    console.log('MetaMask is not installed!');
    updateWalletStatus('MetaMask not detected', 'danger');
    
    // Update UI for MetaMask not installed
    const connectButton = document.getElementById('connect-metamask');
    if (connectButton) {
      connectButton.textContent = 'MetaMask Not Installed';
      connectButton.classList.add('disabled');
    }
    
    return false;
  }
}

// Register Ethereum events
function registerEthereumEvents() {
  // Handle account changes
  provider.on('accountsChanged', handleAccountsChanged);
  
  // Handle chain changes
  provider.on('chainChanged', handleChainChanged);
  
  // Handle disconnect
  provider.on('disconnect', handleDisconnect);
}

// Connect to MetaMask
async function connectMetaMask() {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // Request account access
      const accounts = await provider.request({ method: 'eth_requestAccounts' });
      handleAccountsChanged(accounts);
      return true;
    } catch (error) {
      // User denied account access
      console.error('User denied account access:', error);
      updateWalletStatus('Connection Rejected', 'danger');
      return false;
    }
  } else {
    console.log('MetaMask is not installed!');
    updateWalletStatus('MetaMask not detected', 'danger');
    return false;
  }
}

// Handle accounts changed event
function handleAccountsChanged(accounts) {
  if (accounts.length === 0) {
    // User logged out or disconnected
    currentAccount = null;
    walletConnected = false;
    updateWalletStatus('Disconnected', 'danger');
    console.log('No accounts connected.');
    
    // Update UI
    updateWalletUI();
  } else if (accounts[0] !== currentAccount) {
    // Account changed
    currentAccount = accounts[0];
    walletConnected = true;
    updateWalletStatus('Connected: ' + formatAddress(currentAccount), 'success');
    console.log('Connected account:', currentAccount);
    
    // Update UI with account info
    updateWalletUI();
    updateAccountInfo();
  }
}

// Handle chain changed event
function handleChainChanged(chainId) {
  currentChainId = chainId;
  console.log('Chain changed to:', chainId);
  
  // Update network display
  updateNetworkDisplay(chainId);
}

// Handle disconnect event
function handleDisconnect(error) {
  console.log('Disconnected from wallet:', error);
  currentAccount = null;
  walletConnected = false;
  updateWalletStatus('Disconnected', 'danger');
  
  // Update UI
  updateWalletUI();
}

// Switch to a specific network
async function switchNetwork(networkKey) {
  if (!provider) {
    console.error('No provider available');
    return false;
  }
  
  const network = NETWORKS[networkKey];
  if (!network) {
    console.error('Invalid network key:', networkKey);
    return false;
  }
  
  try {
    // Try to switch to the network
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: network.chainId }],
    });
    return true;
  } catch (switchError) {
    // This error code indicates that the chain has not been added to MetaMask
    if (switchError.code === 4902) {
      try {
        // Add the network
        await provider.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: network.chainId,
              chainName: network.chainName,
              nativeCurrency: network.nativeCurrency,
              rpcUrls: network.rpcUrls,
              blockExplorerUrls: network.blockExplorerUrls
            },
          ],
        });
        return true;
      } catch (addError) {
        console.error('Error adding network:', addError);
        return false;
      }
    } else {
      console.error('Error switching network:', switchError);
      return false;
    }
  }
}

// Update wallet status in UI
function updateWalletStatus(message, status) {
  const walletStatus = document.getElementById('connection-status');
  if (walletStatus) {
    walletStatus.textContent = message;
    
    // Update status indicator
    const statusIndicator = document.getElementById('status-indicator');
    if (statusIndicator) {
      statusIndicator.className = 'status-indicator ' + (status === 'success' ? 'connected' : 'disconnected');
    }
  }
}

// Update wallet UI based on connection state
function updateWalletUI() {
  // Update connect button text
  const connectButton = document.getElementById('connect-metamask');
  if (connectButton) {
    if (walletConnected) {
      connectButton.textContent = 'Wallet Connected';
      connectButton.classList.add('connected');
    } else {
      connectButton.textContent = 'Connect MetaMask';
      connectButton.classList.remove('connected');
    }
  }
  
  // Show/hide wallet details
  const walletDetails = document.getElementById('wallet-details');
  if (walletDetails) {
    walletDetails.style.display = walletConnected ? 'block' : 'none';
  }
  
  // Update wallet address
  if (walletConnected) {
    const walletAddress = document.getElementById('wallet-address');
    if (walletAddress) {
      walletAddress.textContent = formatAddress(currentAccount);
    }
  }
  
  // Add to system log
  addToSystemLog(walletConnected ? 
    `Wallet connected: ${formatAddress(currentAccount)}` : 
    'Wallet disconnected');
}

// Update network display in UI
function updateNetworkDisplay(chainId) {
  let networkName = 'Unknown Network';
  
  // Convert chainId to hex if it's a number
  if (typeof chainId === 'number') {
    chainId = '0x' + chainId.toString(16);
  }
  
  // Identify network
  switch (chainId) {
    case '0x1':
      networkName = 'Ethereum Mainnet';
      break;
    case '0xa4b1':
      networkName = 'Arbitrum One';
      break;
    case '0xa86a':
      networkName = 'Avalanche C-Chain';
      break;
    default:
      networkName = 'Unsupported Network';
  }
  
  // Update network display in UI
  const walletNetwork = document.getElementById('wallet-network');
  if (walletNetwork) {
    walletNetwork.textContent = networkName;
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
  
  // Log the current network
  console.log('Current network:', networkName);
}

// Update account info in UI
async function updateAccountInfo() {
  if (!currentAccount || !provider) return;
  
  try {
    // Get ETH balance
    const balance = await provider.request({
      method: 'eth_getBalance',
      params: [currentAccount, 'latest'],
    });
    
    // Convert balance from wei to ETH
    const ethBalance = parseInt(balance, 16) / 1e18;
    
    // Update balance display
    const walletBalance = document.getElementById('wallet-balance');
    if (walletBalance) {
      walletBalance.textContent = ethBalance.toFixed(4) + ' ETH';
    }
  } catch (error) {
    console.error('Error getting balance:', error);
  }
}

// Format address for display (truncate middle)
function formatAddress(address) {
  if (!address) return '';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
}

// Add message to system log
function addToSystemLog(message) {
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

// Initialize wallet on page load
document.addEventListener('DOMContentLoaded', function() {
  // Initialize wallet
  initWallet();
  
  // Connect button event listener
  const connectButton = document.getElementById('connect-metamask');
  if (connectButton) {
    connectButton.addEventListener('click', connectMetaMask);
  }
  
  // Network selection
  const networkSelect = document.getElementById('network-select');
  if (networkSelect) {
    networkSelect.addEventListener('change', function() {
      const network = this.value.toUpperCase();
      switchNetwork(network);
    });
  }
});

// Export functions for external use
window.walletConnection = {
  connect: connectMetaMask,
  switchNetwork: switchNetwork,
  getCurrentAccount: () => currentAccount,
  isConnected: () => walletConnected,
  getCurrentChainId: () => currentChainId
};
