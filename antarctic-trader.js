// Trade Execution Module for Antarctic Exchange
// Implements generic DEX trade execution framework compatible with MetaMask

class AntarcticExchangeTrader {
  constructor() {
    this.isInitialized = false;
    this.provider = null;
    this.signer = null;
    this.currentAccount = null;
    this.currentChainId = null;
    this.supportedChains = {
      ETHEREUM: '0x1',
      ARBITRUM: '0xa4b1',
      AVALANCHE: '0xa86a'
    };
    
    // These would be replaced with actual contract addresses when available
    this.contractAddresses = {
      '0x1': '0x0000000000000000000000000000000000000000', // Ethereum placeholder
      '0xa4b1': '0x0000000000000000000000000000000000000000', // Arbitrum placeholder
      '0xa86a': '0x0000000000000000000000000000000000000000' // Avalanche placeholder
    };
    
    this.tradingPairs = [
      'AVAX/USDT',
      'AVAX/BTC',
      'AVAX/ETH',
      'BTC/USDT',
      'ETH/USDT'
    ];
    
    this.lastTrade = null;
    this.tradeHistory = [];
  }

  // Initialize the trader with MetaMask provider
  async initialize() {
    if (typeof window.ethereum === 'undefined') {
      console.error('MetaMask is not installed');
      return false;
    }
    
    try {
      this.provider = window.ethereum;
      
      // Get current account
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      if (accounts.length === 0) {
        console.warn('No accounts connected. User needs to connect wallet first.');
        return false;
      }
      
      this.currentAccount = accounts[0];
      
      // Get current chain ID
      this.currentChainId = await this.provider.request({ method: 'eth_chainId' });
      
      // Check if current chain is supported
      if (!this.isSupportedChain(this.currentChainId)) {
        console.warn('Current chain is not supported. Please switch to Ethereum, Arbitrum, or Avalanche C-Chain.');
        return false;
      }
      
      // Set up event listeners
      this.provider.on('accountsChanged', this.handleAccountsChanged.bind(this));
      this.provider.on('chainChanged', this.handleChainChanged.bind(this));
      
      this.isInitialized = true;
      this.addToSystemLog('Trade execution module initialized');
      return true;
    } catch (error) {
      console.error('Error initializing trader:', error);
      return false;
    }
  }

  // Check if chain is supported
  isSupportedChain(chainId) {
    return Object.values(this.supportedChains).includes(chainId);
  }

  // Handle accounts changed event
  handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
      this.currentAccount = null;
      this.isInitialized = false;
      this.addToSystemLog('Wallet disconnected');
    } else if (accounts[0] !== this.currentAccount) {
      this.currentAccount = accounts[0];
      this.addToSystemLog('Account changed: ' + this.formatAddress(this.currentAccount));
    }
  }

  // Handle chain changed event
  handleChainChanged(chainId) {
    this.currentChainId = chainId;
    
    if (!this.isSupportedChain(chainId)) {
      this.addToSystemLog('Switched to unsupported network. Please use Ethereum, Arbitrum, or Avalanche C-Chain.');
    } else {
      this.addToSystemLog('Switched to network: ' + this.getNetworkName(chainId));
    }
  }

  // Get network name from chain ID
  getNetworkName(chainId) {
    switch (chainId) {
      case '0x1':
        return 'Ethereum Mainnet';
      case '0xa4b1':
        return 'Arbitrum One';
      case '0xa86a':
        return 'Avalanche C-Chain';
      default:
        return 'Unknown Network';
    }
  }

  // Format address for display
  formatAddress(address) {
    if (!address) return '';
    return address.substring(0, 6) + '...' + address.substring(address.length - 4);
  }

  // Execute a trade
  async executeTrade(tradeParams) {
    if (!this.isInitialized) {
      console.error('Trader not initialized');
      return { success: false, error: 'Trader not initialized' };
    }
    
    if (!this.currentAccount) {
      console.error('No account connected');
      return { success: false, error: 'No account connected' };
    }
    
    if (!this.isSupportedChain(this.currentChainId)) {
      console.error('Current chain not supported');
      return { success: false, error: 'Current chain not supported' };
    }
    
    try {
      // Validate trade parameters
      if (!this.validateTradeParams(tradeParams)) {
        return { success: false, error: 'Invalid trade parameters' };
      }
      
      // In a real implementation, this would interact with the exchange's smart contracts
      // For now, we'll simulate the trade execution
      
      this.addToSystemLog(`Executing ${tradeParams.type} order for ${tradeParams.amount} ${tradeParams.pair} at ${tradeParams.price}`);
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Create trade record
      const trade = {
        type: tradeParams.type,
        pair: tradeParams.pair,
        amount: tradeParams.amount,
        price: tradeParams.price,
        value: tradeParams.amount * tradeParams.price,
        timestamp: new Date(),
        txHash: '0x' + Math.random().toString(16).substring(2, 42),
        status: 'completed',
        chainId: this.currentChainId,
        network: this.getNetworkName(this.currentChainId)
      };
      
      // Add to history
      this.tradeHistory.unshift(trade);
      this.lastTrade = trade;
      
      // Update UI
      this.updateTradeHistory();
      
      this.addToSystemLog(`${tradeParams.type} order executed successfully`);
      
      return { success: true, trade };
    } catch (error) {
      console.error('Error executing trade:', error);
      this.addToSystemLog(`Trade execution failed: ${error.message}`);
      return { success: false, error: error.message };
    }
  }

  // Validate trade parameters
  validateTradeParams(params) {
    // Check required fields
    if (!params.type || !params.pair || !params.amount || !params.price) {
      console.error('Missing required trade parameters');
      return false;
    }
    
    // Validate trade type
    if (params.type !== 'BUY' && params.type !== 'SELL') {
      console.error('Invalid trade type. Must be BUY or SELL');
      return false;
    }
    
    // Validate trading pair
    if (!this.tradingPairs.includes(params.pair)) {
      console.error('Invalid trading pair');
      return false;
    }
    
    // Validate amount and price
    if (isNaN(params.amount) || params.amount <= 0 || isNaN(params.price) || params.price <= 0) {
      console.error('Invalid amount or price');
      return false;
    }
    
    return true;
  }

  // Get trade history
  getTradeHistory() {
    return this.tradeHistory;
  }

  // Update trade history in UI
  updateTradeHistory() {
    const tradeHistoryTable = document.querySelector('.table tbody');
    if (!tradeHistoryTable) return;
    
    // Clear empty state if present
    if (tradeHistoryTable.querySelector('.empty-state')) {
      tradeHistoryTable.innerHTML = '';
    }
    
    // Add trades to table
    this.tradeHistory.forEach(trade => {
      const row = document.createElement('tr');
      
      const dateCell = document.createElement('td');
      dateCell.textContent = trade.timestamp.toLocaleString();
      
      const pairCell = document.createElement('td');
      pairCell.textContent = trade.pair;
      
      const typeCell = document.createElement('td');
      typeCell.className = trade.type === 'BUY' ? 'text-success' : 'text-danger';
      typeCell.textContent = trade.type;
      
      const priceCell = document.createElement('td');
      priceCell.textContent = trade.price.toFixed(2);
      
      const amountCell = document.createElement('td');
      amountCell.textContent = trade.amount.toFixed(4);
      
      const valueCell = document.createElement('td');
      valueCell.textContent = trade.value.toFixed(2);
      
      const plCell = document.createElement('td');
      plCell.textContent = '--';
      
      const statusCell = document.createElement('td');
      statusCell.innerHTML = `<span class="badge badge-success">${trade.status}</span>`;
      
      row.appendChild(dateCell);
      row.appendChild(pairCell);
      row.appendChild(typeCell);
      row.appendChild(priceCell);
      row.appendChild(amountCell);
      row.appendChild(valueCell);
      row.appendChild(plCell);
      row.appendChild(statusCell);
      
      tradeHistoryTable.appendChild(row);
    });
  }

  // Add message to system log
  addToSystemLog(message) {
    const systemLog = document.querySelector('.system-log');
    if (!systemLog) return;
    
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

  // Execute trade from AI signal
  async executeTradeFromSignal(signal) {
    if (!signal) return false;
    
    // Convert AI signal to trade parameters
    const tradeParams = {
      type: signal.type,
      pair: 'AVAX/USDT', // Default pair
      amount: 0.5, // Default amount
      price: signal.price
    };
    
    // Execute the trade
    const result = await this.executeTrade(tradeParams);
    return result.success;
  }
}

// Initialize and export the trader
let antarctic = null;

document.addEventListener('DOMContentLoaded', function() {
  // Create trader instance
  antarctic = new AntarcticExchangeTrader();
  
  // Initialize after wallet connection (in a real app, this would be triggered by actual connection)
  setTimeout(async () => {
    await antarctic.initialize();
    
    // Connect AI agent with trader for signal execution
    if (window.aiAgent) {
      // Override AI agent's executeTrade method to use our trader
      const originalExecuteTrade = window.aiAgent.executeTrade.bind(window.aiAgent);
      window.aiAgent.executeTrade = async function(signal) {
        // First run the original method for UI updates
        originalExecuteTrade(signal);
        
        // Then execute the actual trade
        if (antarctic && antarctic.isInitialized) {
          await antarctic.executeTradeFromSignal(signal);
        }
      };
    }
  }, 3000);
  
  // Expose trader to window for external access
  window.antarctic = antarctic;
});
