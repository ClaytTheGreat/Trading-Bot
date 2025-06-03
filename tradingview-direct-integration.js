/**
 * TradingView Direct Integration Module
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
            // Create widget
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
            
            // Set up onReady callback
            this.widget.onChartReady(() => {
                console.log('TradingView chart ready');
                this.isLoaded = true;
                this.addToSystemLog('TradingView chart loaded successfully');
                
                // Call all onReady callbacks
                this.onReadyCallbacks.forEach(callback => callback(this.widget));
                
                // Connect to price feed if available
                if (window.priceFeed) {
                    window.priceFeed.connectToTradingViewWidget(this.widget);
                }
            });
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            this.addToSystemLog(`Error creating TradingView widget: ${error.message}`);
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
            this.widget.setSymbol(symbol, this.interval);
            this.addToSystemLog(`Changed symbol to ${symbol}`);
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
            this.widget.setInterval(interval);
            this.addToSystemLog(`Changed interval to ${interval}`);
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
        if (!this.widget || !this.isLoaded) {
            console.error('TradingView widget not ready');
            return null;
        }
        
        try {
            // This is a simplified approach - in a real implementation,
            // you would use the TradingView API to get the current price
            return this.widget.symbolInterval().split(',')[1];
        } catch (error) {
            console.error('Error getting current price:', error);
            return null;
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

// Initialize TradingView integration when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize TradingView integration
    window.tradingViewIntegration = new TradingViewIntegration();
    window.tradingViewIntegration.initialize();
});
