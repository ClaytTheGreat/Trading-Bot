/**
 * Portfolio Tracker and Analytics Module for Trading Bot
 * Provides detailed portfolio tracking, performance analytics, and visualization
 */

class PortfolioAnalytics {
    constructor() {
        this.portfolioValue = 1000; // Initial portfolio value in USD
        this.initialValue = 1000;
        this.trades = [];
        this.dailySnapshots = [];
        this.currentPosition = null;
        this.pnlHistory = [];
        this.winRate = 0;
        this.profitFactor = 0;
        this.maxDrawdown = 0;
        this.lastUpdate = null;
        this.updateInterval = null;
        this.chartInstances = {};
    }

    /**
     * Initialize portfolio analytics
     */
    initialize() {
        console.log('Initializing portfolio analytics...');
        this.addToSystemLog('Initializing portfolio tracker and analytics...');
        
        // Create portfolio analytics UI
        this.createAnalyticsUI();
        
        // Start regular updates
        this.startRegularUpdates();
        
        // Listen for trade events
        this.listenForTradeEvents();
        
        // Create initial charts
        this.createCharts();
        
        return true;
    }

    /**
     * Create portfolio analytics UI
     */
    createAnalyticsUI() {
        // Create portfolio analytics card if it doesn't exist
        let analyticsCard = document.querySelector('.card-grid .card:nth-child(8)');
        
        if (!analyticsCard) {
            analyticsCard = document.createElement('div');
            analyticsCard.className = 'card';
            
            const cardGrid = document.querySelector('.card-grid');
            if (cardGrid) {
                cardGrid.appendChild(analyticsCard);
            }
        }
        
        // Set up analytics card content
        analyticsCard.innerHTML = `
            <h2>Portfolio Analytics</h2>
            <div class="portfolio-summary">
                <div class="portfolio-value">
                    <span>Portfolio Value:</span>
                    <span id="portfolio-value">$${this.portfolioValue.toFixed(2)}</span>
                </div>
                <div class="portfolio-change">
                    <span>Daily P/L:</span>
                    <span id="daily-pnl">0.00%</span>
                </div>
                <div class="portfolio-metrics">
                    <div>
                        <span>Win Rate:</span>
                        <span id="win-rate">0.00%</span>
                    </div>
                    <div>
                        <span>Profit Factor:</span>
                        <span id="profit-factor">0.00</span>
                    </div>
                    <div>
                        <span>Max Drawdown:</span>
                        <span id="max-drawdown">0.00%</span>
                    </div>
                </div>
            </div>
            <div class="chart-container" id="portfolio-chart-container" style="height: 200px; margin-top: 15px;"></div>
            <div class="portfolio-terminal">
                <div class="terminal-header">
                    <span>Portfolio Terminal</span>
                    <button id="toggle-terminal" class="btn-small">Expand</button>
                </div>
                <div id="portfolio-terminal" class="terminal-content" style="display: none;">
                    <div class="terminal-line">Welcome to Portfolio Terminal</div>
                    <div class="terminal-line">Type 'help' for available commands</div>
                </div>
                <div class="terminal-input-container" style="display: none;">
                    <span>></span>
                    <input type="text" id="terminal-input" placeholder="Enter command...">
                </div>
            </div>
        `;
        
        // Add styles for portfolio analytics
        this.addAnalyticsStyles();
        
        // Set up terminal toggle
        const toggleTerminal = document.getElementById('toggle-terminal');
        if (toggleTerminal) {
            toggleTerminal.addEventListener('click', () => {
                const terminal = document.getElementById('portfolio-terminal');
                const inputContainer = document.querySelector('.terminal-input-container');
                
                if (terminal && inputContainer) {
                    const isVisible = terminal.style.display !== 'none';
                    
                    terminal.style.display = isVisible ? 'none' : 'block';
                    inputContainer.style.display = isVisible ? 'none' : 'flex';
                    toggleTerminal.textContent = isVisible ? 'Expand' : 'Collapse';
                    
                    if (!isVisible) {
                        // Focus input when terminal is expanded
                        const input = document.getElementById('terminal-input');
                        if (input) input.focus();
                    }
                }
            });
        }
        
        // Set up terminal input
        const terminalInput = document.getElementById('terminal-input');
        if (terminalInput) {
            terminalInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const command = terminalInput.value.trim();
                    this.processTerminalCommand(command);
                    terminalInput.value = '';
                }
            });
        }
    }

    /**
     * Add analytics styles
     */
    addAnalyticsStyles() {
        // Check if styles already exist
        if (document.getElementById('portfolio-analytics-styles')) return;
        
        // Create style element
        const style = document.createElement('style');
        style.id = 'portfolio-analytics-styles';
        
        // Add styles
        style.textContent = `
            .portfolio-summary {
                margin-bottom: 15px;
            }
            
            .portfolio-value {
                display: flex;
                justify-content: space-between;
                font-size: 18px;
                font-weight: 600;
                margin-bottom: 10px;
            }
            
            .portfolio-change {
                display: flex;
                justify-content: space-between;
                margin-bottom: 15px;
            }
            
            .portfolio-metrics {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 10px;
                background-color: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border-radius: 4px;
            }
            
            .portfolio-metrics div {
                display: flex;
                flex-direction: column;
                align-items: center;
            }
            
            .portfolio-metrics span:first-child {
                font-size: 12px;
                color: var(--text-secondary);
            }
            
            .portfolio-metrics span:last-child {
                font-size: 16px;
                font-weight: 600;
            }
            
            .portfolio-terminal {
                margin-top: 15px;
                background-color: rgba(0, 0, 0, 0.3);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .terminal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 12px;
                background-color: rgba(0, 0, 0, 0.2);
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .btn-small {
                background-color: var(--primary-color);
                color: var(--text-color);
                border: none;
                padding: 4px 8px;
                border-radius: 2px;
                cursor: pointer;
                font-size: 12px;
            }
            
            .terminal-content {
                height: 150px;
                overflow-y: auto;
                padding: 10px;
                font-family: 'Courier New', monospace;
                font-size: 14px;
            }
            
            .terminal-line {
                margin-bottom: 5px;
                word-break: break-all;
            }
            
            .terminal-input-container {
                display: flex;
                align-items: center;
                padding: 8px 12px;
                background-color: rgba(0, 0, 0, 0.2);
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .terminal-input-container span {
                color: var(--primary-color);
                margin-right: 8px;
                font-family: 'Courier New', monospace;
            }
            
            .terminal-input-container input {
                flex: 1;
                background-color: transparent;
                border: none;
                color: var(--text-color);
                font-family: 'Courier New', monospace;
                outline: none;
            }
        `;
        
        // Add to document
        document.head.appendChild(style);
    }

    /**
     * Start regular updates
     */
    startRegularUpdates() {
        // Update portfolio value every 5 seconds
        this.updateInterval = setInterval(() => {
            this.updatePortfolioValue();
            this.updateCharts();
        }, 5000);
    }

    /**
     * Listen for trade events
     */
    listenForTradeEvents() {
        // Listen for trade execution events
        document.addEventListener('tradeExecuted', (event) => {
            if (event.detail && event.detail.trade) {
                this.addTrade(event.detail.trade);
            }
        });
        
        // Listen for trade completion events
        document.addEventListener('tradeCompleted', (event) => {
            if (event.detail && event.detail.trade) {
                this.completeTrade(event.detail.trade);
            }
        });
    }

    /**
     * Add a new trade
     */
    addTrade(trade) {
        this.trades.push(trade);
        
        // Update current position
        this.currentPosition = {
            type: trade.type,
            entryPrice: trade.entryPrice,
            leverage: trade.leverage,
            timestamp: trade.timestamp,
            size: this.portfolioValue * 0.1 // Use 10% of portfolio for each trade
        };
        
        // Add to terminal
        this.addToTerminal(`New ${trade.type.toUpperCase()} position opened at $${trade.entryPrice.toFixed(2)} with ${trade.leverage}x leverage`);
        
        // Update UI
        this.updatePortfolioValue();
    }

    /**
     * Complete a trade
     */
    completeTrade(trade) {
        // Find the trade in the trades array
        const index = this.trades.findIndex(t => t.id === trade.id);
        
        if (index !== -1) {
            // Update trade
            this.trades[index] = trade;
            
            // Calculate impact on portfolio
            const tradeSize = this.portfolioValue * 0.1; // 10% of portfolio
            const pnlAmount = (tradeSize * trade.profitLoss) / 100;
            
            // Update portfolio value
            this.portfolioValue += pnlAmount;
            
            // Add to PNL history
            this.pnlHistory.push({
                timestamp: new Date(),
                pnl: trade.profitLoss,
                portfolioValue: this.portfolioValue
            });
            
            // Reset current position
            this.currentPosition = null;
            
            // Add to terminal
            this.addToTerminal(`${trade.type.toUpperCase()} position closed with ${trade.profitLoss > 0 ? 'profit' : 'loss'} of ${Math.abs(trade.profitLoss).toFixed(2)}%`);
            
            // Update analytics
            this.updateAnalytics();
            
            // Update UI
            this.updatePortfolioValue();
        }
    }

    /**
     * Update portfolio value
     */
    updatePortfolioValue() {
        // Update portfolio value display
        const portfolioValueElement = document.getElementById('portfolio-value');
        if (portfolioValueElement) {
            portfolioValueElement.textContent = `$${this.portfolioValue.toFixed(2)}`;
        }
        
        // Calculate daily P/L
        const dailyPnlElement = document.getElementById('daily-pnl');
        if (dailyPnlElement) {
            const dailyPnl = this.calculateDailyPnL();
            dailyPnlElement.textContent = `${dailyPnl > 0 ? '+' : ''}${dailyPnl.toFixed(2)}%`;
            dailyPnlElement.className = dailyPnl >= 0 ? 'positive' : 'negative';
        }
        
        // Update metrics
        const winRateElement = document.getElementById('win-rate');
        const profitFactorElement = document.getElementById('profit-factor');
        const maxDrawdownElement = document.getElementById('max-drawdown');
        
        if (winRateElement && profitFactorElement && maxDrawdownElement) {
            winRateElement.textContent = `${this.winRate.toFixed(2)}%`;
            profitFactorElement.textContent = this.profitFactor.toFixed(2);
            maxDrawdownElement.textContent = `${this.maxDrawdown.toFixed(2)}%`;
        }
        
        // Take daily snapshot at midnight
        const now = new Date();
        if (this.lastUpdate && this.lastUpdate.getDate() !== now.getDate()) {
            this.takeDailySnapshot();
        }
        
        this.lastUpdate = now;
    }

    /**
     * Calculate daily P/L
     */
    calculateDailyPnL() {
        // Get today's trades
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const todayTrades = this.trades.filter(trade => {
            const tradeDate = new Date(trade.timestamp);
            return tradeDate >= today && trade.status === 'closed';
        });
        
        // Calculate P/L from today's trades
        let dailyPnl = 0;
        
        if (todayTrades.length > 0) {
            dailyPnl = todayTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        }
        
        return dailyPnl;
    }

    /**
     * Take daily snapshot
     */
    takeDailySnapshot() {
        const snapshot = {
            date: new Date(),
            portfolioValue: this.portfolioValue,
            dailyPnL: this.calculateDailyPnL(),
            trades: this.trades.filter(trade => {
                const tradeDate = new Date(trade.timestamp);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                return tradeDate >= today;
            }).length
        };
        
        this.dailySnapshots.push(snapshot);
        
        // Add to terminal
        this.addToTerminal(`Daily snapshot: Portfolio value $${this.portfolioValue.toFixed(2)}, P/L ${snapshot.dailyPnL > 0 ? '+' : ''}${snapshot.dailyPnL.toFixed(2)}%`);
    }

    /**
     * Update analytics
     */
    updateAnalytics() {
        const closedTrades = this.trades.filter(trade => trade.status === 'closed');
        
        if (closedTrades.length === 0) {
            this.winRate = 0;
            this.profitFactor = 0;
            this.maxDrawdown = 0;
            return;
        }
        
        // Calculate win rate
        const winningTrades = closedTrades.filter(trade => trade.profitLoss > 0);
        this.winRate = (winningTrades.length / closedTrades.length) * 100;
        
        // Calculate profit factor
        const totalProfit = winningTrades.reduce((sum, trade) => sum + trade.profitLoss, 0);
        const losingTrades = closedTrades.filter(trade => trade.profitLoss <= 0);
        const totalLoss = Math.abs(losingTrades.reduce((sum, trade) => sum + trade.profitLoss, 0));
        this.profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? 999 : 0;
        
        // Calculate max drawdown
        let peak = this.initialValue;
        let maxDrawdown = 0;
        
        for (const point of this.pnlHistory) {
            if (point.portfolioValue > peak) {
                peak = point.portfolioValue;
            }
            
            const drawdown = ((peak - point.portfolioValue) / peak) * 100;
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        this.maxDrawdown = maxDrawdown;
    }

    /**
     * Create charts
     */
    createCharts() {
        // Create portfolio value chart
        this.createPortfolioChart();
    }

    /**
     * Create portfolio chart
     */
    createPortfolioChart() {
        const chartContainer = document.getElementById('portfolio-chart-container');
        if (!chartContainer) return;
        
        // Create canvas if it doesn't exist
        let canvas = chartContainer.querySelector('canvas');
        if (!canvas) {
            canvas = document.createElement('canvas');
            canvas.id = 'portfolio-chart';
            chartContainer.appendChild(canvas);
        }
        
        // Create chart
        this.chartInstances.portfolio = new Chart(canvas, {
            type: 'line',
            data: {
                labels: [new Date().toLocaleTimeString()],
                datasets: [{
                    label: 'Portfolio Value',
                    data: [this.portfolioValue],
                    borderColor: '#4e74ff',
                    backgroundColor: 'rgba(78, 116, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value;
                            }
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return '$' + context.raw.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }

    /**
     * Update charts
     */
    updateCharts() {
        // Update portfolio chart
        if (this.chartInstances.portfolio) {
            const chart = this.chartInstances.portfolio;
            
            // Add new data point
            chart.data.labels.push(new Date().toLocaleTimeString());
            chart.data.datasets[0].data.push(this.portfolioValue);
            
            // Limit data points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            // Update chart
            chart.update();
        }
    }

    /**
     * Process terminal command
     */
    processTerminalCommand(command) {
        // Add command to terminal
        this.addToTerminal(`> ${command}`);
        
        // Process command
        switch (command.toLowerCase()) {
            case 'help':
                this.addToTerminal('Available commands:');
                this.addToTerminal('  help - Show this help message');
                this.addToTerminal('  stats - Show portfolio statistics');
                this.addToTerminal('  trades - Show recent trades');
                this.addToTerminal('  balance - Show current balance');
                this.addToTerminal('  position - Show current position');
                this.addToTerminal('  clear - Clear terminal');
                break;
                
            case 'stats':
                this.addToTerminal('Portfolio Statistics:');
                this.addToTerminal(`  Initial Value: $${this.initialValue.toFixed(2)}`);
                this.addToTerminal(`  Current Value: $${this.portfolioValue.toFixed(2)}`);
                this.addToTerminal(`  Total Return: ${((this.portfolioValue - this.initialValue) / this.initialValue * 100).toFixed(2)}%`);
                this.addToTerminal(`  Win Rate: ${this.winRate.toFixed(2)}%`);
                this.addToTerminal(`  Profit Factor: ${this.profitFactor.toFixed(2)}`);
                this.addToTerminal(`  Max Drawdown: ${this.maxDrawdown.toFixed(2)}%`);
                break;
                
            case 'trades':
                if (this.trades.length === 0) {
                    this.addToTerminal('No trades yet');
                } else {
                    this.addToTerminal('Recent Trades:');
                    
                    // Show last 5 trades
                    const recentTrades = this.trades.slice(-5).reverse();
                    
                    recentTrades.forEach(trade => {
                        const date = new Date(trade.timestamp).toLocaleString();
                        this.addToTerminal(`  ${date} - ${trade.type.toUpperCase()} ${trade.status} ${trade.profitLoss ? (trade.profitLoss > 0 ? '+' : '') + trade.profitLoss.toFixed(2) + '%' : ''}`);
                    });
                }
                break;
                
            case 'balance':
                this.addToTerminal(`Current Balance: $${this.portfolioValue.toFixed(2)}`);
                this.addToTerminal(`Daily P/L: ${this.calculateDailyPnL() > 0 ? '+' : ''}${this.calculateDailyPnL().toFixed(2)}%`);
                break;
                
            case 'position':
                if (this.currentPosition) {
                    this.addToTerminal('Current Position:');
                    this.addToTerminal(`  Type: ${this.currentPosition.type.toUpperCase()}`);
                    this.addToTerminal(`  Entry Price: $${this.currentPosition.entryPrice.toFixed(2)}`);
                    this.addToTerminal(`  Leverage: ${this.currentPosition.leverage}x`);
                    this.addToTerminal(`  Size: $${this.currentPosition.size.toFixed(2)}`);
                    
                    // Calculate current P/L if price feed is available
                    if (window.priceFeed) {
                        const currentPrice = window.priceFeed.getCurrentPrice();
                        if (currentPrice) {
                            let pnl = 0;
                            
                            if (this.currentPosition.type === 'buy') {
                                pnl = ((currentPrice - this.currentPosition.entryPrice) / this.currentPosition.entryPrice) * 100 * this.currentPosition.leverage;
                            } else {
                                pnl = ((this.currentPosition.entryPrice - currentPrice) / this.currentPosition.entryPrice) * 100 * this.currentPosition.leverage;
                            }
                            
                            this.addToTerminal(`  Current P/L: ${pnl > 0 ? '+' : ''}${pnl.toFixed(2)}%`);
                        }
                    }
                } else {
                    this.addToTerminal('No active position');
                }
                break;
                
            case 'clear':
                const terminal = document.getElementById('portfolio-terminal');
                if (terminal) {
                    terminal.innerHTML = '';
                }
                break;
                
            default:
                this.addToTerminal(`Unknown command: ${command}`);
                this.addToTerminal('Type "help" for available commands');
        }
    }

    /**
     * Add message to terminal
     */
    addToTerminal(message) {
        const terminal = document.getElementById('portfolio-terminal');
        if (terminal) {
            const line = document.createElement('div');
            line.className = 'terminal-line';
            line.textContent = message;
            
            terminal.appendChild(line);
            
            // Scroll to bottom
            terminal.scrollTop = terminal.scrollHeight;
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
}

// Initialize portfolio analytics when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize portfolio analytics
    window.portfolioAnalytics = new PortfolioAnalytics();
    window.portfolioAnalytics.initialize();
});
