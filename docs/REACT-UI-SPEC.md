# LOANSYSTEM React UI Specification

The canonical, code-extracted description of the React app's interface —
every layout, element order, label, color (Tailwind class -> hex, dark AND
light), format, and editability rule. Precise enough to rebuild the UI in
another toolkit (the Access front-end builder consumes this) and the
reference for keeping any port faithful.

Extracted from source 2026-08 (post Phase 1 alignment). Regenerate after
major UI changes.

---


# Part 1 — Theme Tokens & Page Chrome

> The app is a dark-mode-default (state initialized to 'dark') loan-servicing UI whose chrome is: a 48px header bar ("LOAN" + green "SYSTEM" branding left, 4 icon buttons right), a 36px menu bar with 8 text buttons, then a LoanTable, a 13-tab TabNavigation strip (active tab = green text + 2px green bottom border), and the tab content panel — all stacked in a min-h-screen container. All colors come from a single ThemeStyles token map in src/context/ThemeContext.tsx with dark/light Tailwind class pairs.

# GUI-V7 Visual Chrome Spec

Source files: `/home/user/GUI-V7/src/context/ThemeContext.tsx`, `/home/user/GUI-V7/src/components/layout/Header.tsx`, `/home/user/GUI-V7/src/components/layout/MenuBar.tsx`, `/home/user/GUI-V7/src/components/layout/TabNavigation.tsx`, `/home/user/GUI-V7/src/App.tsx`, `/home/user/GUI-V7/src/data/constants.ts`.

Default theme: **dark** (`useState<Theme>('dark')`). Theme toggled via header button.

## 1. Page structure, top to bottom (App.tsx `AppLayout`)

Root: `<div class="min-h-screen {mainBg}">` — full-viewport-height page, background `mainBg` (dark `#000000`, light `#f9fafb`). Children stacked vertically in normal flow (no flex column on root):

1. **Header** (48px tall bar)
2. **MenuBar** (36px tall bar)
3. Then a conditional branch on `relationshipBrowserOpen`:
   - **If open**: a single `<div class="{sectionBg}">` (dark `#18181b`, light `#ffffff`) containing `<RelationshipBrowser />` (in an ErrorBoundary) — replaces everything below the menu bar.
   - **Else (normal view)**:
     4. **LoanTable** (relationship loans grid)
     5. **TabNavigation** (tab strip)
     6. **Tab content**: `<div class="{sectionBg}">` (dark `#18181b`, light `#ffffff`) wrapping `<TabContent />`, which switch-renders by activeTab: Loan→LoanTab, Borrower→BorrowerTab, Collateral→CollateralTab, Comment→CommentTab, PayHist→PayHistTab, Projections→ProjectionsTab, Overview→OverviewTab, Strategies→StrategiesTab, Report→ReportTab (each in ErrorBoundary). Any other tab (BPOTitleUCC, FinStmts, Tasks, Property) renders a placeholder: `<div class="p-4">` (16px padding) containing centered text `"{activeTab} tab content - Coming soon"` in `text-gray-400` = `#9ca3af` (hardcoded, both themes).

Provider nesting (outermost first): QueryClientProvider → ThemeProvider → LoanProvider → ProjectionProvider → ExitProvider → AppLayout.

## 2. Header (Header.tsx)

Container: `h-12` (48px) · background `headerBg` (dark `#18181b` / light `#ffffff`) · `flex items-center justify-between` · `px-4` (16px horizontal padding) · `border-b` 1px bottom border in `borderColor` (dark `#27272a` / light `#e5e7eb`).

**Left — branding** (`flex items-center space-x-3`, 12px gaps):
- One `<div class="text-lg font-bold">` (18px, weight 700): the text **`LOAN`** in dark `text-white` `#ffffff` / light `text-gray-900` `#111827`, immediately followed (no space) by `<span>` **`SYSTEM`** in dark `text-green-400` `#4ade80` / light `text-green-600` `#16a34a`. Rendered as one word: "LOANSYSTEM" with the second half green.

**Right — icon buttons** (`flex items-center space-x-2`, 8px gaps). Four buttons in order, all identical styling: `p-2` (8px padding) · `rounded` (4px radius) · icon color `textMuted` (dark `#9ca3af` / light `#6b7280`) · hover background `hoverBg` (dark `rgba(39,39,42,0.3)` = zinc-800 @ 30% / light `#f3f4f6`) · hover text `hoverText` (dark `#ffffff` / light `#111827`) · `transition-colors`. Icons are lucide-react at `size={18}`:
1. **Theme toggle** — shows `Sun` in dark mode, `Moon` in light mode; title "Switch to light/dark mode"; onClick toggles theme.
2. **Bell** (aria-label "Notifications")
3. **Settings** (aria-label "Settings")
4. **User** (aria-label "User profile")

## 3. MenuBar (MenuBar.tsx)

Container: `h-9` (36px) · background `menuBg` (dark `rgba(24,24,27,0.5)` = zinc-900 @ 50% / light `#f9fafb`) · `flex items-center` · `px-2` (8px) · `border-b` 1px in `borderColor` (dark `#27272a` / light `#e5e7eb`).

Menu items, in order (plain text buttons, no dropdowns wired):
**File, Home, Create, Import, Export, Reports, Tools, Admin**

Each button: `px-3 py-1` (12px/4px) · `text-sm` (14px) · `rounded` (4px) · color `textMuted` (dark `#9ca3af` / light `#6b7280`) · hover bg `hoverBg` (dark `rgba(39,39,42,0.3)` / light `#f3f4f6`) · hover text `hoverText` (dark `#ffffff` / light `#111827`) · `transition-colors`.

## 4. TabNavigation (TabNavigation.tsx + constants.ts TABS)

Container: `flex` row · `border-b` 1px in `borderColor` (dark `#27272a` / light `#e5e7eb`). No background of its own (page `mainBg` shows through between/behind tabs).

Tab list, exact order (13 tabs, from `TABS` in constants.ts):
**Loan, Borrower, Collateral, Comment, BPOTitleUCC, PayHist, FinStmts, Projections, Strategies, Tasks, Overview, Property, Report**

Every tab button: `px-4 py-2` (16px/8px) · `text-xs` (12px) · `font-medium` (500) · `transition-colors`.

- **Active tab**: background `activeTabBg` (dark `#27272a` zinc-800 / light `#f3f4f6` gray-100) · text `textGreen` (dark `#4ade80` green-400 / light `#16a34a` green-600) · `border-b-2 border-green-500` = 2px bottom border `#22c55e` in **both** themes (the class string also includes `borderColor` but `border-green-500` overrides the color; width comes from `border-b-2`).
- **Inactive tab**: no background class (transparent over page bg) · text `textMuted` (dark `#9ca3af` / light `#6b7280`) · hover bg `hoverBg` (dark `rgba(39,39,42,0.3)` / light `#f3f4f6`) · hover text `hoverText` (dark `#ffffff` / light `#111827`) · no bottom border of its own (container's 1px `borderColor` line runs under it).
- Note: the theme map defines `inactiveTabBg` (dark `rgba(24,24,27,0.5)` / light `#f9fafb`) but TabNavigation does **not** use it — inactive tabs are transparent.

Clicking a tab calls `setActiveTab(tab)` from LoanContext.

## 5. Theme tokens — complete map (ThemeContext.tsx `getThemeStyles`)

Format: token — dark class → hex | light class → hex. Opacity suffixes given as rgba.

**Backgrounds**
- `mainBg` — `bg-black` → `#000000` | `bg-gray-50` → `#f9fafb`
- `headerBg` — `bg-zinc-900` → `#18181b` | `bg-white` → `#ffffff`
- `sectionBg` — `bg-zinc-900` → `#18181b` | `bg-white` → `#ffffff`
- `cardBg` — `bg-zinc-800/50` → `rgba(39,39,42,0.5)` (#27272a @ 50%) | `bg-gray-100` → `#f3f4f6`
- `inputBg` — `bg-zinc-900` → `#18181b` | `bg-white` → `#ffffff`
- `readOnlyBg` — `bg-zinc-700` → `#3f3f46` | `bg-gray-200` → `#e5e7eb`

**Borders**
- `borderColor` — `border-zinc-800` → `#27272a` | `border-gray-200` → `#e5e7eb`
- `inputBorder` — `border-zinc-600` → `#52525b` | `border-gray-300` → `#d1d5db`
- `focusBorder` — `focus:border-green-500` → `#22c55e` | `focus:border-green-600` → `#16a34a`

**Text**
- `textPrimary` — `text-white` → `#ffffff` | `text-gray-900` → `#111827`
- `textSecondary` — `text-gray-300` → `#d1d5db` | `text-gray-700` → `#374151`
- `textMuted` — `text-gray-400` → `#9ca3af` | `text-gray-500` → `#6b7280`
- `textGreen` — `text-green-400` → `#4ade80` | `text-green-600` → `#16a34a`
- `textYellow` — `text-yellow-400` → `#facc15` | `text-yellow-600` → `#ca8a04`
- `textRed` — `text-red-400` → `#f87171` | `text-red-600` → `#dc2626`

**Hover states**
- `hoverDanger` — `hover:text-red-400` → `#f87171` | `hover:text-red-600` → `#dc2626`
- `hoverBg` — `hover:bg-zinc-800/30` → `rgba(39,39,42,0.3)` | `hover:bg-gray-100` → `#f3f4f6`
- `hoverText` — `hover:text-white` → `#ffffff` | `hover:text-gray-900` → `#111827`
- `buttonHover` — `hover:bg-zinc-600` → `#52525b` | `hover:bg-gray-300` → `#d1d5db`

**Active/Selected**
- `selectedBg` — `bg-green-500/10` → `rgba(34,197,94,0.10)` | `bg-green-50` → `#f0fdf4`
- `selectedHoverBg` — `hover:bg-green-500/15` → `rgba(34,197,94,0.15)` | `hover:bg-green-100` → `#dcfce7`
- `activeBg` — `bg-zinc-800` → `#27272a` | `bg-gray-200` → `#e5e7eb`
- `activeTabBg` — `bg-zinc-800` → `#27272a` | `bg-gray-100` → `#f3f4f6`
- `inactiveTabBg` — `bg-zinc-900/50` → `rgba(24,24,27,0.5)` | `bg-gray-50` → `#f9fafb`

**Validation**
- `invalidBorder` — `border-red-500` → `#ef4444` | `border-red-500` → `#ef4444` (same both themes)
- `invalidBg` — `bg-red-500/20` → `rgba(239,68,68,0.20)` | `bg-red-50` → `#fef2f2`
- `validRing` — `ring-green-500` → `#22c55e` | `ring-green-600` → `#16a34a`
- `invalidRing` — `ring-red-500` → `#ef4444` | `ring-red-600` → `#dc2626`

**Special (alerts)**
- `alertBg` — `bg-red-900/20` → `rgba(127,29,29,0.20)` | `bg-red-50` → `#fef2f2`
- `alertBorder` — `border-red-800/30` → `rgba(153,27,27,0.30)` | `border-red-200` → `#fecaca`
- `alertText` — `text-red-400` → `#f87171` | `text-red-600` → `#dc2626`

**Table**
- `tableHeaderBg` — `bg-zinc-800/50` → `rgba(39,39,42,0.5)` | `bg-gray-100` → `#f3f4f6`

**Menu bar**
- `menuBg` — `bg-zinc-900/50` → `rgba(24,24,27,0.5)` | `bg-gray-50` → `#f9fafb`

**Status colors** (helper `getStatusColor(status, theme)`, dark | light):
- `PA` (Performing Asset), `FA` (Fully Performing): green-400 `#4ade80` | green-600 `#16a34a`
- `FC` (Foreclosure): yellow-400 `#facc15` | yellow-600 `#ca8a04`
- `JG` (Judgment): orange-400 `#fb923c` | orange-600 `#ea580c`
- `LT` (Litigation): red-400 `#f87171` | red-600 `#dc2626`
- default: gray-400 `#9ca3af` | gray-600 `#4b5563`

## 6. Editability / behavior notes

- Header theme-toggle button is the only functional header control; Bell/Settings/User buttons have no onClick.
- MenuBar buttons have no onClick handlers (visual only).
- Tabs are fully interactive (setActiveTab); only 9 of 13 tabs have real content — BPOTitleUCC, FinStmts, Tasks, Property show the "Coming soon" placeholder.
- Spacing reference: h-12=48px, h-9=36px, px-4=16px, px-3=12px, px-2=8px, py-2=8px, py-1=4px, p-2=8px, space-x-3=12px, space-x-2=8px, rounded=4px radius, border-b=1px, border-b-2=2px, text-lg=18px, text-sm=14px, text-xs=12px, icon size 18px.

---


# Part 2 — Relationship Loan Table & Relationship Browser

> Extracted the exact UI spec of the relationship LoanTable (label bar, 8-column loan grid, right-hand editable flag panel with 6 red checkboxes, principal-descending ordering, green selection styling) and the RelationshipBrowser (header with counts/back button, search box, 7-column sortable table with red flag badges and a "(current)" marker, row-click loads first loan and closes the browser). All theme tokens resolved to Tailwind classes/hex for both dark and light themes from src/context/ThemeContext.tsx.

# Relationship Loan Table & Relationship Browser — Exact Spec

Source files:
- /home/user/GUI-V7/src/components/layout/LoanTable.tsx
- /home/user/GUI-V7/src/components/layout/RelationshipBrowser.tsx
- /home/user/GUI-V7/src/data/constants.ts (RELATIONSHIP_FLAGS, lines 118–125)
- Theme tokens: /home/user/GUI-V7/src/context/ThemeContext.tsx (lines 9–59)

## Theme token resolution (Tailwind class → hex, dark / light)

| Token | Dark | Light |
|---|---|---|
| headerBg | `bg-zinc-900` #18181b | `bg-white` #ffffff |
| cardBg | `bg-zinc-800/50` #27272a @50% | `bg-gray-100` #f3f4f6 |
| inputBg | `bg-zinc-900` #18181b | `bg-white` #ffffff |
| borderColor | `border-zinc-800` #27272a | `border-gray-200` #e5e7eb |
| inputBorder | `border-zinc-600` #52525b | `border-gray-300` #d1d5db |
| focusBorder | `focus:border-green-500` #22c55e | `focus:border-green-600` #16a34a |
| textPrimary | `text-white` #ffffff | `text-gray-900` #111827 |
| textSecondary | `text-gray-300` #d1d5db | `text-gray-700` #374151 |
| textMuted | `text-gray-400` #9ca3af | `text-gray-500` #6b7280 |
| textGreen | `text-green-400` #4ade80 | `text-green-600` #16a34a |
| textRed | `text-red-400` #f87171 | `text-red-600` #dc2626 |
| hoverBg | `hover:bg-zinc-800/30` | `hover:bg-gray-100` #f3f4f6 |
| buttonHover | `hover:bg-zinc-600` #52525b | `hover:bg-gray-300` #d1d5db |
| selectedBg | `bg-green-500/10` #22c55e @10% | `bg-green-50` #f0fdf4 |
| selectedHoverBg | `hover:bg-green-500/15` | `hover:bg-green-100` #dcfce7 |
| tableHeaderBg | `bg-zinc-800/50` | `bg-gray-100` #f3f4f6 |

---

# 1. LoanTable (relationship loan grid + flag panel)

Outer container: `div` with `headerBg` + `borderColor` + `border-b` (bottom border only).

Loading state: same container plus `p-4`, text `Loading loans...` in `text-sm` + `textMuted`.

## 1.1 Relationship label bar
Container: `px-4 py-2 flex items-center justify-between` (single row, left group + right button).

Left group (`flex items-center`), in order:
1. `Relationship: {currentRelationship || 'None'}` — `<span>` `text-sm font-medium` + `textPrimary`.
2. `({N} loans)` — `<span>` `ml-3 text-xs` + `textMuted`, N = count of loans in the current relationship.
3. `Sort {sortNo}` — `<span>` `ml-3 text-xs` + `textMuted`; rendered ONLY when `relationshipData?.sortNo != null`; has `title="Program-assigned UPB rank within project"`.

Right side — **Browse button**:
- Label: `Browse Relationships`; `aria-label="Browse relationships"`.
- Styling: `px-2.5 py-1 rounded text-xs` + `inputBg` + `inputBorder` + `border` + `textSecondary` + `buttonHover`.
- onClick: `setRelationshipBrowserOpen(true)`.

## 1.2 Layout below the bar
`div.flex` containing: (a) loan table wrapper `overflow-x-auto flex-1`, (b) flag panel `flex-shrink-0` with `border-l` (theme `borderColor`) `px-3 py-2`.

## 1.3 Loan grid
`<table class="w-full text-xs">`. Header row: `borderColor` + `border-b` + `tableHeaderBg`; all `<th>` are `px-3 py-2 font-medium` + `textMuted`.

Columns IN ORDER:

| # | Header | Header align | Field / value | Cell align | Format / cell styling |
|---|---|---|---|---|---|
| 1 | Loan No | left | `loan.mwLoanNo` | left (default) | `font-medium`; color = `textGreen` if row selected, else `textPrimary` |
| 2 | Borrower | left | `loan.borrowerName` | left | `textPrimary` |
| 3 | Orig Balance | right | `loan.origBalance` | right | `$` + `toLocaleString()` (thousands separators, no forced decimals); `textPrimary` |
| 4 | Principal | right | `loan.principal` | right | `$` + `toLocaleString()`; `textPrimary` |
| 5 | Interest | right | `loan.interest` | right | `$` + `toLocaleString()`; `textMuted` (dimmed) |
| 6 | Total | right | computed `loan.principal + loan.interest` | right | `$` + `toLocaleString()`; **GREEN column**: `textGreen` + `font-medium` (always green, regardless of selection) |
| 7 | Rate | center | `loan.intRate` | center | raw value + literal `%` suffix (e.g. `7.25%`); `textPrimary` |
| 8 | PMT | center | `loan.pmt` | center | `$` + `toLocaleString()`; `textPrimary` |

All body `<td>`: `px-3 py-2`.

Row behavior/styling:
- Every row: `borderColor border-b cursor-pointer transition-colors`.
- Selected row (`loan.mwLoanNo === selectedLoan`): background `selectedBg` + `selectedHoverBg` (green tint: dark `bg-green-500/10`, light `bg-green-50`); AND the Loan No cell text turns `textGreen` (green-400 dark / green-600 light). No other cells change on selection.
- Unselected rows: `hoverBg` on hover.
- onClick: `setSelectedLoan(loan.mwLoanNo)`.

**Row ordering rule**: rows = all loans where `loan.relatedLoans === currentRelationship`, sorted by `principal` DESCENDING (`(b.principal||0) - (a.principal||0)`) — the "workbook SORTBY contract". No secondary sort key.

## 1.4 Relationship flag panel
Position: to the RIGHT of the grid (second flex child), `border-l` in `borderColor`, `px-3 py-2`, `flex-shrink-0`. `role="group"`, `aria-label="Relationship flags"`.

Renders one `<label>` per entry of `RELATIONSHIP_FLAGS`, IN THIS ORDER (key → short label → displayed title text):
1. `inBankruptcy` — label `BK` — title **Bankruptcy**
2. `forbearanceFlag` — label `FA` — title **Forbearance**
3. `foreclosureFlag` — label `FC` — title **Foreclosure**
4. `judgmentFlag` — label `JG` — title **Judgment**
5. `litigationFlag` — label `LT` — title **Litigation**
6. `lowYieldAsset` — label `LYA` — title **Low Yield Asset**

Note: the panel displays the flag **`title`** (full word, e.g. "Bankruptcy"), not the short `label`; the same title is also the HTML `title` tooltip and the checkbox `aria-label`.

Each row: `<label class="flex items-center gap-1.5 py-0.5 cursor-pointer text-xs">` containing an `<input type="checkbox">` then the title text.
- Checkbox: `accent-red-600` (#dc2626 accent color); `checked` = stored bit on the relationship entity; `disabled` when no relationship record is loaded.
- Active (checked) state: label text `textRed` (red-400 dark / red-600 light) + `font-medium`.
- Inactive state: label text `textMuted`.
- onChange toggles the stored bit via `updateRelationship({ relatedLoans: currentRelationship, updates: { [key]: !current } })` — editable from any view (stored tblRelationships bits).

---

# 2. RelationshipBrowser

Outer container: `div.p-4.max-w-5xl.mx-auto` (max width 64rem, centered).

Loading state: `div.p-4` with `Loading relationships...` in `textMuted`.

## 2.1 Header area
`div.flex.items-center.justify-between.mb-4`:
- Left block:
  - Title `<h2>`: `Relationships` — `text-xl font-bold` + `textPrimary`.
  - Counts line `<p>`: `text-xs` + `textMuted` + `mt-1`, content: `{N} relationship(s) | Portfolio UPB ${total}` — pluralizes ("relationship"/"relationships"), pipe separator, portfolio UPB = sum of all relationship UPBs, `$` + `toLocaleString()`.
- Right: **Back button** — label `Back to {currentRelationship || 'Workbench'}`; styling `px-3 py-1.5 rounded text-sm` + `inputBg` + `inputBorder` + `border` + `textPrimary` + `buttonHover`; onClick `setRelationshipBrowserOpen(false)`.

## 2.2 Search box
`<input type="text">`, placeholder: `Search by relationship, borrower, or loan number...`; `aria-label="Search relationships"`; styling `inputBg` + `inputBorder` + `border rounded px-3 py-2 w-full text-sm` + `textPrimary` + `focus:outline-none` + `focusBorder` (green focus border) + `mb-4`.
Search semantics: case-insensitive; a relationship row matches if its name contains the term, OR any of its loans' `mwLoanNo` or `borrowerName` contains the term.

## 2.3 Relationship table
Wrapper: `cardBg` + `rounded-lg` + `inputBorder` + `border` + `overflow-x-auto`. Table: `w-full text-sm`, `role="table"`, `aria-label="Relationships"`. Header row: `tableHeaderBg` + `border-b` + `inputBorder`; all `<th>` `px-3 py-2 font-medium` + `textSecondary`; sortable headers also get `cursor-pointer select-none`.

Columns IN ORDER:

| # | Header | Align | Value | Sortable? | Cell format |
|---|---|---|---|---|---|
| 1 | Relationship | left | `row.name` (loans grouped by `relatedLoans`, null → `(Unassigned)`) | YES (`name`) | `font-medium`; `textGreen` if current relationship else `textPrimary`; current row appends `(current)` in `ml-2 text-xs` + `textMuted` |
| 2 | Loans | center | `loanCount` | YES (`loans`) | plain number, `textPrimary` |
| 3 | Borrowers | center | `borrowerCount` (borrowers where `b.relationship === name`) | no | plain number, `textPrimary` |
| 4 | Collateral | center | `collateralCount` (collateral where `c.relatedLoans === name`) | no | plain number, `textPrimary` |
| 5 | Total UPB | right | sum over group loans of `principal + interest + escrowBalance + otherBalance` | YES (`upb`) | `$` + `toLocaleString()`, `font-medium` + `textPrimary` |
| 6 | W.Avg Rate | right | principal-weighted average of `intRate` (0 if total principal is 0) | YES (`rate`) | `toFixed(2)` + `%` (e.g. `7.25%`), `textPrimary` |
| 7 | Flags | left | stored tblRelationships bits mapped to labels | no | badges (below) |

Sorting behavior:
- Default: field `upb`, direction `desc`.
- Sort arrow appended to active header text: ` ▲` for asc, ` ▼` for desc; inactive headers show nothing.
- Clicking the active field toggles direction; clicking a new field sets it active with default direction `asc` for `name`, `desc` for `loans`/`upb`/`rate`.
- Comparators: `name` → `localeCompare`; `loans` → loanCount diff; `rate` → weightedRate diff; `upb` (default case) → totalUPB diff; all multiplied by direction.

Flag badges (column 7), inside `div.flex.flex-wrap.gap-1`:
- Labels derived from stored bits in this order: `inBankruptcy`→Bankruptcy, `foreclosureFlag`→Foreclosure, `litigationFlag`→Litigation, `forbearanceFlag`→Forbearance, `judgmentFlag`→Judgment, `lowYieldAsset`→Low Yield. (Note: this badge order differs from LoanTable's panel order.)
- Badge styling: `px-1.5 py-0.5 rounded text-xs bg-red-600 text-white` (red #dc2626 pill, white text) — same in both themes.
- No flags → single `-` in `text-xs` + `textMuted`.

Current-relationship marker: row where `name === currentRelationship` gets background `selectedBg` + `selectedHoverBg` (green tint), Relationship cell text in `textGreen`, plus the `(current)` suffix span. Other rows: `hoverBg` on hover. All rows: `border-b` + `inputBorder` + `cursor-pointer transition-colors`.

Row click behavior (`handleSelect`):
- If clicked row is NOT the current relationship: `setSelectedLoan(row.firstLoanNo)` — firstLoanNo = the group's loan with the alphabetically-first `mwLoanNo` (localeCompare sort), giving a stable default selection; the workbench relationship then derives from that loan.
- In ALL cases (including clicking the current relationship): `setRelationshipBrowserOpen(false)` (closes the browser).

Empty-results row: when no rows match, a single `<td colSpan={7}>` with `px-3 py-6 text-center text-sm` + `textMuted`: `No relationships match "{search}"`.

Footer hint below the table: `<p>` `text-xs` + `textMuted` + `mt-3`: `Click a relationship to open it in the workbench.`

---


# Part 3 — Loan Tab

> The Loan tab (/home/user/GUI-V7/src/components/tabs/LoanTab.tsx) renders a 5-column CSS grid of cards (Loan Info, Balances, Rates/Payment, Dates, Address) followed by three full-width bottom rows (RateTypeRow with 7 columns, LoanTypeRow with 3 columns, CalculatedFieldsRow with 3 read-only computed fields). All state flows through the useLoanForm hook (src/components/tabs/loan/hooks/useLoanForm.ts), which debounces currency/rate inputs at 500 ms, validates currency/rate/date/zip formats (invalid inputs get a red border), and writes updates via useUpdateLoan keyed by mwLoanNo. Two fields are read-only with distinct styling: MW Loan # (readOnlyBg, textPrimary, font-medium) and the computed Total Balance (readOnlyBg, green textGreen, font-medium); the three CalculatedFieldsRow values are read-only in yellow (textYellow).

# Loan Tab Spec (GUI-V7)

Source files (all absolute):
- `/home/user/GUI-V7/src/components/tabs/LoanTab.tsx` (layout shell)
- `/home/user/GUI-V7/src/components/tabs/loan/components/{LoanInfoColumn,BalancesColumn,RatesPaymentColumn,DatesColumn,AddressColumn,RateTypeRow,LoanTypeRow,CalculatedFieldsRow}.tsx`
- `/home/user/GUI-V7/src/components/tabs/loan/hooks/useLoanForm.ts`, `/home/user/GUI-V7/src/components/tabs/loan/types.ts`

## Page shell

- Outer wrapper: `p-4` (16px padding).
- Loading state: text "Loading..." in `styles.textMuted`; no-selection state: "No loan selected" in `styles.textMuted` (both inside `p-4` div).
- Main grid: `grid grid-cols-5 gap-4` — exactly 5 equal columns, 16px gap. Column order left→right: **LoanInfoColumn, BalancesColumn, RatesPaymentColumn, DatesColumn, AddressColumn**.
- Below the grid: `mt-4 space-y-3` stack containing, in order: **RateTypeRow, LoanTypeRow, CalculatedFieldsRow** (each a full-width card).

## Shared card & control styling

- Every column/row card: `{cardBg} rounded-lg p-3 {inputBorder} border`; inner field stack in columns: `space-y-2`. Each column component wraps its card in a `space-y-3` div.
- Labels: `text-xs {textMuted} block mb-1`, label text always ends with a colon.
- Editable input/select: `{inputBg} {inputBorder} border rounded px-2 py-1 w-full text-xs {textPrimary} focus:outline-none {focusBorder}`. Validated fields substitute `getInputStyle(field)` for the static border: returns `invalidBorder` when the field failed validation, else `inputBorder`.
- Read-only input: `{readOnlyBg} {inputBorder} border rounded px-2 py-1 w-full text-xs <color> font-medium focus:outline-none cursor-not-allowed` + `readOnly` attribute.
- Theme tokens (from `/home/user/GUI-V7/src/context/ThemeContext.tsx`), dark / light:
  - `cardBg`: `bg-zinc-800/50` (#27272a at 50%) / `bg-gray-100` (#f3f4f6)
  - `inputBg`: `bg-zinc-900` (#18181b) / `bg-white` (#ffffff)
  - `readOnlyBg`: `bg-zinc-700` (#3f3f46) / `bg-gray-200` (#e5e7eb)
  - `inputBorder`: `border-zinc-600` (#52525b) / `border-gray-300` (#d1d5db)
  - `focusBorder`: `focus:border-green-500` (#22c55e) / `focus:border-green-600` (#16a34a)
  - `invalidBorder`: `border-red-500` (#ef4444) both themes
  - `textPrimary`: `text-white` (#ffffff) / `text-gray-900` (#111827)
  - `textMuted`: `text-gray-400` (#9ca3af) / `text-gray-500` (#6b7280)
  - `textGreen`: `text-green-400` (#4ade80) / `text-green-600` (#16a34a)
  - `textYellow`: `text-yellow-400` (#facc15) / `text-yellow-600` (#ca8a04)
- Font sizing: everything is `text-xs` (12px); no explicit font family (inherits app default).

## Column 1 — LoanInfoColumn (fields in order)

1. **"MW Loan #:"** — bound `loan.mwLoanNo` — text input — **READ-ONLY**: `{readOnlyBg} {inputBorder} border rounded px-2 py-1 w-full text-xs {textPrimary} font-medium focus:outline-none cursor-not-allowed`, `readOnly`, aria-label "MW Loan Number". No onChange.
2. **"Borrower:"** — `loan.borrowerName` — text — editable, `handleLoanFieldChange('borrowerName', v)` (immediate update, no debounce), aria "Borrower".
3. **"Relationship:"** — `loan.relatedLoans` — text — editable, `handleLoanFieldChange('relatedLoans', v)`, aria "Relationship".
4. **"Pool:"** — `loan.pool` (fallback `''`) — text — editable, `handleLoanFieldChange('pool', v)`, aria "Pool".
5. **"Status:"** — `loan.status` (fallback `''`) — **select** — editable, `handleLoanFieldChange('status', v)`, aria "Status". Options (value → label):
   - `""` → "Select"
   - `PA` → "PA - Performing Asset"
   - `FA` → "FA - Fully Performing"
   - `FC` → "FC - Foreclosure"
   - `JG` → "JG - Judgment"
   - `LT` → "LT - Litigation"
   - `BK` → "BK - Bankruptcy"
   - `REO` → "REO - Real Estate Owned"
6. **"Last Import:"** — `loan.lastImportDate` (fallback `''`) — text — editable, date-validated via `handleDateChange('lastImportDate', v)`, placeholder `MM/DD/YY`, border from `getInputStyle('lastImportDate')` (red `border-red-500` when invalid), aria "Last Import Date".

## Column 2 — BalancesColumn (fields in order)

All five editable fields are currency inputs: type text, placeholder `0.00`, value from local debounced state, onChange `handleCurrencyChange(field, v, setter)` (sanitizeCurrency + validateCurrency; invalid → red border via `getInputStyle`), debounced 500 ms (`DEBOUNCE_DELAY = 500`) then persisted as `parseFloat(v) || 0`.

1. **"Orig Balance:"** — local `localOrigBalance` → persists to `origBalance` — aria "Original Balance".
2. **"Principal:"** — `localPrincipal` → `principal` — aria "Principal".
3. **"Interest:"** — `localInterest` → `interest` — aria "Interest".
4. **"Escrow:"** — `localEscrow` → persists to **`escrowBalance`** — aria "Escrow".
5. **"Other:"** — `localOther` → persists to **`otherBalance`** — aria "Other".
6. **"Total Balance:"** — **READ-ONLY computed**: value = `'$' + (loan.principal + loan.interest + loan.escrowBalance + loan.otherBalance).toLocaleString()`. Styling: `{readOnlyBg} {inputBorder} border rounded px-2 py-1 w-full text-xs {textGreen} font-medium focus:outline-none cursor-not-allowed`, `readOnly` — i.e. green text, distinct from the MW Loan # read-only (which uses textPrimary). Aria "Total Balance".

## Column 3 — RatesPaymentColumn (fields in order)

1. **"Int Rate:"** — `localIntRate` → `intRate` — text — rate input: `handleRateChange('intRate', v, setLocalIntRate)` (sanitizeNumber to 3 decimals + validateInterestRate), placeholder `0.000`, red border on invalid, debounced 500 ms, aria "Interest Rate".
2. **"Default Rate:"** — `localDRate` → `dRate` — text — rate input, placeholder `0.000`, aria "Default Rate".
3. **"Payment:"** — `localPmt` → `pmt` — text — currency input, placeholder `0.00`, aria "Payment".
4. **"Escrow Pmt:"** — `localEscPmt` → `escPmt` — text — currency input, placeholder `0.00`, aria "Escrow Payment".
5. **"Pmt Freq:"** — `loan.pmtFreq` (no fallback) — **select** — editable, `handleLoanFieldChange('pmtFreq', v)`, aria "Payment Frequency". Options (value = label): `M`, `Q`, `SA`, `A`. No blank option.
6. **"Unfunded Commitment:"** — `loan.unfundedCommitment` (fallback `''`) — text — editable, immediate `handleLoanFieldChange('unfundedCommitment', v)`, no placeholder/validation, aria "Unfunded Commitment".

## Column 4 — DatesColumn (fields in order)

Rendered from a mapped array; every field: type text, placeholder `MM/DD/YY`, onChange `handleDateChange(key, v)` (validateDateFormat; invalid → red border via `getInputStyle(key)`), value `loan[key] || ''`, immediate persist (no debounce).

1. **"Not Due:"** — `notDue` — aria "Not Due Date"
2. **"Last PMT:"** — `lastPmt` — aria "Last Payment Date"
3. **"Orig Dt:"** — `origDt` — aria "Origination Date"
4. **"Mat Dt:"** — `matDt` — aria "Maturity Date"
5. **"Acc Dt:"** — `accDt` — aria "Acceleration Date"
6. **"Due Dt:"** — `dueDt` — aria "Due Date"

## Column 5 — AddressColumn (fields in order)

1. **"Address 1:"** — `loan.address1 || ''` — text — editable, `handleLoanFieldChange('address1', v)`, aria "Address Line 1".
2. **"Address 2:"** — `loan.address2 || ''` — text — editable, `handleLoanFieldChange('address2', v)`, aria "Address Line 2".
3. **"City:"** — `loan.city || ''` — text — editable, `handleLoanFieldChange('city', v)`, aria "City".
4. Nested two-column sub-grid `grid grid-cols-2 gap-2`:
   - Left — **"State:"** — `loan.state || ''` — **select** — `handleLoanFieldChange('state', v)`, aria "State". Options from `US_STATES` (`/home/user/GUI-V7/src/data/constants.ts`): first entry `{ code: '', name: 'Select State' }` then all 50 states alphabetical (AL, AK, AZ, AR, CA, CO, CT, DE, FL, GA, HI, ID, IL, IN, IA, ...). **Both option value and visible label are the 2-letter code** (`{state.code}` rendered as the option text; the blank first option displays as empty).
   - Right — **"Zip:"** — `loan.zip || ''` — text — `handleZipChange(v)` (validateZip; invalid → red border via `getInputStyle('zip')`; persists via `handleLoanFieldChange('zip', v)`), placeholder `12345`, `maxLength={10}`, aria "Zip Code".

## Bottom row 1 — RateTypeRow (card, `grid grid-cols-7 gap-3`, fields in order)

1. **"Rate Type:"** — `loan.rateType || ''` — **select** — `handleLoanFieldChange('rateType', v)`, aria "Rate Type". Options: `""` → "Select", `Fixed`, `Variable`, `Adjustable` (value = label).
2. **"Floor:"** — `localFloor` → `floor` (stored as string, synced when debounced value differs) — text — rate input `handleRateChange('floor', ...)`, placeholder `0.000`, red border on invalid, aria "Rate Floor".
3. **"Ceiling:"** — `localCeiling` → `ceiling` — text — rate input, placeholder `0.000`, aria "Rate Ceiling".
4. **"Margin:"** — `localMargin` → `margin` — text — rate input, placeholder `0.000`, aria "Rate Margin".
5. **"ChDt:"** — `loan.chDt || ''` — text — date input `handleDateChange('chDt', v)`, placeholder `MM/DD/YY`, red border on invalid, aria "Change Date".
6. **"ChFrq:"** — `loan.chFrq || ''` — text — editable, `handleLoanFieldChange('chFrq', v)`, no placeholder, aria "Change Frequency".
7. **"Index:"** — `loan.rateIndex || ''` — **select** — `handleLoanFieldChange('rateIndex', v)`, aria "Rate Index". Options: `""` (empty label), `LIBOR`, `SOFR`, `Prime`.

Note: floor/ceiling/margin are the only debounced fields that persist the raw string (not parseFloat).

## Bottom row 2 — LoanTypeRow (card, `grid grid-cols-3 gap-3`)

1. **"Ah/Bhd:"** — `loan.ahBhd || ''` — text — editable, `handleLoanFieldChange('ahBhd', v)`, aria "Ahead Behind".
2. **"AssetType:"** — `loan.assetType || ''` — **select** — `handleLoanFieldChange('assetType', v)`, aria "Asset Type". Options: `""` (empty label), `Commercial RE`, `Residential`, `Multi-family`, `Land`, `Construction` (value = label).
3. Third cell intentionally empty (placeholder div to keep the 3-column layout).

## Bottom row 3 — CalculatedFieldsRow (card, `grid grid-cols-3 gap-3`; all READ-ONLY)

Shared class: `{readOnlyBg} {inputBorder} border rounded px-2 py-1 w-full text-xs {textYellow} font-medium focus:outline-none cursor-not-allowed` + `readOnly` — yellow text distinguishes computed fields.

1. **"Months Interest Accrued:"** — value `calculateInterestAccrued(loan.interest, loan.principal, loan.intRate)`; tooltip title "Interest Balance / (Principal Balance x (Rate/12))"; aria "Months Interest Accrued". Formula (`/home/user/GUI-V7/src/utils/loanCalculations.ts`): strip `$,`/`%`; if principal or rate is 0 → `'0.00'`; else `months = interest / (principal * ((rate/100)/12))`, returned via `toFixed(2)`.
2. **"Months to Maturity:"** — value `loan.matDt ? calculateMonthsToMaturity(loan.matDt) : '0'`; tooltip "Calculated from Today to Maturity Date"; aria "Months to Maturity". Formula (`/home/user/GUI-V7/src/utils/dateCalculations.ts`): whole months from today's date (M/D/YY) to matDt via `calculateMonthsBetween`; past dates yield 0.
3. **"Months to Amortization:"** — value `calculateAmortizationMonths(loan.principal, loan.pmt, loan.intRate)`; tooltip "NPER calculation: Months to pay off principal at current payment rate"; aria "Months to Amortization". Formula: strip `$,`/`%`; 0 if payment, rate, or principal is 0; **999** if payment <= monthly interest (`principal * rate/100/12`); else `NPER = floor(max(0, -ln(1 - monthlyRate*principal/payment) / ln(1 + monthlyRate)))`.

## Editing/state mechanics (useLoanForm)

- Data source: `useLoans()` list, selected by `mwLoanNo === selectedLoan` from LoanContext; writes via `useUpdateLoan().mutate({ mwLoanNo, updates: { [field]: value } })`.
- 12 debounced local string states (principal, interest, origBalance, escrow, other, pmt, escPmt, intRate, dRate, floor, ceiling, margin), re-initialized from the loan whenever `selectedLoanData.mwLoanNo` changes; a `currentLoanIdRef` guard prevents stale cross-loan writes. Numeric fields persist `parseFloat(debounced) || 0` only when the value actually changed; floor/ceiling/margin persist the string.
- Validation handlers: `handleCurrencyChange` (sanitizeCurrency/validateCurrency), `handleRateChange` (sanitizeNumber with 3 decimals/validateInterestRate), `handleDateChange` (validateDateFormat, persists immediately), `handleZipChange` (validateZip, persists immediately). Failures set `validationErrors[field] = true`, which `getInputStyle` maps to `invalidBorder` (`border-red-500`).

---


# Part 4 — Borrower & Comment Tabs

> Extracted the full UI spec of the Borrower and Comment tabs from /home/user/GUI-V7. Borrower tab: top borrowers/guarantors table (8 columns, masked SSN/EIN, BK status badges, add/delete) over a 2-column grid of a details panel (5 cards: Name, Contact, Identity, Credit, Bankruptcy with conditional-disable) and a loan-relationships panel (checkbox list with role dropdowns, summary stats, SQL info box). Comment tab: fixed-500px list panel (search, type/loan filters, sortable table with colored type badges) beside a flex-1 detail editor (loan/type/date row, badge echo, 400px monospace textarea with char count, SQL info box); both tabs share a DeleteModal confirm flow.

## Source files
- `/home/user/GUI-V7/src/components/tabs/BorrowerTab.tsx`
- `/home/user/GUI-V7/src/components/tabs/borrower/components/BorrowersTable.tsx`
- `/home/user/GUI-V7/src/components/tabs/borrower/components/BorrowerDetailsPanel.tsx`
- `/home/user/GUI-V7/src/components/tabs/borrower/components/LoanRelationshipsPanel.tsx`
- `/home/user/GUI-V7/src/components/tabs/borrower/hooks/useBorrowerForm.ts`
- `/home/user/GUI-V7/src/components/tabs/borrower/types.ts`
- `/home/user/GUI-V7/src/components/tabs/CommentTab.tsx`
- Support: `/home/user/GUI-V7/src/utils/formatters.ts` (maskSsnEin, getCommentPreview, getTodayFormatted), `/home/user/GUI-V7/src/data/constants.ts` (COMMENT_TYPES), `/home/user/GUI-V7/src/utils/validation.ts` (validators)

All colors below are Tailwind classes with default hex values. Theme-token classes (`styles.cardBg`, `styles.textPrimary`, `styles.textMuted`, `styles.inputBg`, `styles.inputBorder`, `styles.borderColor`, `styles.activeTabBg`, `styles.invalidBorder`, `styles.alertBg/alertBorder/alertText`, `styles.textGreen`, `styles.textRed`, `styles.buttonHover`, `styles.hoverText`, `styles.hoverBg`, `styles.hoverDanger`, `styles.focusBorder`) come from the theme context and resolve per light/dark theme; treat them as design tokens. Nearly all text in both tabs is `text-xs` (12px); section headings `font-medium` at base size (16px).

---

# BORROWER TAB

## States
1. **Loading** (borrowers or loans query pending): `p-4` container with muted text "Loading...".
2. **No selection** (no borrower matches selectedBorrowerId): `p-4` container with muted text "No borrower selected".
3. **Normal**, described below.

## Layout structure (normal state)
Root: `div.p-4` (16px padding) containing, top to bottom:
1. **BorrowersTable** — full-width card, `mb-4` (16px below).
2. **Two-column grid** — `grid grid-cols-2 gap-4` (equal 50/50 columns, 16px gutter):
   - Left: **BorrowerDetailsPanel**
   - Right: **LoanRelationshipsPanel**
3. **DeleteModal** (shared `ui` component) — rendered last, shown when delete confirmation active; receives itemName = borrower name, onConfirm/onCancel.

## 1. Borrowers table (top card)
Card: `cardBg` token background, `rounded-lg` (8px radius), `p-3` (12px padding), 1px `inputBorder` border.

**Header row** (`flex items-center justify-between mb-3`):
- Left: title **"Borrowers & Guarantors"** (`font-medium`, textPrimary) with subtitle beneath (`text-xs`, muted, `mt-0.5`): **"Relationship: {currentRelationship}"**.
- Right: **"+ Add New"** button — `px-3 py-1.5`, inputBg background, 1px inputBorder, textPrimary, `rounded`, `text-xs`, hover token.

**Table**: wrapped in `overflow-x-auto`; `w-full text-xs`. Header row has bottom border (borderColor); header cells `px-2 py-2`, muted color, `font-medium`. Columns **in order** (alignment):
1. **Name** (left) — textPrimary, `font-medium`; falls back to literal `(New)` when empty.
2. **Phone** (left) — textSecondary.
3. **Address** (left) — shows `address1` only.
4. **City, State** (left) — `{city}, {state}`; comma only rendered when both present.
5. **SSN/EIN** (left) — **masked** via `maskSsnEin` (see Masking below); cell has `title="SSN/EIN masked for security"` tooltip.
6. **Credit Score** (left).
7. **BK Status** (center) — pill badge `px-2 py-0.5 rounded text-xs`:
   - `none` → plain muted text, label "None"
   - `open` → invalidBg token + textRed token, label "Open"
   - `dismissed` → `bg-yellow-500/20` (#eab308 @ 20% alpha) + `text-yellow-400` (#facc15), label "Dismissed"
   - `discharged` → `bg-green-500/20` (#22c55e @ 20% alpha) + `text-green-400` (#4ade80), label "Discharged"
   - anything else → muted, "None"
8. **Actions** (center) — lowercase "x" text button, muted → hoverDanger on hover; `disabled` when only 1 borrower remains, tooltip "Cannot delete last borrower" (else "Delete borrower"); click uses `stopPropagation`.

**Row behavior**: whole row clickable → selects borrower (`setSelectedBorrowerId`); bottom border per row; selected row gets `activeTabBg` token, others get hover token; `cursor-pointer`, `transition-colors`. Rows = borrowers filtered to `relationship === currentRelationship`.

## 2. Borrower details panel (left column)
Container: `space-y-4`. Heading **"Borrower/Guarantor Details"** (`font-medium`, textPrimary, `mb-3`). Then five cards, each `cardBg rounded-lg p-3` + 1px inputBorder border. All labels: `text-xs`, muted, `block mb-1`, text ends with colon. All inputs: inputBg, 1px border, `rounded px-2 py-1 w-full text-xs`, textPrimary, `focus:outline-none` + focusBorder token. Every field auto-saves on change (updateBorrower mutation per keystroke — no explicit Save button). Validated fields swap border to `invalidBorder` token while invalid (validation is advisory; value still saved).

**Card 1 — Name** (no card heading):
- **Name:** text input, `font-medium` value text, aria-label "Borrower Name". No validation.

**Card 2 — Contact Information** (card heading `text-xs` muted `font-medium mb-2`; fields stacked `space-y-2`):
- **Phone:** text input, placeholder `(555) 555-5555`, validated (10 digits, separators `-. ()`/spaces allowed; empty OK).
- **Address 1:** text input.
- **Address 2:** text input.
- Row (`grid grid-cols-6 gap-2`): **City:** (col-span-3) text; **State:** (col-span-1) text, `maxLength=2`; **Zip:** (col-span-2) text, placeholder `12345`, `maxLength=10`, validated (5-digit or 5+4 `NNNNN-NNNN`; empty OK).

**Card 3 — Identity Verification** (`grid grid-cols-2 gap-3`):
- **SSN/EIN:** text input, placeholder `XXX-XX-XXXX or XX-XXXXXXX`, validated as SSN (`NNN-NN-NNNN`) OR EIN (`NN-NNNNNNN`); empty OK. Shown **unmasked** here (masking only in the table).
- **Date of Birth:** text input, placeholder `MM/DD/YY`, validated as MM/DD/YY (1–2 digit month/day allowed, 2-digit year required; empty OK).

**Card 4 — Credit Information** (`grid grid-cols-2 gap-3`):
- **Credit Score:** text input, placeholder `300-850`, `maxLength=3`, validated numeric 300–850 (empty OK).
- **Credit Score Date:** text input, placeholder `MM/DD/YY`, same date validation.

**Card 5 — Bankruptcy Information** (`space-y-2`):
- Row (`grid grid-cols-2 gap-3`):
  - **BK Status:** select — options (value → label): `none`→None, `open`→Open, `dismissed`→Dismissed, `discharged`→Discharged, `terminated`→Terminated. Always enabled.
  - **BK Chapter:** select — `""`→"Select Chapter", then Chapter 7, Chapter 11, Chapter 12, Chapter 13, Chapter 15 (values equal labels). **Disabled when bkStatus === 'none'.**
- **BK Court Case #:** text input, disabled when bkStatus === 'none'.
- **BK Court Location:** text input, disabled when bkStatus === 'none'.
- **BK Assets:** select — "No Assets", "Assets" (values equal labels), disabled when bkStatus === 'none'.

## 3. Loan relationships panel (right column)
Container: `space-y-4`. Heading **"Related Loans"** (`font-medium`, `mb-3`).

**Main card** (cardBg, rounded-lg, p-3, inputBorder border):
- Instruction line (text-xs muted, mb-3): "Select loans and specify role for this borrower:".
- **Loan list**: `space-y-1`, `max-h-[500px] overflow-y-auto`. All loans render (unsorted passthrough despite the name `sortedLoans`). Each row: `flex items-center p-2 rounded` + 1px inputBorder border; background = `activeTabBg` token when selected, `inactiveTabBg` token otherwise; transition-colors. Row contents left→right:
  1. Checkbox (`mr-2`), id `loan-{mwLoanNo}`, checked = relationship selected; toggling flips `selected` for that loan on the current borrower (default when absent: `{selected:false, role:'Borrower'}`).
  2. Label (clickable, tied to checkbox): **#{mwLoanNo}**, text-xs, font-medium, textPrimary.
  3. Flex-1 area (`ml-3`, justify-between): left group = principal **${principal.toLocaleString()}** in textGreen font-medium text-xs, then **@ {intRate}%** in muted text-xs; right = **role select** with options `Borrower` / `Guarantor`, compact (`px-2 py-0.5 text-xs`), **disabled unless the loan's checkbox is checked**, `stopPropagation` on click; changing writes role into that loan's relationship record.
- **Summary** (`mt-4 pt-3` + top border): two justify-between rows —
  - "Selected Loans:" (muted) → "**{selectedCount} of {totalLoans}**" (textPrimary font-medium).
  - "Total Exposure:" (muted, `mt-2`) → "**${totalExposure.toLocaleString()}**" (textGreen font-medium); totalExposure = sum of `principal` over checked loans.

**SQL Connection Info card** (below main card): alertBg/alertBorder tokens, rounded-lg, p-3; AlertCircle icon (lucide, 16px) + alertText text-xs; bold line "SQL Connection Points:" then 4 literal lines: `SELECT * FROM borrowers WHERE relationship = '{currentRelationship}'`, `INSERT INTO borrowers (relationship, ...) VALUES ('{currentRelationship}', ...)`, `UPDATE borrowers SET field = value WHERE id = {selectedBorrowerId}`, `DELETE FROM borrowers WHERE id = borrower_id`.

## Masking (maskSsnEin — table only)
- Empty → empty. Strips dashes/spaces; if <4 chars remain, returns raw value unmasked.
- If value contains "-" at index 2 → EIN format: `**-***{last4}`.
- Otherwise → SSN format: `***-**-{last4}`.

## Add flow (Borrower)
"+ Add New" → creates borrower with id = max(existing ids)+1 (or 1), `relationship = currentRelationship`, all string fields empty, `bkStatus:'none'`, `bkAssets:'No Assets'`, `type:'Borrower'`, `loanRelationships:{}` → addBorrower mutation → immediately selects the new row (renders as "(New)" until named). No filters/validation reset involved.

## Delete flow (Borrower)
"x" in Actions (disabled if it is the last borrower in the relationship) → opens shared **DeleteModal** with the borrower's name → **Confirm**: deleteBorrower mutation; if other borrowers remain in the relationship, selection moves to the first remaining one; modal closes. **Cancel**: just closes.

---

# COMMENT TAB

## States
- **Loading** (loans or comments pending): `p-4` + muted "Loading...".
- Normal, below.

## Layout structure
Root `div.p-4` containing DeleteModal (shown on delete request; itemName = comment preview) and a horizontal flex row `flex space-x-4` (16px gap):
- **Left panel — Comments list**: fixed inline style `width: 500px`; card = cardBg, rounded-lg, `p-4`, 1px inputBorder border.
- **Right panel — Comment detail**: `flex-1` card, same card styling. If no comment selected: same card but centered placeholder text (`text-sm` muted): "No comments yet. Click \"+ Add Comment\" to get started." when zero comments, else "Select a comment from the list to view details."

## Left panel
**Header** (`flex items-center justify-between mb-3`):
- Title **"Comments"** (font-medium, textPrimary).
- Right group (gap-2): count text (text-xs muted) — "{filtered} comments", or "{filtered} / {total} comments" when a filter/search reduces the list — and **"+ Add Comment"** button (`px-3 py-1.5`, cardBg, inputBorder border, **textGreen** label, rounded, text-xs font-medium, hover token).

**Search bar** (`mb-3`): relative wrapper; lucide **Search** icon 14px absolutely positioned left-2 vertically centered (muted); text input placeholder "Search comments...", `pl-7 pr-7 py-1.5 w-full text-xs`, inputBg/inputBorder/focusBorder; when non-empty, an **X** clear button (lucide X 14px) absolutely at right-2 (muted → hoverText), aria-label "Clear search". Search matches case-insensitively against comment text, loanNo, commentType, and date.

**Filter row** (`flex gap-2 mb-3`):
1. **Type filter** select (flex-1): "All Types" (value `All`) + COMMENT_TYPES = Note, Legal, Underwriting, Property, Servicing, Collection, Other.
2. **Loan filter** select (flex-1): "All Loans" (value `All`) + unique loan numbers present in comments, sorted ascending.
3. **Clear** button — only rendered when any of type filter, loan filter, or search is active; `px-2 py-1 text-xs`, muted, bordered, tooltip "Clear all filters"; resets all three.

**Comments table**: container `rounded border` + borderColor, `overflow-auto`, inline `maxHeight: 600px`; background hard-coded by theme: dark `bg-zinc-900` (#18181b), light `bg-white` (#ffffff). Table `w-full`; **sticky header** (`sticky top-0`) with theme background dark `bg-zinc-800` (#27272a) / light `bg-gray-100` (#f3f4f6), bottom border. Header cells `px-3 py-2` muted font-medium text-xs. Columns in order:
1. **Loan #** — sortable (click header), left; body cell textPrimary font-medium.
2. **Type** — sortable; body cell renders **TypeBadge** (colors below).
3. **Date** — sortable; textSecondary.
4. **Preview** — not sortable; textSecondary; preview = first line of text, truncated at 50 chars + "..." ; "(No text)" when empty.
5. Unnamed delete column, inline `width: 30px` — "x" button (muted → hoverDanger, text-xs), tooltip "Delete comment", aria-label "Delete comment {id}", stopPropagation.

**Sorting**: state = sortField (`date` | `type` | `loanNo`) + sortDirection (`asc`/`desc`). Default: date desc. Clicking active column toggles direction; clicking a new column sets it with default direction desc for date, asc for type/loanNo. Indicator: lucide ChevronUp (asc) / ChevronDown (desc), 12px, inline `ml-0.5`, only on the active column. Date sort parses MM/DD/YY numerically (2-digit year: 00–49 → 2000s, 50–99 → 1900s; unparseable → 0).

**Rows**: clickable → setSelectedCommentId; border-b; selected row bg: dark `bg-zinc-800` (#27272a), light `bg-blue-50` (#eff6ff); unselected uses hoverBg token. Empty-state row spans 5 cols, centered muted text-xs: "No comments yet. Click \"+ Add Comment\" to create one." (no comments at all) or "No comments match your search/filter criteria." (filtered to zero).

**Footer hint** (`mt-3 text-xs` muted): "Click a comment to view/edit. Click column headers to sort."

## Type badge colors (TypeBadge)
Pill: `px-1.5 py-0.5 rounded text-xs font-medium`; picks light vs dark class pair by current theme; unknown type falls back to **Other**. Per type (light bg / light text / dark bg / dark text, class → hex; `/30` = 30% alpha):
- **Note**: `bg-blue-100` #dbeafe / `text-blue-700` #1d4ed8 / `bg-blue-900/30` #1e3a8a@30% / `text-blue-400` #60a5fa
- **Legal**: `bg-red-100` #fee2e2 / `text-red-700` #b91c1c / `bg-red-900/30` #7f1d1d@30% / `text-red-400` #f87171
- **Underwriting**: `bg-purple-100` #f3e8ff / `text-purple-700` #7e22ce / `bg-purple-900/30` #581c87@30% / `text-purple-400` #c084fc
- **Property**: `bg-green-100` #dcfce7 / `text-green-700` #15803d / `bg-green-900/30` #14532d@30% / `text-green-400` #4ade80
- **Servicing**: `bg-yellow-100` #fef9c3 / `text-yellow-700` #a16207 / `bg-yellow-900/30` #713f12@30% / `text-yellow-400` #facc15
- **Collection**: `bg-orange-100` #ffedd5 / `text-orange-700` #c2410c / `bg-orange-900/30` #7c2d12@30% / `text-orange-400` #fb923c
- **Other**: `bg-gray-100` #f3f4f6 / `text-gray-700` #374151 / `bg-gray-700/30` #374151@30% / `text-gray-400` #9ca3af

## Right panel — Comment Details (when a comment is selected)
Heading **"Comment Details"** (font-medium, mb-4). Body `space-y-4`:

1. **Field row** `grid grid-cols-3 gap-3` (labels text-xs muted, colon-terminated):
   - **Loan Number:** select of all loans' `mwLoanNo` (value text font-medium). Edits save immediately.
   - **Comment Type:** select of COMMENT_TYPES (Note, Legal, Underwriting, Property, Servicing, Collection, Other).
   - **Date:** text input, placeholder `MM/DD/YY`; validated **on blur** only — invalid non-empty value shows border → invalidBorder token and error line beneath (`text-xs` textRed `mt-0.5`): "Invalid date format. Use MM/DD/YY". Value still saved on change regardless.
2. **Badge echo row** (`flex items-center gap-2`): TypeBadge for current type + muted text-xs "Loan {loanNo} · {date}" (middle dot is `&middot;`).
3. **Comment Text:** label + `textarea` — `px-3 py-2 w-full text-xs`, **font-mono**, inline `minHeight: 400px`, `resize: vertical`, placeholder "Enter comment text here. Can be as long as needed - perfect for note history, detailed underwriting notes, legal documentation, etc."; below it a muted text-xs counter "**{n} characters**".
4. **SQL Connection Info** card (`mt-4`, alertBg/alertBorder, rounded-lg, p-3, AlertCircle 16px + alertText text-xs): bold "SQL Connection Points:" then lines: `SELECT * FROM comments WHERE loan_id = '{selectedLoan}'`, `INSERT INTO comments (loan_id, comment_type, date, text) VALUES (...)`, `UPDATE comments SET field = value WHERE id = {selectedCommentId}`, `DELETE FROM comments WHERE id = comment_id`.

All detail fields auto-save per change via updateComment mutation (no Save button).

## Add flow (Comment)
"+ Add Comment" → new comment `{ id: max(ids)+1 (or 1), loanNo: selectedLoan (current loan from context), commentType: 'Note', date: today as MM/DD/YY, text: '' }` → addComment mutation; **on success**: selects the new comment AND clears search text, type filter, and loan filter (so the new row is guaranteed visible).

## Delete flow (Comment)
Row "x" → DeleteModal with itemName = comment preview (first line ≤50 chars, "(No text)" fallback). Confirm → deleteComment mutation; on success selects the first remaining comment (if any); modal state resets. Cancel → resets modal state only.

---


# Part 5 — Collateral & PayHist Tabs

> Extracted the exact UI spec of the Collateral and PayHist tabs from /home/user/GUI-V7. Collateral = a selectable collateral-items table with add/delete, above a 3-column grid (Property Information form, Values matrix with calculated $/SF row, Linked Loan radio panel with stats + SQL info card). PayHist = a loan-summary header with CSV export, a left editable payment-entry spreadsheet (Year/Month/Amount with expression support) plus Pay History Date input, and a right year-by-month payment grid with year sums, grand total, Trailing 12/6/3 analytics cards, and a SQL info card.

# Source files
- `/home/user/GUI-V7/src/components/tabs/CollateralTab.tsx`, `/home/user/GUI-V7/src/components/tabs/collateral/{types.ts, hooks/useCollateralForm.ts, components/CollateralTable.tsx, components/PropertyInfoColumn.tsx, components/ValuesColumn.tsx, components/CollateralLoansPanel.tsx}`
- `/home/user/GUI-V7/src/components/tabs/PayHistTab.tsx`, `/home/user/GUI-V7/src/components/tabs/payhist/{types.ts, hooks/usePayHistForm.ts, components/PayHistHeader.tsx, components/PaymentEntryPanel.tsx, components/PaymentGridPanel.tsx}`
- Theme tokens: `/home/user/GUI-V7/src/context/ThemeContext.tsx`; utils: `/home/user/GUI-V7/src/utils/propertyCalculations.ts`, `/home/user/GUI-V7/src/utils/loanCalculations.ts`; constants: `/home/user/GUI-V7/src/data/constants.ts` (`MONTH_NAMES`, `US_STATES`, `DEBOUNCE_DELAY = 500`).

# Theme token → Tailwind → hex (dark / light)
| Token | Dark | Light |
|---|---|---|
| textPrimary | `text-white` #ffffff | `text-gray-900` #111827 |
| textSecondary | `text-gray-300` #d1d5db | `text-gray-700` #374151 |
| textMuted | `text-gray-400` #9ca3af | `text-gray-500` #6b7280 |
| textGreen | `text-green-400` #4ade80 | `text-green-600` #16a34a |
| textYellow | `text-yellow-400` #facc15 | `text-yellow-600` #ca8a04 |
| textRed | `text-red-400` #f87171 | `text-red-600` #dc2626 |
| cardBg | `bg-zinc-800/50` rgba(39,39,42,.5) | `bg-gray-100` #f3f4f6 |
| inputBg | `bg-zinc-900` #18181b | `bg-white` #ffffff |
| readOnlyBg | `bg-zinc-700` #3f3f46 | `bg-gray-200` #e5e7eb |
| borderColor | `border-zinc-800` #27272a | `border-gray-200` #e5e7eb |
| inputBorder | `border-zinc-600` #52525b | `border-gray-300` #d1d5db |
| focusBorder | `focus:border-green-500` #22c55e | `focus:border-green-600` #16a34a |
| invalidBorder | `border-red-500` #ef4444 | same |
| validRing / invalidRing | `ring-green-500` #22c55e / `ring-red-500` #ef4444 | `ring-green-600` #16a34a / `ring-red-600` #dc2626 |
| activeTabBg | `bg-zinc-800` #27272a | `bg-gray-100` #f3f4f6 |
| inactiveTabBg | `bg-zinc-900/50` rgba(24,24,27,.5) | `bg-gray-50` #f9fafb |
| hoverBg / hoverText / buttonHover / hoverDanger | `hover:bg-zinc-800/30` / `hover:text-white` / `hover:bg-zinc-600` #52525b / `hover:text-red-400` | `hover:bg-gray-100` / `hover:text-gray-900` / `hover:bg-gray-300` #d1d5db / `hover:text-red-600` |
| alertBg / alertBorder / alertText | `bg-red-900/20` rgba(127,29,29,.2) / `border-red-800/30` rgba(153,27,27,.3) / `text-red-400` | `bg-red-50` #fef2f2 / `border-red-200` #fecaca / `text-red-600` |

Fonts: app default sans stack; sizes `text-xs` 12px (dominant), `text-sm` 14px, `text-base` 16px. Cards: `rounded-lg`, 1px `inputBorder` border, padding `p-3` or `p-4`.

---

# COLLATERAL TAB
Root: `div.p-4`. Loading state: muted "Loading..."; no selection: muted "No collateral selected".

## 1. Collateral Items table (top, full width, `mb-4`)
Card: cardBg, rounded-lg, p-3, inputBorder border.
- Header bar (flex, justify-between, mb-3): LEFT — `h3` "Collateral Items" (font-medium, textPrimary) with sub-line `Loan: #{selectedLoan}` (text-xs, textMuted, mt-0.5). RIGHT — button labeled `+ Add New` (px-3 py-1.5, inputBg, inputBorder border, textPrimary, rounded, text-xs, buttonHover). Click creates a blank collateral pre-linked to `relatedLoans = currentRelationship` and `loanNo = selectedLoan` (all other ~28 fields empty strings); server assigns `mwPropertyNo`, new item auto-selected.
- Table (inside `overflow-x-auto`; `w-full text-xs`; header row bottom border borderColor; th `px-2 py-2` textMuted font-medium). **Columns in order**:
  1. **Description** — left-aligned; cell textPrimary font-medium; empty description renders literal `(New)`.
  2. **Address** — left; `address1`, textSecondary.
  3. **City, State** — left; `{city}, {state}` (comma+space only when both non-empty), textSecondary.
  4. **Our Value** — right-aligned; `$` + raw `ourValue` string (no numeric formatting), textGreen.
  5. **Appraised** — right; `$` + raw `appraisedValue`, textSecondary.
  6. **Actions** — center; lowercase `x` button, textMuted → hoverDanger; click (stopPropagation) opens shared DeleteModal (`show`, itemName = description, Confirm deletes then selects first remaining item, Cancel closes). Button `disabled` when only 1 collateral remains.
- Row behavior: whole row clickable to select (`cursor-pointer`, bottom border borderColor); selected row bg = activeTabBg; unselected rows get hoverText.

## 2. Three-column layout: `grid grid-cols-3 gap-4`

### Column 1 — PropertyInfoColumn ("Property Information" card)
Card cardBg/rounded-lg/p-3/inputBorder border; `h4` heading "Property Information" (text-xs, textMuted, font-medium, mb-3). Fields stacked `space-y-2`; every label is text-xs textMuted, block, mb-1, **ends with a colon**; every input: inputBg, inputBorder border, rounded, px-2 py-1, w-full, text-xs, textPrimary, focus:outline-none + focusBorder. **Field order**:
1. `Description:` — full-width text input (field `description`).
2. `Address:` — full-width text (field `address1`).
3. 3-col row (`grid grid-cols-3 gap-2`): `City:` text | `State:` **select** over US_STATES showing 2-letter codes (first option blank code = "Select State") | `Zip:` text.
4. 2-col row (`grid grid-cols-2 gap-2`): `County:` text | `Parcel ID:` text.
5. 4-col row (`grid grid-cols-4 gap-2`): `SqFt:` | `Acres:` | `Year Built:` | `Units:` — all text inputs; **SqFt** is special: placeholder "0", value from local state, sanitized to digits (`sanitizeNumber`), validated as positive integer, saved via 500 ms debounce; invalid → invalidBorder (red). Others save immediately per keystroke via `updateCollateral`.

### Column 2 — ValuesColumn ("Values" card)
Card chrome identical; `h4` "Values". Layout: `grid grid-cols-4 gap-3` forming a 4×3 matrix:
- **Row 1 — column headers** (text-xs, textMuted, font-medium): `List Price` | `Appraised` | `Our Value` | `BPO`.
- **Row 2 — editable currency inputs** (fields `listPrice`, `appraisedValue`, `ourValue`, `bpoValue`): placeholder "0.00"; sanitizeCurrency + validateCurrency on change; saved via 500 ms debounce; class = inputBg, border(+invalidBorder red when invalid, else inputBorder), rounded px-2 py-1 w-full text-xs, focusBorder. Text color textPrimary — **except the Our Value input, which is textGreen**.
- **Row 3 — calculated read-only $/SF** under each value: label `$/SF:` (text-xs textMuted); read-only input, value = `$` + `calculatePerSqft(value, sqft)` = `Math.round(value/sqft).toLocaleString()` (comma-grouped whole dollars, e.g. `$1,234`); shows `$0` when value or sqft empty (and `$0` when sqft parses to 0). Read-only style: readOnlyBg, inputBorder border, rounded px-2 py-1 w-full text-xs, **textYellow font-medium**, cursor-not-allowed.

### Column 3 — CollateralLoansPanel (`space-y-3`, two cards)
**Card A — "Linked Loan"** (cardBg card): `h4` "Linked Loan" (text-xs textMuted font-medium mb-3); helper paragraph (text-xs textMuted mb-3): "Collateral belongs to the relationship; optionally link it to one specific loan:".
- Radio list: `role="radiogroup"` aria-label "Linked loan"; `space-y-1`, `max-h-[300px] overflow-y-auto`. Each option row: flex items-center p-2 rounded, inputBorder border; bg = activeTabBg when selected else inactiveTabBg; native radio (name `linked-loan`, mr-2) + label.
  - Option 0: "Relationship-level only (no specific loan)" (text-xs textPrimary) — checked when `loanNo` empty; selecting clears the link.
  - One option per relationship loan, **sorted by principal descending**. Label layout justify-between: LEFT `#{mwLoanNo}` (font-medium textPrimary text-xs); RIGHT `${principal.toLocaleString()}` (textGreen font-medium text-xs) then `@ {intRate}%` (textMuted text-xs), space-x-2. Selecting saves `loanNo` immediately (single-loan link model).
- **Summary stats** (mt-4 pt-3 border-t borderColor), two justify-between rows text-xs:
  1. `Linked Loan:` (textMuted) → `#{loanNo}` or `None (relationship-level)` (font-medium textPrimary).
  2. `Linked Loan UPB:` (textMuted, mt-2) → `$` + `securingLoansStats.totalSecured.toLocaleString()` (font-medium textGreen) — the linked loan's principal, 0 when unlinked. (Hook also computes `securingCount`/`totalLoans` but they are not rendered.)
**Card B — SQL info** (alertBg + alertBorder rounded-lg border p-3): AlertCircle icon 16px alertText; text-xs alertText: bold line "SQL Connection Points:", then `SELECT * FROM CollateralInfo WHERE RelatedLoans = @relationship` and `UPDATE CollateralInfo SET MWLoanNo = @loanNo WHERE MWPropertyNo = {selectedCollateralId}`.

---

# PAYHIST TAB
Root: `div.p-4`. Loading: "Loading..."; no loan: "No loan selected".

## 1. Header (PayHistHeader, cardBg card p-3, mb-4)
Single flex row, justify-between. LEFT group `space-x-6` of label/value pairs — label text-xs textMuted, value `ml-2`:
1. `Loan #:` → `{selectedLoan}` font-medium textPrimary
2. `Borrower:` → `{borrowerName}` textPrimary
3. `Current Balance:` → `$` + `principal.toLocaleString()` font-medium textGreen
4. `Monthly Payment:` → `$` + `pmt.toLocaleString()` textPrimary
5. `Rate:` → `{intRate}%` textPrimary
RIGHT: button **Export History** (px-4 py-1.5, cardBg, inputBorder border, textPrimary, rounded, text-xs, buttonHover) — downloads CSV `payment_history_{loanNo}.csv`, header row `Year,Month,Amount`, complete rows only.

## 2. Body: `flex space-x-4` — left entry panel (min-width 350px) + right grid panel (flex-1)

### Left — PaymentEntryPanel (cardBg card p-4, `minWidth:'350px'`)
- `h3` centered, font-medium textPrimary: **"Payment Entry for Loan #{selectedLoan}"**.
- Spreadsheet container: bg `bg-zinc-900` (dark) / `bg-white` (light), rounded, border borderColor.
- **Entry table columns** (th px-3 py-2 textMuted font-medium text-xs; header row border-b + bg `bg-zinc-800` dark / `bg-gray-100` light):
  1. **Year** — width 80px, left; borderless transparent input (id `year-{id}`), placeholder `YYYY`, maxLength 4, textPrimary; validated by `validateYearInput`.
  2. **Month** — 80px, left; placeholder `1-12`, maxLength 2, textPrimary; `validateMonthInput`.
  3. **Amount** — 100px, left; placeholder `0.00`, **textGreen**; accepts arithmetic chars only (regex `^[0-9+\-*/.() ]*$`); tooltip title "You can enter calculations like 500+108.15 or 608.15*2"; on blur the expression is evaluated (`calculateExpression`) and the result stored.
  4. unlabeled 30px column — `x` delete button (textMuted → hoverDanger, text-xs, title "Delete row"), rendered **only** when the row is complete (year+month+amount) and is not the last row.
  All cells: td px-0 py-0; input w-full px-3 py-2 text-xs bg-transparent, no border; invalid field → `ring-1` invalidRing; valid focus → `focus:ring-1` validRing. Rows: border-b borderColor + hoverBg.
- Behavior: an empty trailing row is always maintained (auto-appended on loan switch and when the last empty row receives its first character). Keyboard: **Enter or ArrowDown** → same column next row; **ArrowUp** → previous row; **Tab** → next cell right (native).
- Hint block (mt-3, text-xs, textMuted), 4 lines: "Click any cell to edit" / "Press Enter or Down to move down" / "Press Tab to move right" / "Amount supports calculations: 500+108.15".
- **Pay History Date box** (mt-4, p-3, bg `bg-zinc-800` dark / `bg-gray-50` light, rounded, border borderColor): label text-xs font-medium textMuted "Pay History Date (last month of data)"; text input placeholder `M-D-YY (e.g., 9-12-25)` (inputBg, inputBorder, rounded, px-3 py-1.5, w-full, **text-sm**, textPrimary, focusBorder). Unparseable non-empty → textRed text-xs "Invalid date format. Use M-D-YY"; parsed → textGreen text-xs "Using: {M/D/YY}" (re-rendered as `month/day/2-digit-year`).

### Right — PaymentGridPanel (flex-1, cardBg card p-4, overflow-x-auto)
- `h3` centered font-medium textPrimary: **"Data will be displayed here"** (literal placeholder title).
- **Payment grid** (table w-full text-xs) — **rows = years, columns = months**:
  - Header row: empty first th, then 12 columns titled with FULL month names `January` … `December` (MONTH_NAMES; centered, px-1 py-1, textMuted, font-medium), then **Sum** column (centered, px-2 py-1, left border borderColor).
  - One row per year having a positive sum, **sorted ascending**; first data row gets top border. Year label cell: px-2 py-2 font-medium textPrimary. Month cells (months 1–12): centered px-1 py-2; amount present → `amount.toFixed(2)` (no $ sign, no commas; duplicate year+month records are summed) in textGreen; absent → `-` in textSecondary. Row **Sum** cell: centered, font-medium, left border, `$` + `yearSum.toFixed(2)` (no thousands separators), textPrimary if >0 else textSecondary.
  - **Total row** (top border, font-medium): first cell literal `TOTAL` (textPrimary); a colSpan-12 cell right-aligned reading `Grand Total:` (textPrimary); final cell centered, left border, textGreen: `$` + `grandTotal.toFixed(2)`.
- **Trailing-payment analytics** — effectiveDate = parsed Pay History Date, falling back to `loan.lastImportDate`. When effectiveDate and all three datasets exist: section mt-4 with `h4` "Payment Analytics" (text-base, font-medium, textMuted, mb-2), then `grid grid-cols-3 gap-4` capped at `maxWidth:'540px'` containing three **TrailingCard**s titled `Trailing 12`, `Trailing 6`, `Trailing 3` (windows ending at effectiveDate). Each card: inputBorder border, rounded-lg, p-4; centered title text-base font-semibold textPrimary mb-3; four justify-between rows (all text-base, labels textMuted, values font-medium):
  1. `$/Mo` → `$` + `monthly.toLocaleString(maximumFractionDigits:0)` — textPrimary (avg received/month).
  2. `Actual` → `$` + `actual.toLocaleString(max 0 digits)` — textGreen (total received in window).
  3. `% Cont.` → `percentOfContractual.toFixed(1)` + `%` — color-coded: ≥100 textGreen, ≥80 textYellow, else textRed.
  4. `Mo Pd` → `monthsPaidContractual.toFixed(1)` — textPrimary (actual ÷ contractual monthly pmt).
  Otherwise fallback box (mt-3, p-2, inputBg, inputBorder, rounded border): centered text-xs textMuted "Enter Pay History Date above for trailing analytics".
- **SQL info card** (mt-4, p-3, alertBg, alertBorder, rounded-lg border, AlertCircle 16px + text-xs alertText): bold "SQL Connection Points:" then `SELECT * FROM payment_history WHERE loan_id = '{selectedLoan}' ORDER BY year DESC, month DESC`, `INSERT INTO payment_history (loan_id, year, month, amount) VALUES (...)`, `UPDATE payment_history SET amount = value WHERE id = record_id`, `DELETE FROM payment_history WHERE id = record_id`.

---


# Part 6 — Overview, Strategies, Projections, Report Tabs

> Extracted exact UI specs for four tabs in /home/user/GUI-V7: OverviewTab (relationship header with flag chips, loan/collateral/borrower summary tables with totals and conditional color rules, three localStorage-persisted narrative sections), StrategiesTab (single auto-growing strategy notes textarea), ProjectionsTab (Modern/Classic mode selector, loan header, Projection Settings + Exit Scenario Settings panels, Bid Statistics panel, three cash-flow grids), and ReportTab (print-oriented investor report: header with key metrics, Leaflet map, photos, comps, charts, loan detail table, footer).

# Tab Specs — /home/user/GUI-V7

All tabs use themed style tokens from `useTheme()` (`styles.cardBg`, `styles.inputBorder`, `styles.textPrimary`, `styles.textSecondary`, `styles.textMuted`, `styles.inputBg`, `styles.tableHeaderBg`, `styles.selectedBg`, `styles.focusBorder`, `styles.readOnlyBg`, `styles.textGreen`/`textRed`/`textYellow`, `styles.borderColor`). Every card/panel = rounded-lg (8px radius), p-4 (16px padding), 1px themed border, on `styles.cardBg`. Section headings = `<h3>` font-medium (500) in `textPrimary`, mb-3. Tables = full-width, text-xs (12px), header row on `tableHeaderBg` with font-medium `textSecondary` cells, all cells px-2 py-1.5 (8px h / 6px v), row bottom border in themed input-border color, wrapped in `overflow-x-auto`.

---

## 1. OverviewTab (`src/components/tabs/OverviewTab.tsx`)

Relationship-level dashboard (not per-loan). Outer container: p-4, vertical stack with 16px gaps (`space-y-4`). Shows "Loading..." in `textMuted` while loans/borrowers/collateral queries load. Section order:

### 1.1 Relationship header card
- Top row (flex, space-between, mb-3): left = h3 font-medium "Relationship: {currentRelationship || 'N/A'}"; right = text-xs `textMuted` counts string: `"{N} loan(s) | {M} borrower(s) | {K} collateral"` (loan/borrower singular/plural handled; "collateral" never pluralized).
- Below: flag chip row (flex flex-wrap gap-2, `role="group"`, aria-label "Relationship status flags"). Six chips in fixed order: **Bankruptcy, Foreclosure, Litigation, Forbearance, Judgment, Low Yield Asset**. Flags are STORED bits from tblRelationships (inBankruptcy, foreclosureFlag, litigationFlag, forbearanceFlag, judgmentFlag, lowYieldAsset) — never derived from loan statuses; default false.
- Chip style: px-2 py-0.5, rounded (4px), text-xs font-medium, `data-testid="flag-{key}"`, `role="status"`, aria-label "{Label}: Yes/No". **Active: `bg-red-600` (#dc2626) with white text** (all six flags use red when active). Inactive: themed input background + `textMuted` text + 1px themed border.

### 1.2 Loan Summary card
- h3 "Loan Summary". Table (aria-label "Loan summary"). Rows = loans where `relatedLoans === currentRelationship`, sorted with the selected loan first; selected row gets `styles.selectedBg` background and font-medium Loan # cell.
- Columns (alignment): **Loan #** (left), **Borrower** (left), **Orig Bal** (right), **Principal** (right), **Interest** (right), **Total UPB** (right, font-medium; computed = principal + interest + escrowBalance + otherBalance), **Rate** (right, `intRate.toFixed(2)` + "%"), **Payment** (right), **Status** (center, badge).
- Currency format: `$` + toLocaleString with 0 decimals.
- Status badge: px-1.5 py-0.5 rounded text-xs; labels: PA→"Performing", FA→"Forbearance", FC→"Foreclosure", JG→"Judgment", LT→"Litigation", ''→"Active". Colors (all white text): FC `bg-red-600` #dc2626, LT `bg-orange-600` #ea580c, JG `bg-yellow-600` #ca8a04, FA `bg-blue-600` #2563eb, PA `bg-green-600` #16a34a; unknown/empty → themed input bg + muted text.
- **Totals row** (`<tfoot>`, always shown): `tableHeaderBg`, 2px top border (`border-t-2` themed), font-medium. First cell spans 2 cols: "Totals ({N} loans)". Then sums of Orig Bal, Principal, Interest, Total UPB (sum of the four balance components), then **principal-weighted average rate** (Σ rate·principal / Σ principal, toFixed(2)+"%"; 0 if no principal), sum of Payment, empty Status cell.

### 1.3 Collateral Summary card
- h3 "Collateral Summary". Empty state: text-sm muted "No collateral linked to this relationship". Rows = collateral where `relatedLoans === currentRelationship`, keyed by mwPropertyNo.
- Columns: **Type** (left; collateralCode), **Description** (left), **Location** (left; "{city}, {state}"), **Appraised** (right; `$` + raw string value), **BPO** (right; `$` + raw string), **Lien Pos** (center; sellerLienPosition), **Lien Amt** (right; `$` + raw string), **Taxes** (right; `$` + raw string), **Dlq Taxes** (right; `$` + raw string; **red rule: if parsed numeric value > 0 the cell is `text-red-500` #ef4444 + font-medium**, else `textPrimary`). Money columns render the stored strings verbatim (may contain commas); numeric parsing strips `$` and `,`.
- **Totals row only when > 1 collateral item**: same tfoot styling; first cell colSpan 3 "Totals ({N} items)"; sums (0-decimal locale format) for Appraised, BPO, (blank Lien Pos), Lien Amt, Taxes, Dlq Taxes (totals Dlq Taxes cell is plain `textPrimary`, not red).

### 1.4 Borrower Summary card
- h3 "Borrower Summary". Empty state: "No borrowers in this relationship". Rows = borrowers where `relationship === currentRelationship`, keyed by id.
- Columns: **Name** (left), **Type** (center, badge: px-1.5 py-0.5 rounded text-xs white text; 'Guarantor' → `bg-purple-600` #9333ea, anything else → `bg-sky-600` #0284c7), **Location** (left; "{city}, {state}"), **Credit Score** (center, font-medium, **color rules on parseInt(creditScore): ≥720 → `text-green-500` #22c55e; ≥680 → `text-yellow-500` #eab308; >0 → `text-red-500` #ef4444; else (0/blank/non-numeric) → themed `textPrimary`**; displays creditScore or '-'), **Score Date** (center; creditScoreDate or '-'), **BK Status** (center, badge: if bkStatus is set and not 'none'/'None' → `bg-red-600` white; else themed input bg + muted; text = bkStatus or 'None'), **SSN/EIN** (left, **font-mono, masked via `maskSsnEin`**).
- Masking rule (`src/utils/formatters.ts`): strip dashes/spaces; if < 4 chars return as-is; keep last 4 digits; if original had a dash at index 2 (EIN XX-XXXXXXX) → `**-***{last4}`; otherwise (SSN) → `***-**-{last4}`. Empty → ''.

### 1.5–1.7 Three narrative sections (each its own card, in order)
1. **"Relationship Overview"** — auto-resizing `<textarea>` (min-height 120px, grows to scrollHeight, `resize-none overflow-hidden`), placeholder "Enter relationship overview details...".
2. **"Collateral Overview"** — identical textarea, placeholder "Enter collateral overview details...".
3. **"Bid Conditions"** — single-line `<input type="text">`, placeholder "Enter bid conditions...".
- All inputs: themed input bg + border, rounded, px-3 py-2, w-full, text-sm, `textPrimary`, focus:outline-none + themed focus border. aria-labels match their headings.
- Persistence: all three values stored together in localStorage key **`gui-v7-overview`** as JSON `{relationshipOverview, collateralOverview, bidConditions}`; loaded on mount, saved on every change; textareas re-measured on content change and once after mount (setTimeout 0).

---

## 2. StrategiesTab (`src/components/tabs/StrategiesTab.tsx`)

Relationship-level (not per-loan). Structure: p-4 container → single card → h3 **"Strategies"** → one auto-resizing `<textarea>`:
- min-height **150px**, grows to content (`Math.max(150, scrollHeight)`), `resize-none overflow-hidden`, placeholder "Enter strategy notes...", aria-label "Strategies"; same themed input styling as Overview narratives (rounded, px-3 py-2, w-full, text-sm, focus border).
- Persistence: raw string (not JSON) in localStorage key **`gui-v7-strategies`**; loaded on mount, saved on change; resize on change + once after mount.
That is the entire tab content.

---

## 3. ProjectionsTab (`src/components/tabs/ProjectionsTab.tsx` + `projections/` subfolder)

Per-loan cash flow projections and exit scenarios. Settings persisted per loan via React Query mutations (`useProjectionSettings`/`useUpdateProjectionSetting`, `useExitSettings`/`useUpdateExitSetting`). Guards: "Loading..." while any of loans/payments/collateral/proj-settings/exit-settings load; "No loan selected" if no loan data or settings.

### Subfolder components/hooks (roles)
- `components/ModeSelector.tsx` — toggle between **'modern'** (default) and **'classic'** modes.
- `components/LoanHeader.tsx` — header strip for selected loan (loan no + key loan data).
- `components/ProjectionSettingsPanel.tsx` — payment/rate/expense assumptions inputs.
- `components/ExitSettingsPanel.tsx` — exit scenario inputs + exit value summary.
- `components/BidStatisticsPanel.tsx` — read-only bid metrics with discount-rate input; has `compact` variant for Classic mode.
- `components/CashFlowTable.tsx` — reusable year×month cash-flow grid (props: title, data, colorMode 'income'|'expense'|'net', filterEmptyYears, sortedYears/yearSums/formatCurrency/useStickyHeader for Classic).
- `components/ClassicEntryForm.tsx` — manual entry form for Classic-mode cash flow entries.
- `hooks/useProjectionCalculations.ts` — projected payment/rate, exit value, add-back, total exit proceeds, month-input sanitization/blur handlers.
- `hooks/useProjectionGrid.ts` — builds income/expenses/netCashFlow grids (+ sorted years and year sums).
- `hooks/useBidStatistics.ts` — bid price, bid %, MOIC, cash yield, bid/collateral %, F12/P12, YTM IRR/XIRR; discount rate state.
- `types.ts` — `ClassicEntry` and related types.

### Layout order (Modern mode)
1. **ModeSelector** (Modern | Classic).
2. **LoanHeader**.
3. **Two-column grid (grid-cols-2, gap-4)**: LEFT column stacked (space-y-4): (a) **Projection Settings panel**, (b) **Exit Scenario Settings panel**; RIGHT column: **Bid Statistics panel** (full-size).
4. Below (mt-4, space-y-4), three **CashFlowTable** grids in order: **"Projected Income"** (colorMode income), **"Projected Expenses"** (expense), **"Net Cash Flow"** (net) — all with filterEmptyYears.

### Layout order (Classic mode)
Three-column grid (grid-cols-3, gap-4): LEFT 2/3 (col-span-2, stacked): **ClassicEntryForm**, then CashFlowTables **"Income"**, **"Expenses"** (filterEmptyYears), **"Net Cash Flow"** — each with sortedYears, yearSums, formatCurrency, sticky headers; RIGHT 1/3: **BidStatisticsPanel compact**.

### Projection Settings panel — field groups (h3 "Projection Settings")
- **Payment Method** (h4): method `<select>`; conditional inputs **"Amount:"** (User Payment Amount, placeholder 0.00) and **"Amort (mo):"** (placeholder 360).
- **Rate Method** (h4): method `<select>`; conditional **"Rate (%):"** (placeholder 0.00).
- **Expense Assumptions** (h4): **"Initial Legal ($):"** (placeholder 0), **"Start Month:"** (placeholder 1), **"Holding Costs ($/mo):"** (placeholder 0), **"Through Month:"** (placeholder 12), **"Add Back Basis:"** (`<select>`), **"Recovery (%):"** (placeholder 0; has dedicated change/blur handlers).
- Field labels: text-xs `textMuted`, block, mb-1.

### Exit Scenario Settings panel — field groups (h3 "Exit Scenario Settings")
- **"Cash Flow Start Month:"** (placeholder 1) and **"Exit Month:"** (placeholder 24) — locally-buffered inputs with blur sanitization; external updates skipped while the field is focused.
- **"Exit Method"** `<select>` — options from `EXIT_METHODS` (`src/data/constants.ts`): **'Pay in Full', 'DPO', 'Value Cap', 'User Enter', 'YTM Sell Solve', 'Liquidation'** (default 'Pay in Full').
- Method-conditional fields: **"DPO %:"** (placeholder 95), **"Value Cap %:"** (placeholder 90), **"Exit Value ($):"** (placeholder 0.00, userEnterAmount), **"Desired YTM %:"** (placeholder 12.00), and for Liquidation: **"Liquidation Months:"** (placeholder 12) + checkbox **"Add interest (${loan interest, localized})"** (liquidationAddInterest).
- **Exit Value Summary** (bottom, border-t separator, 3-col grid of read-only tiles: `readOnlyBg`, rounded, p-2, bordered, centered): **Exit Value** (yellow, red if negative; non-finite → 0), **Add Back Recovery** (yellow), **Total Exit Proceeds** (green). All `$` 0-decimal locale format.

### Bid Statistics panel (h3 "Bid Statistics")
- Header row includes **Discount Rate** input (label "Discount Rate:" or "Disc:" when compact) with "%" suffix.
- **Primary metrics** (2-col grid of read-only tiles, bold value): **Bid Price** (`$` 0-dec; green ≥0 else red), **Bid %** (toFixed(1)+"%", primary color).
- **Secondary metrics** (4-col grid, 2-col when compact; centered, font-medium): **MOIC** (toFixed(2)+"x"; green ≥1 else yellow), **Cash Yield** (toFixed(1)+"%"; green ≥0 else red), **Bid/Collat** (toFixed(1)+"%"; green ≤70, yellow ≤90, red otherwise), **F12/P12** (signed toFixed(1)+"%" with leading "+" when ≥0; green >0, red <0, primary at 0; shows muted "N/A" when p12CashFlow ≤ 0).
- **YTM metrics** (below top border, 2-col grid, bold): **YTM (IRR)** (toFixed(2)+"%"; green ≥0 else red; sub-caption "Contractual + exit" in non-compact) and **YTM (XIRR)** (same format; sub-caption "Date-adjusted" in non-compact).

---

## 4. ReportTab (`src/components/tabs/ReportTab.tsx`) — section order

Print-oriented investor report, max-w-6xl centered; all mid sections use a collapsible `Section` wrapper with h2 (text-base font-semibold) title.

1. **Report Header** (card, p-6): h1 "Investor Report: {relationship}" + "Generated {long date}"; blue "Print / Export PDF" button (hidden in print); then a 5-tile Key Metrics row: Total UPB, Collateral Value, LTV %, Loans count, Borrowers count.
2. **Property Map** — 400px Leaflet/OpenStreetMap map with blue subject-property markers (popup: description, address, appraised) and amber comparable-sale markers (popup: sale price/date, sqft, $/sqft, distance); dot legend below with counts.
3. **Property Photos** — a PhotoGallery per collateral item titled "{description} - {address1}, {city}"; empty-state message when no photos.
4. **Comparable Sales Analysis** — clickable comps table (#, Address, Sale Price, Date, SqFt, $/SqFt, Distance, Type, Photos-count) where clicking a row toggles an expanded inline PhotoGallery for that comp.
5. **Portfolio Analysis** — two Recharts side by side: Loan Status Distribution pie (labeled "name (value)") and UPB vs Collateral Value grouped bar chart per loan (blue #3b82f6 UPB / green #22c55e Collateral).
6. **Collateral Valuation Comparison** — grouped bar chart per property: Appraised #3b82f6, BPO #8b5cf6, Our Value #22c55e, Tax Market #f59e0b.
7. **Payment History Trend** (only if trend data exists) — blue line chart of payment amount by period.
8. **Loan Portfolio Detail** — per-loan table (Loan #, Borrower, Asset Type, Orig Bal, Principal, Interest, Total UPB, Rate, Payment, Status badge with inline hex status colors, gray #6b7280 fallback).
9. **Footer** — centered muted "Confidential - For Authorized Investor Use Only" + "{relationship} Relationship Report | Generated {date}".

---
