const axios = require('axios');
const { GOOGLE_ASNS, GOOGLE_BOT_USER_AGENTS } = require('../utils/google-asns');

class BotDetector {
  constructor() {
    this.asnCache = new Map(); // Cache ASN lookups
    this.suspiciousIPs = new Set(); // Track suspicious IPs
  }

  /**
   * Main detection method - combines multiple signals
   */
  async detectBot(req) {
    const signals = {
      userAgent: this.checkUserAgent(req.headers['user-agent']),
      asn: await this.checkASN(req.ip),
      headers: this.checkHeaders(req.headers),
      timing: this.checkTiming(req),
      fingerprint: this.checkFingerprint(req),
    };

    // Calculate bot probability score (0-100)
    const score = this.calculateBotScore(signals);
    
    return {
      isBot: score > 70, // 70%+ confidence = bot
      score,
      signals,
      confidence: this.getConfidenceLevel(score),
    };
  }

  /**
   * Check if user agent matches known Google bots
   */
  checkUserAgent(userAgent) {
    if (!userAgent) {
      return { match: true, reason: 'missing_user_agent', score: 80 };
    }

    const ua = userAgent.toLowerCase();
    
    // Check for Google bot user agents
    for (const botUA of GOOGLE_BOT_USER_AGENTS) {
      if (userAgent.includes(botUA)) {
        return { match: true, reason: 'google_bot_ua', botType: botUA, score: 95 };
      }
    }

    // Check for headless browser indicators
    const headlessIndicators = ['headless', 'phantom', 'selenium', 'webdriver', 'puppeteer', 'playwright'];
    for (const indicator of headlessIndicators) {
      if (ua.includes(indicator)) {
        return { match: true, reason: 'headless_browser', indicator, score: 90 };
      }
    }

    // Check for suspicious patterns
    if (ua.length < 20 || ua.length > 500) {
      return { match: true, reason: 'suspicious_ua_length', score: 60 };
    }

    return { match: false, score: 0 };
  }

  /**
   * Check if IP belongs to Google ASN
   */
  async checkASN(ip) {
    // Check cache first
    if (this.asnCache.has(ip)) {
      return this.asnCache.get(ip);
    }

    try {
      // Use ipapi.co for ASN lookup (free tier: 1000/day)
      const response = await axios.get(`https://ipapi.co/${ip}/json/`, {
        timeout: 2000,
        headers: { 'User-Agent': 'Mozilla/5.0' }
      });

      const asn = parseInt(response.data.asn?.replace('AS', ''));
      const org = response.data.org || '';
      
      const isGoogleASN = GOOGLE_ASNS.includes(asn);
      const isGoogleOrg = org.toLowerCase().includes('google');

      const result = {
        match: isGoogleASN || isGoogleOrg,
        asn,
        org,
        reason: isGoogleASN ? 'google_asn' : (isGoogleOrg ? 'google_org' : 'unknown'),
        score: isGoogleASN ? 95 : (isGoogleOrg ? 85 : 0),
      };

      // Cache for 1 hour
      this.asnCache.set(ip, result);
      setTimeout(() => this.asnCache.delete(ip), 3600000);

      return result;
    } catch (error) {
      // If lookup fails, return neutral
      return { match: false, error: error.message, score: 0 };
    }
  }

  /**
   * Check HTTP headers for bot indicators
   */
  checkHeaders(headers) {
    const signals = [];
    let score = 0;

    // Missing common headers
    if (!headers['accept-language']) {
      signals.push('missing_accept_language');
      score += 20;
    }

    if (!headers['accept-encoding']) {
      signals.push('missing_accept_encoding');
      score += 15;
    }

    // Suspicious header combinations
    if (headers['x-forwarded-for'] && headers['x-forwarded-for'].split(',').length > 3) {
      signals.push('multiple_proxies');
      score += 30;
    }

    // Check for automation headers
    const automationHeaders = ['x-requested-with', 'x-devtools-emulate-network-conditions-client-id'];
    for (const header of automationHeaders) {
      if (headers[header]) {
        signals.push(`automation_header_${header}`);
        score += 40;
      }
    }

    // Cloudflare bot score (if available)
    if (headers['cf-bot-score']) {
      const cfScore = parseInt(headers['cf-bot-score']);
      if (cfScore < 30) {
        signals.push('cloudflare_bot_score_low');
        score += 50;
      }
    }

    return {
      match: score > 30,
      signals,
      score: Math.min(score, 100),
    };
  }

  /**
   * Check timing patterns (requires client-side data)
   */
  checkTiming(req) {
    // This would need client-side JavaScript to send timing data
    // For now, check if timing data is present
    const timing = req.body?.timing || req.query?.timing;
    
    if (!timing) {
      return { match: false, reason: 'no_timing_data', score: 0 };
    }

    const signals = [];
    let score = 0;

    // Parse timing data
    try {
      const data = typeof timing === 'string' ? JSON.parse(timing) : timing;

      // Check for suspiciously fast interactions
      if (data.timeToFirstClick && data.timeToFirstClick < 100) {
        signals.push('fast_first_click');
        score += 40;
      }

      if (data.timeToFirstScroll && data.timeToFirstScroll < 50) {
        signals.push('fast_first_scroll');
        score += 35;
      }

      // Check for no mouse movement
      if (data.mouseMovements === 0 && data.timeOnPage > 5000) {
        signals.push('no_mouse_movement');
        score += 60;
      }

      // Check for linear scrolling (bot pattern)
      if (data.scrollPattern === 'linear') {
        signals.push('linear_scroll_pattern');
        score += 45;
      }

    } catch (error) {
      return { match: false, error: 'invalid_timing_data', score: 0 };
    }

    return {
      match: score > 40,
      signals,
      score: Math.min(score, 100),
    };
  }

  /**
   * Check browser fingerprint
   */
  checkFingerprint(req) {
    const fingerprint = req.body?.fingerprint || req.query?.fingerprint;
    
    if (!fingerprint) {
      return { match: false, reason: 'no_fingerprint', score: 0 };
    }

    const signals = [];
    let score = 0;

    try {
      const data = typeof fingerprint === 'string' ? JSON.parse(fingerprint) : fingerprint;

      // Check for headless browser indicators
      if (data.webdriver === true) {
        signals.push('webdriver_detected');
        score += 90;
      }

      if (data.headless === true) {
        signals.push('headless_detected');
        score += 95;
      }

      // Check for missing browser features
      if (!data.plugins || data.plugins.length === 0) {
        signals.push('no_plugins');
        score += 30;
      }

      if (!data.languages || data.languages.length === 0) {
        signals.push('no_languages');
        score += 25;
      }

      // Check screen resolution (bots often have unusual resolutions)
      if (data.screenWidth === 800 && data.screenHeight === 600) {
        signals.push('default_resolution');
        score += 40;
      }

      // Check for automation properties
      if (data.automation) {
        signals.push('automation_detected');
        score += 85;
      }

    } catch (error) {
      return { match: false, error: 'invalid_fingerprint', score: 0 };
    }

    return {
      match: score > 40,
      signals,
      score: Math.min(score, 100),
    };
  }

  /**
   * Calculate overall bot probability score
   */
  calculateBotScore(signals) {
    let totalScore = 0;
    let weights = 0;

    // Weight each signal type
    const signalWeights = {
      userAgent: 3.0,    // User agent is very reliable
      asn: 2.5,          // ASN is reliable but can have false positives
      headers: 1.5,      // Headers are moderately reliable
      timing: 2.0,       // Timing is good but requires client data
      fingerprint: 2.5,  // Fingerprint is very reliable
    };

    for (const [type, signal] of Object.entries(signals)) {
      if (signal && signal.score !== undefined) {
        totalScore += signal.score * signalWeights[type];
        weights += signalWeights[type];
      }
    }

    return weights > 0 ? Math.round(totalScore / weights) : 0;
  }

  /**
   * Get confidence level description
   */
  getConfidenceLevel(score) {
    if (score >= 90) return 'very_high';
    if (score >= 70) return 'high';
    if (score >= 50) return 'medium';
    if (score >= 30) return 'low';
    return 'very_low';
  }

  /**
   * Mark IP as suspicious for future reference
   */
  markSuspicious(ip) {
    this.suspiciousIPs.add(ip);
  }

  /**
   * Check if IP was previously marked as suspicious
   */
  isSuspicious(ip) {
    return this.suspiciousIPs.has(ip);
  }
}

module.exports = new BotDetector();
