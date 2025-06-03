/**
 * AVAX Perpetual Futures Market Data Integration
 * 
 * This module integrates high-quality market data from multiple sources
 * for AVAX perpetual futures to provide reliable price and market information
 * to the AI trading agent.
 */

class AVAXMarketDataIntegration {
    constructor() {
        this.isInitialized = false;
        this.dataSources = {
            antarctic: {
                name: 'Antarctic Exchange',
                enabled: true,
                priority: 1,
                lastUpdate: null,
                status: 'disconnected',
                data: null
            },
            binance: {
                name: 'Binance Futures',
                enabled: true,
                priority: 2,
                lastUpdate: null,
                status: 'disconnected',
                data: null
            },
            bybit: {
                name: 'Bybit',
                enabled: true,
                priority: 3,
                lastUpdate: null,
                status: 'disconnected',
                data: null
            },
            deribit: {
                name: 'Deribit',
                enabled: false, // Disabled by default as Deribit might not have AVAX futures
                priority: 4,
                lastUpdate: null,
                status: 'disconnected',
                data: null
            }
        };
        
        this.aggregatedData = {
            price: 0,
            bid: 0,
            ask: 0,
            volume24h: 0,
            high24h: 0,
            low24h: 0,
            openInterest: 0,
            fundingRate: 0,
            timestamp: 0,
            sources: []
        };
        
        this.updateCallbacks = [];
        this.updateInterval = null;
        this.reconnectInterval = null;
        this.dataUpdateFrequency = 2000; // 2 seconds
        this.reconnectFrequency = 10000; // 10 seconds
        this.maxDataAge = 30000; // 30 seconds
        this.symbol = 'AVAX/USDT';
    }
    
    /**
     * Initialize market data integration
     */
    async initialize() {
        console.log('Initializing AVAX Market Data Integration...');
        
        try {
            // Connect to data sources
            await this.connectToDataSources();
            
            // Start data update loop
            this.startDataUpdates();
            
            // Start reconnect loop for disconnected sources
            this.startReconnectLoop();
            
            this.isInitialized = true;
            
            return {
                success: true,
                message: 'AVAX Market Data Integration initialized',
                sources: Object.keys(this.dataSources).filter(key => this.dataSources[key].enabled).length
            };
        } catch (error) {
            console.error('Error initializing AVAX Market Data Integration:', error);
            
            return {
                success: false,
                message: 'Error initializing AVAX Market Data Integration: ' + error.message
            };
        }
    }
    
    /**
     * Connect to all enabled data sources
     */
    async connectToDataSources() {
        const connectPromises = [];
        
        // Connect to Antarctic Exchange
        if (this.dataSources.antarctic.enabled) {
            connectPromises.push(this.connectToAntarctic());
        }
        
        // Connect to Binance Futures
        if (this.dataSources.binance.enabled) {
            connectPromises.push(this.connectToBinance());
        }
        
        // Connect to Bybit
        if (this.dataSources.bybit.enabled) {
            connectPromises.push(this.connectToBybit());
        }
        
        // Connect to Deribit
        if (this.dataSources.deribit.enabled) {
            connectPromises.push(this.connectToDeribit());
        }
        
        // Wait for all connections to complete
        await Promise.allSettled(connectPromises);
        
        // Log connection status
        for (const source in this.dataSources) {
            console.log(`${this.dataSources[source].name}: ${this.dataSources[source].status}`);
        }
        
        return {
            success: true,
            message: 'Connected to data sources',
            sources: Object.keys(this.dataSources).filter(key => this.dataSources[key].status === 'connected').length
        };
    }
    
    /**
     * Connect to Antarctic Exchange
     */
    async connectToAntarctic() {
        try {
            this.dataSources.antarctic.status = 'connecting';
            
            // Check if Antarctic Exchange API is available
            if (window.antarcticExchangeAPI) {
                // Initialize API if not already initialized
                if (!window.antarcticExchangeAPI.isInitialized) {
                    await window.antarcticExchangeAPI.initialize();
                }
                
                // Subscribe to market data
                window.antarcticExchangeAPI.subscribeToMarketData(this.symbol, (data) => {
                    this.updateDataSource('antarctic', {
                        price: data.price,
                        bid: data.bid,
                        ask: data.ask,
                        volume24h: data.volume24h,
                        high24h: data.high24h,
                        low24h: data.low24h,
                        openInterest: data.openInterest,
                        fundingRate: data.fundingRate,
                        timestamp: Date.now()
                    });
                });
                
                this.dataSources.antarctic.status = 'connected';
                console.log('Connected to Antarctic Exchange');
                
                return {
                    success: true,
                    message: 'Connected to Antarctic Exchange'
                };
            } else {
                // Simulate Antarctic Exchange data for testing
                this.simulateAntarcticData();
                
                this.dataSources.antarctic.status = 'connected';
                console.log('Connected to simulated Antarctic Exchange');
                
                return {
                    success: true,
                    message: 'Connected to simulated Antarctic Exchange'
                };
            }
        } catch (error) {
            console.error('Error connecting to Antarctic Exchange:', error);
            this.dataSources.antarctic.status = 'error';
            
            return {
                success: false,
                message: 'Error connecting to Antarctic Exchange: ' + error.message
            };
        }
    }
    
    /**
     * Connect to Binance Futures
     */
    async connectToBinance() {
        try {
            this.dataSources.binance.status = 'connecting';
            
            // In a real implementation, this would connect to Binance Futures API
            // For demo purposes, we'll simulate the data
            this.simulateBinanceData();
            
            this.dataSources.binance.status = 'connected';
            console.log('Connected to simulated Binance Futures');
            
            return {
                success: true,
                message: 'Connected to simulated Binance Futures'
            };
        } catch (error) {
            console.error('Error connecting to Binance Futures:', error);
            this.dataSources.binance.status = 'error';
            
            return {
                success: false,
                message: 'Error connecting to Binance Futures: ' + error.message
            };
        }
    }
    
    /**
     * Connect to Bybit
     */
    async connectToBybit() {
        try {
            this.dataSources.bybit.status = 'connecting';
            
            // In a real implementation, this would connect to Bybit API
            // For demo purposes, we'll simulate the data
            this.simulateBybitData();
            
            this.dataSources.bybit.status = 'connected';
            console.log('Connected to simulated Bybit');
            
            return {
                success: true,
                message: 'Connected to simulated Bybit'
            };
        } catch (error) {
            console.error('Error connecting to Bybit:', error);
            this.dataSources.bybit.status = 'error';
            
            return {
                success: false,
                message: 'Error connecting to Bybit: ' + error.message
            };
        }
    }
    
    /**
     * Connect to Deribit
     */
    async connectToDeribit() {
        try {
            this.dataSources.deribit.status = 'connecting';
            
            // In a real implementation, this would connect to Deribit API
            // For demo purposes, we'll simulate the data
            this.simulateDeribitData();
            
            this.dataSources.deribit.status = 'connected';
            console.log('Connected to simulated Deribit');
            
            return {
                success: true,
                message: 'Connected to simulated Deribit'
            };
        } catch (error) {
            console.error('Error connecting to Deribit:', error);
            this.dataSources.deribit.status = 'error';
            
            return {
                success: false,
                message: 'Error connecting to Deribit: ' + error.message
            };
        }
    }
    
    /**
     * Simulate Antarctic Exchange data
     */
    simulateAntarcticData() {
        // Clear any existing interval
        if (this._antarcticInterval) {
            clearInterval(this._antarcticInterval);
        }
        
        // Set up interval to simulate data
        this._antarcticInterval = setInterval(() => {
            // Base price around $24.50
            const basePrice = 24.50;
            const price = basePrice + (Math.random() * 0.4 - 0.2); // +/- 0.2
            
            // Create simulated data
            const data = {
                price: price,
                bid: price - 0.01,
                ask: price + 0.01,
                volume24h: 15000000 + Math.random() * 5000000,
                high24h: basePrice + 0.5,
                low24h: basePrice - 0.5,
                openInterest: 10000000 + Math.random() * 2000000,
                fundingRate: 0.0001 + (Math.random() * 0.0002 - 0.0001),
                timestamp: Date.now()
            };
            
            // Update data source
            this.updateDataSource('antarctic', data);
        }, 2000); // Update every 2 seconds
    }
    
    /**
     * Simulate Binance Futures data
     */
    simulateBinanceData() {
        // Clear any existing interval
        if (this._binanceInterval) {
            clearInterval(this._binanceInterval);
        }
        
        // Set up interval to simulate data
        this._binanceInterval = setInterval(() => {
            // Base price around $24.52 (slightly different from Antarctic)
            const basePrice = 24.52;
            const price = basePrice + (Math.random() * 0.4 - 0.2); // +/- 0.2
            
            // Create simulated data
            const data = {
                price: price,
                bid: price - 0.01,
                ask: price + 0.01,
                volume24h: 25000000 + Math.random() * 8000000,
                high24h: basePrice + 0.6,
                low24h: basePrice - 0.4,
                openInterest: 15000000 + Math.random() * 3000000,
                fundingRate: 0.00012 + (Math.random() * 0.0002 - 0.0001),
                timestamp: Date.now()
            };
            
            // Update data source
            this.updateDataSource('binance', data);
        }, 2000); // Update every 2 seconds
    }
    
    /**
     * Simulate Bybit data
     */
    simulateBybitData() {
        // Clear any existing interval
        if (this._bybitInterval) {
            clearInterval(this._bybitInterval);
        }
        
        // Set up interval to simulate data
        this._bybitInterval = setInterval(() => {
            // Base price around $24.48 (slightly different from others)
            const basePrice = 24.48;
            const price = basePrice + (Math.random() * 0.4 - 0.2); // +/- 0.2
            
            // Create simulated data
            const data = {
                price: price,
                bid: price - 0.02,
                ask: price + 0.02,
                volume24h: 18000000 + Math.random() * 6000000,
                high24h: basePrice + 0.55,
                low24h: basePrice - 0.45,
                openInterest: 12000000 + Math.random() * 2500000,
                fundingRate: 0.00011 + (Math.random() * 0.0002 - 0.0001),
                timestamp: Date.now()
            };
            
            // Update data source
            this.updateDataSource('bybit', data);
        }, 2000); // Update every 2 seconds
    }
    
    /**
     * Simulate Deribit data
     */
    simulateDeribitData() {
        // Clear any existing interval
        if (this._deribitInterval) {
            clearInterval(this._deribitInterval);
        }
        
        // Set up interval to simulate data
        this._deribitInterval = setInterval(() => {
            // Base price around $24.51 (slightly different from others)
            const basePrice = 24.51;
            const price = basePrice + (Math.random() * 0.4 - 0.2); // +/- 0.2
            
            // Create simulated data
            const data = {
                price: price,
                bid: price - 0.015,
                ask: price + 0.015,
                volume24h: 8000000 + Math.random() * 3000000,
                high24h: basePrice + 0.5,
                low24h: basePrice - 0.5,
                openInterest: 5000000 + Math.random() * 1500000,
                fundingRate: 0.00009 + (Math.random() * 0.0002 - 0.0001),
                timestamp: Date.now()
            };
            
            // Update data source
            this.updateDataSource('deribit', data);
        }, 2000); // Update every 2 seconds
    }
    
    /**
     * Update data source
     * @param {string} source - Data source name
     * @param {Object} data - Market data
     */
    updateDataSource(source, data) {
        if (!this.dataSources[source]) return;
        
        // Update data source
        this.dataSources[source].data = data;
        this.dataSources[source].lastUpdate = Date.now();
        this.dataSources[source].status = 'connected';
        
        // Aggregate data from all sources
        this.aggregateData();
        
        // Notify callbacks
        this.notifyUpdateCallbacks();
    }
    
    /**
     * Aggregate data from all sources
     */
    aggregateData() {
        // Get all connected sources with recent data
        const activeSources = [];
        const now = Date.now();
        
        for (const source in this.dataSources) {
            const dataSource = this.dataSources[source];
            
            // Check if source is connected and has recent data
            if (dataSource.status === 'connected' && 
                dataSource.data && 
                dataSource.lastUpdate && 
                (now - dataSource.lastUpdate) < this.maxDataAge) {
                
                activeSources.push({
                    name: source,
                    priority: dataSource.priority,
                    data: dataSource.data
                });
            }
        }
        
        // Sort by priority
        activeSources.sort((a, b) => a.priority - b.priority);
        
        // If no active sources, return
        if (activeSources.length === 0) {
            return;
        }
        
        // Calculate weighted average price
        let totalPrice = 0;
        let totalVolume = 0;
        let totalBid = 0;
        let totalAsk = 0;
        let totalOpenInterest = 0;
        let totalFundingRate = 0;
        let high24h = 0;
        let low24h = Infinity;
        
        activeSources.forEach(source => {
            const data = source.data;
            const volume = data.volume24h || 1; // Use 1 as minimum to avoid division by zero
            
            totalPrice += data.price * volume;
            totalVolume += volume;
            totalBid += data.bid * volume;
            totalAsk += data.ask * volume;
            totalOpenInterest += data.openInterest || 0;
            totalFundingRate += data.fundingRate || 0;
            
            if (data.high24h > high24h) high24h = data.high24h;
            if (data.low24h < low24h) low24h = data.low24h;
        });
        
        // Calculate weighted averages
        const weightedPrice = totalPrice / totalVolume;
        const weightedBid = totalBid / totalVolume;
        const weightedAsk = totalAsk / totalVolume;
        const avgFundingRate = totalFundingRate / activeSources.length;
        
        // Update aggregated data
        this.aggregatedData = {
            price: weightedPrice,
            bid: weightedBid,
            ask: weightedAsk,
            volume24h: totalVolume,
            high24h: high24h,
            low24h: low24h === Infinity ? 0 : low24h,
            openInterest: totalOpenInterest,
            fundingRate: avgFundingRate,
            timestamp: now,
            sources: activeSources.map(s => s.name)
        };
        
        // Dispatch market data update event
        this.dispatchMarketDataEvent();
    }
    
    /**
     * Dispatch market data update event
     */
    dispatchMarketDataEvent() {
        const event = new CustomEvent('marketDataUpdate', {
            detail: this.aggregatedData
        });
        
        document.dispatchEvent(event);
    }
    
    /**
     * Start data update loop
     */
    startDataUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Set up interval to check data freshness and aggregate
        this.updateInterval = setInterval(() => {
            this.checkDataFreshness();
            this.aggregateData();
        }, this.dataUpdateFrequency);
    }
    
    /**
     * Start reconnect loop for disconnected sources
     */
    startReconnectLoop() {
        // Clear any existing interval
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }
        
        // Set up interval to reconnect disconnected sources
        this.reconnectInterval = setInterval(() => {
            this.reconnectDisconnectedSources();
        }, this.reconnectFrequency);
    }
    
    /**
     * Check data freshness
     */
    checkDataFreshness() {
        const now = Date.now();
        
        for (const source in this.dataSources) {
            const dataSource = this.dataSources[source];
            
            // Skip disabled sources
            if (!dataSource.enabled) continue;
            
            // Check if data is stale
            if (dataSource.status === 'connected' && 
                dataSource.lastUpdate && 
                (now - dataSource.lastUpdate) > this.maxDataAge) {
                
                console.log(`Data from ${dataSource.name} is stale, marking as disconnected`);
                dataSource.status = 'disconnected';
            }
        }
    }
    
    /**
     * Reconnect disconnected sources
     */
    async reconnectDisconnectedSources() {
        for (const source in this.dataSources) {
            const dataSource = this.dataSources[source];
            
            // Skip disabled sources
            if (!dataSource.enabled) continue;
            
            // Check if source is disconnected or in error state
            if (dataSource.status === 'disconnected' || dataSource.status === 'error') {
                console.log(`Attempting to reconnect to ${dataSource.name}...`);
                
                // Attempt to reconnect
                switch (source) {
                    case 'antarctic':
                        await this.connectToAntarctic();
                        break;
                    case 'binance':
                        await this.connectToBinance();
                        break;
                    case 'bybit':
                        await this.connectToBybit();
                        break;
                    case 'deribit':
                        await this.connectToDeribit();
                        break;
                }
            }
        }
    }
    
    /**
     * Register update callback
     * @param {Function} callback - Callback function
     */
    onUpdate(callback) {
        if (typeof callback === 'function') {
            this.updateCallbacks.push(callback);
        }
    }
    
    /**
     * Notify update callbacks
     */
    notifyUpdateCallbacks() {
        this.updateCallbacks.forEach(callback => {
            callback(this.aggregatedData);
        });
    }
    
    /**
     * Get current market data
     */
    getMarketData() {
        return { ...this.aggregatedData };
    }
    
    /**
     * Get data source status
     */
    getDataSourceStatus() {
        const status = {};
        
        for (const source in this.dataSources) {
            status[source] = {
                name: this.dataSources[source].name,
                status: this.dataSources[source].status,
                lastUpdate: this.dataSources[source].lastUpdate
            };
        }
        
        return status;
    }
    
    /**
     * Enable/disable data source
     * @param {string} source - Data source name
     * @param {boolean} enabled - Whether source is enabled
     */
    setDataSourceEnabled(source, enabled) {
        if (!this.dataSources[source]) return false;
        
        this.dataSources[source].enabled = enabled;
        
        if (enabled && (this.dataSources[source].status === 'disconnected' || this.dataSources[source].status === 'error')) {
            // Attempt to connect if enabling a disconnected source
            switch (source) {
                case 'antarctic':
                    this.connectToAntarctic();
                    break;
                case 'binance':
                    this.connectToBinance();
                    break;
                case 'bybit':
                    this.connectToBybit();
                    break;
                case 'deribit':
                    this.connectToDeribit();
                    break;
            }
        }
        
        return true;
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        // Clear intervals
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
        }
        
        if (this._antarcticInterval) {
            clearInterval(this._antarcticInterval);
        }
        
        if (this._binanceInterval) {
            clearInterval(this._binanceInterval);
        }
        
        if (this._bybitInterval) {
            clearInterval(this._bybitInterval);
        }
        
        if (this._deribitInterval) {
            clearInterval(this._deribitInterval);
        }
        
        // Unsubscribe from APIs
        if (window.antarcticExchangeAPI && window.antarcticExchangeAPI.unsubscribeFromMarketData) {
            window.antarcticExchangeAPI.unsubscribeFromMarketData(this.symbol);
        }
        
        console.log('AVAX Market Data Integration cleaned up');
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.avaxMarketData = new AVAXMarketDataIntegration();
    
    // Initialize
    window.avaxMarketData.initialize()
        .then(result => {
            console.log('AVAX Market Data Integration initialized:', result);
            
            // Connect to AI trading agent
            if (window.aiAgent) {
                // Register for market data updates
                window.avaxMarketData.onUpdate(marketData => {
                    // If TradingView integration is active, it will handle sending data to AI agent
                    if (!window.tradingViewIntegration || !window.tradingViewIntegration.isConnected) {
                        // Create market data object
                        const aiMarketData = {
                            currentPrice: marketData.price,
                            volume: marketData.volume24h,
                            timestamp: marketData.timestamp
                        };
                        
                        // Send to AI agent for analysis
                        window.aiAgent.analyzeMarket(aiMarketData);
                    }
                });
                
                console.log('Connected AVAX Market Data to AI trading agent');
            }
            
            // Update market data display
            window.avaxMarketData.onUpdate(marketData => {
                // Update price display
                const priceElement = document.getElementById('avax-price');
                if (priceElement) {
                    priceElement.textContent = '$' + marketData.price.toFixed(2);
                }
                
                // Update 24h change
                const changeElement = document.getElementById('avax-24h-change');
                if (changeElement) {
                    const change = ((marketData.price - marketData.low24h) / marketData.low24h) * 100;
                    const sign = change >= 0 ? '+' : '';
                    changeElement.textContent = sign + change.toFixed(2) + '%';
                    changeElement.className = change >= 0 ? 'text-success' : 'text-danger';
                }
                
                // Update volume
                const volumeElement = document.getElementById('avax-volume');
                if (volumeElement) {
                    volumeElement.textContent = '$' + (marketData.volume24h / 1000000).toFixed(2) + 'M';
                }
                
                // Update funding rate
                const fundingElement = document.getElementById('avax-funding');
                if (fundingElement) {
                    const fundingPercent = marketData.fundingRate * 100;
                    const sign = fundingPercent >= 0 ? '+' : '';
                    fundingElement.textContent = sign + fundingPercent.toFixed(4) + '%';
                    fundingElement.className = fundingPercent >= 0 ? 'text-success' : 'text-danger';
                }
                
                // Update data sources
                const sourcesElement = document.getElementById('data-sources');
                if (sourcesElement) {
                    sourcesElement.textContent = marketData.sources.join(', ');
                }
            });
        })
        .catch(error => {
            console.error('Error initializing AVAX Market Data Integration:', error);
        });
});
