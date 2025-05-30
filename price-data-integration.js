/**
 * Price Data Integration Module for Trading Bot
 * Connects TradingView and Antarctic Exchange API modules for real-time price data
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize price data integration after main components are loaded
    setTimeout(() => {
        initializePriceDataIntegration();
    }, 2000);
    
    /**
     * Initialize price data integration
     */
    function initializePriceDataIntegration() {
        // Check if required components exist
        if (!window.TradingViewIntegration && !window.AntarcticExchangeAPI) {
            console.error('Price data integration modules not found');
            addToSystemLog('Price data integration failed: Required modules not found');
            return;
        }
        
        // Create container for TradingView chart
        createTradingViewContainer();
        
        // Initialize TradingView integration
        const tradingView = new TradingViewIntegration();
        const tvResult = tradingView.initialize('tradingview-chart', {
            symbol: 'AVAXUSDT',
            interval: '15',
            theme: 'dark',
            height: '400'
        });
        
        if (tvResult && tvResult.success) {
            addToSystemLog('TradingView chart integration initialized');
        }
        
        // Initialize Antarctic Exchange API
        const antarctic = new AntarcticExchangeAPI();
        const apiResult = antarctic.initialize();
        
        if (apiResult && apiResult.success) {
            addToSystemLog('Antarctic Exchange API integration initialized');
        }
        
        // Connect price updates to UI
        connectPriceUpdates(tradingView, antarctic);
        
        // Add to window for external access
        window.tradingView = tradingView;
        window.antarctic = antarctic;
    }
    
    /**
     * Create container for TradingView chart
     */
    function createTradingViewContainer() {
        // Find market data card
        const marketCard = document.querySelector('.card:nth-child(3)');
        if (!marketCard) return;
        
        // Clear existing chart
        const existingChart = marketCard.querySelector('.chart-container');
        if (existingChart) {
            existingChart.innerHTML = '';
        }
        
        // Create TradingView container
        const tvContainer = document.createElement('div');
        tvContainer.id = 'tradingview-chart';
        tvContainer.className = 'tradingview-chart';
        tvContainer.style.height = '400px';
        tvContainer.style.marginTop = '20px';
        
        // Replace existing chart with TradingView container
        if (existingChart) {
            existingChart.parentNode.replaceChild(tvContainer, existingChart);
        } else {
            marketCard.appendChild(tvContainer);
        }
        
        // Add loading indicator
        const loadingIndicator = document.createElement('div');
        loadingIndicator.className = 'loading-indicator';
        loadingIndicator.innerHTML = `
            <div class="spinner"></div>
            <div class="loading-text">Loading TradingView Chart...</div>
        `;
        tvContainer.appendChild(loadingIndicator);
        
        // Add CSS for loading indicator
        const style = document.createElement('style');
        style.textContent = `
            .loading-indicator {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: rgba(255, 255, 255, 0.7);
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid rgba(255, 255, 255, 0.1);
                border-top: 4px solid #4e74ff;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 10px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Connect price updates to UI
     * @param {TradingViewIntegration} tradingView - TradingView integration instance
     * @param {AntarcticExchangeAPI} antarctic - Antarctic Exchange API instance
     */
    function connectPriceUpdates(tradingView, antarctic) {
        // Connect TradingView price updates
        tradingView.onPriceUpdate((price) => {
            updatePriceDisplay(price);
            addToSystemLog(`Price updated from TradingView: $${price.toFixed(2)}`);
        });
        
        // Connect Antarctic Exchange price updates
        antarctic.onPriceUpdate((price, marketData) => {
            updatePriceDisplay(price);
            updateMarketData(marketData);
            addToSystemLog(`Price updated from Antarctic Exchange: $${price.toFixed(2)}`);
        });
        
        // Connect Antarctic Exchange market data updates
        antarctic.onMarketDataUpdate((data) => {
            updateMarketData(data.marketData);
            updateOrderBook(data.orderBook);
        });
    }
    
    /**
     * Update price display in UI
     * @param {number} price - Current price
     */
    function updatePriceDisplay(price) {
        if (!price) return;
        
        // Find price display elements
        const priceElements = document.querySelectorAll('.market-item-value');
        if (priceElements.length > 0) {
            priceElements[0].textContent = '$' + price.toFixed(2);
            
            // Store current price in localStorage for persistence
            localStorage.setItem('lastPrice', price.toString());
            
            // Calculate change if previous price exists
            const previousPrice = parseFloat(localStorage.getItem('previousPrice') || '0');
            if (previousPrice > 0) {
                const changePercent = ((price - previousPrice) / previousPrice) * 100;
                const changeElements = document.querySelectorAll('.market-item-change');
                
                if (changeElements.length > 0) {
                    changeElements[0].textContent = (changePercent >= 0 ? '+' : '') + changePercent.toFixed(2) + '%';
                    changeElements[0].className = 'market-item-change ' + (changePercent >= 0 ? 'positive' : 'negative');
                    
                    // Store change percentage
                    localStorage.setItem('priceChange', changePercent.toString());
                }
            }
            
            // Store current price as previous for next update
            localStorage.setItem('previousPrice', price.toString());
            
            // Update AI agent if available
            if (window.aiAgent && typeof window.aiAgent.updatePrice === 'function') {
                window.aiAgent.updatePrice(price);
            }
            
            // Update trade execution if available
            if (window.tradeExecution && typeof window.tradeExecution.updatePrice === 'function') {
                window.tradeExecution.updatePrice(price);
            }
        }
    }
    
    /**
     * Update market data in UI
     * @param {Object} marketData - Market data
     */
    function updateMarketData(marketData) {
        if (!marketData) return;
        
        // Find market data elements
        const volumeElements = document.querySelectorAll('.market-item-value');
        const changeElements = document.querySelectorAll('.market-item-change');
        
        // Update volume
        if (volumeElements.length > 1 && marketData.volume24h) {
            const volume = marketData.volume24h;
            let volumeText = '';
            
            if (volume >= 1000000) {
                volumeText = '$' + (volume / 1000000).toFixed(1) + 'M';
            } else if (volume >= 1000) {
                volumeText = '$' + (volume / 1000).toFixed(1) + 'K';
            } else {
                volumeText = '$' + volume.toFixed(2);
            }
            
            volumeElements[1].textContent = volumeText;
        }
        
        // Update funding rate
        if (volumeElements.length > 2 && marketData.fundingRate !== undefined) {
            const fundingRate = marketData.fundingRate * 100; // Convert to percentage
            volumeElements[2].textContent = fundingRate.toFixed(3) + '%';
            
            if (changeElements.length > 1) {
                const fundingChange = fundingRate - (parseFloat(localStorage.getItem('previousFundingRate') || '0') * 100);
                changeElements[1].textContent = (fundingChange >= 0 ? '+' : '') + fundingChange.toFixed(3) + '%';
                changeElements[1].className = 'market-item-change ' + (fundingChange >= 0 ? 'positive' : 'negative');
                
                // Store current funding rate for next comparison
                localStorage.setItem('previousFundingRate', marketData.fundingRate.toString());
            }
        }
        
        // Update open interest
        if (volumeElements.length > 3 && marketData.openInterest) {
            const openInterest = marketData.openInterest;
            let oiText = '';
            
            if (openInterest >= 1000000) {
                oiText = '$' + (openInterest / 1000000).toFixed(1) + 'M';
            } else if (openInterest >= 1000) {
                oiText = '$' + (openInterest / 1000).toFixed(1) + 'K';
            } else {
                oiText = '$' + openInterest.toFixed(2);
            }
            
            volumeElements[3].textContent = oiText;
        }
    }
    
    /**
     * Update order book in UI
     * @param {Object} orderBook - Order book data
     */
    function updateOrderBook(orderBook) {
        if (!orderBook || !orderBook.bids || !orderBook.asks) return;
        
        // Find or create order book container
        let orderBookContainer = document.getElementById('order-book-container');
        
        if (!orderBookContainer) {
            // Find market data card
            const marketCard = document.querySelector('.card:nth-child(3)');
            if (!marketCard) return;
            
            // Create order book container
            orderBookContainer = document.createElement('div');
            orderBookContainer.id = 'order-book-container';
            orderBookContainer.className = 'order-book-container';
            orderBookContainer.innerHTML = `
                <h3>Order Book</h3>
                <div class="order-book">
                    <div class="order-book-header">
                        <div>Price</div>
                        <div>Amount</div>
                        <div>Total</div>
                    </div>
                    <div class="order-book-asks"></div>
                    <div class="order-book-spread">
                        <span class="spread-label">Spread:</span>
                        <span class="spread-value">0.00 (0.00%)</span>
                    </div>
                    <div class="order-book-bids"></div>
                </div>
            `;
            
            // Add CSS for order book
            const style = document.createElement('style');
            style.textContent = `
                .order-book-container {
                    margin-top: 20px;
                }
                
                .order-book-container h3 {
                    margin-bottom: 10px;
                }
                
                .order-book {
                    background-color: rgba(0, 0, 0, 0.2);
                    border-radius: 4px;
                    overflow: hidden;
                }
                
                .order-book-header {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    padding: 8px;
                    background-color: rgba(0, 0, 0, 0.3);
                    font-weight: bold;
                    font-size: 12px;
                    color: rgba(255, 255, 255, 0.7);
                }
                
                .order-book-asks, .order-book-bids {
                    max-height: 150px;
                    overflow-y: auto;
                }
                
                .order-book-row {
                    display: grid;
                    grid-template-columns: 1fr 1fr 1fr;
                    padding: 4px 8px;
                    font-size: 12px;
                }
                
                .order-book-row:hover {
                    background-color: rgba(255, 255, 255, 0.05);
                }
                
                .order-book-asks .order-book-row {
                    border-left: 2px solid transparent;
                }
                
                .order-book-bids .order-book-row {
                    border-left: 2px solid transparent;
                }
                
                .order-book-asks .order-book-row .price {
                    color: #dc3545;
                }
                
                .order-book-bids .order-book-row .price {
                    color: #28a745;
                }
                
                .order-book-spread {
                    display: flex;
                    justify-content: center;
                    padding: 8px;
                    background-color: rgba(0, 0, 0, 0.3);
                    font-size: 12px;
                }
                
                .spread-label {
                    margin-right: 5px;
                    color: rgba(255, 255, 255, 0.7);
                }
            `;
            document.head.appendChild(style);
            
            // Add to market card
            marketCard.appendChild(orderBookContainer);
        }
        
        // Update asks (sell orders)
        const asksContainer = orderBookContainer.querySelector('.order-book-asks');
        if (asksContainer) {
            asksContainer.innerHTML = '';
            
            // Sort asks by price (ascending)
            const sortedAsks = [...orderBook.asks].sort((a, b) => a[0] - b[0]);
            
            // Take top 10 asks
            const topAsks = sortedAsks.slice(0, 10);
            
            // Calculate total
            let runningTotal = 0;
            
            // Add asks to container (in reverse order, lowest price at bottom)
            for (let i = topAsks.length - 1; i >= 0; i--) {
                const [price, amount] = topAsks[i];
                runningTotal += amount;
                
                const row = document.createElement('div');
                row.className = 'order-book-row';
                row.innerHTML = `
                    <div class="price">$${parseFloat(price).toFixed(2)}</div>
                    <div class="amount">${parseFloat(amount).toFixed(4)}</div>
                    <div class="total">${runningTotal.toFixed(4)}</div>
                `;
                
                // Add depth visualization
                const maxDepth = Math.max(...topAsks.map(a => a[1]));
                const depthPercentage = (amount / maxDepth) * 100;
                row.style.background = `linear-gradient(to left, rgba(220, 53, 69, 0.1) ${depthPercentage}%, transparent ${depthPercentage}%)`;
                
                asksContainer.appendChild(row);
            }
        }
        
        // Update bids (buy orders)
        const bidsContainer = orderBookContainer.querySelector('.order-book-bids');
        if (bidsContainer) {
            bidsContainer.innerHTML = '';
            
            // Sort bids by price (descending)
            const sortedBids = [...orderBook.bids].sort((a, b) => b[0] - a[0]);
            
            // Take top 10 bids
            const topBids = sortedBids.slice(0, 10);
            
            // Calculate total
            let runningTotal = 0;
            
            // Add bids to container
            topBids.forEach(([price, amount]) => {
                runningTotal += amount;
                
                const row = document.createElement('div');
                row.className = 'order-book-row';
                row.innerHTML = `
                    <div class="price">$${parseFloat(price).toFixed(2)}</div>
                    <div class="amount">${parseFloat(amount).toFixed(4)}</div>
                    <div class="total">${runningTotal.toFixed(4)}</div>
                `;
                
                // Add depth visualization
                const maxDepth = Math.max(...topBids.map(b => b[1]));
                const depthPercentage = (amount / maxDepth) * 100;
                row.style.background = `linear-gradient(to left, rgba(40, 167, 69, 0.1) ${depthPercentage}%, transparent ${depthPercentage}%)`;
                
                bidsContainer.appendChild(row);
            });
        }
        
        // Update spread
        const spreadElement = orderBookContainer.querySelector('.spread-value');
        if (spreadElement && orderBook.asks.length > 0 && orderBook.bids.length > 0) {
            // Get lowest ask and highest bid
            const lowestAsk = Math.min(...orderBook.asks.map(a => a[0]));
            const highestBid = Math.max(...orderBook.bids.map(b => b[0]));
            
            // Calculate spread
            const spread = lowestAsk - highestBid;
            const spreadPercentage = (spread / lowestAsk) * 100;
            
            // Update spread element
            spreadElement.textContent = `$${spread.toFixed(2)} (${spreadPercentage.toFixed(2)}%)`;
        }
    }
    
    /**
     * Add message to system log
     * @param {string} message - Message to add
     */
    function addToSystemLog(message) {
        const systemLog = document.getElementById('system-log');
        if (!systemLog) return;
        
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        
        const logTime = document.createElement('span');
        logTime.className = 'log-time';
        logTime.textContent = new Date().toLocaleTimeString();
        
        const logMessage = document.createElement('span');
        logMessage.textContent = message;
        
        logEntry.appendChild(logTime);
        logEntry.appendChild(logMessage);
        systemLog.appendChild(logEntry);
        
        // Scroll to bottom
        systemLog.scrollTop = systemLog.scrollHeight;
    }
});
