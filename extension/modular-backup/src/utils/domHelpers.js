/**
 * DOM manipulation and waiting helpers
 */

import { registerObserver } from '../index.js';

/**
 * Wait for an element to appear in the DOM
 */
export function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Check if element already exists
    const existing = document.querySelector(selector);
    if (existing) {
      resolve(existing);
      return;
    }

    // Set up MutationObserver to watch for element
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      } else if (Date.now() - startTime > timeout) {
        obs.disconnect();
        reject(new Error(`Timeout waiting for element: ${selector}`));
      }
    });

    registerObserver(observer);

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  });
}

/**
 * Wait for URL to change to match a pattern
 */
export function waitForUrlChange(urlSubstring, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const checkInterval = setInterval(() => {
      if (window.location.href.includes(urlSubstring)) {
        clearInterval(checkInterval);
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(checkInterval);
        reject(new Error(`Timeout waiting for URL to include: ${urlSubstring}`));
      }
    }, 100);
  });
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Make a panel draggable
 */
export function makePanelDraggable(panel) {
  const header = panel.querySelector('.helper-header');
  if (!header) return;

  let isDragging = false;
  let currentX, currentY, initialX, initialY;

  function dragStart(e) {
    if (e.target.id === 'helper-close') {
      return;
    }

    const rect = panel.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    isDragging = true;
    header.style.cursor = 'grabbing';
    e.preventDefault();
  }

  function drag(e) {
    if (isDragging) {
      e.preventDefault();

      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      const maxX = window.innerWidth - panel.offsetWidth;
      const maxY = window.innerHeight - panel.offsetHeight;

      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));

      panel.style.left = currentX + 'px';
      panel.style.top = currentY + 'px';
      panel.style.right = 'auto';
    }
  }

  function dragEnd() {
    if (isDragging) {
      isDragging = false;
      header.style.cursor = 'move';

      import('./storageHelpers.js').then(({ safeStorage }) => {
        safeStorage.set({
          panelPosition: {
            left: panel.style.left,
            top: panel.style.top
          }
        });
      });
    }
  }

  header.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  header.style.cursor = 'move';
}

/**
 * Wait for an element to be removed from the DOM
 */
export function waitForElementRemoval(selector, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Check if element already gone
    const existing = document.querySelector(selector);
    if (!existing) {
      resolve();
      return;
    }

    // Set up MutationObserver to watch for removal
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (!element) {
        obs.disconnect();
        resolve();
      } else if (Date.now() - startTime > timeout) {
        obs.disconnect();
        reject(new Error(`Timeout waiting for element removal: ${selector}`));
      }
    });

    registerObserver(observer);

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also poll as backup
    const pollInterval = setInterval(() => {
      const element = document.querySelector(selector);
      if (!element) {
        clearInterval(pollInterval);
        observer.disconnect();
        resolve();
      } else if (Date.now() - startTime > timeout) {
        clearInterval(pollInterval);
        observer.disconnect();
        reject(new Error(`Timeout waiting for element removal: ${selector}`));
      }
    }, 100);
  });
}
