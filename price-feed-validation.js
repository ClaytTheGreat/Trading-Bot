/**
 * Price Feed Validation Module for Trading Bot
 * Tests and validates real-time price data from TradingView and Antarctic Exchange
 */

class PriceFeedValidator {
    constructor() {
        this.tradingViewPrices = [];
        this.antarcticPrices = [];
        this.referenceAPIPrices = [];
        this.validationResults = {
            tradingView: {
                connected: false,
                latency: 0,
                accuracy: 0,
                reliability: 0,
                errors: []
            },
            antarctic: {
                connected: false,
                latency: 0,
                accuracy: 0,
                reliability: 0,
                errors: []
            }
        };
        this.validationStartTime = null;
        this.validationInterval = null;
        this.referenceAPI = 'https://api.binance.com/api/v3/ticker/price?symbol=AVAXUSDT';
        this.isValidating = false;
        this.validationCallbacks = [];
    }
    
    /**
     * Start validation process
     * @param {number} duration - Duration in milliseconds
     * @returns {Object} - Validation status
     */
    startValidation(duration = 60000) {
        if (this.isValidating) {
            return {
                success: false,
                message: 'Validation already in progress'
            };
        }
        
        // Reset validation data
        this.resetValidationData();
        
        // Set validation start time
        this.validationStartTime = Date.now();
        this.isValidating = true;
        
        // Log validation start
        this.logValidationEvent('Starting price feed validation');
        
        // Check if required components exist
        if (!window.tradingView) {
            this.logValidationEvent('Error: TradingView integration not found');
            this.validationResults.tradingView.errors.push('Integration not found');
        } else {
            this.validationResults.tradingView.connected = true;
            this.logValidationEvent('TradingView integration found');
            
            // Register price update callback
            window.tradingView.onPriceUpdate((price) => {
                const timestamp = Date.now();
                this.tradingViewPrices.push({
                    price,
                    timestamp
                });
                
                this.logValidationEvent(`TradingView price update: $${price.toFixed(2)}`);
                this.validatePriceUpdate('tradingView', price, timestamp);
            });
        }
        
        if (!window.antarctic) {
            this.logValidationEvent('Error: Antarctic Exchange API not found');
            this.validationResults.antarctic.errors.push('Integration not found');
        } else {
            this.validationResults.antarctic.connected = true;
            this.logValidationEvent('Antarctic Exchange API found');
            
            // Register price update callback
            window.antarctic.onPriceUpdate((price) => {
                const timestamp = Date.now();
                this.antarcticPrices.push({
                    price,
                    timestamp
                });
                
                this.logValidationEvent(`Antarctic Exchange price update: $${price.toFixed(2)}`);
                this.validatePriceUpdate('antarctic', price, timestamp);
            });
        }
        
        // Set up reference API polling
        this.validationInterval = setInterval(() => {
            this.fetchReferencePrice();
        }, 5000); // Poll every 5 seconds
        
        // Fetch initial reference price
        this.fetchReferencePrice();
        
        // Set timeout to end validation
        setTimeout(() => {
            this.endValidation();
        }, duration);
        
        return {
            success: true,
            message: `Validation started, will run for ${duration / 1000} seconds`
        };
    }
    
    /**
     * Reset validation data
     */
    resetValidationData() {
        this.tradingViewPrices = [];
        this.antarcticPrices = [];
        this.referenceAPIPrices = [];
        this.validationResults = {
            tradingView: {
                connected: false,
                latency: 0,
                accuracy: 0,
                reliability: 0,
                errors: []
            },
            antarctic: {
                connected: false,
                latency: 0,
                accuracy: 0,
                reliability: 0,
                errors: []
            }
        };
    }
    
    /**
     * Fetch reference price from external API
     */
    fetchReferencePrice() {
        fetch(this.referenceAPI)
            .then(response => response.json())
            .then(data => {
                if (data && data.price) {
                    const price = parseFloat(data.price);
                    const timestamp = Date.now();
                    
                    this.referenceAPIPrices.push({
                        price,
                        timestamp
                    });
                    
                    this.logValidationEvent(`Reference API price: $${price.toFixed(2)}`);
                }
            })
            .catch(error => {
                this.logValidationEvent(`Error fetching reference price: ${error.message}`);
            });
    }
    
    /**
     * Validate price update
     * @param {string} source - Price source ('tradingView' or 'antarctic')
     * @param {number} price - Price value
     * @param {number} timestamp - Timestamp of price update
     */
    validatePriceUpdate(source, price, timestamp) {
        // Skip if not validating
        if (!this.isValidating) return;
        
        // Find closest reference price by timestamp
        const closestReference = this.findClosestReferencePrice(timestamp);
        
        if (closestReference) {
            // Calculate time difference
            const timeDiff = Math.abs(timestamp - closestReference.timestamp);
            
            // Calculate price difference
            const priceDiff = Math.abs(price - closestReference.price);
            const pricePercDiff = (priceDiff / closestReference.price) * 100;
            
            // Update validation results
            this.validationResults[source].latency = 
                (this.validationResults[source].latency + timeDiff) / 2;
            
            // Update accuracy (100% - percentage difference)
            const accuracy = 100 - pricePercDiff;
            this.validationResults[source].accuracy = 
                (this.validationResults[source].accuracy + accuracy) / 2;
            
            this.logValidationEvent(`${source} validation: Latency ${timeDiff}ms, Accuracy ${accuracy.toFixed(2)}%`);
        }
        
        // Update reliability (percentage of successful updates)
        const expectedUpdates = Math.floor((timestamp - this.validationStartTime) / 5000);
        const actualUpdates = source === 'tradingView' ? 
            this.tradingViewPrices.length : this.antarcticPrices.length;
        
        if (expectedUpdates > 0) {
            const reliability = Math.min(100, (actualUpdates / expectedUpdates) * 100);
            this.validationResults[source].reliability = reliability;
        }
    }
    
    /**
     * Find closest reference price by timestamp
     * @param {number} timestamp - Timestamp to match
     * @returns {Object|null} - Closest reference price or null if none found
     */
    findClosestReferencePrice(timestamp) {
        if (this.referenceAPIPrices.length === 0) return null;
        
        let closest = this.referenceAPIPrices[0];
        let closestDiff = Math.abs(timestamp - closest.timestamp);
        
        for (let i = 1; i < this.referenceAPIPrices.length; i++) {
            const diff = Math.abs(timestamp - this.referenceAPIPrices[i].timestamp);
            if (diff < closestDiff) {
                closest = this.referenceAPIPrices[i];
                closestDiff = diff;
            }
        }
        
        // Only return if within 10 seconds
        return closestDiff <= 10000 ? closest : null;
    }
    
    /**
     * End validation process
     * @returns {Object} - Validation results
     */
    endValidation() {
        if (!this.isValidating) {
            return {
                success: false,
                message: 'No validation in progress'
            };
        }
        
        // Clear validation interval
        if (this.validationInterval) {
            clearInterval(this.validationInterval);
            this.validationInterval = null;
        }
        
        // Calculate final metrics
        this.calculateFinalMetrics();
        
        // Log validation end
        this.logValidationEvent('Price feed validation completed');
        this.logValidationEvent(`TradingView results: ${JSON.stringify(this.validationResults.tradingView)}`);
        this.logValidationEvent(`Antarctic Exchange results: ${JSON.stringify(this.validationResults.antarctic)}`);
        
        // Set validation status
        this.isValidating = false;
        
        // Notify callbacks
        this.validationCallbacks.forEach(callback => {
            callback(this.validationResults);
        });
        
        return {
            success: true,
            message: 'Validation completed',
            results: this.validationResults
        };
    }
    
    /**
     * Calculate final metrics
     */
    calculateFinalMetrics() {
        // Calculate TradingView metrics
        if (this.tradingViewPrices.length > 0) {
            // Already calculated incrementally
        } else {
            this.validationResults.tradingView.errors.push('No price updates received');
            this.validationResults.tradingView.reliability = 0;
        }
        
        // Calculate Antarctic Exchange metrics
        if (this.antarcticPrices.length > 0) {
            // Already calculated incrementally
        } else {
            this.validationResults.antarctic.errors.push('No price updates received');
            this.validationResults.antarctic.reliability = 0;
        }
    }
    
    /**
     * Log validation event
     * @param {string} message - Event message
     */
    logValidationEvent(message) {
        console.log(`[Price Feed Validator] ${message}`);
        
        // Add to system log if available
        const systemLog = document.getElementById('system-log');
        if (systemLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const logTime = document.createElement('span');
            logTime.className = 'log-time';
            logTime.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.textContent = `[Validator] ${message}`;
            
            logEntry.appendChild(logTime);
            logEntry.appendChild(logMessage);
            systemLog.appendChild(logEntry);
            
            // Scroll to bottom
            systemLog.scrollTop = systemLog.scrollHeight;
        }
    }
    
    /**
     * Register validation callback
     * @param {Function} callback - Callback function to be called on validation completion
     */
    onValidationComplete(callback) {
        if (typeof callback === 'function') {
            this.validationCallbacks.push(callback);
        }
    }
    
    /**
     * Get validation results
     * @returns {Object} - Validation results
     */
    getValidationResults() {
        return this.validationResults;
    }
    
    /**
     * Generate validation report
     * @returns {string} - HTML report
     */
    generateValidationReport() {
        const report = document.createElement('div');
        report.className = 'validation-report';
        
        const title = document.createElement('h3');
        title.textContent = 'Price Feed Validation Report';
        report.appendChild(title);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'validation-timestamp';
        timestamp.textContent = `Generated: ${new Date().toLocaleString()}`;
        report.appendChild(timestamp);
        
        // TradingView results
        const tvSection = document.createElement('div');
        tvSection.className = 'validation-section';
        
        const tvTitle = document.createElement('h4');
        tvTitle.textContent = 'TradingView Integration';
        tvSection.appendChild(tvTitle);
        
        const tvStatus = document.createElement('div');
        tvStatus.className = 'validation-status';
        tvStatus.innerHTML = `
            <div class="status-item">
                <span class="status-label">Connected:</span>
                <span class="status-value ${this.validationResults.tradingView.connected ? 'positive' : 'negative'}">
                    ${this.validationResults.tradingView.connected ? 'Yes' : 'No'}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Latency:</span>
                <span class="status-value">
                    ${this.validationResults.tradingView.latency.toFixed(0)} ms
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Accuracy:</span>
                <span class="status-value ${this.validationResults.tradingView.accuracy >= 99 ? 'positive' : this.validationResults.tradingView.accuracy >= 95 ? 'warning' : 'negative'}">
                    ${this.validationResults.tradingView.accuracy.toFixed(2)}%
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Reliability:</span>
                <span class="status-value ${this.validationResults.tradingView.reliability >= 95 ? 'positive' : this.validationResults.tradingView.reliability >= 80 ? 'warning' : 'negative'}">
                    ${this.validationResults.tradingView.reliability.toFixed(2)}%
                </span>
            </div>
        `;
        tvSection.appendChild(tvStatus);
        
        // TradingView errors
        if (this.validationResults.tradingView.errors.length > 0) {
            const tvErrors = document.createElement('div');
            tvErrors.className = 'validation-errors';
            tvErrors.innerHTML = `
                <div class="errors-title">Errors:</div>
                <ul>
                    ${this.validationResults.tradingView.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            tvSection.appendChild(tvErrors);
        }
        
        report.appendChild(tvSection);
        
        // Antarctic Exchange results
        const aeSection = document.createElement('div');
        aeSection.className = 'validation-section';
        
        const aeTitle = document.createElement('h4');
        aeTitle.textContent = 'Antarctic Exchange Integration';
        aeSection.appendChild(aeTitle);
        
        const aeStatus = document.createElement('div');
        aeStatus.className = 'validation-status';
        aeStatus.innerHTML = `
            <div class="status-item">
                <span class="status-label">Connected:</span>
                <span class="status-value ${this.validationResults.antarctic.connected ? 'positive' : 'negative'}">
                    ${this.validationResults.antarctic.connected ? 'Yes' : 'No'}
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Latency:</span>
                <span class="status-value">
                    ${this.validationResults.antarctic.latency.toFixed(0)} ms
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Accuracy:</span>
                <span class="status-value ${this.validationResults.antarctic.accuracy >= 99 ? 'positive' : this.validationResults.antarctic.accuracy >= 95 ? 'warning' : 'negative'}">
                    ${this.validationResults.antarctic.accuracy.toFixed(2)}%
                </span>
            </div>
            <div class="status-item">
                <span class="status-label">Reliability:</span>
                <span class="status-value ${this.validationResults.antarctic.reliability >= 95 ? 'positive' : this.validationResults.antarctic.reliability >= 80 ? 'warning' : 'negative'}">
                    ${this.validationResults.antarctic.reliability.toFixed(2)}%
                </span>
            </div>
        `;
        aeSection.appendChild(aeStatus);
        
        // Antarctic Exchange errors
        if (this.validationResults.antarctic.errors.length > 0) {
            const aeErrors = document.createElement('div');
            aeErrors.className = 'validation-errors';
            aeErrors.innerHTML = `
                <div class="errors-title">Errors:</div>
                <ul>
                    ${this.validationResults.antarctic.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            aeSection.appendChild(aeErrors);
        }
        
        report.appendChild(aeSection);
        
        // Recommendations
        const recommendations = document.createElement('div');
        recommendations.className = 'validation-recommendations';
        
        const recTitle = document.createElement('h4');
        recTitle.textContent = 'Recommendations';
        recommendations.appendChild(recTitle);
        
        const recList = document.createElement('ul');
        
        // Generate recommendations based on validation results
        const recs = [];
        
        if (!this.validationResults.tradingView.connected) {
            recs.push('Check TradingView integration setup and ensure the script is properly loaded.');
        }
        
        if (!this.validationResults.antarctic.connected) {
            recs.push('Check Antarctic Exchange API integration setup and ensure the script is properly loaded.');
        }
        
        if (this.validationResults.tradingView.accuracy < 95) {
            recs.push('TradingView price accuracy is below acceptable threshold. Consider reconfiguring or using an alternative data source.');
        }
        
        if (this.validationResults.antarctic.accuracy < 95) {
            recs.push('Antarctic Exchange price accuracy is below acceptable threshold. Check API endpoints and connection settings.');
        }
        
        if (this.validationResults.tradingView.reliability < 80) {
            recs.push('TradingView reliability is low. Check network connectivity and consider implementing additional fallback mechanisms.');
        }
        
        if (this.validationResults.antarctic.reliability < 80) {
            recs.push('Antarctic Exchange reliability is low. Check WebSocket connection and consider implementing additional fallback mechanisms.');
        }
        
        // Add recommendations to list
        if (recs.length > 0) {
            recs.forEach(rec => {
                const li = document.createElement('li');
                li.textContent = rec;
                recList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.textContent = 'All price feeds are functioning within acceptable parameters. No action required.';
            recList.appendChild(li);
        }
        
        recommendations.appendChild(recList);
        report.appendChild(recommendations);
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .validation-report {
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
                padding: 15px;
                margin-top: 20px;
            }
            
            .validation-report h3 {
                margin-top: 0;
                margin-bottom: 5px;
            }
            
            .validation-timestamp {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 15px;
            }
            
            .validation-section {
                margin-bottom: 15px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            
            .validation-section h4 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            
            .validation-status {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 10px;
            }
            
            .status-item {
                display: flex;
                justify-content: space-between;
            }
            
            .status-label {
                font-weight: bold;
            }
            
            .status-value.positive {
                color: #28a745;
            }
            
            .status-value.warning {
                color: #ffc107;
            }
            
            .status-value.negative {
                color: #dc3545;
            }
            
            .validation-errors {
                margin-top: 10px;
                padding: 10px;
                background-color: rgba(220, 53, 69, 0.1);
                border-radius: 4px;
            }
            
            .errors-title {
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .validation-recommendations {
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            
            .validation-recommendations h4 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            
            .validation-recommendations ul {
                margin-top: 0;
                margin-bottom: 0;
                padding-left: 20px;
            }
        `;
        
        // Return HTML string
        const container = document.createElement('div');
        container.appendChild(style);
        container.appendChild(report);
        
        return container.innerHTML;
    }
}

// Export the class for use in other modules
window.PriceFeedValidator = PriceFeedValidator;

// Initialize validator when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize validator after main components are loaded
    setTimeout(() => {
        // Create validator instance
        const validator = new PriceFeedValidator();
        
        // Add to window for external access
        window.priceFeedValidator = validator;
        
        // Add validation button to UI if system log exists
        const systemLog = document.getElementById('system-log');
        if (systemLog) {
            const validationButton = document.createElement('button');
            validationButton.className = 'btn btn-primary';
            validationButton.textContent = 'Validate Price Feeds';
            validationButton.style.marginTop = '10px';
            validationButton.style.marginBottom = '10px';
            
            validationButton.addEventListener('click', () => {
                validator.startValidation(30000); // 30 seconds validation
            });
            
            // Add button before system log
            systemLog.parentNode.insertBefore(validationButton, systemLog);
            
            // Add report container
            const reportContainer = document.createElement('div');
            reportContainer.id = 'validation-report-container';
            systemLog.parentNode.insertBefore(reportContainer, systemLog.nextSibling);
            
            // Register validation callback
            validator.onValidationComplete((results) => {
                // Generate and display report
                reportContainer.innerHTML = validator.generateValidationReport();
            });
        }
    }, 3000);
});
