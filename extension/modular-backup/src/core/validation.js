/**
 * Video validation and publish date detection
 */

import { SELECTORS, MESSAGES } from '../config/constants.js';
import { formatDate } from '../utils/dateHelpers.js';

/**
 * Get video publish date from YouTube Studio page
 */
export function getVideoPublishDate() {
  // Method 1 (BEST): Extract from Analytics page date selector
  // When on Analytics tab, the default "Since published" shows the exact publish date
  const dateSelectors = document.querySelectorAll(SELECTORS.DATE_TRIGGER);

  for (const selector of dateSelectors) {
    const triggerText = selector.querySelector(SELECTORS.DROPDOWN_TEXT);
    const labelText = selector.querySelector(SELECTORS.LABEL_TEXT);

    if (triggerText && labelText) {
      const triggerContent = triggerText.textContent.trim();
      const labelContent = labelText.textContent.trim();

      // Check if this is the "Since published" selector
      if (triggerContent.toLowerCase().includes('since published') ||
          triggerContent.toLowerCase().includes('published')) {

        // Extract start date from label like "21 Oct 2025 – Now"
        const dateMatch = labelContent.match(/(\d{1,2}\s+\w{3,9}\s+\d{4})/);
        if (dateMatch) {
          const publishDate = new Date(dateMatch[1]);
          if (!isNaN(publishDate.getTime())) {
            console.log(`✅ ${MESSAGES.SUCCESS.PUBLISH_DATE_FOUND}: ${formatDate(publishDate)}`);
            return publishDate;
          }
        }
      }
    }
  }

  // Method 2: Check yta-time-picker
  const timePicker = document.querySelector(`${SELECTORS.TIME_PICKER} ${SELECTORS.DATE_TRIGGER}`);
  if (timePicker) {
    const labelText = timePicker.querySelector(SELECTORS.LABEL_TEXT);
    const triggerText = timePicker.querySelector(SELECTORS.DROPDOWN_TEXT);

    if (labelText && triggerText && triggerText.textContent.toLowerCase().includes('published')) {
      const dateMatch = labelText.textContent.match(/(\d{1,2}\s+\w{3,9}\s+\d{4})/);
      if (dateMatch) {
        const publishDate = new Date(dateMatch[1]);
        if (!isNaN(publishDate.getTime())) {
          console.log(`✅ Found publish date from time picker: ${formatDate(publishDate)}`);
          return publishDate;
        }
      }
    }
  }

  // Method 3: Check ytInitialData
  if (window.ytInitialData) {
    try {
      const videoDetails = window.ytInitialData?.videoDetails;
      if (videoDetails?.publishDate) {
        const publishDate = new Date(videoDetails.publishDate);
        console.log(`✅ Found publish date from ytInitialData: ${formatDate(publishDate)}`);
        return publishDate;
      }
    } catch (e) {
      console.log('Could not extract publish date from ytInitialData');
    }
  }

  // Method 4: Look for publish date in metadata
  const metaElements = document.querySelectorAll('ytcp-video-metadata-editor-sidepanel [class*="metadata"], [class*="published"]');
  for (const el of metaElements) {
    const text = el.textContent;
    const dateMatch = text.match(/(?:Published|Uploaded).*?(\w{3}\s+\d{1,2},?\s+\d{4})/i);
    if (dateMatch) {
      const publishDate = new Date(dateMatch[1]);
      if (!isNaN(publishDate.getTime())) {
        console.log(`✅ Found publish date from metadata: ${formatDate(publishDate)}`);
        return publishDate;
      }
    }
  }

  console.warn(MESSAGES.WARNINGS.NO_PUBLISH_DATE);
  return null;
}
