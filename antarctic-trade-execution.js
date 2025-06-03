/**
 * Antarctic Exchange Trade Execution Module
 * 
 * This module handles automatic trade execution on Antarctic Exchange
 * based on signals from the AI trading agent with Market Cipher strategies.
 */

class AntarcticTradeExecution {
    constructor() {
        this.isTrading = false;
        this.currentPosition = null;
        this.tradeHistory = [];
        this.dailyTradeCount = 0;
        this.dailyPnL = 0;
        this.startingBalance = 0;
        this.currentBalance = 0;
        this.lastTradeTime = null;
        this.marketData = {
            price: 0,
            volume: 0,
            timestamp: 0
        };
        
        // Risk management settings
        this.riskSettings = {
            maxDailyLoss: 10,          // 10% max daily loss
            maxPositionSize: 20,        // 20% of available balance per position
            useTrailingStop: true,
            trailingStopPercent: 1.5,
            takeProfitMultiplier: 1.5,  // TP = SL * multiplier
            defaultLeverage: 40,        // Default leverage
            currentLeverage: 40         // Current active leverage
        };
        
        // Trading timeframe settings
        this.timeframeSettings = {
            current: 'scalping',        // scalping, day, swing
            scalping: {
                name: 'Scalping',
                description: 'Very short-term trades (minutes to hours)',
                targetProfit: 4,        // 4% target
                stopLoss: 2,            // 2% stop loss
                maxTradesPerDay: 20
            },
            day: {
                name: 'Day Trading',
                description: 'Intraday trades (hours to a day)',
                targetProfit: 8,        // 8% target
                stopLoss: 4,            // 4% stop loss
                maxTradesPerDay: 5
            },
            swing: {
                name: 'Swing Trading',
                description: 'Medium-term trades (days to weeks)',
                targetProfit: 15,       // 15% target
                stopLoss: 7,            // 7% stop loss
                maxTradesPerDay: 2
            }
        };
        
        // Initialize event listeners
        this.setupEventListeners();
    }
    
    /**
     * Initialize the trade execution module
     */
    async initialize() {
        console.log('Initializing Antarctic Trade Execution module...');
        
        try {
            // Check if wallet is connected
            if (window.walletConnection && window.walletConnection.isConnected) {
                // Get account balance
                await this.updateAccountBalance();
            }
            
            // Set up connection with Antarctic Exchange API
            if (window.antarcticExchangeAPI) {
                // Initialize API
                await window.antarcticExchangeAPI.initialize();
                
                // Set up price update callback
                window.antarcticExchangeAPI.onPriceUpdate((price, marketData) => {
                    this.updateMarketData({
                        price: price,
                        volume: marketData.volume24h,
                        timestamp: Date.now()
                    });
                });
            }
            
            this.logToTerminal('Antarctic Trade Execution module initialized');
            
            return {
                success: true,
                message: 'Antarctic Trade Execution module initialized',
                balance: this.currentBalance
            };
        } catch (error) {
            console.error('Error initializing Antarctic Trade Execution:', error);
            this.logToTerminal('Error initializing: ' + error.message);
            
            return {
                success: false,
                message: 'Error initializing Antarctic Trade Execution: ' + error.message
            };
        }
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Listen for wallet connection changes
        if (window.walletConnection) {
            window.walletConnection.onConnectionChange(async (data) => {
                if (data.connected) {
                    this.logToTerminal('Wallet connected: ' + data.address);
                    await this.updateAccountBalance();
                } else {
                    this.logToTerminal('Wallet disconnected');
                    
                    // Stop trading if wallet disconnects
                    if (this.isTrading) {
                        await this.stopTrading();
                    }
                }
            });
        }
        
        // Listen for AI agent signals
        document.addEventListener('aiSignalGenerated', async (event) => {
            if (event.detail && this.isTrading) {
                await this.processAISignal(event.detail);
            }
        });
        
        // Listen for market data updates
        document.addEventListener('marketDataUpdate', (event) => {
            if (event.detail) {
                this.updateMarketData(event.detail);
            }
        });
    }
    
    /**
     * Update account balance
     */
    async updateAccountBalance() {
        try {
            if (!window.walletConnection || !window.walletConnection.isConnected) {
                return {
                    success: false,
                    message: 'Wallet not connected'
                };
            }
            
            // Get balance from wallet
            const balance = await window.walletConnection.updateBalance();
            
            if (balance !== null) {
                this.currentBalance = balance;
                
                // Set starting balance if not set
                if (!this.startingBalance) {
                    this.startingBalance = this.currentBalance;
                }
                
                // Calculate daily PnL
                this.dailyPnL = ((this.currentBalance - this.startingBalance) / this.startingBalance) * 100;
                
                // Update UI
                this.updateBalanceUI();
                
                return {
                    success: true,
                    balance: this.currentBalance,
                    dailyPnL: this.dailyPnL
                };
            } else {
                return {
                    success: false,
                    message: 'Failed to get balance'
                };
            }
        } catch (error) {
            console.error('Error updating account balance:', error);
            return {
                success: false,
                message: 'Error updating account balance: ' + error.message
            };
        }
    }
    
    /**
     * Update balance UI
     */
    updateBalanceUI() {
        // Update portfolio value
        const portfolioValueElement = document.getElementById('portfolio-value');
        if (portfolioValueElement) {
            portfolioValueElement.textContent = '$' + this.currentBalance.toFixed(2);
        }
        
        // Update daily P/L
        const dailyPLElement = document.getElementById('daily-pl');
        if (dailyPLElement) {
            const sign = this.dailyPnL >= 0 ? '+' : '';
            dailyPLElement.textContent = sign + this.dailyPnL.toFixed(2) + '%';
            dailyPLElement.className = this.dailyPnL >= 0 ? 'text-success' : 'text-danger';
        }
    }
    
    /**
     * Start automated trading
     */
    async startTrading() {
        // Check if wallet is connected
        if (!window.walletConnection || !window.walletConnection.isConnected) {
            this.showNotification('Please connect your wallet first', 'warning');
            this.logToTerminal('Cannot start trading: Wallet not connected');
            
            return {
                success: false,
                message: 'Wallet not connected'
            };
        }
        
        // Check if already trading
        if (this.isTrading) {
            return {
                success: false,
                message: 'Trading already active'
            };
        }
        
        // Reset daily metrics
        this.dailyTradeCount = 0;
        this.startingBalance = this.currentBalance;
        this.dailyPnL = 0;
        this.isTrading = true;
        
        // Log to terminal
        this.logToTerminal('Trading started with ' + this.timeframeSettings.current + ' timeframe and ' + this.riskSettings.currentLeverage + 'x leverage');
        
        // Show notification
        this.showNotification('Trading started with ' + this.timeframeSettings.current + ' timeframe and ' + this.riskSettings.currentLeverage + 'x leverage', 'success');
        
        // Update UI
        this.updateTradingUI();
        
        return {
            success: true,
            message: 'Automated trading started',
            timeframe: this.timeframeSettings[this.timeframeSettings.current].name,
            leverage: this.riskSettings.currentLeverage + 'x'
        };
    }
    
    /**
     * Stop automated trading
     */
    async stopTrading() {
        if (!this.isTrading) {
            return {
                success: false,
                message: 'Trading already stopped'
            };
        }
        
        this.isTrading = false;
        
        // Close any open positions when stopping
        if (this.currentPosition) {
            await this.closePosition('Trading stopped manually');
        }
        
        // Log to terminal
        this.logToTerminal('Trading stopped. Daily P/L: ' + this.dailyPnL.toFixed(2) + '%, Trades: ' + this.dailyTradeCount);
        
        // Show notification
        this.showNotification('Trading stopped', 'info');
        
        // Update UI
        this.updateTradingUI();
        
        return {
            success: true,
            message: 'Automated trading stopped',
            dailyPnL: this.dailyPnL.toFixed(2) + '%',
            tradesExecuted: this.dailyTradeCount
        };
    }
    
    /**
     * Update trading UI
     */
    updateTradingUI() {
        // Update trading status
        const tradingStatusElement = document.getElementById('trading-status');
        if (tradingStatusElement) {
            tradingStatusElement.textContent = this.isTrading ? 'Active' : 'Inactive';
            tradingStatusElement.className = 'status-value ' + (this.isTrading ? 'text-success' : 'text-danger');
        }
        
        // Update start/stop buttons
        const startButton = document.getElementById('start-trading-btn');
        const stopButton = document.getElementById('stop-trading-btn');
        
        if (startButton) {
            startButton.disabled = this.isTrading;
        }
        
        if (stopButton) {
            stopButton.disabled = !this.isTrading;
        }
    }
    
    /**
     * Update market data
     * @param {Object} data - Market data
     */
    updateMarketData(data) {
        // Update market data
        if (data.price) this.marketData.price = data.price;
        if (data.volume) this.marketData.volume = data.volume;
        this.marketData.timestamp = Date.now();
        
        // Update position if we have one
        if (this.currentPosition && this.isTrading) {
            this.checkPositionStatus();
        }
        
        return {
            success: true,
            message: 'Market data updated',
            price: this.marketData.price
        };
    }
    
    /**
     * Process AI signal
     * @param {Object} signal - AI signal data
     */
    async processAISignal(signal) {
        if (!this.isTrading) {
            this.logToTerminal('Received signal but trading is not active');
            return;
        }
        
        if (!window.walletConnection || !window.walletConnection.isConnected) {
            this.logToTerminal('Received signal but wallet is not connected');
            return;
        }
        
        this.logToTerminal(`Received ${signal.type} signal with ${signal.confidence}% confidence`);
        
        // Check if we've reached max trades for the day
        const maxTrades = this.timeframeSettings[this.timeframeSettings.current].maxTradesPerDay;
        if (this.dailyTradeCount >= maxTrades) {
            this.logToTerminal(`Maximum daily trades (${maxTrades}) reached for ${this.timeframeSettings[this.timeframeSettings.current].name}`);
            return;
        }
        
        // Check if we've hit daily loss limit
        if (this.dailyPnL <= -this.riskSettings.maxDailyLoss) {
            this.isTrading = false;
            this.logToTerminal('Daily loss limit reached. Trading halted. Daily P/L: ' + this.dailyPnL.toFixed(2) + '%');
            this.showNotification('Daily loss limit reached. Trading halted.', 'error');
            this.updateTradingUI();
            return;
        }
        
        // If we have an open position, check if we should close it
        if (this.currentPosition) {
            // Check if signal is opposite to our position
            if ((this.currentPosition.direction === 'long' && signal.type === 'SELL') ||
                (this.currentPosition.direction === 'short' && signal.type === 'BUY')) {
                
                await this.closePosition(`${signal.type} signal received while in ${this.currentPosition.direction} position`);
            }
        } else {
            // If we don't have a position, check if we should open one
            if (signal.type === 'BUY') {
                await this.executeEntry('long', `AI signal: BUY with ${signal.confidence}% confidence`);
            } else if (signal.type === 'SELL') {
                await this.executeEntry('short', `AI signal: SELL with ${signal.confidence}% confidence`);
            }
        }
    }
    
    /**
     * Check position status
     */
    async checkPositionStatus() {
        if (!this.currentPosition || !this.isTrading) return;
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        
        // Check stop loss
        if (position.direction === 'long' && currentPrice <= position.stopLoss) {
            await this.closePosition('Stop loss triggered');
            return;
        }
        
        if (position.direction === 'short' && currentPrice >= position.stopLoss) {
            await this.closePosition('Stop loss triggered');
            return;
        }
        
        // Check take profit
        if (position.direction === 'long' && currentPrice >= position.takeProfit) {
            await this.closePosition('Take profit reached');
            return;
        }
        
        if (position.direction === 'short' && currentPrice <= position.takeProfit) {
            await this.closePosition('Take profit reached');
            return;
        }
        
        // Update trailing stop if enabled
        if (this.riskSettings.useTrailingStop) {
            this.updateTrailingStop();
        }
    }
    
    /**
     * Execute a trade entry
     * @param {string} direction - 'long' or 'short'
     * @param {string} reason - Reason for entry
     */
    async executeEntry(direction, reason) {
        if (!this.isTrading || this.currentPosition) return;
        
        if (!window.walletConnection || !window.walletConnection.isConnected) {
            this.logToTerminal('Cannot execute trade: Wallet not connected');
            return;
        }
        
        const timeframe = this.timeframeSettings[this.timeframeSettings.current];
        const currentPrice = this.marketData.price;
        
        // Calculate stop loss and take profit
        const stopLossPercent = timeframe.stopLoss;
        const takeProfitPercent = timeframe.targetProfit;
        
        let stopLoss, takeProfit;
        
        if (direction === 'long') {
            stopLoss = currentPrice * (1 - stopLossPercent / 100);
            takeProfit = currentPrice * (1 + takeProfitPercent / 100);
        } else {
            stopLoss = currentPrice * (1 + stopLossPercent / 100);
            takeProfit = currentPrice * (1 - takeProfitPercent / 100);
        }
        
        // Calculate position size based on risk settings
        const leverage = this.riskSettings.currentLeverage;
        const maxPositionValue = this.currentBalance * (this.riskSettings.maxPositionSize / 100);
        const positionSize = maxPositionValue / currentPrice;
        
        // Create position object
        const position = {
            direction: direction,
            entryPrice: currentPrice,
            stopLoss: stopLoss,
            takeProfit: takeProfit,
            size: positionSize,
            leverage: leverage,
            entryTime: Date.now(),
            reason: reason
        };
        
        try {
            // Sign transaction with wallet
            const transactionData = {
                action: direction === 'long' ? 'buy' : 'sell',
                symbol: 'AVAX/USDT',
                amount: positionSize,
                price: currentPrice,
                leverage: leverage
            };
            
            const signResult = await window.walletConnection.signAntarcticTransaction(transactionData);
            
            if (!signResult || !signResult.success) {
                this.logToTerminal(`Failed to sign ${direction} transaction: ${signResult?.error || 'Unknown error'}`);
                this.showNotification(`Failed to sign transaction: ${signResult?.error || 'Unknown error'}`, 'error');
                return;
            }
            
            // Place order on Antarctic Exchange
            let orderResult;
            
            if (window.antarcticExchangeAPI) {
                orderResult = await window.antarcticExchangeAPI.placeOrder({
                    symbol: 'AVAX/USDT',
                    type: 'market',
                    side: direction === 'long' ? 'buy' : 'sell',
                    amount: positionSize,
                    leverage: leverage,
                    signature: signResult.signature
                });
            } else {
                // Simulate order for testing
                orderResult = {
                    success: true,
                    orderId: 'sim_' + Math.random().toString(36).substring(2, 15),
                    message: 'Order simulated successfully'
                };
            }
            
            if (orderResult.success) {
                // Update position with order details
                position.orderId = orderResult.orderId;
                this.currentPosition = position;
                this.dailyTradeCount++;
                this.lastTradeTime = Date.now();
                
                // Log to terminal
                this.logToTerminal(`${direction.toUpperCase()} position opened at $${currentPrice.toFixed(2)} with ${leverage}x leverage. Size: ${positionSize.toFixed(4)} AVAX`);
                
                // Show notification
                this.showNotification(`${direction.toUpperCase()} position opened at $${currentPrice.toFixed(2)}`, 'success');
                
                // Add to trade history
                this.addTradeToHistory({
                    type: 'entry',
                    direction: direction,
                    price: currentPrice,
                    size: positionSize,
                    leverage: leverage,
                    timestamp: Date.now(),
                    reason: reason
                });
                
                return {
                    success: true,
                    message: `${direction.toUpperCase()} position opened`,
                    position: this.currentPosition
                };
            } else {
                this.logToTerminal(`Failed to open ${direction} position: ${orderResult.message}`);
                this.showNotification(`Failed to open position: ${orderResult.message}`, 'error');
                
                return {
                    success: false,
                    message: `Failed to open ${direction} position: ${orderResult.message}`
                };
            }
        } catch (error) {
            console.error('Error executing entry:', error);
            this.logToTerminal(`Error executing ${direction} entry: ${error.message}`);
            
            return {
                success: false,
                message: `Error executing ${direction} entry: ${error.message}`
            };
        }
    }
    
    /**
     * Close current position
     * @param {string} reason - Reason for closing
     */
    async closePosition(reason) {
        if (!this.currentPosition) return;
        
        if (!window.walletConnection || !window.walletConnection.isConnected) {
            this.logToTerminal('Cannot close position: Wallet not connected');
            return;
        }
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        
        try {
            // Sign transaction with wallet
            const transactionData = {
                action: position.direction === 'long' ? 'sell' : 'buy',
                symbol: 'AVAX/USDT',
                amount: position.size,
                price: currentPrice
            };
            
            const signResult = await window.walletConnection.signAntarcticTransaction(transactionData);
            
            if (!signResult || !signResult.success) {
                this.logToTerminal(`Failed to sign close position transaction: ${signResult?.error || 'Unknown error'}`);
                this.showNotification(`Failed to sign transaction: ${signResult?.error || 'Unknown error'}`, 'error');
                return;
            }
            
            // Place close order on Antarctic Exchange
            let orderResult;
            
            if (window.antarcticExchangeAPI) {
                orderResult = await window.antarcticExchangeAPI.placeOrder({
                    symbol: 'AVAX/USDT',
                    type: 'market',
                    side: position.direction === 'long' ? 'sell' : 'buy',
                    amount: position.size,
                    signature: signResult.signature
                });
            } else {
                // Simulate order for testing
                orderResult = {
                    success: true,
                    orderId: 'sim_' + Math.random().toString(36).substring(2, 15),
                    message: 'Order simulated successfully'
                };
            }
            
            if (orderResult.success) {
                // Calculate profit/loss
                let pnl;
                if (position.direction === 'long') {
                    pnl = ((currentPrice - position.entryPrice) / position.entryPrice) * 100 * position.leverage;
                } else {
                    pnl = ((position.entryPrice - currentPrice) / position.entryPrice) * 100 * position.leverage;
                }
                
                // Log to terminal
                this.logToTerminal(`Position closed at $${currentPrice.toFixed(2)}. P/L: ${pnl.toFixed(2)}%. Reason: ${reason}`);
                
                // Show notification
                this.showNotification(`Position closed. P/L: ${pnl.toFixed(2)}%`, pnl >= 0 ? 'success' : 'warning');
                
                // Add to trade history
                this.addTradeToHistory({
                    type: 'exit',
                    price: currentPrice,
                    pnl: pnl,
                    timestamp: Date.now(),
                    reason: reason
                });
                
                // Update account balance
                await this.updateAccountBalance();
                
                // Clear current position
                this.currentPosition = null;
                
                return {
                    success: true,
                    message: 'Position closed',
                    pnl: pnl
                };
            } else {
                this.logToTerminal(`Failed to close position: ${orderResult.message}`);
                this.showNotification(`Failed to close position: ${orderResult.message}`, 'error');
                
                return {
                    success: false,
                    message: `Failed to close position: ${orderResult.message}`
                };
            }
        } catch (error) {
            console.error('Error closing position:', error);
            this.logToTerminal(`Error closing position: ${error.message}`);
            
            return {
                success: false,
                message: `Error closing position: ${error.message}`
            };
        }
    }
    
    /**
     * Update trailing stop loss
     */
    updateTrailingStop() {
        if (!this.currentPosition || !this.riskSettings.useTrailingStop) return;
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        const trailPercent = this.riskSettings.trailingStopPercent;
        
        // Update trailing stop for long position
        if (position.direction === 'long') {
            // Calculate new potential stop loss
            const newStopLoss = currentPrice * (1 - trailPercent / 100);
            
            // Only move stop loss up, never down
            if (newStopLoss > position.stopLoss) {
                position.stopLoss = newStopLoss;
                this.logToTerminal(`Trailing stop updated to $${newStopLoss.toFixed(2)}`);
            }
        }
        // Update trailing stop for short position
        else if (position.direction === 'short') {
            // Calculate new potential stop loss
            const newStopLoss = currentPrice * (1 + trailPercent / 100);
            
            // Only move stop loss down, never up
            if (newStopLoss < position.stopLoss) {
                position.stopLoss = newStopLoss;
                this.logToTerminal(`Trailing stop updated to $${newStopLoss.toFixed(2)}`);
            }
        }
    }
    
    /**
     * Add trade to history
     * @param {Object} trade - Trade data
     */
    addTradeToHistory(trade) {
        // Add to internal history
        this.tradeHistory.push(trade);
        
        // Update UI
        const tradeHistoryElement = document.getElementById('trade-history');
        if (!tradeHistoryElement) return;
        
        // Create trade entry
        const tradeEntry = document.createElement('div');
        tradeEntry.className = 'trade-entry';
        
        let tradeContent = '';
        
        if (trade.type === 'entry') {
            tradeContent = `
                <span class="trade-time">${new Date(trade.timestamp).toLocaleTimeString()}</span>
                <span class="trade-action ${trade.direction === 'long' ? 'buy' : 'sell'}">
                    ${trade.direction === 'long' ? 'BUY' : 'SELL'}
                </span>
                <span class="trade-details">
                    ${trade.size.toFixed(4)} AVAX @ $${trade.price.toFixed(2)} (${trade.leverage}x)
                </span>
            `;
        } else if (trade.type === 'exit') {
            tradeContent = `
                <span class="trade-time">${new Date(trade.timestamp).toLocaleTimeString()}</span>
                <span class="trade-action exit">CLOSE</span>
                <span class="trade-details">
                    @ $${trade.price.toFixed(2)} 
                    <span class="trade-pnl ${trade.pnl >= 0 ? 'profit' : 'loss'}">
                        ${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}%
                    </span>
                </span>
            `;
        }
        
        tradeEntry.innerHTML = tradeContent;
        
        // Add to container
        tradeHistoryElement.insertBefore(tradeEntry, tradeHistoryElement.firstChild);
        
        // Update trade count
        const totalTradesElement = document.getElementById('total-trades');
        if (totalTradesElement) {
            totalTradesElement.textContent = this.dailyTradeCount;
        }
    }
    
    /**
     * Set trading timeframe
     * @param {string} timeframe - 'scalping', 'day', or 'swing'
     */
    setTimeframe(timeframe) {
        if (!['scalping', 'day', 'swing'].includes(timeframe)) {
            return {
                success: false,
                message: 'Invalid timeframe'
            };
        }
        
        this.timeframeSettings.current = timeframe;
        
        // Log to terminal
        this.logToTerminal(`Timeframe changed to ${this.timeframeSettings[timeframe].name}`);
        
        // Update UI
        this.updateTimeframeUI();
        
        return {
            success: true,
            message: `Timeframe set to ${this.timeframeSettings[timeframe].name}`,
            timeframe: this.timeframeSettings[timeframe]
        };
    }
    
    /**
     * Update timeframe UI
     */
    updateTimeframeUI() {
        // Update timeframe buttons
        const timeframeButtons = document.querySelectorAll('.timeframe-btn');
        if (timeframeButtons) {
            timeframeButtons.forEach(button => {
                const timeframe = button.getAttribute('data-timeframe');
                if (timeframe === this.timeframeSettings.current) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
        
        // Update timeframe description
        const timeframeDesc = document.getElementById('timeframe-description');
        if (timeframeDesc) {
            const tf = this.timeframeSettings[this.timeframeSettings.current];
            timeframeDesc.textContent = tf.description;
        }
        
        // Update target profit
        const targetProfit = document.getElementById('target-profit');
        if (targetProfit) {
            targetProfit.textContent = this.timeframeSettings[this.timeframeSettings.current].targetProfit + '%';
        }
        
        // Update stop loss
        const stopLoss = document.getElementById('stop-loss');
        if (stopLoss) {
            stopLoss.textContent = this.timeframeSettings[this.timeframeSettings.current].stopLoss + '%';
        }
        
        // Update max trades
        const maxTrades = document.getElementById('max-trades');
        if (maxTrades) {
            maxTrades.textContent = this.timeframeSettings[this.timeframeSettings.current].maxTradesPerDay;
        }
    }
    
    /**
     * Set leverage
     * @param {number} leverage - Leverage value
     */
    setLeverage(leverage) {
        // Validate leverage
        if (isNaN(leverage) || leverage < 1 || leverage > 100) {
            return {
                success: false,
                message: 'Invalid leverage value'
            };
        }
        
        this.riskSettings.currentLeverage = leverage;
        
        // Log to terminal
        this.logToTerminal(`Leverage changed to ${leverage}x`);
        
        // Update UI
        this.updateLeverageUI();
        
        return {
            success: true,
            message: `Leverage set to ${leverage}x`,
            leverage: leverage
        };
    }
    
    /**
     * Update leverage UI
     */
    updateLeverageUI() {
        // Update leverage buttons
        const leverageButtons = document.querySelectorAll('.leverage-btn');
        if (leverageButtons) {
            leverageButtons.forEach(button => {
                const leverage = parseInt(button.getAttribute('data-leverage'));
                if (leverage === this.riskSettings.currentLeverage) {
                    button.classList.add('active');
                } else {
                    button.classList.remove('active');
                }
            });
        }
    }
    
    /**
     * Log message to terminal
     * @param {string} message - Message to log
     */
    logToTerminal(message) {
        // Create terminal event
        const event = new CustomEvent('terminalLog', {
            detail: {
                timestamp: new Date().toLocaleTimeString(),
                message: message
            }
        });
        document.dispatchEvent(event);
        
        // Also log to console
        console.log(`[${new Date().toLocaleTimeString()}] ${message}`);
        
        // Update terminal UI
        const terminalElement = document.getElementById('terminal-content');
        if (terminalElement) {
            const logEntry = document.createElement('div');
            logEntry.className = 'terminal-line';
            logEntry.innerHTML = `<span class="terminal-time">${new Date().toLocaleTimeString()}</span> ${message}`;
            
            terminalElement.appendChild(logEntry);
            
            // Scroll to bottom
            terminalElement.scrollTop = terminalElement.scrollHeight;
        }
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
     * Get current trading status
     */
    getStatus() {
        return {
            isTrading: this.isTrading,
            currentPosition: this.currentPosition,
            dailyTradeCount: this.dailyTradeCount,
            dailyPnL: this.dailyPnL,
            balance: this.currentBalance,
            timeframe: this.timeframeSettings[this.timeframeSettings.current],
            leverage: this.riskSettings.currentLeverage
        };
    }
    
    /**
     * Get trade history
     */
    getTradeHistory() {
        return this.tradeHistory;
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.antarcticTradeExecution = new AntarcticTradeExecution();
    
    // Initialize
    window.antarcticTradeExecution.initialize()
        .then(result => {
            console.log('Antarctic Trade Execution initialized:', result);
            
            // Add event listeners for UI elements
            const startButton = document.getElementById('start-trading-btn');
            if (startButton) {
                startButton.addEventListener('click', () => {
                    window.antarcticTradeExecution.startTrading();
                });
            }
            
            const stopButton = document.getElementById('stop-trading-btn');
            if (stopButton) {
                stopButton.addEventListener('click', () => {
                    window.antarcticTradeExecution.stopTrading();
                });
            }
            
            // Timeframe buttons
            const timeframeButtons = document.querySelectorAll('.timeframe-btn');
            if (timeframeButtons) {
                timeframeButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const timeframe = button.getAttribute('data-timeframe');
                        window.antarcticTradeExecution.setTimeframe(timeframe);
                    });
                });
            }
            
            // Leverage buttons
            const leverageButtons = document.querySelectorAll('.leverage-btn');
            if (leverageButtons) {
                leverageButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const leverage = parseInt(button.getAttribute('data-leverage'));
                        window.antarcticTradeExecution.setLeverage(leverage);
                    });
                });
            }
            
            // Update UI
            window.antarcticTradeExecution.updateTimeframeUI();
            window.antarcticTradeExecution.updateLeverageUI();
            window.antarcticTradeExecution.updateTradingUI();
        })
        .catch(error => {
            console.error('Error initializing Antarctic Trade Execution:', error);
        });
});
