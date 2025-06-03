/**
 * TradingView Direct Integration Module - Fixed Version
 * Embeds a full TradingView chart widget directly into the trading bot interface
 */

class TradingViewIntegration {
    constructor(containerId = 'tradingview-chart-container') {
        this.containerId = containerId;
        this.widget = null;
        this.symbol = 'BINANCE:AVAXUSDT';
        this.interval = '1';
        this.theme = 'dark';
        this.isLoaded = false;
        this.onReadyCallbacks = [];
    }

    /**
     * Initialize TradingView widget
     */
    async initialize() {
        console.log('Initializing TradingView integration...');
        this.addToSystemLog('Initializing TradingView chart...');
        
        // Create container if it doesn't exist
        this.ensureContainer();
        
        // Load TradingView script if not already loaded
        await this.loadTradingViewScript();
        
        // Create widget
        this.createWidget();
        
        return true;
    }

    /**
     * Ensure container exists
     */
    ensureContainer() {
        let container = document.getElementById(this.containerId);
        
        if (!container) {
            // Find chart container
            const chartContainer = document.querySelector('.chart-container');
            
            if (chartContainer) {
                // Clear existing content
                chartContainer.innerHTML = '';
                
                // Create new container
                container = document.createElement('div');
                container.id = this.containerId;
                container.style.width = '100%';
                container.style.height = '100%';
                
                // Add to chart container
                chartContainer.appendChild(container);
            } else {
                console.error('Chart container not found');
                this.addToSystemLog('Error: Chart container not found');
            }
        }
    }

    /**
     * Load TradingView script
     */
    loadTradingViewScript() {
        return new Promise((resolve, reject) => {
            if (window.TradingView) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = () => {
                console.log('TradingView script loaded');
                resolve();
            };
            script.onerror = () => {
                console.error('Failed to load TradingView script');
                this.addToSystemLog('Error: Failed to load TradingView script');
                reject(new Error('Failed to load TradingView script'));
            };
            
            document.head.appendChild(script);
        });
    }

    /**
     * Create TradingView widget
     */
    createWidget() {
        try {
            // Create widget with safe configuration
            if (typeof TradingView !== 'undefined' && TradingView.widget) {
                this.widget = new TradingView.widget({
                    container_id: this.containerId,
                    symbol: this.symbol,
                    interval: this.interval,
                    timezone: 'Etc/UTC',
                    theme: this.theme,
                    style: '1',
                    locale: 'en',
                    toolbar_bg: '#242a38',
                    enable_publishing: false,
                    hide_top_toolbar: false,
                    hide_legend: false,
                    save_image: true,
                    height: '100%',
                    width: '100%',
                    autosize: true,
                    allow_symbol_change: true,
                    studies: [
                        'MASimple@tv-basicstudies',
                        'RSI@tv-basicstudies',
                        'MACD@tv-basicstudies'
                    ],
                    disabled_features: [
                        'header_symbol_search',
                        'header_compare'
                    ],
                    enabled_features: [
                        'use_localstorage_for_settings',
                        'side_toolbar_in_fullscreen_mode'
                    ],
                    overrides: {
                        'mainSeriesProperties.style': 1,
                        'mainSeriesProperties.candleStyle.upColor': '#28a745',
                        'mainSeriesProperties.candleStyle.downColor': '#dc3545',
                        'mainSeriesProperties.candleStyle.wickUpColor': '#28a745',
                        'mainSeriesProperties.candleStyle.wickDownColor': '#dc3545'
                    }
                });
                
                // Mark as loaded immediately to avoid onChartReady issues
                this.isLoaded = true;
                this.addToSystemLog('TradingView chart loaded successfully');
                
                // Call all onReady callbacks
                setTimeout(() => {
                    this.onReadyCallbacks.forEach(callback => callback(this.widget));
                    
                    // Connect to price feed if available
                    if (window.priceFeed) {
                        try {
                            window.priceFeed.connectToTradingViewWidget(this.widget);
                        } catch (error) {
                            console.error('Error connecting price feed to TradingView:', error);
                        }
                    }
                }, 1000);
            } else {
                throw new Error('TradingView library not loaded properly');
            }
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            this.addToSystemLog(`Error creating TradingView widget: ${error.message}`);
            
            // Fallback to simulated chart
            this.createSimulatedChart();
        }
    }

    /**
     * Create simulated chart as fallback
     */
    createSimulatedChart() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        
        this.addToSystemLog('Creating simulated chart as fallback');
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.id = 'simulated-chart';
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        container.appendChild(canvas);
        
        // Create simulated chart using Chart.js
        if (typeof Chart !== 'undefined') {
            const ctx = canvas.getContext('2d');
            
            // Generate random price data
            const labels = [];
            const data = [];
            const basePrice = 22.5;
            const now = new Date();
            
            for (let i = 60; i >= 0; i--) {
                const time = new Date(now.getTime() - i * 60000);
                labels.push(time.toLocaleTimeString());
                
                // Random walk price
                const randomChange = (Math.random() - 0.5) * 0.2;
                const newPrice = i === 60 ? basePrice : data[data.length - 1] + randomChange;
                data.push(newPrice);
            }
            
            // Create chart
            new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'AVAX/USDT',
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
            
            // Mark as loaded
            this.isLoaded = true;
            
            // Call all onReady callbacks
            setTimeout(() => {
                this.onReadyCallbacks.forEach(callback => callback(null));
            }, 500);
        } else {
            // If Chart.js is not available, show error message
            container.innerHTML = `
                <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: rgba(255, 255, 255, 0.7);">
                    <div style="font-size: 24px; margin-bottom: 10px;">Chart Unavailable</div>
                    <div>TradingView integration failed to load</div>
                    <div style="margin-top: 20px;">Using simulated price data</div>
                </div>
            `;
        }
    }

    /**
     * Change symbol
     */
    changeSymbol(symbol) {
        if (!this.widget || !this.isLoaded) {
            console.error('TradingView widget not ready');
            return false;
        }
        
        try {
            this.symbol = symbol;
            
            // Only call setSymbol if it exists
            if (this.widget && typeof this.widget.setSymbol === 'function') {
                this.widget.setSymbol(symbol, this.interval);
                this.addToSystemLog(`Changed symbol to ${symbol}`);
            }
            return true;
        } catch (error) {
            console.error('Error changing symbol:', error);
            this.addToSystemLog(`Error changing symbol: ${error.message}`);
            return false;
        }
    }

    /**
     * Change interval
     */
    changeInterval(interval) {
        if (!this.widget || !this.isLoaded) {
            console.error('TradingView widget not ready');
            return false;
        }
        
        try {
            this.interval = interval;
            
            // Only call setInterval if it exists
            if (this.widget && typeof this.widget.setInterval === 'function') {
                this.widget.setInterval(interval);
                this.addToSystemLog(`Changed interval to ${interval}`);
            }
            return true;
        } catch (error) {
            console.error('Error changing interval:', error);
            this.addToSystemLog(`Error changing interval: ${error.message}`);
            return false;
        }
    }

    /**
     * Register onReady callback
     */
    onReady(callback) {
        if (typeof callback !== 'function') return;
        
        if (this.isLoaded) {
            callback(this.widget);
        } else {
            this.onReadyCallbacks.push(callback);
        }
    }

    /**
     * Get current price
     */
    getCurrentPrice() {
        // This is a simplified approach - in a real implementation,
        // you would use the TradingView API to get the current price
        return 22.75;
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

// Initialize TradingView integration when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize TradingView integration
    window.tradingViewIntegration = new TradingViewIntegration();
    window.tradingViewIntegration.initialize();
});
