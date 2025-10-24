/**
 * UNIVERSAL CLICK LISTENER - Logs everything you click
 *
 * Instructions:
 * 1. Open console (F12)
 * 2. Paste this entire script
 * 3. Click through the date picker manually
 * 4. Send all output to Claude
 */

(function setupClickListener() {
  console.log('========================================');
  console.log('CLICK LISTENER ACTIVE');
  console.log('Click anything and watch the magic!');
  console.log('========================================\n');

  let clickCounter = 0;

  // Track all dropdowns
  const trackDropdowns = () => {
    const dropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
    const visible = Array.from(dropdowns).filter(d => d.offsetParent !== null);
    return {
      total: dropdowns.length,
      visible: visible.length,
      visibleElements: visible
    };
  };

  // Track dialogs
  const trackDialogs = () => {
    const dialogs = document.querySelectorAll('tp-yt-paper-dialog, [role="dialog"], ytcp-date-period-picker');
    const visible = Array.from(dialogs).filter(d => {
      const style = window.getComputedStyle(d);
      return d.offsetParent !== null || style.display !== 'none';
    });
    return {
      total: dialogs.length,
      visible: visible.length,
      visibleElements: visible
    };
  };

  // Track sidebar date
  const getSidebarDate = () => {
    const sidebar = document.querySelector('yta-explore-sidebar');
    if (!sidebar) return 'NO SIDEBAR';

    const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
    for (const trigger of triggers) {
      const text = trigger.textContent;
      if (text.includes('–') || text.includes('Since') || text.includes('days')) {
        return text.substring(0, 100).trim().replace(/\n/g, ' ');
      }
    }
    return 'NO DATE TRIGGER';
  };

  // Log state before click
  const logStateBeforeClick = () => {
    const dropdownState = trackDropdowns();
    const dialogState = trackDialogs();
    const sidebarDate = getSidebarDate();

    console.log('  BEFORE STATE:');
    console.log(`    Dropdowns: ${dropdownState.visible}/${dropdownState.total} visible`);
    console.log(`    Dialogs: ${dialogState.visible}/${dialogState.total} visible`);
    console.log(`    Sidebar date: "${sidebarDate}"`);

    // Show visible dropdowns
    if (dropdownState.visible > 0) {
      dropdownState.visibleElements.forEach((dd, i) => {
        const items = dd.querySelectorAll('tp-yt-paper-item');
        console.log(`      Dropdown ${i + 1}: ${items.length} items`);
      });
    }

    // Show visible dialogs
    if (dialogState.visible > 0) {
      dialogState.visibleElements.forEach((dialog, i) => {
        const label = dialog.getAttribute('aria-label') || dialog.tagName;
        console.log(`      Dialog ${i + 1}: ${label}`);

        // If it's a date dialog, show input values
        if (dialog.tagName === 'YTCP-DATE-PERIOD-PICKER' || label.toLowerCase().includes('date')) {
          const inputs = dialog.querySelectorAll('input');
          inputs.forEach((input, j) => {
            console.log(`        Input ${j + 1}: "${input.value}"`);
          });
        }
      });
    }
  };

  // Log state after click
  const logStateAfterClick = () => {
    setTimeout(() => {
      const dropdownState = trackDropdowns();
      const dialogState = trackDialogs();
      const sidebarDate = getSidebarDate();

      console.log('  AFTER STATE (after 500ms):');
      console.log(`    Dropdowns: ${dropdownState.visible}/${dropdownState.total} visible`);
      console.log(`    Dialogs: ${dialogState.visible}/${dialogState.total} visible`);
      console.log(`    Sidebar date: "${sidebarDate}"`);

      // Show visible dropdowns
      if (dropdownState.visible > 0) {
        dropdownState.visibleElements.forEach((dd, i) => {
          const items = dd.querySelectorAll('tp-yt-paper-item');
          console.log(`      Dropdown ${i + 1}: ${items.length} items`);

          // Show first few options
          Array.from(items).slice(0, 3).forEach((item, j) => {
            const testId = item.getAttribute('test-id');
            const text = item.textContent.substring(0, 30).trim();
            console.log(`        ${j + 1}. test-id="${testId}" "${text}"`);
          });
        });
      }

      // Show visible dialogs
      if (dialogState.visible > 0) {
        dialogState.visibleElements.forEach((dialog, i) => {
          const label = dialog.getAttribute('aria-label') || dialog.tagName;
          console.log(`      Dialog ${i + 1}: ${label}`);

          // If it's a date dialog, show input values
          if (dialog.tagName === 'YTCP-DATE-PERIOD-PICKER' || label.toLowerCase().includes('date')) {
            const inputs = dialog.querySelectorAll('input');
            inputs.forEach((input, j) => {
              console.log(`        Input ${j + 1}: "${input.value}"`);
            });

            const applyBtn = dialog.querySelector('#apply-button, button');
            if (applyBtn) {
              console.log(`        Apply button: disabled=${applyBtn.disabled || applyBtn.getAttribute('aria-disabled')}`);
            }
          }
        });
      }

      console.log(''); // Empty line for readability
    }, 500);
  };

  // Main click handler
  document.addEventListener('click', (event) => {
    clickCounter++;
    const target = event.target;

    console.log(`\n========== CLICK #${clickCounter} ==========`);
    console.log('CLICKED ELEMENT:');
    console.log(`  Tag: ${target.tagName}`);
    console.log(`  ID: ${target.id || 'none'}`);
    console.log(`  Classes: ${target.className || 'none'}`);
    console.log(`  Text: "${target.textContent.substring(0, 50).trim()}"`);

    // Check if it's a specific element type
    const role = target.getAttribute('role');
    const testId = target.getAttribute('test-id');
    const ariaLabel = target.getAttribute('aria-label');

    if (role) console.log(`  Role: ${role}`);
    if (testId) console.log(`  Test-ID: ${testId}`);
    if (ariaLabel) console.log(`  Aria-Label: ${ariaLabel}`);

    // Check parent elements for context
    let parent = target.parentElement;
    let parentChain = [];
    for (let i = 0; i < 3 && parent; i++) {
      parentChain.push(parent.tagName);
      parent = parent.parentElement;
    }
    console.log(`  Parent chain: ${parentChain.join(' > ')}`);

    // Log state before and after
    logStateBeforeClick();
    logStateAfterClick();
  }, true); // Use capture phase to catch everything

  // Input change listener
  document.addEventListener('input', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT') {
      console.log(`\n📝 INPUT CHANGE:`);
      console.log(`  ID: ${target.id || 'none'}`);
      console.log(`  Value: "${target.value}"`);
      console.log(`  Type: ${target.type}`);
    }
  }, true);

  // Focus listener
  document.addEventListener('focus', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT') {
      console.log(`\n🎯 INPUT FOCUSED:`);
      console.log(`  ID: ${target.id || 'none'}`);
      console.log(`  Value: "${target.value}"`);
    }
  }, true);

  // Blur listener
  document.addEventListener('blur', (event) => {
    const target = event.target;
    if (target.tagName === 'INPUT') {
      console.log(`\n👋 INPUT BLURRED:`);
      console.log(`  ID: ${target.id || 'none'}`);
      console.log(`  Final value: "${target.value}"`);
    }
  }, true);

  // Mutation observer for DOM changes
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      // Track when dropdowns appear/disappear
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === 1) { // Element node
          if (node.matches && node.matches('tp-yt-paper-listbox[role="listbox"]')) {
            console.log(`\n✨ DROPDOWN ADDED TO DOM`);
          }
          if (node.matches && node.matches('ytcp-date-period-picker')) {
            console.log(`\n📅 DATE DIALOG ADDED TO DOM`);
          }
        }
      });

      mutation.removedNodes.forEach((node) => {
        if (node.nodeType === 1) {
          if (node.matches && node.matches('tp-yt-paper-listbox[role="listbox"]')) {
            console.log(`\n💨 DROPDOWN REMOVED FROM DOM`);
          }
          if (node.matches && node.matches('ytcp-date-period-picker')) {
            console.log(`\n📅 DATE DIALOG REMOVED FROM DOM`);

            // Log sidebar date after dialog closes
            setTimeout(() => {
              console.log(`  Sidebar date after dialog close: "${getSidebarDate()}"`);
            }, 100);
          }
        }
      });

      // Track attribute changes on dropdowns and dialogs
      if (mutation.type === 'attributes' && mutation.target.nodeType === 1) {
        const target = mutation.target;
        if (target.matches('tp-yt-paper-listbox[role="listbox"]') ||
            target.matches('ytcp-date-period-picker')) {

          const visible = target.offsetParent !== null;
          const display = window.getComputedStyle(target).display;

          if (mutation.attributeName === 'style' ||
              mutation.attributeName === 'class' ||
              mutation.attributeName === 'hidden') {
            console.log(`\n🔄 ${target.tagName} VISIBILITY CHANGED:`);
            console.log(`  Visible: ${visible} (display: ${display})`);
          }
        }
      }
    });
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['style', 'class', 'hidden', 'aria-hidden']
  });

  console.log('✅ Listener setup complete!');
  console.log('Now manually click through the date picker process...\n');

})();
