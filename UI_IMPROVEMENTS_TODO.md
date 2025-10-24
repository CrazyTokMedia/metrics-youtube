# UI Improvements TODO

## Completed ✅
- Added "Change" buttons next to PRE and POST period headers
- Fixed date formatting to DD/MM/YY display format
- Added separate "Copy PRE for Airtable" and "Copy POST for Airtable" buttons
- Implemented Airtable-compatible copy format (tab-separated: CTR\tViews\tAWT\tConsumption)
- Applied design principles from design_rules/:
  - Added depth with layered shadows (light inset on top, dark below)
  - Clear visual hierarchy
  - Made clickable elements obviously clickable (underlined text, depth on hover)
  - Smooth transitions and hover effects

## Pending Tasks 📋

### Design Principles Import
- Need to review and apply design principles from recent project
- Design rules are located in `design_rules/`:
  - `golden-rule.md` - Don't make me think principle
  - `fix-boring-uis.md` - Add depth with layers and shadows
  - `typography.md` - Text hierarchy
  - `responsive-design.md` - Mobile-first approach
  - `top-tier-websites.md` - Best practices

### Future Enhancements
1. Review other UI components for depth improvements
2. Ensure all interactive elements have clear affordances
3. Test on mobile devices for responsive behavior
4. Consider adding visual feedback for all state changes

## Airtable Integration Details

### Current Copy Format
When user clicks "Copy PRE for Airtable" or "Copy POST for Airtable", the data is copied as:
```
CTR\tViews\tAWT\tConsumption
```

Example:
```
46.5%	1,141	0:18	103%
```

This format can be pasted directly into Airtable cells:
- Column 1: % Pre/Post CTR
- Column 2: # Pre/Post Views
- Column 3: ⏱ Pre/Post AWT
- Column 4: % Pre/Post 30s/3s Consumption

### Screenshots Reference
- PRE fields: `C:\Users\sidro\OneDrive\Pictures\Screenshots 1\Screenshot 2025-10-24 141600.png`
- POST fields: `C:\Users\sidro\OneDrive\Pictures\Screenshots 1\Screenshot 2025-10-24 141625.png`

## Notes
- Date display format: DD/MM/YY (e.g., "24/10/25")
- Internal date format remains YYYY-MM-DD for calculations
- Change buttons scroll to treatment date input for easy modification
- Copy buttons show "Copied!" feedback with animation
