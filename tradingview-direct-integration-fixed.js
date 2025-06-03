/**
 * TradingView Direct Integration Module (Fixed)
 * Provides direct integration with TradingView charts
 */

class TradingViewIntegration {
    constructor() {
        this.symbol = 'AVAX';
        this.interval = '1h';
        this.widgetContainer = null;
        this.widget = null;
    }
    
    /**
     * Initialize TradingView widget
     */
    initialize() {
        console.log('Initializing TradingView chart...');
        this.addToSystemLog('Initializing TradingView chart...');
        
        // Get container element
        this.widgetContainer = document.getElementById('tradingview-chart-container');
        if (!this.widgetContainer) {
            console.error('TradingView chart container not found');
            this.addToSystemLog('Error: TradingView chart container not found');
            return false;
        }
        
        try {
            // Create TradingView widget
            this.createWidget();
            return true;
        } catch (error) {
            console.error('Error creating TradingView widget:', error);
            this.addToSystemLog('Error creating TradingView widget: ' + error.message);
            this.fallbackToSimulatedChart();
            return false;
        }
    }
    
    /**
     * Create TradingView widget
     */
    createWidget() {
        // Load TradingView widget script
        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/tv.js';
        script.async = true;
        script.onload = () => {
            if (typeof TradingView === 'undefined') {
                console.error('TradingView library not loaded');
                this.addToSystemLog('Error: TradingView library not loaded');
                this.fallbackToSimulatedChart();
                return;
            }
            
            try {
                // Create widget
                this.widget = new TradingView.widget({
                    container_id: this.widgetContainer.id,
                    symbol: 'BINANCE:' + this.symbol + 'USDT',
                    interval: this.interval,
                    timezone: 'Etc/UTC',
                    theme: 'dark',
                    style: 'candles',
                    locale: 'en',
                    toolbar_bg: '#242a38',
                    enable_publishing: false,
                    hide_top_toolbar: false,
                    hide_legend: false,
                    save_image: false,
                    studies: [
                        'MASimple@tv-basicstudies',
                        'RSI@tv-basicstudies',
                        'MACD@tv-basicstudies'
                    ],
                    show_popup_button: true,
                    popup_width: '1000',
                    popup_height: '650',
                    withdateranges: true,
                    hide_side_toolbar: false,
                    allow_symbol_change: true,
                    details: true,
                    hotlist: true,
                    calendar: true,
                    width: '100%',
                    height: '100%'
                });
                
                // Safe check for onChartReady
                if (this.widget && typeof this.widget.onChartReady === 'function') {
                    this.widget.onChartReady(() => {
                        console.log('TradingView chart ready');
                        this.addToSystemLog('TradingView chart ready');
                    });
                } else {
                    console.log('TradingView widget created (without onChartReady)');
                    this.addToSystemLog('TradingView widget created');
                }
            } catch (error) {
                console.error('Error initializing TradingView widget:', error);
                this.addToSystemLog('Error initializing TradingView widget: ' + error.message);
                this.fallbackToSimulatedChart();
            }
        };
        
        script.onerror = () => {
            console.error('Failed to load TradingView library');
            this.addToSystemLog('Error: Failed to load TradingView library');
            this.fallbackToSimulatedChart();
        };
        
        document.head.appendChild(script);
    }
    
    /**
     * Fallback to simulated chart
     */
    fallbackToSimulatedChart() {
        this.addToSystemLog('TradingView connection failed, using simulated chart');
        
        // Clear container
        if (this.widgetContainer) {
            this.widgetContainer.innerHTML = '';
        }
        
        // Create canvas for chart
        const canvas = document.createElement('canvas');
        canvas.id = 'simulated-chart';
        this.widgetContainer.appendChild(canvas);
        
        // Generate random price data
        const labels = [];
        const data = [];
        const now = new Date();
        let price = 22.5;
        
        for (let i = 100; i >= 0; i--) {
            const date = new Date(now.getTime() - i * 60 * 60 * 1000);
            labels.push(date.toLocaleTimeString());
            
            // Random price movement
            price += (Math.random() - 0.5) * 0.2;
            data.push(price);
        }
        
        // Create chart
        const ctx = canvas.getContext('2d');
        new Chart(ctx, {
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
                        display: true,
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                        }
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
    }
    
    /**
     * Change symbol
     */
    changeSymbol(symbol) {
        this.symbol = symbol;
        
        if (this.widget) {
            try {
                this.widget.setSymbol('BINANCE:' + symbol + 'USDT', this.interval);
                this.addToSystemLog(`Changed symbol to ${symbol}/USDT`);
            } catch (error) {
                console.error('Error changing symbol:', error);
                this.addToSystemLog('Error changing symbol: ' + error.message);
            }
        }
    }
    
    /**
     * Change interval
     */
    changeInterval(interval) {
        this.interval = interval;
        
        if (this.widget) {
            try {
                this.widget.setInterval(interval);
                this.addToSystemLog(`Changed interval to ${interval}`);
            } catch (error) {
                console.error('Error changing interval:', error);
                this.addToSystemLog('Error changing interval: ' + error.message);
            }
        }
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
}

// Initialize TradingView integration when document is ready
document.addEventListener('DOMContentLoaded', function() {
    // Create and initialize TradingView integration
    window.tradingViewIntegration = new TradingViewIntegration();
    window.tradingViewIntegration.initialize();
});
