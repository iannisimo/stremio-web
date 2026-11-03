# HTPC Cleanup Implementation Plan

> **For agentic workers:** Implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Carry out the audit's delete and small-edit decisions, so the tree only holds what HTPC mode runs and the known remote bugs (issues A, B) are fixed.

**Architecture:** Delete unused upstream code, then cut the branches and features the audit dropped (phone layouts, gamepad, shortcuts, updaters, Live TV page, cast / options / volume / statistics menus, top-bar buttons, addon install). Then make small in-place edits to live upstream files and our own. Each task leaves the app building and usable. The reworks (guide, statistics, QR share, Addons section, colour swatches, typeable numbers, Play URL keyboard, `ModalDialog` users) and the arrow-moves pass (issue C) are separate plans.

**Tech Stack:** React 18, webpack, LESS modules, Norigin spatial navigation, pnpm 11 via `npx pnpm@11.8.0`, Node 22.

**Spec:** `HTPC-AUDIT.md` (item numbers `#N` and issues A–D below refer to it). Also `FORK.md`.

## Global Constraints

- No unit tests (user's rule). Each task is verified by: the build, the type-check against the baseline, the dead-code script, and a short check in the shared Chromium (`PLAN.md`, "Shared browser") that the user watches.
- Build: `npx pnpm@11.8.0 run build` in `stremio-web/` must finish without errors. Dev server (`pnpm start`) must say "compiled successfully" before browser checks; restart it after file moves.
- Type-check: `npx tsc --noEmit -p .` in `stremio-web/`; baseline is **45** `error TS` lines (2026-11-03). A task may lower it, never raise it.
- Existing jest tests (`npx pnpm@11.8.0 test`) keep passing, notably `tests/tvDetail.spec.js`.
- Live upstream files: smallest edit that does the job (`FORK.md` conventions, memory "Minimal upstream diffs"). Deleting whole upstream files the audit marked delete is allowed.
- Every task updates `FORK.md` (replaced / edited / hidden / our-own tables and the merge `git log` path list) for what it touched.
- Commits only when the user asks; terse messages in the repo's style (`feat:`, `fix:`, `refactor:`, `docs:`), no co-author lines.
- Never press Enter in the browser on Log out, Confirm (streaming server URL) or anything that changes settings, unless the step says so.

## Review Focus

- A deleted component still exported or imported through a barrel (`components/index.ts`, `NavBar/index.js`, `services/index.js`, `routes/index.js`) or lazily inside a hidden branch: the build may pass but a screen renders `undefined`. Each delete task runs `grep -rn "<Name>" src` for every removed export and opens the screens that imported it.
- Player focus keys of removed popups (`player-popup-cast`, `player-popup-statistics`, the options menu) still referenced by `TvControls/usePlayerKeys.ts` / `useTvPlayer.ts`: Back or refocus would target nothing. Task 7 and 8 grep for them and open / close every remaining popup with Back.
- A profile with `gamepadSupport: true` (set from another device): the app must start and behave like any other profile. Task 4 checks `App.js` no longer reads it.
- Live TV channels from an EPG-provider addon now open in `TvDetail`: a `tv` item with no videos must show its streams and no episodes panel or "Mark as watched". Task 6 checks a channel page.
- A dialog opened on one route stays on top after switching route (issue D): after each task that removes or adds a dialog, open it, switch page with the rail, and confirm no dialog is left over (`document.querySelectorAll('.modal-container').length === 0`).

---

## Phase A: deletions

### Task 0: Baseline

**Files:**
- Use: `../tools/dead-code.mjs`, `../tools/dead-code-cuts.txt`, `../tools/hold-enter.mjs`, `../tools/cdp.mjs`

- [ ] **Step 1:** Run the build. Expected: success.
- [ ] **Step 2:** Run the type-check and count. Expected: `45`.
- [ ] **Step 3:** Run `node tools/dead-code.mjs stremio-web tools/dead-code-cuts.txt > /tmp/dead-before.txt` from the project root. Expected stderr: `dead: 96 files, 6940 lines`. Later tasks compare against this list.

### Task 1: Remove upstream code nothing imports (#1, #13, #23, #25, #32, #78, #86, #96, #98, #102, #68, Library placeholder)

**Files:**
- Delete: `src/components/ActionMenu/`, `src/components/MetaRow/`, `src/components/Multiselect/`, `src/components/Scale/`, `src/components/EventModal/EventModal.js`, `src/components/EventModal/styles.less`, `src/components/EventModal/index.js`, `src/routes/Settings/Menu/`, `src/routes/Board/StreamingServerWarning/`, `src/routes/Library/Placeholder/`, `src/routes/Calendar/Placeholder/`, `src/routes/Intro/`, `src/routes/Player/VideosMenu/`, `src/routes/MetaDetails/StreamsList/StreamsList.js`, `src/routes/MetaDetails/StreamsList/styles.less`, `src/routes/MetaDetails/StreamsList/index.js`, `src/routes/MetaDetails/VideosList/`
- Keep: `src/components/EventModal/useEvents.js`, `src/routes/MetaDetails/StreamsList/Stream/`
- Modify: `src/components/index.ts` (drop `MetaRow`, `EventModal` exports; `Scale` imports `./TvScale` with no comment needed), `src/routes/index.js` (drop the `// upstream: require('./Intro')` comment), `FORK.md`

- [ ] **Step 1:** Delete the files listed.
- [ ] **Step 2:** `grep -rn "ActionMenu\|MetaRow\|'stremio/components/Multiselect'\|Multiselect\b\|components/Scale\|EventModal/EventModal\|Settings/Menu\|StreamingServerWarning\|VideosMenu\|StreamsList/StreamsList\|VideosList\|routes/Intro" src`. Expected: no hits outside comments; fix any that remain.
- [ ] **Step 3:** Build and type-check. Expected: build OK, `≤ 45`.
- [ ] **Step 4:** Dead-code script. Expected: none of the deleted paths listed; total lower than Task 0.
- [ ] **Step 5:** Browser: Home (rows, Continue Watching), Library, Settings → Interface (zoom stepper), `/intro` (when logged out: our login screen; when logged in just load `#/intro` and go back), a detail page with streams and episodes. Expected: all render, no console errors (`node tools/cdp.mjs eval` on `window.onerror` log, or check the dev server overlay).
- [ ] **Step 6:** Update `FORK.md`: remove the deleted files from "Upstream components we replaced" (they no longer exist), drop their paths from the merge `git log` list.
- [ ] **Step 7:** Commit: `refactor: drop unused upstream components`.

### Task 2: Fold `MultiselectMenu` into `TvSelect` (#41)

**Files:**
- Move: `src/components/MultiselectMenu/Label/` → `src/components/TvSelect/Label/`, `src/components/MultiselectMenu/types.d.ts` → `src/components/TvSelect/types.d.ts`
- Delete: the rest of `src/components/MultiselectMenu/`, `src/common/useOutsideClick.ts` (only `MultiselectMenu.tsx` used it)
- Modify: `src/components/TvSelect/TvSelect.tsx` (`import Label from './Label'`), `src/components/index.ts` (`MultiselectMenu` export stays, from `./TvSelect`, comment removed), `FORK.md`

**Interfaces:**
- Produces: `MultiselectMenuOption` stays a global ambient type (used by `common/useLanguageSorting.ts`).

- [ ] **Step 1:** Move and delete as listed; fix imports.
- [ ] **Step 2:** `grep -rn "MultiselectMenu/" src`. Expected: no hits.
- [ ] **Step 3:** Build, type-check (`≤` previous count; `MultiselectMenuOption` must still resolve).
- [ ] **Step 4:** Browser: Discover type picker and Settings → Player subtitle language: list opens centred, Up / Down, Back closes, focus returns to the field.
- [ ] **Step 5:** `FORK.md` (TvSelect row: no upstream `Label` dependency any more). Commit: `refactor: tv select owns its label`.

### Task 3: Drop the Live TV page; channels use `TvDetail` (#75)

**Files:**
- Delete: `src/routes/MetaDetails/LiveTvDetails/` (incl. `Placeholder/`)
- Modify: `src/routes/MetaDetails/MetaDetails.js` (remove the `type === 'tv'` loading branch, the `isLiveMeta` branch and the `tv` branch of `MetaDetailsFallback`; `isEpgProvider` / `isLiveMeta` go if nothing else reads them; `HorizontalNavBar` import goes), `src/routes/MetaDetails/TvDetail/TvDetailInfo.tsx` (no "Mark as watched" when `meta.type === 'tv'`), `FORK.md` (the loss is already listed in `HTPC-AUDIT.md` "Missing features").

- [ ] **Step 1:** Edit `MetaDetails.js` so every meta, including Live TV, renders the `TvDetail` branch.
- [ ] **Step 2:** Hide the watched action in `TvDetailInfo` for `type === 'tv'`.
- [ ] **Step 3:** Delete the folder; build; type-check.
- [ ] **Step 4:** Browser: open `#/detail/tv/iptv_b00241420c1785e0/iptv_b00241420c1785e0` (7 Gold). Expected: `TvDetail` layout, no "Mark as watched", one stream row ("M3U/EPG TV Addon"), no episodes panel. Then a movie and a series page still look as before.
- [ ] **Step 5:** `FORK.md`. Commit: `feat: live tv channels open in the detail page`.

### Task 4: Remove phone layouts and the Discover filters dialog (#4, #22, #72, #73, #95)

**Files:**
- Delete: `src/components/BottomSheet/`, `src/components/MetaPreviewSheet/`, `src/routes/Discover/FiltersSheet/`, `src/routes/Calendar/Details/`
- Modify: `src/routes/Discover/Discover.js` (remove `MetaPreviewSheet`, `FiltersSheet`, the `isMobile` filters / preview branches, the "All filters" button, its `ModalDialog` and `filtersOpen` state; keep `isMobile` only if other code still reads it, else remove the constant), `src/routes/Calendar/Calendar.tsx` (remove `BottomSheet` + `Details` and `detailsInSheet`), `src/components/ColorInput/ColorInput.tsx` (remove the `isMobile` branch and constant), `src/components/EpgProgramModal/EpgProgramModal.tsx` (remove the `isMobile` branch and constant), `src/components/index.ts` (drop `BottomSheet`), `FORK.md`

- [ ] **Step 1:** Make the edits and deletions.
- [ ] **Step 2:** `grep -rn "BottomSheet\|MetaPreviewSheet\|FiltersSheet\|Calendar/Details\|isMobile\b\|detailsInSheet" src`. Expected: only unrelated hits (e.g. `platform.isMobile` in Settings stays).
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser: Discover (pickers in one row, side preview on a card), Calendar (grid + list at TV size, see `HTPC-AUDIT.md` "TV-size rendering"), Settings → Player colour button still opens its dialog.
- [ ] **Step 5:** `FORK.md` (remove the "phone-layout media query replaced by false" rows, add the deletions). Commit: `refactor: drop phone layouts`.

### Task 5: Remove gamepad support and keyboard-shortcut UI (#19a, #35, #49, #50, #85, #107)

**Files:**
- Delete: `src/services/GamepadContext/`, `src/services/GamepadNavigation/`, `src/App/GamepadModal/`, `src/App/ShortcutsModal/`, `src/routes/Settings/Shortcuts/`, `src/components/ShortcutsGroup/`
- Modify: `src/services/index.js` (drop gamepad exports), `src/App/App.js` (drop `GamepadProvider`, `gamepadSupportEnabled` state and effect, `gamepadModalOpen`, `shortcutModalOpen`, the `shortcuts` / `gamepadGuide` shortcut cases), `src/components/MainNavBars/MainNavBars.tsx` (drop the two gamepad hooks and their refs if unused), `src/components/NavBar/HorizontalNavBar/HorizontalNavBar.js` (drop `useHorizontalNavGamepadNavigation`), `src/routes/Player/Player.js` (drop `useGamepad` and its handlers, `useContentGamepadNavigation`), `src/routes/Settings/Settings.tsx` (drop the Shortcuts section, its ref and menu entry), `src/routes/Settings/Interface/Interface.tsx` (drop `SHOW_GAMEPAD` and the gamepad option), `src/components/index.ts` (drop `ShortcutsGroup`), `FORK.md`

- [ ] **Step 1:** Make the edits and deletions. `useInterfaceOptions.ts` keeps `gamepadSupportToggle` (upstream hook, now unused by us).
- [ ] **Step 2:** `grep -rn "Gamepad\|gamepad\|ShortcutsModal\|ShortcutsGroup\|SECTIONS.SHORTCUTS" src`. Expected: only `Ctx.d.ts`, `useInterfaceOptions.ts`, `Settings/constants.ts` (if `SHORTCUTS` is still declared there, leave it).
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser: Home → arrows / Enter / Back work; Settings shows General, Interface, Player, Streaming (no Shortcuts); Interface has no gamepad row; player opens (`#/player/…` from any stream) and Back leaves.
- [ ] **Step 5:** `FORK.md`. Commit: `refactor: drop gamepad support and shortcut screens`.

### Task 6: Remove update banners (#47, #52, #53)

**Files:**
- Delete: `src/App/UpdaterBanner/`, `src/App/WebUpdateScreen/`, `src/components/UpdateBanner/`
- Modify: `src/App/App.js` (drop `UpdaterBanner` and its container class if only it used it), `src/index.js` (drop `WebUpdateScreen`), `src/components/index.ts` (drop `UpdateBanner`), `FORK.md`

- [ ] **Step 1:** Edit and delete. Leave `webpack.config.js` (Workbox) untouched.
- [ ] **Step 2:** `grep -rn "UpdaterBanner\|WebUpdateScreen\|UpdateBanner\|useServiceWorkerUpdater" src`. Expected: none.
- [ ] **Step 3:** Build (production, as the package does), type-check. Browser: app loads.
- [ ] **Step 4:** `FORK.md`. Commit: `refactor: drop update banners`.

### Task 7: Remove cast, options, context menu and old statistics popup from the player (#9, #56, #61, #65)

**Files:**
- Delete: `src/routes/Player/CastDevicesMenu/`, `src/routes/Player/OptionsMenu/`, `src/routes/Player/StatisticsMenu/`, `src/components/ContextMenu/`, and `src/routes/Player/usePlayOnDevice.ts` / `useCastDevice.ts` if nothing else imports them
- Modify: `src/routes/Player/Player.js` (drop the menus' state, their entries in `menusOpen` / `closeMenus` / the `openMenu` mapping, the `ContextMenu` + `OptionsMenu` block, the `CastDevicesMenu` and `StatisticsMenu` `Transition`s, the `statisticsMenu` D-hold shortcut handling, `playbackDevices` if unused), `src/routes/Player/ControlBar/ControlBar.js` (drop the cast and "…" buttons and their props), `src/routes/Player/SubtitlesMenu/SubtitleVariant/SubtitleVariant.tsx` (drop its `ContextMenu`), `src/routes/Player/TvControls/*` (drop references to removed popups, keep `TvStatistics`), `src/routes/Player/TvControls/tvPlayer.less` (drop rules for removed buttons), `src/components/index.ts` (drop `ContextMenu`), `FORK.md`
- Keep: the `Chromecast` service in `App.js` / `services/` (out of scope).

- [ ] **Step 1:** Make the edits and deletions.
- [ ] **Step 2:** `grep -rn "CastDevices\|OptionsMenu\|StatisticsMenu\|ContextMenu\|player-popup-cast\|player-popup-statistics\|usePlayOnDevice\|useCastDevice" src`. Expected: none (except `TvStatistics`).
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser: open the player (failing stream `#/player/eAEBLwDQ%2F3sidXJsIjoiaHR0cDovLzEyNy4wLjAuMTo5L2RvZXMtbm90LWV4aXN0Lm1wNCJ9TwIOfw%3D%3D` is enough for the bar); right click on the video does nothing; subtitles / audio / speed popups open and Back closes them with focus back on their button.
- [ ] **Step 5:** `FORK.md` ("Upstream UI we hide": cast and "…" no longer hidden, gone). Commit: `refactor: drop cast and options menus from the player`.

### Task 8: Remove app volume and the "more" toggle (#69, #108)

**Files:**
- Delete: `src/routes/Player/VolumeChangeIndicator/`, `src/routes/Player/ControlBar/VolumeSlider/`
- Modify: `src/routes/Player/ControlBar/ControlBar.js` (drop the mute button, the volume slider, the buttons-menu toggle and its `buttonsMenuOpen` state; the buttons group container is always shown), `src/routes/Player/Player.js` (drop the `VolumeChangeIndicator` block, the `volume` shortcut, the wheel-to-volume handler, volume props to the control bar), `src/routes/Player/TvControls/tvPlayer.less` (drop the rules that hid them), `FORK.md`

- [ ] **Step 1:** Edit and delete. Volume stays wherever the player starts it (100 %).
- [ ] **Step 2:** `grep -rn "VolumeSlider\|VolumeChangeIndicator\|onMuteButtonClick\|toggleButtonsMenu\|data-tv-hidden" src`. Expected: none left that refer to removed buttons; if `data-tv-hidden` has no users, drop its CSS rule too.
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser at 760 px and at TV size: control bar shows play, next, statistics (torrents only), speed, subtitles, audio, episodes, scale; nothing hidden-but-focusable (`document.querySelectorAll('[data-tv-hidden]').length === 0`).
- [ ] **Step 5:** `FORK.md` (remove the "Upstream UI we hide" player part). Commit: `refactor: drop app volume controls`.

### Task 9: Top bar without back, fullscreen or profile menu (#26)

**Files:**
- Delete: `src/components/NavBar/VerticalNavBar/`, `src/components/NavBar/HorizontalNavBar/NavMenu/`, `src/components/NavBar/HorizontalNavBar/SearchBar/SearchBar.js`, `…/SearchBar/styles.less`, `…/SearchBar/index.js` (keep `useLocalSearch.*`, `useSearchHistory.*`)
- Modify: `src/components/NavBar/HorizontalNavBar/HorizontalNavBar.js` (render only title and HDR badge; drop back, search bar, fullscreen and nav menu), `src/components/NavBar/index.js` (only `HorizontalNavBar`), `src/components/index.ts` (drop `VerticalNavBar`), `src/components/MainNavBars/MainNavBars.tsx` (drop the `HorizontalNavBar` branch, `search` constant and style), `src/routes/NotFound/NotFound.js` (drop the removed props), `src/routes/Player/Player.js` (drop the removed props), `FORK.md`

- [ ] **Step 1:** Edit and delete.
- [ ] **Step 2:** `grep -rn "VerticalNavBar\|NavMenu\|HorizontalNavBar/SearchBar'\|backButton\|fullscreenButton\|navMenu" src`. Expected: none.
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser: `#/does-not-exist` shows the title only, Backspace leaves; player top bar shows the title; Search page field and history still work (hooks kept).
- [ ] **Step 5:** `FORK.md`. Commit: `refactor: top bar shows the title only`.

### Task 10: Announcements without outside links; no addon install from Discover (#13, part of #3)

> Changed while executing: `AddonDetailsModal` and `Checkbox` stay until the Addons route is replaced (reworks plan): `Addons.js` uses them throughout its list code. This task only drops the install entry points outside the Addons page.

**Files:**
- Delete: `src/components/AddonDetailsModal/`, `src/components/Checkbox/`
- Modify: `src/routes/Addons/Addons.js` (drop the `AddonDetailsModal` dialog, `useAddonDetailsTransportUrl`, `receivesWatchActivity`), `src/routes/Discover/Discover.js` (drop the addon dialog and its opener), `src/components/ModalDialog/ModalDialog.js` (drop the `checkboxes` prop and `Checkbox` import), `src/components/TvEventModal/TvEventModal.js` (no "Install addon"; keep "Learn more" only when `externalUrl` starts with `#/` or `stremio://`, else no link action), `src/components/index.ts`, `FORK.md`

**Interfaces:**
- Produces: `isInternalLink(url: string): boolean` in `TvEventModal.js` (true for `#/…` and `stremio://…`).

- [ ] **Step 1:** Edit and delete.
- [ ] **Step 2:** `grep -rn "AddonDetailsModal\|Checkbox\b\|checkboxes" src`. Expected: none.
- [ ] **Step 3:** Build, type-check.
- [ ] **Step 4:** Browser: `#/addons?addon=https%3A%2F%2Fexample.com%2Fmanifest.json` shows the notice and no dialog; Discover pickers work; open Play URL from the rail, close it, switch page with the rail: `document.querySelectorAll('.modal-container').length === 0`.
- [ ] **Step 5:** `FORK.md`. Commit: `refactor: drop addon install dialog`.

## Phase B: small edits

### Task 11: Held Enter no longer presses dialog buttons (issue B)

**Files:**
- Modify: `src/components/Button/Button.tsx` (`onKeyDown`: ignore `event.repeat` for Enter, before `click()`), `FORK.md` (Button row)

- [ ] **Step 1:** Run `node tools/hold-enter.mjs 1200` with focus on an episode row (`#/detail/series/tt0903747`, a row in the list). Expected now: dialog closes ~0.16 s after it opens (bug).
- [ ] **Step 2:** Make the edit; dev server compiles.
- [ ] **Step 3:** Repeat on an episode row and on a stream row (`#/detail/series/tt0903747/tt0903747%3A5%3A1`, an AIOStreams row). Expected: `after.dialogs === 1`, page hash unchanged.
- [ ] **Step 4:** Short Enter on a card still opens it; hold on a Home card still opens its dialog.
- [ ] **Step 5:** Commit: `fix: held enter doesn't press dialog buttons`.

### Task 12: Focused chips scroll into view (#15, issue A)

> Status 2026-11-03: implemented and committed; at 700 px most focused chips scroll into view, two didn't in a test while the browser drew no frames. Recheck with the Chromium window visible.

**Files:**
- Modify: `src/components/HorizontalScroll/HorizontalScroll.tsx` (on focus inside, `scrollIntoView({ block: 'nearest', inline: 'nearest' })` the focused element), `src/routes/MetaDetails/TvDetail/TvDetailInfo.tsx` (same for the genre / cast / writer / director rows), `FORK.md`

- [ ] **Step 1:** Make the edits (a `focusin` listener on the row element).
- [ ] **Step 2:** Browser at 760 px: Library chips → each focused chip fully inside the row; Hocus Pocus detail → → from "Add to Library" onto a hidden writer chip scrolls it into view.
- [ ] **Step 3:** Commit: `fix: keep focused chips in view`.

### Task 13: Right click on rows opens our row menu; drop `Popup` (#29)

**Files:**
- Modify: `src/components/Video/Video.js`, `src/routes/MetaDetails/StreamsList/Stream/Stream.js` (remove their `Popup` menus and handlers; the row stays a `Button`)
- Delete: `src/components/Popup/` (no users after Task 9 and this one)
- Modify: `src/components/index.ts`, `FORK.md`

- [ ] **Step 1:** Edit and delete; `grep -rn "Popup\b" src | grep -v TvPopup\|withTvPopup\|NextVideoPopup`. Expected: none.
- [ ] **Step 2:** Build, type-check.
- [ ] **Step 3:** Browser: right click on an episode row and on a stream row opens our dialog (`useLongPressEnter`'s `onContextMenu`).
- [ ] **Step 4:** Commit: `refactor: one row menu for mouse and remote`.

### Task 14: Drop `ActionsGroup` from `MetaPreview` (#2)

**Files:**
- Delete: `src/components/ActionsGroup/`, `src/components/MetaPreview/Ratings/Ratings.tsx` (+ its styles and the `Ratings` export in `Ratings/index`; keep `useRating.ts`)
- Modify: `src/components/MetaPreview/MetaPreview.js` (drop the `ActionsGroup` and `Ratings` blocks), `FORK.md`

- [ ] **Step 1:** Edit and delete; `grep -rn "ActionsGroup\|Ratings'" src`. Expected: only `useRating` imports.
- [ ] **Step 2:** Build, type-check. Browser: Discover side preview; detail page like / love buttons still work (`useRating`).
- [ ] **Step 3:** Commit: `refactor: drop meta preview action row`.

### Task 15: Settings trims (#80, #82, #83)

**Files:**
- Modify: `src/routes/Settings/General/General.tsx` (remove Export user data, Subscribe to calendar, Discord toggle; keep Log in / out, Trakt, outside links), `src/routes/Settings/Interface/Interface.tsx` (hide "Quit on close", "Escape exits fullscreen"), `src/routes/Settings/Player/Player.tsx` (hide "Play in background", "Pause when minimized", "Play in external player"), `FORK.md`

- [ ] **Step 1:** Hide with one `const SHOW_… = false;` per option, like the existing `SHOW_SHIFT_SEEK`; remove the General buttons and their handlers / imports (`useDataExport` stays if still imported elsewhere, else delete it).
- [ ] **Step 2:** Build, type-check. Browser: each section shows the remaining options only.
- [ ] **Step 3:** Commit: `feat: trim settings for the tv`.

### Task 16: Selecting the selected subtitles turns them off (#66)

**Files:**
- Modify: `src/routes/Player/SubtitlesMenu/SubtitlesMenu.js` (`subtitlesLanguageOnClick`, `subtitlesTrackOnSelect`: when the clicked language is the current track's language, or the clicked track is the selected one, call `onSubtitlesTrackSelected(null)` and `onExtraSubtitlesTrackSelected(null)`), `FORK.md`

- [ ] **Step 1:** Edit.
- [ ] **Step 2:** Browser (needs a playable stream; in Chromium use a stream that plays, e.g. the AIOStreams one on Breaking Bad S5E1): pick a language, pick it again → subtitles off ("Off" selected); same for a variant.
- [ ] **Step 3:** Commit: `feat: pick the selected subtitles again to turn them off`.

### Task 17: Streaming server URL pick reachable (#30)

> Status 2026-11-03: implemented; not tried live (only one server URL is configured and it's the selected one, so its radio is disabled). Add a second URL to test.

**Files:**
- Modify: `src/components/RadioButton/RadioButton.tsx` (the clickable element becomes a `Button` with `disabled` passed through), `FORK.md`

- [ ] **Step 1:** Edit.
- [ ] **Step 2:** Browser: Settings → Streaming, arrows reach the radio of each URL; the selected one is skipped (disabled). Do not press Enter.
- [ ] **Step 3:** Commit: `fix: streaming server url pick reachable by remote`.

### Task 18: Enter on a calendar day focuses that day in the list (#91)

**Files:**
- Modify: `src/routes/Calendar/Episode/Episode.tsx` (forward `focusKey` to its `Button`), `src/routes/Calendar/List/Item/Item.tsx` (first episode of a day gets `focusKey` `calendar-day-<YYYY-MM-DD>`), `src/routes/Calendar/Calendar.tsx` (on cell select, `setFocus('calendar-day-<date>')` if `doesFocusableExist`), `FORK.md`

**Interfaces:**
- Produces: focus key format `calendar-day-${year}-${month}-${day}` (zero-padded, same as `epgDateKey`).

- [ ] **Step 1:** Edit.
- [ ] **Step 2:** Browser at TV size: Enter on a day with episodes → focus on its first episode in the list; on an empty day → nothing moves.
- [ ] **Step 3:** Commit: `feat: calendar day jumps to its episodes`.

### Task 19: `Tv` prefix for our components (#14, #28, #31)

**Files:**
- Rename: `src/components/FullscreenDialog/` → `TvFullscreenDialog/`, `src/components/PlayUrlDialog/` → `TvPlayUrlDialog/`, `src/components/Rail/` → `TvRail/` (`RailButton` → `TvRailButton`), `src/routes/Board/Hero/` → `TvHero/`, `src/components/MetaItem/MetaItemActions.js` → `TvMetaItemActions.js`, `src/routes/MetaDetails/TvDetail/RowActions.tsx` → `TvRowActions.tsx`, `src/services/KeepFullscreen/` → `TvKeepFullscreen/`; component names inside follow
- Modify: every importer, `FORK.md`, `HTPC-AUDIT.md` (mark renames done)

- [ ] **Step 1:** `git mv` and update imports; restart the dev server.
- [ ] **Step 2:** `grep -rn "FullscreenDialog\|PlayUrlDialog\|components/Rail\|RailButton\|Board/Hero\|MetaItemActions\|RowActions\|KeepFullscreen" src | grep -v "Tv"`. Expected: none.
- [ ] **Step 3:** Build, type-check, jest. Browser: Home, a dialog (hold Enter on a card), Play URL, rail; after closing each dialog and switching page, no `.modal-container` is left.
- [ ] **Step 4:** Commit: `refactor: tv prefix for our components`.

### Task 20: Close out

- [ ] **Step 1:** Dead-code script; compare with Task 0. Expected: the remaining dead files are only ones the audit kept on purpose (list them in `HTPC-AUDIT.md`).
- [ ] **Step 2:** Mark done items in `HTPC-AUDIT.md` ("Status" line), refresh `FORK.md` "Last upstream commit merged" if a merge happened meanwhile.
- [ ] **Step 3:** Commit: `docs: audit cleanup done`.

## Next plans

- **Reworks:** guide TV navigation (#71), statistics for every stream (#57), Share QR with `qrcode.react` (#34), Addons section in Settings + Addons route and `components/SearchBar` removal (#90, #101, #33), `TvColorInput` swatches (#8), typeable season / episode (#27), Play URL with `TvTextInput` (#28, issue D), `ModalDialog` users to `TvFullscreenDialog` and delete it (#12, #24, #51).
- **Moves pass:** issue C.
