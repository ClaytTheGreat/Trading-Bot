// Multi-Network Wallet Connection for Trading Bot
// Supports Arbitrum, Avalanche C-Chain, and Ethereum networks

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
    
    return true;
  } else {
    console.log('MetaMask is not installed!');
    updateWalletStatus('MetaMask not detected', 'danger');
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
    updateWalletStatus('Not Connected', 'danger');
    console.log('No accounts connected.');
  } else if (accounts[0] !== currentAccount) {
    // Account changed
    currentAccount = accounts[0];
    walletConnected = true;
    updateWalletStatus('Connected: ' + formatAddress(currentAccount), 'success');
    console.log('Connected account:', currentAccount);
    
    // Update UI with account info
    updateAccountInfo();
  }
}

// Handle chain changed event
function handleChainChanged(chainId) {
  currentChainId = chainId;
  console.log('Chain changed to:', chainId);
  
  // Update network display
  updateNetworkDisplay(chainId);
  
  // Reload page to refresh state
  // window.location.reload();
}

// Handle disconnect event
function handleDisconnect(error) {
  console.log('Disconnected from wallet:', error);
  currentAccount = null;
  walletConnected = false;
  updateWalletStatus('Disconnected', 'danger');
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
  const walletStatus = document.getElementById('wallet-status');
  if (walletStatus) {
    walletStatus.textContent = message;
    walletStatus.className = 'badge badge-' + status;
  }
  
  // Update connect button text
  const connectButton = document.getElementById('connect-metamask');
  if (connectButton) {
    if (status === 'success') {
      connectButton.textContent = 'Wallet Connected';
      connectButton.classList.add('connected');
    } else {
      connectButton.textContent = 'Connect MetaMask';
      connectButton.classList.remove('connected');
    }
  }
}

// Update network display in UI
function updateNetworkDisplay(chainId) {
  let networkName = 'Unknown Network';
  let networkClass = 'warning';
  
  // Convert chainId to hex if it's a number
  if (typeof chainId === 'number') {
    chainId = '0x' + chainId.toString(16);
  }
  
  // Identify network
  switch (chainId) {
    case '0x1':
      networkName = 'Ethereum Mainnet';
      networkClass = 'primary';
      break;
    case '0xa4b1':
      networkName = 'Arbitrum One';
      networkClass = 'success';
      break;
    case '0xa86a':
      networkName = 'Avalanche C-Chain';
      networkClass = 'danger';
      break;
    default:
      networkName = 'Unsupported Network';
      networkClass = 'warning';
  }
  
  // Update network display in UI
  const networkDisplay = document.getElementById('network-display');
  if (networkDisplay) {
    networkDisplay.textContent = networkName;
    networkDisplay.className = 'badge badge-' + networkClass;
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
    
    // Add account to system log
    addToSystemLog('Wallet connected: ' + formatAddress(currentAccount));
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
  const systemLog = document.querySelector('.system-log');
  if (systemLog) {
    const logEntry = document.createElement('div');
    logEntry.className = 'log-entry';
    
    const timestamp = document.createElement('span');
    timestamp.className = 'log-timestamp';
    timestamp.textContent = new Date().toLocaleTimeString();
    
    const logMessage = document.createElement('span');
    logMessage.className = 'log-message';
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
  
  // Network selection buttons
  const networkButtons = document.querySelectorAll('.network-select-btn');
  networkButtons.forEach(button => {
    button.addEventListener('click', function() {
      const network = this.getAttribute('data-network');
      switchNetwork(network);
    });
  });
});

// Export functions for external use
window.walletConnection = {
  connect: connectMetaMask,
  switchNetwork: switchNetwork,
  getCurrentAccount: () => currentAccount,
  isConnected: () => walletConnected,
  getCurrentChainId: () => currentChainId
};
