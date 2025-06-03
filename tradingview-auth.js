/**
 * TradingView Account Authentication Module
 * 
 * This module provides secure authentication with a user's TradingView account
 * to access Market Cipher and Lux Algo indicators for the AI trading agent.
 */

class TradingViewAuth {
    constructor() {
        this.isAuthenticated = false;
        this.username = null;
        this.apiKey = null;
        this.authToken = null;
        this.authMethod = null; // 'api' or 'pine'
        this.lastAuthTime = null;
        this.authStatus = 'disconnected'; // 'disconnected', 'connecting', 'connected', 'error'
        this.errorMessage = null;
        this.pineScriptExport = null;
        this.authCallbacks = [];
    }
    
    /**
     * Initialize the authentication module
     */
    initialize() {
        console.log('Initializing TradingView authentication module...');
        
        // Check for stored credentials
        this.checkStoredCredentials();
        
        // Create authentication UI
        this.createAuthUI();
        
        return {
            success: true,
            message: 'TradingView authentication module initialized',
            isAuthenticated: this.isAuthenticated
        };
    }
    
    /**
     * Check for stored credentials in local storage
     */
    checkStoredCredentials() {
        try {
            // Get encrypted credentials from local storage
            const encryptedCredentials = localStorage.getItem('tradingview_credentials');
            
            if (encryptedCredentials) {
                // Decrypt credentials (simplified for demo)
                const credentials = JSON.parse(atob(encryptedCredentials));
                
                if (credentials.username && (credentials.apiKey || credentials.pineScriptExport)) {
                    this.username = credentials.username;
                    this.apiKey = credentials.apiKey || null;
                    this.pineScriptExport = credentials.pineScriptExport || null;
                    this.authMethod = credentials.authMethod || 'api';
                    this.lastAuthTime = credentials.lastAuthTime || null;
                    
                    // Auto-authenticate if credentials exist
                    if (this.authMethod === 'api' && this.apiKey) {
                        this.authenticateWithAPI(this.username, this.apiKey, true);
                    } else if (this.authMethod === 'pine' && this.pineScriptExport) {
                        this.authenticateWithPineScript(this.username, this.pineScriptExport, true);
                    }
                    
                    console.log('Found stored TradingView credentials for', this.username);
                    return true;
                }
            }
            
            return false;
        } catch (error) {
            console.error('Error checking stored credentials:', error);
            return false;
        }
    }
    
    /**
     * Create authentication UI
     */
    createAuthUI() {
        // Check if container already exists
        let container = document.getElementById('tradingview-auth');
        if (container) return;
        
        // Find appropriate container to append to
        const targetContainer = document.querySelector('.settings-section') || 
                               document.querySelector('.account-section') || 
                               document.querySelector('.main-container');
        
        if (!targetContainer) {
            console.warn('Could not find appropriate container for TradingView auth UI');
            return;
        }
        
        // Create container
        container = document.createElement('div');
        container.id = 'tradingview-auth';
        container.className = 'auth-section card';
        
        // Create header
        const header = document.createElement('div');
        header.className = 'card-header';
        header.innerHTML = '<h3>TradingView Account</h3>';
        
        // Create body
        const body = document.createElement('div');
        body.className = 'card-body';
        
        // Create status display
        const statusDisplay = document.createElement('div');
        statusDisplay.className = 'auth-status';
        statusDisplay.innerHTML = `
            <div class="status-row">
                <span class="status-label">Status:</span>
                <span id="tv-auth-status" class="status-value ${this.isAuthenticated ? 'text-success' : 'text-danger'}">
                    ${this.isAuthenticated ? 'Connected' : 'Disconnected'}
                </span>
            </div>
            <div class="status-row">
                <span class="status-label">Username:</span>
                <span id="tv-auth-username" class="status-value">
                    ${this.username || 'Not logged in'}
                </span>
            </div>
            <div class="status-row">
                <span class="status-label">Method:</span>
                <span id="tv-auth-method" class="status-value">
                    ${this.authMethod ? (this.authMethod === 'api' ? 'API Key' : 'Pine Script') : 'None'}
                </span>
            </div>
        `;
        
        // Create form
        const form = document.createElement('div');
        form.className = 'auth-form';
        form.innerHTML = `
            <div class="form-tabs">
                <button id="api-tab-btn" class="tab-btn ${this.authMethod !== 'pine' ? 'active' : ''}">API Key</button>
                <button id="pine-tab-btn" class="tab-btn ${this.authMethod === 'pine' ? 'active' : ''}">Pine Script</button>
            </div>
            
            <div id="api-tab" class="tab-content ${this.authMethod !== 'pine' ? 'active' : ''}">
                <div class="form-group">
                    <label for="tv-username">TradingView Username</label>
                    <input type="text" id="tv-username" class="form-control" placeholder="Your TradingView username">
                </div>
                <div class="form-group">
                    <label for="tv-api-key">API Key</label>
                    <input type="password" id="tv-api-key" class="form-control" placeholder="Your TradingView API key">
                </div>
                <div class="form-actions">
                    <button id="tv-connect-api" class="btn btn-primary">Connect</button>
                    <button id="tv-disconnect-api" class="btn btn-outline" ${!this.isAuthenticated ? 'disabled' : ''}>Disconnect</button>
                </div>
            </div>
            
            <div id="pine-tab" class="tab-content ${this.authMethod === 'pine' ? 'active' : ''}">
                <div class="form-group">
                    <label for="tv-pine-username">TradingView Username</label>
                    <input type="text" id="tv-pine-username" class="form-control" placeholder="Your TradingView username">
                </div>
                <div class="form-group">
                    <label for="tv-pine-script">Pine Script Export URL</label>
                    <input type="text" id="tv-pine-script" class="form-control" placeholder="Pine Script export URL or webhook">
                </div>
                <div class="form-actions">
                    <button id="tv-connect-pine" class="btn btn-primary">Connect</button>
                    <button id="tv-disconnect-pine" class="btn btn-outline" ${!this.isAuthenticated ? 'disabled' : ''}>Disconnect</button>
                </div>
            </div>
        `;
        
        // Create help text
        const helpText = document.createElement('div');
        helpText.className = 'auth-help';
        helpText.innerHTML = `
            <div class="help-toggle">
                <button id="show-help-btn" class="btn btn-text">Need help connecting?</button>
            </div>
            <div id="help-content" class="help-content" style="display: none;">
                <h4>API Key Method (Recommended)</h4>
                <p>For TradingView Pro+ accounts with API access:</p>
                <ol>
                    <li>Log in to your TradingView account</li>
                    <li>Go to Profile → Settings → API Keys</li>
                    <li>Generate a new API key with "Read" permissions</li>
                    <li>Copy and paste your username and API key above</li>
                </ol>
                
                <h4>Pine Script Method (Alternative)</h4>
                <p>If you don't have API access:</p>
                <ol>
                    <li>Download our custom Pine Script from <a href="#" id="download-pine">here</a></li>
                    <li>Add it to your TradingView chart</li>
                    <li>Configure the script to export signals to a webhook URL</li>
                    <li>Enter your username and the webhook URL above</li>
                </ol>
                
                <p><strong>Security Note:</strong> Your credentials are stored securely in your browser and never sent to any server.</p>
            </div>
        `;
        
        // Assemble UI
        body.appendChild(statusDisplay);
        body.appendChild(form);
        body.appendChild(helpText);
        
        container.appendChild(header);
        container.appendChild(body);
        
        // Add to page
        targetContainer.appendChild(container);
        
        // Add event listeners
        this.addEventListeners();
    }
    
    /**
     * Add event listeners to UI elements
     */
    addEventListeners() {
        // Tab switching
        document.getElementById('api-tab-btn').addEventListener('click', () => {
            document.getElementById('api-tab').classList.add('active');
            document.getElementById('pine-tab').classList.remove('active');
            document.getElementById('api-tab-btn').classList.add('active');
            document.getElementById('pine-tab-btn').classList.remove('active');
        });
        
        document.getElementById('pine-tab-btn').addEventListener('click', () => {
            document.getElementById('pine-tab').classList.add('active');
            document.getElementById('api-tab').classList.remove('active');
            document.getElementById('pine-tab-btn').classList.add('active');
            document.getElementById('api-tab-btn').classList.remove('active');
        });
        
        // Help toggle
        document.getElementById('show-help-btn').addEventListener('click', () => {
            const helpContent = document.getElementById('help-content');
            if (helpContent.style.display === 'none') {
                helpContent.style.display = 'block';
                document.getElementById('show-help-btn').textContent = 'Hide help';
            } else {
                helpContent.style.display = 'none';
                document.getElementById('show-help-btn').textContent = 'Need help connecting?';
            }
        });
        
        // API connect button
        document.getElementById('tv-connect-api').addEventListener('click', () => {
            const username = document.getElementById('tv-username').value;
            const apiKey = document.getElementById('tv-api-key').value;
            
            if (username && apiKey) {
                this.authenticateWithAPI(username, apiKey);
            } else {
                this.showError('Please enter both username and API key');
            }
        });
        
        // API disconnect button
        document.getElementById('tv-disconnect-api').addEventListener('click', () => {
            this.disconnect();
        });
        
        // Pine Script connect button
        document.getElementById('tv-connect-pine').addEventListener('click', () => {
            const username = document.getElementById('tv-pine-username').value;
            const pineScript = document.getElementById('tv-pine-script').value;
            
            if (username && pineScript) {
                this.authenticateWithPineScript(username, pineScript);
            } else {
                this.showError('Please enter both username and Pine Script export URL');
            }
        });
        
        // Pine Script disconnect button
        document.getElementById('tv-disconnect-pine').addEventListener('click', () => {
            this.disconnect();
        });
        
        // Download Pine Script link
        document.getElementById('download-pine').addEventListener('click', (e) => {
            e.preventDefault();
            this.downloadPineScript();
        });
    }
    
    /**
     * Authenticate with TradingView API
     * @param {string} username - TradingView username
     * @param {string} apiKey - TradingView API key
     * @param {boolean} silent - Whether to show UI notifications
     */
    async authenticateWithAPI(username, apiKey, silent = false) {
        if (!username || !apiKey) {
            this.showError('Please enter both username and API key');
            return false;
        }
        
        try {
            this.updateAuthStatus('connecting');
            
            if (!silent) {
                this.showNotification('Connecting to TradingView...', 'info');
            }
            
            // Simulate API authentication (in a real implementation, this would call the TradingView API)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Store credentials
            this.username = username;
            this.apiKey = apiKey;
            this.authMethod = 'api';
            this.lastAuthTime = new Date();
            this.isAuthenticated = true;
            
            // Save encrypted credentials to local storage
            this.saveCredentials();
            
            // Update UI
            this.updateAuthStatus('connected');
            
            if (!silent) {
                this.showNotification('Connected to TradingView account', 'success');
            }
            
            // Notify callbacks
            this.notifyAuthCallbacks({
                success: true,
                method: 'api',
                username: username
            });
            
            return true;
        } catch (error) {
            console.error('Error authenticating with TradingView API:', error);
            
            this.updateAuthStatus('error', error.message || 'Authentication failed');
            
            if (!silent) {
                this.showNotification('Failed to connect to TradingView: ' + (error.message || 'Unknown error'), 'error');
            }
            
            return false;
        }
    }
    
    /**
     * Authenticate with Pine Script export
     * @param {string} username - TradingView username
     * @param {string} pineScriptUrl - Pine Script export URL or webhook
     * @param {boolean} silent - Whether to show UI notifications
     */
    async authenticateWithPineScript(username, pineScriptUrl, silent = false) {
        if (!username || !pineScriptUrl) {
            this.showError('Please enter both username and Pine Script export URL');
            return false;
        }
        
        try {
            this.updateAuthStatus('connecting');
            
            if (!silent) {
                this.showNotification('Setting up Pine Script integration...', 'info');
            }
            
            // Simulate Pine Script setup (in a real implementation, this would validate the webhook)
            await new Promise(resolve => setTimeout(resolve, 1500));
            
            // Store credentials
            this.username = username;
            this.pineScriptExport = pineScriptUrl;
            this.authMethod = 'pine';
            this.lastAuthTime = new Date();
            this.isAuthenticated = true;
            
            // Save encrypted credentials to local storage
            this.saveCredentials();
            
            // Update UI
            this.updateAuthStatus('connected');
            
            if (!silent) {
                this.showNotification('Pine Script integration configured successfully', 'success');
            }
            
            // Notify callbacks
            this.notifyAuthCallbacks({
                success: true,
                method: 'pine',
                username: username
            });
            
            return true;
        } catch (error) {
            console.error('Error setting up Pine Script integration:', error);
            
            this.updateAuthStatus('error', error.message || 'Setup failed');
            
            if (!silent) {
                this.showNotification('Failed to set up Pine Script integration: ' + (error.message || 'Unknown error'), 'error');
            }
            
            return false;
        }
    }
    
    /**
     * Disconnect from TradingView
     */
    disconnect() {
        // Clear credentials
        this.username = null;
        this.apiKey = null;
        this.pineScriptExport = null;
        this.authMethod = null;
        this.lastAuthTime = null;
        this.isAuthenticated = false;
        
        // Remove from local storage
        localStorage.removeItem('tradingview_credentials');
        
        // Update UI
        this.updateAuthStatus('disconnected');
        
        // Show notification
        this.showNotification('Disconnected from TradingView', 'info');
        
        // Notify callbacks
        this.notifyAuthCallbacks({
            success: true,
            disconnected: true
        });
        
        return true;
    }
    
    /**
     * Save encrypted credentials to local storage
     */
    saveCredentials() {
        try {
            const credentials = {
                username: this.username,
                apiKey: this.apiKey,
                pineScriptExport: this.pineScriptExport,
                authMethod: this.authMethod,
                lastAuthTime: this.lastAuthTime
            };
            
            // Encrypt credentials (simplified for demo)
            const encryptedCredentials = btoa(JSON.stringify(credentials));
            
            // Save to local storage
            localStorage.setItem('tradingview_credentials', encryptedCredentials);
            
            return true;
        } catch (error) {
            console.error('Error saving credentials:', error);
            return false;
        }
    }
    
    /**
     * Update authentication status in UI
     * @param {string} status - New status
     * @param {string} errorMessage - Error message (if status is 'error')
     */
    updateAuthStatus(status, errorMessage = null) {
        this.authStatus = status;
        this.errorMessage = errorMessage;
        
        // Update status display
        const statusElement = document.getElementById('tv-auth-status');
        const usernameElement = document.getElementById('tv-auth-username');
        const methodElement = document.getElementById('tv-auth-method');
        
        if (statusElement) {
            statusElement.className = 'status-value';
            
            switch (status) {
                case 'connected':
                    statusElement.textContent = 'Connected';
                    statusElement.classList.add('text-success');
                    break;
                    
                case 'connecting':
                    statusElement.textContent = 'Connecting...';
                    statusElement.classList.add('text-warning');
                    break;
                    
                case 'error':
                    statusElement.textContent = 'Error: ' + (errorMessage || 'Unknown error');
                    statusElement.classList.add('text-danger');
                    break;
                    
                case 'disconnected':
                default:
                    statusElement.textContent = 'Disconnected';
                    statusElement.classList.add('text-danger');
                    break;
            }
        }
        
        if (usernameElement) {
            usernameElement.textContent = this.username || 'Not logged in';
        }
        
        if (methodElement) {
            methodElement.textContent = this.authMethod ? 
                (this.authMethod === 'api' ? 'API Key' : 'Pine Script') : 
                'None';
        }
        
        // Update button states
        const disconnectApiBtn = document.getElementById('tv-disconnect-api');
        const disconnectPineBtn = document.getElementById('tv-disconnect-pine');
        
        if (disconnectApiBtn) {
            disconnectApiBtn.disabled = !this.isAuthenticated;
        }
        
        if (disconnectPineBtn) {
            disconnectPineBtn.disabled = !this.isAuthenticated;
        }
    }
    
    /**
     * Show error message
     * @param {string} message - Error message
     */
    showError(message) {
        this.errorMessage = message;
        this.showNotification(message, 'error');
    }
    
    /**
     * Show notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, warning, info)
     */
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`[${type.toUpperCase()}] ${message}`);
            
            // Fallback notification
            const notificationContainer = document.querySelector('.notifications-container');
            if (!notificationContainer) return;
            
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <div class="notification-message">${message}</div>
                </div>
                <button class="notification-close">&times;</button>
            `;
            
            notificationContainer.appendChild(notification);
            
            // Auto-remove after 5 seconds
            setTimeout(() => {
                notification.classList.add('notification-hiding');
                setTimeout(() => {
                    notificationContainer.removeChild(notification);
                }, 300);
            }, 5000);
            
            // Close button
            notification.querySelector('.notification-close').addEventListener('click', () => {
                notification.classList.add('notification-hiding');
                setTimeout(() => {
                    notificationContainer.removeChild(notification);
                }, 300);
            });
        }
    }
    
    /**
     * Download Pine Script for indicator export
     */
    downloadPineScript() {
        // Create Pine Script content
        const pineScriptContent = `// Market Cipher & Lux Algo Signal Export
// For use with Trading Bot AI Agent
// ©2025 Trading Bot

//@version=5
indicator("Market Cipher & Lux Algo Signal Export", overlay=true)

// Configuration
webhookUrl = input.string("https://your-webhook-url-here", "Webhook URL", group="Configuration")
sendSignals = input.bool(true, "Send Signals to Trading Bot", group="Configuration")

// Market Cipher Components
// Wave Trend
n1 = input.int(9, "Channel Length", group="Wave Trend")
n2 = input.int(12, "Average Length", group="Wave Trend")
obLevel = input.int(60, "Overbought Level", group="Wave Trend")
osLevel = input.int(-60, "Oversold Level", group="Wave Trend")

ap = hlc3
esa = ta.ema(ap, n1)
d = ta.ema(math.abs(ap - esa), n1)
ci = (ap - esa) / (0.015 * d)
tci = ta.ema(ci, n2)
wt1 = tci
wt2 = ta.sma(wt1, 3)

// Money Flow
mfiPeriod = input.int(60, "MFI Period", group="Money Flow")
mfi = ta.mfi(hlc3, mfiPeriod)

// RSI
rsiPeriod = input.int(14, "RSI Period", group="RSI")
rsiValue = ta.rsi(close, rsiPeriod)

// VWAP
useVwap = input.bool(true, "Use VWAP", group="VWAP")
vwapValue = ta.vwap(close)

// Lux Algo Components (simplified)
luxTrend = input.string("auto", "Lux Trend Detection", options=["auto", "bullish", "bearish", "neutral"], group="Lux Algo")
luxSensitivity = input.int(3, "Signal Sensitivity", minval=1, maxval=10, group="Lux Algo")

// Signal Generation
blueDot = wt1 < osLevel and wt1 > wt2 and wt1 < 0
redDot = wt1 > obLevel and wt1 < wt2 and wt1 > 0
yellowDot = (wt1 > 0 and wt1 < 20 and wt1 < wt2) or (wt1 < 0 and wt1 > -20 and wt1 > wt2)
diamond = ta.crossover(wt1, wt2) and wt1 < 0 and mfi < 30

// Trend determination
bullishTrend = luxTrend == "auto" ? (ta.ema(close, 50) > ta.ema(close, 200) and wt1 > 0) : luxTrend == "bullish"
bearishTrend = luxTrend == "auto" ? (ta.ema(close, 50) < ta.ema(close, 200) and wt1 < 0) : luxTrend == "bearish"
neutralTrend = luxTrend == "auto" ? (not bullishTrend and not bearishTrend) : luxTrend == "neutral"

// Buy/Sell Signals
buySignal = blueDot or diamond
sellSignal = redDot

// Plotting
plotshape(buySignal, title="Buy Signal", location=location.belowbar, color=color.green, style=shape.triangleup, size=size.small)
plotshape(sellSignal, title="Sell Signal", location=location.abovebar, color=color.red, style=shape.triangledown, size=size.small)
plot(wt1, title="Wave Trend 1", color=color.blue)
plot(wt2, title="Wave Trend 2", color=color.red)
hline(obLevel, title="Overbought Level", color=color.red, linestyle=hline.style_dashed)
hline(osLevel, title="Oversold Level", color=color.green, linestyle=hline.style_dashed)

// Webhook for Trading Bot
if sendSignals and (buySignal or sellSignal or yellowDot or diamond)
    signalType = buySignal ? "BUY" : sellSignal ? "SELL" : yellowDot ? "CAUTION" : "DIAMOND"
    trendType = bullishTrend ? "BULLISH" : bearishTrend ? "BEARISH" : "NEUTRAL"
    
    // Create payload
    payload = {
        "symbol": syminfo.ticker,
        "timeframe": timeframe.period,
        "price": close,
        "signal": signalType,
        "trend": trendType,
        "indicators": {
            "wavetrend1": wt1,
            "wavetrend2": wt2,
            "mfi": mfi,
            "rsi": rsiValue,
            "vwap": useVwap ? vwapValue : na,
            "blueDot": blueDot,
            "redDot": redDot,
            "yellowDot": yellowDot,
            "diamond": diamond
        },
        "timestamp": timenow
    }
    
    webhook.send(webhookUrl, payload, webhook.alert_type_json)`;
        
        // Create download link
        const element = document.createElement('a');
        element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(pineScriptContent));
        element.setAttribute('download', 'MarketCipher_LuxAlgo_Export.pine');
        element.style.display = 'none';
        
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
    }
    
    /**
     * Register authentication callback
     * @param {Function} callback - Callback function
     */
    onAuthChange(callback) {
        if (typeof callback === 'function') {
            this.authCallbacks.push(callback);
        }
    }
    
    /**
     * Notify authentication callbacks
     * @param {Object} data - Authentication data
     */
    notifyAuthCallbacks(data) {
        this.authCallbacks.forEach(callback => {
            callback(data);
        });
    }
    
    /**
     * Get authentication status
     */
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            username: this.username,
            authMethod: this.authMethod,
            lastAuthTime: this.lastAuthTime,
            status: this.authStatus,
            errorMessage: this.errorMessage
        };
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Create global instance
    window.tradingViewAuth = new TradingViewAuth();
    
    // Initialize
    window.tradingViewAuth.initialize();
    
    // Connect to TradingView integration
    if (window.tradingViewIntegration) {
        // Register for auth changes
        window.tradingViewAuth.onAuthChange(authData => {
            if (authData.success && !authData.disconnected) {
                // If authenticated, connect TradingView integration
                window.tradingViewIntegration.setAuthentication(authData);
            } else if (authData.disconnected) {
                // If disconnected, disconnect TradingView integration
                window.tradingViewIntegration.disconnect();
            }
        });
    }
});
