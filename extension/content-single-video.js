/**
 * YouTube Treatment Comparison Helper - Single Video Module
 * UI and logic for single video treatment comparison
 */

YTTreatmentHelper.SingleVideo = {
  // State
  currentVideoId: null,
  panel: null,

  /**
   * Initialize single video helper
   */
  init: function() {
    console.log('Single video helper initializing...');

    const utils = YTTreatmentHelper.Utils;

    if (utils.isVideoAnalyticsPage()) {
      this.addToggleButton();
      this.createHelperPanel();
      this.watchForVideoChanges();
    }
  },

  /**
   * Add toggle button to YouTube Studio UI
   */
  addToggleButton: function() {
    // Implementation will be migrated from content.js
    console.log('Toggle button to be added');
  },

  /**
   * Create the main helper panel UI
   */
  createHelperPanel: function() {
    // Implementation will be migrated from content.js
    console.log('Helper panel to be created');
  },

  /**
   * Make panel draggable
   */
  makePanelDraggable: function(panel) {
    // Implementation will be migrated from content.js
    throw new Error('Not yet implemented - to be migrated');
  },

  /**
   * Reset form when video changes
   */
  resetFormForNewVideo: function() {
    // Implementation will be migrated from content.js
    console.log('Form reset to be implemented');
  },

  /**
   * Watch for video changes in URL
   */
  watchForVideoChanges: function() {
    // Implementation will be migrated from content.js
    console.log('Video change watcher to be implemented');
  }
};

console.log('Single video module loaded');
