// Google ASNs (Autonomous System Numbers) - Updated 2025
// These ASNs are used by Google's crawlers and ad review systems

const GOOGLE_ASNS = [
  15169,  // Google LLC (Primary)
  16550,  // Google Private Cloud
  19527,  // Google LLC
  36040,  // Google LLC
  36384,  // Google LLC
  36385,  // Google LLC
  36492,  // Google LLC
  41264,  // Google LLC
  43515,  // Google LLC
  396982, // Google LLC
  139190, // Google LLC (Asia)
  45566,  // Google LLC (APAC)
  55023,  // Google Cloud
];

// Known Google IP ranges for AdsBot and crawlers
// These are approximate ranges - Google updates frequently
const GOOGLE_IP_RANGES = [
  // IPv4 ranges
  '66.249.64.0/19',    // Googlebot
  '64.233.160.0/19',   // Google services
  '72.14.192.0/18',    // Google services
  '74.125.0.0/16',     // Google services
  '108.177.8.0/21',    // Google Cloud
  '173.194.0.0/16',    // Google services
  '209.85.128.0/17',   // Google services
  '216.58.192.0/19',   // Google services
  '216.239.32.0/19',   // Google services
  '172.217.0.0/16',    // Google services
  '172.253.0.0/16',    // Google Cloud
  '142.250.0.0/15',    // Google services
  '35.184.0.0/13',     // Google Cloud
  '34.64.0.0/10',      // Google Cloud
];

// User agents that indicate Google bots
const GOOGLE_BOT_USER_AGENTS = [
  'AdsBot-Google',
  'AdsBot-Google-Mobile',
  'Mediapartners-Google',
  'Google-AMPHTML',
  'Googlebot',
  'Googlebot-Image',
  'Googlebot-News',
  'Googlebot-Video',
  'APIs-Google',
  'Google-InspectionTool',
  'GoogleOther',
  'Google-Extended',
  'Google-Safety',
];

// Behavioral patterns that indicate bot activity
const BOT_BEHAVIORAL_PATTERNS = {
  // Timing patterns
  FAST_PAGE_LOAD: 100,        // ms - Real users take longer
  NO_MOUSE_MOVEMENT: 5000,    // ms - Real users move mouse
  FAST_SCROLL: 50,            // ms between scrolls
  
  // Interaction patterns
  NO_CLICKS: true,            // Bots rarely click
  LINEAR_SCROLL: true,        // Bots scroll in perfect lines
  NO_HOVER: true,             // Bots don't hover over elements
  
  // Browser patterns
  HEADLESS_INDICATORS: [
    'HeadlessChrome',
    'PhantomJS',
    'Selenium',
    'WebDriver',
  ],
};

module.exports = {
  GOOGLE_ASNS,
  GOOGLE_IP_RANGES,
  GOOGLE_BOT_USER_AGENTS,
  BOT_BEHAVIORAL_PATTERNS,
};
