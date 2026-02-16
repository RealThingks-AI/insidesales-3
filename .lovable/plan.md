
# Fix Plus Icon Overlapping Record Table

## Problem
The floating (+) buttons in both History and Action Items sections are positioned absolutely inside the scroll container, causing them to overlap/intersect with the table records.

## Solution
Move the (+) buttons outside the scroll container and place them below each section, so they never overlap with table content.

## Technical Details

### File: `src/components/DealExpandedPanel.tsx`

**History section (around lines 616-627):**
- Move the `<button>` element outside the scrollable `div` (the one with `h-[280px] overflow-y-auto relative`)
- Place it after the scroll container but still inside the section wrapper
- Change positioning from `absolute bottom-2 right-2` to a flex-aligned button at the bottom-right of the section
- Use `flex justify-end mt-1` wrapper or similar to position it neatly below the table

**Action Items section (around lines 768-778):**
- Apply the same change: move the button outside the scroll container
- Position it below the table using a simple flex wrapper

**Both buttons:**
- Remove `absolute` positioning and `z-20`
- Wrap each in a `<div className="flex justify-end px-2 py-1">` placed after the scroll container's closing `</div>`
- Keep the circular styling (`h-7 w-7 rounded-full bg-primary ...`) but without absolute positioning
