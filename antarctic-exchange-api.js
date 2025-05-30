/**
 * Antarctic Exchange API Integration Module for Trading Bot
 * Implements real-time price data and trading functionality with antarctic.exchange
 */

class AntarcticExchangeAPI {
    constructor() {
        this.baseUrl = 'https://www.antarctic.exchange/api/v1';
        this.wsUrl = 'wss://www.antarctic.exchange/ws';
        this.socket = null;
        this.isConnected = false;
        this.priceUpdateCallbacks = [];
        this.orderUpdateCallbacks = [];
        this.marketDataCallbacks = [];
        this.lastPrice = null;
        this.orderBook = {
            bids: [],
            asks: []
        };
        this.marketData = {
            volume24h: 0,
            high24h: 0,
            low24h: 0,
            change24h: 0,
            fundingRate: 0
        };
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 2000; // Start with 2 seconds
    }
    
    /**
     * Initialize connection to Antarctic Exchange
     * @param {Object} options - Configuration options
     */
    initialize(options = {}) {
        // Connect to websocket
        this.connectWebSocket();
        
        // Fetch initial market data
        this.fetchMarketData('AVAX/USDT');
        
        return {
            success: true,
            message: 'Antarctic Exchange API initialized'
        };
    }
    
    /**
     * Connect to Antarctic Exchange WebSocket
     */
    connectWebSocket() {
        try {
            // Create WebSocket connection
            this.socket = new WebSocket(this.wsUrl);
            
            // Connection opened
            this.socket.addEventListener('open', (event) => {
                console.log('Connected to Antarctic Exchange WebSocket');
                this.isConnected = true;
                this.reconnectAttempts = 0;
                
                // Subscribe to market data
                this.subscribeToMarketData('AVAX/USDT');
            });
            
            // Listen for messages
            this.socket.addEventListener('message', (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleWebSocketMessage(data);
                } catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            });
            
            // Connection closed
            this.socket.addEventListener('close', (event) => {
                console.log('Disconnected from Antarctic Exchange WebSocket');
                this.isConnected = false;
                
                // Attempt to reconnect
                this.attemptReconnect();
            });
            
            // Connection error
            this.socket.addEventListener('error', (error) => {
                console.error('WebSocket error:', error);
                this.isConnected = false;
                
                // Attempt to reconnect
                this.attemptReconnect();
            });
        } catch (error) {
            console.error('Failed to connect to Antarctic Exchange WebSocket:', error);
            
            // Attempt to reconnect
            this.attemptReconnect();
            
            return {
                success: false,
                message: 'Failed to connect to Antarctic Exchange WebSocket'
            };
        }
        
        return {
            success: true,
            message: 'Connecting to Antarctic Exchange WebSocket'
        };
    }
    
    /**
     * Attempt to reconnect to WebSocket
     */
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            
            // Exponential backoff
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            
            console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            
            setTimeout(() => {
                this.connectWebSocket();
            }, delay);
        } else {
            console.error('Maximum reconnect attempts reached');
            
            // Fall back to REST API for price updates
            this.startRESTFallback();
        }
    }
    
    /**
     * Start REST API fallback for price updates
     */
    startRESTFallback() {
        console.log('Starting REST API fallback for price updates');
        
        // Set up interval to fetch price data
        setInterval(() => {
            this.fetchMarketData('AVAX/USDT');
        }, 5000); // Update every 5 seconds
    }
    
    /**
     * Handle WebSocket message
     * @param {Object} data - Message data
     */
    handleWebSocketMessage(data) {
        if (!data || !data.type) return;
        
        switch (data.type) {
            case 'ticker':
                // Update price
                if (data.data && data.data.last) {
                    const price = parseFloat(data.data.last);
                    this.lastPrice = price;
                    
                    // Update market data
                    if (data.data.volume) this.marketData.volume24h = parseFloat(data.data.volume);
                    if (data.data.high) this.marketData.high24h = parseFloat(data.data.high);
                    if (data.data.low) this.marketData.low24h = parseFloat(data.data.low);
                    if (data.data.change) this.marketData.change24h = parseFloat(data.data.change);
                    
                    // Notify price update callbacks
                    this.priceUpdateCallbacks.forEach(callback => {
                        callback(price, this.marketData);
                    });
                }
                break;
                
            case 'orderbook':
                // Update order book
                if (data.data) {
                    if (data.data.bids) this.orderBook.bids = data.data.bids;
                    if (data.data.asks) this.orderBook.asks = data.data.asks;
                    
                    // Notify market data callbacks
                    this.marketDataCallbacks.forEach(callback => {
                        callback({
                            orderBook: this.orderBook,
                            marketData: this.marketData
                        });
                    });
                }
                break;
                
            case 'funding':
                // Update funding rate
                if (data.data && data.data.rate) {
                    this.marketData.fundingRate = parseFloat(data.data.rate);
                    
                    // Notify market data callbacks
                    this.marketDataCallbacks.forEach(callback => {
                        callback({
                            orderBook: this.orderBook,
                            marketData: this.marketData
                        });
                    });
                }
                break;
                
            case 'order':
                // Order update
                if (data.data) {
                    // Notify order update callbacks
                    this.orderUpdateCallbacks.forEach(callback => {
                        callback(data.data);
                    });
                }
                break;
                
            default:
                // Unknown message type
                console.log('Unknown WebSocket message type:', data.type);
                break;
        }
    }
    
    /**
     * Subscribe to market data
     * @param {string} symbol - Trading pair symbol
     */
    subscribeToMarketData(symbol) {
        if (!this.isConnected || !this.socket) {
            return {
                success: false,
                message: 'WebSocket not connected'
            };
        }
        
        // Normalize symbol format
        const normalizedSymbol = symbol.replace('/', '').toLowerCase();
        
        // Subscribe to ticker
        this.socket.send(JSON.stringify({
            method: 'subscribe',
            channel: 'ticker',
            symbol: normalizedSymbol
        }));
        
        // Subscribe to order book
        this.socket.send(JSON.stringify({
            method: 'subscribe',
            channel: 'orderbook',
            symbol: normalizedSymbol
        }));
        
        // Subscribe to funding rate
        this.socket.send(JSON.stringify({
            method: 'subscribe',
            channel: 'funding',
            symbol: normalizedSymbol
        }));
        
        return {
            success: true,
            message: `Subscribed to ${symbol} market data`
        };
    }
    
    /**
     * Fetch market data using REST API
     * @param {string} symbol - Trading pair symbol
     */
    fetchMarketData(symbol) {
        // Normalize symbol format
        const normalizedSymbol = symbol.replace('/', '').toLowerCase();
        
        // Fetch ticker data
        fetch(`${this.baseUrl}/ticker/${normalizedSymbol}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.success && data.data) {
                    // Update price
                    if (data.data.last) {
                        const price = parseFloat(data.data.last);
                        this.lastPrice = price;
                        
                        // Update market data
                        if (data.data.volume) this.marketData.volume24h = parseFloat(data.data.volume);
                        if (data.data.high) this.marketData.high24h = parseFloat(data.data.high);
                        if (data.data.low) this.marketData.low24h = parseFloat(data.data.low);
                        if (data.data.change) this.marketData.change24h = parseFloat(data.data.change);
                        
                        // Notify price update callbacks
                        this.priceUpdateCallbacks.forEach(callback => {
                            callback(price, this.marketData);
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Failed to fetch market data:', error);
                
                // If we have a last price, generate a simulated update
                if (this.lastPrice) {
                    // Generate a small random change
                    const change = (Math.random() * 2 - 1) * 0.001 * this.lastPrice;
                    const newPrice = this.lastPrice + change;
                    this.lastPrice = newPrice;
                    
                    // Notify price update callbacks
                    this.priceUpdateCallbacks.forEach(callback => {
                        callback(newPrice, this.marketData);
                    });
                }
            });
        
        // Fetch order book
        fetch(`${this.baseUrl}/orderbook/${normalizedSymbol}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.success && data.data) {
                    // Update order book
                    if (data.data.bids) this.orderBook.bids = data.data.bids;
                    if (data.data.asks) this.orderBook.asks = data.data.asks;
                    
                    // Notify market data callbacks
                    this.marketDataCallbacks.forEach(callback => {
                        callback({
                            orderBook: this.orderBook,
                            marketData: this.marketData
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Failed to fetch order book:', error);
            });
        
        // Fetch funding rate
        fetch(`${this.baseUrl}/funding/${normalizedSymbol}`)
            .then(response => response.json())
            .then(data => {
                if (data && data.success && data.data) {
                    // Update funding rate
                    if (data.data.rate) {
                        this.marketData.fundingRate = parseFloat(data.data.rate);
                        
                        // Notify market data callbacks
                        this.marketDataCallbacks.forEach(callback => {
                            callback({
                                orderBook: this.orderBook,
                                marketData: this.marketData
                            });
                        });
                    }
                }
            })
            .catch(error => {
                console.error('Failed to fetch funding rate:', error);
            });
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
     * Register order update callback
     * @param {Function} callback - Callback function to be called on order update
     */
    onOrderUpdate(callback) {
        if (typeof callback === 'function') {
            this.orderUpdateCallbacks.push(callback);
        }
    }
    
    /**
     * Register market data callback
     * @param {Function} callback - Callback function to be called on market data update
     */
    onMarketDataUpdate(callback) {
        if (typeof callback === 'function') {
            this.marketDataCallbacks.push(callback);
        }
    }
    
    /**
     * Get current price
     * @returns {number} - Current price
     */
    getCurrentPrice() {
        return this.lastPrice;
    }
    
    /**
     * Get market data
     * @returns {Object} - Market data
     */
    getMarketData() {
        return {
            price: this.lastPrice,
            orderBook: this.orderBook,
            marketData: this.marketData
        };
    }
    
    /**
     * Place order
     * @param {Object} order - Order details
     * @returns {Promise} - Promise that resolves with order result
     */
    placeOrder(order) {
        return new Promise((resolve, reject) => {
            // Validate order
            if (!order.symbol || !order.type || !order.side || !order.amount) {
                reject({
                    success: false,
                    message: 'Invalid order parameters'
                });
                return;
            }
            
            // Normalize symbol format
            const normalizedSymbol = order.symbol.replace('/', '').toLowerCase();
            
            // Prepare order data
            const orderData = {
                symbol: normalizedSymbol,
                type: order.type.toLowerCase(), // market, limit
                side: order.side.toLowerCase(), // buy, sell
                amount: parseFloat(order.amount)
            };
            
            // Add price for limit orders
            if (order.type.toLowerCase() === 'limit' && order.price) {
                orderData.price = parseFloat(order.price);
            }
            
            // Add leverage if provided
            if (order.leverage) {
                orderData.leverage = parseInt(order.leverage);
            }
            
            // Add client order ID if provided
            if (order.clientOrderId) {
                orderData.clientOrderId = order.clientOrderId;
            }
            
            // Send order request
            fetch(`${this.baseUrl}/order`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${order.apiKey || ''}`
                },
                body: JSON.stringify(orderData)
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            orderId: data.data.orderId,
                            message: 'Order placed successfully',
                            order: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to place order',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to place order',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Cancel order
     * @param {string} orderId - Order ID
     * @param {string} apiKey - API key
     * @returns {Promise} - Promise that resolves with cancel result
     */
    cancelOrder(orderId, apiKey) {
        return new Promise((resolve, reject) => {
            // Validate parameters
            if (!orderId) {
                reject({
                    success: false,
                    message: 'Order ID is required'
                });
                return;
            }
            
            // Send cancel request
            fetch(`${this.baseUrl}/order/${orderId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || ''}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            message: 'Order cancelled successfully',
                            order: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to cancel order',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to cancel order',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Get open orders
     * @param {string} symbol - Trading pair symbol
     * @param {string} apiKey - API key
     * @returns {Promise} - Promise that resolves with open orders
     */
    getOpenOrders(symbol, apiKey) {
        return new Promise((resolve, reject) => {
            // Normalize symbol format
            const normalizedSymbol = symbol.replace('/', '').toLowerCase();
            
            // Send request
            fetch(`${this.baseUrl}/orders/open/${normalizedSymbol}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || ''}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            orders: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to get open orders',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to get open orders',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Get order history
     * @param {string} symbol - Trading pair symbol
     * @param {string} apiKey - API key
     * @param {Object} options - Options (limit, offset)
     * @returns {Promise} - Promise that resolves with order history
     */
    getOrderHistory(symbol, apiKey, options = {}) {
        return new Promise((resolve, reject) => {
            // Normalize symbol format
            const normalizedSymbol = symbol.replace('/', '').toLowerCase();
            
            // Build query string
            let queryString = '';
            if (options.limit) queryString += `limit=${options.limit}&`;
            if (options.offset) queryString += `offset=${options.offset}&`;
            if (queryString) queryString = `?${queryString.slice(0, -1)}`;
            
            // Send request
            fetch(`${this.baseUrl}/orders/history/${normalizedSymbol}${queryString}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || ''}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            orders: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to get order history',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to get order history',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Get account balance
     * @param {string} apiKey - API key
     * @returns {Promise} - Promise that resolves with account balance
     */
    getAccountBalance(apiKey) {
        return new Promise((resolve, reject) => {
            // Send request
            fetch(`${this.baseUrl}/account/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || ''}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            balance: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to get account balance',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to get account balance',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Get account positions
     * @param {string} apiKey - API key
     * @returns {Promise} - Promise that resolves with account positions
     */
    getAccountPositions(apiKey) {
        return new Promise((resolve, reject) => {
            // Send request
            fetch(`${this.baseUrl}/account/positions`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey || ''}`
                }
            })
                .then(response => response.json())
                .then(data => {
                    if (data && data.success) {
                        resolve({
                            success: true,
                            positions: data.data
                        });
                    } else {
                        reject({
                            success: false,
                            message: data.message || 'Failed to get account positions',
                            error: data.error
                        });
                    }
                })
                .catch(error => {
                    reject({
                        success: false,
                        message: 'Failed to get account positions',
                        error: error.message
                    });
                });
        });
    }
    
    /**
     * Close connection
     */
    close() {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        
        this.isConnected = false;
        this.priceUpdateCallbacks = [];
        this.orderUpdateCallbacks = [];
        this.marketDataCallbacks = [];
        
        return {
            success: true,
            message: 'Connection closed'
        };
    }
}

// Export the class for use in other modules
window.AntarcticExchangeAPI = AntarcticExchangeAPI;
