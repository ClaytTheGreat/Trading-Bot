/**
 * Trade Analytics Module for Trading Bot
 * Implements data visualization and analytics for trade performance
 * Provides portfolio value tracking and performance metrics
 */

class TradeAnalytics {
    constructor() {
        this.trades = [];
        this.portfolioValue = 1000; // Default starting value in USDT
        this.initialValue = 1000;
        this.dailyPnL = 0;
        this.weeklyPnL = 0;
        this.monthlyPnL = 0;
        this.allTimePnL = 0;
        this.winRate = 0;
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
        this.averageWin = 0;
        this.averageLoss = 0;
        this.largestWin = 0;
        this.largestLoss = 0;
        this.profitFactor = 0;
        this.sharpeRatio = 0;
        this.dailyReturns = [];
        this.timeframePerformance = {
            scalping: { trades: 0, winRate: 0, pnl: 0 },
            dayTrading: { trades: 0, winRate: 0, pnl: 0 },
            swingTrading: { trades: 0, winRate: 0, pnl: 0 }
        };
        this.assetAllocation = {};
        this.charts = {};
        this.lastUpdate = Date.now();
        
        // Historical data for charts
        this.historicalData = {
            portfolioValue: [],
            pnl: [],
            winRate: [],
            trades: []
        };
    }
    
    /**
     * Initialize analytics module
     * @param {number} initialValue - Initial portfolio value
     */
    initialize(initialValue = 1000) {
        this.portfolioValue = initialValue;
        this.initialValue = initialValue;
        
        // Initialize charts
        this.initializeCharts();
        
        // Add initial data point
        this.addHistoricalDataPoint();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        return {
            success: true,
            message: 'Analytics module initialized',
            portfolioValue: this.portfolioValue
        };
    }
    
    /**
     * Initialize chart objects
     */
    initializeCharts() {
        // Create chart containers if they don't exist
        this.createChartContainers();
        
        // Portfolio value chart
        this.charts.portfolioValue = this.createChart(
            'portfolio-chart',
            'Portfolio Value',
            'USDT',
            'line',
            ['#4e74ff']
        );
        
        // PnL chart
        this.charts.pnl = this.createChart(
            'pnl-chart',
            'Profit & Loss',
            '%',
            'bar',
            ['#28a745', '#dc3545']
        );
        
        // Win rate chart
        this.charts.winRate = this.createChart(
            'winrate-chart',
            'Win Rate',
            '%',
            'doughnut',
            ['#28a745', '#dc3545']
        );
        
        // Trade distribution chart
        this.charts.tradeDistribution = this.createChart(
            'trade-distribution-chart',
            'Trade Distribution',
            'Trades',
            'pie',
            ['#4e74ff', '#28a745', '#ffc107']
        );
        
        // Asset allocation chart
        this.charts.assetAllocation = this.createChart(
            'asset-allocation-chart',
            'Asset Allocation',
            'USDT',
            'doughnut',
            ['#4e74ff', '#28a745', '#ffc107', '#dc3545', '#17a2b8']
        );
    }
    
    /**
     * Create chart containers in the DOM
     */
    createChartContainers() {
        // Check if analytics card exists
        let analyticsCard = document.querySelector('.analytics-card');
        
        if (!analyticsCard) {
            // Create analytics card
            analyticsCard = document.createElement('div');
            analyticsCard.className = 'card analytics-card';
            analyticsCard.innerHTML = `
                <h2>Trade Analytics</h2>
                <div class="analytics-tabs">
                    <button class="analytics-tab active" data-tab="overview">Overview</button>
                    <button class="analytics-tab" data-tab="performance">Performance</button>
                    <button class="analytics-tab" data-tab="trades">Trades</button>
                    <button class="analytics-tab" data-tab="assets">Assets</button>
                </div>
                <div class="analytics-content">
                    <div class="analytics-tab-content active" id="overview-tab">
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title">Portfolio Value</div>
                                <div class="metric-value" id="portfolio-value">$1,000.00</div>
                                <div class="metric-change" id="portfolio-change">0.00%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">Daily P&L</div>
                                <div class="metric-value" id="daily-pnl">$0.00</div>
                                <div class="metric-change" id="daily-pnl-percent">0.00%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">Win Rate</div>
                                <div class="metric-value" id="win-rate">0.00%</div>
                                <div class="metric-change" id="win-rate-change">0 trades</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">Profit Factor</div>
                                <div class="metric-value" id="profit-factor">0.00</div>
                                <div class="metric-change" id="profit-factor-change">0.00</div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="portfolio-chart"></canvas>
                        </div>
                    </div>
                    <div class="analytics-tab-content" id="performance-tab">
                        <div class="metrics-grid">
                            <div class="metric-card">
                                <div class="metric-title">Daily P&L</div>
                                <div class="metric-value" id="daily-pnl-2">$0.00</div>
                                <div class="metric-change" id="daily-pnl-percent-2">0.00%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">Weekly P&L</div>
                                <div class="metric-value" id="weekly-pnl">$0.00</div>
                                <div class="metric-change" id="weekly-pnl-percent">0.00%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">Monthly P&L</div>
                                <div class="metric-value" id="monthly-pnl">$0.00</div>
                                <div class="metric-change" id="monthly-pnl-percent">0.00%</div>
                            </div>
                            <div class="metric-card">
                                <div class="metric-title">All-Time P&L</div>
                                <div class="metric-value" id="all-time-pnl">$0.00</div>
                                <div class="metric-change" id="all-time-pnl-percent">0.00%</div>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="pnl-chart"></canvas>
                        </div>
                        <div class="performance-metrics">
                            <div class="performance-metric">
                                <div class="metric-label">Sharpe Ratio</div>
                                <div class="metric-value" id="sharpe-ratio">0.00</div>
                            </div>
                            <div class="performance-metric">
                                <div class="metric-label">Avg. Win</div>
                                <div class="metric-value" id="avg-win">$0.00</div>
                            </div>
                            <div class="performance-metric">
                                <div class="metric-label">Avg. Loss</div>
                                <div class="metric-value" id="avg-loss">$0.00</div>
                            </div>
                            <div class="performance-metric">
                                <div class="metric-label">Largest Win</div>
                                <div class="metric-value" id="largest-win">$0.00</div>
                            </div>
                            <div class="performance-metric">
                                <div class="metric-label">Largest Loss</div>
                                <div class="metric-value" id="largest-loss">$0.00</div>
                            </div>
                        </div>
                    </div>
                    <div class="analytics-tab-content" id="trades-tab">
                        <div class="chart-row">
                            <div class="chart-container half">
                                <canvas id="winrate-chart"></canvas>
                            </div>
                            <div class="chart-container half">
                                <canvas id="trade-distribution-chart"></canvas>
                            </div>
                        </div>
                        <div class="timeframe-performance">
                            <h3>Strategy Performance</h3>
                            <div class="timeframe-grid">
                                <div class="timeframe-card">
                                    <div class="timeframe-title">Scalping</div>
                                    <div class="timeframe-value" id="scalping-pnl">$0.00</div>
                                    <div class="timeframe-stats">
                                        <span id="scalping-trades">0 trades</span>
                                        <span id="scalping-winrate">0.00%</span>
                                    </div>
                                </div>
                                <div class="timeframe-card">
                                    <div class="timeframe-title">Day Trading</div>
                                    <div class="timeframe-value" id="daytrading-pnl">$0.00</div>
                                    <div class="timeframe-stats">
                                        <span id="daytrading-trades">0 trades</span>
                                        <span id="daytrading-winrate">0.00%</span>
                                    </div>
                                </div>
                                <div class="timeframe-card">
                                    <div class="timeframe-title">Swing Trading</div>
                                    <div class="timeframe-value" id="swingtrading-pnl">$0.00</div>
                                    <div class="timeframe-stats">
                                        <span id="swingtrading-trades">0 trades</span>
                                        <span id="swingtrading-winrate">0.00%</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div class="recent-trades">
                            <h3>Recent Trades</h3>
                            <div class="trades-table-container">
                                <table class="trades-table">
                                    <thead>
                                        <tr>
                                            <th>Date</th>
                                            <th>Pair</th>
                                            <th>Type</th>
                                            <th>Entry</th>
                                            <th>Exit</th>
                                            <th>Size</th>
                                            <th>P&L</th>
                                        </tr>
                                    </thead>
                                    <tbody id="trades-table-body">
                                        <tr class="empty-row">
                                            <td colspan="7">No trades yet</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div class="analytics-tab-content" id="assets-tab">
                        <div class="chart-container">
                            <canvas id="asset-allocation-chart"></canvas>
                        </div>
                        <div class="assets-table-container">
                            <table class="assets-table">
                                <thead>
                                    <tr>
                                        <th>Asset</th>
                                        <th>Amount</th>
                                        <th>Value</th>
                                        <th>Allocation</th>
                                        <th>24h Change</th>
                                    </tr>
                                </thead>
                                <tbody id="assets-table-body">
                                    <tr>
                                        <td>USDT</td>
                                        <td>1,000.00</td>
                                        <td>$1,000.00</td>
                                        <td>100.00%</td>
                                        <td>0.00%</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            `;
            
            // Add to container
            const container = document.querySelector('.container');
            if (container) {
                container.appendChild(analyticsCard);
            }
            
            // Add tab switching functionality
            const tabs = document.querySelectorAll('.analytics-tab');
            tabs.forEach(tab => {
                tab.addEventListener('click', () => {
                    // Remove active class from all tabs
                    tabs.forEach(t => t.classList.remove('active'));
                    
                    // Add active class to clicked tab
                    tab.classList.add('active');
                    
                    // Hide all tab content
                    const tabContents = document.querySelectorAll('.analytics-tab-content');
                    tabContents.forEach(content => content.classList.remove('active'));
                    
                    // Show selected tab content
                    const tabName = tab.getAttribute('data-tab');
                    document.getElementById(`${tabName}-tab`).classList.add('active');
                    
                    // Refresh charts
                    this.updateCharts();
                });
            });
        }
    }
    
    /**
     * Create a chart using Chart.js
     * @param {string} canvasId - Canvas element ID
     * @param {string} title - Chart title
     * @param {string} units - Chart units
     * @param {string} type - Chart type (line, bar, pie, doughnut)
     * @param {Array} colors - Array of colors for the chart
     */
    createChart(canvasId, title, units, type, colors) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return null;
        
        const ctx = canvas.getContext('2d');
        
        let chartConfig = {
            type: type,
            data: {
                labels: [],
                datasets: [{
                    label: title,
                    data: [],
                    backgroundColor: colors,
                    borderColor: type === 'line' ? colors[0] : colors,
                    borderWidth: 1,
                    fill: type === 'line' ? false : true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    title: {
                        display: true,
                        text: title,
                        font: {
                            size: 16,
                            weight: 'bold'
                        },
                        padding: {
                            top: 10,
                            bottom: 10
                        }
                    },
                    legend: {
                        display: type === 'pie' || type === 'doughnut',
                        position: 'bottom'
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y + ' ' + units;
                                } else if (context.parsed !== null) {
                                    label += context.parsed + ' ' + units;
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: type === 'pie' || type === 'doughnut' ? undefined : {
                    x: {
                        display: true,
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        display: true,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + ' ' + units;
                            }
                        }
                    }
                }
            }
        };
        
        return new Chart(ctx, chartConfig);
    }
    
    /**
     * Start periodic updates for analytics
     */
    startPeriodicUpdates() {
        // Update every minute
        setInterval(() => {
            this.addHistoricalDataPoint();
            this.updateCharts();
            this.updateMetrics();
        }, 60000);
    }
    
    /**
     * Add a trade to the analytics
     * @param {Object} trade - Trade object
     */
    addTrade(trade) {
        this.trades.push({
            ...trade,
            timestamp: trade.timestamp || Date.now()
        });
        
        // Update portfolio value
        if (trade.profitLoss) {
            const plValue = (trade.profitLoss / 100) * this.portfolioValue;
            this.portfolioValue += plValue;
            
            // Update PnL metrics
            this.dailyPnL += plValue;
            this.weeklyPnL += plValue;
            this.monthlyPnL += plValue;
            this.allTimePnL += plValue;
            
            // Update win/loss metrics
            this.totalTrades++;
            if (trade.profitLoss > 0) {
                this.winningTrades++;
                if (plValue > this.largestWin) this.largestWin = plValue;
            } else {
                this.losingTrades++;
                if (plValue < this.largestLoss) this.largestLoss = plValue;
            }
            
            // Update win rate
            this.winRate = this.totalTrades > 0 ? (this.winningTrades / this.totalTrades) * 100 : 0;
            
            // Update average win/loss
            this.averageWin = this.winningTrades > 0 ? 
                this.trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + ((t.profitLoss / 100) * this.initialValue), 0) / this.winningTrades : 0;
            
            this.averageLoss = this.losingTrades > 0 ? 
                this.trades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + ((t.profitLoss / 100) * this.initialValue), 0) / this.losingTrades : 0;
            
            // Update profit factor
            const totalProfit = this.trades.filter(t => t.profitLoss > 0).reduce((sum, t) => sum + ((t.profitLoss / 100) * this.initialValue), 0);
            const totalLoss = Math.abs(this.trades.filter(t => t.profitLoss < 0).reduce((sum, t) => sum + ((t.profitLoss / 100) * this.initialValue), 0));
            this.profitFactor = totalLoss > 0 ? totalProfit / totalLoss : totalProfit > 0 ? Infinity : 0;
            
            // Update timeframe performance
            if (trade.timeframe) {
                const tf = trade.timeframe.toLowerCase().replace(' ', '');
                if (this.timeframePerformance[tf]) {
                    this.timeframePerformance[tf].trades++;
                    this.timeframePerformance[tf].pnl += plValue;
                    
                    const tfWins = this.trades.filter(t => 
                        t.timeframe && 
                        t.timeframe.toLowerCase().replace(' ', '') === tf && 
                        t.profitLoss > 0
                    ).length;
                    
                    const tfTrades = this.trades.filter(t => 
                        t.timeframe && 
                        t.timeframe.toLowerCase().replace(' ', '') === tf
                    ).length;
                    
                    this.timeframePerformance[tf].winRate = tfTrades > 0 ? (tfWins / tfTrades) * 100 : 0;
                }
            }
            
            // Update asset allocation
            if (trade.pair) {
                const asset = trade.pair.split('/')[0];
                if (!this.assetAllocation[asset]) {
                    this.assetAllocation[asset] = {
                        amount: 0,
                        value: 0,
                        allocation: 0,
                        change24h: 0
                    };
                }
                
                // Simulate asset changes based on trade
                if (trade.direction === 'long' || trade.type === 'BUY') {
                    this.assetAllocation[asset].amount += trade.size || 1;
                    this.assetAllocation[asset].value = this.assetAllocation[asset].amount * (trade.exitPrice || trade.entryPrice);
                } else {
                    this.assetAllocation[asset].amount -= trade.size || 1;
                    this.assetAllocation[asset].value = this.assetAllocation[asset].amount * (trade.exitPrice || trade.entryPrice);
                }
                
                // Update USDT balance
                if (!this.assetAllocation['USDT']) {
                    this.assetAllocation['USDT'] = {
                        amount: this.portfolioValue,
                        value: this.portfolioValue,
                        allocation: 100,
                        change24h: 0
                    };
                } else {
                    this.assetAllocation['USDT'].amount = this.portfolioValue - Object.values(this.assetAllocation)
                        .filter((_, key) => key !== 'USDT')
                        .reduce((sum, asset) => sum + asset.value, 0);
                    
                    this.assetAllocation['USDT'].value = this.assetAllocation['USDT'].amount;
                }
                
                // Update allocations
                const totalValue = Object.values(this.assetAllocation).reduce((sum, asset) => sum + asset.value, 0);
                Object.keys(this.assetAllocation).forEach(key => {
                    this.assetAllocation[key].allocation = (this.assetAllocation[key].value / totalValue) * 100;
                });
            }
            
            // Add daily return for Sharpe ratio calculation
            const dailyReturn = plValue / this.portfolioValue;
            this.dailyReturns.push(dailyReturn);
            
            // Calculate Sharpe ratio (simplified)
            if (this.dailyReturns.length > 1) {
                const meanReturn = this.dailyReturns.reduce((sum, r) => sum + r, 0) / this.dailyReturns.length;
                const stdDev = Math.sqrt(
                    this.dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / this.dailyReturns.length
                );
                this.sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0; // Annualized
            }
            
            // Add historical data point
            this.addHistoricalDataPoint();
            
            // Update UI
            this.updateCharts();
            this.updateMetrics();
            this.updateTradesTable();
            this.updateAssetsTable();
        }
        
        return {
            success: true,
            message: 'Trade added to analytics',
            portfolioValue: this.portfolioValue,
            pnl: trade.profitLoss,
            winRate: this.winRate
        };
    }
    
    /**
     * Add historical data point for charts
     */
    addHistoricalDataPoint() {
        const now = new Date();
        const timeLabel = now.toLocaleTimeString();
        const dateLabel = now.toLocaleDateString();
        
        // Add portfolio value data point
        this.historicalData.portfolioValue.push({
            time: now.getTime(),
            label: timeLabel,
            dateLabel: dateLabel,
            value: this.portfolioValue
        });
        
        // Add PnL data point
        this.historicalData.pnl.push({
            time: now.getTime(),
            label: timeLabel,
            dateLabel: dateLabel,
            value: this.allTimePnL
        });
        
        // Add win rate data point
        this.historicalData.winRate.push({
            time: now.getTime(),
            label: timeLabel,
            dateLabel: dateLabel,
            value: this.winRate
        });
        
        // Add trades data point
        this.historicalData.trades.push({
            time: now.getTime(),
            label: timeLabel,
            dateLabel: dateLabel,
            value: this.totalTrades
        });
        
        // Limit history to 100 points
        if (this.historicalData.portfolioValue.length > 100) {
            this.historicalData.portfolioValue.shift();
            this.historicalData.pnl.shift();
            this.historicalData.winRate.shift();
            this.historicalData.trades.shift();
        }
    }
    
    /**
     * Update all charts with latest data
     */
    updateCharts() {
        // Update portfolio value chart
        if (this.charts.portfolioValue) {
            this.charts.portfolioValue.data.labels = this.historicalData.portfolioValue.map(d => d.label);
            this.charts.portfolioValue.data.datasets[0].data = this.historicalData.portfolioValue.map(d => d.value);
            this.charts.portfolioValue.update();
        }
        
        // Update PnL chart
        if (this.charts.pnl) {
            // Get last 7 days of data
            const last7Days = [];
            const now = new Date();
            
            for (let i = 6; i >= 0; i--) {
                const date = new Date(now);
                date.setDate(date.getDate() - i);
                const dateString = date.toLocaleDateString();
                
                const dayData = this.historicalData.pnl.filter(d => d.dateLabel === dateString);
                const startValue = dayData.length > 0 ? dayData[0].value : 0;
                const endValue = dayData.length > 0 ? dayData[dayData.length - 1].value : 0;
                const dayPnL = endValue - startValue;
                
                last7Days.push({
                    label: date.toLocaleDateString('en-US', { weekday: 'short' }),
                    value: dayPnL
                });
            }
            
            this.charts.pnl.data.labels = last7Days.map(d => d.label);
            this.charts.pnl.data.datasets[0].data = last7Days.map(d => d.value);
            this.charts.pnl.data.datasets[0].backgroundColor = last7Days.map(d => d.value >= 0 ? '#28a745' : '#dc3545');
            this.charts.pnl.update();
        }
        
        // Update win rate chart
        if (this.charts.winRate) {
            this.charts.winRate.data.labels = ['Winning Trades', 'Losing Trades'];
            this.charts.winRate.data.datasets[0].data = [this.winningTrades, this.losingTrades];
            this.charts.winRate.update();
        }
        
        // Update trade distribution chart
        if (this.charts.tradeDistribution) {
            this.charts.tradeDistribution.data.labels = ['Scalping', 'Day Trading', 'Swing Trading'];
            this.charts.tradeDistribution.data.datasets[0].data = [
                this.timeframePerformance.scalping.trades,
                this.timeframePerformance.dayTrading.trades,
                this.timeframePerformance.swingTrading.trades
            ];
            this.charts.tradeDistribution.update();
        }
        
        // Update asset allocation chart
        if (this.charts.assetAllocation) {
            const assets = Object.keys(this.assetAllocation);
            const values = assets.map(a => this.assetAllocation[a].value);
            
            this.charts.assetAllocation.data.labels = assets;
            this.charts.assetAllocation.data.datasets[0].data = values;
            this.charts.assetAllocation.update();
        }
    }
    
    /**
     * Update metrics displays
     */
    updateMetrics() {
        // Portfolio value
        const portfolioValueEl = document.getElementById('portfolio-value');
        const portfolioChangeEl = document.getElementById('portfolio-change');
        
        if (portfolioValueEl) {
            portfolioValueEl.textContent = '$' + this.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (portfolioChangeEl) {
            const change = ((this.portfolioValue - this.initialValue) / this.initialValue) * 100;
            portfolioChangeEl.textContent = change.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            portfolioChangeEl.className = 'metric-change ' + (change >= 0 ? 'positive' : 'negative');
        }
        
        // Daily PnL
        const dailyPnlEl = document.getElementById('daily-pnl');
        const dailyPnlPercentEl = document.getElementById('daily-pnl-percent');
        const dailyPnlEl2 = document.getElementById('daily-pnl-2');
        const dailyPnlPercentEl2 = document.getElementById('daily-pnl-percent-2');
        
        if (dailyPnlEl) {
            dailyPnlEl.textContent = '$' + this.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            dailyPnlEl.className = 'metric-value ' + (this.dailyPnL >= 0 ? 'positive' : 'negative');
        }
        
        if (dailyPnlPercentEl) {
            const dailyPnlPercent = (this.dailyPnL / this.portfolioValue) * 100;
            dailyPnlPercentEl.textContent = dailyPnlPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            dailyPnlPercentEl.className = 'metric-change ' + (dailyPnlPercent >= 0 ? 'positive' : 'negative');
        }
        
        if (dailyPnlEl2) {
            dailyPnlEl2.textContent = '$' + this.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            dailyPnlEl2.className = 'metric-value ' + (this.dailyPnL >= 0 ? 'positive' : 'negative');
        }
        
        if (dailyPnlPercentEl2) {
            const dailyPnlPercent = (this.dailyPnL / this.portfolioValue) * 100;
            dailyPnlPercentEl2.textContent = dailyPnlPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            dailyPnlPercentEl2.className = 'metric-change ' + (dailyPnlPercent >= 0 ? 'positive' : 'negative');
        }
        
        // Weekly PnL
        const weeklyPnlEl = document.getElementById('weekly-pnl');
        const weeklyPnlPercentEl = document.getElementById('weekly-pnl-percent');
        
        if (weeklyPnlEl) {
            weeklyPnlEl.textContent = '$' + this.weeklyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            weeklyPnlEl.className = 'metric-value ' + (this.weeklyPnL >= 0 ? 'positive' : 'negative');
        }
        
        if (weeklyPnlPercentEl) {
            const weeklyPnlPercent = (this.weeklyPnL / this.portfolioValue) * 100;
            weeklyPnlPercentEl.textContent = weeklyPnlPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            weeklyPnlPercentEl.className = 'metric-change ' + (weeklyPnlPercent >= 0 ? 'positive' : 'negative');
        }
        
        // Monthly PnL
        const monthlyPnlEl = document.getElementById('monthly-pnl');
        const monthlyPnlPercentEl = document.getElementById('monthly-pnl-percent');
        
        if (monthlyPnlEl) {
            monthlyPnlEl.textContent = '$' + this.monthlyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            monthlyPnlEl.className = 'metric-value ' + (this.monthlyPnL >= 0 ? 'positive' : 'negative');
        }
        
        if (monthlyPnlPercentEl) {
            const monthlyPnlPercent = (this.monthlyPnL / this.portfolioValue) * 100;
            monthlyPnlPercentEl.textContent = monthlyPnlPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            monthlyPnlPercentEl.className = 'metric-change ' + (monthlyPnlPercent >= 0 ? 'positive' : 'negative');
        }
        
        // All-Time PnL
        const allTimePnlEl = document.getElementById('all-time-pnl');
        const allTimePnlPercentEl = document.getElementById('all-time-pnl-percent');
        
        if (allTimePnlEl) {
            allTimePnlEl.textContent = '$' + this.allTimePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            allTimePnlEl.className = 'metric-value ' + (this.allTimePnL >= 0 ? 'positive' : 'negative');
        }
        
        if (allTimePnlPercentEl) {
            const allTimePnlPercent = (this.allTimePnL / this.initialValue) * 100;
            allTimePnlPercentEl.textContent = allTimePnlPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            allTimePnlPercentEl.className = 'metric-change ' + (allTimePnlPercent >= 0 ? 'positive' : 'negative');
        }
        
        // Win Rate
        const winRateEl = document.getElementById('win-rate');
        const winRateChangeEl = document.getElementById('win-rate-change');
        
        if (winRateEl) {
            winRateEl.textContent = this.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        }
        
        if (winRateChangeEl) {
            winRateChangeEl.textContent = this.totalTrades + ' trades';
        }
        
        // Profit Factor
        const profitFactorEl = document.getElementById('profit-factor');
        const profitFactorChangeEl = document.getElementById('profit-factor-change');
        
        if (profitFactorEl) {
            profitFactorEl.textContent = this.profitFactor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (profitFactorChangeEl) {
            profitFactorChangeEl.textContent = this.profitFactor >= 1 ? 'Profitable' : 'Unprofitable';
            profitFactorChangeEl.className = 'metric-change ' + (this.profitFactor >= 1 ? 'positive' : 'negative');
        }
        
        // Performance metrics
        const sharpeRatioEl = document.getElementById('sharpe-ratio');
        const avgWinEl = document.getElementById('avg-win');
        const avgLossEl = document.getElementById('avg-loss');
        const largestWinEl = document.getElementById('largest-win');
        const largestLossEl = document.getElementById('largest-loss');
        
        if (sharpeRatioEl) {
            sharpeRatioEl.textContent = this.sharpeRatio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (avgWinEl) {
            avgWinEl.textContent = '$' + this.averageWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (avgLossEl) {
            avgLossEl.textContent = '$' + this.averageLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (largestWinEl) {
            largestWinEl.textContent = '$' + this.largestWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        if (largestLossEl) {
            largestLossEl.textContent = '$' + this.largestLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        }
        
        // Timeframe performance
        const scalpingPnlEl = document.getElementById('scalping-pnl');
        const scalpingTradesEl = document.getElementById('scalping-trades');
        const scalpingWinrateEl = document.getElementById('scalping-winrate');
        
        if (scalpingPnlEl) {
            scalpingPnlEl.textContent = '$' + this.timeframePerformance.scalping.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            scalpingPnlEl.className = 'timeframe-value ' + (this.timeframePerformance.scalping.pnl >= 0 ? 'positive' : 'negative');
        }
        
        if (scalpingTradesEl) {
            scalpingTradesEl.textContent = this.timeframePerformance.scalping.trades + ' trades';
        }
        
        if (scalpingWinrateEl) {
            scalpingWinrateEl.textContent = this.timeframePerformance.scalping.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        }
        
        const daytradingPnlEl = document.getElementById('daytrading-pnl');
        const daytradingTradesEl = document.getElementById('daytrading-trades');
        const daytradingWinrateEl = document.getElementById('daytrading-winrate');
        
        if (daytradingPnlEl) {
            daytradingPnlEl.textContent = '$' + this.timeframePerformance.dayTrading.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            daytradingPnlEl.className = 'timeframe-value ' + (this.timeframePerformance.dayTrading.pnl >= 0 ? 'positive' : 'negative');
        }
        
        if (daytradingTradesEl) {
            daytradingTradesEl.textContent = this.timeframePerformance.dayTrading.trades + ' trades';
        }
        
        if (daytradingWinrateEl) {
            daytradingWinrateEl.textContent = this.timeframePerformance.dayTrading.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        }
        
        const swingtradingPnlEl = document.getElementById('swingtrading-pnl');
        const swingtradingTradesEl = document.getElementById('swingtrading-trades');
        const swingtradingWinrateEl = document.getElementById('swingtrading-winrate');
        
        if (swingtradingPnlEl) {
            swingtradingPnlEl.textContent = '$' + this.timeframePerformance.swingTrading.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            swingtradingPnlEl.className = 'timeframe-value ' + (this.timeframePerformance.swingTrading.pnl >= 0 ? 'positive' : 'negative');
        }
        
        if (swingtradingTradesEl) {
            swingtradingTradesEl.textContent = this.timeframePerformance.swingTrading.trades + ' trades';
        }
        
        if (swingtradingWinrateEl) {
            swingtradingWinrateEl.textContent = this.timeframePerformance.swingTrading.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
        }
    }
    
    /**
     * Update trades table
     */
    updateTradesTable() {
        const tableBody = document.getElementById('trades-table-body');
        if (!tableBody) return;
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Add trades
        if (this.trades.length === 0) {
            const emptyRow = document.createElement('tr');
            emptyRow.className = 'empty-row';
            emptyRow.innerHTML = '<td colspan="7">No trades yet</td>';
            tableBody.appendChild(emptyRow);
        } else {
            // Sort trades by timestamp (newest first)
            const sortedTrades = [...this.trades].sort((a, b) => b.timestamp - a.timestamp);
            
            // Add up to 10 most recent trades
            sortedTrades.slice(0, 10).forEach(trade => {
                const row = document.createElement('tr');
                
                const dateCell = document.createElement('td');
                dateCell.textContent = new Date(trade.timestamp).toLocaleString();
                
                const pairCell = document.createElement('td');
                pairCell.textContent = trade.pair || 'AVAX/USDT';
                
                const typeCell = document.createElement('td');
                typeCell.className = trade.direction === 'long' || trade.type === 'BUY' ? 'positive' : 'negative';
                typeCell.textContent = trade.direction === 'long' || trade.type === 'BUY' ? 'BUY' : 'SELL';
                
                const entryCell = document.createElement('td');
                entryCell.textContent = '$' + (trade.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                const exitCell = document.createElement('td');
                exitCell.textContent = '$' + (trade.exitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                
                const sizeCell = document.createElement('td');
                sizeCell.textContent = (trade.size || 1).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
                
                const plCell = document.createElement('td');
                plCell.className = trade.profitLoss >= 0 ? 'positive' : 'negative';
                plCell.textContent = (trade.profitLoss >= 0 ? '+' : '') + trade.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                
                row.appendChild(dateCell);
                row.appendChild(pairCell);
                row.appendChild(typeCell);
                row.appendChild(entryCell);
                row.appendChild(exitCell);
                row.appendChild(sizeCell);
                row.appendChild(plCell);
                
                tableBody.appendChild(row);
            });
        }
    }
    
    /**
     * Update assets table
     */
    updateAssetsTable() {
        const tableBody = document.getElementById('assets-table-body');
        if (!tableBody) return;
        
        // Clear table
        tableBody.innerHTML = '';
        
        // Add assets
        Object.keys(this.assetAllocation).forEach(asset => {
            const assetData = this.assetAllocation[asset];
            
            const row = document.createElement('tr');
            
            const assetCell = document.createElement('td');
            assetCell.textContent = asset;
            
            const amountCell = document.createElement('td');
            amountCell.textContent = assetData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 });
            
            const valueCell = document.createElement('td');
            valueCell.textContent = '$' + assetData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            
            const allocationCell = document.createElement('td');
            allocationCell.textContent = assetData.allocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            const changeCell = document.createElement('td');
            changeCell.className = assetData.change24h >= 0 ? 'positive' : 'negative';
            changeCell.textContent = (assetData.change24h >= 0 ? '+' : '') + assetData.change24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            row.appendChild(assetCell);
            row.appendChild(amountCell);
            row.appendChild(valueCell);
            row.appendChild(allocationCell);
            row.appendChild(changeCell);
            
            tableBody.appendChild(row);
        });
    }
    
    /**
     * Reset analytics data
     */
    reset() {
        this.trades = [];
        this.portfolioValue = this.initialValue;
        this.dailyPnL = 0;
        this.weeklyPnL = 0;
        this.monthlyPnL = 0;
        this.allTimePnL = 0;
        this.winRate = 0;
        this.totalTrades = 0;
        this.winningTrades = 0;
        this.losingTrades = 0;
        this.averageWin = 0;
        this.averageLoss = 0;
        this.largestWin = 0;
        this.largestLoss = 0;
        this.profitFactor = 0;
        this.sharpeRatio = 0;
        this.dailyReturns = [];
        this.timeframePerformance = {
            scalping: { trades: 0, winRate: 0, pnl: 0 },
            dayTrading: { trades: 0, winRate: 0, pnl: 0 },
            swingTrading: { trades: 0, winRate: 0, pnl: 0 }
        };
        this.assetAllocation = {
            'USDT': {
                amount: this.initialValue,
                value: this.initialValue,
                allocation: 100,
                change24h: 0
            }
        };
        
        // Reset historical data
        this.historicalData = {
            portfolioValue: [],
            pnl: [],
            winRate: [],
            trades: []
        };
        
        // Add initial data point
        this.addHistoricalDataPoint();
        
        // Update UI
        this.updateCharts();
        this.updateMetrics();
        this.updateTradesTable();
        this.updateAssetsTable();
        
        return {
            success: true,
            message: 'Analytics data reset'
        };
    }
    
    /**
     * Get analytics summary
     */
    getSummary() {
        return {
            portfolioValue: this.portfolioValue,
            initialValue: this.initialValue,
            allTimePnL: this.allTimePnL,
            allTimePnLPercent: (this.allTimePnL / this.initialValue) * 100,
            dailyPnL: this.dailyPnL,
            dailyPnLPercent: (this.dailyPnL / this.portfolioValue) * 100,
            weeklyPnL: this.weeklyPnL,
            weeklyPnLPercent: (this.weeklyPnL / this.portfolioValue) * 100,
            monthlyPnL: this.monthlyPnL,
            monthlyPnLPercent: (this.monthlyPnL / this.portfolioValue) * 100,
            totalTrades: this.totalTrades,
            winningTrades: this.winningTrades,
            losingTrades: this.losingTrades,
            winRate: this.winRate,
            profitFactor: this.profitFactor,
            sharpeRatio: this.sharpeRatio,
            averageWin: this.averageWin,
            averageLoss: this.averageLoss,
            largestWin: this.largestWin,
            largestLoss: this.largestLoss,
            timeframePerformance: this.timeframePerformance,
            assetAllocation: this.assetAllocation
        };
    }
}

// Export the class for use in other modules
window.TradeAnalytics = TradeAnalytics;

// Add CSS styles
document.addEventListener('DOMContentLoaded', function() {
    const style = document.createElement('style');
    style.textContent = `
        .analytics-card {
            margin-top: 20px;
        }
        
        .analytics-tabs {
            display: flex;
            gap: 10px;
            margin-bottom: 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            padding-bottom: 10px;
        }
        
        .analytics-tab {
            padding: 8px 15px;
            background: transparent;
            border: none;
            color: white;
            cursor: pointer;
            border-radius: 4px;
            transition: background-color 0.3s;
        }
        
        .analytics-tab:hover {
            background-color: rgba(255, 255, 255, 0.1);
        }
        
        .analytics-tab.active {
            background-color: #4e74ff;
        }
        
        .analytics-tab-content {
            display: none;
        }
        
        .analytics-tab-content.active {
            display: block;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 15px;
            margin-bottom: 20px;
        }
        
        .metric-card {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 15px;
        }
        
        .metric-title {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 5px;
        }
        
        .metric-value {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .metric-change {
            font-size: 14px;
        }
        
        .positive {
            color: #28a745;
        }
        
        .negative {
            color: #dc3545;
        }
        
        .chart-container {
            height: 300px;
            margin-bottom: 20px;
        }
        
        .chart-row {
            display: flex;
            gap: 20px;
            margin-bottom: 20px;
        }
        
        .chart-container.half {
            flex: 1;
            min-width: 0;
        }
        
        .performance-metrics {
            display: flex;
            flex-wrap: wrap;
            gap: 15px;
            margin-top: 20px;
        }
        
        .performance-metric {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 15px;
            flex: 1;
            min-width: 120px;
        }
        
        .metric-label {
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
            margin-bottom: 5px;
        }
        
        .timeframe-performance {
            margin-bottom: 20px;
        }
        
        .timeframe-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 15px;
        }
        
        .timeframe-card {
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 8px;
            padding: 15px;
        }
        
        .timeframe-title {
            font-size: 16px;
            margin-bottom: 5px;
        }
        
        .timeframe-value {
            font-size: 20px;
            font-weight: bold;
            margin-bottom: 5px;
        }
        
        .timeframe-stats {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            color: rgba(255, 255, 255, 0.7);
        }
        
        .trades-table-container, .assets-table-container {
            overflow-x: auto;
            margin-bottom: 20px;
        }
        
        .trades-table, .assets-table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .trades-table th, .assets-table th {
            text-align: left;
            padding: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            color: rgba(255, 255, 255, 0.7);
        }
        
        .trades-table td, .assets-table td {
            padding: 10px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .empty-row td {
            text-align: center;
            color: rgba(255, 255, 255, 0.5);
            padding: 20px;
        }
    `;
    
    document.head.appendChild(style);
});
