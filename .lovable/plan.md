
# Consolidate Leads into Deals Module - Lead Stage

## Overview
The goal is to retire the standalone Leads module and unify everything under the Deals module's "Lead" stage. All 14 existing lead records will be migrated to deals. The Lead stage form will be redesigned to use a "Contact Name" searchable dropdown (instead of "Lead Name") that auto-fills fields from the contacts table. The Leads sidebar item will be hidden.

---

## Field Mapping Analysis

### Leads Table Fields → Deals Lead Stage Fields

| Leads Table Field | Deals Table Field | Action |
|---|---|---|
| `lead_name` | `lead_name` (text) | Map directly — stores the contact/person name |
| `company_name` | `customer_name` | Map directly |
| `country` | `region` | Map directly (leads stores EU/US/ASIA in `country`) |
| `created_by` (UUID) | `lead_owner` (text) | Resolve UUID to display name |
| `created_by` | `created_by` | Map directly |
| `created_time` | `created_at` | Map directly |
| `description` | `internal_comment` | Map to internal comment |
| `lead_status` | — | Not applicable in deals, skip |
| `email`, `phone_no`, `position`, `linkedin`, `website`, `industry`, `contact_source` | — | Contact-level data, not stored in deals; auto-filled from Contact selection for reference only |
| — | `project_name` | New field specific to deals |
| — | `priority` | New field specific to deals |
| — | `deal_name` | Auto-generate from `lead_name` or `project_name` |

### Contact Fields (auto-fill when Contact is selected)
When a Contact Name is chosen, these fields will be auto-filled in the form for reference:
- `contact_name` → `lead_name` field in deal
- `company_name` → `customer_name` field (Account) in deal
- `region` → `region` field in deal
- `position`, `email`, `phone_no` → displayed read-only in the form as context (not stored in deals table, just surfaced in UI)

---

## Changes Required

### 1. Database Migration - Migrate Lead Records to Deals
Create a SQL migration that inserts all existing leads as deals in the "Lead" stage:
```sql
INSERT INTO deals (
  deal_name, stage, project_name, customer_name, lead_name,
  region, internal_comment, created_by, created_at, modified_at,
  lead_owner
)
SELECT
  COALESCE(l.lead_name, l.company_name, 'Unnamed') as deal_name,
  'Lead' as stage,
  COALESCE(l.lead_name, l.company_name, 'Unnamed') as project_name,
  l.company_name as customer_name,
  l.lead_name as lead_name,
  l.country as region,
  l.description as internal_comment,
  l.created_by,
  l.created_time,
  l.created_time,
  COALESCE(p.full_name, '') as lead_owner
FROM leads l
LEFT JOIN profiles p ON p.id = l.created_by
WHERE NOT EXISTS (
  -- Avoid duplicating already-converted leads
  SELECT 1 FROM deals d WHERE d.lead_name = l.lead_name 
    AND d.customer_name = l.company_name 
    AND d.stage = 'Lead'
);
```
This is a one-time data migration. The `leads` table is kept intact (data not deleted) for safety — the Lead module is just hidden from the UI.

### 2. Hide the Leads Module from UI

**`src/App.tsx`**
- Remove the `/leads` route (or redirect it to `/deals`)

**`src/components/AppSidebar.tsx`**
- Remove the "Leads" menu item from `menuItems` array

### 3. Create a New `ContactSearchableDropdown` Component
**New file: `src/components/ContactSearchableDropdown.tsx`**
- Mirrors `LeadSearchableDropdown` but queries the `contacts` table
- Returns: `id`, `contact_name`, `company_name`, `email`, `phone_no`, `position`, `region`, `linkedin`
- When a contact is selected, triggers a callback `onContactSelect(contact)` with full contact data for auto-fill

### 4. Update `FormFieldRenderer.tsx`
- Replace the `lead_name` case (which used `LeadSearchableDropdown`) with `ContactSearchableDropdown`
- Rename the handler from `handleLeadSelect` to `handleContactSelect`
- Update auto-fill logic: when a contact is selected:
  - `lead_name` ← `contact.contact_name`
  - `customer_name` ← `contact.company_name`
  - `region` ← `contact.region`
  - `lead_owner` ← resolve from current user (unchanged)
- Update field label for `lead_name` from "Lead Name" to "Contact Name"
- Remove the `fetchLeadOwners` function (which pulled from leads table) — keep Lead Owner as a plain text field

### 5. Update `LeadStageForm.tsx`
- Fields stay the same: `['project_name', 'lead_name', 'customer_name', 'region', 'lead_owner', 'priority']`
- The `lead_name` field now renders `ContactSearchableDropdown` (via the updated `FormFieldRenderer`)
- Pass `onContactSelect` callback (renamed from `onLeadSelect`)

### 6. Update `DealForm.tsx`
- Rename `onLeadSelect` prop references to `onContactSelect` throughout
- Keep the same auto-fill behavior for `customer_name`, `region`, `lead_owner`

### 7. Update `DealStageForm.tsx`
- Pass renamed `onContactSelect` prop down to `LeadStageForm`

### 8. Update the `DealExpandedPanel.tsx` Kanban Card Display
- The "Lead" label on deal cards currently shows `lead_name` which was a lead record
- Keep showing `lead_name` field value (it now stores the contact person name)

### 9. Remove Leads from `LeadSearchableDropdown` usage in `FormFieldRenderer`
- The `LeadSearchableDropdown` component can remain for any other places it's used, but won't be used in `FormFieldRenderer` for the `lead_name` field anymore

---

## Important Fields for the Lead Stage Form (New Deal Creation)

When creating a new deal at Lead stage, show only these important fields:
1. **Project Name** (text input) — required
2. **Contact Name** (searchable dropdown → contacts table) — replaces "Lead Name" dropdown
3. **Account** (`customer_name`) — auto-filled from Contact, still editable
4. **Region** — auto-filled from Contact, still editable
5. **Lead Owner** — auto-filled with current user name, editable
6. **Priority** — dropdown (1-5)

---

## Technical File Changes Summary

| File | Change Type | Description |
|---|---|---|
| `src/components/AppSidebar.tsx` | Edit | Remove Leads menu item |
| `src/App.tsx` | Edit | Remove/redirect /leads route |
| `src/components/ContactSearchableDropdown.tsx` | New | Contact searchable dropdown component |
| `src/components/deal-form/FormFieldRenderer.tsx` | Edit | Use ContactSearchableDropdown for lead_name, rename handler, update label, fix fetchLeadOwners |
| `src/components/deal-form/LeadStageForm.tsx` | Edit | Rename prop from onLeadSelect to onContactSelect |
| `src/components/DealForm.tsx` | Edit | Rename onLeadSelect to onContactSelect |
| `src/components/deal-form/DealStageForm.tsx` | Edit | Pass renamed prop |
| Database migration | New | Insert existing leads as deals with stage='Lead' |

---

## Data Safety Note
The existing `leads` table data is NOT deleted. All 14 lead records are copied into the `deals` table. The Leads page is simply hidden from the UI. If needed in the future, the data can be restored by re-enabling the route. The 4 leads already marked `lead_status = 'Converted'` will still be migrated (they represent real historical records and should appear in the deals pipeline).
