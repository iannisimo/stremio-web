# Stremio HTPC fork: notes for merging upstream

This branch turns stremio-web into a TV / remote-first UI. To keep merges with
upstream (`Stremio/stremio-web`, branch `development`) cheap, new behaviour
lives in new files wherever possible, and upstream files are only touched
where there is no other hook.

Upstream files we replaced or don't need are deleted (see `HTPC-AUDIT.md`).
When upstream changes one of them, the merge stops with a modify/delete
conflict: read the change, port what's worth keeping into our version, then
`git rm` the file again. Replaced files that are still in the tree merge
cleanly without reaching us; the lists below say where to look.

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
       src/components/MultiselectMenu \
       src/routes/Intro \
       src/routes/Settings/Menu \
       src/components/Scale \
       src/routes/Library/Placeholder \
       src/routes/Calendar/Placeholder
   ```

   Port anything worth keeping (bug fixes, new options) into our versions.
2. Build and type-check: `pnpm run build` (or `npx pnpm@11.8.0 run build`
   without a global pnpm), then `npx tsc --noEmit -p .`. Some `tsc` errors
   already exist upstream; compare with the previous run.
3. Quick manual pass: Home (rail, hero, rows, Continue Watching), Discover
   (preview, long press), the event and streaming-server dialogs.

## Upstream components we replaced

Upstream fixes to these have to be ported by hand. "Deleted" ones come back as
modify/delete conflicts; the others are still in the tree but unused.

| Upstream file(s) | Replaced by | Used in | In tree |
|---|---|---|---|
| `src/components/NavBar/VerticalNavBar/` (+ `NavTabButton`) | `src/components/TvRail/` | `MainNavBars` (every main page) | deleted |
| `src/components/MetaRow/` (+ `MetaRowPlaceholder`) | `src/components/TvRow/` | Home (`Board`) | deleted |
| `src/components/EventModal/EventModal.js` (UI only) | `src/components/TvEventModal/` | Home | deleted (`useEvents.js` kept) |
| `src/routes/Board/StreamingServerWarning/` | `src/routes/Board/TvServerWarning/` | Home | deleted |
| `src/components/MultiselectMenu/` (menu, `Dropdown`, `Option`, `Label`) | `src/components/TvSelect/` (same props; centered list, Back closes, focus returns to the label). `Label` and the `MultiselectMenuOption` type (`types.d.ts`) moved into `TvSelect/` | Every dropdown: swapped in `src/components/index.ts` | deleted |
| `src/components/MetaPreview/` (info + actions), `src/routes/MetaDetails/StreamsList/StreamsList.js`, `src/routes/MetaDetails/VideosList/` (+ `SeasonsBar`) | `src/routes/MetaDetails/TvDetail/` | Detail page, Live TV channels included | `StreamsList.js`, `VideosList.js` deleted; `MetaPreview`, `SeasonsBar` (player side drawer) kept |
| `src/routes/Intro/` (login, sign up, Facebook/Apple, guest, password reset) | `src/routes/TvIntro/` (code login + email/password only) | `/intro` | deleted |
| `src/components/TextInput/TextInput.tsx` (as a page field) | `src/components/TvTextInput/` (read-only field, Enter opens the editor with the real `TextInput`) | Every `TextInput` user except read-only ones (`SharePrompt`) and `TvPlayUrlDialog` (already a dialog, imports `TextInput/TextInput` directly) | yes (used inside our editor) |
| `src/routes/Settings/Menu/` | `src/routes/Settings/TvMenu/` (same props; focus picks the section) | Settings | deleted |
| `src/components/Scale/` | `src/components/TvScale/` (same props; left/right step the options) | Settings > Interface zoom | deleted |
| `src/routes/Library/Placeholder/`, `src/routes/Calendar/Placeholder/` (logged out) | `Library/TvPlaceholder/`, `Calendar/TvPlaceholder/` (same texts, `TvNotice`) | Library, Calendar | deleted |
| Top bar (`HorizontalNavBar`, + its `SearchBar` and history popup) on main pages | `TvRail` (no profile menu); on Search, `Search/TvSearchField` and `Search/TvSearchHistory` (still use `SearchBar`'s `useSearchHistory` / `useLocalSearch`) | Not shown on main pages | `SearchBar` UI deleted; the bar itself stays (player, NotFound) |

Still upstream's and reused by our versions, so their changes reach us:
`MetaDetails/StreamsList/Stream`, `components/Video`, `MetaDetails/EpisodePicker`,
`SharePrompt`, `MetaPreview/Ratings/useRating` (its `Ratings` component is deleted), `EventModal/useEvents.js`, `useProfile`, `useStreamingServer`, the core
models, `MetaItem`, `Button`, `NavBar/HorizontalNavBar/SearchBar/useSearchHistory` /
`useLocalSearch`.

Deleted with nothing replacing them (unused in HTPC mode): `components/ActionMenu`
(card three-dots menu), `components/Multiselect`, `routes/Player/VideosMenu`,
`common/useOutsideClick.ts`, `routes/MetaDetails/LiveTvDetails/` (Live TV page:
channels open in `TvDetail`, which hides "Mark as watched" for `tv` items),
`routes/MetaDetails/styles.less`, and the phone layouts: `components/BottomSheet`,
`components/MetaPreviewSheet`, `routes/Discover/FiltersSheet`,
`routes/Calendar/Details`; gamepad support: `services/GamepadContext`,
`services/GamepadNavigation`, `App/GamepadModal` (and its calls in `App.js`,
`MainNavBars`, `HorizontalNavBar`, `Player.js`, `services/index.js`); shortcut
screens: `App/ShortcutsModal`, `routes/Settings/Shortcuts`,
`components/ShortcutsGroup`; top bar parts: `NavBar/VerticalNavBar`,
`NavBar/HorizontalNavBar/NavMenu` (profile menu), the `SearchBar` UI (its two
hooks stay); update banners (the package builds with
`SERVICE_WORKER_DISABLED=true` and the shell never sends the auto-updater
message): `App/UpdaterBanner`, `App/WebUpdateScreen`, `components/UpdateBanner`; player menus: `routes/Player/CastDevicesMenu`,
`routes/Player/OptionsMenu`, `routes/Player/StatisticsMenu`, `components/ContextMenu`
(also dropped from `SubtitlesMenu/SubtitleVariant`: no right-click download /
copy URL); app volume: `routes/Player/VolumeChangeIndicator`,
`routes/Player/ControlBar/VolumeSlider`; `components/Popup` (its last users were
the episode and stream row menus; `MetaItem/styles.less` lost the matching rule);
`components/ActionsGroup`, `components/MetaPreview/Ratings/Ratings.tsx`.
Their style rules in `Board/styles.less`, `Search/styles.less` and
`MetaItem/styles.less` (cross-module `:import`s of `MetaRow` / `Multiselect`
classes) went with them.

## Upstream files we edit

Small edits, likely to conflict only if upstream rewrites the same lines.

| File | What we changed | Why |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | `@noriginmedia/norigin-spatial-navigation` | Remote navigation engine |
| `package.json`, `pnpm-lock.yaml` | `react-simple-keyboard` (pinned) | On-screen keyboard in the text editor |
| `src/common/Shortcuts/Shortcuts.tsx` | Drops the `general` group (tabs 1-6, 0 search, Backspace back, F fullscreen, Ctrl+/, Ctrl+G, interface scale) and the player's `statisticsMenu` (hold D); other player shortcuts stay | Keys belong to the remote and the on-screen keyboard |
| `src/App/App.js` | Renders `TvKeepFullscreen` inside `FullscreenProvider`; no `GamepadProvider`, gamepad guide or shortcuts dialog (and their shortcut cases) | "Always fullscreen" setting; gamepad support and shortcut screens dropped |
| `src/routes/Settings/Interface/Interface.tsx` | Gamepad option removed; "Always fullscreen" toggle (localStorage, not core settings); quit on close and Escape-exits-fullscreen hidden (`SHOW_WINDOW_OPTIONS = false`) | Same |
| `src/index.js` | `initNavigation()` | Start key handling, focus sync, input mode |
| `src/App/App.js` | Removed `require('spatial-navigation-polyfill')` | Conflicts with Norigin on arrow keys |
| `src/App/styles.less` | Imports `tv.less` at the end | Theme tokens and global rules live in `tv.less` |
| `src/components/index.ts` | `MultiselectMenu` export points at `TvSelect` | All dropdowns use the TV picker |
| `src/components/Button/Button.tsx` | Registers with Norigin (`focusable`, `focusKey`, `onArrowPress`); repeated Enter keydowns don't click | Makes every button remote-reachable; a held Enter (long press) doesn't press the dialog it opens |
| `src/components/MainNavBars/` | `TvRail` instead of both nav bars; no top bar; no gamepad hooks | TV shell |
| `src/components/MetaItem/MetaItem.js` | Card click plays when it can; no dismiss X, play button or three-dots menu; long press / right click opens `TvMetaItemActions` | TV cards, one action menu; square posters drawn as 2:3 posters |
| `src/components/MetaItem/styles.less` | Hover highlight only in mouse mode | Resting cursor doesn't fake focus |
| `src/components/LibItem/LibItem.js` | Keeps `onDismissClick` to itself | `MetaItem` no longer renders the X |
| `src/components/ContinueWatchingItem/ContinueWatchingItem.js` | Dropped `actionMenu` | Menu replaced by the dialog |
| `src/components/MetaPreview/MetaPreview.js`, `MetaLinks/`, `styles.less` | Opt-in `readOnly` mode (pills, no action buttons); no library / watched icon row (`ActionsGroup`) or thumbs (`Ratings`) | Discover preview; those controls live on our detail page |
| `src/components/NavBar/HorizontalNavBar/HorizontalNavBar.js`, `NavBar/index.js` | Title and HDR badge only: no back, logo, search bar, fullscreen or profile menu (`NavMenu`); only `HorizontalNavBar` exported | Player top bar and NotFound |
| `src/components/HorizontalScroll/HorizontalScroll.tsx` | `onFocus={keepFocusedInView}` (our `services/Navigation`) | Focused chip scrolls fully into view |
| `src/common/Toast/ToastItem/ToastItem.js` | No close button; the toast is never a focus stop (`focusable={false}`); restyled in our `App/tv.less` with `[class*="toast-item-container-"]` selectors (check those if upstream renames the classes) | Toasts time out on their own and must not steal remote focus |
| `src/components/RadioButton/RadioButton.tsx` | Registers with Norigin (`useFocusable`, not focusable while disabled / selected) | Settings → Streaming: pick the server URL with the remote |
| `src/routes/Settings/General/General.tsx`, `General.less` | No data export (`useDataExport` deleted), calendar subscription or Discord toggle; account, Trakt and outside links stay | Only things that work from the TV |
| `src/routes/NotFound/NotFound.js` | Back key leaves (`TvDetail/useDetailBack` with upstream `useGoBack`) | No back button in the top bar any more |
| `src/routes/MetaDetails/MetaDetails.js` | Always renders `TvDetail` (Live TV branches, `LiveTvDetails`, its placeholder and `styles.less` removed); no `HorizontalNavBar`, no gamepad hook | Detail page TV layout; Live TV page dropped (`HTPC-AUDIT.md` #75, "Missing features") |
| `src/routes/MetaDetails/StreamsList/Stream/Stream.js`, `styles.less` | Forwards `focusKey` to the row's `Button`; no `Popup` menu (copy links / play), the row renders directly; right click and long press open our `TvRowActions` | Remote focus on stream rows; one row menu for mouse and remote |
| `src/components/Video/Video.js`, `styles.less` | Inner play button `focusable={false}`; no `Popup` menu (watched / rest watched), the row renders directly; right click and long press open our `TvRowActions` | Row is the only focus stop; one row menu |
| `src/routes/Board/Board.js`, `styles.less` | `TvHero`, landscape Continue Watching, `TvRow`, our dialogs | Home redesign |
| `src/routes/Discover/styles.less`, `Discover/Guide/Header/Header.less` | `:import` of `Label.less` points at `TvSelect/Label/` | `MultiselectMenu` deleted |
| `src/routes/Player/SideDrawer/SideDrawer.less` | Dropped the rule for upstream's dropdown (`Dropdown.less` import) | `MultiselectMenu` deleted; the season picker is `TvSelect` |
| `src/routes/Discover/Discover.js` | Preview `readOnly`, backdrop, `metaItem` on cards; `data-tv-start` on the card grid; phone layout (bottom-sheet preview and filters), the "All filters" button + dialog and the missing-addon "Install" button removed | Discover; the pickers always fit in one row on a TV |
| `src/routes/Calendar/Calendar.tsx`, `src/components/EpgProgramModal/EpgProgramModal.tsx`, `src/components/ColorInput/ColorInput.tsx` (+ `.less`) | Phone-layout branches removed (bottom sheets) | `BottomSheet` deleted |
| `src/router/Route/Route.js` | `view` prop; route-container is a focus group via `useRouteFocusScope` | Hidden routes stay mounted; only the top one takes focus, and per-route keys (sidebar) don't collide |
| `src/router/Routes.tsx` | Passes `view` to `Route`; swallows the skipped view transition's rejected `ready` | Same; "Transition was skipped" runtime error when a push lands mid-transition |
| `src/routes/Player/Player.js` | Wraps the TV control bar, popups and root from `TvControls/`; `useTvPlayer`; `statistics` passed to the control bar; `seekForward`/`seekBackward` shortcuts `enabled=false`; no app volume (mute / volume shortcuts, wheel volume, `VolumeChangeIndicator` removed); `exit` only closes an open menu; no back/fullscreen in the top bar; container mouse leave ignored in keyboard mode; no options / context menu, cast devices menu or statistics popup (their state and the cast device search removed; `useCastDevice` / `usePlayOnDevice` kept for the playback flow) | Remote-first player |
| `src/routes/Player/ControlBar/ControlBar.js` | `focusKey`s and `disabled` on the buttons; `data-tv-statistics` on the statistics button; cast, "…", mute, volume slider and the buttons-menu toggle removed (the button group is always `open`) | Same |
| `src/routes/Player/ControlBar/SeekBar/SeekBar.js`, `styles.less` | Slider is focusable (`player-seek`), focus style on the thumb; time label not focusable | ←/→ seek on the focused bar |
| `src/routes/Player/SideDrawerButton/` | Focusable (`player-drawer-button`), Enter opens | Remote reach |
| `src/routes/Player/useKeyboardSeek.ts` | `seekBy` honours a caller's larger offset while held | Remote hold-to-seek ramp |
| `src/routes/Player/SubtitlesMenu/SubtitlesMenu.js` | Picking the selected language or the selected track again turns subtitles off | One button press to switch subtitles off and on |
| `src/routes/Player/SubtitlesMenu/Stepper/Stepper.tsx` | Enter steps once; buttons at the limit not focusable | Subtitles popup |
| `src/components/TextInput/index.ts` | Default export is `TvTextInput` | Every text field opens a full-screen editor |
| `src/routes/index.js` | `Intro` points at `TvIntro` | Code login first, TV login form |
| `src/routes/Addons/Addons.js` | `SHOW_ADDONS_LIST = false`: `TvAddonsNotice` (use web/mobile, QR to web.stremio.com; log in first when logged out) in place of the list and filters; dialogs kept, so `?addon=` install links still work | Managing addons with a remote is painful |
| `src/routes/Library/Library.js`, `src/routes/Calendar/Calendar.tsx` | `Placeholder` import points at `TvPlaceholder` | Logged-out notice in the TV style |
| `src/routes/Calendar/Calendar.tsx`, `List/Item/Item.tsx`, `Episode/Episode.tsx` | Enter on a day focuses its first episode in the list (`calendarDayFocusKey.ts`, ours); `Episode` forwards `focusKey` | Posters inside a day cell aren't reachable by remote |
| `src/routes/Search/Search.js`, `styles.less` | `TvSearchField` on top; `TvSearchHistory` in place of the hints; `TvRow` instead of `MetaRow`; row spacing | Search page, like Home |
| `src/routes/Settings/Player/Player.tsx` | Shift + arrow seek time hidden (`SHOW_SHIFT_SEEK = false`); play in background, external player and pause-on-minimize hidden (`SHOW_DESKTOP_PLAYBACK = false`) | A remote has no Shift; the shell's mpv is the player |
| `src/routes/Settings/Settings.tsx` | Imports `TvMenu` as `Menu`; the menu selects one section instead of scrolling; only the selected section renders (`Info` with General); `TvPane` around the sections; no Shortcuts section | Two-pane settings |
| `src/routes/Settings/Settings.less`, `components/Section/Section.less`, `components/Option/Option.less` | Pane padding; wider section, bigger heading; options as full-width rows lit by `:focus-within` | Same |
| `src/components/index.ts` | `Scale` export points at `TvScale` | Same |
| `src/services/Navigation/navigation.ts`, `index.ts` | `addKeyInterceptor`; remote Select/Menu keys; `getCurrentFocusKey` export | Screens that claim keys first (player) |

## Upstream UI we hide

Still rendered, but hidden: the player top bar's logo (attribute selector in
`src/routes/Player/TvControls/tvPlayer.less`; if upstream renames the class it
shows up again). The player buttons we don't use are deleted.

## Our own files

Never touched by upstream merges.

- `src/services/Navigation/`: Norigin setup, DOM-focus sync, input mode
  (keyboard vs mouse), `useFocusGroup`, `useLongPressEnter`, `mergeRefs`,
  focus fallback (first arrow lands on the visible control nearest the top
  left, or inside a `data-tv-start` container; never on a group; a page with
  nothing focusable lands on the rail's current tab), page autofocus (a page
  that comes on top focuses its first control right away, or what it had when
  coming back; `data-tv-own-focus` opts out (player, detail), `data-tv-wait`
  holds it while content loads (hero)), sidebar/content crossing (not
  from dialogs or `data-tv-arrows` controls that use left/right themselves), `useRouteFocusScope` / `useRouteScope`
  (route-prefixed keys).
- `src/services/TvKeepFullscreen/`: "Always fullscreen" setting (localStorage
  `keepFullscreen`) and the listener that re-enters fullscreen on any key or
  click, through upstream `useFullscreen` (works in the shell too).
- `src/components/TvFullscreenDialog/`: full-screen dialog used for alerts and
  card actions.
- `src/components/MetaItem/TvMetaItemActions.js`: card actions dialog.
- `src/components/TvPlayUrlDialog/`: "Play URL / magnet" from the rail (uses
  upstream's `usePlayUrl`, replaces the profile menu's clipboard item).
- `src/components/TvRail/`, `TvRow/`, `TvEventModal/` (announcements: no "Install addon"; a link action only for in-app links, `#/…` or `stremio://…`), `TvSelect/`.
- `src/routes/MetaDetails/TvDetail/`: detail page (layout, info block, episodes and
  streams panels, season switcher, long-press row actions, `detailLogic.js` with
  tests in `tests/tvDetail.spec.js`). Rows are upstream's `Stream` / `Video`,
  restyled with `[class*="name-"]` selectors from `TvStreamsPanel.less` /
  `TvEpisodesPanel.less`; check those if upstream renames inner classes.
- `src/components/TvTextInput/`: text field as a focus stop; the editor
  syncs the page field's value live (callers read `ref.current.value`),
  calls `onSubmit` after closing, Cancel restores the old value. Optional
  `suggestions` prop: chips between the field and the keyboard, picking one submits it.
  `TvKeyboard`: `react-simple-keyboard` with our layouts and theme (its CSS
  isn't imported); one focus stop, arrows move between keys.
- `src/routes/Settings/TvMenu/`, `TvPane/`, `src/components/TvScale/`: two-pane
  settings (section list, right pane focus group) and the zoom stepper.
- `src/components/TvNotice/`: full-page notice (icon, title, points, actions, side
  visual), used by `Addons/TvAddonsNotice/` and the `TvPlaceholder`s.
- `assets/images/web_addons_qr.svg`: QR for `https://web.stremio.com/#/addons`,
  made with `qrencode -t SVG --svg-path -m 0 -l M`.
- `src/routes/Search/TvSearchField/`, `TvSearchHistory/`: search field (opens
  the text editor, with `useLocalSearch` suggestions) and history chips.
- `src/routes/TvIntro/`: login screen. Code / QR login through link.stremio.com
  (then core's `LoginWithToken`), "Standard login" for email and password.
- `src/routes/Board/TvHero/`, `src/routes/Board/TvServerWarning/`.
- `src/App/tv.less`: theme tokens (`--tv-*`), background, keyboard-mode rules, toast restyle.
- `src/routes/Player/TvControls/`: player remote handling (`useTvPlayer`,
  `usePlayerKeys`: hidden-controls seek, Back closes popups and refocuses
  the opener), the control bar focus group, the player focus boundary,
  `TvPopup` / `withTvPopup` around upstream's menus (speed, subtitles and
  audio centered, restyled with `[class*="name-"]` selectors in
  `TvPopup.less`; check those if upstream renames inner classes), and
  `TvStatistics` (panel shown while the statistics button is focused or
  hovered; upstream's `StatisticsMenu` is deleted).

## Conventions

- New code in TypeScript where practical; reuse upstream hooks and models,
  never copy their logic.
- When replacing an upstream component, add a new one and switch the import,
  rather than rewriting the upstream file. Update this file.
