/**
 * Trading Timeframes Module for Trading Bot
 * Implements scalping, day trading, and swing trading options
 * with appropriate risk management and strategy adjustments
 */

class TradingTimeframes {
    constructor() {
        this.currentTimeframe = 'day'; // Default to day trading
        this.timeframes = {
            scalp: {
                name: 'Scalping',
                description: 'Very short-term trades (minutes to hours)',
                targetProfitPercent: 0.5,
                stopLossPercent: 0.3,
                maxTradesPerDay: 20,
                leverageOptions: [25, 30, 35, 40, 45, 50],
                defaultLeverage: 25,
                indicators: ['Market Cipher A', 'Market Cipher B', 'Lux Algo Price Action']
            },
            day: {
                name: 'Day Trading',
                description: 'Intraday trades (completed within same day)',
                targetProfitPercent: 2.0,
                stopLossPercent: 1.0,
                maxTradesPerDay: 5,
                leverageOptions: [20, 25, 30, 35, 40],
                defaultLeverage: 25,
                indicators: ['Market Cipher B', 'Lux Algo Price Action', 'Lux Algo Signals']
            },
            swing: {
                name: 'Swing Trading',
                description: 'Multi-day to multi-week positions',
                targetProfitPercent: 5.0,
                stopLossPercent: 3.0,
                maxTradesPerDay: 2,
                leverageOptions: [10, 15, 20, 25, 30],
                defaultLeverage: 15,
                indicators: ['Market Cipher D', 'Lux Algo Trend', 'Lux Algo Signals']
            }
        };
        
        this.selectedLeverage = this.timeframes[this.currentTimeframe].defaultLeverage;
        this.dailyLossLimit = 10; // Maximum 10% loss per day
        this.dailyProfitTarget = 20; // Target 20% profit per day
        this.currentDailyPL = 0; // Current daily profit/loss percentage
    }
    
    /**
     * Set the trading timeframe
     * @param {string} timeframe - 'scalp', 'day', or 'swing'
     */
    setTimeframe(timeframe) {
        if (this.timeframes[timeframe]) {
            this.currentTimeframe = timeframe;
            this.selectedLeverage = this.timeframes[timeframe].defaultLeverage;
            return {
                success: true,
                message: `Trading timeframe set to ${this.timeframes[timeframe].name}`,
                timeframeDetails: this.getTimeframeDetails()
            };
        } else {
            return {
                success: false,
                message: 'Invalid timeframe. Choose from: scalp, day, or swing'
            };
        }
    }
    
    /**
     * Set the leverage for trading
     * @param {number} leverage - Leverage value
     */
    setLeverage(leverage) {
        const options = this.timeframes[this.currentTimeframe].leverageOptions;
        if (options.includes(Number(leverage))) {
            this.selectedLeverage = Number(leverage);
            return {
                success: true,
                message: `Leverage set to ${leverage}x`,
                currentLeverage: this.selectedLeverage
            };
        } else {
            return {
                success: false,
                message: `Invalid leverage. Choose from: ${options.join(', ')}x`,
                availableOptions: options
            };
        }
    }
    
    /**
     * Get details about the current timeframe
     */
    getTimeframeDetails() {
        const tf = this.timeframes[this.currentTimeframe];
        return {
            name: tf.name,
            description: tf.description,
            targetProfit: tf.targetProfitPercent,
            stopLoss: tf.stopLossPercent,
            maxTradesPerDay: tf.maxTradesPerDay,
            currentLeverage: this.selectedLeverage,
            leverageOptions: tf.leverageOptions,
            recommendedIndicators: tf.indicators,
            dailyLossLimit: this.dailyLossLimit,
            dailyProfitTarget: this.dailyProfitTarget,
            currentDailyPL: this.currentDailyPL
        };
    }
    
    /**
     * Update the daily profit/loss
     * @param {number} plPercent - Profit/loss percentage to add
     */
    updateDailyPL(plPercent) {
        this.currentDailyPL += plPercent;
        
        // Check if we've hit the daily loss limit
        if (this.currentDailyPL <= -this.dailyLossLimit) {
            return {
                success: false,
                message: 'Daily loss limit reached. Trading halted for today.',
                shouldHalt: true,
                currentDailyPL: this.currentDailyPL
            };
        }
        
        // Check if we've hit the daily profit target
        if (this.currentDailyPL >= this.dailyProfitTarget) {
            return {
                success: true,
                message: 'Daily profit target reached! Consider securing profits.',
                targetReached: true,
                currentDailyPL: this.currentDailyPL
            };
        }
        
        return {
            success: true,
            message: 'Daily P/L updated',
            currentDailyPL: this.currentDailyPL
        };
    }
    
    /**
     * Reset daily profit/loss (typically called at start of trading day)
     */
    resetDailyPL() {
        this.currentDailyPL = 0;
        return {
            success: true,
            message: 'Daily P/L reset to 0',
            currentDailyPL: this.currentDailyPL
        };
    }
    
    /**
     * Get risk parameters based on current timeframe and leverage
     */
    getRiskParameters() {
        const tf = this.timeframes[this.currentTimeframe];
        
        // Adjust risk based on selected leverage
        const leverageRiskFactor = this.selectedLeverage / tf.defaultLeverage;
        
        return {
            positionSizePercent: 100 / tf.maxTradesPerDay / leverageRiskFactor,
            targetProfitPercent: tf.targetProfitPercent,
            stopLossPercent: tf.stopLossPercent,
            maxTradesPerDay: tf.maxTradesPerDay,
            leverage: this.selectedLeverage,
            dailyLossLimit: this.dailyLossLimit,
            currentDailyPL: this.currentDailyPL
        };
    }
}

// Export the class for use in other modules
window.TradingTimeframes = TradingTimeframes;
