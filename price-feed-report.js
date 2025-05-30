/**
 * Price Feed Integration Report Module
 * Generates comprehensive reports on price feed accuracy and performance
 */

class PriceFeedReport {
    constructor() {
        this.reportData = {
            tradingView: {
                status: 'Not tested',
                accuracy: 0,
                latency: 0,
                reliability: 0,
                errors: []
            },
            antarctic: {
                status: 'Not tested',
                accuracy: 0,
                latency: 0,
                reliability: 0,
                errors: []
            },
            referenceAPI: {
                status: 'Not tested',
                lastCheck: null
            },
            recommendations: [],
            lastUpdated: null
        };
        this.monitoringActive = false;
        this.monitoringInterval = null;
        this.reportCallbacks = [];
    }

    /**
     * Initialize report module
     */
    initialize() {
        // Check if validator exists
        if (!window.priceFeedValidator) {
            console.error('Price feed validator not found');
            return {
                success: false,
                message: 'Price feed validator not found'
            };
        }

        // Register validation callback
        window.priceFeedValidator.onValidationComplete((results) => {
            this.updateReportData(results);
        });

        // Create report UI
        this.createReportUI();

        return {
            success: true,
            message: 'Price feed report module initialized'
        };
    }

    /**
     * Update report data with validation results
     * @param {Object} results - Validation results
     */
    updateReportData(results) {
        // Update TradingView data
        this.reportData.tradingView = {
            status: results.tradingView.connected ? 'Connected' : 'Disconnected',
            accuracy: results.tradingView.accuracy,
            latency: results.tradingView.latency,
            reliability: results.tradingView.reliability,
            errors: [...results.tradingView.errors]
        };

        // Update Antarctic Exchange data
        this.reportData.antarctic = {
            status: results.antarctic.connected ? 'Connected' : 'Disconnected',
            accuracy: results.antarctic.accuracy,
            latency: results.antarctic.latency,
            reliability: results.antarctic.reliability,
            errors: [...results.antarctic.errors]
        };

        // Update reference API status
        this.reportData.referenceAPI = {
            status: 'Active',
            lastCheck: new Date().toISOString()
        };

        // Generate recommendations
        this.generateRecommendations();

        // Update timestamp
        this.reportData.lastUpdated = new Date().toISOString();

        // Notify callbacks
        this.notifyReportCallbacks();

        // Update UI
        this.updateReportUI();
    }

    /**
     * Generate recommendations based on report data
     */
    generateRecommendations() {
        const recommendations = [];

        // Check TradingView status
        if (this.reportData.tradingView.status === 'Disconnected') {
            recommendations.push({
                severity: 'high',
                message: 'TradingView integration is disconnected. Check network connectivity and script loading.'
            });
        } else if (this.reportData.tradingView.accuracy < 95) {
            recommendations.push({
                severity: 'medium',
                message: `TradingView price accuracy is ${this.reportData.tradingView.accuracy.toFixed(2)}%, below the recommended 95%. Consider reconfiguring or using an alternative data source.`
            });
        }

        // Check Antarctic Exchange status
        if (this.reportData.antarctic.status === 'Disconnected') {
            recommendations.push({
                severity: 'high',
                message: 'Antarctic Exchange API is disconnected. Check network connectivity and API endpoints.'
            });
        } else if (this.reportData.antarctic.accuracy < 95) {
            recommendations.push({
                severity: 'medium',
                message: `Antarctic Exchange price accuracy is ${this.reportData.antarctic.accuracy.toFixed(2)}%, below the recommended 95%. Check API endpoints and connection settings.`
            });
        }

        // Check reliability
        if (this.reportData.tradingView.reliability < 80) {
            recommendations.push({
                severity: 'medium',
                message: `TradingView reliability is ${this.reportData.tradingView.reliability.toFixed(2)}%, below the recommended 80%. Consider implementing additional fallback mechanisms.`
            });
        }

        if (this.reportData.antarctic.reliability < 80) {
            recommendations.push({
                severity: 'medium',
                message: `Antarctic Exchange reliability is ${this.reportData.antarctic.reliability.toFixed(2)}%, below the recommended 80%. Check WebSocket connection and consider implementing additional fallback mechanisms.`
            });
        }

        // Check latency
        if (this.reportData.tradingView.latency > 2000) {
            recommendations.push({
                severity: 'low',
                message: `TradingView latency is ${this.reportData.tradingView.latency.toFixed(0)}ms, above the recommended 2000ms. This may impact trading performance.`
            });
        }

        if (this.reportData.antarctic.latency > 2000) {
            recommendations.push({
                severity: 'low',
                message: `Antarctic Exchange latency is ${this.reportData.antarctic.latency.toFixed(0)}ms, above the recommended 2000ms. This may impact trading performance.`
            });
        }

        // Add general recommendation if everything is good
        if (recommendations.length === 0) {
            recommendations.push({
                severity: 'info',
                message: 'All price feeds are functioning within acceptable parameters. No action required.'
            });
        }

        // Update report data
        this.reportData.recommendations = recommendations;
    }

    /**
     * Create report UI
     */
    createReportUI() {
        // Find container for report
        const container = document.querySelector('.card:nth-child(4)');
        if (!container) return;

        // Create report section
        const reportSection = document.createElement('div');
        reportSection.id = 'price-feed-report';
        reportSection.className = 'price-feed-report';
        reportSection.innerHTML = `
            <h3>Price Feed Status</h3>
            <div class="report-timestamp">Last updated: Not yet validated</div>
            <div class="report-grid">
                <div class="report-item">
                    <div class="report-label">TradingView</div>
                    <div class="report-value" id="tv-status">Not tested</div>
                </div>
                <div class="report-item">
                    <div class="report-label">Antarctic Exchange</div>
                    <div class="report-value" id="ae-status">Not tested</div>
                </div>
                <div class="report-item">
                    <div class="report-label">Price Accuracy</div>
                    <div class="report-value" id="price-accuracy">N/A</div>
                </div>
                <div class="report-item">
                    <div class="report-label">Data Reliability</div>
                    <div class="report-value" id="data-reliability">N/A</div>
                </div>
            </div>
            <div class="report-recommendations">
                <h4>Recommendations</h4>
                <ul id="recommendations-list">
                    <li class="recommendation info">Run price feed validation to generate recommendations.</li>
                </ul>
            </div>
            <div class="report-actions">
                <button id="validate-price-feeds" class="btn btn-primary">Validate Price Feeds</button>
                <button id="toggle-monitoring" class="btn btn-secondary">Start Monitoring</button>
            </div>
        `;

        // Add CSS for report
        const style = document.createElement('style');
        style.textContent = `
            .price-feed-report {
                margin-top: 20px;
                padding: 15px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .price-feed-report h3 {
                margin-top: 0;
                margin-bottom: 5px;
            }
            
            .report-timestamp {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 15px;
            }
            
            .report-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 10px;
                margin-bottom: 15px;
            }
            
            .report-item {
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            
            .report-label {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 5px;
            }
            
            .report-value {
                font-size: 16px;
                font-weight: bold;
            }
            
            .report-value.positive {
                color: #28a745;
            }
            
            .report-value.warning {
                color: #ffc107;
            }
            
            .report-value.negative {
                color: #dc3545;
            }
            
            .report-recommendations {
                margin-bottom: 15px;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.1);
                border-radius: 4px;
            }
            
            .report-recommendations h4 {
                margin-top: 0;
                margin-bottom: 10px;
            }
            
            .report-recommendations ul {
                margin: 0;
                padding-left: 20px;
            }
            
            .recommendation {
                margin-bottom: 5px;
            }
            
            .recommendation.high {
                color: #dc3545;
            }
            
            .recommendation.medium {
                color: #ffc107;
            }
            
            .recommendation.low {
                color: #17a2b8;
            }
            
            .recommendation.info {
                color: #6c757d;
            }
            
            .report-actions {
                display: flex;
                gap: 10px;
            }
            
            .btn {
                padding: 8px 16px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: bold;
            }
            
            .btn-primary {
                background-color: #4e74ff;
                color: white;
            }
            
            .btn-secondary {
                background-color: #6c757d;
                color: white;
            }
            
            .btn:hover {
                opacity: 0.9;
            }
        `;
        document.head.appendChild(style);

        // Add to container
        container.appendChild(reportSection);

        // Add event listeners
        const validateButton = document.getElementById('validate-price-feeds');
        if (validateButton) {
            validateButton.addEventListener('click', () => {
                if (window.priceFeedValidator) {
                    window.priceFeedValidator.startValidation(30000); // 30 seconds validation
                }
            });
        }

        const monitoringButton = document.getElementById('toggle-monitoring');
        if (monitoringButton) {
            monitoringButton.addEventListener('click', () => {
                this.toggleMonitoring();
            });
        }
    }

    /**
     * Update report UI with current data
     */
    updateReportUI() {
        // Update timestamp
        const timestamp = document.querySelector('.report-timestamp');
        if (timestamp && this.reportData.lastUpdated) {
            const date = new Date(this.reportData.lastUpdated);
            timestamp.textContent = `Last updated: ${date.toLocaleString()}`;
        }

        // Update TradingView status
        const tvStatus = document.getElementById('tv-status');
        if (tvStatus) {
            tvStatus.textContent = this.reportData.tradingView.status;
            tvStatus.className = 'report-value ' + this.getStatusClass(this.reportData.tradingView.status);
        }

        // Update Antarctic Exchange status
        const aeStatus = document.getElementById('ae-status');
        if (aeStatus) {
            aeStatus.textContent = this.reportData.antarctic.status;
            aeStatus.className = 'report-value ' + this.getStatusClass(this.reportData.antarctic.status);
        }

        // Update price accuracy
        const priceAccuracy = document.getElementById('price-accuracy');
        if (priceAccuracy) {
            // Use the better of the two accuracy values
            const accuracy = Math.max(
                this.reportData.tradingView.accuracy,
                this.reportData.antarctic.accuracy
            );
            
            if (accuracy > 0) {
                priceAccuracy.textContent = `${accuracy.toFixed(2)}%`;
                priceAccuracy.className = 'report-value ' + this.getAccuracyClass(accuracy);
            } else {
                priceAccuracy.textContent = 'N/A';
                priceAccuracy.className = 'report-value';
            }
        }

        // Update data reliability
        const dataReliability = document.getElementById('data-reliability');
        if (dataReliability) {
            // Use the better of the two reliability values
            const reliability = Math.max(
                this.reportData.tradingView.reliability,
                this.reportData.antarctic.reliability
            );
            
            if (reliability > 0) {
                dataReliability.textContent = `${reliability.toFixed(2)}%`;
                dataReliability.className = 'report-value ' + this.getReliabilityClass(reliability);
            } else {
                dataReliability.textContent = 'N/A';
                dataReliability.className = 'report-value';
            }
        }

        // Update recommendations
        const recommendationsList = document.getElementById('recommendations-list');
        if (recommendationsList && this.reportData.recommendations.length > 0) {
            recommendationsList.innerHTML = '';
            
            this.reportData.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.className = `recommendation ${rec.severity}`;
                li.textContent = rec.message;
                recommendationsList.appendChild(li);
            });
        }

        // Update monitoring button
        const monitoringButton = document.getElementById('toggle-monitoring');
        if (monitoringButton) {
            monitoringButton.textContent = this.monitoringActive ? 'Stop Monitoring' : 'Start Monitoring';
        }
    }

    /**
     * Get CSS class for status
     * @param {string} status - Status value
     * @returns {string} - CSS class
     */
    getStatusClass(status) {
        if (status === 'Connected') return 'positive';
        if (status === 'Disconnected') return 'negative';
        return '';
    }

    /**
     * Get CSS class for accuracy
     * @param {number} accuracy - Accuracy value
     * @returns {string} - CSS class
     */
    getAccuracyClass(accuracy) {
        if (accuracy >= 99) return 'positive';
        if (accuracy >= 95) return 'warning';
        return 'negative';
    }

    /**
     * Get CSS class for reliability
     * @param {number} reliability - Reliability value
     * @returns {string} - CSS class
     */
    getReliabilityClass(reliability) {
        if (reliability >= 95) return 'positive';
        if (reliability >= 80) return 'warning';
        return 'negative';
    }

    /**
     * Toggle price feed monitoring
     */
    toggleMonitoring() {
        if (this.monitoringActive) {
            // Stop monitoring
            if (this.monitoringInterval) {
                clearInterval(this.monitoringInterval);
                this.monitoringInterval = null;
            }
            
            this.monitoringActive = false;
            this.logEvent('Price feed monitoring stopped');
        } else {
            // Start monitoring
            this.monitoringActive = true;
            this.logEvent('Price feed monitoring started');
            
            // Run initial validation
            if (window.priceFeedValidator) {
                window.priceFeedValidator.startValidation(30000);
            }
            
            // Set up interval for periodic validation
            this.monitoringInterval = setInterval(() => {
                if (window.priceFeedValidator) {
                    window.priceFeedValidator.startValidation(30000);
                }
            }, 3600000); // Run every hour
        }
        
        // Update UI
        this.updateReportUI();
    }

    /**
     * Register report update callback
     * @param {Function} callback - Callback function
     */
    onReportUpdate(callback) {
        if (typeof callback === 'function') {
            this.reportCallbacks.push(callback);
        }
    }

    /**
     * Notify all registered callbacks
     */
    notifyReportCallbacks() {
        this.reportCallbacks.forEach(callback => {
            callback(this.reportData);
        });
    }

    /**
     * Log event to system log
     * @param {string} message - Event message
     */
    logEvent(message) {
        console.log(`[Price Feed Report] ${message}`);
        
        // Add to system log if available
        const systemLog = document.getElementById('system-log');
        if (systemLog) {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            
            const logTime = document.createElement('span');
            logTime.className = 'log-time';
            logTime.textContent = new Date().toLocaleTimeString();
            
            const logMessage = document.createElement('span');
            logMessage.textContent = `[Report] ${message}`;
            
            logEntry.appendChild(logTime);
            logEntry.appendChild(logMessage);
            systemLog.appendChild(logEntry);
            
            // Scroll to bottom
            systemLog.scrollTop = systemLog.scrollHeight;
        }
    }

    /**
     * Get current report data
     * @returns {Object} - Report data
     */
    getReportData() {
        return this.reportData;
    }

    /**
     * Generate full report as HTML
     * @returns {string} - HTML report
     */
    generateFullReport() {
        const report = document.createElement('div');
        report.className = 'full-report';
        
        const title = document.createElement('h2');
        title.textContent = 'Price Feed Performance Report';
        report.appendChild(title);
        
        const timestamp = document.createElement('div');
        timestamp.className = 'report-timestamp';
        const date = this.reportData.lastUpdated ? new Date(this.reportData.lastUpdated) : new Date();
        timestamp.textContent = `Generated: ${date.toLocaleString()}`;
        report.appendChild(timestamp);
        
        // Summary section
        const summary = document.createElement('div');
        summary.className = 'report-section';
        
        const summaryTitle = document.createElement('h3');
        summaryTitle.textContent = 'Summary';
        summary.appendChild(summaryTitle);
        
        const summaryContent = document.createElement('div');
        summaryContent.className = 'summary-content';
        
        // Determine overall status
        let overallStatus = 'Good';
        let statusClass = 'positive';
        
        if (
            this.reportData.tradingView.status === 'Disconnected' ||
            this.reportData.antarctic.status === 'Disconnected' ||
            Math.max(this.reportData.tradingView.accuracy, this.reportData.antarctic.accuracy) < 90 ||
            Math.max(this.reportData.tradingView.reliability, this.reportData.antarctic.reliability) < 70
        ) {
            overallStatus = 'Critical';
            statusClass = 'negative';
        } else if (
            Math.max(this.reportData.tradingView.accuracy, this.reportData.antarctic.accuracy) < 95 ||
            Math.max(this.reportData.tradingView.reliability, this.reportData.antarctic.reliability) < 80
        ) {
            overallStatus = 'Warning';
            statusClass = 'warning';
        }
        
        summaryContent.innerHTML = `
            <div class="summary-item">
                <div class="summary-label">Overall Status:</div>
                <div class="summary-value ${statusClass}">${overallStatus}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Primary Data Source:</div>
                <div class="summary-value">${this.reportData.tradingView.accuracy >= this.reportData.antarctic.accuracy ? 'TradingView' : 'Antarctic Exchange'}</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Best Accuracy:</div>
                <div class="summary-value ${this.getAccuracyClass(Math.max(this.reportData.tradingView.accuracy, this.reportData.antarctic.accuracy))}">${Math.max(this.reportData.tradingView.accuracy, this.reportData.antarctic.accuracy).toFixed(2)}%</div>
            </div>
            <div class="summary-item">
                <div class="summary-label">Best Reliability:</div>
                <div class="summary-value ${this.getReliabilityClass(Math.max(this.reportData.tradingView.reliability, this.reportData.antarctic.reliability))}">${Math.max(this.reportData.tradingView.reliability, this.reportData.antarctic.reliability).toFixed(2)}%</div>
            </div>
        `;
        
        summary.appendChild(summaryContent);
        report.appendChild(summary);
        
        // Detailed results section
        const details = document.createElement('div');
        details.className = 'report-section';
        
        const detailsTitle = document.createElement('h3');
        detailsTitle.textContent = 'Detailed Results';
        details.appendChild(detailsTitle);
        
        // TradingView details
        const tvDetails = document.createElement('div');
        tvDetails.className = 'details-subsection';
        
        const tvTitle = document.createElement('h4');
        tvTitle.textContent = 'TradingView Integration';
        tvDetails.appendChild(tvTitle);
        
        const tvContent = document.createElement('div');
        tvContent.className = 'details-content';
        tvContent.innerHTML = `
            <div class="details-item">
                <div class="details-label">Status:</div>
                <div class="details-value ${this.getStatusClass(this.reportData.tradingView.status)}">${this.reportData.tradingView.status}</div>
            </div>
            <div class="details-item">
                <div class="details-label">Accuracy:</div>
                <div class="details-value ${this.getAccuracyClass(this.reportData.tradingView.accuracy)}">${this.reportData.tradingView.accuracy.toFixed(2)}%</div>
            </div>
            <div class="details-item">
                <div class="details-label">Latency:</div>
                <div class="details-value">${this.reportData.tradingView.latency.toFixed(0)} ms</div>
            </div>
            <div class="details-item">
                <div class="details-label">Reliability:</div>
                <div class="details-value ${this.getReliabilityClass(this.reportData.tradingView.reliability)}">${this.reportData.tradingView.reliability.toFixed(2)}%</div>
            </div>
        `;
        
        // Add errors if any
        if (this.reportData.tradingView.errors.length > 0) {
            const errorsDiv = document.createElement('div');
            errorsDiv.className = 'details-errors';
            errorsDiv.innerHTML = `
                <div class="details-label">Errors:</div>
                <ul>
                    ${this.reportData.tradingView.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            tvContent.appendChild(errorsDiv);
        }
        
        tvDetails.appendChild(tvContent);
        details.appendChild(tvDetails);
        
        // Antarctic Exchange details
        const aeDetails = document.createElement('div');
        aeDetails.className = 'details-subsection';
        
        const aeTitle = document.createElement('h4');
        aeTitle.textContent = 'Antarctic Exchange Integration';
        aeDetails.appendChild(aeTitle);
        
        const aeContent = document.createElement('div');
        aeContent.className = 'details-content';
        aeContent.innerHTML = `
            <div class="details-item">
                <div class="details-label">Status:</div>
                <div class="details-value ${this.getStatusClass(this.reportData.antarctic.status)}">${this.reportData.antarctic.status}</div>
            </div>
            <div class="details-item">
                <div class="details-label">Accuracy:</div>
                <div class="details-value ${this.getAccuracyClass(this.reportData.antarctic.accuracy)}">${this.reportData.antarctic.accuracy.toFixed(2)}%</div>
            </div>
            <div class="details-item">
                <div class="details-label">Latency:</div>
                <div class="details-value">${this.reportData.antarctic.latency.toFixed(0)} ms</div>
            </div>
            <div class="details-item">
                <div class="details-label">Reliability:</div>
                <div class="details-value ${this.getReliabilityClass(this.reportData.antarctic.reliability)}">${this.reportData.antarctic.reliability.toFixed(2)}%</div>
            </div>
        `;
        
        // Add errors if any
        if (this.reportData.antarctic.errors.length > 0) {
            const errorsDiv = document.createElement('div');
            errorsDiv.className = 'details-errors';
            errorsDiv.innerHTML = `
                <div class="details-label">Errors:</div>
                <ul>
                    ${this.reportData.antarctic.errors.map(error => `<li>${error}</li>`).join('')}
                </ul>
            `;
            aeContent.appendChild(errorsDiv);
        }
        
        aeDetails.appendChild(aeContent);
        details.appendChild(aeDetails);
        
        report.appendChild(details);
        
        // Recommendations section
        const recommendations = document.createElement('div');
        recommendations.className = 'report-section';
        
        const recTitle = document.createElement('h3');
        recTitle.textContent = 'Recommendations';
        recommendations.appendChild(recTitle);
        
        const recList = document.createElement('ul');
        recList.className = 'recommendations-list';
        
        if (this.reportData.recommendations.length > 0) {
            this.reportData.recommendations.forEach(rec => {
                const li = document.createElement('li');
                li.className = `recommendation ${rec.severity}`;
                li.textContent = rec.message;
                recList.appendChild(li);
            });
        } else {
            const li = document.createElement('li');
            li.className = 'recommendation info';
            li.textContent = 'No recommendations available. Run validation to generate recommendations.';
            recList.appendChild(li);
        }
        
        recommendations.appendChild(recList);
        report.appendChild(recommendations);
        
        // Add CSS
        const style = document.createElement('style');
        style.textContent = `
            .full-report {
                font-family: Arial, sans-serif;
                max-width: 800px;
                margin: 0 auto;
                padding: 20px;
                background-color: #1a1a1a;
                color: #f0f0f0;
                border-radius: 8px;
            }
            
            .full-report h2 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #ffffff;
            }
            
            .report-timestamp {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.7);
                margin-bottom: 20px;
            }
            
            .report-section {
                margin-bottom: 30px;
                padding: 15px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 6px;
            }
            
            .report-section h3 {
                margin-top: 0;
                margin-bottom: 15px;
                color: #ffffff;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 5px;
            }
            
            .summary-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 15px;
            }
            
            .summary-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .summary-label {
                font-weight: bold;
            }
            
            .summary-value {
                font-size: 16px;
            }
            
            .details-subsection {
                margin-bottom: 20px;
                padding: 15px;
                background-color: rgba(0, 0, 0, 0.2);
                border-radius: 4px;
            }
            
            .details-subsection h4 {
                margin-top: 0;
                margin-bottom: 10px;
                color: #ffffff;
            }
            
            .details-content {
                display: grid;
                grid-template-columns: 1fr 1fr;
                grid-gap: 10px;
            }
            
            .details-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .details-label {
                font-weight: bold;
            }
            
            .details-errors {
                grid-column: span 2;
                margin-top: 10px;
                padding: 10px;
                background-color: rgba(220, 53, 69, 0.1);
                border-radius: 4px;
            }
            
            .details-errors ul {
                margin-top: 5px;
                margin-bottom: 0;
                padding-left: 20px;
            }
            
            .recommendations-list {
                margin: 0;
                padding-left: 20px;
            }
            
            .recommendation {
                margin-bottom: 10px;
                padding: 8px;
                background-color: rgba(255, 255, 255, 0.05);
                border-radius: 4px;
            }
            
            .positive {
                color: #28a745;
            }
            
            .warning {
                color: #ffc107;
            }
            
            .negative {
                color: #dc3545;
            }
            
            .recommendation.high {
                border-left: 4px solid #dc3545;
            }
            
            .recommendation.medium {
                border-left: 4px solid #ffc107;
            }
            
            .recommendation.low {
                border-left: 4px solid #17a2b8;
            }
            
            .recommendation.info {
                border-left: 4px solid #6c757d;
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
window.PriceFeedReport = PriceFeedReport;

// Initialize report when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize report after main components are loaded
    setTimeout(() => {
        // Create report instance
        const report = new PriceFeedReport();
        
        // Initialize report
        report.initialize();
        
        // Add to window for external access
        window.priceFeedReport = report;
    }, 3500);
});
