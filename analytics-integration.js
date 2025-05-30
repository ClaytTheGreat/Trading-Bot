/**
 * Integration Module for Analytics and Terminal
 * Connects the analytics and terminal modules to the main trading bot
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize analytics and terminal after main components are loaded
    setTimeout(() => {
        initializeAnalyticsAndTerminal();
    }, 2000);
    
    /**
     * Initialize analytics and terminal modules
     */
    function initializeAnalyticsAndTerminal() {
        // Check if required components exist
        if (!window.TradeAnalytics || !window.PortfolioTerminal) {
            console.error('Analytics or Terminal modules not found');
            return;
        }
        
        // Create analytics instance
        const analytics = new TradeAnalytics();
        analytics.initialize(1000); // Start with $1000 portfolio
        
        // Create terminal instance
        const terminal = new PortfolioTerminal(analytics);
        terminal.initialize();
        
        // Connect analytics to trade execution
        connectAnalyticsToTradeExecution(analytics);
        
        // Add to window for external access
        window.tradeAnalytics = analytics;
        window.portfolioTerminal = terminal;
        
        // Add to system log
        addToSystemLog('Analytics and Terminal modules initialized');
    }
    
    /**
     * Connect analytics to trade execution
     * @param {TradeAnalytics} analytics - Analytics instance
     */
    function connectAnalyticsToTradeExecution(analytics) {
        // Check if trade execution exists
        if (!window.tradeExecution) {
            console.warn('Trade execution module not found, using simulation');
            
            // Create simulated trade execution if not available
            simulateTradeExecution(analytics);
            return;
        }
        
        // Connect to actual trade execution
        const originalOnPositionClosed = window.tradeExecution.onPositionClosed;
        
        window.tradeExecution.onPositionClosed = (position) => {
            // Call original handler if exists
            if (typeof originalOnPositionClosed === 'function') {
                originalOnPositionClosed(position);
            }
            
            // Add trade to analytics
            analytics.addTrade({
                timestamp: Date.now(),
                pair: position.pair || 'AVAX/USDT',
                direction: position.direction,
                entryPrice: position.entryPrice,
                exitPrice: position.exitPrice,
                size: position.size,
                profitLoss: position.profitLoss,
                timeframe: window.timeframes ? window.timeframes.getTimeframeDetails().name : 'Day Trading'
            });
            
            addToSystemLog(`Trade added to analytics: ${position.direction} ${position.pair} with P&L: ${position.profitLoss}%`);
        };
        
        addToSystemLog('Analytics connected to trade execution module');
    }
    
    /**
     * Simulate trade execution for testing
     * @param {TradeAnalytics} analytics - Analytics instance
     */
    function simulateTradeExecution(analytics) {
        // Generate a simulated trade every 30 seconds
        setInterval(() => {
            // Generate random trade data
            const direction = Math.random() > 0.5 ? 'long' : 'short';
            const basePrice = 22.50 + (Math.random() * 2 - 1);
            const entryPrice = basePrice;
            const exitPrice = direction === 'long' 
                ? basePrice * (1 + (Math.random() * 0.05)) 
                : basePrice * (1 - (Math.random() * 0.05));
            const size = 0.5 + Math.random() * 1.5;
            const profitLoss = direction === 'long'
                ? ((exitPrice - entryPrice) / entryPrice) * 100
                : ((entryPrice - exitPrice) / entryPrice) * 100;
            
            // Create trade object
            const trade = {
                timestamp: Date.now(),
                pair: 'AVAX/USDT',
                direction: direction,
                type: direction === 'long' ? 'BUY' : 'SELL',
                entryPrice: entryPrice,
                exitPrice: exitPrice,
                size: size,
                profitLoss: profitLoss,
                timeframe: ['Scalping', 'Day Trading', 'Swing Trading'][Math.floor(Math.random() * 3)]
            };
            
            // Add trade to analytics
            analytics.addTrade(trade);
            
            addToSystemLog(`Simulated trade added: ${direction} AVAX/USDT with P&L: ${profitLoss.toFixed(2)}%`);
        }, 30000);
        
        // Add initial simulated trades
        addInitialSimulatedTrades(analytics);
        
        addToSystemLog('Trade simulation started for analytics testing');
    }
    
    /**
     * Add initial simulated trades for testing
     * @param {TradeAnalytics} analytics - Analytics instance
     */
    function addInitialSimulatedTrades(analytics) {
        // Add some initial trades for testing
        const initialTrades = [
            {
                timestamp: Date.now() - 86400000 * 5, // 5 days ago
                pair: 'AVAX/USDT',
                direction: 'long',
                type: 'BUY',
                entryPrice: 22.50,
                exitPrice: 23.10,
                size: 1.0,
                profitLoss: 2.67,
                timeframe: 'Day Trading'
            },
            {
                timestamp: Date.now() - 86400000 * 4, // 4 days ago
                pair: 'AVAX/USDT',
                direction: 'short',
                type: 'SELL',
                entryPrice: 23.20,
                exitPrice: 22.80,
                size: 1.5,
                profitLoss: 1.72,
                timeframe: 'Scalping'
            },
            {
                timestamp: Date.now() - 86400000 * 3, // 3 days ago
                pair: 'AVAX/USDT',
                direction: 'long',
                type: 'BUY',
                entryPrice: 22.70,
                exitPrice: 22.40,
                size: 1.2,
                profitLoss: -1.32,
                timeframe: 'Day Trading'
            },
            {
                timestamp: Date.now() - 86400000 * 2, // 2 days ago
                pair: 'AVAX/USDT',
                direction: 'long',
                type: 'BUY',
                entryPrice: 22.30,
                exitPrice: 22.90,
                size: 2.0,
                profitLoss: 2.69,
                timeframe: 'Swing Trading'
            },
            {
                timestamp: Date.now() - 86400000 * 1, // 1 day ago
                pair: 'AVAX/USDT',
                direction: 'short',
                type: 'SELL',
                entryPrice: 23.10,
                exitPrice: 22.50,
                size: 1.8,
                profitLoss: 2.60,
                timeframe: 'Scalping'
            },
            {
                timestamp: Date.now() - 3600000 * 5, // 5 hours ago
                pair: 'AVAX/USDT',
                direction: 'long',
                type: 'BUY',
                entryPrice: 22.40,
                exitPrice: 22.65,
                size: 1.0,
                profitLoss: 1.12,
                timeframe: 'Scalping'
            },
            {
                timestamp: Date.now() - 3600000 * 2, // 2 hours ago
                pair: 'AVAX/USDT',
                direction: 'short',
                type: 'SELL',
                entryPrice: 22.80,
                exitPrice: 22.95,
                size: 1.5,
                profitLoss: -0.66,
                timeframe: 'Day Trading'
            }
        ];
        
        // Add trades to analytics
        initialTrades.forEach(trade => {
            analytics.addTrade(trade);
        });
        
        addToSystemLog(`Added ${initialTrades.length} initial trades for analytics testing`);
    }
    
    /**
     * Add message to system log
     * @param {string} message - Message to add
     */
    function addToSystemLog(message) {
        const systemLog = document.getElementById('system-log');
        if (!systemLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const logTime = document.createElement('span');
        logTime.className = 'log-time';
        logTime.textContent = new Date().toLocaleTimeString();
        
        const logMessage = document.createElement('span');
        logMessage.textContent = message;
        
        logEntry.appendChild(logTime);
        logEntry.appendChild(logMessage);
        systemLog.appendChild(logEntry);
        
        // Scroll to bottom
        systemLog.scrollTop = systemLog.scrollHeight;
    }
});
