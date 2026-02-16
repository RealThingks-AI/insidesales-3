

## Plan: Simplify History Details Modal

### Changes to `src/components/DealExpandedPanel.tsx`

**1. Update section (manual entries / logs)**
- Show only three fields: **Updated By**, **Date**, and **Message**
- Change date format from `PPpp` (e.g., "Feb 16, 2026, 1:51:36 PM") to `HH:mm DD-MM-YY` (e.g., "13:51 16-02-26")
- Remove the entire "Field Changes" table block (lines 824-858)
- Remove the extra formatted details sections (lines 860-868) that show record_data/old_data/updated_fields

**2. Action Item section**
- Show only four fields: **Updated By**, **Date**, **Action Item Name**, **Status**
- Use the same `HH:mm dd-MM-yy` date format
- Remove the field changes table for action item entries as well

**3. Cleanup**
- The conditional blocks for `renderFormattedDetails`, `changes.length`, and the Field Changes table will all be removed from the dialog
- The dialog content will be a clean, simple layout with just the specified fields

### Technical Detail

The date format string for `date-fns` will be `HH:mm dd-MM-yy` which produces output like `13:51 16-02-26`.

### File Modified

| File | Change |
|------|--------|
| `src/components/DealExpandedPanel.tsx` | Simplify History Details dialog: remove field changes table, show only specified fields per entry type, standardize date format |

