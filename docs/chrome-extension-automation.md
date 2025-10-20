# Chrome Extension for YouTube Studio Automation

## 🎯 Problem Statement

**Current Situation:**
- Team has YouTube Studio login access (account privileges)
- NO YouTube Analytics API OAuth setup
- Manual process: Ipsita changes date filters in YouTube Studio to compare PRE/POST treatment metrics

**Goal:**
Build a Chrome extension that:
1. Automatically calculates PRE/POST date ranges from treatment date
2. Automates clicking/filtering in YouTube Studio
3. Extracts metrics from the page
4. Displays comparison (PRE vs POST)

---

## 📊 Solution Approaches

### Approach 1: Chrome Extension (Recommended)
**Pros:**
- ✅ Uses existing login (no OAuth needed)
- ✅ Works in browser where user is already logged in
- ✅ Can manipulate YouTube Studio DOM directly
- ✅ Can inject custom UI/buttons

**Cons:**
- ⚠️ YouTube Studio uses Shadow DOM (complex)
- ⚠️ May break if YouTube updates UI
- ⚠️ Needs to handle async loading

### Approach 2: Puppeteer/Playwright (Server-side)
**Pros:**
- ✅ Can run headless/scheduled
- ✅ Full browser control
- ✅ Can handle complex interactions

**Cons:**
- ❌ Needs to handle Google login (2FA issues)
- ❌ More complex setup
- ❌ Requires server/computer running 24/7

---

## 🔍 Existing Solutions Found

### Commercial Extensions (Inspiration)

#### 1. **vidIQ Vision**
- **Link**: https://vidiq.com/extension/
- **What it does**:
  - Enhances YouTube Studio with analytics overlay
  - Tracks views per hour in real-time
  - Shows average watch time
  - Generates titles, keywords, thumbnail ideas
- **Relevant for us**: Shows how to inject analytics UI into YouTube Studio
- **Chrome Store**: https://chrome.google.com/webstore/detail/pachckjkecffpdphbpmfolblodfkgbhl

#### 2. **TubeBuddy**
- **Link**: https://www.tubebuddy.com/
- **What it does**:
  - Video optimization tools inside YouTube Studio
  - SEO tips and automation
  - Productivity tools for repetitive tasks
- **Relevant for us**: Demonstrates automating YouTube Studio workflows
- **Chrome Store**: Available on Chrome Web Store

#### 3. **ViewStats**
- **Link**: https://chromewebstore.google.com/detail/licaccaeplhkahfkoighjblahbnafadl
- **What it does**:
  - Grabs analytics from YouTube Studio automatically
  - Tracks A/B testing results
  - Provides deep insights into video metrics
- **Relevant for us**: Shows how to extract metrics from YouTube Studio

#### 4. **Nexlev**
- **Link**: https://www.nexlev.io/nexlev-chrome-extension-guide
- **What it does**:
  - Analyzes channel analytics from YouTube
  - Finds metrics like revenue, demographics, views per hour
  - Tracks video outliers
- **Relevant for us**: Demonstrates scraping analytics data from YouTube pages

---

## 💻 Open-Source Projects & Code Examples

### Chrome Extension Frameworks

#### 1. **Automa - Browser Automation Extension**
- **GitHub**: https://github.com/AutomaApp/automa
- **Stars**: 11k+
- **What it does**:
  - Visual workflow builder for browser automation
  - Auto-fill forms, click buttons, scrape data
  - Schedule automation execution
  - Block-based programming (no-code)
- **Why useful**:
  - ✅ Shows how to build complex automation workflows
  - ✅ Has date/time handling
  - ✅ Visual workflow builder we can learn from
  - ✅ Handles form filling and clicking
- **Code to study**:
  - Content script injection
  - Workflow execution engine
  - DOM manipulation patterns

#### 2. **Basic Chrome Extension - DOM Manipulation**
- **GitHub**: https://github.com/matthova/basic_chrome_extension
- **What it does**:
  - Simple example of triggering DOM manipulation via click events
  - Shows basics of content scripts and background scripts
- **Why useful**:
  - ✅ Clean, minimal example
  - ✅ Good starter template
  - ✅ Shows event handling

### Form Automation Extensions

#### 3. **Testofill - Form Filler**
- **GitHub**: https://github.com/holyjak/Testofill-chrome-extension
- **What it does**:
  - Auto-fills forms with predefined/generated values
  - Uses CSS3 selectors to find fields
  - Supports multiple value sets
  - Can create rules from filled forms automatically
- **Why useful**:
  - ✅ Shows how to find and populate form fields
  - ✅ CSS selector strategies
  - ✅ Date field handling

#### 4. **Form-O-Fill - Programmable Form Filler**
- **GitHub**: https://github.com/form-o-fill/form-o-fill-chrome-extension
- **What it does**:
  - JavaScript-powered form filler
  - Developer-focused
  - Programmable rules
- **Why useful**:
  - ✅ Shows JavaScript-based automation
  - ✅ Rule engine architecture

#### 5. **Deep Autofill**
- **GitHub**: https://github.com/s-a/deep-autofill-chrome-extension
- **What it does**:
  - Smart form filling
  - Deep DOM traversal
- **Why useful**:
  - ✅ Handles complex nested forms
  - ✅ Shadow DOM handling

### YouTube-Specific Scrapers

#### 6. **YouTube Transcript Scraper**
- **GitHub**: https://github.com/evmlionel/youtube-transcript-scraper
- **What it does**:
  - Extracts and formats transcripts from YouTube videos
  - Vanilla JavaScript
  - Manifest V3
- **Why useful**:
  - ✅ Shows how to work with YouTube's DOM
  - ✅ Manifest V3 example
  - ✅ Content script injection

#### 7. **YouTube Scraper (General)**
- **GitHub**: https://github.com/hridaydutta123/the-youtube-scraper
- **What it does**:
  - Scrapes video descriptions and comments without API
  - Works on public YouTube pages
- **Why useful**:
  - ✅ Shows YouTube-specific scraping techniques
  - ✅ No API required approach

---

## 🛠️ Technical Implementation Guides

### Official Chrome Extension Documentation

#### **Content Scripts**
- **Official Docs**: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- **What it covers**:
  - How content scripts work
  - Injection methods (static, dynamic, programmatic)
  - Communication with extension
  - DOM access and manipulation
  - Isolated worlds

**Key concepts:**
```javascript
// Content scripts run in context of web pages
// Can read and modify page DOM
// Share DOM access with page, but isolated JavaScript environment
```

#### **Message Passing**
- **Docs**: https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- **What it covers**:
  - Communication between content scripts and background scripts
  - One-time messages
  - Long-lived connections
  - Cross-extension messaging

### Stack Overflow Solutions

#### **Automatic Button Clicking**
- **Link**: https://stackoverflow.com/questions/11387615/how-can-i-make-a-chrome-extension-automatically-click-a-button-when-a-page-loads
- **Solution**:
```javascript
// In content script
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('myButton').click();
});
```

#### **Form Automation**
- **Link**: https://stackoverflow.com/questions/26519959/chrome-automation-using-an-extension-clicking-buttons-and-filling-forms
- **Solution**:
```javascript
// Fill form fields
document.getElementById('fieldId').value = 'value';
// Trigger events so site knows field changed
element.dispatchEvent(new Event('input', { bubbles: true }));
element.dispatchEvent(new Event('change', { bubbles: true }));
```

#### **Triggering Click Events**
- **Link**: https://stackoverflow.com/questions/17819344/triggering-a-click-event-from-content-script-chrome-extension
- **Solution**:
```javascript
// Use raw DOM click
document.querySelector('.button').click();

// Or dispatch event
const clickEvent = new MouseEvent('click', {
    view: window,
    bubbles: true,
    cancelable: true
});
element.dispatchEvent(clickEvent);
```

---

## 🔧 Puppeteer Approach (Alternative)

### YouTube Studio Automation with Puppeteer

#### **Key Challenge: Shadow DOM**
- **Stack Overflow**: https://stackoverflow.com/questions/70880212/how-to-use-puppeteer-with-youtube-youtube-studio
- **Problem**: YouTube Studio uses Polymer with custom tags and Shadow DOM
- **Solution**: Use `pierce/` handler for querying within shadow roots

```javascript
// Query inside Shadow DOM
await page.waitForSelector('pierce/.custom-element');
```

#### **Login Automation**
- **Guide**: https://scrapeops.io/puppeteer-web-scraping-playbook/nodejs-puppeteer-logging-into-websites/
- **Challenge**: Google login with 2FA is difficult
- **Workaround**:
  - Use cookies from existing session
  - Run in non-headless mode with user login

#### **YouTube Scraping Tutorial**
- **Link**: https://incolumitas.com/2018/10/29/youtube-puppeteer-scraping/
- **Covers**:
  - Navigating YouTube pages
  - Waiting for dynamic content
  - Extracting data from loaded page

**Example code:**
```javascript
const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  // Navigate to YouTube Studio
  await page.goto('https://studio.youtube.com');

  // Wait for login (manual or cookie-based)
  await page.waitForSelector('.analytics-section');

  // Click date filter
  await page.click('.date-filter-button');

  // Select custom date range
  await page.type('.start-date-input', '2024-01-01');
  await page.type('.end-date-input', '2024-01-31');

  // Wait for metrics to load
  await page.waitForSelector('.metrics-loaded');

  // Extract metrics
  const metrics = await page.evaluate(() => {
    return {
      views: document.querySelector('.views-count').innerText,
      watchTime: document.querySelector('.watch-time').innerText
    };
  });

  console.log(metrics);
  await browser.close();
})();
```

---

## 🎯 Recommended Implementation Strategy

### Phase 1: Research & Setup (1-2 days)

**Tasks:**
1. ✅ Study Automa extension architecture
2. ✅ Review vidIQ/TubeBuddy to understand UI injection
3. ✅ Test basic Chrome extension with content script
4. ✅ Inspect YouTube Studio DOM structure

**Tools to install:**
- Chrome DevTools (inspect Shadow DOM)
- Automa extension (study workflow)
- vidIQ (see how they inject UI)

### Phase 2: Proof of Concept (2-3 days)

**Build minimal extension that:**
1. Injects a button into YouTube Studio Analytics page
2. When clicked, reads current metrics from page
3. Logs to console

**Key files:**
```
my-extension/
├── manifest.json          # Extension config
├── content.js            # Runs on YouTube Studio pages
├── background.js         # Background service worker
├── popup.html            # Extension popup UI
└── popup.js              # Popup logic
```

### Phase 3: Core Functionality (3-5 days)

**Implement:**
1. Treatment date input (in extension popup)
2. Calculate PRE/POST date ranges
3. Automate date filter changes in YouTube Studio
4. Extract metrics for both periods
5. Display comparison

### Phase 4: Polish & Test (2-3 days)

**Add:**
1. Error handling
2. Loading states
3. Export to CSV/Google Sheets
4. Multiple video support

---

## 📝 Code Templates

### manifest.json (Manifest V3)

```json
{
  "manifest_version": 3,
  "name": "YouTube Treatment Comparison",
  "version": "1.0.0",
  "description": "Compare YouTube metrics PRE/POST treatment",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "https://studio.youtube.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_icon": {
      "16": "icon16.png",
      "48": "icon48.png",
      "128": "icon128.png"
    }
  },
  "content_scripts": [
    {
      "matches": ["https://studio.youtube.com/*"],
      "js": ["content.js"],
      "run_at": "document_idle"
    }
  ],
  "background": {
    "service_worker": "background.js"
  }
}
```

### content.js (Inject button and automate)

```javascript
// content.js - Runs on YouTube Studio pages

console.log('YouTube Treatment Extension loaded');

// Wait for page to fully load
window.addEventListener('load', function() {
  injectComparisonButton();
});

function injectComparisonButton() {
  // Find suitable location in YouTube Studio UI
  const targetElement = document.querySelector('.ytcp-header-bar');

  if (!targetElement) {
    console.log('Target element not found, retrying...');
    setTimeout(injectComparisonButton, 1000);
    return;
  }

  // Create button
  const button = document.createElement('button');
  button.id = 'treatment-comparison-btn';
  button.textContent = 'Compare Treatment';
  button.style.cssText = `
    background: #ff0000;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    margin-left: 16px;
  `;

  button.addEventListener('click', runComparison);
  targetElement.appendChild(button);
}

async function runComparison() {
  // Get treatment date from storage or prompt
  const treatmentDate = prompt('Enter treatment date (YYYY-MM-DD):');

  if (!treatmentDate) return;

  console.log('Running comparison for treatment date:', treatmentDate);

  // Calculate date ranges
  const { preStart, preEnd, postStart, postEnd } = calculateDateRanges(treatmentDate);

  console.log('PRE:', preStart, 'to', preEnd);
  console.log('POST:', postStart, 'to', postEnd);

  // Fetch PRE period metrics
  const preMetrics = await fetchMetricsForPeriod(preStart, preEnd);

  // Fetch POST period metrics
  const postMetrics = await fetchMetricsForPeriod(postStart, postEnd);

  // Display comparison
  displayComparison(preMetrics, postMetrics);
}

function calculateDateRanges(treatmentDate) {
  const treatment = new Date(treatmentDate);
  const today = new Date();

  // Calculate days since treatment
  const daysSince = Math.floor((today - treatment) / (1000 * 60 * 60 * 24));

  // PRE period: same number of days before treatment
  const preStart = new Date(treatment);
  preStart.setDate(preStart.getDate() - daysSince);

  const preEnd = new Date(treatment);

  // POST period: treatment + 1 day to today
  const postStart = new Date(treatment);
  postStart.setDate(postStart.getDate() + 1);

  const postEnd = today;

  return {
    preStart: formatDate(preStart),
    preEnd: formatDate(preEnd),
    postStart: formatDate(postStart),
    postEnd: formatDate(postEnd)
  };
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

async function fetchMetricsForPeriod(startDate, endDate) {
  // This is the complex part - need to:
  // 1. Click date filter
  // 2. Set start/end dates
  // 3. Wait for metrics to load
  // 4. Extract metrics from page

  // Click date range picker
  const dateButton = document.querySelector('[aria-label*="date"]');
  if (dateButton) dateButton.click();

  await wait(500);

  // Set custom dates (depends on YouTube Studio's date picker implementation)
  // This is pseudo-code - actual selectors need to be discovered
  const startInput = document.querySelector('.start-date-input');
  const endInput = document.querySelector('.end-date-input');

  if (startInput && endInput) {
    startInput.value = startDate;
    endInput.value = endDate;

    // Trigger change events
    startInput.dispatchEvent(new Event('input', { bubbles: true }));
    endInput.dispatchEvent(new Event('change', { bubbles: true }));
  }

  // Wait for metrics to reload
  await wait(2000);

  // Extract metrics from page
  const metrics = {
    views: extractMetric('.views-metric'),
    watchTime: extractMetric('.watch-time-metric'),
    likes: extractMetric('.likes-metric')
  };

  return metrics;
}

function extractMetric(selector) {
  const element = document.querySelector(selector);
  return element ? element.innerText.trim() : 'N/A';
}

function displayComparison(preMetrics, postMetrics) {
  const html = `
    <div id="treatment-comparison-modal" style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 24px;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      min-width: 400px;
    ">
      <h2>Treatment Comparison</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <th>Metric</th>
          <th>PRE</th>
          <th>POST</th>
          <th>Change</th>
        </tr>
        <tr>
          <td>Views</td>
          <td>${preMetrics.views}</td>
          <td>${postMetrics.views}</td>
          <td>${calculateChange(preMetrics.views, postMetrics.views)}</td>
        </tr>
        <tr>
          <td>Watch Time</td>
          <td>${preMetrics.watchTime}</td>
          <td>${postMetrics.watchTime}</td>
          <td>${calculateChange(preMetrics.watchTime, postMetrics.watchTime)}</td>
        </tr>
      </table>
      <button onclick="document.getElementById('treatment-comparison-modal').remove()"
        style="margin-top: 16px; padding: 8px 16px;">
        Close
      </button>
    </div>
  `;

  document.body.insertAdjacentHTML('beforeend', html);
}

function calculateChange(preValue, postValue) {
  const pre = parseFloat(preValue.replace(/[^0-9.]/g, ''));
  const post = parseFloat(postValue.replace(/[^0-9.]/g, ''));
  const change = ((post - pre) / pre * 100).toFixed(1);
  return `${change > 0 ? '+' : ''}${change}%`;
}

function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

### popup.html (Extension popup UI)

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      width: 300px;
      padding: 16px;
      font-family: Arial, sans-serif;
    }
    input {
      width: 100%;
      padding: 8px;
      margin: 8px 0;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    button {
      width: 100%;
      padding: 10px;
      background: #ff0000;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: #cc0000;
    }
  </style>
</head>
<body>
  <h3>YouTube Treatment Comparison</h3>
  <label>Treatment Date:</label>
  <input type="date" id="treatmentDate">
  <button id="runComparison">Run Comparison</button>
  <div id="status"></div>

  <script src="popup.js"></script>
</body>
</html>
```

### popup.js (Popup logic)

```javascript
// popup.js

document.getElementById('runComparison').addEventListener('click', async () => {
  const treatmentDate = document.getElementById('treatmentDate').value;

  if (!treatmentDate) {
    alert('Please select a treatment date');
    return;
  }

  // Send message to content script
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  chrome.tabs.sendMessage(tab.id, {
    action: 'runComparison',
    treatmentDate: treatmentDate
  }, (response) => {
    if (response && response.success) {
      document.getElementById('status').textContent = 'Comparison complete!';
    } else {
      document.getElementById('status').textContent = 'Error running comparison';
    }
  });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'comparisonResult') {
    console.log('Comparison result:', request.data);
    sendResponse({ received: true });
  }
});
```

---

## ⚠️ Important Considerations

### 1. **YouTube Studio DOM Changes**
- YouTube frequently updates their UI
- Selectors may break
- Need to maintain and update extension

### 2. **Shadow DOM Complexity**
- YouTube Studio uses Polymer
- Custom elements with Shadow DOM
- Need special queries with `pierce/` or `.shadowRoot`

### 3. **Dynamic Loading**
- YouTube Studio loads content dynamically
- Need to wait for elements to appear
- Use MutationObserver or polling

### 4. **Rate Limiting**
- Don't make too many requests
- Add delays between operations
- Respect YouTube's ToS

### 5. **Legal Considerations**
- Review YouTube's Terms of Service
- Extension should enhance, not abuse
- Don't automate actions that could violate ToS

---

## 📚 Learning Resources

### Chrome Extension Development
- **Official Tutorial**: https://developer.chrome.com/docs/extensions/mv3/getstarted/
- **Manifest V3 Migration**: https://developer.chrome.com/docs/extensions/migrating/
- **Content Scripts Guide**: https://thoughtbot.com/blog/how-to-make-a-chrome-extension

### Shadow DOM
- **MDN Guide**: https://developer.mozilla.org/en-US/docs/Web/API/Web_components/Using_shadow_DOM
- **Accessing Shadow DOM**: https://stackoverflow.com/questions/37643476/

### Automation Patterns
- **Automa Source Code**: Study https://github.com/AutomaApp/automa
- **Form Automation Examples**: https://github.com/holyjak/Testofill-chrome-extension

---

## 🎯 Next Steps for Implementation

### Week 1: Setup & Research
1. Install and study Automa extension
2. Inspect YouTube Studio Analytics page DOM
3. Create basic extension that injects a button
4. Test content script injection

### Week 2: Core Development
1. Implement date range calculation
2. Build date filter automation
3. Implement metrics extraction
4. Create comparison display UI

### Week 3: Testing & Polish
1. Test with real YouTube Studio account
2. Handle edge cases and errors
3. Add loading states and feedback
4. Create user documentation

### Week 4: Deployment
1. Package extension
2. Test on different channels
3. Deploy to team
4. Gather feedback and iterate

---

## 📞 Support Resources

### When Stuck:
- **Chrome Extensions Discord**: Join Chrome extension developer communities
- **Stack Overflow**: Tag questions with `google-chrome-extension`
- **GitHub Issues**: Check issues on similar projects (Automa, Testofill)

### Similar Projects to Reference:
1. **Automa** - Complex automation workflows
2. **vidIQ** - YouTube Studio integration
3. **Testofill** - Form automation
4. **YouTube Transcript Scraper** - YouTube DOM manipulation

---

**Last Updated**: January 2025
**Author**: Research compiled for CrazyTok Media
**Status**: Ready for implementation

---

## 🔗 Quick Links Summary

| Resource | Link | Purpose |
|----------|------|---------|
| Automa (GitHub) | https://github.com/AutomaApp/automa | Workflow automation framework |
| Chrome Content Scripts Docs | https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts | Official documentation |
| Testofill Extension | https://github.com/holyjak/Testofill-chrome-extension | Form automation example |
| vidIQ Extension | https://vidiq.com/extension/ | Commercial example to study |
| YouTube Studio Puppeteer | https://stackoverflow.com/questions/70880212 | Shadow DOM handling |
| Basic Extension Template | https://github.com/matthova/basic_chrome_extension | Starter code |

**Ready to implement! All resources documented and organized.** 🚀
