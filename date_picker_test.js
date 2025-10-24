// YouTube Date Picker Test Script
// Paste this in the browser console on YouTube Studio Analytics page

(async function testDatePicker() {
  console.log('========================================');
  console.log('YouTube Date Picker Test Script');
  console.log('========================================\n');

  // Helper: Simulate typing into input
  async function setDateInput(input, value, label) {
    console.log(`  Setting ${label} to: "${value}"`);

    // Click and focus
    input.click();
    await new Promise(resolve => setTimeout(resolve, 100));
    input.focus();
    await new Promise(resolve => setTimeout(resolve, 100));

    // Select and clear
    input.select();
    await new Promise(resolve => setTimeout(resolve, 50));

    input.dispatchEvent(new KeyboardEvent('keydown', { key: 'Backspace', bubbles: true }));
    input.value = '';
    input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Backspace', bubbles: true }));
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 100));

    // Type each character
    for (let i = 0; i < value.length; i++) {
      const char = value[i];
      input.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }));
      input.value = value.substring(0, i + 1);
      input.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
      input.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }));
      await new Promise(resolve => setTimeout(resolve, 20));
    }

    await new Promise(resolve => setTimeout(resolve, 150));
    input.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));
    await new Promise(resolve => setTimeout(resolve, 100));
    input.blur();
    await new Promise(resolve => setTimeout(resolve, 150));

    console.log(`  ${label} field now shows: "${input.value}"`);

    // Check for validation errors (red border, error messages)
    const hasError = input.classList.contains('error') ||
                     input.classList.contains('invalid') ||
                     input.parentElement.classList.contains('error') ||
                     input.parentElement.classList.contains('invalid');

    if (hasError) {
      console.log(`  ⚠️ ${label} has validation error!`);
    }

    return input.value;
  }

  // Helper: Open date picker dialog
  async function openDatePicker() {
    console.log('\n📅 Opening date picker dialog...');

    const sidebar = document.querySelector('yta-explore-sidebar');
    if (!sidebar) {
      console.error('❌ Sidebar not found');
      return null;
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
      console.error('❌ Date trigger not found');
      return null;
    }

    dateTrigger.click();
    await new Promise(resolve => setTimeout(resolve, 500));

    const customOption = document.querySelector('tp-yt-paper-item[test-id="fixed"]');
    if (!customOption) {
      console.error('❌ Custom option not found');
      return null;
    }

    customOption.click();
    await new Promise(resolve => setTimeout(resolve, 800));

    const dateDialog = document.querySelector('ytcp-date-period-picker');
    if (!dateDialog) {
      console.error('❌ Date picker dialog not found');
      return null;
    }

    const startInput = dateDialog.querySelector('#start-date input');
    const endInput = dateDialog.querySelector('#end-date input');

    if (!startInput || !endInput) {
      console.error('❌ Input fields not found');
      return null;
    }

    console.log(`✅ Dialog opened`);
    console.log(`   Pre-filled START: "${startInput.value}"`);
    console.log(`   Pre-filled END: "${endInput.value}"`);

    return { dialog: dateDialog, startInput, endInput };
  }

  // Helper: Apply and check result
  async function applyAndCheck(dialog, expectedStart, expectedEnd) {
    console.log('\n🔘 Clicking Apply button...');

    const applyButton = dialog.querySelector('#apply-button');
    if (!applyButton) {
      console.error('❌ Apply button not found');
      return;
    }

    applyButton.click();
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check sidebar
    const sidebar = document.querySelector('yta-explore-sidebar');
    const triggers = sidebar.querySelectorAll('ytcp-dropdown-trigger');
    let currentDateText = '';

    for (const trigger of triggers) {
      const text = trigger.textContent;
      if (text.includes('–') || text.includes('Since') || text.includes('days')) {
        currentDateText = text.trim();
        break;
      }
    }

    console.log(`📊 Result:`);
    console.log(`   Expected: ${expectedStart} - ${expectedEnd}`);
    console.log(`   Sidebar shows: "${currentDateText}"`);

    const startDay = expectedStart.split('/')[0];
    const endDay = expectedEnd.split('/')[0];
    const hasStart = currentDateText.includes(startDay);
    const hasEnd = currentDateText.includes(endDay);

    if (hasStart && hasEnd) {
      console.log(`   ✅ SUCCESS - Both dates applied correctly!`);
    } else {
      console.log(`   ❌ FAILURE - Missing: ${!hasStart ? 'START' : ''} ${!hasEnd ? 'END' : ''}`);
    }

    // Close dialog
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', code: 'Escape', keyCode: 27, bubbles: true }));
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // ============================================================
  // TEST SCENARIOS
  // ============================================================

  console.log('\n\n🧪 TEST 1: Set START first, then END (12-15 Oct)');
  console.log('================================================');
  let result = await openDatePicker();
  if (result) {
    await setDateInput(result.startInput, '12/10/2025', 'START');
    await new Promise(resolve => setTimeout(resolve, 300));
    await setDateInput(result.endInput, '15/10/2025', 'END');
    await new Promise(resolve => setTimeout(resolve, 300));
    await applyAndCheck(result.dialog, '12/10/2025', '15/10/2025');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n\n🧪 TEST 2: Set END first, then START (16-20 Oct)');
  console.log('================================================');
  result = await openDatePicker();
  if (result) {
    await setDateInput(result.endInput, '20/10/2025', 'END');
    await new Promise(resolve => setTimeout(resolve, 300));
    await setDateInput(result.startInput, '16/10/2025', 'START');
    await new Promise(resolve => setTimeout(resolve, 300));
    await applyAndCheck(result.dialog, '16/10/2025', '20/10/2025');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n\n🧪 TEST 3: Set START first, then END (16-20 Oct) - Same dates as Test 2');
  console.log('================================================');
  result = await openDatePicker();
  if (result) {
    await setDateInput(result.startInput, '16/10/2025', 'START');
    await new Promise(resolve => setTimeout(resolve, 300));
    await setDateInput(result.endInput, '20/10/2025', 'END');
    await new Promise(resolve => setTimeout(resolve, 300));
    await applyAndCheck(result.dialog, '16/10/2025', '20/10/2025');
  }

  await new Promise(resolve => setTimeout(resolve, 2000));

  console.log('\n\n🧪 TEST 4: Clear both, set END first, then START (13-17 Oct)');
  console.log('================================================');
  result = await openDatePicker();
  if (result) {
    // Clear both first
    result.startInput.value = '';
    result.endInput.value = '';
    await new Promise(resolve => setTimeout(resolve, 200));

    await setDateInput(result.endInput, '17/10/2025', 'END');
    await new Promise(resolve => setTimeout(resolve, 300));
    await setDateInput(result.startInput, '13/10/2025', 'START');
    await new Promise(resolve => setTimeout(resolve, 300));
    await applyAndCheck(result.dialog, '13/10/2025', '17/10/2025');
  }

  console.log('\n\n========================================');
  console.log('✅ All tests complete!');
  console.log('========================================');
  console.log('\nAnalyze the results above to see:');
  console.log('- Which order works (START first vs END first)');
  console.log('- What values YouTube accepts/rejects');
  console.log('- If cached values interfere');
})();
