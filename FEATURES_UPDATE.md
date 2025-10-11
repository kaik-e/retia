# New Features Update

## 🎉 What's New

### 1. Lockdown Mode 🚨

**Emergency traffic control** - Block ALL visitors and show a maintenance/lockdown page.

#### How It Works
- When enabled, **100% of traffic** is blocked regardless of any other filters
- All visitors see the lockdown template
- No redirects happen until lockdown is disabled
- Perfect for emergencies, maintenance, or campaign pauses

#### Usage
1. Go to domain settings
2. Enable "Lockdown Mode"
3. Select a lockdown template (required)
4. Save - all traffic now blocked!

#### Use Cases
- **Emergency shutdown**: Pause campaign immediately
- **Maintenance mode**: Show "under maintenance" page
- **Campaign pause**: Temporarily stop all traffic
- **Testing**: Test template without affecting live traffic
- **Compliance**: Quick shutdown if needed

#### Backend Changes
- Added `lockdown_mode` and `lockdown_template_id` to domains table
- Lockdown check happens FIRST in cloaking logic (before any other filters)
- Logged as `blocked:lockdown_mode` in analytics

---

### 2. Interactive Tooltips 💡

**Helpful explanations** for every feature using coss.com-style tooltips.

#### Where They Appear
- ✅ All cloaking options (Pass Query Params, GCLID, Mobile Only, etc.)
- ✅ Lockdown mode
- ✅ ASN blocks
- ✅ Country blocks
- ✅ State blocks
- ✅ IP blocks
- ✅ Template upload

#### What They Explain

**Pass Query Parameters**
> Forwards all URL parameters (like ?gclid=xxx&utm_source=google) to the target URL. Essential for tracking and attribution.

**Require GCLID**
> Blocks any visitor without a Google Click ID (gclid) parameter. Perfect for ensuring traffic comes from Google Ads campaigns only.

**Mobile Only**
> Only allows mobile devices (phones). Blocks desktop computers and tablets. Detects device type from user agent.

**Block Pingable IPs**
> Blocks datacenter, hosting, VPN, and proxy IPs. Filters out bots and scrapers from AWS, Google Cloud, DigitalOcean, etc.

**Lockdown Mode**
> When enabled, ALL visitors will be shown the lockdown template. No traffic will be redirected. Use this for emergencies or maintenance.

**ASN Blocks**
> Block entire networks by their ASN (Autonomous System Number). Example: AS15169 is Google. Find ASNs at ipinfo.io or bgp.he.net

**Country Blocks**
> Block visitors by country using 2-letter country codes (ISO 3166-1 alpha-2). Examples: US, GB, CA, DE, FR, CN, RU

**State Blocks**
> Block specific states or regions within countries. Use 2-letter codes. Examples: US/CA (California), US/NY (New York), GB/ENG (England)

**IP Blocks**
> Manually block specific IP addresses. Useful for blocking known competitors, scrapers, or problematic visitors.

**Template Upload**
> Upload a complete HTML file that will be shown to blocked visitors. Include all CSS/JS inline or use CDN links.

#### Implementation
- Uses Radix UI Tooltip component
- Custom `InfoTooltip` wrapper component
- Hover to see explanations
- Clean, minimal design

---

### 3. Enhanced File Upload UI 📤

**Modern drag-and-drop style** upload interface inspired by coss.com.

#### Features
- ✅ Large, clickable upload area
- ✅ Visual feedback when file selected
- ✅ Shows file name and size
- ✅ Easy file removal
- ✅ Drag-and-drop ready styling
- ✅ Clear instructions

#### Before vs After

**Before:**
```
[Browse...] [Upload Button]
```

**After:**
```
┌─────────────────────────────────┐
│         📄 Upload Icon          │
│  Click to upload or drag & drop │
│      HTML files only (10MB)     │
└─────────────────────────────────┘
```

When file selected:
```
┌─────────────────────────────────┐
│         📄 File Icon            │
│       template.html             │
│          45.2 KB                │
│       [Remove Button]           │
└─────────────────────────────────┘
```

---

## 🔧 Technical Implementation

### Database Changes

**New columns in `domains` table:**
```sql
lockdown_mode BOOLEAN DEFAULT 0
lockdown_template_id TEXT
FOREIGN KEY (lockdown_template_id) REFERENCES templates(id)
```

### API Changes

**Domain Create/Update endpoints now accept:**
```json
{
  "lockdown_mode": true,
  "lockdown_template_id": "template-uuid"
}
```

### Cloaking Logic Update

**New priority order:**
1. **Lockdown Mode** ← NEW! (blocks everything)
2. GCLID requirement
3. Mobile-only check
4. IP blocks
5. Country blocks
6. State blocks
7. Pingable IP check
8. ASN blocks
9. ✅ Redirect to target

### Frontend Components

**New components:**
- `/client/src/components/ui/tooltip.jsx` - Radix UI tooltip wrapper
- `/client/src/components/ui/info-tooltip.jsx` - Helper component with icon

**Updated pages:**
- `DomainEdit.jsx` - Added lockdown section + tooltips
- `Templates.jsx` - Enhanced upload UI + tooltip

---

## 📊 Analytics Impact

### New Log Entry
When lockdown mode blocks traffic:
```json
{
  "action": "blocked:lockdown_mode",
  "domain_id": "...",
  "ip_address": "...",
  "timestamp": "..."
}
```

### Analytics Dashboard
- Lockdown blocks show as "blocked: lockdown_mode"
- Counted in total blocks
- Visible in action breakdown

---

## 🎨 UI/UX Improvements

### Visual Indicators

**Lockdown Mode Active:**
- ⚠️ Red border on card
- Alert triangle icon
- Red warning text
- Highlighted template selector

**Tooltips:**
- 💡 Help circle icon next to labels
- Hover to reveal
- Max-width for readability
- Smooth animations

**File Upload:**
- Dashed border (inactive)
- Solid border (hover)
- Primary color (file selected)
- Large touch targets

---

## 🚀 Usage Examples

### Example 1: Emergency Shutdown

```javascript
// Campaign has issues - shut it down NOW!
1. Go to domain settings
2. Toggle "Enable Lockdown" ON
3. Select "Maintenance" template
4. Save
// ✅ All traffic now blocked immediately
```

### Example 2: Scheduled Maintenance

```javascript
// Need to update landing page
1. Create "Under Maintenance" template
2. Enable lockdown mode with that template
3. Update your actual landing page
4. Disable lockdown when ready
// ✅ Visitors see maintenance page during updates
```

### Example 3: Campaign Testing

```javascript
// Test new template before going live
1. Enable lockdown with new template
2. Visit domain to see how it looks
3. Make adjustments
4. Disable lockdown to go live
// ✅ Safe testing without affecting real traffic
```

---

## 📝 Migration Notes

### Existing Domains
- Lockdown mode defaults to `false` (off)
- No action needed for existing domains
- Feature is opt-in

### Database Migration
The database schema updates automatically on server start. No manual migration needed.

### API Compatibility
- Old API calls still work (lockdown fields optional)
- New fields ignored if not provided
- Backward compatible

---

## 🎯 Best Practices

### Lockdown Mode
- ✅ **DO** use for emergencies
- ✅ **DO** have a lockdown template ready
- ✅ **DO** test lockdown before you need it
- ❌ **DON'T** forget to disable after maintenance
- ❌ **DON'T** use as primary blocking method

### Tooltips
- Hover over any ℹ️ icon for help
- Read tooltips when configuring new domains
- Share with team members who need guidance

### File Upload
- Upload complete, self-contained HTML
- Test templates in browser first
- Keep files under 10MB
- Use external CDNs for large assets

---

## 🔍 Testing

### Test Lockdown Mode

```bash
# 1. Enable lockdown in dashboard
# 2. Test with curl
curl "http://localhost:3000/api/cloak/test/DOMAIN_ID?gclid=test"

# Response should show:
{
  "decision": {
    "action": "BLOCK",
    "reason": "Lockdown mode active"
  }
}

# 3. Test real endpoint (should show lockdown template)
curl "http://localhost:3000/api/cloak/DOMAIN_ID"
```

### Test Tooltips
1. Open domain edit page
2. Hover over ℹ️ icons
3. Verify tooltips appear
4. Check tooltip content is helpful

### Test File Upload
1. Go to Templates page
2. Click upload area
3. Select HTML file
4. Verify file info displays
5. Upload and check success

---

## 📚 Documentation Updates

Updated files:
- ✅ `FEATURES_UPDATE.md` (this file)
- ✅ Backend: `server/database.js`
- ✅ Backend: `server/routes/cloak.js`
- ✅ Backend: `server/routes/domains.js`
- ✅ Frontend: `client/src/pages/DomainEdit.jsx`
- ✅ Frontend: `client/src/pages/Templates.jsx`
- ✅ Frontend: `client/src/components/ui/tooltip.jsx`
- ✅ Frontend: `client/src/components/ui/info-tooltip.jsx`
- ✅ Frontend: `client/package.json`

---

## 🎊 Summary

### What You Get

1. **Lockdown Mode** - Emergency stop button for all traffic
2. **Interactive Tooltips** - Helpful explanations everywhere
3. **Better Upload UI** - Modern, user-friendly file upload

### Why It Matters

- **Safety**: Quick emergency shutdown capability
- **Usability**: Clear explanations for all features
- **Polish**: Professional, modern interface

### Ready to Use

All features are:
- ✅ Fully implemented
- ✅ Tested and working
- ✅ Backward compatible
- ✅ Production ready

---

**Enjoy the new features! 🚀**
