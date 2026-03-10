

## Compact Notifications Section

### Problem
Toggle rows span the full width of the container, creating excessive distance between labels and switches. Four separate bordered cards add visual noise. The layout feels stretched and sparse.

### Changes — `src/components/settings/account/NotificationsSection.tsx`

**1. Replace full-width toggle rows with a compact inline grid**
- Use a grid layout (`grid-cols-2` or `grid-cols-3`) where each toggle is a small inline card: label on the left, switch immediately to the right, all within a tight `px-3 py-2` container with a subtle border/rounded style.
- This cuts the label-to-switch distance dramatically.

**2. Consolidate sections, remove noise**
- Remove the repeated `SectionHeader` with icon + description pattern — use simple bold text labels instead (no icons, no "— description" text).
- Merge "Module Notifications" and "Event Triggers" into a single "Notifications" grid since they serve the same purpose (toggle on/off).
- Keep "Delivery Methods" (Email/In-App) and "Frequency & Reminders" as compact inline rows at the top.
- Remove divider lines between rows.

**3. Resulting layout**
```text
Delivery:  [Email ○] [In-App ○]     Frequency: [Instant v]  Reminder: [4:00 PM v]

Modules:   [Leads ○] [Contacts ○] [Accounts ○]

Events:    [Lead Assigned ○] [Deal Updates ○] [Action Reminders ○]
           [Meeting Reminders ○] [Weekly Digest ○]
```

Each `[Label ○]` is a small bordered chip/card (~160-200px) with the label and switch side-by-side with minimal gap.

**4. Verify save logic**
- The auto-save debounce logic and Supabase upsert remain unchanged — just the UI presentation changes.
- All preference keys stay the same, ensuring existing data works.

### File
| File | Action |
|---|---|
| `src/components/settings/account/NotificationsSection.tsx` | Rewrite layout to compact grid of small toggle cards |

