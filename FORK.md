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
       src/routes/Board/StreamingServerWarning
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
| Top bar (`HorizontalNavBar`) on main pages | `Rail` (search; no profile menu) | Kept only on the Search page |

Still upstream's and reused by our versions, so their changes reach us:
`EventModal/useEvents.js`, `useProfile`, `useStreamingServer`, the core
models, `NavMenu`, `MetaItem`, `Button`.

## Upstream files we edit

Small edits, likely to conflict only if upstream rewrites the same lines.

| File | What we changed | Why |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | `@noriginmedia/norigin-spatial-navigation` | Remote navigation engine |
| `src/index.js` | `initNavigation()` | Start key handling, focus sync, input mode |
| `src/App/App.js` | Removed `require('spatial-navigation-polyfill')` | Conflicts with Norigin on arrow keys |
| `src/App/styles.less` | Imports `tv.less` at the end | Theme tokens and global rules live in `tv.less` |
| `src/components/Button/Button.tsx` | Registers with Norigin (`focusable`, `focusKey`, `onArrowPress`) | Makes every button remote-reachable |
| `src/components/MainNavBars/` | `Rail` instead of both nav bars; top bar only on Search | TV shell |
| `src/components/MetaItem/MetaItem.js` | Card click plays when it can; no dismiss X, play button or three-dots menu; long press / right click opens `MetaItemActions` | TV cards, one action menu |
| `src/components/MetaItem/styles.less` | Hover highlight only in mouse mode | Resting cursor doesn't fake focus |
| `src/components/LibItem/LibItem.js` | Keeps `onDismissClick` to itself | `MetaItem` no longer renders the X |
| `src/components/ContinueWatchingItem/ContinueWatchingItem.js` | Dropped `actionMenu` | Menu replaced by the dialog |
| `src/components/MetaPreview/MetaPreview.js`, `MetaLinks/` | Opt-in `readOnly` mode (pills, no action buttons) | Discover preview |
| `src/components/NavBar/HorizontalNavBar/NavMenu/NavMenu.js` | `direction` prop | Was for the rail's profile menu (removed); unused now |
| `src/routes/Board/Board.js`, `styles.less` | Hero, landscape Continue Watching, `TvRow`, our dialogs | Home redesign |
| `src/routes/Discover/Discover.js` | Preview `readOnly`, backdrop, `metaItem` on cards | Discover |

## Our own files

Never touched by upstream merges.

- `src/services/Navigation/`: Norigin setup, DOM-focus sync, input mode
  (keyboard vs mouse), `useFocusGroup`, `useLongPressEnter`, `mergeRefs`.
- `src/components/FullscreenDialog/`: full-screen dialog used for alerts and
  card actions.
- `src/components/MetaItem/MetaItemActions.js`: card actions dialog.
- `src/components/PlayUrlDialog/`: "Play URL / magnet" from the rail (uses
  upstream's `usePlayUrl`, replaces the profile menu's clipboard item).
- `src/components/Rail/`, `TvRow/`, `TvEventModal/`.
- `src/routes/Board/Hero/`, `src/routes/Board/TvServerWarning/`.
- `src/App/tv.less`: theme tokens (`--tv-*`), background, keyboard-mode rules.

## Conventions

- New code in TypeScript where practical; reuse upstream hooks and models,
  never copy their logic.
- When replacing an upstream component, add a new one and switch the import,
  rather than rewriting the upstream file. Update this file.
