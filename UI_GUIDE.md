# UI Guide - New Features

## 🎨 Visual Overview

### 1. Lockdown Mode Section

```
┌─────────────────────────────────────────────────────┐
│ ⚠️  Lockdown Mode                                   │
│ Emergency mode - blocks ALL traffic and shows       │
│ template                                            │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Enable Lockdown  ℹ️                    [Toggle]   │
│  Block all traffic regardless of filters           │
│                                                     │
│  ┌───────────────────────────────────────────────┐ │
│  │ ⚠️ Lockdown Template *                        │ │
│  │ [Select template... ▼]                        │ │
│  │                                                │ │
│  │ ⚠️ All visitors will see this template        │ │
│  │    until lockdown is disabled                 │ │
│  └───────────────────────────────────────────────┘ │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**When Active:**
- Red border around entire card
- Alert triangle icon in header
- Red-tinted template selector
- Warning message in red

---

### 2. Tooltips on Every Feature

```
┌─────────────────────────────────────────────────────┐
│ Cloaking Options                                    │
├─────────────────────────────────────────────────────┤
│                                                     │
│  Pass Query Parameters  ℹ️              [Toggle]   │
│  Include URL parameters in redirect                │
│                                                     │
│  Require GCLID  ℹ️                      [Toggle]   │
│  Block traffic without Google Click ID             │
│                                                     │
│  Mobile Only  ℹ️                        [Toggle]   │
│  Block desktop and tablet devices                  │
│                                                     │
│  Block Pingable IPs  ℹ️                 [Toggle]   │
│  Block datacenter/hosting IPs                      │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Hover on ℹ️ icon:**
```
┌─────────────────────────────────────────┐
│ Forwards all URL parameters (like       │
│ ?gclid=xxx&utm_source=google) to the   │
│ target URL. Essential for tracking     │
│ and attribution.                        │
└─────────────────────────────────────────┘
```

---

### 3. Enhanced File Upload

**Empty State:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    📤                               │
│                                                     │
│         Click to upload or drag and drop           │
│           HTML files only (max 10MB)               │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**With File Selected:**
```
┌─────────────────────────────────────────────────────┐
│                                                     │
│                    📄                               │
│                                                     │
│              landing-page.html                      │
│                  45.2 KB                            │
│                                                     │
│                 [Remove]                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**States:**
- Dashed border (default)
- Solid primary border (hover)
- Primary color icon (file selected)
- Smooth transitions

---

### 4. Blocking Sections with Tooltips

**ASN Blocks:**
```
┌─────────────────────────────────────────────────────┐
│ ASN Blocks  ℹ️                                      │
│ Block specific Autonomous System Numbers           │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [AS15169        ] [Google      ] [+]              │
│                                                     │
│  🏷️ AS15169 - Google  ✕                            │
│  🏷️ AS16509 - Amazon  ✕                            │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Country Blocks:**
```
┌─────────────────────────────────────────────────────┐
│ Country Blocks  ℹ️                                  │
│ Block traffic from specific countries              │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [US, GB, CA...                    ] [+]           │
│                                                     │
│  🏷️ US  ✕   🏷️ GB  ✕   🏷️ CA  ✕                  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**State Blocks:**
```
┌─────────────────────────────────────────────────────┐
│ State/Region Blocks  ℹ️                             │
│ Block traffic from specific states or regions      │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [Country (US)] [State (CA)] [+]                   │
│                                                     │
│  🏷️ US/CA  ✕   🏷️ US/NY  ✕   🏷️ GB/ENG  ✕        │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**IP Blocks:**
```
┌─────────────────────────────────────────────────────┐
│ IP Blocks  ℹ️                                       │
│ Block specific IP addresses                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  [192.168.1.1    ] [Competitor   ] [+]             │
│                                                     │
│  🏷️ 192.168.1.1 - Competitor  ✕                    │
│  🏷️ 10.0.0.5 - Bot  ✕                              │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🎯 Color Scheme

### Lockdown Mode (Active)
- **Border**: `border-destructive` (red)
- **Icon**: `text-destructive` (red)
- **Background**: `bg-destructive/10` (light red)
- **Text**: `text-destructive` (red)

### Tooltips
- **Icon**: `text-muted-foreground` (gray)
- **Icon Hover**: `text-foreground` (dark)
- **Background**: `bg-popover` (white/dark)
- **Border**: `border` (subtle)

### File Upload
- **Border Default**: `border-dashed` (gray)
- **Border Hover**: `border-primary` (blue)
- **Icon Empty**: `text-muted-foreground` (gray)
- **Icon Selected**: `text-primary` (blue)

### Badges (Blocks)
- **Background**: `bg-secondary` (light gray)
- **Text**: `text-secondary-foreground` (dark)
- **Close Icon**: Hover effect

---

## 📱 Responsive Behavior

### Desktop (1024px+)
- Full width cards
- Side-by-side inputs where applicable
- Tooltips appear on hover

### Tablet (768px - 1023px)
- Stacked cards
- Full-width inputs
- Tooltips on tap

### Mobile (< 768px)
- Single column layout
- Touch-friendly targets
- Simplified spacing

---

## ♿ Accessibility

### Tooltips
- ✅ Keyboard accessible (Tab to focus, hover to show)
- ✅ Screen reader friendly
- ✅ ARIA labels
- ✅ Focus indicators

### File Upload
- ✅ Keyboard accessible (Tab + Enter)
- ✅ Screen reader announces file selection
- ✅ Clear focus states
- ✅ Error messages

### Lockdown Mode
- ✅ Clear visual warnings
- ✅ Required field indicators
- ✅ Validation messages
- ✅ Keyboard navigation

---

## 🎨 Design Principles

### Consistency
- All tooltips use same icon (ℹ️)
- Same positioning (right of label)
- Consistent hover states
- Unified color scheme

### Clarity
- Clear visual hierarchy
- Obvious interactive elements
- Helpful microcopy
- Immediate feedback

### Safety
- Destructive actions clearly marked
- Confirmation for dangerous operations
- Visual warnings for lockdown
- Undo/remove options

---

## 💡 Interaction Patterns

### Tooltip Interaction
```
1. User hovers over ℹ️ icon
2. Tooltip fades in (200ms)
3. User reads explanation
4. User moves away
5. Tooltip fades out (150ms)
```

### File Upload Interaction
```
1. User clicks upload area
2. File picker opens
3. User selects file
4. File info displays
5. User can remove or upload
```

### Lockdown Toggle Interaction
```
1. User toggles lockdown ON
2. Template selector appears
3. Card border turns red
4. Warning message shows
5. User must select template
6. Save button enabled
```

---

## 🔧 Component Structure

### InfoTooltip Component
```jsx
<InfoTooltip>
  Explanation text here
</InfoTooltip>
```

**Renders:**
```jsx
<TooltipProvider>
  <Tooltip>
    <TooltipTrigger>
      <HelpCircle icon />
    </TooltipTrigger>
    <TooltipContent>
      {children}
    </TooltipContent>
  </Tooltip>
</TooltipProvider>
```

### Usage in Forms
```jsx
<Label>
  Feature Name
  <InfoTooltip>
    Explanation of what this feature does
  </InfoTooltip>
</Label>
```

---

## 📊 Before & After Comparison

### Before: Plain Labels
```
Pass Query Parameters
Include URL parameters in redirect
[Toggle]
```

### After: With Tooltips
```
Pass Query Parameters  ℹ️
Include URL parameters in redirect
[Toggle]

(Hover ℹ️ for detailed explanation)
```

---

### Before: Basic File Input
```
HTML File
[Choose File] No file chosen [Upload]
```

### After: Enhanced Upload Area
```
HTML File

┌─────────────────────────────────┐
│         📤 Upload Icon          │
│  Click to upload or drag & drop │
│      HTML files only (10MB)     │
└─────────────────────────────────┘

[Upload Template]
```

---

## 🎉 User Experience Improvements

### Discovery
- ✅ Users can learn features without leaving the page
- ✅ No need to search documentation
- ✅ Contextual help exactly where needed

### Confidence
- ✅ Clear explanations reduce errors
- ✅ Visual feedback confirms actions
- ✅ Warnings prevent mistakes

### Efficiency
- ✅ Faster onboarding
- ✅ Less support needed
- ✅ Fewer configuration errors

---

**The UI is now more intuitive, helpful, and professional! 🎨**
