// Network UI Components for Trading Bot
// Adds network selection UI and status indicators

// Create network selection UI
function createNetworkUI() {
  // Create network selection container
  const networkContainer = document.createElement('div');
  networkContainer.className = 'network-selection-container';
  
  // Create title
  const title = document.createElement('h3');
  title.className = 'network-title';
  title.textContent = 'Select Network';
  networkContainer.appendChild(title);
  
  // Create network buttons container
  const buttonsContainer = document.createElement('div');
  buttonsContainer.className = 'network-buttons';
  
  // Add Ethereum button
  const ethButton = createNetworkButton('ETHEREUM', 'Ethereum', 'eth-icon');
  buttonsContainer.appendChild(ethButton);
  
  // Add Arbitrum button
  const arbButton = createNetworkButton('ARBITRUM', 'Arbitrum', 'arb-icon');
  buttonsContainer.appendChild(arbButton);
  
  // Add Avalanche button
  const avaxButton = createNetworkButton('AVALANCHE', 'Avalanche', 'avax-icon');
  buttonsContainer.appendChild(avaxButton);
  
  networkContainer.appendChild(buttonsContainer);
  
  // Create current network display
  const networkDisplay = document.createElement('div');
  networkDisplay.className = 'current-network';
  
  const networkLabel = document.createElement('span');
  networkLabel.className = 'network-label';
  networkLabel.textContent = 'Current Network:';
  
  const networkBadge = document.createElement('span');
  networkBadge.id = 'network-display';
  networkBadge.className = 'badge badge-warning';
  networkBadge.textContent = 'Not Connected';
  
  networkDisplay.appendChild(networkLabel);
  networkDisplay.appendChild(networkBadge);
  networkContainer.appendChild(networkDisplay);
  
  return networkContainer;
}

// Create a network selection button
function createNetworkButton(networkKey, networkName, iconClass) {
  const button = document.createElement('button');
  button.className = 'btn network-select-btn';
  button.setAttribute('data-network', networkKey);
  
  const icon = document.createElement('i');
  icon.className = 'network-icon ' + iconClass;
  
  const text = document.createElement('span');
  text.textContent = networkName;
  
  button.appendChild(icon);
  button.appendChild(text);
  
  return button;
}

// Add network selection UI to sidebar
function addNetworkUIToSidebar() {
  const sidebar = document.querySelector('.sidebar-footer');
  if (sidebar) {
    const networkUI = createNetworkUI();
    sidebar.appendChild(networkUI);
  }
}

// Add network styles to head
function addNetworkStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .network-selection-container {
      margin-top: 20px;
      padding: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .network-title {
      font-size: 14px;
      margin-bottom: 10px;
      color: #a0a0a0;
    }
    
    .network-buttons {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 15px;
    }
    
    .network-select-btn {
      flex: 1;
      min-width: 90px;
      padding: 8px;
      border-radius: 6px;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 12px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all 0.2s;
    }
    
    .network-select-btn:hover {
      background: rgba(255, 255, 255, 0.1);
    }
    
    .network-select-btn.active {
      background: rgba(78, 116, 255, 0.3);
      border-color: rgba(78, 116, 255, 0.5);
    }
    
    .network-icon {
      font-size: 18px;
      margin-bottom: 5px;
    }
    
    .eth-icon::before {
      content: "Ξ";
      font-style: normal;
      color: #627eea;
    }
    
    .arb-icon::before {
      content: "A";
      font-style: normal;
      color: #28a0f0;
    }
    
    .avax-icon::before {
      content: "X";
      font-style: normal;
      color: #e84142;
    }
    
    .current-network {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 12px;
      color: #a0a0a0;
    }
    
    #connect-metamask.connected {
      background-color: #4caf50;
      border-color: #43a047;
    }
  `;
  document.head.appendChild(style);
}

// Initialize network UI
document.addEventListener('DOMContentLoaded', function() {
  addNetworkStyles();
  addNetworkUIToSidebar();
});
