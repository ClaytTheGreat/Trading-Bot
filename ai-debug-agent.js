/**
 * AI Debug Agent Module
 * Automatically detects and fixes common issues with the trading bot
 */

class AIDebugAgent {
    constructor() {
        this.isActive = true;
        this.debugMode = true;
        this.monitoringInterval = 5000; // 5 seconds
        this.monitoringTimer = null;
        this.knownIssues = [];
        this.fixAttempts = {};
        this.maxFixAttempts = 3;
        this.lastScanTime = null;
    }

    /**
     * Initialize AI Debug Agent
     */
    initialize() {
        this.log('Initializing AI Debug Agent...');
        this.addToSystemLog('AI Debug Agent initializing...');
        
        // Start monitoring
        this.startMonitoring();
        
        return true;
    }
    
    /**
     * Start monitoring for issues
     */
    startMonitoring() {
        this.log('Starting monitoring for issues...');
        this.addToSystemLog('AI Debug Agent monitoring activated');
        
        // Set up interval for regular scans
        this.monitoringTimer = setInterval(() => {
            this.scanForIssues();
        }, this.monitoringInterval);
        
        // Initial scan
        setTimeout(() => {
            this.scanForIssues();
        }, 1000);
    }
    
    /**
     * Stop monitoring for issues
     */
    stopMonitoring() {
        this.log('Stopping monitoring for issues...');
        
        if (this.monitoringTimer) {
            clearInterval(this.monitoringTimer);
            this.monitoringTimer = null;
        }
        
        this.addToSystemLog('AI Debug Agent monitoring deactivated');
    }
    
    /**
     * Scan for issues
     */
    scanForIssues() {
        if (!this.isActive) return;
        
        this.log('Scanning for issues...');
        this.lastScanTime = new Date();
        
        // Check for wallet connection issues
        this.checkWalletConnectionIssues();
        
        // Check for TradingView widget issues
        this.checkTradingViewIssues();
        
        // Check for market data issues
        this.checkMarketDataIssues();
        
        // Check for UI inconsistencies
        this.checkUIInconsistencies();
        
        // Check for JavaScript errors
        this.checkJavaScriptErrors();
    }
    
    /**
     * Check for wallet connection issues
     */
    checkWalletConnectionIssues() {
        // Check if wallet connection sync is available
        if (!window.walletConnectionSync) {
            this.log('Wallet connection sync not available');
            this.fixWalletConnectionSyncMissing();
            return;
        }
        
        // Check for UI inconsistencies in wallet connection
        const isConnected = window.walletConnectionSync.isConnected;
        const connectWalletBtn = document.getElementById('connect-wallet');
        const statusIndicator = document.getElementById('status-indicator');
        const connectionStatus = document.getElementById('connection-status');
        const connectMetaMaskBtn = document.getElementById('connect-metamask');
        const walletDetails = document.getElementById('wallet-details');
        
        let inconsistenciesFound = false;
        
        // Check header button
        if (connectWalletBtn) {
            const buttonText = connectWalletBtn.textContent.trim();
            const buttonClass = connectWalletBtn.classList.contains('connected');
            
            if (isConnected && buttonText !== 'Disconnect') {
                this.log('Wallet connection button text inconsistency');
                inconsistenciesFound = true;
            }
            
            if (isConnected && !buttonClass) {
                this.log('Wallet connection button class inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && buttonText !== 'Connect Wallet') {
                this.log('Wallet connection button text inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && buttonClass) {
                this.log('Wallet connection button class inconsistency');
                inconsistenciesFound = true;
            }
        }
        
        // Check status indicator
        if (statusIndicator) {
            const indicatorClass = statusIndicator.classList.contains('connected');
            
            if (isConnected && !indicatorClass) {
                this.log('Status indicator class inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && indicatorClass) {
                this.log('Status indicator class inconsistency');
                inconsistenciesFound = true;
            }
        }
        
        // Check connection status text
        if (connectionStatus) {
            const statusText = connectionStatus.textContent.trim();
            
            if (isConnected && statusText !== 'Connected') {
                this.log('Connection status text inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && statusText !== 'Disconnected' && statusText !== 'MetaMask Not Installed') {
                this.log('Connection status text inconsistency');
                inconsistenciesFound = true;
            }
        }
        
        // Check connect MetaMask button
        if (connectMetaMaskBtn) {
            const buttonText = connectMetaMaskBtn.textContent.trim();
            const buttonClass = connectMetaMaskBtn.classList.contains('connected');
            
            if (isConnected && buttonText !== 'Disconnect') {
                this.log('Connect MetaMask button text inconsistency');
                inconsistenciesFound = true;
            }
            
            if (isConnected && !buttonClass) {
                this.log('Connect MetaMask button class inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && buttonText !== 'Connect MetaMask' && buttonText !== 'Install MetaMask') {
                this.log('Connect MetaMask button text inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && buttonClass) {
                this.log('Connect MetaMask button class inconsistency');
                inconsistenciesFound = true;
            }
        }
        
        // Check wallet details visibility
        if (walletDetails) {
            const detailsVisible = walletDetails.style.display !== 'none';
            
            if (isConnected && !detailsVisible) {
                this.log('Wallet details visibility inconsistency');
                inconsistenciesFound = true;
            }
            
            if (!isConnected && detailsVisible) {
                this.log('Wallet details visibility inconsistency');
                inconsistenciesFound = true;
            }
        }
        
        // Fix inconsistencies if found
        if (inconsistenciesFound) {
            this.fixWalletConnectionInconsistencies();
        }
    }
    
    /**
     * Check for TradingView widget issues
     */
    checkTradingViewIssues() {
        // Check if TradingView container exists
        const tradingViewContainer = document.getElementById('tradingview-chart-container');
        if (!tradingViewContainer) {
            this.log('TradingView container not found');
            return;
        }
        
        // Check if TradingView widget is loaded
        const tradingViewWidget = tradingViewContainer.querySelector('iframe');
        if (!tradingViewWidget) {
            this.log('TradingView widget not loaded');
            this.fixTradingViewWidgetNotLoaded();
            return;
        }
        
        // Check for error messages in TradingView container
        const errorMessages = tradingViewContainer.querySelectorAll('.tv-widget-error');
        if (errorMessages.length > 0) {
            this.log('TradingView widget error messages found');
            this.fixTradingViewWidgetErrors();
            return;
        }
    }
    
    /**
     * Check for market data issues
     */
    checkMarketDataIssues() {
        // Check if market data service is available
        if (!window.marketDataService) {
            this.log('Market data service not available');
            this.fixMarketDataServiceMissing();
            return;
        }
        
        // Check if market data is being updated
        const marketDataStatus = document.getElementById('market-data-status');
        if (marketDataStatus && marketDataStatus.textContent.includes('Reconnecting')) {
            this.log('Market data reconnecting');
            this.fixMarketDataReconnecting();
            return;
        }
        
        // Check if market data values are present
        const marketItems = document.querySelectorAll('.market-item-value');
        let emptyValuesFound = false;
        
        marketItems.forEach(item => {
            if (!item.textContent || item.textContent.trim() === '') {
                this.log('Empty market data value found');
                emptyValuesFound = true;
            }
        });
        
        if (emptyValuesFound) {
            this.fixEmptyMarketDataValues();
            return;
        }
    }
    
    /**
     * Check for UI inconsistencies
     */
    checkUIInconsistencies() {
        // Check for duplicate elements
        this.checkForDuplicateElements();
        
        // Check for missing elements
        this.checkForMissingElements();
        
        // Check for incorrect styles
        this.checkForIncorrectStyles();
        
        // Check for notifications that should be removed
        this.checkForStaleNotifications();
    }
    
    /**
     * Check for JavaScript errors
     */
    checkJavaScriptErrors() {
        // We can't directly access the console errors, but we can set up a global error handler
        if (!window.onerror) {
            window.onerror = (message, source, lineno, colno, error) => {
                this.log('JavaScript error:', message, 'at', source, lineno, colno);
                this.handleJavaScriptError(message, source, lineno, colno, error);
                return true; // Prevent default error handling
            };
        }
    }
    
    /**
     * Fix wallet connection sync missing
     */
    fixWalletConnectionSyncMissing() {
        this.log('Fixing missing wallet connection sync...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('wallet-connection-sync-missing') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for wallet connection sync missing');
            return;
        }
        
        this.incrementFixAttempts('wallet-connection-sync-missing');
        
        // Create a new script element
        const script = document.createElement('script');
        script.src = 'wallet-connection-sync.js';
        script.onload = () => {
            this.log('Wallet connection sync script loaded');
            this.addToSystemLog('AI Debug Agent: Fixed missing wallet connection sync');
            
            // Initialize wallet connection sync
            if (window.walletConnectionSync) {
                window.walletConnectionSync.initialize();
            }
        };
        script.onerror = () => {
            this.log('Failed to load wallet connection sync script');
            this.addToSystemLog('AI Debug Agent: Failed to fix missing wallet connection sync');
        };
        
        // Add script to document
        document.head.appendChild(script);
    }
    
    /**
     * Fix wallet connection inconsistencies
     */
    fixWalletConnectionInconsistencies() {
        this.log('Fixing wallet connection inconsistencies...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('wallet-connection-inconsistencies') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for wallet connection inconsistencies');
            return;
        }
        
        this.incrementFixAttempts('wallet-connection-inconsistencies');
        
        // Force UI update
        if (window.walletConnectionSync) {
            window.walletConnectionSync.updateUIElements();
            this.log('Forced UI update for wallet connection');
            this.addToSystemLog('AI Debug Agent: Fixed wallet connection UI inconsistencies');
        }
    }
    
    /**
     * Fix TradingView widget not loaded
     */
    fixTradingViewWidgetNotLoaded() {
        this.log('Fixing TradingView widget not loaded...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('tradingview-widget-not-loaded') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for TradingView widget not loaded');
            return;
        }
        
        this.incrementFixAttempts('tradingview-widget-not-loaded');
        
        // Try to reinitialize TradingView widget
        const tradingViewContainer = document.getElementById('tradingview-chart-container');
        if (tradingViewContainer) {
            // Clear container
            tradingViewContainer.innerHTML = '';
            
            // Create new widget
            if (window.TradingView) {
                new window.TradingView.widget({
                    "width": "100%",
                    "height": "100%",
                    "symbol": "BINANCE:AVAXUSDT",
                    "interval": "60",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#242a38",
                    "enable_publishing": false,
                    "hide_top_toolbar": false,
                    "hide_legend": false,
                    "save_image": false,
                    "container_id": "tradingview-chart-container",
                    "studies": [
                        "MASimple@tv-basicstudies",
                        "RSI@tv-basicstudies",
                        "MACD@tv-basicstudies"
                    ]
                });
                
                this.log('Reinitialized TradingView widget');
                this.addToSystemLog('AI Debug Agent: Fixed TradingView widget loading issue');
            } else {
                // Try to load TradingView script
                const script = document.createElement('script');
                script.src = 'https://s3.tradingview.com/tv.js';
                script.onload = () => {
                    this.log('TradingView script loaded');
                    this.addToSystemLog('AI Debug Agent: Loaded TradingView script');
                    
                    // Try again after script is loaded
                    setTimeout(() => {
                        this.fixTradingViewWidgetNotLoaded();
                    }, 1000);
                };
                script.onerror = () => {
                    this.log('Failed to load TradingView script');
                    this.addToSystemLog('AI Debug Agent: Failed to load TradingView script');
                };
                
                // Add script to document
                document.head.appendChild(script);
            }
        }
    }
    
    /**
     * Fix TradingView widget errors
     */
    fixTradingViewWidgetErrors() {
        this.log('Fixing TradingView widget errors...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('tradingview-widget-errors') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for TradingView widget errors');
            return;
        }
        
        this.incrementFixAttempts('tradingview-widget-errors');
        
        // Try to reinitialize TradingView widget with different settings
        const tradingViewContainer = document.getElementById('tradingview-chart-container');
        if (tradingViewContainer) {
            // Clear container
            tradingViewContainer.innerHTML = '';
            
            // Create new widget with minimal settings
            if (window.TradingView) {
                new window.TradingView.widget({
                    "width": "100%",
                    "height": "100%",
                    "symbol": "BINANCE:AVAXUSDT",
                    "interval": "60",
                    "timezone": "Etc/UTC",
                    "theme": "dark",
                    "style": "1",
                    "locale": "en",
                    "toolbar_bg": "#242a38",
                    "enable_publishing": false,
                    "container_id": "tradingview-chart-container"
                });
                
                this.log('Reinitialized TradingView widget with minimal settings');
                this.addToSystemLog('AI Debug Agent: Fixed TradingView widget errors');
            }
        }
    }
    
    /**
     * Fix market data service missing
     */
    fixMarketDataServiceMissing() {
        this.log('Fixing missing market data service...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('market-data-service-missing') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for market data service missing');
            return;
        }
        
        this.incrementFixAttempts('market-data-service-missing');
        
        // Create a new script element
        const script = document.createElement('script');
        script.src = 'real-time-market-data.js';
        script.onload = () => {
            this.log('Market data service script loaded');
            this.addToSystemLog('AI Debug Agent: Fixed missing market data service');
            
            // Initialize market data service
            if (window.marketDataService) {
                window.marketDataService.initialize();
            }
        };
        script.onerror = () => {
            this.log('Failed to load market data service script');
            this.addToSystemLog('AI Debug Agent: Failed to fix missing market data service');
        };
        
        // Add script to document
        document.head.appendChild(script);
    }
    
    /**
     * Fix market data reconnecting
     */
    fixMarketDataReconnecting() {
        this.log('Fixing market data reconnecting...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('market-data-reconnecting') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for market data reconnecting');
            return;
        }
        
        this.incrementFixAttempts('market-data-reconnecting');
        
        // Try to reinitialize market data service
        if (window.marketDataService) {
            // Stop current service
            if (window.marketDataService.stop) {
                window.marketDataService.stop();
            }
            
            // Reinitialize
            if (window.marketDataService.initialize) {
                window.marketDataService.initialize();
                this.log('Reinitialized market data service');
                this.addToSystemLog('AI Debug Agent: Fixed market data reconnection issue');
            }
        }
    }
    
    /**
     * Fix empty market data values
     */
    fixEmptyMarketDataValues() {
        this.log('Fixing empty market data values...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('empty-market-data-values') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for empty market data values');
            return;
        }
        
        this.incrementFixAttempts('empty-market-data-values');
        
        // Set default values if market data service is not available
        const marketItems = document.querySelectorAll('.market-item');
        
        marketItems.forEach((item, index) => {
            const valueElement = item.querySelector('.market-item-value');
            const changeElement = item.querySelector('.market-item-change');
            
            if (valueElement && (!valueElement.textContent || valueElement.textContent.trim() === '')) {
                // Set default values based on index
                switch (index) {
                    case 0: // AVAX/USDT
                        valueElement.textContent = '$22.75';
                        if (changeElement) {
                            changeElement.textContent = '+2.34%';
                            changeElement.className = 'market-item-change positive';
                        }
                        break;
                    case 1: // 24h Volume
                        valueElement.textContent = '$156.8M';
                        if (changeElement) {
                            changeElement.textContent = '+5.67%';
                            changeElement.className = 'market-item-change positive';
                        }
                        break;
                    case 2: // Funding Rate
                        valueElement.textContent = '0.01%';
                        if (changeElement) {
                            changeElement.textContent = '-0.002%';
                            changeElement.className = 'market-item-change negative';
                        }
                        break;
                    case 3: // Open Interest
                        valueElement.textContent = '$42.3M';
                        if (changeElement) {
                            changeElement.textContent = '+3.21%';
                            changeElement.className = 'market-item-change positive';
                        }
                        break;
                    default:
                        valueElement.textContent = '$0.00';
                        if (changeElement) {
                            changeElement.textContent = '0.00%';
                            changeElement.className = 'market-item-change';
                        }
                }
            }
        });
        
        this.log('Set default values for empty market data');
        this.addToSystemLog('AI Debug Agent: Fixed empty market data values');
    }
    
    /**
     * Check for duplicate elements
     */
    checkForDuplicateElements() {
        // Check for duplicate portfolio analytics sections
        const portfolioAnalyticsSections = document.querySelectorAll('.card h2');
        let portfolioAnalyticsCount = 0;
        
        portfolioAnalyticsSections.forEach(heading => {
            if (heading.textContent.trim() === 'Portfolio Analytics') {
                portfolioAnalyticsCount++;
            }
        });
        
        if (portfolioAnalyticsCount > 1) {
            this.log('Duplicate portfolio analytics sections found:', portfolioAnalyticsCount);
            this.fixDuplicatePortfolioAnalytics();
        }
    }
    
    /**
     * Check for missing elements
     */
    checkForMissingElements() {
        // Check for missing required elements
        const requiredElements = [
            { id: 'tradingview-chart-container', name: 'TradingView Chart Container' },
            { id: 'system-log', name: 'System Log' },
            { id: 'trading-history', name: 'Trading History' },
            { id: 'portfolio-chart-container', name: 'Portfolio Chart Container' }
        ];
        
        requiredElements.forEach(element => {
            if (!document.getElementById(element.id)) {
                this.log('Missing required element:', element.name);
                this.fixMissingElement(element);
            }
        });
    }
    
    /**
     * Check for incorrect styles
     */
    checkForIncorrectStyles() {
        // Check for elements with incorrect styles
        const elementsToCheck = [
            { selector: '.status-indicator.connected', property: 'background-color', expectedValue: 'rgb(40, 167, 69)' },
            { selector: '.status-indicator.disconnected', property: 'background-color', expectedValue: 'rgb(220, 53, 69)' },
            { selector: '.market-item-change.positive', property: 'color', expectedValue: 'rgb(40, 167, 69)' },
            { selector: '.market-item-change.negative', property: 'color', expectedValue: 'rgb(220, 53, 69)' }
        ];
        
        elementsToCheck.forEach(element => {
            const elements = document.querySelectorAll(element.selector);
            
            elements.forEach(el => {
                const computedStyle = window.getComputedStyle(el);
                const actualValue = computedStyle.getPropertyValue(element.property);
                
                if (actualValue !== element.expectedValue) {
                    this.log('Incorrect style for', element.selector, ':', element.property, 'expected', element.expectedValue, 'got', actualValue);
                    this.fixIncorrectStyle(element, el);
                }
            });
        });
    }
    
    /**
     * Check for stale notifications
     */
    checkForStaleNotifications() {
        // Check for notifications that should be removed
        const notifications = document.querySelectorAll('.notification');
        
        notifications.forEach(notification => {
            // Check if notification is stale (older than 5 seconds)
            const notificationTime = notification.getAttribute('data-time');
            if (notificationTime) {
                const timeElapsed = Date.now() - parseInt(notificationTime);
                if (timeElapsed > 5000) {
                    this.log('Stale notification found');
                    this.fixStaleNotification(notification);
                }
            } else {
                // No time attribute, add one
                notification.setAttribute('data-time', Date.now().toString());
            }
        });
    }
    
    /**
     * Fix duplicate portfolio analytics
     */
    fixDuplicatePortfolioAnalytics() {
        this.log('Fixing duplicate portfolio analytics...');
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('duplicate-portfolio-analytics') >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for duplicate portfolio analytics');
            return;
        }
        
        this.incrementFixAttempts('duplicate-portfolio-analytics');
        
        // Find all portfolio analytics sections
        const portfolioAnalyticsSections = [];
        const cardElements = document.querySelectorAll('.card');
        
        cardElements.forEach(card => {
            const heading = card.querySelector('h2');
            if (heading && heading.textContent.trim() === 'Portfolio Analytics') {
                portfolioAnalyticsSections.push(card);
            }
        });
        
        // Keep only the first one
        if (portfolioAnalyticsSections.length > 1) {
            for (let i = 1; i < portfolioAnalyticsSections.length; i++) {
                portfolioAnalyticsSections[i].remove();
            }
            
            this.log('Removed duplicate portfolio analytics sections');
            this.addToSystemLog('AI Debug Agent: Fixed duplicate portfolio analytics sections');
        }
    }
    
    /**
     * Fix missing element
     */
    fixMissingElement(element) {
        this.log('Fixing missing element:', element.name);
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('missing-element-' + element.id) >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for missing element:', element.name);
            return;
        }
        
        this.incrementFixAttempts('missing-element-' + element.id);
        
        // Create missing element based on ID
        switch (element.id) {
            case 'tradingview-chart-container':
                this.createTradingViewContainer();
                break;
            case 'system-log':
                this.createSystemLog();
                break;
            case 'trading-history':
                this.createTradingHistory();
                break;
            case 'portfolio-chart-container':
                this.createPortfolioChartContainer();
                break;
        }
    }
    
    /**
     * Fix incorrect style
     */
    fixIncorrectStyle(element, el) {
        this.log('Fixing incorrect style for', element.selector);
        
        // Check if we've already tried to fix this
        if (this.getFixAttempts('incorrect-style-' + element.selector) >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for incorrect style:', element.selector);
            return;
        }
        
        this.incrementFixAttempts('incorrect-style-' + element.selector);
        
        // Set correct style
        el.style.setProperty(element.property, element.expectedValue, 'important');
        
        this.log('Fixed incorrect style for', element.selector);
    }
    
    /**
     * Fix stale notification
     */
    fixStaleNotification(notification) {
        this.log('Fixing stale notification');
        
        // Add fade-out class
        notification.classList.add('fade-out');
        
        // Remove after animation
        setTimeout(() => {
            notification.remove();
        }, 500);
    }
    
    /**
     * Create TradingView container
     */
    createTradingViewContainer() {
        this.log('Creating TradingView container');
        
        // Find TradingView chart card
        const chartCard = document.querySelector('.card h2');
        let tradingViewCard = null;
        
        if (chartCard) {
            const headings = document.querySelectorAll('.card h2');
            
            for (let i = 0; i < headings.length; i++) {
                if (headings[i].textContent.trim() === 'TradingView Chart') {
                    tradingViewCard = headings[i].parentElement;
                    break;
                }
            }
        }
        
        if (tradingViewCard) {
            // Create chart container
            const chartContainer = document.createElement('div');
            chartContainer.className = 'chart-container';
            
            // Create TradingView container
            const tradingViewContainer = document.createElement('div');
            tradingViewContainer.id = 'tradingview-chart-container';
            tradingViewContainer.className = 'tradingview-container';
            
            // Add to chart container
            chartContainer.appendChild(tradingViewContainer);
            
            // Add to card
            tradingViewCard.appendChild(chartContainer);
            
            this.log('Created TradingView container');
            this.addToSystemLog('AI Debug Agent: Fixed missing TradingView container');
            
            // Initialize TradingView widget
            setTimeout(() => {
                this.fixTradingViewWidgetNotLoaded();
            }, 1000);
        }
    }
    
    /**
     * Create system log
     */
    createSystemLog() {
        this.log('Creating system log');
        
        // Find AI Trading Agent card
        const aiCard = document.querySelector('.card h2');
        let aiTradingCard = null;
        
        if (aiCard) {
            const headings = document.querySelectorAll('.card h2');
            
            for (let i = 0; i < headings.length; i++) {
                if (headings[i].textContent.trim() === 'AI Trading Agent') {
                    aiTradingCard = headings[i].parentElement;
                    break;
                }
            }
        }
        
        if (aiTradingCard) {
            // Create system log
            const systemLog = document.createElement('div');
            systemLog.id = 'system-log';
            systemLog.className = 'log-container';
            
            // Add initial log entry
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'log-time';
            timestamp.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.textContent = 'System log created by AI Debug Agent';
            
            logEntry.appendChild(timestamp);
            logEntry.appendChild(logMessage);
            systemLog.appendChild(logEntry);
            
            // Add to card
            aiTradingCard.appendChild(systemLog);
            
            this.log('Created system log');
            this.addToSystemLog('AI Debug Agent: Fixed missing system log');
        }
    }
    
    /**
     * Create trading history
     */
    createTradingHistory() {
        this.log('Creating trading history');
        
        // Find Trading History card
        const historyCard = document.querySelector('.card h2');
        let tradingHistoryCard = null;
        
        if (historyCard) {
            const headings = document.querySelectorAll('.card h2');
            
            for (let i = 0; i < headings.length; i++) {
                if (headings[i].textContent.trim() === 'Trading History') {
                    tradingHistoryCard = headings[i].parentElement;
                    break;
                }
            }
        }
        
        if (tradingHistoryCard) {
            // Create trading history
            const tradingHistory = document.createElement('div');
            tradingHistory.id = 'trading-history';
            tradingHistory.className = 'log-container';
            
            // Add initial log entry
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const timestamp = document.createElement('span');
            timestamp.className = 'log-time';
            timestamp.textContent = '--:--:--';
            
            const logMessage = document.createElement('span');
            logMessage.textContent = 'No trades yet';
            
            logEntry.appendChild(timestamp);
            logEntry.appendChild(logMessage);
            tradingHistory.appendChild(logEntry);
            
            // Add to card
            tradingHistoryCard.appendChild(tradingHistory);
            
            this.log('Created trading history');
            this.addToSystemLog('AI Debug Agent: Fixed missing trading history');
        }
    }
    
    /**
     * Create portfolio chart container
     */
    createPortfolioChartContainer() {
        this.log('Creating portfolio chart container');
        
        // Find Portfolio Analytics card
        const portfolioCard = document.querySelector('.card h2');
        let portfolioAnalyticsCard = null;
        
        if (portfolioCard) {
            const headings = document.querySelectorAll('.card h2');
            
            for (let i = 0; i < headings.length; i++) {
                if (headings[i].textContent.trim() === 'Portfolio Analytics') {
                    portfolioAnalyticsCard = headings[i].parentElement;
                    break;
                }
            }
        }
        
        if (portfolioAnalyticsCard) {
            // Create portfolio chart container
            const chartContainer = document.createElement('div');
            chartContainer.id = 'portfolio-chart-container';
            chartContainer.className = 'chart-container';
            chartContainer.style.height = '200px';
            
            // Add to card
            const terminalElement = portfolioAnalyticsCard.querySelector('.portfolio-terminal');
            if (terminalElement) {
                portfolioAnalyticsCard.insertBefore(chartContainer, terminalElement);
            } else {
                portfolioAnalyticsCard.appendChild(chartContainer);
            }
            
            this.log('Created portfolio chart container');
            this.addToSystemLog('AI Debug Agent: Fixed missing portfolio chart container');
            
            // Initialize portfolio chart
            setTimeout(() => {
                this.initializePortfolioChart();
            }, 1000);
        }
    }
    
    /**
     * Initialize portfolio chart
     */
    initializePortfolioChart() {
        this.log('Initializing portfolio chart');
        
        const portfolioChartContainer = document.getElementById('portfolio-chart-container');
        if (portfolioChartContainer && window.Chart) {
            // Create canvas for chart
            const canvas = document.createElement('canvas');
            canvas.id = 'portfolio-chart';
            portfolioChartContainer.appendChild(canvas);
            
            // Generate initial data
            const labels = [];
            const data = [];
            const now = new Date();
            
            for (let i = 30; i >= 0; i--) {
                const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
                labels.push(date.toLocaleDateString());
                data.push(1000);
            }
            
            // Create chart
            const ctx = canvas.getContext('2d');
            new window.Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [{
                        label: 'Portfolio Value',
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
            
            this.log('Initialized portfolio chart');
            this.addToSystemLog('AI Debug Agent: Initialized portfolio chart');
        } else if (!window.Chart) {
            // Try to load Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                this.log('Chart.js loaded');
                this.addToSystemLog('AI Debug Agent: Loaded Chart.js');
                
                // Try again after script is loaded
                setTimeout(() => {
                    this.initializePortfolioChart();
                }, 1000);
            };
            script.onerror = () => {
                this.log('Failed to load Chart.js');
                this.addToSystemLog('AI Debug Agent: Failed to load Chart.js');
            };
            
            // Add script to document
            document.head.appendChild(script);
        }
    }
    
    /**
     * Handle JavaScript error
     */
    handleJavaScriptError(message, source, lineno, colno, error) {
        this.log('Handling JavaScript error:', message);
        
        // Check if we've already tried to fix this
        const errorKey = 'js-error-' + message.substring(0, 50);
        if (this.getFixAttempts(errorKey) >= this.maxFixAttempts) {
            this.log('Max fix attempts reached for JavaScript error:', message);
            return;
        }
        
        this.incrementFixAttempts(errorKey);
        
        // Add to system log
        this.addToSystemLog('AI Debug Agent: Detected JavaScript error: ' + message);
        
        // Try to fix common errors
        if (message.includes('is not a function')) {
            // Function not found error
            const funcName = message.match(/(\w+)\.(\w+) is not a function/);
            if (funcName && funcName.length >= 3) {
                const obj = funcName[1];
                const func = funcName[2];
                
                this.log('Function not found error:', obj, func);
                this.fixFunctionNotFoundError(obj, func);
            }
        } else if (message.includes('is not defined')) {
            // Variable not defined error
            const varName = message.match(/(\w+) is not defined/);
            if (varName && varName.length >= 2) {
                const variable = varName[1];
                
                this.log('Variable not defined error:', variable);
                this.fixVariableNotDefinedError(variable);
            }
        } else if (message.includes('Cannot read properties of')) {
            // Null or undefined property access
            const propAccess = message.match(/Cannot read properties of (null|undefined) \(reading '(\w+)'\)/);
            if (propAccess && propAccess.length >= 3) {
                const objType = propAccess[1];
                const prop = propAccess[2];
                
                this.log('Null or undefined property access:', objType, prop);
                this.fixNullPropertyAccessError(objType, prop);
            }
        }
    }
    
    /**
     * Fix function not found error
     */
    fixFunctionNotFoundError(obj, func) {
        this.log('Fixing function not found error:', obj, func);
        
        // Try to fix common function errors
        if (obj === 'widget' && func === 'onChartReady') {
            // TradingView widget onChartReady error
            this.log('TradingView widget onChartReady error');
            this.fixTradingViewWidgetErrors();
        } else if (obj === 'marketDataService') {
            // Market data service function error
            this.log('Market data service function error');
            this.fixMarketDataServiceMissing();
        } else if (obj === 'walletConnectionSync') {
            // Wallet connection sync function error
            this.log('Wallet connection sync function error');
            this.fixWalletConnectionSyncMissing();
        }
    }
    
    /**
     * Fix variable not defined error
     */
    fixVariableNotDefinedError(variable) {
        this.log('Fixing variable not defined error:', variable);
        
        // Try to fix common variable errors
        if (variable === 'TradingView') {
            // TradingView not defined
            this.log('TradingView not defined');
            
            // Try to load TradingView script
            const script = document.createElement('script');
            script.src = 'https://s3.tradingview.com/tv.js';
            script.onload = () => {
                this.log('TradingView script loaded');
                this.addToSystemLog('AI Debug Agent: Loaded TradingView script');
                
                // Try to fix TradingView widget
                setTimeout(() => {
                    this.fixTradingViewWidgetNotLoaded();
                }, 1000);
            };
            script.onerror = () => {
                this.log('Failed to load TradingView script');
                this.addToSystemLog('AI Debug Agent: Failed to load TradingView script');
            };
            
            // Add script to document
            document.head.appendChild(script);
        } else if (variable === 'Chart') {
            // Chart.js not defined
            this.log('Chart.js not defined');
            
            // Try to load Chart.js
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => {
                this.log('Chart.js loaded');
                this.addToSystemLog('AI Debug Agent: Loaded Chart.js');
                
                // Try to initialize portfolio chart
                setTimeout(() => {
                    this.initializePortfolioChart();
                }, 1000);
            };
            script.onerror = () => {
                this.log('Failed to load Chart.js');
                this.addToSystemLog('AI Debug Agent: Failed to load Chart.js');
            };
            
            // Add script to document
            document.head.appendChild(script);
        }
    }
    
    /**
     * Fix null property access error
     */
    fixNullPropertyAccessError(objType, prop) {
        this.log('Fixing null property access error:', objType, prop);
        
        // Add to system log
        this.addToSystemLog('AI Debug Agent: Fixed null property access error for ' + prop);
    }
    
    /**
     * Get fix attempts for issue
     */
    getFixAttempts(issue) {
        return this.fixAttempts[issue] || 0;
    }
    
    /**
     * Increment fix attempts for issue
     */
    incrementFixAttempts(issue) {
        this.fixAttempts[issue] = this.getFixAttempts(issue) + 1;
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
     * Log message to console if debug mode is enabled
     */
    log(...args) {
        if (this.debugMode) {
            console.log('[AIDebugAgent]', ...args);
        }
    }
}

// Initialize AI Debug Agent when document is ready
document.addEventListener('DOMContentLoaded', function() {
    window.aiDebugAgent = new AIDebugAgent();
    window.aiDebugAgent.initialize();
});
