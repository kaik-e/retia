/**
 * Client-side bot detection script
 * Collects behavioral and fingerprinting data to detect bots
 * This script should be included in cloaked templates
 */

(function() {
  'use strict';

  const botDetection = {
    startTime: Date.now(),
    mouseMovements: 0,
    clicks: 0,
    scrolls: 0,
    lastScrollTime: 0,
    scrollPattern: [],
    
    // Collect timing data
    timing: {
      timeToFirstClick: null,
      timeToFirstScroll: null,
      timeToFirstMouseMove: null,
      timeOnPage: 0,
    },
    
    // Collect fingerprint data
    fingerprint: {
      webdriver: false,
      headless: false,
      automation: false,
      plugins: [],
      languages: [],
      screenWidth: 0,
      screenHeight: 0,
      timezone: '',
      platform: '',
    },

    init() {
      this.collectFingerprint();
      this.setupListeners();
      
      // Send data after 5 seconds or on page unload
      setTimeout(() => this.sendData(), 5000);
      window.addEventListener('beforeunload', () => this.sendData());
    },

    collectFingerprint() {
      try {
        // Check for automation indicators
        this.fingerprint.webdriver = navigator.webdriver === true;
        this.fingerprint.headless = /HeadlessChrome/.test(navigator.userAgent);
        
        // Check for automation properties
        this.fingerprint.automation = !!(
          window.document.__selenium_unwrapped ||
          window.document.__webdriver_evaluate ||
          window.document.__driver_evaluate ||
          window.navigator.webdriver ||
          window.callPhantom ||
          window._phantom
        );

        // Collect browser info
        this.fingerprint.plugins = Array.from(navigator.plugins || []).map(p => p.name);
        this.fingerprint.languages = navigator.languages || [navigator.language];
        this.fingerprint.screenWidth = screen.width;
        this.fingerprint.screenHeight = screen.height;
        this.fingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        this.fingerprint.platform = navigator.platform;
        
      } catch (e) {
        console.error('Fingerprint collection error:', e);
      }
    },

    setupListeners() {
      // Track mouse movements
      document.addEventListener('mousemove', (e) => {
        if (this.mouseMovements === 0) {
          this.timing.timeToFirstMouseMove = Date.now() - this.startTime;
        }
        this.mouseMovements++;
      }, { passive: true });

      // Track clicks
      document.addEventListener('click', (e) => {
        if (this.clicks === 0) {
          this.timing.timeToFirstClick = Date.now() - this.startTime;
        }
        this.clicks++;
      }, { passive: true });

      // Track scrolls
      document.addEventListener('scroll', (e) => {
        const now = Date.now();
        
        if (this.scrolls === 0) {
          this.timing.timeToFirstScroll = now - this.startTime;
        }
        
        // Track scroll timing pattern
        if (this.lastScrollTime > 0) {
          const timeDiff = now - this.lastScrollTime;
          this.scrollPattern.push(timeDiff);
        }
        
        this.lastScrollTime = now;
        this.scrolls++;
      }, { passive: true });
    },

    analyzeScrollPattern() {
      if (this.scrollPattern.length < 3) return 'unknown';
      
      // Check if scrolls are suspiciously uniform (bot pattern)
      const avg = this.scrollPattern.reduce((a, b) => a + b, 0) / this.scrollPattern.length;
      const variance = this.scrollPattern.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) / this.scrollPattern.length;
      const stdDev = Math.sqrt(variance);
      
      // Low variance = linear/bot-like scrolling
      return stdDev < 10 ? 'linear' : 'natural';
    },

    sendData() {
      this.timing.timeOnPage = Date.now() - this.startTime;
      
      const data = {
        timing: {
          ...this.timing,
          mouseMovements: this.mouseMovements,
          clicks: this.clicks,
          scrolls: this.scrolls,
          scrollPattern: this.analyzeScrollPattern(),
        },
        fingerprint: this.fingerprint,
      };

      // Send via beacon API (doesn't block page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
        navigator.sendBeacon('/api/bot-detection', blob);
      } else {
        // Fallback to fetch with keepalive
        fetch('/api/bot-detection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true,
        }).catch(() => {});
      }
    },
  };

  // Auto-initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => botDetection.init());
  } else {
    botDetection.init();
  }
})();
