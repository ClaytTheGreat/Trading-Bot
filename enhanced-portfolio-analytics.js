/**
 * Enhanced Portfolio Analytics Module
 * 
 * This module provides comprehensive portfolio analytics and visualization
 * for the trading bot, similar to debank.com as requested by the user.
 */

class PortfolioAnalytics {
    constructor() {
        this.isInitialized = false;
        this.portfolioData = {
            totalValue: 0,
            dailyPnL: 0,
            weeklyPnL: 0,
            monthlyPnL: 0,
            allTimePnL: 0,
            trades: {
                total: 0,
                won: 0,
                lost: 0,
                winRate: 0
            },
            history: [],
            valueHistory: []
        };
        
        this.chartInstances = {};
        this.updateInterval = null;
        this.updateFrequency = 5000; // 5 seconds
        this.maxHistoryPoints = 100;
    }
    
    /**
     * Initialize portfolio analytics
     */
    async initialize() {
        console.log('Initializing Portfolio Analytics...');
        
        try {
            // Create UI elements
            this.createAnalyticsUI();
            
            // Start data updates
            this.startDataUpdates();
            
            // Initialize charts
            this.initializeCharts();
            
            this.isInitialized = true;
            
            return {
                success: true,
                message: 'Portfolio Analytics initialized'
            };
        } catch (error) {
            console.error('Error initializing Portfolio Analytics:', error);
            
            return {
                success: false,
                message: 'Error initializing Portfolio Analytics: ' + error.message
            };
        }
    }
    
    /**
     * Create analytics UI elements
     */
    createAnalyticsUI() {
        // Check if analytics container exists
        const analyticsContainer = document.getElementById('portfolio-analytics');
        if (!analyticsContainer) {
            console.warn('Portfolio analytics container not found');
            return;
        }
        
        // Create analytics dashboard
        analyticsContainer.innerHTML = `
            <div class="analytics-header">
                <h2>Portfolio Analytics</h2>
                <div class="time-selector">
                    <button class="time-btn active" data-timeframe="day">Day</button>
                    <button class="time-btn" data-timeframe="week">Week</button>
                    <button class="time-btn" data-timeframe="month">Month</button>
                    <button class="time-btn" data-timeframe="all">All</button>
                </div>
            </div>
            
            <div class="analytics-overview">
                <div class="overview-card total-value">
                    <div class="card-label">Total Value</div>
                    <div class="card-value" id="total-portfolio-value">$0.00</div>
                </div>
                <div class="overview-card pnl">
                    <div class="card-label">Profit/Loss</div>
                    <div class="card-value" id="portfolio-pnl">+0.00%</div>
                </div>
                <div class="overview-card trades">
                    <div class="card-label">Trades</div>
                    <div class="card-value" id="total-trades">0</div>
                </div>
                <div class="overview-card win-rate">
                    <div class="card-label">Win Rate</div>
                    <div class="card-value" id="win-rate">0%</div>
                </div>
            </div>
            
            <div class="analytics-charts">
                <div class="chart-container">
                    <h3>Portfolio Value</h3>
                    <canvas id="portfolio-value-chart"></canvas>
                </div>
                <div class="chart-container">
                    <h3>Trade Performance</h3>
                    <canvas id="trade-performance-chart"></canvas>
                </div>
            </div>
            
            <div class="analytics-details">
                <div class="details-header">
                    <h3>Recent Trades</h3>
                </div>
                <div class="details-table-container">
                    <table class="details-table">
                        <thead>
                            <tr>
                                <th>Time</th>
                                <th>Type</th>
                                <th>Price</th>
                                <th>Size</th>
                                <th>P/L</th>
                            </tr>
                        </thead>
                        <tbody id="trade-history-table">
                            <tr class="empty-state">
                                <td colspan="5">No trades yet</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        // Add event listeners
        const timeButtons = document.querySelectorAll('.time-btn');
        timeButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Remove active class from all buttons
                timeButtons.forEach(btn => btn.classList.remove('active'));
                
                // Add active class to clicked button
                button.classList.add('active');
                
                // Update charts for selected timeframe
                const timeframe = button.getAttribute('data-timeframe');
                this.updateChartsForTimeframe(timeframe);
            });
        });
    }
    
    /**
     * Initialize charts
     */
    initializeCharts() {
        // Check if Chart.js is available
        if (!window.Chart) {
            console.warn('Chart.js not available, loading from CDN');
            
            // Load Chart.js from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                this.createCharts();
            };
            document.head.appendChild(script);
        } else {
            this.createCharts();
        }
    }
    
    /**
     * Create charts
     */
    createCharts() {
        // Portfolio value chart
        const valueChartCanvas = document.getElementById('portfolio-value-chart');
        if (valueChartCanvas) {
            this.chartInstances.portfolioValue = new Chart(valueChartCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'Portfolio Value',
                        data: [],
                        borderColor: '#4CAF50',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    return `$${context.raw.toFixed(2)}`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            beginAtZero: false,
                            grid: {
                                color: 'rgba(200, 200, 200, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    return '$' + value.toFixed(2);
                                }
                            }
                        }
                    }
                }
            });
        }
        
        // Trade performance chart
        const performanceChartCanvas = document.getElementById('trade-performance-chart');
        if (performanceChartCanvas) {
            this.chartInstances.tradePerformance = new Chart(performanceChartCanvas, {
                type: 'bar',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'P/L',
                        data: [],
                        backgroundColor: function(context) {
                            const value = context.dataset.data[context.dataIndex];
                            return value >= 0 ? 'rgba(76, 175, 80, 0.7)' : 'rgba(244, 67, 54, 0.7)';
                        },
                        borderColor: function(context) {
                            const value = context.dataset.data[context.dataIndex];
                            return value >= 0 ? '#4CAF50' : '#F44336';
                        },
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            mode: 'index',
                            intersect: false,
                            callbacks: {
                                label: function(context) {
                                    const value = context.raw;
                                    const sign = value >= 0 ? '+' : '';
                                    return `${sign}${value.toFixed(2)}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            }
                        },
                        y: {
                            grid: {
                                color: 'rgba(200, 200, 200, 0.1)'
                            },
                            ticks: {
                                callback: function(value) {
                                    const sign = value >= 0 ? '+' : '';
                                    return `${sign}${value.toFixed(2)}%`;
                                }
                            }
                        }
                    }
                }
            });
        }
    }
    
    /**
     * Start data updates
     */
    startDataUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up interval to update data
        this.updateInterval = setInterval(() => {
            this.updatePortfolioData();
        }, this.updateFrequency);
        
        // Initial update
        this.updatePortfolioData();
        
        // Listen for trade events
        document.addEventListener('tradeExecuted', (event) => {
            if (event.detail) {
                this.addTradeToHistory(event.detail);
            }
        });
    }
    
    /**
     * Update portfolio data
     */
    updatePortfolioData() {
        // Get data from trade execution module
        if (window.antarcticTradeExecution) {
            const tradeStatus = window.antarcticTradeExecution.getStatus();
            const tradeHistory = window.antarcticTradeExecution.getTradeHistory();
            
            // Update portfolio data
            this.portfolioData.totalValue = tradeStatus.balance || 0;
            this.portfolioData.dailyPnL = tradeStatus.dailyPnL || 0;
            
            // Calculate trade statistics
            let wonTrades = 0;
            let lostTrades = 0;
            
            tradeHistory.forEach(trade => {
                if (trade.type === 'exit' && trade.pnl !== undefined) {
                    if (trade.pnl >= 0) {
                        wonTrades++;
                    } else {
                        lostTrades++;
                    }
                }
            });
            
            this.portfolioData.trades.total = wonTrades + lostTrades;
            this.portfolioData.trades.won = wonTrades;
            this.portfolioData.trades.lost = lostTrades;
            this.portfolioData.trades.winRate = this.portfolioData.trades.total > 0 ? 
                (wonTrades / this.portfolioData.trades.total) * 100 : 0;
            
            // Add current value to history
            this.addValueHistoryPoint(this.portfolioData.totalValue);
            
            // Update UI
            this.updateAnalyticsUI();
        } else {
            // Simulate portfolio data for testing
            this.simulatePortfolioData();
        }
    }
    
    /**
     * Simulate portfolio data for testing
     */
    simulatePortfolioData() {
        // Simulate portfolio value
        const baseValue = 1000;
        const randomChange = (Math.random() * 20) - 10; // -10 to +10
        
        // Update portfolio data
        this.portfolioData.totalValue = baseValue + randomChange;
        this.portfolioData.dailyPnL = (randomChange / baseValue) * 100;
        this.portfolioData.weeklyPnL = this.portfolioData.dailyPnL * 2;
        this.portfolioData.monthlyPnL = this.portfolioData.dailyPnL * 5;
        this.portfolioData.allTimePnL = this.portfolioData.dailyPnL * 10;
        
        // Simulate trade statistics
        this.portfolioData.trades.total = 10;
        this.portfolioData.trades.won = 7;
        this.portfolioData.trades.lost = 3;
        this.portfolioData.trades.winRate = 70;
        
        // Add current value to history
        this.addValueHistoryPoint(this.portfolioData.totalValue);
        
        // Simulate trade history if empty
        if (this.portfolioData.history.length === 0) {
            for (let i = 0; i < 5; i++) {
                const isExit = i % 2 === 1;
                const timestamp = Date.now() - (i * 60000);
                
                if (isExit) {
                    this.addTradeToHistory({
                        type: 'exit',
                        price: 24.50 + (Math.random() * 2 - 1),
                        pnl: (Math.random() * 10) - 3, // -3 to +7
                        timestamp: timestamp
                    });
                } else {
                    this.addTradeToHistory({
                        type: 'entry',
                        direction: Math.random() > 0.5 ? 'long' : 'short',
                        price: 24.50 + (Math.random() * 2 - 1),
                        size: 0.5 + (Math.random() * 1.5),
                        leverage: 40,
                        timestamp: timestamp
                    });
                }
            }
        }
        
        // Update UI
        this.updateAnalyticsUI();
    }
    
    /**
     * Add value history point
     * @param {number} value - Portfolio value
     */
    addValueHistoryPoint(value) {
        const timestamp = new Date();
        
        this.portfolioData.valueHistory.push({
            value: value,
            timestamp: timestamp
        });
        
        // Limit history size
        if (this.portfolioData.valueHistory.length > this.maxHistoryPoints) {
            this.portfolioData.valueHistory.shift();
        }
        
        // Update value chart
        this.updateValueChart();
    }
    
    /**
     * Add trade to history
     * @param {Object} trade - Trade data
     */
    addTradeToHistory(trade) {
        this.portfolioData.history.unshift(trade);
        
        // Limit history size
        if (this.portfolioData.history.length > 50) {
            this.portfolioData.history.pop();
        }
        
        // Update trade history table
        this.updateTradeHistoryTable();
        
        // Update trade performance chart
        this.updateTradePerformanceChart();
    }
    
    /**
     * Update analytics UI
     */
    updateAnalyticsUI() {
        // Update total value
        const totalValueElement = document.getElementById('total-portfolio-value');
        if (totalValueElement) {
            totalValueElement.textContent = '$' + this.portfolioData.totalValue.toFixed(2);
        }
        
        // Update P/L
        const pnlElement = document.getElementById('portfolio-pnl');
        if (pnlElement) {
            const sign = this.portfolioData.dailyPnL >= 0 ? '+' : '';
            pnlElement.textContent = sign + this.portfolioData.dailyPnL.toFixed(2) + '%';
            pnlElement.className = 'card-value ' + (this.portfolioData.dailyPnL >= 0 ? 'positive' : 'negative');
        }
        
        // Update total trades
        const totalTradesElement = document.getElementById('total-trades');
        if (totalTradesElement) {
            totalTradesElement.textContent = this.portfolioData.trades.total;
        }
        
        // Update win rate
        const winRateElement = document.getElementById('win-rate');
        if (winRateElement) {
            winRateElement.textContent = this.portfolioData.trades.winRate.toFixed(1) + '%';
        }
    }
    
    /**
     * Update value chart
     */
    updateValueChart() {
        if (!this.chartInstances.portfolioValue) return;
        
        const chart = this.chartInstances.portfolioValue;
        const history = this.portfolioData.valueHistory;
        
        // Format data for chart
        const labels = history.map(point => {
            const date = new Date(point.timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const data = history.map(point => point.value);
        
        // Update chart data
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        
        // Update chart
        chart.update();
    }
    
    /**
     * Update trade performance chart
     */
    updateTradePerformanceChart() {
        if (!this.chartInstances.tradePerformance) return;
        
        const chart = this.chartInstances.tradePerformance;
        const history = this.portfolioData.history.filter(trade => trade.type === 'exit' && trade.pnl !== undefined);
        
        // Limit to last 10 trades
        const recentTrades = history.slice(0, 10).reverse();
        
        // Format data for chart
        const labels = recentTrades.map(trade => {
            const date = new Date(trade.timestamp);
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        });
        
        const data = recentTrades.map(trade => trade.pnl);
        
        // Update chart data
        chart.data.labels = labels;
        chart.data.datasets[0].data = data;
        
        // Update chart
        chart.update();
    }
    
    /**
     * Update trade history table
     */
    updateTradeHistoryTable() {
        const tableBody = document.getElementById('trade-history-table');
        if (!tableBody) return;
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Add trades to table
        const history = this.portfolioData.history;
        
        if (history.length === 0) {
            tableBody.innerHTML = '<tr class="empty-state"><td colspan="5">No trades yet</td></tr>';
            return;
        }
        
        history.forEach(trade => {
            const row = document.createElement('tr');
            
            // Format time
            const time = new Date(trade.timestamp).toLocaleTimeString();
            
            // Create row content
            if (trade.type === 'entry') {
                row.innerHTML = `
                    <td>${time}</td>
                    <td class="${trade.direction === 'long' ? 'buy' : 'sell'}">${trade.direction === 'long' ? 'BUY' : 'SELL'}</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>${trade.size.toFixed(4)}</td>
                    <td>-</td>
                `;
            } else if (trade.type === 'exit') {
                row.innerHTML = `
                    <td>${time}</td>
                    <td class="exit">CLOSE</td>
                    <td>$${trade.price.toFixed(2)}</td>
                    <td>-</td>
                    <td class="${trade.pnl >= 0 ? 'profit' : 'loss'}">${trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}%</td>
                `;
            }
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Update charts for selected timeframe
     * @param {string} timeframe - Selected timeframe (day, week, month, all)
     */
    updateChartsForTimeframe(timeframe) {
        // Get current time
        const now = new Date();
        
        // Calculate start time based on timeframe
        let startTime;
        
        switch (timeframe) {
            case 'day':
                startTime = new Date(now);
                startTime.setHours(0, 0, 0, 0);
                break;
                
            case 'week':
                startTime = new Date(now);
                startTime.setDate(now.getDate() - 7);
                break;
                
            case 'month':
                startTime = new Date(now);
                startTime.setMonth(now.getMonth() - 1);
                break;
                
            case 'all':
            default:
                startTime = new Date(0); // Beginning of time
                break;
        }
        
        // Filter value history by timeframe
        const filteredValueHistory = this.portfolioData.valueHistory.filter(point => {
            return new Date(point.timestamp) >= startTime;
        });
        
        // Filter trade history by timeframe
        const filteredTradeHistory = this.portfolioData.history.filter(trade => {
            return new Date(trade.timestamp) >= startTime;
        });
        
        // Update value chart
        if (this.chartInstances.portfolioValue) {
            const chart = this.chartInstances.portfolioValue;
            
            // Format data for chart
            const labels = filteredValueHistory.map(point => {
                const date = new Date(point.timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
            
            const data = filteredValueHistory.map(point => point.value);
            
            // Update chart data
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            
            // Update chart
            chart.update();
        }
        
        // Update trade performance chart
        if (this.chartInstances.tradePerformance) {
            const chart = this.chartInstances.tradePerformance;
            const exitTrades = filteredTradeHistory.filter(trade => trade.type === 'exit' && trade.pnl !== undefined);
            
            // Limit to last 10 trades
            const recentTrades = exitTrades.slice(0, 10).reverse();
            
            // Format data for chart
            const labels = recentTrades.map(trade => {
                const date = new Date(trade.timestamp);
                return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            });
            
            const data = recentTrades.map(trade => trade.pnl);
            
            // Update chart data
            chart.data.labels = labels;
            chart.data.datasets[0].data = data;
            
            // Update chart
            chart.update();
        }
        
        // Update P/L display based on timeframe
        const pnlElement = document.getElementById('portfolio-pnl');
        if (pnlElement) {
            let pnlValue;
            
            switch (timeframe) {
                case 'day':
                    pnlValue = this.portfolioData.dailyPnL;
                    break;
                    
                case 'week':
                    pnlValue = this.portfolioData.weeklyPnL;
                    break;
                    
                case 'month':
                    pnlValue = this.portfolioData.monthlyPnL;
                    break;
                    
                case 'all':
                default:
                    pnlValue = this.portfolioData.allTimePnL;
                    break;
            }
            
            const sign = pnlValue >= 0 ? '+' : '';
            pnlElement.textContent = sign + pnlValue.toFixed(2) + '%';
            pnlElement.className = 'card-value ' + (pnlValue >= 0 ? 'positive' : 'negative');
        }
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Clear interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Destroy charts
        for (const chartName in this.chartInstances) {
            if (this.chartInstances[chartName]) {
                this.chartInstances[chartName].destroy();
            }
        }
        
        console.log('Portfolio Analytics cleaned up');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.portfolioAnalytics = new PortfolioAnalytics();
    
    // Initialize
    window.portfolioAnalytics.initialize()
        .then(result => {
            console.log('Portfolio Analytics initialized:', result);
        })
        .catch(error => {
            console.error('Error initializing Portfolio Analytics:', error);
        });
});
