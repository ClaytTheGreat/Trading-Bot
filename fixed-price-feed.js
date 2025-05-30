/**
 * Real-Time Price Feed Integration for Trading Bot
 * Connects to TradingView and Antarctic Exchange for accurate price data
 */

class PriceFeedIntegration {
    constructor() {
        this.currentPrice = 0;
        this.priceHistory = [];
        this.lastUpdate = null;
        this.dataSource = 'antarctic'; // 'antarctic' or 'tradingview'
        this.symbol = 'AVAX/USDT';
        this.updateInterval = null;
        this.listeners = [];
        this.connected = false;
        this.fallbackMode = false;
    }

    /**
     * Initialize price feed
     */
    async initialize() {
        console.log('Initializing price feed integration...');
        this.addToSystemLog('Initializing price feed...');
        
        // Try to connect to Antarctic Exchange first
        const antarcticConnected = await this.connectToAntarctic();
        
        if (!antarcticConnected) {
            // If Antarctic fails, try TradingView as fallback
            this.addToSystemLog('Antarctic Exchange connection failed, trying TradingView...');
            const tradingViewConnected = await this.connectToTradingView();
            
            if (!tradingViewConnected) {
                // If both fail, use simulated data as last resort
                this.addToSystemLog('TradingView connection failed, using simulated data');
                this.startSimulatedPriceFeed();
                this.fallbackMode = true;
            }
        }
        
        // Start regular price updates
        this.startPriceUpdates();
        
        return this.connected;
    }

    /**
     * Connect to Antarctic Exchange API
     */
    async connectToAntarctic() {
        try {
            this.addToSystemLog('Connecting to Antarctic Exchange...');
            
            // Fetch initial price data
            const response = await fetch('https://api.antarctic.exchange/api/v1/market/ticker?symbol=AVAXUSDT');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data && data.data && data.data.last) {
                // Set current price
                this.currentPrice = parseFloat(data.data.last);
                this.lastUpdate = new Date();
                this.dataSource = 'antarctic';
                this.connected = true;
                
                // Add to price history
                this.addPricePoint(this.currentPrice);
                
                // Log success
                this.addToSystemLog(`Connected to Antarctic Exchange. Current price: $${this.currentPrice.toFixed(2)}`);
                
                // Set up WebSocket for real-time updates
                this.setupAntarcticWebSocket();
                
                return true;
            } else {
                throw new Error('Invalid data format from Antarctic Exchange');
            }
        } catch (error) {
            console.error('Error connecting to Antarctic Exchange:', error);
            this.addToSystemLog(`Antarctic Exchange connection error: ${error.message}`);
            return false;
        }
    }

    /**
     * Set up WebSocket connection to Antarctic Exchange
     */
    setupAntarcticWebSocket() {
        try {
            // Create WebSocket connection
            const ws = new WebSocket('wss://stream.antarctic.exchange/ws/market/ticker');
            
            // Connection opened
            ws.addEventListener('open', (event) => {
                console.log('Antarctic Exchange WebSocket connected');
                
                // Subscribe to AVAX/USDT ticker
                ws.send(JSON.stringify({
                    method: 'SUBSCRIBE',
                    params: ['AVAXUSDT@ticker'],
                    id: 1
                }));
            });
            
            // Listen for messages
            ws.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data && data.data && data.data.last) {
                        // Update current price
                        this.updatePrice(parseFloat(data.data.last), 'antarctic');
                    }
                } catch (e) {
                    console.error('Error parsing WebSocket message:', e);
                }
            });
            
            // Handle errors
            ws.addEventListener('error', (error) => {
                console.error('Antarctic Exchange WebSocket error:', error);
                this.addToSystemLog('Antarctic Exchange WebSocket error, falling back to polling');
                
                // Fall back to polling
                this.startAntarcticPolling();
            });
            
            // Handle disconnection
            ws.addEventListener('close', (event) => {
                console.log('Antarctic Exchange WebSocket disconnected');
                this.addToSystemLog('Antarctic Exchange WebSocket disconnected, falling back to polling');
                
                // Fall back to polling
                this.startAntarcticPolling();
            });
        } catch (error) {
            console.error('Error setting up Antarctic Exchange WebSocket:', error);
            this.addToSystemLog(`WebSocket setup error: ${error.message}`);
            
            // Fall back to polling
            this.startAntarcticPolling();
        }
    }

    /**
     * Start polling Antarctic Exchange API
     */
    startAntarcticPolling() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up polling interval
        this.updateInterval = setInterval(async () => {
            try {
                const response = await fetch('https://api.antarctic.exchange/api/v1/market/ticker?symbol=AVAXUSDT');
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                
                if (data && data.data && data.data.last) {
                    // Update current price
                    this.updatePrice(parseFloat(data.data.last), 'antarctic');
                }
            } catch (error) {
                console.error('Error polling Antarctic Exchange:', error);
                
                // If polling fails, try switching to TradingView
                if (this.dataSource === 'antarctic') {
                    this.addToSystemLog('Antarctic Exchange polling failed, switching to TradingView');
                    this.connectToTradingView();
                }
            }
        }, 5000); // Poll every 5 seconds
    }

    /**
     * Connect to TradingView for price data
     */
    async connectToTradingView() {
        try {
            this.addToSystemLog('Connecting to TradingView...');
            
            // Check if TradingView widget is available
            if (typeof TradingView === 'undefined') {
                // Load TradingView script if not already loaded
                await this.loadTradingViewScript();
            }
            
            // Create TradingView widget container if it doesn't exist
            let tvContainer = document.getElementById('tradingview-container');
            if (!tvContainer) {
                tvContainer = document.createElement('div');
                tvContainer.id = 'tradingview-container';
                tvContainer.style.height = '0';
                tvContainer.style.overflow = 'hidden';
                document.body.appendChild(tvContainer);
            }
            
            // Initialize TradingView widget
            const widget = new TradingView.widget({
                container_id: 'tradingview-container',
                symbol: 'BINANCE:AVAXUSDT',
                interval: '1',
                timezone: 'Etc/UTC',
                theme: 'dark',
                style: '1',
                locale: 'en',
                toolbar_bg: '#f1f3f6',
                enable_publishing: false,
                hide_top_toolbar: true,
                hide_legend: true,
                save_image: false,
                height: 300,
                width: 400,
                autosize: false,
                allow_symbol_change: false,
                studies: ['STD;MACD']
            });
            
            // Wait for widget to load
            await new Promise(resolve => {
                widget.onChartReady(() => {
                    console.log('TradingView widget ready');
                    resolve();
                });
            });
            
            // Get current price from widget
            const symbolInfo = await this.getTradingViewSymbolInfo(widget);
            
            if (symbolInfo && symbolInfo.last_price) {
                // Set current price
                this.currentPrice = symbolInfo.last_price;
                this.lastUpdate = new Date();
                this.dataSource = 'tradingview';
                this.connected = true;
                
                // Add to price history
                this.addPricePoint(this.currentPrice);
                
                // Log success
                this.addToSystemLog(`Connected to TradingView. Current price: $${this.currentPrice.toFixed(2)}`);
                
                // Set up interval to get price updates from widget
                this.setupTradingViewUpdates(widget);
                
                return true;
            } else {
                throw new Error('Could not get price from TradingView');
            }
        } catch (error) {
            console.error('Error connecting to TradingView:', error);
            this.addToSystemLog(`TradingView connection error: ${error.message}`);
            return false;
        }
    }

    /**
     * Load TradingView script
     */
    loadTradingViewScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load TradingView script'));
            document.head.appendChild(script);
        });
    }

    /**
     * Get symbol info from TradingView widget
     */
    getTradingViewSymbolInfo(widget) {
        return new Promise((resolve, reject) => {
            try {
                widget.symbolInterval(symbolInfo => {
                    // Get chart object
                    const chart = widget.chart();
                    
                    // Get current price
                    const lastPrice = chart.crosshairPrice();
                    
                    resolve({
                        symbol: symbolInfo.symbol,
                        last_price: lastPrice
                    });
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Set up TradingView price updates
     */
    setupTradingViewUpdates(widget) {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up interval to get price updates
        this.updateInterval = setInterval(async () => {
            try {
                const symbolInfo = await this.getTradingViewSymbolInfo(widget);
                
                if (symbolInfo && symbolInfo.last_price) {
                    // Update current price
                    this.updatePrice(symbolInfo.last_price, 'tradingview');
                }
            } catch (error) {
                console.error('Error getting TradingView price update:', error);
                
                // If TradingView fails, try switching back to Antarctic
                if (this.dataSource === 'tradingview') {
                    this.addToSystemLog('TradingView updates failed, trying Antarctic Exchange again');
                    this.connectToAntarctic();
                }
            }
        }, 5000); // Update every 5 seconds
    }

    /**
     * Start simulated price feed as last resort
     */
    startSimulatedPriceFeed() {
        this.addToSystemLog('Starting simulated price feed');
        
        // Set initial price
        this.currentPrice = 22.75;
        this.lastUpdate = new Date();
        this.dataSource = 'simulated';
        
        // Add to price history
        this.addPricePoint(this.currentPrice);
        
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up interval for simulated price updates
        this.updateInterval = setInterval(() => {
            // Generate random price movement
            const change = (Math.random() - 0.5) * 0.2; // Random change between -0.1 and 0.1
            const newPrice = this.currentPrice * (1 + change);
            
            // Update price
            this.updatePrice(newPrice, 'simulated');
        }, 5000); // Update every 5 seconds
    }

    /**
     * Start regular price updates
     */
    startPriceUpdates() {
        // Update UI with current price
        this.updatePriceDisplay();
        
        // Set up interval to update UI
        setInterval(() => {
            this.updatePriceDisplay();
        }, 1000); // Update UI every second
    }

    /**
     * Update price with new value
     */
    updatePrice(price, source) {
        // Calculate price change
        const previousPrice = this.currentPrice;
        const priceChange = price - previousPrice;
        const percentChange = (priceChange / previousPrice) * 100;
        
        // Update current price
        this.currentPrice = price;
        this.lastUpdate = new Date();
        this.dataSource = source;
        
        // Add to price history
        this.addPricePoint(price);
        
        // Log significant price changes
        if (Math.abs(percentChange) > 0.5) {
            this.addToSystemLog(`Price ${priceChange > 0 ? 'up' : 'down'} ${Math.abs(percentChange).toFixed(2)}% to $${price.toFixed(2)}`);
        }
        
        // Notify listeners
        this.notifyListeners(price, percentChange);
    }

    /**
     * Add price point to history
     */
    addPricePoint(price) {
        const timestamp = new Date().getTime();
        
        this.priceHistory.push({
            price,
            timestamp
        });
        
        // Limit history size
        if (this.priceHistory.length > 100) {
            this.priceHistory.shift();
        }
    }

    /**
     * Update price display in UI
     */
    updatePriceDisplay() {
        // Update price in market data section
        const priceElement = document.querySelector('.market-item:first-child .market-item-value');
        if (priceElement) {
            priceElement.textContent = `$${this.currentPrice.toFixed(2)}`;
        }
        
        // Calculate 24h change (simulated)
        const changeElement = document.querySelector('.market-item:first-child .market-item-change');
        if (changeElement) {
            // Use first and last price points to calculate change
            if (this.priceHistory.length > 1) {
                const oldestPrice = this.priceHistory[0].price;
                const percentChange = ((this.currentPrice - oldestPrice) / oldestPrice) * 100;
                
                changeElement.textContent = `${percentChange >= 0 ? '+' : ''}${percentChange.toFixed(2)}%`;
                changeElement.className = `market-item-change ${percentChange >= 0 ? 'positive' : 'negative'}`;
            }
        }
        
        // Update chart if available
        this.updatePriceChart();
    }

    /**
     * Update price chart
     */
    updatePriceChart() {
        const chartCanvas = document.getElementById('price-chart');
        if (!chartCanvas) return;
        
        // Get chart instance
        let chart = Chart.getChart(chartCanvas);
        
        // Create new chart if it doesn't exist
        if (!chart) {
            chart = new Chart(chartCanvas, {
                type: 'line',
                data: {
                    labels: [],
                    datasets: [{
                        label: 'AVAX/USDT',
                        data: [],
                        borderColor: '#4e74ff',
                        borderWidth: 2,
                        pointRadius: 0,
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        x: {
                            display: false
                        },
                        y: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.1)'
                            },
                            ticks: {
                                color: 'rgba(255, 255, 255, 0.7)'
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }
            });
        }
        
        // Update chart data
        chart.data.labels = this.priceHistory.map(point => {
            const date = new Date(point.timestamp);
            return date.toLocaleTimeString();
        });
        
        chart.data.datasets[0].data = this.priceHistory.map(point => point.price);
        
        // Update chart
        chart.update();
    }

    /**
     * Register price update listener
     */
    onPriceUpdate(callback) {
        if (typeof callback === 'function') {
            this.listeners.push(callback);
        }
    }

    /**
     * Notify all listeners of price update
     */
    notifyListeners(price, percentChange) {
        this.listeners.forEach(callback => {
            try {
                callback(price, percentChange);
            } catch (error) {
                console.error('Error in price update listener:', error);
            }
        });
    }

    /**
     * Get current price
     */
    getCurrentPrice() {
        return this.currentPrice;
    }

    /**
     * Get price history
     */
    getPriceHistory() {
        return this.priceHistory;
    }

    /**
     * Get data source
     */
    getDataSource() {
        return this.dataSource;
    }

    /**
     * Check if price feed is in fallback mode
     */
    isFallbackMode() {
        return this.fallbackMode;
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

// Initialize price feed when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize price feed
    window.priceFeed = new PriceFeedIntegration();
    window.priceFeed.initialize();
});
