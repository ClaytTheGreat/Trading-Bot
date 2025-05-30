/**
 * Portfolio Terminal Module for Trading Bot
 * Implements a terminal-like interface for portfolio monitoring
 * Provides real-time updates on trades, assets, and performance
 */

class PortfolioTerminal {
    constructor(analyticsModule) {
        this.analytics = analyticsModule;
        this.isVisible = false;
        this.terminalHistory = [];
        this.commandHistory = [];
        this.commandIndex = -1;
        this.refreshInterval = null;
        this.refreshRate = 5000; // 5 seconds
        this.terminalCommands = {
            'help': this.showHelp.bind(this),
            'portfolio': this.showPortfolio.bind(this),
            'assets': this.showAssets.bind(this),
            'trades': this.showTrades.bind(this),
            'performance': this.showPerformance.bind(this),
            'stats': this.showStats.bind(this),
            'clear': this.clearTerminal.bind(this),
            'refresh': this.setRefreshRate.bind(this)
        };
    }
    
    /**
     * Initialize the terminal
     */
    initialize() {
        // Create terminal UI
        this.createTerminalUI();
        
        // Add event listeners
        this.setupEventListeners();
        
        // Start auto-refresh
        this.startAutoRefresh();
        
        // Add welcome message
        this.addTerminalLine('Welcome to the Trading Bot Portfolio Terminal', 'system');
        this.addTerminalLine('Type "help" for a list of available commands', 'system');
        this.addTerminalLine('', 'system');
        this.showPortfolio();
        
        return {
            success: true,
            message: 'Portfolio terminal initialized'
        };
    }
    
    /**
     * Create terminal UI
     */
    createTerminalUI() {
        // Check if terminal already exists
        if (document.getElementById('portfolio-terminal')) return;
        
        // Create terminal container
        const terminalContainer = document.createElement('div');
        terminalContainer.id = 'portfolio-terminal-container';
        terminalContainer.className = 'terminal-container';
        terminalContainer.style.display = this.isVisible ? 'block' : 'none';
        
        // Create terminal header
        const terminalHeader = document.createElement('div');
        terminalHeader.className = 'terminal-header';
        terminalHeader.innerHTML = `
            <div class="terminal-title">Portfolio Terminal</div>
            <div class="terminal-controls">
                <button id="terminal-minimize" class="terminal-control-btn">_</button>
                <button id="terminal-maximize" class="terminal-control-btn">□</button>
                <button id="terminal-close" class="terminal-control-btn">×</button>
            </div>
        `;
        
        // Create terminal content
        const terminalContent = document.createElement('div');
        terminalContent.className = 'terminal-content';
        
        // Create terminal output
        const terminalOutput = document.createElement('div');
        terminalOutput.id = 'terminal-output';
        terminalOutput.className = 'terminal-output';
        
        // Create terminal input
        const terminalInput = document.createElement('div');
        terminalInput.className = 'terminal-input';
        terminalInput.innerHTML = `
            <span class="terminal-prompt">$</span>
            <input type="text" id="terminal-command" placeholder="Type a command...">
        `;
        
        // Assemble terminal
        terminalContent.appendChild(terminalOutput);
        terminalContent.appendChild(terminalInput);
        terminalContainer.appendChild(terminalHeader);
        terminalContainer.appendChild(terminalContent);
        
        // Add terminal toggle button to main UI
        const terminalToggle = document.createElement('button');
        terminalToggle.id = 'terminal-toggle';
        terminalToggle.className = 'terminal-toggle';
        terminalToggle.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M6 9a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3A.5.5 0 0 1 6 9zM3.854 4.146a.5.5 0 1 0-.708.708L4.793 6.5 3.146 8.146a.5.5 0 1 0 .708.708l2-2a.5.5 0 0 0 0-.708l-2-2z"/>
                <path d="M2 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2H2zm12 1a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1h12z"/>
            </svg>
            <span>Terminal</span>
        `;
        
        // Add to body
        document.body.appendChild(terminalContainer);
        document.body.appendChild(terminalToggle);
        
        // Add CSS styles
        this.addTerminalStyles();
    }
    
    /**
     * Add terminal styles
     */
    addTerminalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .terminal-toggle {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background-color: #2a3142;
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 12px;
                display: flex;
                align-items: center;
                gap: 8px;
                cursor: pointer;
                z-index: 999;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
            }
            
            .terminal-toggle:hover {
                background-color: #4e74ff;
            }
            
            .terminal-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 80%;
                max-width: 800px;
                height: 500px;
                background-color: rgba(26, 31, 44, 0.95);
                border-radius: 8px;
                overflow: hidden;
                display: flex;
                flex-direction: column;
                box-shadow: 0 5px 20px rgba(0, 0, 0, 0.5);
                z-index: 1000;
                font-family: 'Courier New', monospace;
            }
            
            .terminal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 10px 15px;
                background-color: #2a3142;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .terminal-title {
                font-weight: bold;
            }
            
            .terminal-controls {
                display: flex;
                gap: 10px;
            }
            
            .terminal-control-btn {
                background: none;
                border: none;
                color: white;
                cursor: pointer;
                width: 20px;
                height: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
            }
            
            .terminal-control-btn:hover {
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            .terminal-content {
                flex: 1;
                display: flex;
                flex-direction: column;
                padding: 15px;
                overflow: hidden;
            }
            
            .terminal-output {
                flex: 1;
                overflow-y: auto;
                margin-bottom: 10px;
                padding-right: 10px;
            }
            
            .terminal-line {
                margin-bottom: 5px;
                line-height: 1.4;
                white-space: pre-wrap;
                word-break: break-word;
            }
            
            .terminal-line.command {
                color: #4e74ff;
            }
            
            .terminal-line.result {
                color: #ffffff;
            }
            
            .terminal-line.error {
                color: #dc3545;
            }
            
            .terminal-line.system {
                color: #28a745;
            }
            
            .terminal-line.warning {
                color: #ffc107;
            }
            
            .terminal-line.info {
                color: #17a2b8;
            }
            
            .terminal-input {
                display: flex;
                align-items: center;
                background-color: rgba(0, 0, 0, 0.2);
                padding: 8px 12px;
                border-radius: 4px;
            }
            
            .terminal-prompt {
                color: #4e74ff;
                margin-right: 10px;
                font-weight: bold;
            }
            
            #terminal-command {
                flex: 1;
                background: none;
                border: none;
                color: white;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                outline: none;
            }
            
            .terminal-table {
                width: 100%;
                border-collapse: collapse;
                margin: 10px 0;
            }
            
            .terminal-table th {
                text-align: left;
                padding: 5px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.2);
                color: #4e74ff;
            }
            
            .terminal-table td {
                padding: 5px 10px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .terminal-table .positive {
                color: #28a745;
            }
            
            .terminal-table .negative {
                color: #dc3545;
            }
            
            .terminal-section {
                margin: 10px 0;
                padding-bottom: 5px;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .terminal-section-title {
                color: #4e74ff;
                font-weight: bold;
                margin-bottom: 5px;
            }
            
            .terminal-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
                gap: 10px;
                margin: 10px 0;
            }
            
            .terminal-grid-item {
                background-color: rgba(0, 0, 0, 0.2);
                padding: 10px;
                border-radius: 4px;
            }
            
            .terminal-grid-item-title {
                color: rgba(255, 255, 255, 0.7);
                font-size: 12px;
                margin-bottom: 5px;
            }
            
            .terminal-grid-item-value {
                font-size: 16px;
                font-weight: bold;
            }
            
            .terminal-grid-item-value.positive {
                color: #28a745;
            }
            
            .terminal-grid-item-value.negative {
                color: #dc3545;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    /**
     * Set up event listeners
     */
    setupEventListeners() {
        // Terminal toggle button
        const toggleButton = document.getElementById('terminal-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleTerminal();
            });
        }
        
        // Terminal control buttons
        const closeButton = document.getElementById('terminal-close');
        if (closeButton) {
            closeButton.addEventListener('click', () => {
                this.hideTerminal();
            });
        }
        
        const minimizeButton = document.getElementById('terminal-minimize');
        if (minimizeButton) {
            minimizeButton.addEventListener('click', () => {
                this.hideTerminal();
            });
        }
        
        const maximizeButton = document.getElementById('terminal-maximize');
        if (maximizeButton) {
            maximizeButton.addEventListener('click', () => {
                this.toggleMaximize();
            });
        }
        
        // Command input
        const commandInput = document.getElementById('terminal-command');
        if (commandInput) {
            commandInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const command = commandInput.value.trim();
                    if (command) {
                        this.executeCommand(command);
                        commandInput.value = '';
                        this.commandHistory.push(command);
                        this.commandIndex = this.commandHistory.length;
                    }
                } else if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    if (this.commandHistory.length > 0) {
                        this.commandIndex = Math.max(0, this.commandIndex - 1);
                        commandInput.value = this.commandHistory[this.commandIndex];
                    }
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    if (this.commandIndex < this.commandHistory.length - 1) {
                        this.commandIndex++;
                        commandInput.value = this.commandHistory[this.commandIndex];
                    } else {
                        this.commandIndex = this.commandHistory.length;
                        commandInput.value = '';
                    }
                }
            });
        }
    }
    
    /**
     * Start auto-refresh
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            if (this.isVisible) {
                // Auto-refresh current view
                const lastCommand = this.commandHistory[this.commandHistory.length - 1];
                if (lastCommand && this.terminalCommands[lastCommand]) {
                    this.terminalCommands[lastCommand](true);
                }
            }
        }, this.refreshRate);
    }
    
    /**
     * Toggle terminal visibility
     */
    toggleTerminal() {
        this.isVisible = !this.isVisible;
        const terminal = document.getElementById('portfolio-terminal-container');
        if (terminal) {
            terminal.style.display = this.isVisible ? 'flex' : 'none';
            
            if (this.isVisible) {
                // Focus input
                const commandInput = document.getElementById('terminal-command');
                if (commandInput) {
                    commandInput.focus();
                }
            }
        }
    }
    
    /**
     * Hide terminal
     */
    hideTerminal() {
        this.isVisible = false;
        const terminal = document.getElementById('portfolio-terminal-container');
        if (terminal) {
            terminal.style.display = 'none';
        }
    }
    
    /**
     * Toggle maximize
     */
    toggleMaximize() {
        const terminal = document.getElementById('portfolio-terminal-container');
        if (terminal) {
            if (terminal.style.width === '100%') {
                terminal.style.width = '80%';
                terminal.style.height = '500px';
                terminal.style.top = '';
                terminal.style.left = '';
                terminal.style.right = '20px';
                terminal.style.bottom = '20px';
                terminal.style.maxWidth = '800px';
            } else {
                terminal.style.width = '100%';
                terminal.style.height = '100%';
                terminal.style.top = '0';
                terminal.style.left = '0';
                terminal.style.right = '0';
                terminal.style.bottom = '0';
                terminal.style.maxWidth = '100%';
            }
        }
    }
    
    /**
     * Add a line to the terminal
     * @param {string} text - Text to add
     * @param {string} type - Line type (command, result, error, system, warning, info)
     */
    addTerminalLine(text, type = 'result') {
        const output = document.getElementById('terminal-output');
        if (!output) return;
        
        const line = document.createElement('div');
        line.className = `terminal-line ${type}`;
        line.textContent = text;
        
        output.appendChild(line);
        
        // Scroll to bottom
        output.scrollTop = output.scrollHeight;
        
        // Add to history
        this.terminalHistory.push({ text, type });
        
        // Limit history
        if (this.terminalHistory.length > 1000) {
            this.terminalHistory.shift();
        }
    }
    
    /**
     * Execute a command
     * @param {string} command - Command to execute
     */
    executeCommand(command) {
        this.addTerminalLine('$ ' + command, 'command');
        
        const parts = command.split(' ');
        const cmd = parts[0].toLowerCase();
        const args = parts.slice(1);
        
        if (this.terminalCommands[cmd]) {
            this.terminalCommands[cmd](false, ...args);
        } else {
            this.addTerminalLine(`Command not found: ${cmd}`, 'error');
            this.addTerminalLine('Type "help" for a list of available commands', 'system');
        }
    }
    
    /**
     * Show help
     */
    showHelp(silent = false) {
        if (!silent) {
            this.addTerminalLine('Available commands:', 'system');
            this.addTerminalLine('  help         - Show this help message', 'info');
            this.addTerminalLine('  portfolio    - Show portfolio overview', 'info');
            this.addTerminalLine('  assets       - Show asset allocation', 'info');
            this.addTerminalLine('  trades       - Show recent trades', 'info');
            this.addTerminalLine('  performance  - Show performance metrics', 'info');
            this.addTerminalLine('  stats        - Show trading statistics', 'info');
            this.addTerminalLine('  clear        - Clear terminal', 'info');
            this.addTerminalLine('  refresh <ms> - Set refresh rate (in milliseconds)', 'info');
        }
    }
    
    /**
     * Show portfolio overview
     */
    showPortfolio(silent = false) {
        if (!this.analytics) {
            this.addTerminalLine('Analytics module not available', 'error');
            return;
        }
        
        const summary = this.analytics.getSummary();
        
        if (!silent) {
            this.addTerminalLine('Portfolio Overview', 'system');
            this.addTerminalLine('', 'result');
            
            // Portfolio value
            this.addTerminalLine('Portfolio Value: $' + summary.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), 'result');
            
            // P&L
            const allTimePnLPercent = summary.allTimePnLPercent;
            const pnlColor = allTimePnLPercent >= 0 ? 'system' : 'error';
            this.addTerminalLine('All-Time P&L: ' + (allTimePnLPercent >= 0 ? '+' : '') + allTimePnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%', pnlColor);
            
            // Daily P&L
            const dailyPnLPercent = summary.dailyPnLPercent;
            const dailyPnLColor = dailyPnLPercent >= 0 ? 'system' : 'error';
            this.addTerminalLine('Daily P&L: ' + (dailyPnLPercent >= 0 ? '+' : '') + dailyPnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%', dailyPnLColor);
            
            // Win rate
            this.addTerminalLine('Win Rate: ' + summary.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%', 'result');
            
            // Total trades
            this.addTerminalLine('Total Trades: ' + summary.totalTrades, 'result');
            
            this.addTerminalLine('', 'result');
            this.addTerminalLine('Asset Allocation:', 'system');
            
            // Asset allocation
            const assets = Object.keys(summary.assetAllocation);
            if (assets.length > 0) {
                let table = '+-----------------+----------------+----------------+----------------+\n';
                table += '| Asset           | Amount         | Value          | Allocation     |\n';
                table += '+-----------------+----------------+----------------+----------------+\n';
                
                assets.forEach(asset => {
                    const assetData = summary.assetAllocation[asset];
                    table += '| ' + asset.padEnd(15) + ' | ';
                    table += assetData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }).padEnd(14) + ' | ';
                    table += ('$' + assetData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' | ';
                    table += (assetData.allocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%').padEnd(14) + ' |\n';
                });
                
                table += '+-----------------+----------------+----------------+----------------+\n';
                this.addTerminalLine(table, 'result');
            } else {
                this.addTerminalLine('No assets found', 'warning');
            }
            
            this.addTerminalLine('', 'result');
            this.addTerminalLine('Type "assets", "trades", or "performance" for more details', 'info');
        }
    }
    
    /**
     * Show asset allocation
     */
    showAssets(silent = false) {
        if (!this.analytics) {
            this.addTerminalLine('Analytics module not available', 'error');
            return;
        }
        
        const summary = this.analytics.getSummary();
        const assets = Object.keys(summary.assetAllocation);
        
        if (!silent) {
            this.addTerminalLine('Asset Allocation', 'system');
            this.addTerminalLine('', 'result');
            
            if (assets.length > 0) {
                let table = '+-----------------+----------------+----------------+----------------+----------------+\n';
                table += '| Asset           | Amount         | Value          | Allocation     | 24h Change     |\n';
                table += '+-----------------+----------------+----------------+----------------+----------------+\n';
                
                assets.forEach(asset => {
                    const assetData = summary.assetAllocation[asset];
                    table += '| ' + asset.padEnd(15) + ' | ';
                    table += assetData.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 8 }).padEnd(14) + ' | ';
                    table += ('$' + assetData.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' | ';
                    table += (assetData.allocation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%').padEnd(14) + ' | ';
                    
                    const changeStr = (assetData.change24h >= 0 ? '+' : '') + assetData.change24h.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                    table += changeStr.padEnd(14) + ' |\n';
                });
                
                table += '+-----------------+----------------+----------------+----------------+----------------+\n';
                this.addTerminalLine(table, 'result');
            } else {
                this.addTerminalLine('No assets found', 'warning');
            }
        }
    }
    
    /**
     * Show recent trades
     */
    showTrades(silent = false, count = 10) {
        if (!this.analytics) {
            this.addTerminalLine('Analytics module not available', 'error');
            return;
        }
        
        const trades = this.analytics.trades;
        const numTrades = Math.min(parseInt(count) || 10, trades.length);
        
        if (!silent) {
            this.addTerminalLine(`Recent Trades (${numTrades})`, 'system');
            this.addTerminalLine('', 'result');
            
            if (trades.length > 0) {
                let table = '+---------------------+------------+------+----------------+----------------+----------------+----------------+\n';
                table += '| Date                | Pair       | Type | Entry          | Exit           | Size           | P&L            |\n';
                table += '+---------------------+------------+------+----------------+----------------+----------------+----------------+\n';
                
                // Sort trades by timestamp (newest first)
                const sortedTrades = [...trades].sort((a, b) => b.timestamp - a.timestamp);
                
                sortedTrades.slice(0, numTrades).forEach(trade => {
                    const date = new Date(trade.timestamp).toLocaleString();
                    const pair = trade.pair || 'AVAX/USDT';
                    const type = trade.direction === 'long' || trade.type === 'BUY' ? 'BUY' : 'SELL';
                    const entry = '$' + (trade.entryPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const exit = '$' + (trade.exitPrice || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const size = (trade.size || 1).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 });
                    const pl = (trade.profitLoss >= 0 ? '+' : '') + trade.profitLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
                    
                    table += '| ' + date.padEnd(19) + ' | ';
                    table += pair.padEnd(10) + ' | ';
                    table += type.padEnd(4) + ' | ';
                    table += entry.padEnd(14) + ' | ';
                    table += exit.padEnd(14) + ' | ';
                    table += size.padEnd(14) + ' | ';
                    table += pl.padEnd(14) + ' |\n';
                });
                
                table += '+---------------------+------------+------+----------------+----------------+----------------+----------------+\n';
                this.addTerminalLine(table, 'result');
                
                if (trades.length > numTrades) {
                    this.addTerminalLine(`Showing ${numTrades} of ${trades.length} trades. Use "trades <count>" to show more.`, 'info');
                }
            } else {
                this.addTerminalLine('No trades found', 'warning');
            }
        }
    }
    
    /**
     * Show performance metrics
     */
    showPerformance(silent = false) {
        if (!this.analytics) {
            this.addTerminalLine('Analytics module not available', 'error');
            return;
        }
        
        const summary = this.analytics.getSummary();
        
        if (!silent) {
            this.addTerminalLine('Performance Metrics', 'system');
            this.addTerminalLine('', 'result');
            
            // P&L metrics
            this.addTerminalLine('P&L Metrics:', 'info');
            let plTable = '+----------------+----------------+----------------+----------------+\n';
            plTable += '| Daily          | Weekly         | Monthly        | All-Time       |\n';
            plTable += '+----------------+----------------+----------------+----------------+\n';
            
            const dailyPnL = '$' + summary.dailyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const dailyPnLPercent = (summary.dailyPnLPercent >= 0 ? '+' : '') + summary.dailyPnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            const weeklyPnL = '$' + summary.weeklyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const weeklyPnLPercent = (summary.weeklyPnLPercent >= 0 ? '+' : '') + summary.weeklyPnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            const monthlyPnL = '$' + summary.monthlyPnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const monthlyPnLPercent = (summary.monthlyPnLPercent >= 0 ? '+' : '') + summary.monthlyPnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            const allTimePnL = '$' + summary.allTimePnL.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
            const allTimePnLPercent = (summary.allTimePnLPercent >= 0 ? '+' : '') + summary.allTimePnLPercent.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%';
            
            plTable += '| ' + (dailyPnL + ' (' + dailyPnLPercent + ')').padEnd(14) + ' | ';
            plTable += (weeklyPnL + ' (' + weeklyPnLPercent + ')').padEnd(14) + ' | ';
            plTable += (monthlyPnL + ' (' + monthlyPnLPercent + ')').padEnd(14) + ' | ';
            plTable += (allTimePnL + ' (' + allTimePnLPercent + ')').padEnd(14) + ' |\n';
            
            plTable += '+----------------+----------------+----------------+----------------+\n';
            this.addTerminalLine(plTable, 'result');
            
            this.addTerminalLine('', 'result');
            
            // Strategy performance
            this.addTerminalLine('Strategy Performance:', 'info');
            let strategyTable = '+----------------+----------------+----------------+----------------+\n';
            strategyTable += '| Strategy       | Trades         | Win Rate       | P&L            |\n';
            strategyTable += '+----------------+----------------+----------------+----------------+\n';
            
            const strategies = ['scalping', 'dayTrading', 'swingTrading'];
            const strategyNames = ['Scalping', 'Day Trading', 'Swing Trading'];
            
            strategies.forEach((strategy, index) => {
                const data = summary.timeframePerformance[strategy];
                strategyTable += '| ' + strategyNames[index].padEnd(14) + ' | ';
                strategyTable += data.trades.toString().padEnd(14) + ' | ';
                strategyTable += (data.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%').padEnd(14) + ' | ';
                strategyTable += ('$' + data.pnl.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' |\n';
            });
            
            strategyTable += '+----------------+----------------+----------------+----------------+\n';
            this.addTerminalLine(strategyTable, 'result');
            
            this.addTerminalLine('', 'result');
            
            // Key metrics
            this.addTerminalLine('Key Metrics:', 'info');
            let metricsTable = '+----------------+----------------+----------------+----------------+\n';
            metricsTable += '| Profit Factor  | Sharpe Ratio   | Avg. Win       | Avg. Loss      |\n';
            metricsTable += '+----------------+----------------+----------------+----------------+\n';
            
            metricsTable += '| ' + summary.profitFactor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(14) + ' | ';
            metricsTable += summary.sharpeRatio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(14) + ' | ';
            metricsTable += ('$' + summary.averageWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' | ';
            metricsTable += ('$' + summary.averageLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' |\n';
            
            metricsTable += '+----------------+----------------+----------------+----------------+\n';
            this.addTerminalLine(metricsTable, 'result');
        }
    }
    
    /**
     * Show trading statistics
     */
    showStats(silent = false) {
        if (!this.analytics) {
            this.addTerminalLine('Analytics module not available', 'error');
            return;
        }
        
        const summary = this.analytics.getSummary();
        
        if (!silent) {
            this.addTerminalLine('Trading Statistics', 'system');
            this.addTerminalLine('', 'result');
            
            // Trade stats
            this.addTerminalLine('Trade Statistics:', 'info');
            let tradeTable = '+----------------+----------------+----------------+----------------+\n';
            tradeTable += '| Total Trades   | Winning Trades | Losing Trades  | Win Rate       |\n';
            tradeTable += '+----------------+----------------+----------------+----------------+\n';
            
            tradeTable += '| ' + summary.totalTrades.toString().padEnd(14) + ' | ';
            tradeTable += summary.winningTrades.toString().padEnd(14) + ' | ';
            tradeTable += summary.losingTrades.toString().padEnd(14) + ' | ';
            tradeTable += (summary.winRate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + '%').padEnd(14) + ' |\n';
            
            tradeTable += '+----------------+----------------+----------------+----------------+\n';
            this.addTerminalLine(tradeTable, 'result');
            
            this.addTerminalLine('', 'result');
            
            // Profit stats
            this.addTerminalLine('Profit Statistics:', 'info');
            let profitTable = '+----------------+----------------+----------------+----------------+\n';
            profitTable += '| Largest Win    | Largest Loss   | Avg. Win       | Avg. Loss      |\n';
            profitTable += '+----------------+----------------+----------------+----------------+\n';
            
            profitTable += '| $' + summary.largestWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(13) + ' | ';
            profitTable += '$' + summary.largestLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(13) + ' | ';
            profitTable += '$' + summary.averageWin.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(13) + ' | ';
            profitTable += '$' + summary.averageLoss.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(13) + ' |\n';
            
            profitTable += '+----------------+----------------+----------------+----------------+\n';
            this.addTerminalLine(profitTable, 'result');
            
            this.addTerminalLine('', 'result');
            
            // Performance metrics
            this.addTerminalLine('Performance Metrics:', 'info');
            let metricsTable = '+----------------+----------------+----------------+\n';
            metricsTable += '| Profit Factor  | Sharpe Ratio   | Portfolio Value |\n';
            metricsTable += '+----------------+----------------+----------------+\n';
            
            metricsTable += '| ' + summary.profitFactor.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(14) + ' | ';
            metricsTable += summary.sharpeRatio.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }).padEnd(14) + ' | ';
            metricsTable += ('$' + summary.portfolioValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })).padEnd(14) + ' |\n';
            
            metricsTable += '+----------------+----------------+----------------+\n';
            this.addTerminalLine(metricsTable, 'result');
        }
    }
    
    /**
     * Clear terminal
     */
    clearTerminal() {
        const output = document.getElementById('terminal-output');
        if (output) {
            output.innerHTML = '';
            this.terminalHistory = [];
            this.addTerminalLine('Terminal cleared', 'system');
        }
    }
    
    /**
     * Set refresh rate
     * @param {boolean} silent - Whether to suppress output
     * @param {string} rate - Refresh rate in milliseconds
     */
    setRefreshRate(silent = false, rate) {
        const newRate = parseInt(rate);
        
        if (!isNaN(newRate) && newRate >= 1000) {
            this.refreshRate = newRate;
            this.startAutoRefresh();
            
            if (!silent) {
                this.addTerminalLine(`Refresh rate set to ${newRate}ms`, 'system');
            }
        } else {
            if (!silent) {
                this.addTerminalLine('Invalid refresh rate. Must be at least 1000ms.', 'error');
                this.addTerminalLine('Usage: refresh <milliseconds>', 'info');
            }
        }
    }
}

// Export the class for use in other modules
window.PortfolioTerminal = PortfolioTerminal;
