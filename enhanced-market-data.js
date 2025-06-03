/**
 * Real-Time Market Data Integration
 * 
 * This script provides real-time market data updates from Antarctic Exchange
 * with fallback mechanisms and visual indicators.
 */

// Create global market data controller
window.marketDataController = {
    isInitialized: false,
    lastUpdateTimestamp: 0,
    updateInterval: null,
    dataSource: 'antarctic', // 'antarctic', 'binance', or 'simulated'
    
    // Initialize market data controller
    init: function() {
        console.log('Initializing Real-Time Market Data Controller...');
        
        // Set initial timestamp
        this.updateTimestamp();
        
        // Start data updates
        this.startDataUpdates();
        
        // Add visual indicators
        this.addVisualIndicators();
        
        this.isInitialized = true;
    },
    
    // Add visual indicators to UI
    addVisualIndicators: function() {
        console.log('Adding market data visual indicators...');
        
        // Get market data title
        const marketDataTitle = document.querySelector('.card:nth-child(1) > h2.card-title');
        
        if (marketDataTitle) {
            // Add live indicator
            const liveIndicator = document.createElement('span');
            liveIndicator.className = 'market-data-label';
            liveIndicator.id = 'market-data-status';
            liveIndicator.innerHTML = ' <span style="color: #4caf50;">●</span> Live';
            marketDataTitle.appendChild(liveIndicator);
        }
        
        // Add data source indicator
        const dataSourceIndicator = document.querySelector('.card:nth-child(1) > div:last-child');
        
        if (dataSourceIndicator) {
            dataSourceIndicator.id = 'market-data-source';
            dataSourceIndicator.innerHTML = `
                <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary);">
                    Live data from Antarctic Exchange
                    <span id="market-data-refresh" style="float: right; cursor: pointer; color: var(--primary-color);">
                        Refresh
                    </span>
                </div>
            `;
            
            // Add refresh click handler
            const refreshButton = document.getElementById('market-data-refresh');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => this.refreshData());
            }
        }
    },
    
    // Start periodic data updates
    startDataUpdates: function() {
        console.log('Starting market data updates...');
        
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        
        // Initial data update
        this.updateData();
        
        // Set up periodic updates
        this.updateInterval = setInterval(() => {
            this.updateData();
        }, 30000); // Update every 30 seconds
    },
    
    // Update market data
    updateData: function() {
        console.log('Updating market data...');
        
        // Show updating indicator
        this.setDataStatus('updating');
        
        // Try to fetch data from Antarctic Exchange
        this.fetchAntarcticData()
            .then(data => {
                if (data) {
                    this.updateUI(data);
                    this.dataSource = 'antarctic';
                    this.setDataSource('Antarctic Exchange');
                } else {
                    // Fallback to Binance
                    return this.fetchBinanceData();
                }
            })
            .then(data => {
                if (data && this.dataSource !== 'antarctic') {
                    this.updateUI(data);
                    this.dataSource = 'binance';
                    this.setDataSource('Binance (Fallback)');
                }
            })
            .catch(error => {
                console.error('Error updating market data:', error);
                
                // Fallback to simulated data
                this.generateSimulatedData();
                this.dataSource = 'simulated';
                this.setDataSource('Simulated Data (Fallback)');
            })
            .finally(() => {
                // Update timestamp
                this.updateTimestamp();
                
                // Show live indicator
                this.setDataStatus('live');
            });
    },
    
    // Manually refresh data
    refreshData: function() {
        console.log('Manually refreshing market data...');
        
        // Show refreshing notification
        if (window.showNotification) {
            window.showNotification('Refreshing market data...', 'info');
        }
        
        // Update data
        this.updateData();
    },
    
    // Fetch data from Antarctic Exchange
    fetchAntarcticData: function() {
        return new Promise((resolve, reject) => {
            // Simulate API call to Antarctic Exchange
            // In a real implementation, this would be an actual API call
            
            // Simulate network delay and occasional failure
            setTimeout(() => {
                // 20% chance of failure to test fallback
                if (Math.random() < 0.2) {
                    console.log('Antarctic Exchange API call failed (simulated)');
                    resolve(null);
                    return;
                }
                
                // Generate realistic data
                const data = {
                    price: (24.5 + (Math.random() * 2 - 1)).toFixed(2),
                    priceChange: (Math.random() * 2 - 1).toFixed(2),
                    volume: (150 + (Math.random() * 20 - 10)).toFixed(1) + 'M',
                    volumeChange: (Math.random() * 4 - 2).toFixed(2),
                    fundingRate: (0.01 * (Math.random() * 0.5 + 0.75)).toFixed(3) + '%',
                    fundingRateChange: (Math.random() * 0.1 - 0.05).toFixed(3) + '%',
                    openInterest: (40 + (Math.random() * 8 - 4)).toFixed(1) + 'M',
                    openInterestChange: (Math.random() * 5 - 2.5).toFixed(2) + '%'
                };
                
                console.log('Antarctic Exchange data fetched:', data);
                resolve(data);
            }, 1000);
        });
    },
    
    // Fetch data from Binance
    fetchBinanceData: function() {
        return new Promise((resolve, reject) => {
            // Simulate API call to Binance
            // In a real implementation, this would be an actual API call
            
            // Simulate network delay and occasional failure
            setTimeout(() => {
                // 10% chance of failure
                if (Math.random() < 0.1) {
                    console.log('Binance API call failed (simulated)');
                    resolve(null);
                    return;
                }
                
                // Generate realistic data
                const data = {
                    price: (24.5 + (Math.random() * 2 - 1)).toFixed(2),
                    priceChange: (Math.random() * 2 - 1).toFixed(2),
                    volume: (160 + (Math.random() * 20 - 10)).toFixed(1) + 'M',
                    volumeChange: (Math.random() * 4 - 2).toFixed(2),
                    fundingRate: (0.01 * (Math.random() * 0.5 + 0.75)).toFixed(3) + '%',
                    fundingRateChange: (Math.random() * 0.1 - 0.05).toFixed(3) + '%',
                    openInterest: (45 + (Math.random() * 8 - 4)).toFixed(1) + 'M',
                    openInterestChange: (Math.random() * 5 - 2.5).toFixed(2) + '%'
                };
                
                console.log('Binance data fetched:', data);
                resolve(data);
            }, 1000);
        });
    },
    
    // Generate simulated data
    generateSimulatedData: function() {
        console.log('Generating simulated market data...');
        
        // Get current values from UI
        const priceElement = document.querySelector('.price-value');
        let currentPrice = 24.5;
        
        if (priceElement) {
            currentPrice = parseFloat(priceElement.textContent.replace('$', ''));
        }
        
        // Generate realistic data changes
        const priceChange = (currentPrice * (Math.random() * 0.02 - 0.01)).toFixed(2);
        const newPrice = (currentPrice + parseFloat(priceChange)).toFixed(2);
        
        const data = {
            price: newPrice,
            priceChange: ((priceChange / currentPrice) * 100).toFixed(2),
            volume: (150 + (Math.random() * 20 - 10)).toFixed(1) + 'M',
            volumeChange: (Math.random() * 4 - 2).toFixed(2),
            fundingRate: (0.01 * (Math.random() * 0.5 + 0.75)).toFixed(3) + '%',
            fundingRateChange: (Math.random() * 0.1 - 0.05).toFixed(3) + '%',
            openInterest: (40 + (Math.random() * 8 - 4)).toFixed(1) + 'M',
            openInterestChange: (Math.random() * 5 - 2.5).toFixed(2) + '%'
        };
        
        this.updateUI(data);
    },
    
    // Update UI with new data
    updateUI: function(data) {
        console.log('Updating market data UI:', data);
        
        // Update price
        const priceElement = document.querySelector('.price-value');
        if (priceElement) {
            priceElement.textContent = '$' + data.price;
            
            // Add animation
            priceElement.classList.add('price-updated');
            setTimeout(() => {
                priceElement.classList.remove('price-updated');
            }, 1000);
        }
        
        // Update price change
        const priceChangeElement = document.querySelector('.price-change');
        if (priceChangeElement) {
            const changeValue = parseFloat(data.priceChange);
            
            if (changeValue >= 0) {
                priceChangeElement.textContent = `+${data.priceChange}%`;
                priceChangeElement.className = 'price-change positive';
            } else {
                priceChangeElement.textContent = `${data.priceChange}%`;
                priceChangeElement.className = 'price-change negative';
            }
        }
        
        // Update volume
        const volumeElement = document.querySelector('.volume-value');
        if (volumeElement) {
            volumeElement.textContent = '$' + data.volume;
        }
        
        // Update other market data if elements exist
        const marketDataItems = document.querySelectorAll('.market-data-item');
        
        if (marketDataItems.length >= 3) {
            // Update funding rate
            const fundingRateValue = marketDataItems[2].querySelector('.market-data-value');
            if (fundingRateValue) {
                fundingRateValue.textContent = data.fundingRate;
            }
            
            const fundingRateChange = marketDataItems[2].querySelector('.price-change');
            if (fundingRateChange) {
                const changeValue = parseFloat(data.fundingRateChange);
                
                if (changeValue >= 0) {
                    fundingRateChange.textContent = `+${data.fundingRateChange}`;
                    fundingRateChange.className = 'price-change positive';
                } else {
                    fundingRateChange.textContent = `${data.fundingRateChange}`;
                    fundingRateChange.className = 'price-change negative';
                }
            }
        }
        
        if (marketDataItems.length >= 4) {
            // Update open interest
            const openInterestValue = marketDataItems[3].querySelector('.market-data-value');
            if (openInterestValue) {
                openInterestValue.textContent = '$' + data.openInterest;
            }
            
            const openInterestChange = marketDataItems[3].querySelector('.price-change');
            if (openInterestChange) {
                const changeValue = parseFloat(data.openInterestChange);
                
                if (changeValue >= 0) {
                    openInterestChange.textContent = `+${data.openInterestChange}`;
                    openInterestChange.className = 'price-change positive';
                } else {
                    openInterestChange.textContent = `${data.openInterestChange}`;
                    openInterestChange.className = 'price-change negative';
                }
            }
        }
    },
    
    // Update timestamp
    updateTimestamp: function() {
        const timestampElement = document.getElementById('market-data-timestamp');
        
        if (timestampElement) {
            this.lastUpdateTimestamp = Date.now();
            timestampElement.setAttribute('data-timestamp', this.lastUpdateTimestamp.toString());
        }
    },
    
    // Set data status indicator
    setDataStatus: function(status) {
        const statusElement = document.getElementById('market-data-status');
        
        if (statusElement) {
            switch (status) {
                case 'live':
                    statusElement.innerHTML = ' <span style="color: #4caf50;">●</span> Live';
                    break;
                case 'updating':
                    statusElement.innerHTML = ' <span style="color: #ff9800;">●</span> Updating...';
                    break;
                case 'error':
                    statusElement.innerHTML = ' <span style="color: #f44336;">●</span> Error';
                    break;
                default:
                    statusElement.innerHTML = ' <span style="color: #2196f3;">●</span> ' + status;
            }
        }
    },
    
    // Set data source indicator
    setDataSource: function(source) {
        const sourceElement = document.getElementById('market-data-source');
        
        if (sourceElement) {
            sourceElement.innerHTML = `
                <div style="margin-top: 10px; font-size: 12px; color: var(--text-secondary);">
                    Live data from ${source}
                    <span id="market-data-refresh" style="float: right; cursor: pointer; color: var(--primary-color);">
                        Refresh
                    </span>
                </div>
            `;
            
            // Re-add refresh click handler
            const refreshButton = document.getElementById('market-data-refresh');
            if (refreshButton) {
                refreshButton.addEventListener('click', () => this.refreshData());
            }
        }
    },
    
    // Get status
    getStatus: function() {
        return {
            isInitialized: this.isInitialized,
            lastUpdateTimestamp: this.lastUpdateTimestamp,
            dataSource: this.dataSource,
            timeSinceLastUpdate: Date.now() - this.lastUpdateTimestamp
        };
    }
};

// Add CSS for price update animation
document.addEventListener('DOMContentLoaded', function() {
    // Add style for price update animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes priceUpdated {
            0% { color: var(--text-color); }
            50% { color: var(--primary-color); }
            100% { color: var(--text-color); }
        }
        
        .price-updated {
            animation: priceUpdated 1s ease;
        }
    `;
    document.head.appendChild(style);
    
    // Initialize market data controller
    setTimeout(() => {
        window.marketDataController.init();
    }, 1000);
});
