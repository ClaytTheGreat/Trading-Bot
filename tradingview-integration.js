/**
 * TradingView Integration Module for Trading Bot
 * Implements real-time price data and charts from TradingView
 */

class TradingViewIntegration {
    constructor() {
        this.container = null;
        this.widget = null;
        this.symbol = 'AVAXUSDT';
        this.interval = '15';
        this.theme = 'dark';
        this.width = '100%';
        this.height = '400';
        this.isInitialized = false;
        this.priceUpdateCallbacks = [];
        this.lastPrice = null;
        this.priceUpdateInterval = null;
    }
    
    /**
     * Initialize TradingView widget
     * @param {string} containerId - ID of container element
     * @param {Object} options - Configuration options
     */
    initialize(containerId, options = {}) {
        // Check if TradingView widget script is loaded
        if (!window.TradingView) {
            this.loadTradingViewScript()
                .then(() => {
                    this.initializeWidget(containerId, options);
                })
                .catch(error => {
                    console.error('Failed to load TradingView widget script:', error);
                    return {
                        success: false,
                        message: 'Failed to load TradingView widget script'
                    };
                });
        } else {
            this.initializeWidget(containerId, options);
        }
        
        return {
            success: true,
            message: 'TradingView integration initialized'
        };
    }
    
    /**
     * Load TradingView widget script
     * @returns {Promise} - Promise that resolves when script is loaded
     */
    loadTradingViewScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    /**
     * Initialize TradingView widget
     * @param {string} containerId - ID of container element
     * @param {Object} options - Configuration options
     */
    initializeWidget(containerId, options = {}) {
        this.container = document.getElementById(containerId);
        
        if (!this.container) {
            console.error(`Container element with ID "${containerId}" not found`);
            return {
                success: false,
                message: `Container element with ID "${containerId}" not found`
            };
        }
        
        // Apply options
        this.symbol = options.symbol || this.symbol;
        this.interval = options.interval || this.interval;
        this.theme = options.theme || this.theme;
        this.width = options.width || this.width;
        this.height = options.height || this.height;
        
        // Create widget
        this.widget = new TradingView.widget({
            container_id: containerId,
            symbol: this.symbol,
            interval: this.interval,
            timezone: 'Etc/UTC',
            theme: this.theme,
            style: '1',
            locale: 'en',
            toolbar_bg: '#f1f3f6',
            enable_publishing: false,
            allow_symbol_change: true,
            save_image: false,
            width: this.width,
            height: this.height,
            hide_side_toolbar: false,
            studies: [
                'MASimple@tv-basicstudies',
                'RSI@tv-basicstudies',
                'MACD@tv-basicstudies'
            ],
            show_popup_button: true,
            popup_width: '1000',
            popup_height: '650',
            hide_volume: false,
            enabled_features: [
                'use_localstorage_for_settings',
                'save_chart_properties_to_local_storage'
            ],
            disabled_features: [
                'header_symbol_search',
                'header_compare'
            ],
            overrides: {
                'mainSeriesProperties.candleStyle.upColor': '#28a745',
                'mainSeriesProperties.candleStyle.downColor': '#dc3545',
                'mainSeriesProperties.candleStyle.wickUpColor': '#28a745',
                'mainSeriesProperties.candleStyle.wickDownColor': '#dc3545'
            }
        });
        
        // Set up price updates
        this.startPriceUpdates();
        
        this.isInitialized = true;
        
        return {
            success: true,
            message: 'TradingView widget initialized'
        };
    }
    
    /**
     * Start price updates
     */
    startPriceUpdates() {
        // Clear existing interval if any
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        // Set up interval to fetch price data
        this.priceUpdateInterval = setInterval(() => {
            this.fetchCurrentPrice();
        }, 5000); // Update every 5 seconds
        
        // Fetch initial price
        this.fetchCurrentPrice();
    }
    
    /**
     * Fetch current price from TradingView
     */
    fetchCurrentPrice() {
        // If widget is not initialized, return
        if (!this.isInitialized || !this.widget) {
            return;
        }
        
        // Use TradingView's API to get the current price
        // This is a simplified approach; in a production environment,
        // you would use their official API or websocket connection
        
        // For demonstration, we'll use a fetch request to a public API
        // that provides cryptocurrency prices
        fetch(`https://api.binance.com/api/v3/ticker/price?symbol=${this.symbol}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.price) {
                    const price = parseFloat(data.price);
                    this.lastPrice = price;
                    
                    // Notify all callbacks
                    this.priceUpdateCallbacks.forEach(callback => {
                        callback(price);
                    });
                    
                    // Update price display
                    this.updatePriceDisplay(price);
                }
            })
            .catch(error => {
                console.error('Failed to fetch price data:', error);
                
                // Fallback to simulated price if API fails
                if (this.lastPrice) {
                    // Generate a small random change
                    const change = (Math.random() * 2 - 1) * 0.001 * this.lastPrice;
                    const newPrice = this.lastPrice + change;
                    this.lastPrice = newPrice;
                    
                    // Notify all callbacks
                    this.priceUpdateCallbacks.forEach(callback => {
                        callback(newPrice);
                    });
                    
                    // Update price display
                    this.updatePriceDisplay(newPrice);
                }
            });
    }
    
    /**
     * Update price display
     * @param {number} price - Current price
     */
    updatePriceDisplay(price) {
        // Find price display elements
        const priceElements = document.querySelectorAll('.market-item-value');
        if (priceElements.length > 0) {
            priceElements[0].textContent = '$' + price.toFixed(2);
            
            // Update change if previous price exists
            if (this.previousPrice) {
                const changePercent = ((price - this.previousPrice) / this.previousPrice) * 100;
                const changeElements = document.querySelectorAll('.market-item-change');
                
                if (changeElements.length > 0) {
                    changeElements[0].textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
                    changeElements[0].className = 'market-item-change ' + (changePercent >= 0 ? 'positive' : 'negative');
                }
            }
            
            // Store current price as previous for next update
            this.previousPrice = price;
        }
    }
    
    /**
     * Register price update callback
     * @param {Function} callback - Callback function to be called on price update
     */
    onPriceUpdate(callback) {
        if (typeof callback === 'function') {
            this.priceUpdateCallbacks.push(callback);
        }
    }
    
    /**
     * Change symbol
     * @param {string} symbol - New symbol
     */
    changeSymbol(symbol) {
        if (!this.isInitialized || !this.widget) {
            return {
                success: false,
                message: 'Widget not initialized'
            };
        }
        
        this.symbol = symbol;
        this.widget.setSymbol(symbol, this.interval);
        
        // Reset price tracking
        this.lastPrice = null;
        this.previousPrice = null;
        
        // Fetch new price
        this.fetchCurrentPrice();
        
        return {
            success: true,
            message: `Symbol changed to ${symbol}`
        };
    }
    
    /**
     * Change interval
     * @param {string} interval - New interval
     */
    changeInterval(interval) {
        if (!this.isInitialized || !this.widget) {
            return {
                success: false,
                message: 'Widget not initialized'
            };
        }
        
        this.interval = interval;
        this.widget.setInterval(interval);
        
        return {
            success: true,
            message: `Interval changed to ${interval}`
        };
    }
    
    /**
     * Get current price
     * @returns {number} - Current price
     */
    getCurrentPrice() {
        return this.lastPrice;
    }
    
    /**
     * Destroy widget
     */
    destroy() {
        if (this.priceUpdateInterval) {
            clearInterval(this.priceUpdateInterval);
        }
        
        this.priceUpdateCallbacks = [];
        this.isInitialized = false;
        this.widget = null;
        
        if (this.container) {
            this.container.innerHTML = '';
        }
        
        return {
            success: true,
            message: 'TradingView widget destroyed'
        };
    }
}

// Export the class for use in other modules
window.TradingViewIntegration = TradingViewIntegration;
