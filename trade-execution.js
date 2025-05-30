/**
 * Trade Execution Module for Trading Bot
 * Implements automated trading with leverage and risk management
 * Integrates with Market Cipher and Lux Algo indicators
 */

class TradeExecution {
    constructor(timeframesManager) {
        this.timeframesManager = timeframesManager || new window.TradingTimeframes();
        this.isTrading = false;
        this.currentPosition = null;
        this.tradeHistory = [];
        this.dailyTradeCount = 0;
        this.lastTradeTime = null;
        this.marketData = {
            price: 0,
            volume: 0,
            timestamp: 0
        };
        
        // Market Cipher and Lux Algo indicator states
        this.indicators = {
            marketCipherA: {
                wavesTrend: 'neutral', // bullish, bearish, neutral
                moneyFlow: 0,          // -100 to 100
                triggerSignals: []     // array of signals
            },
            marketCipherB: {
                vwap: 0,
                rsi: 50,
                momentum: 0,
                diamonds: false,
                redDots: false,
                yellowDots: false,
                blueDots: false
            },
            luxAlgo: {
                trend: 'neutral',      // up, down, neutral
                signals: [],           // array of signals
                priceAction: 'neutral' // bullish, bearish, neutral
            }
        };
        
        // Risk management settings
        this.riskSettings = {
            maxDailyLoss: 10,          // 10% max daily loss
            maxPositionSize: 20,        // 20% of available balance per position
            useTrailingStop: true,
            trailingStopPercent: 1.5,
            takeProfitMultiplier: 1.5   // TP = SL * multiplier
        };
    }
    
    /**
     * Start automated trading
     */
    startTrading() {
        if (this.isTrading) {
            return {
                success: false,
                message: 'Trading already active'
            };
        }
        
        this.isTrading = true;
        this.timeframesManager.resetDailyPL();
        this.dailyTradeCount = 0;
        
        return {
            success: true,
            message: 'Automated trading started',
            timeframe: this.timeframesManager.getTimeframeDetails().name,
            leverage: this.timeframesManager.selectedLeverage + 'x'
        };
    }
    
    /**
     * Stop automated trading
     */
    stopTrading() {
        if (!this.isTrading) {
            return {
                success: false,
                message: 'Trading already stopped'
            };
        }
        
        this.isTrading = false;
        
        // Close any open positions when stopping
        if (this.currentPosition) {
            this.closePosition('Trading stopped manually');
        }
        
        return {
            success: true,
            message: 'Automated trading stopped',
            dailyPL: this.timeframesManager.currentDailyPL + '%',
            tradesExecuted: this.dailyTradeCount
        };
    }
    
    /**
     * Update market data and indicator values
     * @param {Object} data - Market and indicator data
     */
    updateMarketData(data) {
        // Update market price data
        if (data.price) this.marketData.price = data.price;
        if (data.volume) this.marketData.volume = data.volume;
        this.marketData.timestamp = Date.now();
        
        // Update Market Cipher indicators
        if (data.marketCipher) {
            if (data.marketCipher.a) {
                this.indicators.marketCipherA = {
                    ...this.indicators.marketCipherA,
                    ...data.marketCipher.a
                };
            }
            
            if (data.marketCipher.b) {
                this.indicators.marketCipherB = {
                    ...this.indicators.marketCipherB,
                    ...data.marketCipher.b
                };
            }
        }
        
        // Update Lux Algo indicators
        if (data.luxAlgo) {
            this.indicators.luxAlgo = {
                ...this.indicators.luxAlgo,
                ...data.luxAlgo
            };
        }
        
        // Process the updated data for potential trade signals
        if (this.isTrading) {
            return this.processTradeSignals();
        }
        
        return {
            success: true,
            message: 'Market data updated',
            price: this.marketData.price,
            indicators: {
                marketCipherA: this.indicators.marketCipherA,
                marketCipherB: this.indicators.marketCipherB,
                luxAlgo: this.indicators.luxAlgo
            }
        };
    }
    
    /**
     * Process indicator data for trade signals
     */
    processTradeSignals() {
        // Don't process if not in trading mode
        if (!this.isTrading) return { success: false, message: 'Trading not active' };
        
        // Check if we've reached max trades for the day based on timeframe
        const maxTrades = this.timeframesManager.getTimeframeDetails().maxTradesPerDay;
        if (this.dailyTradeCount >= maxTrades) {
            return {
                success: false,
                message: `Maximum daily trades (${maxTrades}) reached for ${this.timeframesManager.getTimeframeDetails().name}`,
                dailyTradeCount: this.dailyTradeCount
            };
        }
        
        // Check if we've hit daily loss limit
        if (this.timeframesManager.currentDailyPL <= -this.riskSettings.maxDailyLoss) {
            this.isTrading = false;
            return {
                success: false,
                message: 'Daily loss limit reached. Trading halted.',
                dailyPL: this.timeframesManager.currentDailyPL + '%'
            };
        }
        
        // If we have an open position, check for exit signals
        if (this.currentPosition) {
            return this.checkExitSignals();
        }
        
        // Otherwise check for entry signals
        return this.checkEntrySignals();
    }
    
    /**
     * Check for trade entry signals
     */
    checkEntrySignals() {
        let entrySignal = null;
        const timeframe = this.timeframesManager.currentTimeframe;
        
        // Different logic based on timeframe
        switch (timeframe) {
            case 'scalp':
                // Scalping strategy - quick in and out based on momentum and waves
                entrySignal = this.getScalpingSignal();
                break;
                
            case 'day':
                // Day trading strategy - based on intraday trends and signals
                entrySignal = this.getDayTradingSignal();
                break;
                
            case 'swing':
                // Swing trading strategy - based on longer-term trends
                entrySignal = this.getSwingTradingSignal();
                break;
        }
        
        // If we have a valid entry signal, execute the trade
        if (entrySignal) {
            return this.executeEntry(entrySignal.direction, entrySignal.reason);
        }
        
        return {
            success: true,
            message: 'No entry signals detected',
            timeframe: this.timeframesManager.getTimeframeDetails().name
        };
    }
    
    /**
     * Get entry signals for scalping strategy
     */
    getScalpingSignal() {
        // For scalping we primarily use Market Cipher B and Lux Algo Price Action
        const mcb = this.indicators.marketCipherB;
        const luxPA = this.indicators.luxAlgo.priceAction;
        
        // Long signal: Blue dots + bullish price action
        if (mcb.blueDots && luxPA === 'bullish') {
            return {
                direction: 'long',
                reason: 'Scalp Long: Market Cipher blue dots with bullish Lux Algo price action'
            };
        }
        
        // Short signal: Red dots + bearish price action
        if (mcb.redDots && luxPA === 'bearish') {
            return {
                direction: 'short',
                reason: 'Scalp Short: Market Cipher red dots with bearish Lux Algo price action'
            };
        }
        
        return null;
    }
    
    /**
     * Get entry signals for day trading strategy
     */
    getDayTradingSignal() {
        // For day trading we use Market Cipher B, VWAP, and Lux Algo Signals
        const mcb = this.indicators.marketCipherB;
        const luxSignals = this.indicators.luxAlgo.signals;
        
        // Long signal: Above VWAP + bullish momentum + buy signal
        if (this.marketData.price > mcb.vwap && 
            mcb.momentum > 0 && 
            luxSignals.includes('buy')) {
            return {
                direction: 'long',
                reason: 'Day Trade Long: Price above VWAP with bullish momentum and Lux Algo buy signal'
            };
        }
        
        // Short signal: Below VWAP + bearish momentum + sell signal
        if (this.marketData.price < mcb.vwap && 
            mcb.momentum < 0 && 
            luxSignals.includes('sell')) {
            return {
                direction: 'short',
                reason: 'Day Trade Short: Price below VWAP with bearish momentum and Lux Algo sell signal'
            };
        }
        
        return null;
    }
    
    /**
     * Get entry signals for swing trading strategy
     */
    getSwingTradingSignal() {
        // For swing trading we use Market Cipher A waves, Lux Algo Trend
        const mca = this.indicators.marketCipherA;
        const luxTrend = this.indicators.luxAlgo.trend;
        
        // Long signal: Bullish waves + uptrend
        if (mca.wavesTrend === 'bullish' && luxTrend === 'up') {
            return {
                direction: 'long',
                reason: 'Swing Trade Long: Market Cipher bullish waves with Lux Algo uptrend'
            };
        }
        
        // Short signal: Bearish waves + downtrend
        if (mca.wavesTrend === 'bearish' && luxTrend === 'down') {
            return {
                direction: 'short',
                reason: 'Swing Trade Short: Market Cipher bearish waves with Lux Algo downtrend'
            };
        }
        
        return null;
    }
    
    /**
     * Check for trade exit signals
     */
    checkExitSignals() {
        if (!this.currentPosition) {
            return {
                success: false,
                message: 'No open position to check exit signals'
            };
        }
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        
        // Check stop loss
        if (position.direction === 'long' && currentPrice <= position.stopLoss) {
            return this.closePosition('Stop loss triggered');
        }
        
        if (position.direction === 'short' && currentPrice >= position.stopLoss) {
            return this.closePosition('Stop loss triggered');
        }
        
        // Check take profit
        if (position.direction === 'long' && currentPrice >= position.takeProfit) {
            return this.closePosition('Take profit reached');
        }
        
        if (position.direction === 'short' && currentPrice <= position.takeProfit) {
            return this.closePosition('Take profit reached');
        }
        
        // Check for reversal signals based on timeframe
        const timeframe = this.timeframesManager.currentTimeframe;
        let exitSignal = null;
        
        switch (timeframe) {
            case 'scalp':
                exitSignal = this.getScalpingExitSignal();
                break;
                
            case 'day':
                exitSignal = this.getDayTradingExitSignal();
                break;
                
            case 'swing':
                exitSignal = this.getSwingTradingExitSignal();
                break;
        }
        
        if (exitSignal) {
            return this.closePosition(exitSignal.reason);
        }
        
        // Update trailing stop if enabled
        if (this.riskSettings.useTrailingStop) {
            this.updateTrailingStop();
        }
        
        return {
            success: true,
            message: 'Position maintained',
            position: this.currentPosition
        };
    }
    
    /**
     * Get exit signals for scalping strategy
     */
    getScalpingExitSignal() {
        const mcb = this.indicators.marketCipherB;
        const position = this.currentPosition;
        
        // Exit long: Yellow dots appear (early warning)
        if (position.direction === 'long' && mcb.yellowDots) {
            return {
                reason: 'Scalp exit: Yellow dots detected while in long position'
            };
        }
        
        // Exit short: Blue dots appear (potential reversal)
        if (position.direction === 'short' && mcb.blueDots) {
            return {
                reason: 'Scalp exit: Blue dots detected while in short position'
            };
        }
        
        return null;
    }
    
    /**
     * Get exit signals for day trading strategy
     */
    getDayTradingExitSignal() {
        const mcb = this.indicators.marketCipherB;
        const luxSignals = this.indicators.luxAlgo.signals;
        const position = this.currentPosition;
        
        // Exit long: Price crosses below VWAP or sell signal
        if (position.direction === 'long' && 
            (this.marketData.price < mcb.vwap || luxSignals.includes('sell'))) {
            return {
                reason: 'Day trade exit: Price below VWAP or sell signal while in long position'
            };
        }
        
        // Exit short: Price crosses above VWAP or buy signal
        if (position.direction === 'short' && 
            (this.marketData.price > mcb.vwap || luxSignals.includes('buy'))) {
            return {
                reason: 'Day trade exit: Price above VWAP or buy signal while in short position'
            };
        }
        
        return null;
    }
    
    /**
     * Get exit signals for swing trading strategy
     */
    getSwingTradingExitSignal() {
        const mca = this.indicators.marketCipherA;
        const luxTrend = this.indicators.luxAlgo.trend;
        const position = this.currentPosition;
        
        // Exit long: Waves turn bearish or trend changes
        if (position.direction === 'long' && 
            (mca.wavesTrend === 'bearish' || luxTrend === 'down')) {
            return {
                reason: 'Swing trade exit: Bearish waves or downtrend detected while in long position'
            };
        }
        
        // Exit short: Waves turn bullish or trend changes
        if (position.direction === 'short' && 
            (mca.wavesTrend === 'bullish' || luxTrend === 'up')) {
            return {
                reason: 'Swing trade exit: Bullish waves or uptrend detected while in short position'
            };
        }
        
        return null;
    }
    
    /**
     * Execute a trade entry
     * @param {string} direction - 'long' or 'short'
     * @param {string} reason - Reason for entry
     */
    executeEntry(direction, reason) {
        if (!this.isTrading) {
            return {
                success: false,
                message: 'Trading not active'
            };
        }
        
        if (this.currentPosition) {
            return {
                success: false,
                message: 'Cannot enter new position, already have an open position'
            };
        }
        
        const timeframeDetails = this.timeframesManager.getTimeframeDetails();
        const currentPrice = this.marketData.price;
        
        // Calculate stop loss and take profit based on timeframe
        const stopLossPercent = timeframeDetails.stopLoss;
        const takeProfitPercent = timeframeDetails.targetProfit;
        
        let stopLoss, takeProfit;
        
        if (direction === 'long') {
            stopLoss = currentPrice * (1 - stopLossPercent / 100);
            takeProfit = currentPrice * (1 + takeProfitPercent / 100);
        } else {
            stopLoss = currentPrice * (1 + stopLossPercent / 100);
            takeProfit = currentPrice * (1 - takeProfitPercent / 100);
        }
        
        // Create the position
        this.currentPosition = {
            direction,
            entryPrice: currentPrice,
            entryTime: Date.now(),
            stopLoss,
            initialStopLoss: stopLoss,
            takeProfit,
            leverage: this.timeframesManager.selectedLeverage,
            reason,
            timeframe: this.timeframesManager.currentTimeframe
        };
        
        this.dailyTradeCount++;
        this.lastTradeTime = Date.now();
        
        return {
            success: true,
            message: `Entered ${direction} position with ${this.timeframesManager.selectedLeverage}x leverage`,
            position: this.currentPosition
        };
    }
    
    /**
     * Close the current position
     * @param {string} reason - Reason for closing
     */
    closePosition(reason) {
        if (!this.currentPosition) {
            return {
                success: false,
                message: 'No open position to close'
            };
        }
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        const entryPrice = position.entryPrice;
        
        // Calculate profit/loss
        let plPercent;
        if (position.direction === 'long') {
            plPercent = ((currentPrice - entryPrice) / entryPrice) * 100 * position.leverage;
        } else {
            plPercent = ((entryPrice - currentPrice) / entryPrice) * 100 * position.leverage;
        }
        
        // Round to 2 decimal places
        plPercent = Math.round(plPercent * 100) / 100;
        
        // Update daily P/L
        const plResult = this.timeframesManager.updateDailyPL(plPercent);
        
        // Create trade record
        const trade = {
            direction: position.direction,
            entryPrice,
            entryTime: position.entryTime,
            exitPrice: currentPrice,
            exitTime: Date.now(),
            timeframe: position.timeframe,
            leverage: position.leverage,
            plPercent,
            reason: reason || 'Manual close',
            entryReason: position.reason
        };
        
        // Add to history
        this.tradeHistory.push(trade);
        
        // Clear current position
        this.currentPosition = null;
        
        return {
            success: true,
            message: `Closed ${position.direction} position with ${plPercent > 0 ? 'profit' : 'loss'} of ${plPercent}%`,
            trade,
            dailyPL: plResult.currentDailyPL + '%',
            dailyTradeCount: this.dailyTradeCount
        };
    }
    
    /**
     * Update trailing stop loss if price moves in favorable direction
     */
    updateTrailingStop() {
        if (!this.currentPosition || !this.riskSettings.useTrailingStop) return;
        
        const position = this.currentPosition;
        const currentPrice = this.marketData.price;
        const trailPercent = this.riskSettings.trailingStopPercent;
        
        if (position.direction === 'long') {
            // For long positions, move stop loss up as price increases
            const newStopPrice = currentPrice * (1 - trailPercent / 100);
            
            // Only move stop loss up, never down
            if (newStopPrice > position.stopLoss) {
                position.stopLoss = newStopPrice;
                return {
                    success: true,
                    message: 'Trailing stop updated',
                    newStopLoss: position.stopLoss
                };
            }
        } else {
            // For short positions, move stop loss down as price decreases
            const newStopPrice = currentPrice * (1 + trailPercent / 100);
            
            // Only move stop loss down, never up
            if (newStopPrice < position.stopLoss) {
                position.stopLoss = newStopPrice;
                return {
                    success: true,
                    message: 'Trailing stop updated',
                    newStopLoss: position.stopLoss
                };
            }
        }
        
        return {
            success: true,
            message: 'No trailing stop update needed'
        };
    }
    
    /**
     * Get trade history
     * @param {number} limit - Maximum number of trades to return
     */
    getTradeHistory(limit = 10) {
        return {
            success: true,
            history: this.tradeHistory.slice(-limit),
            totalTrades: this.tradeHistory.length,
            dailyTradeCount: this.dailyTradeCount,
            dailyPL: this.timeframesManager.currentDailyPL + '%'
        };
    }
    
    /**
     * Get current trading status
     */
    getStatus() {
        return {
            success: true,
            isTrading: this.isTrading,
            currentPosition: this.currentPosition,
            timeframe: this.timeframesManager.getTimeframeDetails(),
            dailyPL: this.timeframesManager.currentDailyPL + '%',
            dailyTradeCount: this.dailyTradeCount,
            lastTradeTime: this.lastTradeTime,
            marketData: this.marketData
        };
    }
}

// Export the class for use in other modules
window.TradeExecution = TradeExecution;
