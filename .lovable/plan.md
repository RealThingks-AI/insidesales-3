
# Sticky Details Panel Aligned with Expanded Card

## Overview
When a deal card is expanded, the details panel must appear **inline with the selected card** -- not at the top of the column. When scrolling up/down, the details panel should stay anchored at the same vertical position as the expanded card, scrolling naturally with it.

## Current Problems
1. `cardTopOffset` is measured via DOM after layout, but the measurement is unreliable and doesn't update on scroll
2. `marginTop` on the details panel is static -- it doesn't follow the card during scroll
3. The scroll logic tries to center things but doesn't reliably put the stage column at top-left

## Solution

The key insight from the user's diagrams: the details panel should start at the **same row as the expanded card** within the stage column, not at the top of the details column. When scrolling, both the card and details panel scroll together naturally.

### Approach: Split the details column into "before-card spacer" + "details panel"

Instead of using `marginTop` or `sticky`, we render the details column content as:
1. A transparent spacer div whose height equals the vertical offset of the expanded card within its stage column
2. The actual details panel below the spacer

This way, the details panel is always vertically aligned with the expanded card and scrolls naturally with it -- no sticky positioning needed.

### File Changes

#### 1. `src/components/KanbanBoard.tsx`

**Remove `cardTopOffset` state and its measurement `useEffect`** (lines 63, 480-502). Replace with a simpler approach:

**Add a ref-based offset calculation:** Instead of storing `cardTopOffset` in state (which causes re-renders and timing issues), calculate the offset directly in the render by measuring the index of the expanded card within its stage's deal list. Use the card index to compute the spacer height.

**Update `performLayoutSafeScroll`:**
- Horizontal: scroll so the expanded stage column's left edge is at position 0 (left edge of container)
- Vertical: scroll so the expanded card is near the top of the viewport (below sticky header)
- Simplified logic: `targetScrollLeft = stageEl.offsetLeft - paddingMargin`, `targetScrollTop = cardEl.offsetTop - stickyHeaderHeight - paddingMargin`

**Update `getGridColumns`:**
- Keep expanded stage at `minmax(280px, 280px)`
- Change details panel to `minmax(600px, 2fr)` to fill roughly half the viewport
- Other stages remain at `minmax(240px, 1fr)`

**Update details panel rendering** (lines 786-803):
- Remove `topOffset={cardTopOffset}` prop
- Instead, calculate the card's position within the stage column and render a spacer div before the `InlineDetailsPanel`
- Use a ref callback to measure the expanded card's `offsetTop` relative to the stage column, then set that as the spacer height

#### 2. `src/components/kanban/InlineDetailsPanel.tsx`

**Remove `topOffset` prop entirely.** Simplify the component:
- Remove `marginTop` styling
- Remove `maxHeight` calculation based on `topOffset`
- Keep `minHeight: 400px`
- Add `overflow-y: auto` and a reasonable `maxHeight` (e.g., `calc(100vh - 180px)`) so the panel is independently scrollable if content is tall
- Remove animation classes (entering/exiting) -- the spacer approach handles visual alignment

#### 3. `src/components/kanban/AnimatedStageHeaders.tsx`

**Update grid column sizing** to match the new `getGridColumns` values (change `minmax(800px, 3fr)` to `minmax(600px, 2fr)` to stay in sync).

### Scroll Behavior

**On expand:**
1. Grid restructures with the details column inserted after the expanded stage
2. A spacer div pushes the details panel down to align with the expanded card
3. Container scrolls so the expanded stage is at the left edge and the expanded card is near the top
4. Both the card and details panel are visible side-by-side

**On scroll up:** Cards above the expanded card become visible. The details panel scrolls down naturally (it's anchored to the card's position in the DOM).

**On scroll down:** Cards below become visible. The details panel scrolls up naturally with the card.

This matches the user's diagrams exactly -- the details panel always starts inline with the expanded card.

### Technical Details

**Spacer height calculation:**
```
// In the render, before InlineDetailsPanel:
const cardEl = scrollContainerRef.current?.querySelector(`[data-deal-id="${expandedDealId}"]`);
const stageCol = scrollContainerRef.current?.querySelector(`[data-stage-column="${expandedStage}"]`);
// spacerHeight = cardEl.offsetTop - stageCol.offsetTop (adjusted for padding)
```

Since DOM measurements in render aren't ideal, we'll use a `useEffect` + state approach but simplified: measure once after `expanding` transition starts, store as `detailsSpacerHeight`, and use it to render the spacer.

**Files modified:**
- `src/components/KanbanBoard.tsx` -- scroll logic, grid sizing, spacer rendering
- `src/components/kanban/InlineDetailsPanel.tsx` -- remove offset props, simplify styling
- `src/components/kanban/AnimatedStageHeaders.tsx` -- sync header grid sizing
