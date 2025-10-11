# Testing Guide

## Local Testing Methods

### Method 1: Test Endpoint (Easiest) ⭐

I've added a special test endpoint that shows exactly what the cloaker sees without actually blocking or redirecting.

**Usage:**
```bash
# Test with your domain ID
curl "http://localhost:3000/api/cloak/test/YOUR_DOMAIN_ID?gclid=test123"
```

**Example Response:**
```json
{
  "test_mode": true,
  "domain_id": "abc-123",
  "domain_found": true,
  "detected": {
    "ip": "192.168.1.100",
    "country": "US",
    "state": "CA",
    "city": "San Francisco",
    "timezone": "America/Los_Angeles",
    "is_mobile": false,
    "device": "Other",
    "os": "Mac OS X 10.15.7",
    "browser": "Chrome 120.0.0"
  },
  "request": {
    "has_gclid": true,
    "query_params": { "gclid": "test123" },
    "headers": {
      "cf-connecting-ip": null,
      "cf-ipcountry": null,
      "x-forwarded-for": null,
      "x-real-ip": null,
      "user-agent": "curl/7.64.1"
    }
  },
  "decision": {
    "action": "REDIRECT",
    "reason": null,
    "would_redirect_to": "https://target-site.com"
  },
  "domain_settings": {
    "require_gclid": true,
    "mobile_only": false,
    "block_pingable_ips": true,
    "pass_query_params": true
  }
}
```

**Test Different Scenarios:**

```bash
# Test without GCLID (should block if required)
curl "http://localhost:3000/api/cloak/test/DOMAIN_ID"

# Test with mobile user agent
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"

# Test with fake CloudFlare headers
curl -H "CF-Connecting-IP: 8.8.8.8" \
     -H "CF-IPCountry: US" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"

# Test desktop on mobile-only domain
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"
```

---

### Method 2: ngrok (Real External Testing)

**Setup:**
```bash
# Install ngrok
brew install ngrok  # macOS
# or: https://ngrok.com/download

# Start C0alk
npm run dev

# In another terminal
ngrok http 3000
```

**You'll get:**
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Test from anywhere:**
```bash
# From your phone, another computer, etc.
https://abc123.ngrok.io/api/cloak/DOMAIN_ID?gclid=test123

# Or use the test endpoint
https://abc123.ngrok.io/api/cloak/test/DOMAIN_ID
```

**Advantages:**
- ✅ Real external IPs
- ✅ Test from mobile devices
- ✅ Share with team for testing
- ✅ Test geo-blocking with VPN

---

### Method 3: Simulate Headers Locally

Test specific scenarios by setting headers:

**Test IP Blocking:**
```bash
# Simulate visitor from specific IP
curl -H "X-Forwarded-For: 1.2.3.4" \
  "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"
```

**Test Country Blocking:**
```bash
# Simulate CloudFlare country header
curl -H "CF-IPCountry: CN" \
  "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"
```

**Test Mobile Detection:**
```bash
# iPhone
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1" \
  "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"

# Android
curl -H "User-Agent: Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36" \
  "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"

# Desktop (should block if mobile_only)
curl -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36" \
  "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"
```

**Test GCLID Requirement:**
```bash
# With GCLID (should pass)
curl "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=abc123"

# Without GCLID (should block if required)
curl "http://localhost:3000/api/cloak/DOMAIN_ID"
```

**Test Query Parameter Forwarding:**
```bash
# Multiple parameters
curl "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=abc&utm_source=google&utm_campaign=test"

# Check if they're passed to target URL
```

---

### Method 4: Local Network Testing

Test from other devices on your WiFi:

**Find Your Local IP:**
```bash
# macOS/Linux
ifconfig | grep "inet " | grep -v 127.0.0.1

# Example output: inet 192.168.1.100
```

**Access from Phone/Tablet:**
```
http://192.168.1.100:3000/api/cloak/test/DOMAIN_ID?gclid=test
```

**Advantages:**
- ✅ Real mobile devices
- ✅ Real mobile user agents
- ✅ Test touch interactions with templates
- ✅ Different network conditions

---

## Testing Checklist

### Basic Functionality
- [ ] Domain loads without errors
- [ ] Test endpoint returns valid JSON
- [ ] Real endpoint redirects correctly
- [ ] Template displays when blocked

### GCLID Testing
- [ ] Blocks when GCLID required but missing
- [ ] Allows when GCLID present
- [ ] GCLID passes to target URL

### Device Detection
- [ ] Detects iPhone correctly
- [ ] Detects Android correctly
- [ ] Blocks desktop when mobile_only enabled
- [ ] Allows mobile when mobile_only enabled

### Geo-Blocking
- [ ] Country blocking works
- [ ] State blocking works
- [ ] Uses CloudFlare country header when available
- [ ] Falls back to GeoIP when no CF header

### IP Blocking
- [ ] Specific IPs blocked
- [ ] Pingable IPs detected (datacenter/VPN)
- [ ] ASN blocking works

### Query Parameters
- [ ] Parameters forwarded to target
- [ ] Multiple parameters preserved
- [ ] Special characters handled correctly

### Analytics
- [ ] Requests logged to database
- [ ] Correct action recorded (blocked/redirected)
- [ ] IP and geo data captured
- [ ] Analytics page shows data

---

## Test Scenarios

### Scenario 1: Google Ads Campaign
```bash
# Should PASS (mobile + GCLID)
curl -H "User-Agent: Mozilla/5.0 (iPhone...)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=abc123"

# Should BLOCK (no GCLID)
curl -H "User-Agent: Mozilla/5.0 (iPhone...)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID"

# Should BLOCK (desktop)
curl -H "User-Agent: Mozilla/5.0 (Windows...)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=abc123"
```

### Scenario 2: Geo-Targeted Campaign
```bash
# Should PASS (allowed country)
curl -H "CF-IPCountry: US" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"

# Should BLOCK (blocked country)
curl -H "CF-IPCountry: CN" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"
```

### Scenario 3: Bot Protection
```bash
# Should BLOCK (datacenter IP)
curl -H "X-Forwarded-For: 8.8.8.8" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"

# Should PASS (residential IP)
curl -H "X-Forwarded-For: 73.123.45.67" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"
```

---

## Automated Testing Script

Save as `test-cloaker.sh`:

```bash
#!/bin/bash

DOMAIN_ID="your-domain-id-here"
BASE_URL="http://localhost:3000/api/cloak/test"

echo "🧪 Testing C0alk Cloaker"
echo "========================"
echo ""

# Test 1: Basic request
echo "Test 1: Basic request with GCLID"
curl -s "$BASE_URL/$DOMAIN_ID?gclid=test123" | jq '.decision'
echo ""

# Test 2: No GCLID
echo "Test 2: Missing GCLID"
curl -s "$BASE_URL/$DOMAIN_ID" | jq '.decision'
echo ""

# Test 3: Mobile device
echo "Test 3: Mobile device"
curl -s -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  "$BASE_URL/$DOMAIN_ID?gclid=test" | jq '.detected.is_mobile, .decision'
echo ""

# Test 4: Desktop device
echo "Test 4: Desktop device"
curl -s -H "User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64)" \
  "$BASE_URL/$DOMAIN_ID?gclid=test" | jq '.detected.is_mobile, .decision'
echo ""

# Test 5: CloudFlare headers
echo "Test 5: With CloudFlare headers"
curl -s -H "CF-Connecting-IP: 1.2.3.4" -H "CF-IPCountry: US" \
  "$BASE_URL/$DOMAIN_ID?gclid=test" | jq '.detected'
echo ""

echo "✅ Tests complete!"
```

**Run it:**
```bash
chmod +x test-cloaker.sh
./test-cloaker.sh
```

---

## Browser Testing

### Test in Browser Console

Open http://localhost:5173 and create a domain, then:

```javascript
// Test endpoint
fetch('http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test123')
  .then(r => r.json())
  .then(console.log)

// Real endpoint (will redirect)
window.location = 'http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test123'
```

### Mobile Browser Testing

1. Get your local IP: `ifconfig | grep "inet "`
2. On mobile, visit: `http://YOUR_IP:5173`
3. Create/view domain
4. Test cloaking: `http://YOUR_IP:3000/api/cloak/test/DOMAIN_ID`

---

## Production Testing

Once deployed:

```bash
# Test with real domain
curl "https://yourdomain.com?gclid=test123"

# Check headers
curl -I "https://yourdomain.com"

# Test from different locations (use VPN)
# Test from mobile network
# Test from different countries
```

---

## Debugging Tips

### Check Logs
```bash
# Development
# Watch console output

# Production
pm2 logs c0alk

# Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Check Database
```bash
# View recent logs
sqlite3 data/cloaker.db "SELECT * FROM access_logs ORDER BY timestamp DESC LIMIT 10;"

# Count by action
sqlite3 data/cloaker.db "SELECT action, COUNT(*) FROM access_logs GROUP BY action;"
```

### Check Analytics
- Go to dashboard: http://localhost:5173
- Navigate to domain analytics
- View recent activity

---

## Common Issues

### Issue: Always shows local IP (127.0.0.1)
**Solution:** Use ngrok or test from another device

### Issue: GeoIP returns null
**Solution:** Local IPs don't have geo data, use ngrok or set CF-IPCountry header

### Issue: Mobile detection not working
**Solution:** Use real mobile user agent string (see examples above)

### Issue: Test endpoint not found
**Solution:** Make sure server restarted after adding test endpoint

---

## Quick Test Commands

```bash
# Copy and paste these for quick testing

# 1. Test endpoint (see what cloaker detects)
curl "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test" | jq

# 2. Test mobile
curl -H "User-Agent: Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test" | jq '.detected.is_mobile'

# 3. Test without GCLID
curl "http://localhost:3000/api/cloak/test/DOMAIN_ID" | jq '.decision'

# 4. Test with CloudFlare headers
curl -H "CF-Connecting-IP: 8.8.8.8" -H "CF-IPCountry: US" \
  "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test" | jq

# 5. Real test (will actually redirect/block)
curl -L "http://localhost:3000/api/cloak/DOMAIN_ID?gclid=test"
```

---

## Summary

**For Quick Testing:** Use the `/test/` endpoint
```bash
curl "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"
```

**For Real IP Testing:** Use ngrok
```bash
ngrok http 3000
# Then test from phone/external network
```

**For Production Testing:** Deploy and test with real traffic

The test endpoint is perfect for development - it shows you exactly what the cloaker sees without actually blocking or redirecting! 🎯
