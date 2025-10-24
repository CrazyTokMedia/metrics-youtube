/**
 * ULTRA COMPREHENSIVE DEBUG SCRIPT FOR AUDIENCE RETENTION DATE PICKER
 * This script NEVER gives up and shows EVERYTHING
 */

(async function debugRetentionDatePicker() {
  console.log('========================================');
  console.log('AUDIENCE RETENTION DATE PICKER DEBUG');
  console.log('========================================\n');

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const showElement = (label, el) => {
    if (!el) {
      console.log(`  ${label}: NOT FOUND`);
      return;
    }
    console.log(`  ${label}: FOUND`);
    console.log(`    Tag: ${el.tagName}`);
    console.log(`    Classes: ${el.className}`);
    console.log(`    ID: ${el.id || 'none'}`);
    console.log(`    Text (first 100): "${el.textContent.substring(0, 100).trim()}"`);
    console.log(`    Visible: ${el.offsetParent !== null}`);
    console.log(`    HTML (first 200): ${el.outerHTML.substring(0, 200)}`);
  };

  // ===== STEP 1: PAGE ANALYSIS =====
  console.log('\n===== STEP 1: PAGE ANALYSIS =====');
  console.log('URL:', window.location.href);
  console.log('Title:', document.title);

  const isRetentionPage = window.location.href.includes('analytics') || document.title.includes('Analytics');
  console.log('Is Analytics page:', isRetentionPage);

  // Check current tab
  const reportTriggers = Array.from(document.querySelectorAll('ytcp-dropdown-trigger'));
  console.log('Found ytcp-dropdown-trigger elements:', reportTriggers.length);

  for (let i = 0; i < reportTriggers.length; i++) {
    const trigger = reportTriggers[i];
    const labelText = trigger.querySelector('.label-text');
    if (labelText && labelText.textContent.trim() === 'Report') {
      const dropdownText = trigger.querySelector('.dropdown-trigger-text');
      if (dropdownText) {
        console.log('Current Report Tab:', dropdownText.textContent.trim());
      }
    }
  }

  // ===== STEP 2: SIDEBAR SEARCH =====
  console.log('\n===== STEP 2: FINDING SIDEBAR =====');
  const sidebar = document.querySelector('yta-explore-sidebar');
  showElement('yta-explore-sidebar', sidebar);

  if (!sidebar) {
    console.log('\n❌ Sidebar not found! Searching for alternatives...');
    console.log('All elements with "sidebar" in class:');
    const sidebarLike = document.querySelectorAll('[class*="sidebar"]');
    sidebarLike.forEach((el, i) => {
      console.log(`  ${i + 1}. ${el.tagName}.${el.className}`);
    });
  }

  // ===== STEP 3: FIND ALL DROPDOWN TRIGGERS =====
  console.log('\n===== STEP 3: FINDING ALL DROPDOWN TRIGGERS =====');
  const allTriggers = document.querySelectorAll('ytcp-dropdown-trigger');
  console.log(`Found ${allTriggers.length} ytcp-dropdown-trigger elements total`);

  const triggersInSidebar = sidebar ? sidebar.querySelectorAll('ytcp-dropdown-trigger') : [];
  console.log(`Found ${triggersInSidebar.length} triggers in sidebar`);

  triggersInSidebar.forEach((trigger, i) => {
    const text = trigger.textContent.substring(0, 80).trim().replace(/\n/g, ' ');
    const hasDateChars = text.includes('–') || text.includes('Since') || text.includes('days');
    console.log(`  ${i + 1}. [${hasDateChars ? 'DATE-LIKE' : '        '}] "${text}"`);
  });

  // ===== STEP 4: FIND DATE TRIGGER (MULTIPLE STRATEGIES) =====
  console.log('\n===== STEP 4: FINDING DATE TRIGGER =====');
  let dateTrigger = null;

  // Strategy 1: Look for date-like text
  console.log('Strategy 1: Looking for date-like text in sidebar triggers...');
  for (const trigger of triggersInSidebar) {
    const text = trigger.textContent;
    if (text.includes('–') || text.includes('Since') || text.includes('days')) {
      dateTrigger = trigger;
      console.log('  ✅ Found via date-like text');
      break;
    }
  }

  // Strategy 2: Look for yta-time-picker
  if (!dateTrigger) {
    console.log('Strategy 2: Looking for yta-time-picker...');
    const timePicker = document.querySelector('yta-time-picker');
    if (timePicker) {
      console.log('  Found yta-time-picker');
      const trigger = timePicker.querySelector('ytcp-dropdown-trigger');
      if (trigger) {
        dateTrigger = trigger;
        console.log('  ✅ Found trigger inside yta-time-picker');
      }
    } else {
      console.log('  yta-time-picker not found');
    }
  }

  // Strategy 3: Look for ytcp-text-dropdown-trigger
  if (!dateTrigger) {
    console.log('Strategy 3: Looking for ytcp-text-dropdown-trigger...');
    const textDropdowns = document.querySelectorAll('ytcp-text-dropdown-trigger');
    console.log(`  Found ${textDropdowns.length} ytcp-text-dropdown-trigger elements`);
    textDropdowns.forEach((dropdown, i) => {
      const text = dropdown.textContent.substring(0, 60).trim();
      console.log(`    ${i + 1}. "${text}"`);
      if (text.includes('–') || text.includes('Since') || text.includes('days')) {
        const trigger = dropdown.querySelector('ytcp-dropdown-trigger');
        if (trigger) {
          dateTrigger = trigger;
          console.log(`    ✅ Found date trigger at index ${i + 1}`);
        }
      }
    });
  }

  if (dateTrigger) {
    showElement('FINAL DATE TRIGGER', dateTrigger);
  } else {
    console.log('\n❌ NO DATE TRIGGER FOUND AFTER ALL STRATEGIES!');
    console.log('This is critical - cannot proceed without date trigger');
    return;
  }

  // ===== STEP 5: CLICK THE TRIGGER (MULTIPLE METHODS) =====
  console.log('\n===== STEP 5: CLICKING DATE TRIGGER =====');

  // Close any existing dropdowns first
  const existingDropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
  console.log('Existing dropdowns before click:', existingDropdowns.length);
  if (existingDropdowns.length > 0) {
    console.log('Clicking body to close existing dropdowns...');
    document.body.click();
    await wait(300);
  }

  // Scroll into view
  console.log('Scrolling trigger into view...');
  dateTrigger.scrollIntoView({ behavior: 'instant', block: 'center' });
  await wait(100);

  // Try multiple click methods
  console.log('\nMethod 1: focus + click()');
  dateTrigger.focus();
  await wait(50);
  dateTrigger.click();
  await wait(500);
  let dropdown = document.querySelector('tp-yt-paper-listbox[role="listbox"]');
  console.log('  Dropdown appeared:', !!dropdown);

  if (!dropdown) {
    console.log('\nMethod 2: dispatchEvent(MouseEvent)');
    dateTrigger.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await wait(500);
    dropdown = document.querySelector('tp-yt-paper-listbox[role="listbox"]');
    console.log('  Dropdown appeared:', !!dropdown);
  }

  if (!dropdown) {
    console.log('\nMethod 3: Finding button inside trigger');
    const button = dateTrigger.querySelector('[role="button"]');
    if (button) {
      console.log('  Found button, clicking it...');
      button.click();
      await wait(500);
      dropdown = document.querySelector('tp-yt-paper-listbox[role="listbox"]');
      console.log('  Dropdown appeared:', !!dropdown);
    }
  }

  // ===== STEP 6: ANALYZE DROPDOWN =====
  console.log('\n===== STEP 6: ANALYZING DROPDOWN =====');

  if (!dropdown) {
    console.log('❌ NO DROPDOWN APPEARED!');
    console.log('\nSearching for ANY visible dropdowns or menus:');
    const allListboxes = document.querySelectorAll('[role="listbox"]');
    console.log('  All listbox elements:', allListboxes.length);
    allListboxes.forEach((lb, i) => {
      console.log(`    ${i + 1}. ${lb.tagName} visible: ${lb.offsetParent !== null}`);
    });

    const allMenus = document.querySelectorAll('[role="menu"]');
    console.log('  All menu elements:', allMenus.length);

    console.log('\nSearching for tp-yt-paper-* elements:');
    const paperElements = document.querySelectorAll('[class*="tp-yt-paper"]');
    console.log(`  Found ${paperElements.length} paper elements`);

    console.log('\n⚠️ CANNOT CONTINUE WITHOUT DROPDOWN');
    return;
  }

  showElement('DROPDOWN (tp-yt-paper-listbox)', dropdown);

  // ===== STEP 7: FIND ALL OPTIONS =====
  console.log('\n===== STEP 7: ANALYZING DROPDOWN OPTIONS =====');
  const allOptions = dropdown.querySelectorAll('tp-yt-paper-item');
  console.log(`Found ${allOptions.length} tp-yt-paper-item elements`);

  console.log('\nALL OPTIONS WITH DETAILS:');
  allOptions.forEach((option, i) => {
    const testId = option.getAttribute('test-id');
    const text = option.textContent.substring(0, 50).trim().replace(/\n/g, ' ');
    const selected = option.getAttribute('aria-selected');
    console.log(`  ${i + 1}. test-id="${testId}" selected=${selected}`);
    console.log(`      Text: "${text}"`);
  });

  // ===== STEP 8: FIND CUSTOM OPTION (MULTIPLE STRATEGIES) =====
  console.log('\n===== STEP 8: FINDING CUSTOM OPTION =====');
  let customOption = null;

  // Strategy 1: test-id="fixed"
  console.log('Strategy 1: querySelector(\'tp-yt-paper-item[test-id="fixed"]\')');
  customOption = dropdown.querySelector('tp-yt-paper-item[test-id="fixed"]');
  console.log('  Found:', !!customOption);

  // Strategy 2: Search by text content
  if (!customOption) {
    console.log('Strategy 2: Searching by text content "Custom"');
    for (const option of allOptions) {
      const text = option.textContent.toLowerCase();
      if (text.includes('custom') || text.includes('fixed')) {
        customOption = option;
        console.log('  ✅ Found via text:', option.textContent.substring(0, 30).trim());
        break;
      }
    }
  }

  // Strategy 3: Look for specific test-ids that might mean custom
  if (!customOption) {
    console.log('Strategy 3: Looking for alternative test-ids');
    const alternativeIds = ['custom', 'custom_range', 'date_range', 'fixed_range'];
    for (const id of alternativeIds) {
      const opt = dropdown.querySelector(`tp-yt-paper-item[test-id="${id}"]`);
      if (opt) {
        customOption = opt;
        console.log(`  ✅ Found via test-id="${id}"`);
        break;
      }
    }
  }

  if (!customOption) {
    console.log('\n❌ CUSTOM OPTION NOT FOUND AFTER ALL STRATEGIES!');
    console.log('⚠️ This means the Audience Retention page might not have custom dates');
    console.log('⚠️ OR the selector has changed');
    return;
  }

  showElement('CUSTOM OPTION', customOption);

  // ===== STEP 9: CLICK CUSTOM OPTION =====
  console.log('\n===== STEP 9: CLICKING CUSTOM OPTION =====');
  customOption.click();
  await wait(1000);

  // ===== STEP 10: FIND DATE DIALOG =====
  console.log('\n===== STEP 10: FINDING DATE PICKER DIALOG =====');
  let dateDialog = document.querySelector('ytcp-date-period-picker');

  if (!dateDialog) {
    console.log('ytcp-date-period-picker not found, searching alternatives...');
    const alternativeSelectors = [
      'ytcp-date-picker',
      '[class*="date-picker"]',
      '[class*="date-period"]',
      'tp-yt-paper-dialog[aria-label*="date"]',
      'tp-yt-paper-dialog[aria-label*="Date"]'
    ];

    for (const selector of alternativeSelectors) {
      console.log(`  Trying: ${selector}`);
      const el = document.querySelector(selector);
      if (el) {
        dateDialog = el;
        console.log(`  ✅ Found via ${selector}`);
        break;
      }
    }
  }

  if (!dateDialog) {
    console.log('\n❌ DATE DIALOG NOT FOUND!');
    console.log('Searching for ANY visible dialogs:');
    const allDialogs = document.querySelectorAll('tp-yt-paper-dialog, [role="dialog"]');
    console.log(`  Found ${allDialogs.length} dialog elements`);
    allDialogs.forEach((dialog, i) => {
      const visible = dialog.offsetParent !== null || window.getComputedStyle(dialog).display !== 'none';
      console.log(`    ${i + 1}. ${dialog.tagName} visible: ${visible}`);
      if (visible) {
        console.log(`       aria-label: ${dialog.getAttribute('aria-label')}`);
        console.log(`       First 200 chars: ${dialog.textContent.substring(0, 200)}`);
      }
    });
    return;
  }

  showElement('DATE DIALOG', dateDialog);

  // ===== STEP 11: FIND INPUT FIELDS =====
  console.log('\n===== STEP 11: FINDING DATE INPUT FIELDS =====');

  console.log('Strategy 1: #start-date input and #end-date input');
  let startInput = dateDialog.querySelector('#start-date input');
  let endInput = dateDialog.querySelector('#end-date input');
  console.log('  Start input:', !!startInput);
  console.log('  End input:', !!endInput);

  if (!startInput || !endInput) {
    console.log('\nStrategy 2: Searching for any input[type="text"]');
    const allInputs = dateDialog.querySelectorAll('input[type="text"], input:not([type])');
    console.log(`  Found ${allInputs.length} text inputs`);
    allInputs.forEach((input, i) => {
      console.log(`    ${i + 1}. id="${input.id}" name="${input.name}" value="${input.value}"`);
    });

    if (allInputs.length >= 2) {
      startInput = allInputs[0];
      endInput = allInputs[1];
      console.log('  Using first two inputs as start/end');
    }
  }

  if (!startInput || !endInput) {
    console.log('\n❌ COULD NOT FIND INPUT FIELDS!');
    console.log('Date dialog HTML:', dateDialog.innerHTML);
    return;
  }

  console.log('\nCurrent input values:');
  console.log('  Start:', startInput.value);
  console.log('  End:', endInput.value);

  // ===== STEP 12: TEST DATE SETTING =====
  console.log('\n===== STEP 12: TESTING DATE INPUT =====');
  const testDates = {
    start: '01/10/2025',
    end: '07/10/2025'
  };

  console.log(`Testing with: ${testDates.start} to ${testDates.end}`);

  // Method: Full interaction sequence
  console.log('\nUsing full interaction sequence...');

  // Start date
  startInput.focus();
  startInput.click();
  await wait(50);
  startInput.value = '';
  startInput.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(50);
  startInput.value = testDates.start;
  startInput.dispatchEvent(new Event('input', { bubbles: true }));
  startInput.dispatchEvent(new Event('change', { bubbles: true }));
  startInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  startInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  startInput.blur();
  await wait(200);

  console.log('  After setting start:', startInput.value);

  // End date
  endInput.focus();
  endInput.click();
  await wait(50);
  endInput.value = '';
  endInput.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(50);
  endInput.value = testDates.end;
  endInput.dispatchEvent(new Event('input', { bubbles: true }));
  endInput.dispatchEvent(new Event('change', { bubbles: true }));
  endInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  endInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  endInput.blur();
  await wait(200);

  console.log('  After setting end:', endInput.value);

  // ===== STEP 13: CHECK APPLY BUTTON =====
  console.log('\n===== STEP 13: CHECKING APPLY BUTTON =====');
  const applyButton = dateDialog.querySelector('#apply-button');

  if (!applyButton) {
    console.log('❌ Apply button not found with #apply-button');
    console.log('Searching for any button with "apply" in text:');
    const allButtons = dateDialog.querySelectorAll('button, [role="button"]');
    allButtons.forEach((btn, i) => {
      const text = btn.textContent.toLowerCase().trim();
      console.log(`  ${i + 1}. "${text}" disabled: ${btn.disabled || btn.getAttribute('aria-disabled')}`);
    });
  } else {
    console.log('✅ Apply button found');
    console.log('  Disabled:', applyButton.disabled);
    console.log('  aria-disabled:', applyButton.getAttribute('aria-disabled'));
    console.log('  Text:', applyButton.textContent.trim());

    console.log('\nClicking Apply button...');
    applyButton.click();
    await wait(1500);
  }

  // ===== STEP 14: VERIFY RESULTS =====
  console.log('\n===== STEP 14: VERIFYING RESULTS =====');
  const sidebarAfter = document.querySelector('yta-explore-sidebar');
  if (sidebarAfter) {
    const triggerAfter = sidebarAfter.querySelector('ytcp-dropdown-trigger');
    if (triggerAfter) {
      const triggerText = triggerAfter.textContent;
      console.log('Date trigger now shows:', triggerText.substring(0, 100).trim());

      if (triggerText.includes('1') && triggerText.includes('7')) {
        console.log('✅ SUCCESS - Dates appear to be applied!');
      } else {
        console.log('❌ FAILED - Dates not reflected in sidebar');
      }
    }
  }

  // Check for any error messages
  const errors = dateDialog ? dateDialog.querySelectorAll('.error, [role="alert"]') : [];
  if (errors.length > 0) {
    console.log('\n⚠️ VALIDATION ERRORS FOUND:');
    errors.forEach((err, i) => {
      console.log(`  ${i + 1}. ${err.textContent.trim()}`);
    });
  }

  console.log('\n========================================');
  console.log('DEBUG COMPLETE - SEND ALL OUTPUT TO CLAUDE');
  console.log('========================================');

})();
