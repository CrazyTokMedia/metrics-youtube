/**
 * YouTube Treatment Comparison Helper - Popup Script
 * Handles toggle button for showing/hiding the panel on YouTube Studio
 */

document.addEventListener('DOMContentLoaded', async () => {
  const toggleBtn = document.getElementById('toggle-panel-btn');
  const toggleText = document.getElementById('toggle-text');

  // Get current panel state from storage
  const result = await chrome.storage.local.get(['panelVisible']);
  let isPanelVisible = result.panelVisible !== false; // Default to true

  // Update button state
  updateButton(isPanelVisible);

  // Handle toggle button click
  toggleBtn.addEventListener('click', async () => {
    // Toggle state
    isPanelVisible = !isPanelVisible;

    // Save to storage
    await chrome.storage.local.set({ panelVisible: isPanelVisible });

    // Update button
    updateButton(isPanelVisible);

    // Send message to content script to toggle panel
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (tab && tab.url && tab.url.includes('studio.youtube.com')) {
      chrome.tabs.sendMessage(tab.id, {
        action: 'togglePanel',
        visible: isPanelVisible
      });

      // Auto-close popup when showing the panel
      if (isPanelVisible) {
        window.close();
      }
    } else {
      // Not on YouTube Studio
      alert('Please navigate to YouTube Studio first');
    }
  });

  function updateButton(visible) {
    if (visible) {
      toggleBtn.classList.remove('hide');
      toggleText.textContent = 'Hide Panel';
    } else {
      toggleBtn.classList.add('hide');
      toggleText.textContent = 'Show Panel';
    }
  }
});
