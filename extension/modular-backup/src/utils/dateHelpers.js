/**
 * Date formatting and calculation utilities
 */

import { YOUTUBE_DATA_DELAY_DAYS, MESSAGES } from '../config/constants.js';

/**
 * Format date as YYYY-MM-DD (for internal use)
 */
export function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format date as DD/MM/YY (for display)
 */
export function formatDateDisplay(dateStr) {
  const [year, month, day] = dateStr.split('-');
  const shortYear = year.slice(-2);
  return `${day}/${month}/${shortYear}`;
}

/**
 * Calculate PRE and POST date ranges
 */
export function calculateDateRanges(treatmentDate, videoPublishDate = null) {
  const treatment = new Date(treatmentDate);
  const today = new Date();

  // YouTube Analytics only has data up to 2 days ago
  const maxYouTubeDate = new Date(today);
  maxYouTubeDate.setDate(maxYouTubeDate.getDate() - YOUTUBE_DATA_DELAY_DAYS);
  const yesterday = maxYouTubeDate;

  // Set to start of day to avoid timezone issues
  yesterday.setHours(0, 0, 0, 0);
  treatment.setHours(0, 0, 0, 0);

  // Calculate days since treatment
  const daysSince = Math.floor((yesterday - treatment) / (1000 * 60 * 60 * 24));

  // Validate dates
  if (daysSince < 0) {
    throw new Error(MESSAGES.ERRORS.TREATMENT_FUTURE);
  }

  if (daysSince < YOUTUBE_DATA_DELAY_DAYS) {
    throw new Error(MESSAGES.ERRORS.TREATMENT_TOO_RECENT);
  }

  // POST period: Treatment day to yesterday
  const postStart = new Date(treatment);
  const postEnd = new Date(yesterday);
  const postDays = daysSince + 1;

  // PRE period: Same number of days as POST, BEFORE treatment
  let preStart = new Date(treatment);
  preStart.setDate(preStart.getDate() - postDays);
  const preEnd = new Date(treatment);
  preEnd.setDate(preEnd.getDate() - 1);
  let preDays = postDays;

  // Check if PRE period starts before video was published
  if (videoPublishDate) {
    const publishDate = new Date(videoPublishDate);
    publishDate.setHours(0, 0, 0, 0);

    if (preStart < publishDate) {
      console.warn(MESSAGES.WARNINGS.PRE_BEFORE_PUBLISH);
      console.warn(`   Original PRE start: ${formatDate(preStart)}`);
      console.warn(`   Video published: ${formatDate(publishDate)}`);

      // Adjust PRE start to video publish date
      preStart = new Date(publishDate);
      preDays = Math.floor((preEnd - preStart) / (1000 * 60 * 60 * 24)) + 1;

      console.warn(`   Adjusted PRE start: ${formatDate(preStart)}`);
      console.warn(`   Adjusted PRE days: ${preDays} (was ${postDays})`);
      console.warn(`   Note: PRE and POST periods now have different lengths!`);
    }
  }

  console.log(`Date calculation:
    Today: ${formatDate(today)}
    Yesterday (YouTube max): ${formatDate(yesterday)}
    Treatment: ${formatDate(treatment)}
    Video published: ${videoPublishDate ? formatDate(videoPublishDate) : 'Unknown'}
    Days since: ${daysSince}
    POST: ${formatDate(postStart)} to ${formatDate(postEnd)} (${postDays} days)
    PRE: ${formatDate(preStart)} to ${formatDate(preEnd)} (${preDays} days)
  `);

  return {
    daysSince,
    videoPublishDate: videoPublishDate ? formatDate(videoPublishDate) : null,
    pre: {
      start: formatDate(preStart),
      end: formatDate(preEnd),
      days: preDays
    },
    post: {
      start: formatDate(postStart),
      end: formatDate(postEnd),
      days: postDays
    }
  };
}
