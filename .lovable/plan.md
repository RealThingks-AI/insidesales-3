

# Refactor: Details Panel - Clean Up, Auto-scroll, Add Button and Section Logic

## Overview

Streamline the expanded details panel by replacing the expand icon, cleaning up columns, fixing sort/scroll behavior, separating completed action items into History, filtering history to only manual logs and status changes, and adding a unified "Add" button with a modal.

---

## 1. Replace "Expand Details" icon (DealCard.tsx)

- Replace `PanelRightOpen` import with `Activity` from lucide-react
- Update the expand button icon from `<PanelRightOpen>` to `<Activity>`

## 2. Sort newest-at-bottom + auto-scroll (DealExpandedPanel.tsx)

- Change `historySortDirection` default from `'desc'` to `'asc'` (already `'asc'`, but ensure DB query uses `ascending: true` instead of `false`)
- Change audit log query to `order('created_at', { ascending: true })` so newest items are at the bottom
- Sort action items by `created_at` ascending
- Add `useRef` refs for both scroll containers (`historyScrollRef`, `actionItemsScrollRef`)
- Add `useEffect` that scrolls both containers to bottom (`scrollTop = scrollHeight`) whenever data updates
- Remove all sort button wrappers and sort icon renders from column headers -- keep plain text headers only
- Remove `handleHistorySort`, `getHistorySortIcon`, `handleActionItemSort`, `getActionItemSortIcon` functions and related state (`historySortField`, `historySortDirection`, `actionItemSortField`, `actionItemSortDirection`)

## 3. Completed action items move to History section (DealExpandedPanel.tsx)

- Split `actionItems` into two filtered lists:
  - `activeActionItems`: status is "Open" or "In Progress" (displayed in Action Items section)
  - `completedActionItems`: status is "Completed" or "Cancelled" (merged into History section)
- In History, merge `filteredSortedLogs` with `completedActionItems` formatted as history-like entries:
  - `message`: "Task Title - Completed" (or "- Cancelled")
  - `created_at`: from the action item's `created_at`
  - `user_id`: from `assigned_to`
- Sort merged list by `created_at` ascending (newest at bottom)
- Action Items section only renders `activeActionItems`

## 4. History section -- only show manual logs and action item status updates (DealExpandedPanel.tsx)

- Filter `auditLogs` to only include entries where:
  - `details.manual_entry === true` (user-added logs: Note, Call, Meeting, Email), OR
  - `details.action_item_title` exists (action item status change logs)
- This excludes all system-generated deal field change logs (create, update, stage changes, etc.)

## 5. History Section column changes

**Remove**: Type column (the colored dot + label column)
**Keep**: #, Changes, By, Time, Eye icon

New header row (plain text, no sort buttons):
```
| # | Changes | By | Time | (eye) |
```

Column widths adjusted: Changes gets the space freed from removing Type.

## 6. Action Items Section column changes

**Remove**: Priority column (the priority dot column)
**Keep**: #, Task, Assigned, Due, Status, Actions (...)

New header row (plain text, no sort buttons):
```
| # | Task | Assigned | Due | Status | ... |
```

## 7. Status change log format update (DealExpandedPanel.tsx)

In `handleStatusChange`, update the log message format from:
```
"Action item status changed: OldStatus -> NewStatus"
```
to:
```
"TaskTitle -> NewStatus"
```

This shows only the task name and the updated status (not the old status).

## 8. Date format update

- Verify `formatHistoryDateTime` uses `'HH:mm dd-MM-yy'` (already correct)
- Update action item due date display from `format(date, 'dd-MMM-yy')` to `format(date, 'HH:mm dd-MM-yy')` where time is available; for date-only values, use `'dd-MM-yy'`

## 9. Add "Add" button in Details header (AnimatedStageHeaders.tsx)

- Replace the "Details" text in the details header with an "Add" button (`Plus` icon + "Add" text)
- Add a new prop `onAddDetail` callback to `AnimatedStageHeadersProps`
- Wire the button click to `onAddDetail()`

## 10. Unified "Add Detail" Modal (DealExpandedPanel.tsx)

- Add new state: `addDetailOpen` (boolean), `addDetailType` ('log' | 'action_item')
- Replace existing "Add Log" dialog with a unified modal:
  - **Type selector**: Dropdown with "Log" and "Action Item" options
  - **If "Log" selected**: Show log type dropdown (Note only, simplified) + description textarea
  - **If "Action Item" selected**: Show Title field (required), with a collapsible "More options" section (collapsed by default) containing: Assigned To dropdown, Due Date input, Priority dropdown, Status dropdown
- On save:
  - Log: insert into `security_audit_log` with `manual_entry: true`
  - Action Item: insert into `action_items` table with `module_type: 'deals'` and `module_id: deal.id`
- Remove the old `addLogOpen` state and dialog

## Files Modified

1. **`src/components/DealCard.tsx`** -- Replace `PanelRightOpen` with `Activity` icon
2. **`src/components/DealExpandedPanel.tsx`** -- All section logic changes: filtering, sorting, auto-scroll, column cleanup, merged history, unified Add modal, status change format, date format
3. **`src/components/kanban/AnimatedStageHeaders.tsx`** -- Replace "Details" header with "Add" button, add `onAddDetail` prop

## Technical Details

**Auto-scroll implementation:**
```tsx
const historyScrollRef = useRef<HTMLDivElement>(null);
const actionItemsScrollRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  setTimeout(() => {
    if (historyScrollRef.current) {
      historyScrollRef.current.scrollTop = historyScrollRef.current.scrollHeight;
    }
    if (actionItemsScrollRef.current) {
      actionItemsScrollRef.current.scrollTop = actionItemsScrollRef.current.scrollHeight;
    }
  }, 100);
}, [mergedHistory, activeActionItems]);
```

**History filtering (manual logs + status changes only):**
```tsx
const manualAndStatusLogs = useMemo(() => {
  return auditLogs.filter(log => {
    const details = log.details as any;
    return details?.manual_entry === true || details?.action_item_title;
  });
}, [auditLogs]);
```

**Merged history with completed action items:**
```tsx
const mergedHistory = useMemo(() => {
  const completedAsHistory = completedActionItems.map(item => ({
    id: `completed-${item.id}`,
    message: `${item.title} - ${item.status}`,
    user_id: item.assigned_to,
    created_at: item.created_at,
    isCompletedAction: true,
  }));
  return [...mappedLogs, ...completedAsHistory]
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}, [manualAndStatusLogs, completedActionItems]);
```

**Status change log format:**
```tsx
// In handleStatusChange:
message: `${item?.title} → ${status}`,
```

**Add Detail Modal type switching:**
```tsx
<Select value={addDetailType} onValueChange={v => setAddDetailType(v)}>
  <SelectItem value="log">Log</SelectItem>
  <SelectItem value="action_item">Action Item</SelectItem>
</Select>

{addDetailType === 'action_item' && (
  <>
    <Input placeholder="Title" value={actionTitle} ... />
    <Collapsible>
      <CollapsibleTrigger>More options</CollapsibleTrigger>
      <CollapsibleContent>
        {/* Assigned To, Due Date, Priority, Status */}
      </CollapsibleContent>
    </Collapsible>
  </>
)}
```

