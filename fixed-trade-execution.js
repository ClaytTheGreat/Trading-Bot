/**
 * Trade Execution Module for Trading Bot
 * Handles automated trading based on AI signals and price data
 */

class TradeExecution {
    constructor() {
        this.isTrading = false;
        this.currentStrategy = 'ai'; // 'ai' or 'manual'
        this.tradingTimeframe = 'day'; // 'scalping', 'day', or 'swing'
        this.leverage = 25; // Default leverage
        this.maxDailyLoss = 10; // Maximum daily loss percentage
        this.dailyProfitTarget = 20; // Daily profit target percentage
        this.dailyPL = 0; // Daily profit/loss percentage
        this.trades = []; // Trade history
        this.pendingOrders = []; // Pending orders
        this.lastSignal = null; // Last trading signal
        this.walletConnected = false; // Wallet connection status
    }

    /**
     * Initialize trade execution module
     */
    initialize() {
        console.log('Initializing trade execution module...');
        this.addToSystemLog('Initializing trade execution module...');
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check wallet connection
        this.checkWalletConnection();
        
        // Set up price feed listener
        if (window.priceFeed) {
            window.priceFeed.onPriceUpdate((price, percentChange) => {
                this.handlePriceUpdate(price, percentChange);
            });
        } else {
            this.addToSystemLog('Warning: Price feed not available');
            
            // Try to initialize price feed if not available
            setTimeout(() => {
                if (window.priceFeed) {
                    window.priceFeed.onPriceUpdate((price, percentChange) => {
                        this.handlePriceUpdate(price, percentChange);
                    });
                }
            }, 5000);
        }
        
        return true;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Start trading button
        const startButton = document.getElementById('start-trading');
        if (startButton) {
            startButton.addEventListener('click', () => this.startTrading());
        }
        
        // Stop trading button
        const stopButton = document.getElementById('stop-trading');
        if (stopButton) {
            stopButton.addEventListener('click', () => this.stopTrading());
        }
        
        // Strategy selection
        const aiStrategy = document.getElementById('strategy-ai');
        const manualStrategy = document.getElementById('strategy-manual');
        
        if (aiStrategy) {
            aiStrategy.addEventListener('change', () => {
                if (aiStrategy.checked) {
                    this.setStrategy('ai');
                }
            });
        }
        
        if (manualStrategy) {
            manualStrategy.addEventListener('change', () => {
                if (manualStrategy.checked) {
                    this.setStrategy('manual');
                }
            });
        }
        
        // Trading timeframe buttons
        const scalpingButton = document.querySelector('button:nth-of-type(1)');
        const dayTradingButton = document.querySelector('button:nth-of-type(2)');
        const swingTradingButton = document.querySelector('button:nth-of-type(3)');
        
        if (scalpingButton) {
            scalpingButton.addEventListener('click', () => this.setTradingTimeframe('scalping'));
        }
        
        if (dayTradingButton) {
            dayTradingButton.addEventListener('click', () => this.setTradingTimeframe('day'));
        }
        
        if (swingTradingButton) {
            swingTradingButton.addEventListener('click', () => this.setTradingTimeframe('swing'));
        }
        
        // Leverage buttons
        const leverageButtons = document.querySelectorAll('.card:nth-child(3) button');
        leverageButtons.forEach(button => {
            button.addEventListener('click', () => {
                const leverage = parseInt(button.textContent);
                if (!isNaN(leverage)) {
                    this.setLeverage(leverage);
                }
            });
        });
        
        // Listen for wallet connection changes
        document.addEventListener('walletConnectionChanged', (event) => {
            this.walletConnected = event.detail.connected;
            this.updateTradingStatus();
        });
    }

    /**
     * Check wallet connection
     */
    checkWalletConnection() {
        // Check if wallet connection module is available
        if (window.walletConnection) {
            this.walletConnected = window.walletConnection.isConnected();
        } else {
            this.walletConnected = false;
            
            // Try again after a delay
            setTimeout(() => {
                if (window.walletConnection) {
                    this.walletConnected = window.walletConnection.isConnected();
                    this.updateTradingStatus();
                }
            }, 3000);
        }
        
        this.updateTradingStatus();
    }

    /**
     * Start automated trading
     */
    startTrading() {
        // Check if wallet is connected
        if (!this.walletConnected) {
            this.addToSystemLog('Cannot start trading: Wallet not connected');
            this.showNotification('Please connect your wallet first', 'warning');
            return false;
        }
        
        // Check if price feed is available
        if (!window.priceFeed || !window.priceFeed.getCurrentPrice()) {
            this.addToSystemLog('Cannot start trading: Price feed not available');
            this.showNotification('Price feed not available', 'warning');
            return false;
        }
        
        // Start trading
        this.isTrading = true;
        this.addToSystemLog(`Started ${this.currentStrategy === 'ai' ? 'AI' : 'Manual'} trading with ${this.leverage}x leverage`);
        this.showNotification(`Trading started (${this.tradingTimeframe}, ${this.leverage}x leverage)`, 'success');
        
        // Update UI
        this.updateTradingStatus();
        
        // If using AI strategy, start signal generation
        if (this.currentStrategy === 'ai') {
            this.startAISignalGeneration();
        }
        
        return true;
    }

    /**
     * Stop automated trading
     */
    stopTrading() {
        // Stop trading
        this.isTrading = false;
        this.addToSystemLog('Trading stopped');
        this.showNotification('Trading stopped', 'info');
        
        // Update UI
        this.updateTradingStatus();
        
        return true;
    }

    /**
     * Set trading strategy
     */
    setStrategy(strategy) {
        this.currentStrategy = strategy;
        
        // Update UI
        const strategyName = document.getElementById('strategy-name');
        const strategyDescription = document.getElementById('strategy-description');
        const strategyRisk = document.getElementById('strategy-risk');
        
        if (strategyName && strategyDescription && strategyRisk) {
            if (strategy === 'ai') {
                strategyName.textContent = 'AI Trading Agent';
                strategyDescription.textContent = 'Uses AI to analyze market conditions and execute trades automatically based on Market Cipher and Lux Algo indicators.';
                strategyRisk.textContent = 'Medium';
            } else {
                strategyName.textContent = 'Manual Trading';
                strategyDescription.textContent = 'Executes trades based on manually configured parameters and indicators.';
                strategyRisk.textContent = 'Varies';
            }
        }
        
        this.addToSystemLog(`Strategy changed to ${strategy === 'ai' ? 'AI Trading Agent' : 'Manual Trading'}`);
        
        // If currently trading, restart with new strategy
        if (this.isTrading) {
            this.stopTrading();
            this.startTrading();
        }
    }

    /**
     * Set trading timeframe
     */
    setTradingTimeframe(timeframe) {
        this.tradingTimeframe = timeframe;
        
        // Update UI
        const timeframeButtons = document.querySelectorAll('.card:nth-child(2) button');
        timeframeButtons.forEach(button => {
            button.classList.remove('active');
        });
        
        // Find and activate the correct button
        let buttonIndex = 0;
        switch (timeframe) {
            case 'scalping':
                buttonIndex = 0;
                break;
            case 'day':
                buttonIndex = 1;
                break;
            case 'swing':
                buttonIndex = 2;
                break;
        }
        
        if (timeframeButtons[buttonIndex]) {
            timeframeButtons[buttonIndex].classList.add('active');
        }
        
        // Update timeframe description
        const description = document.querySelector('.card:nth-child(2) p:nth-of-type(1)');
        const targetProfit = document.querySelector('.card:nth-child(2) p:nth-of-type(2)');
        const stopLoss = document.querySelector('.card:nth-child(2) p:nth-of-type(3)');
        const maxTrades = document.querySelector('.card:nth-child(2) p:nth-of-type(4)');
        
        if (description && targetProfit && stopLoss && maxTrades) {
            switch (timeframe) {
                case 'scalping':
                    description.textContent = 'Description: Very short-term trades (minutes to hours)';
                    targetProfit.textContent = 'Target Profit: 0.5%';
                    stopLoss.textContent = 'Stop Loss: 0.3%';
                    maxTrades.textContent = 'Max Trades/Day: 20';
                    break;
                case 'day':
                    description.textContent = 'Description: Intraday trades (completed within same day)';
                    targetProfit.textContent = 'Target Profit: 2.0%';
                    stopLoss.textContent = 'Stop Loss: 1.0%';
                    maxTrades.textContent = 'Max Trades/Day: 5';
                    break;
                case 'swing':
                    description.textContent = 'Description: Multi-day positions (days to weeks)';
                    targetProfit.textContent = 'Target Profit: 5.0%';
                    stopLoss.textContent = 'Stop Loss: 3.0%';
                    maxTrades.textContent = 'Max Trades/Day: 2';
                    break;
            }
        }
        
        this.addToSystemLog(`Trading timeframe changed to ${timeframe}`);
        
        // If currently trading, update parameters
        if (this.isTrading) {
            this.updateTradingParameters();
        }
    }

    /**
     * Set leverage
     */
    setLeverage(leverage) {
        this.leverage = leverage;
        
        // Update UI
        const leverageButtons = document.querySelectorAll('.card:nth-child(3) button');
        leverageButtons.forEach(button => {
            button.classList.remove('active');
            
            // Find and activate the correct button
            if (parseInt(button.textContent) === leverage) {
                button.classList.add('active');
            }
        });
        
        this.addToSystemLog(`Leverage changed to ${leverage}x`);
        
        // If currently trading, update parameters
        if (this.isTrading) {
            this.updateTradingParameters();
        }
    }

    /**
     * Update trading parameters
     */
    updateTradingParameters() {
        // Update parameters based on timeframe and leverage
        // This would be called when trading is active and parameters change
        
        this.addToSystemLog(`Updated trading parameters: ${this.tradingTimeframe}, ${this.leverage}x leverage`);
    }

    /**
     * Start AI signal generation
     */
    startAISignalGeneration() {
        // Only generate signals if trading is active and using AI strategy
        if (!this.isTrading || this.currentStrategy !== 'ai') return;
        
        // Get current price
        const currentPrice = window.priceFeed ? window.priceFeed.getCurrentPrice() : 0;
        
        if (currentPrice === 0) {
            this.addToSystemLog('Cannot generate signals: Price data not available');
            return;
        }
        
        // Update AI status
        this.updateAIStatus('Analyzing', 'Calculating', '25%', 'Analyzing');
        
        // Simulate AI analysis time
        setTimeout(() => {
            // Generate trading signal
            this.generateTradingSignal(currentPrice);
            
            // Schedule next signal generation
            const interval = this.getSignalInterval();
            setTimeout(() => this.startAISignalGeneration(), interval);
        }, 3000);
    }

    /**
     * Get signal generation interval based on timeframe
     */
    getSignalInterval() {
        switch (this.tradingTimeframe) {
            case 'scalping':
                return 30000; // 30 seconds
            case 'day':
                return 60000; // 1 minute
            case 'swing':
                return 300000; // 5 minutes
            default:
                return 60000; // 1 minute
        }
    }

    /**
     * Generate trading signal
     */
    generateTradingSignal(currentPrice) {
        // Only generate signals if trading is active
        if (!this.isTrading) return;
        
        // Get price history
        const priceHistory = window.priceFeed ? window.priceFeed.getPriceHistory() : [];
        
        if (priceHistory.length < 5) {
            this.addToSystemLog('Not enough price history to generate signals');
            return;
        }
        
        // Calculate simple moving averages
        const shortSMA = this.calculateSMA(priceHistory, 5);
        const longSMA = this.calculateSMA(priceHistory, 10);
        
        // Determine trend
        let trend = 'neutral';
        if (shortSMA > longSMA) {
            trend = 'bullish';
        } else if (shortSMA < longSMA) {
            trend = 'bearish';
        }
        
        // Calculate momentum
        const momentum = this.calculateMomentum(priceHistory);
        
        // Generate signal
        let signal = 'hold';
        let confidence = 0;
        
        if (trend === 'bullish' && momentum > 0.5) {
            signal = 'buy';
            confidence = Math.min(momentum * 100, 95);
        } else if (trend === 'bearish' && momentum < -0.5) {
            signal = 'sell';
            confidence = Math.min(Math.abs(momentum) * 100, 95);
        }
        
        // Update last signal
        this.lastSignal = {
            signal,
            price: currentPrice,
            timestamp: new Date(),
            confidence
        };
        
        // Update AI status
        this.updateAIStatus('Ready', signal, `${confidence.toFixed(0)}%`, trend);
        
        // Log signal
        this.addToSystemLog(`AI Signal: ${signal.toUpperCase()} with ${confidence.toFixed(0)}% confidence`);
        
        // Execute trade if confidence is high enough
        if (confidence > 70) {
            this.executeTrade(signal, currentPrice, confidence);
        }
    }

    /**
     * Calculate Simple Moving Average
     */
    calculateSMA(priceHistory, period) {
        if (priceHistory.length < period) return 0;
        
        const prices = priceHistory.slice(-period).map(point => point.price);
        const sum = prices.reduce((total, price) => total + price, 0);
        return sum / period;
    }

    /**
     * Calculate momentum
     */
    calculateMomentum(priceHistory) {
        if (priceHistory.length < 10) return 0;
        
        const recentPrices = priceHistory.slice(-10);
        const oldPrice = recentPrices[0].price;
        const newPrice = recentPrices[recentPrices.length - 1].price;
        
        return (newPrice - oldPrice) / oldPrice;
    }

    /**
     * Execute trade based on signal
     */
    executeTrade(signal, price, confidence) {
        // Check if wallet is connected
        if (!this.walletConnected) {
            this.addToSystemLog('Cannot execute trade: Wallet not connected');
            return false;
        }
        
        // Check if we've reached daily loss limit
        if (this.dailyPL <= -this.maxDailyLoss) {
            this.addToSystemLog('Cannot execute trade: Daily loss limit reached');
            this.showNotification('Daily loss limit reached', 'warning');
            this.stopTrading();
            return false;
        }
        
        // Check if we've reached daily profit target
        if (this.dailyPL >= this.dailyProfitTarget) {
            this.addToSystemLog('Daily profit target reached');
            this.showNotification('Daily profit target reached!', 'success');
            this.stopTrading();
            return false;
        }
        
        // Create trade object
        const trade = {
            id: Date.now(),
            type: signal, // 'buy' or 'sell'
            entryPrice: price,
            exitPrice: null,
            leverage: this.leverage,
            timestamp: new Date(),
            status: 'open',
            confidence: confidence,
            profitLoss: 0
        };
        
        // Add to trades array
        this.trades.push(trade);
        
        // Log trade
        this.addToSystemLog(`Executed ${signal.toUpperCase()} trade at $${price.toFixed(2)} with ${this.leverage}x leverage`);
        this.addToTradingHistory(`${signal.toUpperCase()} at $${price.toFixed(2)} (${this.leverage}x)`);
        
        // Simulate trade completion after some time
        setTimeout(() => {
            this.completeTrade(trade);
        }, this.getTradeCompletionTime());
        
        return true;
    }

    /**
     * Get simulated trade completion time based on timeframe
     */
    getTradeCompletionTime() {
        switch (this.tradingTimeframe) {
            case 'scalping':
                return 30000 + Math.random() * 30000; // 30-60 seconds
            case 'day':
                return 60000 + Math.random() * 60000; // 1-2 minutes
            case 'swing':
                return 120000 + Math.random() * 60000; // 2-3 minutes
            default:
                return 60000; // 1 minute
        }
    }

    /**
     * Complete a trade (simulated)
     */
    completeTrade(trade) {
        // Get current price
        const currentPrice = window.priceFeed ? window.priceFeed.getCurrentPrice() : trade.entryPrice;
        
        // Calculate profit/loss
        let profitLoss = 0;
        if (trade.type === 'buy') {
            profitLoss = ((currentPrice - trade.entryPrice) / trade.entryPrice) * 100 * trade.leverage;
        } else {
            profitLoss = ((trade.entryPrice - currentPrice) / trade.entryPrice) * 100 * trade.leverage;
        }
        
        // Add some randomness to make it more realistic
        profitLoss = profitLoss + (Math.random() * 2 - 1);
        
        // Update trade
        trade.exitPrice = currentPrice;
        trade.status = 'closed';
        trade.profitLoss = profitLoss;
        trade.closedAt = new Date();
        
        // Update daily P/L
        this.dailyPL += profitLoss;
        
        // Log trade completion
        this.addToSystemLog(`Closed ${trade.type.toUpperCase()} trade with ${profitLoss > 0 ? 'profit' : 'loss'} of ${Math.abs(profitLoss).toFixed(2)}%`);
        this.addToTradingHistory(`Closed ${trade.type.toUpperCase()} with ${profitLoss > 0 ? '+' : ''}${profitLoss.toFixed(2)}%`);
        
        // Update UI
        this.updateDailyPL();
        
        // Show notification for significant trades
        if (Math.abs(profitLoss) > 5) {
            this.showNotification(
                `Trade closed with ${profitLoss > 0 ? 'profit' : 'loss'} of ${Math.abs(profitLoss).toFixed(2)}%`,
                profitLoss > 0 ? 'success' : 'danger'
            );
        }
        
        // Check if we've reached daily loss limit
        if (this.dailyPL <= -this.maxDailyLoss) {
            this.addToSystemLog('Daily loss limit reached');
            this.showNotification('Daily loss limit reached', 'warning');
            this.stopTrading();
        }
        
        // Check if we've reached daily profit target
        if (this.dailyPL >= this.dailyProfitTarget) {
            this.addToSystemLog('Daily profit target reached');
            this.showNotification('Daily profit target reached!', 'success');
            this.stopTrading();
        }
    }

    /**
     * Handle price update
     */
    handlePriceUpdate(price, percentChange) {
        // If trading is active, check for significant price movements
        if (this.isTrading && Math.abs(percentChange) > 1) {
            this.addToSystemLog(`Significant price movement: ${percentChange > 0 ? '+' : ''}${percentChange.toFixed(2)}%`);
            
            // If using AI strategy, generate a new signal on significant movements
            if (this.currentStrategy === 'ai') {
                this.generateTradingSignal(price);
            }
        }
    }

    /**
     * Update AI status in UI
     */
    updateAIStatus(status, signal, confidence, trend) {
        const statusElement = document.getElementById('ai-status-value');
        const signalElement = document.getElementById('ai-last-signal');
        const confidenceElement = document.getElementById('ai-confidence');
        const trendElement = document.getElementById('ai-market-trend');
        
        if (statusElement) statusElement.textContent = status;
        if (signalElement) signalElement.textContent = signal.charAt(0).toUpperCase() + signal.slice(1);
        if (confidenceElement) confidenceElement.textContent = confidence;
        if (trendElement) trendElement.textContent = trend.charAt(0).toUpperCase() + trend.slice(1);
    }

    /**
     * Update trading status in UI
     */
    updateTradingStatus() {
        // Update start/stop buttons
        const startButton = document.getElementById('start-trading');
        const stopButton = document.getElementById('stop-trading');
        
        if (startButton && stopButton) {
            if (this.isTrading) {
                startButton.disabled = true;
                stopButton.disabled = false;
            } else {
                startButton.disabled = !this.walletConnected;
                stopButton.disabled = true;
            }
        }
    }

    /**
     * Update daily P/L display
     */
    updateDailyPL() {
        // Find daily P/L element
        const dailyPLElement = document.querySelector('.card:nth-child(4) .strategy-details div:nth-child(1) span:nth-child(2)');
        
        if (dailyPLElement) {
            dailyPLElement.textContent = `${this.dailyPL > 0 ? '+' : ''}${this.dailyPL.toFixed(2)}%`;
            dailyPLElement.className = this.dailyPL >= 0 ? 'positive' : 'negative';
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
     * Add entry to trading history
     */
    addToTradingHistory(message) {
        const tradingHistory = document.getElementById('trading-history');
        if (tradingHistory) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'log-time';
            timestamp.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.textContent = message;
            
            logEntry.appendChild(timestamp);
            logEntry.appendChild(logMessage);
            tradingHistory.appendChild(logEntry);
            
            // Remove "No trades yet" message if it exists
            const noTradesMessage = tradingHistory.querySelector('.log-entry:first-child');
            if (noTradesMessage && noTradesMessage.textContent.includes('No trades yet')) {
                tradingHistory.removeChild(noTradesMessage);
            }
            
            // Scroll to bottom
            tradingHistory.scrollTop = tradingHistory.scrollHeight;
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type) {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        // Add to document
        document.body.appendChild(notification);
        
        // Remove after a delay
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => {
                document.body.removeChild(notification);
            }, 500);
        }, 3000);
    }

    /**
     * Get trading statistics
     */
    getStatistics() {
        const closedTrades = this.trades.filter(trade => trade.status === 'closed');
        
        if (closedTrades.length === 0) {
            return {
                totalTrades: 0,
                winRate: 0,
                averageProfit: 0,
                averageLoss: 0,
                profitFactor: 0
            };
        }
        
        const winningTrades = closedTrades.filter(trade => trade.profitLoss > 0);
        const losingTrades = closedTrades.filter(trade => trade.profitLoss <= 0);
        
        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
        
        return {
            totalTrades: closedTrades.length,
            winRate: (winningTrades.length / closedTrades.length) * 100,
            averageProfit: winningTrades.length > 0 ? totalProfit / winningTrades.length : 0,
            averageLoss: losingTrades.length > 0 ? totalLoss / losingTrades.length : 0,
            profitFactor: totalLoss > 0 ? totalProfit / totalLoss : 0
        };
    }
}

// Initialize trade execution when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize trade execution
    window.tradeExecution = new TradeExecution();
    window.tradeExecution.initialize();
});
