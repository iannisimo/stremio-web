# Navigation problems

Problems the remote navigation has to solve. Problems only, no solutions.

Still in place (not navigation): Enter / held Enter / right click on items,
remote Select and Menu keys, input mode (keyboard hides hover), Back closing
dialogs and pages, the player's hidden-controls keys (←/→ seek, ↑/↓/Enter
show the controls, Back closes popups then leaves).

## Pages

1. **Nothing is focused when a page opens**; the first arrow must land
   somewhere useful.
2. **The right first control per page.** Home: the hero. Discover: the grid.
   Settings: the menu, on the selected section. Search: the field when the
   search is empty. Login: "Standard login" (code mode) or the email field.
   Logged-out pages: the notice. The rail only when the page has nothing else.
3. **Content arrives after the page opens** (rows, hero, streams, episodes),
   so the start target doesn't exist yet.
4. **Detail page first focus:** movies on the first stream (or the first
   action when no streams are coming); series on the episode being watched,
   else the first; after Back from an episode's streams, that episode. Never
   once the user has moved.
5. **Coming back to a page that stayed mounted restores its focus.** Hidden
   pages stay mounted and must never take focus.
6. **Pages that place focus themselves** (player, detail) must not fight a
   generic start.

## Focus state

7. **An arrow with nothing focused, or a stale focus** (after a mouse click
   on a plain element, a blur, an unmounted element).
8. **Focus moved by other means** (mouse click, `.focus()`, `autoFocus`) must
   be what the next arrow moves from.
9. **Something that just appeared must be focusable right away** (dialogs,
   select lists, text editor, popups).

## Movement

10. **Rail ↔ content with ← / →**, both ways. → from the rail should go back
    to where you left, not the nearest item (Discover, Settings).
11. **Card rows remember their last card**; ↑ / ↓ between rows.
12. **The rail lands on the current page's tab.**
13. **Settings: coming over from the menu lands on the pane's first option**,
    not the nearest.
14. **Search: coming down from the field lands on the first history chip.**
15. **Detail page:** → from the last action button goes to the panel; ↓ from
    the action buttons does nothing.
16. **Calendar: Enter on a day jumps to its first episode** (the day's
    posters aren't reachable). Crossing between the month grid and the
    episode list follows the selected day.
17. **Focused items scroll into view** in horizontal rows and the detail
    chips.

## Controls that use arrows themselves

18. **Zoom scale (Settings):** ← / → step the value, ↑ / ↓ leave.
19. **Season switcher:** ← / → change season, Enter opens the list.
20. **Hero:** ← / → change slide.
21. **Text fields in dialogs:** ← / → move the caret, ↑ / ↓ leave.
22. **On-screen keyboard:** arrows move between keys (wrap in a row, stop at
    the edge while held, ↑ / ↓ to the nearest key), leave past the top or
    bottom row, Enter presses the key.
23. **Plain text fields on pages** are read-only and Enter opens the editor
    (still works); they must be focus stops.
24. **Controls that must be focus stops** besides buttons: radio buttons, the
    player's seek bar and episodes drawer button.

## Layers

25. **Dialogs and select lists trap focus** and open on: the selected option
    (select, season list), the first action, or a given control (Play URL:
    the field, or Play when the clipboard held a link).
26. **Closing a layer returns focus to its opener**: select label, card and
    row actions dialogs (the card / stream / episode row), text field after
    editing.
27. **Escape in the episode search field** leaves it to the panel.
28. **Login form:** Enter in the email field goes to the password; a failed
    check goes to the bad field.
29. **A dialog belongs to its page:** a page that isn't on top must not keep
    its dialogs open over the next page or let them take keys. Escape inside a
    dialog's text field closes the dialog.

## Player

30. **The player traps focus**; Back with nothing open leaves it.
31. **Waking the hidden controls (↑ / ↓ / Enter) focuses Play.**
32. **Control bar remembers its last button**; ← / → step the button row
    (the seek bar's center sits right of most buttons); ↑ from the row goes to
    the seek bar (their boxes touch); ↓ from the seek bar goes to Play;
    ← / → on the focused seek bar seek.
33. **Popups** (speed, subtitles, audio, side drawer, next video) trap focus
    and open on the selected option, else the first; next video opens on
    "watch now"; reopening during the fade-out still focuses.
34. **Closing a popup returns focus to its button**; when the controls hide,
    focus is dropped so the next key wakes them.
35. **Buttons that must never be focus stops** (toast, the time label
    on the seek bar, the play button over video thumbnails).

## Live TV guide

36. **←/→ move to the previous / next program on the channel**, ↑/↓ to the
    program airing at the same time on the next channel.
37. **The focused program is always in view**, and rows exist ahead of focus
    (the grid only renders the rows on screen).
