

## Plan: Fix Deals ListView Layout & Scrollbar Issues

Based on comparing the Deals ListView with the Action Items module, I've identified the following issues and improvements needed:

### Issues Identified

1. **Horizontal scrollbar visible but not functional**
   - The table uses `overflow-x-scroll` but the nested div structure causes the scrollbar to appear without content to scroll
   - The Table component wrapper adds its own `overflow-auto` creating nested scroll containers

2. **Extra padding and spacing vs Action Items**
   - Deals uses default `p-4` cell padding (16px)
   - Action Items uses compact `py-2 px-3` (8px vertical, 12px horizontal)
   - Header row heights are inconsistent

3. **Nested scroll containers**
   - ListView has `overflow-y-auto overflow-x-scroll` on outer div
   - Table component adds another `overflow-auto` wrapper
   - This creates double scrollbars and scroll conflicts

4. **Missing compact row styling**
   - Action Items rows have `py-2` for compact height
   - Deals rows use default padding making them taller

5. **Header styling differences**
   - Action Items: `h-11 py-3 px-3` with `border-b-2`
   - Deals: inconsistent with default styling

### Changes

**File: `src/components/ListView.tsx`**

1. **Fix scroll container structure** (lines 394-396)
   - Remove `overflow-x-scroll` from outer div
   - Let table's internal wrapper handle scrolling
   - Change to `overflow-auto` for proper scroll behavior

2. **Update table container** (lines 396-397)
   - Remove the `min-w-max` which forces horizontal scroll
   - Use proper table-layout for column widths

3. **Reduce filter bar padding** (line 345)
   - Already matches Action Items (`px-6 py-3`) - no change needed

4. **Compact header cells** (lines 400-442)
   - Add `py-3 px-3 h-11` to match Action Items
   - Reduce checkbox column width from `w-12` to `w-10`

5. **Compact body cells** (lines 460-522)
   - Change cell padding from default `p-4` to `py-2 px-3`
   - Reduce row height for more compact display

6. **Fix pagination footer alignment** (lines 543-590)
   - Already consistent with Action Items

### Technical Details

```text
Before (ListView line 394-397):
+------------------------------------------+
|  overflow-y-auto overflow-x-scroll       |
|  +--------------------------------------+|
|  |  Table (w-full min-w-max)            ||
|  |  + internal overflow-auto wrapper    ||
|  +--------------------------------------+|
+------------------------------------------+

After:
+------------------------------------------+
|  overflow-auto (single scroll container) |
|  +--------------------------------------+|
|  |  Table (w-full)                      ||
|  |  (no internal wrapper interference)  ||
|  +--------------------------------------+|
+------------------------------------------+
```

### Files to Modify

| File | Changes |
|------|---------|
| `src/components/ListView.tsx` | Fix scroll container, compact cell padding, align with Action Items styling |

### Summary of Styling Alignment

| Element | Current (Deals) | Target (Action Items) |
|---------|-----------------|----------------------|
| Header height | Default | `h-11` |
| Header padding | Default (`px-4`) | `py-3 px-3` |
| Cell padding | Default (`p-4`) | `py-2 px-3` |
| Checkbox column | `w-12` | `w-10` |
| Scroll container | Double nested | Single `overflow-auto` |
| Table width | `w-full min-w-max` | `w-full` |

