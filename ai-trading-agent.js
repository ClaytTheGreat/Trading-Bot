// AI Trading Agent for Trading Bot
// Implements AI-based trading using Market Cipher and Lux Algo concepts

class AITradingAgent {
  constructor() {
    this.isActive = false;
    this.currentStrategy = null;
    this.indicators = {
      marketCipherB: true,
      vfi: true,
      moneyFlow: true,
      wavetrend: true,
      luxAlgo: true
    };
    this.signals = [];
    this.lastSignal = null;
    this.winRate = 0;
    this.tradesExecuted = 0;
    this.tradesWon = 0;
    this.confidenceThreshold = 75; // Default confidence threshold
  }

  // Initialize the AI agent
  initialize(strategy = 'Scalping') {
    this.isActive = true;
    this.setStrategy(strategy);
    this.updateAgentStatus();
    this.addToSystemLog('AI Trading Agent initialized with ' + strategy + ' strategy');
    return true;
  }

  // Set the current trading strategy
  setStrategy(strategy) {
    this.currentStrategy = strategy;
    this.addToSystemLog('Strategy set to: ' + strategy);
    
    // Update UI
    const currentStrategyElement = document.getElementById('current-strategy');
    if (currentStrategyElement) {
      currentStrategyElement.textContent = strategy;
    }
    
    // Update strategy cards
    const strategyCards = document.querySelectorAll('.strategy-card');
    strategyCards.forEach(card => {
      const strategyName = card.querySelector('.strategy-name').textContent;
      const selectBtn = card.querySelector('.strategy-select-btn');
      
      if (strategyName === strategy) {
        card.classList.add('active');
        if (selectBtn) {
          selectBtn.textContent = 'Selected';
          selectBtn.classList.remove('btn-outline');
          selectBtn.classList.add('btn-primary');
        }
      } else {
        card.classList.remove('active');
        if (selectBtn) {
          selectBtn.textContent = 'Select';
          selectBtn.classList.remove('btn-primary');
          selectBtn.classList.add('btn-outline');
        }
      }
    });
    
    return true;
  }

  // Toggle an indicator on/off
  toggleIndicator(indicatorName, state) {
    if (this.indicators.hasOwnProperty(indicatorName)) {
      this.indicators[indicatorName] = state;
      this.addToSystemLog('Indicator ' + indicatorName + ' ' + (state ? 'enabled' : 'disabled'));
      return true;
    }
    return false;
  }

  // Analyze market data and generate signals
  analyzeMarket(marketData) {
    if (!this.isActive) return null;
    
    // Placeholder for actual analysis logic
    // In a real implementation, this would use the actual indicator algorithms
    
    const confidence = this.calculateConfidence(marketData);
    const signalType = confidence > 0 ? 'BUY' : 'SELL';
    
    // Only generate signal if confidence exceeds threshold
    if (Math.abs(confidence) >= this.confidenceThreshold) {
      const signal = {
        type: signalType,
        confidence: Math.abs(confidence),
        timestamp: new Date(),
        price: marketData.currentPrice,
        strategy: this.currentStrategy
      };
      
      this.signals.push(signal);
      this.lastSignal = signal;
      
      // Update UI
      this.updateLastSignalDisplay(signal);
      this.addToSystemLog(`${signalType} signal generated with ${Math.abs(confidence)}% confidence`);
      
      return signal;
    }
    
    return null;
  }

  // Calculate confidence based on indicators
  calculateConfidence(marketData) {
    // This is a placeholder for the actual algorithm
    // In a real implementation, this would use actual technical indicators
    
    let confidence = 0;
    
    // Market Cipher B signals (placeholder logic)
    if (this.indicators.marketCipherB) {
      // Simplified logic - in reality would use actual Market Cipher B calculations
      const mcbSignal = marketData.momentum > 0 ? 20 : -20;
      confidence += mcbSignal;
    }
    
    // VFI (Volume Flow Indicator) signals
    if (this.indicators.vfi) {
      // Simplified logic
      const vfiSignal = marketData.volume > marketData.volumeMA ? 15 : -15;
      confidence += vfiSignal;
    }
    
    // Money Flow signals
    if (this.indicators.moneyFlow) {
      // Simplified logic
      const mfSignal = marketData.moneyFlow > 0 ? 25 : -25;
      confidence += mfSignal;
    }
    
    // WaveTrend signals
    if (this.indicators.wavetrend) {
      // Simplified logic
      const wtSignal = marketData.wavetrend.crossUp ? 20 : (marketData.wavetrend.crossDown ? -20 : 0);
      confidence += wtSignal;
    }
    
    // Lux Algo price action signals
    if (this.indicators.luxAlgo) {
      // Simplified logic
      const luxSignal = marketData.luxAlgo.bullish ? 20 : (marketData.luxAlgo.bearish ? -20 : 0);
      confidence += luxSignal;
    }
    
    // Normalize confidence to -100 to 100 range
    confidence = Math.max(-100, Math.min(100, confidence));
    
    return confidence;
  }

  // Execute a trade based on signal
  executeTrade(signal) {
    if (!this.isActive || !signal) return false;
    
    // Placeholder for actual trade execution
    // In a real implementation, this would connect to the exchange API
    
    this.tradesExecuted++;
    
    // Simulate trade result (70% win rate for demo)
    const isWin = Math.random() < 0.7;
    if (isWin) this.tradesWon++;
    
    // Update win rate
    this.winRate = Math.round((this.tradesWon / this.tradesExecuted) * 100);
    
    // Update UI
    const winRateElement = document.querySelector('.status-item:contains("Win Rate") .status-value');
    if (winRateElement) {
      winRateElement.textContent = this.winRate + '%';
    }
    
    // Add to recent trades
    this.addTradeToHistory({
      type: signal.type,
      price: signal.price,
      timestamp: new Date(),
      profit: isWin ? (signal.type === 'BUY' ? 2.5 : 1.8) : (signal.type === 'BUY' ? -1.2 : -0.9),
      status: isWin ? 'completed' : 'completed'
    });
    
    this.addToSystemLog(`Trade executed: ${signal.type} at $${signal.price}. Result: ${isWin ? 'Win' : 'Loss'}`);
    
    return true;
  }

  // Add trade to history display
  addTradeToHistory(trade) {
    const recentTrades = document.getElementById('recent-trades');
    if (!recentTrades) return;
    
    // Clear empty state if present
    const emptyState = recentTrades.querySelector('.empty-state');
    if (emptyState) {
      recentTrades.innerHTML = '';
    }
    
    // Create trade entry
    const tradeEntry = document.createElement('div');
    tradeEntry.className = 'trade-item';
    
    const tradeType = document.createElement('div');
    tradeType.className = 'trade-type ' + (trade.type === 'BUY' ? 'buy' : 'sell');
    tradeType.textContent = trade.type;
    
    const tradeDetails = document.createElement('div');
    tradeDetails.className = 'trade-details';
    
    const tradePrice = document.createElement('div');
    tradePrice.className = 'trade-price';
    tradePrice.textContent = '$' + trade.price.toFixed(2);
    
    const tradeTime = document.createElement('div');
    tradeTime.className = 'trade-time';
    tradeTime.textContent = trade.timestamp.toLocaleTimeString();
    
    tradeDetails.appendChild(tradePrice);
    tradeDetails.appendChild(tradeTime);
    
    const tradePL = document.createElement('div');
    tradePL.className = 'trade-pl ' + (trade.profit > 0 ? 'profit' : 'loss');
    tradePL.textContent = (trade.profit > 0 ? '+' : '') + trade.profit.toFixed(2) + '%';
    
    tradeEntry.appendChild(tradeType);
    tradeEntry.appendChild(tradeDetails);
    tradeEntry.appendChild(tradePL);
    
    // Add to container
    recentTrades.insertBefore(tradeEntry, recentTrades.firstChild);
    
    // Limit to 5 recent trades
    const tradeItems = recentTrades.querySelectorAll('.trade-item');
    if (tradeItems.length > 5) {
      recentTrades.removeChild(tradeItems[tradeItems.length - 1]);
    }
  }

  // Update last signal display
  updateLastSignalDisplay(signal) {
    const lastSignalElement = document.getElementById('last-signal');
    const indicatorBadge = document.getElementById('indicator-badge');
    
    if (lastSignalElement) {
      lastSignalElement.textContent = signal.type;
      lastSignalElement.className = 'status-value ' + (signal.type === 'BUY' ? 'text-success' : 'text-danger');
    }
    
    if (indicatorBadge) {
      indicatorBadge.textContent = signal.confidence + '%';
      indicatorBadge.className = 'badge ' + (signal.type === 'BUY' ? 'badge-success' : 'badge-danger');
    }
  }

  // Update agent status in UI
  updateAgentStatus() {
    const aiStatus = document.getElementById('ai-status');
    if (aiStatus) {
      aiStatus.textContent = this.isActive ? 'Active' : 'Inactive';
      aiStatus.className = 'badge badge-' + (this.isActive ? 'success' : 'danger');
    }
    
    const aiStatusValue = document.querySelector('.status-item:contains("AI Status") .status-value');
    if (aiStatusValue) {
      aiStatusValue.textContent = this.isActive ? 'Active' : 'Inactive';
      aiStatusValue.className = 'status-value ' + (this.isActive ? 'text-success' : 'text-danger');
    }
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

  // Generate mock market data for testing
  generateMockMarketData() {
    // This is for testing only
    return {
      currentPrice: 22.69 + (Math.random() * 2 - 1),
      momentum: Math.random() * 2 - 1,
      volume: 5000000 + Math.random() * 1000000,
      volumeMA: 5200000,
      moneyFlow: Math.random() * 2 - 1,
      wavetrend: {
        crossUp: Math.random() > 0.7,
        crossDown: Math.random() > 0.7
      },
      luxAlgo: {
        bullish: Math.random() > 0.6,
        bearish: Math.random() > 0.6
      }
    };
  }

  // Start automated trading simulation
  startTradingSimulation() {
    if (!this.isActive) return false;
    
    this.addToSystemLog('Starting automated trading simulation');
    
    // Simulate market analysis and trading at intervals
    this.simulationInterval = setInterval(() => {
      const marketData = this.generateMockMarketData();
      const signal = this.analyzeMarket(marketData);
      
      if (signal) {
        setTimeout(() => {
          this.executeTrade(signal);
        }, 2000);
      }
    }, 15000); // Check for signals every 15 seconds
    
    return true;
  }

  // Stop automated trading simulation
  stopTradingSimulation() {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
      this.addToSystemLog('Stopped automated trading simulation');
    }
    return true;
  }
}

// Initialize and export the AI agent
let aiAgent = null;

document.addEventListener('DOMContentLoaded', function() {
  // Create AI agent instance
  aiAgent = new AITradingAgent();
  
  // Initialize with default strategy
  setTimeout(() => {
    aiAgent.initialize('Scalping');
    
    // Start simulation after wallet connection (in a real app, this would be triggered by actual connection)
    setTimeout(() => {
      aiAgent.startTradingSimulation();
    }, 5000);
  }, 2000);
  
  // Add event listeners for strategy selection
  const strategyButtons = document.querySelectorAll('.strategy-select-btn');
  strategyButtons.forEach(button => {
    button.addEventListener('click', function() {
      const strategyCard = this.closest('.strategy-card');
      const strategyName = strategyCard.querySelector('.strategy-name').textContent;
      aiAgent.setStrategy(strategyName);
    });
  });
  
  // Add event listeners for indicator toggles
  const indicatorToggles = document.querySelectorAll('[id$="-toggle"]');
  indicatorToggles.forEach(toggle => {
    toggle.addEventListener('change', function() {
      const indicatorId = this.id.replace('-toggle', '');
      const indicatorName = indicatorId.replace(/-([a-z])/g, (g) => g[1].toUpperCase());
      aiAgent.toggleIndicator(indicatorName, this.checked);
    });
  });
  
  // Expose AI agent to window for external access
  window.aiAgent = aiAgent;
});
