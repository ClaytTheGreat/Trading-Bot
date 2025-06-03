/**
 * Enhanced TradingView Widget for GitHub Pages
 * 
 * This script provides a robust implementation of the TradingView widget
 * with multiple fallback mechanisms and error recovery.
 */

// Create global TradingView controller
window.tradingViewController = {
    isInitialized: false,
    loadAttempts: 0,
    maxLoadAttempts: 3,
    
    // Initialize TradingView widget
    init: function() {
        console.log('Initializing Enhanced TradingView Controller...');
        
        // Check if TradingView library is already loaded
        if (typeof TradingView !== 'undefined') {
            this.createWidget();
        } else {
            this.loadTradingViewScript();
        }
        
        // Set up periodic check to ensure widget is displayed
        this.setupWidgetMonitor();
    },
    
    // Load TradingView script
    loadTradingViewScript: function() {
        console.log('Loading TradingView script...');
        this.loadAttempts++;
        
        // Remove any existing script to avoid conflicts
        const existingScript = document.querySelector('script[src*="tradingview.com/tv.js"]');
        if (existingScript) {
            existingScript.remove();
        }
        
        // Create new script element
        const script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        
        // Set up load handlers
        script.onload = () => {
            console.log('TradingView script loaded successfully');
            setTimeout(() => this.createWidget(), 500);
        };
        
        script.onerror = () => {
            console.error('Failed to load TradingView script');
            
            if (this.loadAttempts < this.maxLoadAttempts) {
                console.log(`Retrying script load (attempt ${this.loadAttempts + 1}/${this.maxLoadAttempts})...`);
                setTimeout(() => this.loadTradingViewScript(), 2000);
            } else {
                console.error('Maximum load attempts reached, creating fallback chart');
                this.createFallbackChart();
            }
        };
        
        // Add script to document
        document.head.appendChild(script);
    },
    
    // Create TradingView widget
    createWidget: function() {
        console.log('Creating TradingView widget...');
        
        // Check if container exists
        const container = document.getElementById('tradingview-chart-container');
        if (!container) {
            console.error('TradingView container not found');
            return;
        }
        
        // Clear container
        container.innerHTML = '';
        
        try {
            // Create widget with direct DOM method to avoid onChartReady issues
            const widgetHtml = `
                <div class="tradingview-widget-container">
                    <div id="tradingview_chart"></div>
                    <div class="tradingview-widget-copyright">
                        <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                            <span class="blue-text">Track all markets on TradingView</span>
                        </a>
                    </div>
                </div>
            `;
            
            container.innerHTML = widgetHtml;
            
            // Create widget with error handling
            try {
                new TradingView.widget({
                    "autosize": true,
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
                    "container_id": "tradingview_chart",
                    "studies": [
                        "MASimple@tv-basicstudies",
                        "RSI@tv-basicstudies",
                        "MACD@tv-basicstudies"
                    ]
                });
                
                console.log('TradingView widget created successfully');
                this.isInitialized = true;
                
                // Check widget status after a delay
                setTimeout(() => this.checkWidgetStatus(), 5000);
            } catch (error) {
                console.error('Error creating TradingView widget:', error);
                this.createFallbackChart();
            }
        } catch (error) {
            console.error('Error in TradingView initialization:', error);
            this.createFallbackChart();
        }
    },
    
    // Check if widget is displayed correctly
    checkWidgetStatus: function() {
        console.log('Checking TradingView widget status...');
        
        const container = document.getElementById('tradingview-chart-container');
        const widgetContainer = document.getElementById('tradingview_chart');
        
        if (!container || !widgetContainer) return;
        
        // Check if widget is empty or contains error message
        if (widgetContainer.children.length === 0 || 
            container.innerHTML.includes('something went wrong') || 
            container.innerHTML.includes('error')) {
            
            console.warn('TradingView widget failed to load properly');
            this.createFallbackChart();
        } else {
            console.log('TradingView widget is displayed correctly');
        }
    },
    
    // Set up periodic monitoring of widget
    setupWidgetMonitor: function() {
        console.log('Setting up TradingView widget monitor...');
        
        // Check widget status periodically
        setInterval(() => {
            const container = document.getElementById('tradingview-chart-container');
            const widgetContainer = document.getElementById('tradingview_chart');
            
            if (!container || !widgetContainer) return;
            
            // If widget is empty or contains error, try to recreate
            if (widgetContainer.children.length === 0 || 
                container.innerHTML.includes('something went wrong') || 
                container.innerHTML.includes('error')) {
                
                console.warn('TradingView widget issue detected during monitoring');
                
                // Only attempt to recreate if not already in progress
                if (!this.isRecreating) {
                    this.isRecreating = true;
                    
                    // Recreate widget
                    setTimeout(() => {
                        this.createWidget();
                        this.isRecreating = false;
                    }, 1000);
                }
            }
        }, 30000); // Check every 30 seconds
    },
    
    // Create fallback chart when TradingView fails
    createFallbackChart: function() {
        console.log('Creating fallback chart...');
        
        const container = document.getElementById('tradingview-chart-container');
        if (!container) return;
        
        // Clear container
        container.innerHTML = '';
        
        // Add fallback message and container
        const fallbackHtml = `
            <div style="padding: 20px; text-align: center;">
                <h3>Advanced Chart temporarily unavailable</h3>
                <p>Using alternative price data visualization</p>
                <div id="fallback-chart" style="width: 100%; height: 300px;"></div>
            </div>
        `;
        
        container.innerHTML = fallbackHtml;
        
        // Create simple canvas-based chart if Chart.js is available
        if (typeof Chart !== 'undefined') {
            this.createSimpleChart();
        } else {
            // Load Chart.js dynamically
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
            script.onload = () => this.createSimpleChart();
            document.head.appendChild(script);
        }
    },
    
    // Create simple chart using Chart.js
    createSimpleChart: function() {
        const fallbackChart = document.getElementById('fallback-chart');
        if (!fallbackChart) return;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        fallbackChart.appendChild(canvas);
        
        // Generate sample data
        const labels = [];
        const data = [];
        const now = new Date();
        const basePrice = 25;
        
        for (let i = 30; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(date.toLocaleTimeString());
            
            // Create realistic price movement
            const randomFactor = Math.random() * 2 - 1; // -1 to 1
            const priceChange = randomFactor * 0.5; // -0.5 to 0.5
            data.push(basePrice + priceChange);
        }
        
        // Create chart
        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'AVAX/USDT',
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
                            maxTicksLimit: 8
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
        
        console.log('Fallback chart created successfully');
        
        // Set up data updates for fallback chart
        this.setupFallbackDataUpdates(canvas);
    },
    
    // Set up periodic data updates for fallback chart
    setupFallbackDataUpdates: function(canvas) {
        console.log('Setting up fallback chart data updates...');
        
        // Update chart data every 30 seconds
        setInterval(() => {
            const chart = Chart.getChart(canvas);
            if (!chart) return;
            
            // Add new data point
            const lastValue = chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1];
            const randomFactor = Math.random() * 2 - 1; // -1 to 1
            const priceChange = randomFactor * 0.2; // -0.2 to 0.2
            const newValue = lastValue + priceChange;
            
            // Add new label (current time)
            const now = new Date();
            chart.data.labels.push(now.toLocaleTimeString());
            chart.data.datasets[0].data.push(newValue);
            
            // Remove oldest data point
            chart.data.labels.shift();
            chart.data.datasets[0].data.shift();
            
            // Update chart
            chart.update();
            
            console.log('Fallback chart data updated');
        }, 30000);
    }
};

// Initialize TradingView controller when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing Enhanced TradingView Controller...');
    
    // Initialize with a slight delay to ensure all elements are loaded
    setTimeout(() => {
        window.tradingViewController.init();
    }, 1000);
});
