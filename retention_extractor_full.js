/**
 * YouTube Retention Extractor - Full Script
 *
 * Navigates from Advanced tab → Audience Retention → Extracts 30s/3s metric
 * Paste this into browser console on YouTube Studio Analytics page (any tab)
 */

(async function extractRetention() {
  console.log('========================================');
  console.log('Audience Retention Extractor');
  console.log('========================================\n');

  // Step 1: Find and click the Report dropdown
  console.log('1️⃣ Finding Report dropdown...');

  const reportTriggers = Array.from(document.querySelectorAll('ytcp-dropdown-trigger'));
  let reportDropdown = null;

  for (const trigger of reportTriggers) {
    const labelText = trigger.querySelector('.label-text');
    if (labelText && labelText.textContent.trim() === 'Report') {
      reportDropdown = trigger;
      break;
    }
  }

  if (!reportDropdown) {
    console.error('❌ Report dropdown not found. Are you on the Analytics page?');
    return null;
  }

  console.log('✅ Report dropdown found');
  reportDropdown.click();
  await new Promise(resolve => setTimeout(resolve, 500));

  // Step 2: Find and click "Audience retention" option
  console.log('\n2️⃣ Finding "Audience retention" option...');

  const menuItems = Array.from(document.querySelectorAll('tp-yt-paper-item'));
  let retentionOption = null;

  for (const item of menuItems) {
    const text = item.textContent;
    if (text.includes('Audience retention')) {
      retentionOption = item;
      break;
    }
  }

  if (!retentionOption) {
    console.error('❌ "Audience retention" option not found');
    return null;
  }

  console.log('✅ "Audience retention" option found');
  retentionOption.click();
  await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for page to load

  // Step 3: Find the SVG chart
  console.log('\n3️⃣ Waiting for chart to load...');

  let svg = null;
  let attempts = 0;
  const maxAttempts = 10;

  while (attempts < maxAttempts) {
    svg = document.querySelector('yta-line-chart-base svg');
    if (svg) break;
    await new Promise(resolve => setTimeout(resolve, 500));
    attempts++;
  }

  if (!svg) {
    console.error('❌ SVG chart not found after waiting');
    return null;
  }

  console.log('✅ Chart loaded');

  // Step 4: Extract path data
  console.log('\n4️⃣ Extracting retention data...');

  const pathElement = svg.querySelector('path.line-series');
  if (!pathElement) {
    console.error('❌ Path element not found');
    return null;
  }

  const pathData = pathElement.getAttribute('d');
  console.log(`✅ Path data extracted (${pathData.length} characters)`);

  // Step 5: Parse path into points
  const points = [];
  const commands = pathData.replace('M', 'L').split('L').filter(cmd => cmd.trim());

  commands.forEach(cmd => {
    const [x, y] = cmd.split(',').map(Number);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  });

  console.log(`✅ Parsed ${points.length} data points`);

  // Step 6: Extract chart dimensions
  console.log('\n5️⃣ Analyzing chart scale...');

  // Y-axis (retention percentage)
  const yAxisTicks = Array.from(svg.querySelectorAll('.y2.axis .tick text tspan'));
  const yAxisValues = yAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    return parseFloat(text.replace('%', ''));
  }).filter(val => !isNaN(val));

  const maxY = Math.max(...yAxisValues);
  const minY = Math.min(...yAxisValues);

  const yAxisTickElements = Array.from(svg.querySelectorAll('.y2.axis .tick'));
  const yPixels = yAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[2]) : null;
  }).filter(val => val !== null);

  const minYPixel = Math.min(...yPixels);
  const maxYPixel = Math.max(...yPixels);
  const chartHeight = maxYPixel - minYPixel;

  console.log(`   Y-axis: ${minY}% to ${maxY}%`);
  console.log(`   Y-pixels: ${minYPixel}px to ${maxYPixel}px (height: ${chartHeight}px)`);

  // X-axis (time)
  const xAxisTicks = Array.from(svg.querySelectorAll('.x.axis .tick text tspan'));
  const xAxisValues = xAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    const parts = text.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0);
  }).filter(val => !isNaN(val));

  const minTime = Math.min(...xAxisValues);
  const maxTime = Math.max(...xAxisValues);

  const xAxisTickElements = Array.from(svg.querySelectorAll('.x.axis .tick'));
  const xPixels = xAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[1]) : null;
  }).filter(val => val !== null);

  const minXPixel = Math.min(...xPixels);
  const maxXPixel = Math.max(...xPixels);
  const chartWidth = maxXPixel - minXPixel;

  console.log(`   X-axis: ${minTime}s to ${maxTime}s`);
  console.log(`   X-pixels: ${minXPixel}px to ${maxXPixel}px (width: ${chartWidth}px)`);

  // Step 7: Conversion functions
  const pixelToTime = (x) => {
    return minTime + (x - minXPixel) * (maxTime - minTime) / chartWidth;
  };

  const pixelToRetention = (y) => {
    const percentageRange = maxY - minY;
    return maxY - ((y - minYPixel) * percentageRange / chartHeight);
  };

  // Step 8: Get retention at specific time
  function getRetentionAtTime(targetSeconds) {
    const targetX = minXPixel + (targetSeconds - minTime) * chartWidth / (maxTime - minTime);

    let closest = points[0];
    let minDistance = Math.abs(points[0].x - targetX);

    for (const point of points) {
      const distance = Math.abs(point.x - targetX);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    const actualTime = pixelToTime(closest.x);
    const retention = pixelToRetention(closest.y);

    return {
      requestedTime: targetSeconds,
      actualTime: Math.round(actualTime * 10) / 10,
      retention: Math.round(retention * 10) / 10
    };
  }

  // Step 9: Determine video type and extract metric
  console.log('\n6️⃣ Extracting 30s/3s retention metric...');

  const isShort = maxTime < 60;
  const targetTime = isShort ? 3 : 30;

  console.log(`   Video duration: ${maxTime}s`);
  console.log(`   Video type: ${isShort ? 'SHORT' : 'LONG VIDEO'}`);
  console.log(`   Target: ${targetTime}s retention`);

  let result = null;

  if (targetTime <= maxTime) {
    result = getRetentionAtTime(targetTime);
    console.log(`\n📊 RESULT: ${result.retention}% retention at ${result.actualTime}s`);
  } else {
    console.log(`\n⚠️  Video too short (${maxTime}s), cannot measure ${targetTime}s retention`);
  }

  // Step 10: Navigate back to original report (optional)
  console.log('\n7️⃣ Navigation complete');
  console.log('   (Staying on Audience Retention page)');
  console.log('   To go back, click Report dropdown → Select your original report');

  console.log('\n========================================');
  console.log('✅ Extraction Complete!');
  console.log('========================================');

  if (result) {
    console.log(`\n📋 Copy this value: ${result.retention}%`);
    return {
      metric: `${targetTime}s retention`,
      value: `${result.retention}%`,
      actualTime: `${result.actualTime}s`,
      videoDuration: `${maxTime}s`,
      videoType: isShort ? 'SHORT' : 'LONG'
    };
  }

  return null;
})();
