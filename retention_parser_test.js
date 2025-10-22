/**
 * YouTube Audience Retention SVG Parser - Test Script
 *
 * Paste this into browser console on YouTube Studio Audience Retention page
 */

(async function testRetentionParser() {
  console.log('========================================');
  console.log('Retention Parser Test');
  console.log('========================================\n');

  // Step 1: Find the SVG chart
  console.log('1️⃣ Finding Audience Retention chart...');

  // Look for the specific audience retention chart container
  const chartContainers = Array.from(document.querySelectorAll('yta-line-chart-base'));
  let svg = null;

  // First, try to find by checking parent structure
  for (const container of chartContainers) {
    const parent = container.closest('yta-explore-chart-with-player');
    if (parent) {
      // This is likely the audience retention chart
      svg = container.querySelector('svg');
      if (svg) {
        console.log('✅ Found audience retention chart (via parent structure)');
        break;
      }
    }
  }

  // Fallback: Find any line chart
  if (!svg) {
    svg = document.querySelector('yta-line-chart-base svg');
    if (svg) {
      console.log('⚠️  Found a chart (unable to confirm it\'s audience retention)');
    }
  }

  if (!svg) {
    console.error('❌ SVG chart not found. Make sure you are on the Audience Retention page.');
    console.error('   Navigate to: Report dropdown → "Audience retention"');
    return;
  }

  // Step 2: Extract the path data
  console.log('\n2️⃣ Extracting path data...');
  const pathElement = svg.querySelector('path.line-series');

  if (!pathElement) {
    console.error('❌ Path element not found');
    return;
  }

  const pathData = pathElement.getAttribute('d');
  console.log(`✅ Path data extracted (${pathData.length} characters)`);
  console.log(`   Preview: ${pathData.substring(0, 100)}...`);

  // Step 3: Parse path data into points
  console.log('\n3️⃣ Parsing path into coordinate points...');
  const points = [];

  // Remove 'M' command and split by 'L'
  const commands = pathData.replace('M', 'L').split('L').filter(cmd => cmd.trim());

  commands.forEach(cmd => {
    const [x, y] = cmd.split(',').map(Number);
    if (!isNaN(x) && !isNaN(y)) {
      points.push({ x, y });
    }
  });

  console.log(`✅ Parsed ${points.length} data points`);
  console.log(`   First point: (${points[0].x}, ${points[0].y})`);
  console.log(`   Last point: (${points[points.length - 1].x}, ${points[points.length - 1].y})`);

  // Step 4: Extract chart dimensions from axes
  console.log('\n4️⃣ Extracting chart dimensions...');

  // Get Y-axis scale (retention percentage)
  const yAxisTicks = Array.from(svg.querySelectorAll('.y2.axis .tick text tspan'));
  const yAxisValues = yAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    return parseFloat(text.replace('%', ''));
  }).filter(val => !isNaN(val));

  const maxY = Math.max(...yAxisValues);
  const minY = Math.min(...yAxisValues);

  // Get Y-axis pixel range
  const yAxisTickElements = Array.from(svg.querySelectorAll('.y2.axis .tick'));
  const yPixels = yAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[2]) : null;
  }).filter(val => val !== null);

  const minYPixel = Math.min(...yPixels);
  const maxYPixel = Math.max(...yPixels);
  const chartHeight = maxYPixel - minYPixel;

  console.log(`✅ Y-axis scale: ${minY}% to ${maxY}%`);
  console.log(`   Y-axis pixels: ${minYPixel}px to ${maxYPixel}px`);
  console.log(`   Chart height: ${chartHeight}px`);

  // Validate: Retention should be 0-150% max
  if (maxY > 150) {
    console.error(`\n❌ ERROR: Y-axis shows ${maxY}%, which is too high for retention!`);
    console.error(`   This doesn't look like an audience retention chart.`);
    console.error(`   Please navigate to: Report dropdown → "Audience retention"`);
    console.error(`   Current page might be showing: Views, Watch time, or other metrics`);
    return;
  }

  // Get X-axis scale (time)
  const xAxisTicks = Array.from(svg.querySelectorAll('.x.axis .tick text tspan'));
  const xAxisValues = xAxisTicks.map(tick => {
    const text = tick.textContent.trim();
    const parts = text.split(':').map(Number);
    return parts[0] * 60 + (parts[1] || 0); // Convert to seconds
  }).filter(val => !isNaN(val));

  const minTime = Math.min(...xAxisValues);
  const maxTime = Math.max(...xAxisValues);

  // Get X-axis pixel range
  const xAxisTickElements = Array.from(svg.querySelectorAll('.x.axis .tick'));
  const xPixels = xAxisTickElements.map(tick => {
    const transform = tick.getAttribute('transform');
    const match = transform.match(/translate\(([^,]+),([^)]+)\)/);
    return match ? parseFloat(match[1]) : null;
  }).filter(val => val !== null);

  const minXPixel = Math.min(...xPixels);
  const maxXPixel = Math.max(...xPixels);
  const chartWidth = maxXPixel - minXPixel;

  console.log(`✅ X-axis scale: ${minTime}s to ${maxTime}s (${maxTime}s total)`);
  console.log(`   X-axis pixels: ${minXPixel}px to ${maxXPixel}px`);
  console.log(`   Chart width: ${chartWidth}px`);

  // Validate: Video duration should be reasonable
  if (maxTime > 7200) { // 2 hours
    console.error(`\n❌ ERROR: Video duration shows ${maxTime}s (${Math.floor(maxTime/60)} minutes)!`);
    console.error(`   This is too long - might be reading wrong chart or wrong time scale.`);
    console.error(`   Please navigate to: Report dropdown → "Audience retention"`);
    return;
  }

  if (maxTime < 1) {
    console.error(`\n❌ ERROR: Video duration shows ${maxTime}s!`);
    console.error(`   This is too short - X-axis might not be parsed correctly.`);
    console.error(`   X-axis tick labels found: ${xAxisTicks.map(t => t.textContent.trim()).join(', ')}`);
    return;
  }

  // Step 5: Create conversion functions
  console.log('\n5️⃣ Creating coordinate conversion functions...');

  const pixelToTime = (x) => {
    return minTime + (x - minXPixel) * (maxTime - minTime) / chartWidth;
  };

  const pixelToRetention = (y) => {
    // Y-axis is inverted (0% at bottom, max% at top)
    const percentageRange = maxY - minY;
    return maxY - ((y - minYPixel) * percentageRange / chartHeight);
  };

  console.log('✅ Conversion functions created');

  // Step 6: Function to get retention at specific time
  console.log('\n6️⃣ Creating retention lookup function...');

  function getRetentionAtTime(targetSeconds) {
    // Convert target time to X pixel position
    const targetX = minXPixel + (targetSeconds - minTime) * chartWidth / (maxTime - minTime);

    // Find closest point
    let closest = points[0];
    let minDistance = Math.abs(points[0].x - targetX);

    for (const point of points) {
      const distance = Math.abs(point.x - targetX);
      if (distance < minDistance) {
        minDistance = distance;
        closest = point;
      }
    }

    // Convert to actual values
    const actualTime = pixelToTime(closest.x);
    const retention = pixelToRetention(closest.y);

    return {
      requestedTime: targetSeconds,
      actualTime: Math.round(actualTime * 10) / 10,
      retention: Math.round(retention * 10) / 10,
      pixelCoords: { x: closest.x, y: closest.y }
    };
  }

  console.log('✅ Lookup function created');

  // Step 7: Test with various timestamps
  console.log('\n7️⃣ Testing retention at key timestamps...');
  console.log('================================================');

  const testTimes = [3, 5, 10, 15, 20, 30];

  testTimes.forEach(time => {
    if (time <= maxTime) {
      const result = getRetentionAtTime(time);
      console.log(`⏱️  ${time}s → ${result.retention}% (actual time: ${result.actualTime}s)`);
    }
  });

  // Step 8: Determine video type and get appropriate metric
  console.log('\n8️⃣ Extracting 30s/3s metric...');
  console.log('================================================');

  const isShort = maxTime < 60;
  const targetTime = isShort ? 3 : 30;

  console.log(`Video duration: ${maxTime}s`);
  console.log(`Video type: ${isShort ? 'SHORT' : 'LONG VIDEO'}`);
  console.log(`Target metric: ${targetTime}s retention`);

  if (targetTime <= maxTime) {
    const result = getRetentionAtTime(targetTime);
    console.log(`\n📊 RESULT: ${result.retention}% retention at ${result.actualTime}s`);
    console.log(`   (Requested: ${targetTime}s, Actual: ${result.actualTime}s)`);
  } else {
    console.log(`\n⚠️  WARNING: Video is only ${maxTime}s long, cannot measure ${targetTime}s retention`);
  }

  // Step 9: Return data for further use
  console.log('\n9️⃣ Exporting results...');

  const exportData = {
    videoDuration: maxTime,
    isShort: isShort,
    targetTime: targetTime,
    retention: targetTime <= maxTime ? getRetentionAtTime(targetTime).retention : null,
    allPoints: points.map(p => ({
      time: Math.round(pixelToTime(p.x) * 10) / 10,
      retention: Math.round(pixelToRetention(p.y) * 10) / 10
    }))
  };

  console.log('✅ Data exported to window.retentionData');
  console.log('\nYou can access:');
  console.log('- window.retentionData.retention → 30s/3s retention %');
  console.log('- window.retentionData.allPoints → All retention data points');

  window.retentionData = exportData;

  console.log('\n========================================');
  console.log('✅ Test Complete!');
  console.log('========================================');

  return exportData;
})();
