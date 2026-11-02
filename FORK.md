# Stremio HTPC fork: notes for merging upstream

This branch turns stremio-web into a TV / remote-first UI. To keep merges with
upstream (`Stremio/stremio-web`, branch `development`) cheap, new behaviour
lives in new files wherever possible, and upstream files are only touched
where there is no other hook.

The catch: a clean merge doesn't mean nothing changed for us. If upstream
changes a component we replaced, git reports no conflict, but we don't get the
change either. The lists below say where to look.

## Merging upstream

Last upstream commit merged: `c34935cc3` (update this after every merge).

```sh
git fetch upstream
git merge upstream/development        # or: git rebase upstream/development
```

Then:

1. See what upstream changed in the files we replaced (table below), between
   the last merged commit and the new one. Replace `<last-merged>` with the
   commit recorded above:

   ```sh
   git log --oneline <last-merged>..upstream/development -- \
       src/components/NavBar/VerticalNavBar \
       src/components/MetaRow \
       src/components/EventModal \
       src/routes/Board/StreamingServerWarning \
       src/routes/MetaDetails/StreamsList \
       src/routes/MetaDetails/VideosList \
       src/components/MetaPreview \
       src/components/MultiselectMenu
   ```

   Port anything worth keeping (bug fixes, new options) into our versions.
2. Build and type-check: `pnpm run build` (or `npx pnpm@11.8.0 run build`
   without a global pnpm), then `npx tsc --noEmit -p .`. Some `tsc` errors
   already exist upstream; compare with the previous run.
3. Quick manual pass: Home (rail, hero, rows, Continue Watching), Discover
   (preview, long press), the event and streaming-server dialogs.

## Upstream components we replaced

These upstream files are left untouched, but no longer used by the screens
listed. Upstream fixes to them have to be ported by hand.

| Upstream file(s) | Replaced by | Used in |
|---|---|---|
| `src/components/NavBar/VerticalNavBar/` (+ `NavTabButton`) | `src/components/Rail/` | `MainNavBars` (every main page) |
| `src/components/MetaRow/` (+ `MetaRowPlaceholder`) | `src/components/TvRow/` | Home (`Board`) |
| `src/components/EventModal/EventModal.js` (UI only) | `src/components/TvEventModal/` | Home |
| `src/routes/Board/StreamingServerWarning/` | `src/routes/Board/TvServerWarning/` | Home |
| `src/components/MultiselectMenu/` (menu + `Dropdown`, `Option`; `Label` still used) | `src/components/TvSelect/` (same props; centered list, Back closes, focus returns to the label) | Every dropdown: swapped in `src/components/index.ts` |
| `src/components/MetaPreview/` (info + actions), `src/routes/MetaDetails/StreamsList/StreamsList.js`, `src/routes/MetaDetails/VideosList/` (+ `SeasonsBar`) | `src/routes/MetaDetails/TvDetail/` | Detail page (not Live TV) |
| `src/routes/Intro/` (login, sign up, Facebook/Apple, guest, password reset) | `src/routes/TvIntro/` (code login + email/password only) | `/intro` |
| `src/components/TextInput/TextInput.tsx` (as a page field) | `src/components/TvTextInput/` (read-only field, Enter opens the editor with the real `TextInput`) | Every `TextInput` user except read-only ones (`SharePrompt`) and `PlayUrlDialog` (already a dialog, imports `TextInput/TextInput` directly) |
| Top bar (`HorizontalNavBar`) on main pages | `Rail` (search; no profile menu) | Kept only on the Search page |

Still upstream's and reused by our versions, so their changes reach us:
`MetaDetails/StreamsList/Stream`, `components/Video`, `MetaDetails/EpisodePicker`,
`SharePrompt`, `MetaPreview/Ratings/useRating`, `EventModal/useEvents.js`, `useProfile`, `useStreamingServer`, the core
models, `NavMenu`, `MetaItem`, `Button`.

## Upstream files we edit

Small edits, likely to conflict only if upstream rewrites the same lines.

| File | What we changed | Why |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | `@noriginmedia/norigin-spatial-navigation` | Remote navigation engine |
| `package.json`, `pnpm-lock.yaml` | `react-simple-keyboard` (pinned) | On-screen keyboard in the text editor |
| `src/common/Shortcuts/Shortcuts.tsx` | Drops the `general` group (tabs 1-6, 0 search, Backspace back, F fullscreen, Ctrl+/, Ctrl+G, interface scale); player shortcuts stay | Keys belong to the remote and the on-screen keyboard |
| `src/App/App.js` | Renders `KeepFullscreen` inside `FullscreenProvider` | "Always fullscreen" setting |
| `src/routes/Settings/Interface/Interface.tsx` | "Always fullscreen" toggle (localStorage, not core settings) | Same |
| `src/index.js` | `initNavigation()` | Start key handling, focus sync, input mode |
| `src/App/App.js` | Removed `require('spatial-navigation-polyfill')` | Conflicts with Norigin on arrow keys |
| `src/App/styles.less` | Imports `tv.less` at the end | Theme tokens and global rules live in `tv.less` |
| `src/components/index.ts` | `MultiselectMenu` export points at `TvSelect` | All dropdowns use the TV picker |
| `src/components/Button/Button.tsx` | Registers with Norigin (`focusable`, `focusKey`, `onArrowPress`) | Makes every button remote-reachable |
| `src/components/MainNavBars/` | `Rail` instead of both nav bars; top bar only on Search | TV shell |
| `src/components/MetaItem/MetaItem.js` | Card click plays when it can; no dismiss X, play button or three-dots menu; long press / right click opens `MetaItemActions` | TV cards, one action menu; square posters drawn as 2:3 posters |
| `src/components/MetaItem/styles.less` | Hover highlight only in mouse mode | Resting cursor doesn't fake focus |
| `src/components/LibItem/LibItem.js` | Keeps `onDismissClick` to itself | `MetaItem` no longer renders the X |
| `src/components/ContinueWatchingItem/ContinueWatchingItem.js` | Dropped `actionMenu` | Menu replaced by the dialog |
| `src/components/MetaPreview/MetaPreview.js`, `MetaLinks/` | Opt-in `readOnly` mode (pills, no action buttons) | Discover preview |
| `src/components/NavBar/HorizontalNavBar/NavMenu/NavMenu.js` | `direction` prop | Was for the rail's profile menu (removed); unused now |
| `src/routes/MetaDetails/MetaDetails.js` | Normal branch renders `TvDetail`; no `HorizontalNavBar`, no gamepad hook (Live TV branches unchanged) | Detail page TV layout |
| `src/routes/MetaDetails/StreamsList/Stream/Stream.js` | Forwards `focusKey` to the row's `Button` | Remote focus on stream rows |
| `src/components/Video/Video.js` | Inner play button `focusable={false}` | Row is the only focus stop |
| `src/routes/Board/Board.js`, `styles.less` | Hero, landscape Continue Watching, `TvRow`, our dialogs | Home redesign |
| `src/routes/Discover/Discover.js` | Preview `readOnly`, backdrop, `metaItem` on cards; `isMobile` forced to `false`; `data-tv-start` on the card grid | Discover; no bottom-sheet preview/filters on narrow or tall screens |
| `src/routes/Calendar/Calendar.tsx`, `src/components/EpgProgramModal/EpgProgramModal.tsx`, `src/routes/MetaDetails/LiveTvDetails/LiveTvDetails.tsx`, `src/components/ColorInput/ColorInput.tsx` | Phone-layout media query replaced by `false` (and its imports dropped) | No bottom sheets on narrow or tall screens |
| `src/router/Route/Route.js` | `view` prop; route-container is a focus group via `useRouteFocusScope` | Hidden routes stay mounted; only the top one takes focus, and per-route keys (sidebar) don't collide |
| `src/router/Routes.tsx` | Passes `view` to `Route`; swallows the skipped view transition's rejected `ready` | Same; "Transition was skipped" runtime error when a push lands mid-transition |
| `src/routes/Player/Player.js` | Wraps the TV control bar, popups and root from `TvControls/`; `useTvPlayer`; `statistics` passed to the control bar; `seekForward`/`seekBackward`/`volume` shortcuts `enabled=false`; `exit` only closes an open menu; no back/fullscreen in the top bar; container mouse leave ignored in keyboard mode | Remote-first player |
| `src/routes/Player/ControlBar/ControlBar.js` | `focusKey`s and `disabled` on the buttons; `data-tv-statistics` on the statistics button; mute, cast, "…" and the buttons-menu toggle `data-tv-hidden` + `focusable={false}` | Same |
| `src/routes/Player/ControlBar/SeekBar/SeekBar.js`, `styles.less` | Slider is focusable (`player-seek`), focus style on the thumb; time label not focusable | ←/→ seek on the focused bar |
| `src/routes/Player/SideDrawerButton/` | Focusable (`player-drawer-button`), Enter opens | Remote reach |
| `src/routes/Player/useKeyboardSeek.ts` | `seekBy` honours a caller's larger offset while held | Remote hold-to-seek ramp |
| `src/routes/Player/SubtitlesMenu/Stepper/Stepper.tsx` | Enter steps once; buttons at the limit not focusable | Subtitles popup |
| `src/components/TextInput/index.ts` | Default export is `TvTextInput` | Every text field opens a full-screen editor |
| `src/routes/index.js` | `Intro` points at `TvIntro` | Code login first, TV login form |
| `src/services/Navigation/navigation.ts`, `index.ts` | `addKeyInterceptor`; remote Select/Menu keys; `getCurrentFocusKey` export | Screens that claim keys first (player) |

## Upstream UI we hide

Still rendered (smaller merges), but hidden: mute button and volume slider, the
"…" options button (right click still opens `OptionsMenu`), the cast button,
the small-screen "more" toggle, the top bar's back/fullscreen buttons and logo.
Buttons get `data-tv-hidden` + `focusable={false}`; the rest is hidden by
attribute selectors in `src/routes/Player/TvControls/tvPlayer.less`. If
upstream renames those classes, they show up again.

## Our own files

Never touched by upstream merges.

- `src/services/Navigation/`: Norigin setup, DOM-focus sync, input mode
  (keyboard vs mouse), `useFocusGroup`, `useLongPressEnter`, `mergeRefs`,
  focus fallback (first arrow lands on the visible control nearest the top
  left, or inside a `data-tv-start` container), sidebar/content crossing, `useRouteFocusScope` / `useRouteScope`
  (route-prefixed keys).
- `src/services/KeepFullscreen/`: "Always fullscreen" setting (localStorage
  `keepFullscreen`) and the listener that re-enters fullscreen on any key or
  click, through upstream `useFullscreen` (works in the shell too).
- `src/components/FullscreenDialog/`: full-screen dialog used for alerts and
  card actions.
- `src/components/MetaItem/MetaItemActions.js`: card actions dialog.
- `src/components/PlayUrlDialog/`: "Play URL / magnet" from the rail (uses
  upstream's `usePlayUrl`, replaces the profile menu's clipboard item).
- `src/components/Rail/`, `TvRow/`, `TvEventModal/`, `TvSelect/`.
- `src/routes/MetaDetails/TvDetail/`: detail page (layout, info block, episodes and
  streams panels, season switcher, long-press row actions, `detailLogic.js` with
  tests in `tests/tvDetail.spec.js`). Rows are upstream's `Stream` / `Video`,
  restyled with `[class*="name-"]` selectors from `TvStreamsPanel.less` /
  `TvEpisodesPanel.less`; check those if upstream renames inner classes.
- `src/components/TvTextInput/`: text field as a focus stop; the editor
  syncs the page field's value live (callers read `ref.current.value`),
  calls `onSubmit` after closing, Cancel restores the old value.
  `TvKeyboard`: `react-simple-keyboard` with our layouts and theme (its CSS
  isn't imported); one focus stop, arrows move between keys.
- `src/routes/TvIntro/`: login screen. Code / QR login through link.stremio.com
  (then core's `LoginWithToken`), "Standard login" for email and password.
- `src/routes/Board/Hero/`, `src/routes/Board/TvServerWarning/`.
- `src/App/tv.less`: theme tokens (`--tv-*`), background, keyboard-mode rules.
- `src/routes/Player/TvControls/`: player remote handling (`useTvPlayer`,
  `usePlayerKeys`: hidden-controls seek, Back closes popups and refocuses
  the opener), the control bar focus group, the player focus boundary,
  `TvPopup` / `withTvPopup` around upstream's menus (speed, subtitles and
  audio centered, restyled with `[class*="name-"]` selectors in
  `TvPopup.less`; check those if upstream renames inner classes), and
  `TvStatistics` (panel shown while the statistics button is focused or
  hovered; upstream's `StatisticsMenu` no longer opens).

## Conventions

- New code in TypeScript where practical; reuse upstream hooks and models,
  never copy their logic.
- When replacing an upstream component, add a new one and switch the import,
  rather than rewriting the upstream file. Update this file.
