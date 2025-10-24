/**
 * STANDALONE DATE CHANGER FOR AUDIENCE RETENTION
 * Keep running this until it works!
 *
 * Instructions:
 * 1. Navigate to Audience Retention tab manually
 * 2. Open console (F12)
 * 3. Paste this script
 * 4. It will try EVERY possible method to set dates
 */

(async function fixRetentionDates() {
  console.log('========================================');
  console.log('RETENTION DATE FIXER - TRYING EVERYTHING');
  console.log('========================================\n');

  const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // Target dates
  const START_DATE = '06/10/2025';
  const END_DATE = '13/10/2025';

  console.log(`Target: ${START_DATE} to ${END_DATE}\n`);

  // Get sidebar date
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

  console.log('STEP 1: Current sidebar date');
  console.log(`  ${getSidebarDate()}\n`);

  // STEP 2: Find and click date trigger
  console.log('STEP 2: Finding date trigger...');
  const sidebar = document.querySelector('yta-explore-sidebar');
  if (!sidebar) {
    console.error('❌ Sidebar not found!');
    return;
  }

  const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
  let dateTrigger = null;
  for (const trigger of triggers) {
    const text = trigger.textContent;
    if (text.includes('–') || text.includes('Since') || text.includes('days')) {
      dateTrigger = trigger;
      break;
    }
  }

  if (!dateTrigger) {
    console.error('❌ Date trigger not found!');
    return;
  }

  console.log('✅ Date trigger found');

  // Close existing dropdowns
  const existingDropdown = document.querySelector('tp-yt-paper-listbox[role="listbox"]');
  if (existingDropdown && existingDropdown.offsetParent !== null) {
    console.log('  Closing existing dropdown...');
    document.body.click();
    await wait(300);
  }

  // Click to open dropdown
  console.log('  Clicking to open dropdown...');
  dateTrigger.scrollIntoView({ behavior: 'instant', block: 'center' });
  await wait(100);
  dateTrigger.focus();
  await wait(50);
  dateTrigger.click();
  await wait(500);

  // STEP 3: Find visible dropdown
  console.log('\nSTEP 3: Finding visible dropdown...');
  let visibleDropdown = null;
  for (let i = 0; i < 10; i++) {
    const dropdowns = document.querySelectorAll('tp-yt-paper-listbox[role="listbox"]');
    for (const dd of dropdowns) {
      if (dd.offsetParent !== null) {
        visibleDropdown = dd;
        console.log(`✅ Visible dropdown found after ${i * 100}ms`);
        break;
      }
    }
    if (visibleDropdown) break;
    await wait(100);
  }

  if (!visibleDropdown) {
    console.error('❌ No visible dropdown appeared!');
    return;
  }

  // STEP 4: Click Custom option
  console.log('\nSTEP 4: Finding Custom option...');
  const customOption = visibleDropdown.querySelector('tp-yt-paper-item[test-id="fixed"]');
  if (!customOption) {
    const allOptions = visibleDropdown.querySelectorAll('tp-yt-paper-item');
    console.error(`❌ Custom option not found. Found ${allOptions.length} options`);
    return;
  }

  console.log('✅ Custom option found, clicking...');
  customOption.click();
  await wait(1000);

  // STEP 5: Find date dialog
  console.log('\nSTEP 5: Finding date dialog...');
  const dateDialog = document.querySelector('ytcp-date-period-picker');
  if (!dateDialog) {
    console.error('❌ Date dialog not found!');
    return;
  }

  console.log('✅ Date dialog found');

  // STEP 6: Find inputs
  console.log('\nSTEP 6: Finding date inputs...');
  const startInput = dateDialog.querySelector('#start-date input');
  const endInput = dateDialog.querySelector('#end-date input');

  if (!startInput || !endInput) {
    console.error('❌ Date inputs not found!');
    return;
  }

  console.log('✅ Date inputs found');
  console.log(`  Current values: "${startInput.value}" to "${endInput.value}"`);

  // STEP 7: Try MULTIPLE methods to set dates
  console.log('\nSTEP 7: Setting dates - trying ALL methods...\n');

  // METHOD 1: Direct value assignment with events
  console.log('METHOD 1: Direct assignment + events');
  startInput.focus();
  startInput.click();
  await wait(50);
  startInput.value = '';
  startInput.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(50);
  startInput.value = START_DATE;
  startInput.dispatchEvent(new Event('input', { bubbles: true }));
  startInput.dispatchEvent(new Event('change', { bubbles: true }));
  startInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  startInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  startInput.blur();
  await wait(200);

  endInput.focus();
  endInput.click();
  await wait(50);
  endInput.value = '';
  endInput.dispatchEvent(new Event('input', { bubbles: true }));
  await wait(50);
  endInput.value = END_DATE;
  endInput.dispatchEvent(new Event('input', { bubbles: true }));
  endInput.dispatchEvent(new Event('change', { bubbles: true }));
  endInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
  endInput.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter', bubbles: true }));
  endInput.blur();
  await wait(500);

  console.log(`  After METHOD 1: "${startInput.value}" to "${endInput.value}"`);

  // Check if values stuck
  if (startInput.value !== START_DATE || endInput.value !== END_DATE) {
    console.log('  ⚠️ Values didn\'t stick, trying METHOD 2...\n');

    // METHOD 2: Native setter
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;

    startInput.focus();
    await wait(50);
    nativeInputValueSetter.call(startInput, START_DATE);
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    startInput.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(200);

    endInput.focus();
    await wait(50);
    nativeInputValueSetter.call(endInput, END_DATE);
    endInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
    await wait(500);

    console.log(`  After METHOD 2: "${startInput.value}" to "${endInput.value}"`);
  }

  // STEP 8: Check Apply button
  console.log('\nSTEP 8: Checking Apply button...');
  const applyButton = dateDialog.querySelector('#apply-button');
  if (!applyButton) {
    console.error('❌ Apply button not found!');
    return;
  }

  console.log('✅ Apply button found');
  console.log(`  Disabled: ${applyButton.disabled || applyButton.getAttribute('aria-disabled')}`);

  // Check for validation errors
  const errors = dateDialog.querySelectorAll('.error, [role="alert"], .validation-error');
  if (errors.length > 0) {
    console.log('  ⚠️ VALIDATION ERRORS:');
    errors.forEach((err, i) => {
      console.log(`    ${i + 1}. ${err.textContent.trim()}`);
    });
  }

  // STEP 9: Click Apply with ALL methods
  console.log('\nSTEP 9: Clicking Apply button (all methods)...');
  const beforeSidebar = getSidebarDate();
  console.log(`  Sidebar BEFORE: "${beforeSidebar}"`);

  // Method 1: Regular click
  applyButton.focus();
  await wait(100);
  applyButton.click();
  console.log('  ✓ Regular click()');

  // Method 2: MouseEvent
  await wait(100);
  applyButton.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
  console.log('  ✓ MouseEvent click');

  // Method 3: Click inner button if exists
  const innerButton = applyButton.querySelector('button');
  if (innerButton) {
    await wait(100);
    innerButton.click();
    console.log('  ✓ Inner button click');
  }

  // STEP 10: Wait for changes
  console.log('\nSTEP 10: Waiting for changes...');

  // Wait for dialog to close
  console.log('  Waiting for dialog to close...');
  for (let i = 0; i < 50; i++) {
    await wait(100);
    const dialog = document.querySelector('ytcp-date-period-picker');
    if (!dialog || dialog.offsetParent === null) {
      console.log(`  ✅ Dialog closed after ${(i + 1) * 100}ms`);
      break;
    }
  }

  // Wait for sidebar to update
  console.log('  Waiting for sidebar to update...');
  let updated = false;
  for (let i = 0; i < 50; i++) {
    await wait(200);
    const currentSidebar = getSidebarDate();
    if (currentSidebar !== beforeSidebar) {
      console.log(`  ✅ Sidebar UPDATED after ${(i + 1) * 200}ms`);
      console.log(`  NEW: "${currentSidebar}"`);
      updated = true;
      break;
    }
  }

  if (!updated) {
    console.log(`  ❌ Sidebar did NOT update after 10 seconds`);
    console.log(`  Still shows: "${getSidebarDate()}"`);
  }

  // FINAL CHECK
  console.log('\n========================================');
  console.log('FINAL RESULT:');
  console.log('========================================');
  const finalSidebar = getSidebarDate();
  console.log(`Sidebar: "${finalSidebar}"`);

  if (finalSidebar.includes('6') && finalSidebar.includes('13')) {
    console.log('✅✅✅ SUCCESS! Dates applied correctly!');
  } else {
    console.log('❌❌❌ FAILED! Dates were not applied.');
    console.log('\nDEBUG INFO:');
    console.log('  Dialog still open?', !!document.querySelector('ytcp-date-period-picker'));
    console.log('  Input values:', startInput?.value, endInput?.value);
  }

})();
