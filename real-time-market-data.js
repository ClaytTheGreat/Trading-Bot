/**
 * Real-Time Market Data Module
 * Provides live market data from Antarctic Exchange and other sources
 */

class MarketDataService {
    constructor() {
        this.baseUrl = 'https://api.antarctic.exchange';
        this.fallbackUrl = 'https://api.binance.com';
        this.symbol = 'AVAXUSDT';
        this.updateInterval = 5000; // 5 seconds
        this.updateTimer = null;
        this.lastPrice = null;
        this.priceChangePercent = null;
        this.volume24h = null;
        this.fundingRate = null;
        this.openInterest = null;
        this.subscribers = [];
    }
    
    /**
     * Initialize market data service
     */
    initialize() {
        console.log('Initializing real-time market data service...');
        this.addToSystemLog('Initializing real-time market data service...');
        
        // Initial data fetch
        this.fetchMarketData();
        
        // Set up interval for regular updates
        this.updateTimer = setInterval(() => {
            this.fetchMarketData();
        }, this.updateInterval);
        
        return true;
    }
    
    /**
     * Fetch market data from primary and fallback sources
     */
    async fetchMarketData() {
        try {
            // Try Antarctic Exchange first
            const antarctic = await this.fetchAntarcticData();
            if (antarctic) {
                this.updateMarketData(antarctic);
                this.addToSystemLog('Market data updated from Antarctic Exchange');
                return;
            }
            
            // Fallback to Binance
            const binance = await this.fetchBinanceData();
            if (binance) {
                this.updateMarketData(binance);
                this.addToSystemLog('Market data updated from Binance (fallback)');
                return;
            }
            
            // If both fail, use simulated data
            this.generateSimulatedData();
            this.addToSystemLog('Using simulated market data (all APIs failed)');
            
        } catch (error) {
            console.error('Error fetching market data:', error);
            this.addToSystemLog('Error fetching market data: ' + error.message);
            this.generateSimulatedData();
        }
    }
    
    /**
     * Fetch data from Antarctic Exchange
     */
    async fetchAntarcticData() {
        try {
            // Attempt to fetch from Antarctic Exchange API
            const response = await fetch(`${this.baseUrl}/api/v1/ticker/24hr?symbol=${this.symbol}`);
            
            if (!response.ok) {
                throw new Error(`Antarctic API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Fetch funding rate and open interest in separate calls
            const fundingResponse = await fetch(`${this.baseUrl}/api/v1/premiumIndex?symbol=${this.symbol}`);
            const openInterestResponse = await fetch(`${this.baseUrl}/api/v1/openInterest?symbol=${this.symbol}`);
            
            const fundingData = await fundingResponse.json();
            const openInterestData = await openInterestResponse.json();
            
            return {
                lastPrice: parseFloat(data.lastPrice),
                priceChangePercent: parseFloat(data.priceChangePercent),
                volume24h: parseFloat(data.volume),
                fundingRate: parseFloat(fundingData.lastFundingRate),
                openInterest: parseFloat(openInterestData.openInterest)
            };
            
        } catch (error) {
            console.error('Antarctic Exchange API error:', error);
            this.addToSystemLog('Antarctic Exchange API error: ' + error.message);
            return null;
        }
    }
    
    /**
     * Fetch data from Binance as fallback
     */
    async fetchBinanceData() {
        try {
            // Attempt to fetch from Binance API
            const response = await fetch(`${this.fallbackUrl}/api/v3/ticker/24hr?symbol=${this.symbol}`);
            
            if (!response.ok) {
                throw new Error(`Binance API error: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Binance doesn't provide funding rate and open interest in the same way
            // We'll use estimated values based on other metrics
            
            return {
                lastPrice: parseFloat(data.lastPrice),
                priceChangePercent: parseFloat(data.priceChangePercent),
                volume24h: parseFloat(data.volume),
                fundingRate: 0.01, // Estimated
                openInterest: parseFloat(data.quoteVolume) * 0.2 // Estimated
            };
            
        } catch (error) {
            console.error('Binance API error:', error);
            this.addToSystemLog('Binance API error: ' + error.message);
            return null;
        }
    }
    
    /**
     * Generate simulated market data when APIs fail
     */
    generateSimulatedData() {
        // If we have previous data, make small random changes
        if (this.lastPrice) {
            // Random price movement (±0.5%)
            const priceChange = this.lastPrice * (Math.random() * 0.01 - 0.005);
            this.lastPrice += priceChange;
            
            // Update price change percent
            this.priceChangePercent = this.priceChangePercent || 0;
            this.priceChangePercent += (Math.random() * 0.2 - 0.1);
            
            // Constrain to reasonable values
            this.priceChangePercent = Math.max(-10, Math.min(10, this.priceChangePercent));
            
            // Small changes to other metrics
            this.volume24h = this.volume24h * (1 + (Math.random() * 0.02 - 0.01));
            this.fundingRate = this.fundingRate * (1 + (Math.random() * 0.02 - 0.01));
            this.openInterest = this.openInterest * (1 + (Math.random() * 0.02 - 0.01));
        } else {
            // Initial simulated data
            this.lastPrice = 22.75;
            this.priceChangePercent = 2.34;
            this.volume24h = 156800000; // $156.8M
            this.fundingRate = 0.01; // 0.01%
            this.openInterest = 42300000; // $42.3M
        }
        
        // Notify subscribers of data update
        this.notifySubscribers();
    }
    
    /**
     * Update market data with new values
     */
    updateMarketData(data) {
        // Calculate price change for UI
        const oldPrice = this.lastPrice;
        
        // Update stored values
        this.lastPrice = data.lastPrice;
        this.priceChangePercent = data.priceChangePercent;
        this.volume24h = data.volume24h;
        this.fundingRate = data.fundingRate;
        this.openInterest = data.openInterest;
        
        // Log significant price changes
        if (oldPrice && Math.abs(this.lastPrice - oldPrice) / oldPrice > 0.01) {
            const direction = this.lastPrice > oldPrice ? 'up' : 'down';
            const changePercent = Math.abs((this.lastPrice - oldPrice) / oldPrice * 100).toFixed(2);
            this.addToSystemLog(`Price moved ${direction} by ${changePercent}%`);
        }
        
        // Notify subscribers of data update
        this.notifySubscribers();
    }
    
    /**
     * Subscribe to market data updates
     */
    subscribe(callback) {
        if (typeof callback === 'function') {
            this.subscribers.push(callback);
            
            // Immediately call with current data
            callback({
                lastPrice: this.lastPrice,
                priceChangePercent: this.priceChangePercent,
                volume24h: this.volume24h,
                fundingRate: this.fundingRate,
                openInterest: this.openInterest
            });
            
            return true;
        }
        return false;
    }
    
    /**
     * Unsubscribe from market data updates
     */
    unsubscribe(callback) {
        this.subscribers = this.subscribers.filter(cb => cb !== callback);
    }
    
    /**
     * Notify all subscribers of data updates
     */
    notifySubscribers() {
        const data = {
            lastPrice: this.lastPrice,
            priceChangePercent: this.priceChangePercent,
            volume24h: this.volume24h,
            fundingRate: this.fundingRate,
            openInterest: this.openInterest
        };
        
        this.subscribers.forEach(callback => {
            try {
                callback(data);
            } catch (error) {
                console.error('Error in market data subscriber callback:', error);
            }
        });
        
        // Update UI elements
        this.updateUIElements(data);
    }
    
    /**
     * Update UI elements with new market data
     */
    updateUIElements(data) {
        // Update price display
        const priceElement = document.querySelector('.market-item:nth-child(1) .market-item-value');
        if (priceElement) {
            priceElement.textContent = `$${data.lastPrice.toFixed(2)}`;
        }
        
        // Update price change
        const priceChangeElement = document.querySelector('.market-item:nth-child(1) .market-item-change');
        if (priceChangeElement) {
            const changeText = `${data.priceChangePercent >= 0 ? '+' : ''}${data.priceChangePercent.toFixed(2)}%`;
            priceChangeElement.textContent = changeText;
            priceChangeElement.className = `market-item-change ${data.priceChangePercent >= 0 ? 'positive' : 'negative'}`;
        }
        
        // Update volume
        const volumeElement = document.querySelector('.market-item:nth-child(2) .market-item-value');
        if (volumeElement) {
            volumeElement.textContent = `$${this.formatNumber(data.volume24h)}`;
        }
        
        // Update funding rate
        const fundingElement = document.querySelector('.market-item:nth-child(3) .market-item-value');
        if (fundingElement) {
            fundingElement.textContent = `${data.fundingRate.toFixed(3)}%`;
        }
        
        // Update open interest
        const openInterestElement = document.querySelector('.market-item:nth-child(4) .market-item-value');
        if (openInterestElement) {
            openInterestElement.textContent = `$${this.formatNumber(data.openInterest)}`;
        }
    }
    
    /**
     * Format large numbers for display
     */
    formatNumber(num) {
        if (num >= 1000000000) {
            return (num / 1000000000).toFixed(1) + 'B';
        }
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toFixed(2);
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
    
    /**
     * Stop market data service
     */
    stop() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
        this.subscribers = [];
        this.addToSystemLog('Market data service stopped');
    }
}

// Initialize market data service when document is ready
document.addEventListener('DOMContentLoaded', function() {
    window.marketDataService = new MarketDataService();
    window.marketDataService.initialize();
});
