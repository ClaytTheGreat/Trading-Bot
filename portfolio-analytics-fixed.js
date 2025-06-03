/**
 * Portfolio Analytics Module
 * Provides portfolio tracking, analytics, and visualization for the trading bot
 */

class PortfolioAnalytics {
    constructor() {
        this.portfolioValue = 1000.00; // Initial portfolio value
        this.dailyPnL = 0.00; // Daily profit and loss percentage
        this.winRate = 0.00; // Win rate percentage
        this.profitFactor = 0.00; // Profit factor
        this.maxDrawdown = 0.00; // Maximum drawdown percentage
        this.trades = []; // Array of trade objects
        this.portfolioHistory = []; // Array of portfolio value history
        this.chartInstance = null; // Chart.js instance
        
        // Record initial portfolio value in history
        this.recordPortfolioValue();
        
        // Set interval to update portfolio value (simulated for demo)
        setInterval(() => this.simulatePortfolioUpdate(), 60000);
    }
    
    /**
     * Initialize portfolio analytics
     */
    initialize() {
        console.log('Initializing portfolio analytics...');
        this.addToSystemLog('Initializing portfolio tracker and analytics...');
        
        // Update UI with initial values
        this.updateUI();
        
        // Initialize portfolio chart
        this.initializeChart();
        
        // Set up terminal toggle
        this.setupTerminalToggle();
        
        // Set up terminal input
        this.setupTerminalInput();
        
        return true;
    }
    
    /**
     * Initialize portfolio chart
     */
    initializeChart() {
        const chartContainer = document.getElementById('portfolio-chart-container');
        if (!chartContainer) return;
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.id = 'portfolio-chart';
        chartContainer.appendChild(canvas);
        
        // Generate initial data
        const labels = [];
        const data = [];
        const now = new Date();
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
            labels.push(date.toLocaleDateString());
            data.push(this.portfolioValue);
        }
        
        // Create chart
        const ctx = canvas.getContext('2d');
        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Portfolio Value',
                    data: data,
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
                            color: 'rgba(255, 255, 255, 0.7)',
                            maxRotation: 0,
                            autoSkip: true,
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)',
                            callback: function(value) {
                                return '$' + value.toFixed(2);
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
     * Set up terminal toggle
     */
    setupTerminalToggle() {
        const toggleTerminalBtn = document.getElementById('toggle-terminal');
        const portfolioTerminal = document.getElementById('portfolio-terminal');
        const terminalInputContainer = document.querySelector('.terminal-input-container');
        
        if (toggleTerminalBtn && portfolioTerminal && terminalInputContainer) {
            toggleTerminalBtn.addEventListener('click', function() {
                const isExpanded = portfolioTerminal.style.display !== 'none';
                
                if (isExpanded) {
                    portfolioTerminal.style.display = 'none';
                    terminalInputContainer.style.display = 'none';
                    toggleTerminalBtn.textContent = 'Expand';
                } else {
                    portfolioTerminal.style.display = 'block';
                    terminalInputContainer.style.display = 'flex';
                    toggleTerminalBtn.textContent = 'Collapse';
                    
                    // Focus input
                    const terminalInput = document.getElementById('terminal-input');
                    if (terminalInput) {
                        terminalInput.focus();
                    }
                }
            });
        }
    }
    
    /**
     * Set up terminal input
     */
    setupTerminalInput() {
        const terminalInput = document.getElementById('terminal-input');
        const portfolioTerminalContent = document.getElementById('portfolio-terminal');
        
        if (terminalInput && portfolioTerminalContent) {
            terminalInput.addEventListener('keydown', (event) => {
                if (event.key === 'Enter') {
                    const command = terminalInput.value.trim();
                    
                    if (command) {
                        // Add command to terminal
                        const commandLine = document.createElement('div');
                        commandLine.className = 'terminal-line';
                        commandLine.innerHTML = '<span style="color: var(--primary-color);">&gt;</span> ' + command;
                        portfolioTerminalContent.appendChild(commandLine);
                        
                        // Process command
                        this.processTerminalCommand(command, portfolioTerminalContent);
                        
                        // Clear input
                        terminalInput.value = '';
                        
                        // Scroll to bottom
                        portfolioTerminalContent.scrollTop = portfolioTerminalContent.scrollHeight;
                    }
                }
            });
        }
    }
    
    /**
     * Process terminal command
     */
    processTerminalCommand(command, terminalElement) {
        const response = document.createElement('div');
        response.className = 'terminal-line';
        
        switch (command.toLowerCase()) {
            case 'help':
                response.innerHTML = `
                    Available commands:<br>
                    - help: Show this help message<br>
                    - status: Show portfolio status<br>
                    - trades: Show recent trades<br>
                    - balance: Show current balance<br>
                    - performance: Show performance metrics<br>
                    - clear: Clear terminal
                `;
                break;
            case 'status':
                response.textContent = `Portfolio Status: Active, Current Value: $${this.portfolioValue.toFixed(2)}`;
                break;
            case 'trades':
                if (this.trades.length === 0) {
                    response.textContent = 'No trades executed yet.';
                } else {
                    let tradesText = 'Recent Trades:\n';
                    this.trades.slice(-5).forEach((trade, index) => {
                        tradesText += `${index + 1}. ${trade.type} ${trade.symbol} @ $${trade.price.toFixed(2)} | P/L: ${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}%\n`;
                    });
                    response.innerHTML = tradesText.replace(/\n/g, '<br>');
                }
                break;
            case 'balance':
                response.textContent = `Current Balance: $${this.portfolioValue.toFixed(2)}`;
                break;
            case 'performance':
                response.innerHTML = `
                    Performance Metrics:<br>
                    - Win Rate: ${this.winRate.toFixed(2)}%<br>
                    - Profit Factor: ${this.profitFactor.toFixed(2)}<br>
                    - Max Drawdown: ${this.maxDrawdown.toFixed(2)}%<br>
                    - Daily P/L: ${this.dailyPnL > 0 ? '+' : ''}${this.dailyPnL.toFixed(2)}%
                `;
                break;
            case 'clear':
                terminalElement.innerHTML = '';
                return;
            default:
                response.textContent = `Unknown command: ${command}. Type 'help' for available commands.`;
        }
        
        terminalElement.appendChild(response);
    }
    
    /**
     * Update UI with current values
     */
    updateUI() {
        // Update portfolio value
        const portfolioValueElement = document.getElementById('portfolio-value');
        if (portfolioValueElement) {
            portfolioValueElement.textContent = `$${this.portfolioValue.toFixed(2)}`;
        }
        
        // Update daily P/L
        const dailyPnLElement = document.getElementById('daily-pnl');
        if (dailyPnLElement) {
            dailyPnLElement.textContent = `${this.dailyPnL > 0 ? '+' : ''}${this.dailyPnL.toFixed(2)}%`;
            dailyPnLElement.className = this.dailyPnL >= 0 ? 'positive' : 'negative';
        }
        
        // Update win rate
        const winRateElement = document.getElementById('win-rate');
        if (winRateElement) {
            winRateElement.textContent = `${this.winRate.toFixed(2)}%`;
        }
        
        // Update profit factor
        const profitFactorElement = document.getElementById('profit-factor');
        if (profitFactorElement) {
            profitFactorElement.textContent = this.profitFactor.toFixed(2);
        }
        
        // Update max drawdown
        const maxDrawdownElement = document.getElementById('max-drawdown');
        if (maxDrawdownElement) {
            maxDrawdownElement.textContent = `${this.maxDrawdown.toFixed(2)}%`;
        }
    }
    
    /**
     * Record current portfolio value in history
     */
    recordPortfolioValue() {
        this.portfolioHistory.push({
            timestamp: new Date(),
            value: this.portfolioValue
        });
        
        // Limit history to 1000 entries
        if (this.portfolioHistory.length > 1000) {
            this.portfolioHistory.shift();
        }
    }
    
    /**
     * Update portfolio chart
     */
    updateChart() {
        if (!this.chartInstance) return;
        
        // Get last 30 days of data
        const historyData = this.portfolioHistory.slice(-30);
        
        // Update chart data
        this.chartInstance.data.labels = historyData.map(entry => entry.timestamp.toLocaleDateString());
        this.chartInstance.data.datasets[0].data = historyData.map(entry => entry.value);
        
        // Update chart
        this.chartInstance.update();
    }
    
    /**
     * Add trade to history
     */
    addTrade(trade) {
        this.trades.push({
            timestamp: new Date(),
            symbol: trade.symbol,
            type: trade.type, // 'BUY' or 'SELL'
            price: trade.price,
            amount: trade.amount,
            pnl: trade.pnl || 0
        });
        
        // Update win rate
        this.updateWinRate();
        
        // Update profit factor
        this.updateProfitFactor();
        
        // Update UI
        this.updateUI();
        
        // Add to trading history log
        this.addToTradingHistory(trade);
    }
    
    /**
     * Update win rate
     */
    updateWinRate() {
        if (this.trades.length === 0) {
            this.winRate = 0;
            return;
        }
        
        const winningTrades = this.trades.filter(trade => trade.pnl > 0).length;
        this.winRate = (winningTrades / this.trades.length) * 100;
    }
    
    /**
     * Update profit factor
     */
    updateProfitFactor() {
        if (this.trades.length === 0) {
            this.profitFactor = 0;
            return;
        }
        
        const grossProfit = this.trades
            .filter(trade => trade.pnl > 0)
            .reduce((sum, trade) => sum + trade.pnl, 0);
        
        const grossLoss = Math.abs(this.trades
            .filter(trade => trade.pnl < 0)
            .reduce((sum, trade) => sum + trade.pnl, 0));
        
        this.profitFactor = grossLoss === 0 ? grossProfit : grossProfit / grossLoss;
    }
    
    /**
     * Update maximum drawdown
     */
    updateMaxDrawdown() {
        if (this.portfolioHistory.length < 2) {
            this.maxDrawdown = 0;
            return;
        }
        
        let peak = this.portfolioHistory[0].value;
        let maxDrawdown = 0;
        
        for (let i = 1; i < this.portfolioHistory.length; i++) {
            const current = this.portfolioHistory[i].value;
            
            // Update peak if current value is higher
            if (current > peak) {
                peak = current;
            }
            
            // Calculate drawdown
            const drawdown = ((peak - current) / peak) * 100;
            
            // Update max drawdown if current drawdown is higher
            if (drawdown > maxDrawdown) {
                maxDrawdown = drawdown;
            }
        }
        
        this.maxDrawdown = maxDrawdown;
    }
    
    /**
     * Simulate portfolio update (for demo purposes)
     */
    simulatePortfolioUpdate() {
        // Generate random price change (-1% to +1%)
        const priceChange = (Math.random() * 2 - 1) * 0.01;
        
        // Update portfolio value
        this.portfolioValue *= (1 + priceChange);
        
        // Update daily P/L
        this.dailyPnL = priceChange * 100;
        
        // Record portfolio value
        this.recordPortfolioValue();
        
        // Update max drawdown
        this.updateMaxDrawdown();
        
        // Update UI
        this.updateUI();
        
        // Update chart
        this.updateChart();
        
        // Occasionally add simulated trade
        if (Math.random() < 0.1) {
            this.simulateTrade();
        }
    }
    
    /**
     * Simulate trade (for demo purposes)
     */
    simulateTrade() {
        const symbols = ['AVAX/USDT', 'ETH/USDT', 'BTC/USDT', 'SOL/USDT'];
        const types = ['BUY', 'SELL'];
        
        const trade = {
            symbol: symbols[Math.floor(Math.random() * symbols.length)],
            type: types[Math.floor(Math.random() * types.length)],
            price: 20 + Math.random() * 10,
            amount: 0.1 + Math.random() * 0.9,
            pnl: (Math.random() * 4 - 2) // -2% to +2%
        };
        
        this.addTrade(trade);
    }
    
    /**
     * Add message to trading history
     */
    addToTradingHistory(trade) {
        const tradingHistory = document.getElementById('trading-history');
        if (tradingHistory) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'log-time';
            timestamp.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.innerHTML = `${trade.type} ${trade.amount.toFixed(2)} ${trade.symbol} @ $${trade.price.toFixed(2)} | P/L: <span class="${trade.pnl >= 0 ? 'positive' : 'negative'}">${trade.pnl > 0 ? '+' : ''}${trade.pnl.toFixed(2)}%</span>`;
            
            logEntry.appendChild(timestamp);
            logEntry.appendChild(logMessage);
            tradingHistory.appendChild(logEntry);
            
            // Scroll to bottom
            tradingHistory.scrollTop = tradingHistory.scrollHeight;
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
