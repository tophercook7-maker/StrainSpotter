# 📸 Screenshot Guide for PR

## Required Screenshots

Take these screenshots to include in the PR:

### 1. **Strain Browser - Grid View** (`strain-browser-grid.png`)
**How to capture:**
1. Login to your app
2. Navigate to Garden
3. Click "Strain Browser"
4. Make sure you have several strains visible in the grid
5. Take a full-screen screenshot showing:
   - Search bar at top
   - Type filter dropdown
   - Grid of strain cards (at least 6-8 visible)
   - Hover effect on one card (optional)

**Key elements to show:**
- Search functionality
- Type filter
- Strain cards with names, types, THC%
- Glassmorphism styling
- Green theme

---

### 2. **Strain Details - Overview Tab** (`strain-details-overview.png`)
**How to capture:**
1. Click on any strain card
2. Modal should open with "Overview" tab selected
3. Take screenshot showing:
   - Strain name and type chip at top
   - Description text
   - Effects chips (green)
   - Flavors chips (orange)
   - THC/CBD percentage boxes

**Key elements to show:**
- Modal header with strain name
- Tab navigation (Overview selected)
- Effects and flavors
- THC/CBD stats

---

### 3. **Strain Details - Seed Vendors Tab** (`strain-details-vendors.png`)
**How to capture:**
1. With strain details modal open
2. Click "Seed Vendors" tab
3. Take screenshot showing:
   - List of vendors
   - Vendor names with verified badges
   - Pricing information
   - Country and rating
   - "Visit Store" links

**Key elements to show:**
- Vendor list items
- Verified badges (blue checkmarks)
- Pricing ($XX for X seeds)
- Ratings

---

### 4. **Strain Details - Dispensaries Tab** (`strain-details-dispensaries.png`)
**How to capture:**
1. With strain details modal open
2. Click "Dispensaries" tab
3. Take screenshot showing:
   - List of dispensaries
   - Dispensary names with verified badges
   - Location (city, state)
   - Pricing tiers (eighth, ounce)
   - Ratings

**Key elements to show:**
- Dispensary list items
- Location icons and text
- Pricing information
- Verified badges

---

### 5. **Strain Details - Reviews Tab** (`strain-details-reviews.png`)
**How to capture:**
1. With strain details modal open
2. Click "Reviews" tab
3. Take screenshot showing:
   - User reviews (if any exist)
   - Rating display
   - Review text
   - Timestamps

**Key elements to show:**
- Review cards
- Rating system
- Dates
- Or "No reviews yet" message if empty

---

### 6. **Mobile Responsive View** (`strain-browser-mobile.png`)
**How to capture:**
1. Open browser DevTools (F12 or Cmd+Option+I)
2. Click device toolbar icon (or Cmd+Shift+M)
3. Select iPhone or Android device
4. Navigate to Strain Browser
5. Take screenshot showing:
   - Mobile layout
   - Responsive grid (1-2 columns)
   - Touch-friendly buttons
   - Proper spacing

**Key elements to show:**
- Mobile-optimized layout
- Readable text
- Proper card sizing
- Navigation works

---

## Screenshot Tips

### **Quality:**
- Use full resolution (no scaling down)
- Ensure good lighting/contrast
- Make sure text is readable
- Capture at 1920x1080 or higher

### **Content:**
- Use real data (not Lorem Ipsum)
- Show multiple items when possible
- Highlight interactive elements
- Show hover states if possible

### **Tools:**
- **Mac:** Cmd+Shift+4 (select area) or Cmd+Shift+3 (full screen)
- **Windows:** Windows+Shift+S (Snipping Tool)
- **Browser:** DevTools screenshot feature
- **Chrome Extension:** Awesome Screenshot, Nimbus

### **Editing (Optional):**
- Add arrows or highlights to key features
- Crop to relevant area
- Add border for clarity
- Compress for web (PNG or JPG)

---

## After Taking Screenshots

1. Save all screenshots to `/screenshots/` folder
2. Name them exactly as shown above
3. Verify they're referenced correctly in `PR_DESCRIPTION.md`
4. Commit and push:
   ```bash
   git add screenshots/
   git commit -m "docs: Add PR screenshots"
   git push
   ```

---

## Alternative: Use Placeholder Images

If you want to create the PR now and add screenshots later:

1. Replace screenshot paths in `PR_DESCRIPTION.md` with:
   ```markdown
   ![Strain Browser Grid](https://via.placeholder.com/800x600/7cb342/ffffff?text=Strain+Browser+Grid)
   ```

2. Add a note:
   ```markdown
   > 📸 **Note:** Screenshots will be added before final review
   ```

---

## Quick Screenshot Checklist

- [ ] `strain-browser-grid.png` - Grid view with search/filter
- [ ] `strain-details-overview.png` - Overview tab
- [ ] `strain-details-vendors.png` - Seed vendors tab
- [ ] `strain-details-dispensaries.png` - Dispensaries tab
- [ ] `strain-details-reviews.png` - Reviews tab
- [ ] `strain-browser-mobile.png` - Mobile responsive view

Once all screenshots are captured, you're ready to create the PR! 🎉

