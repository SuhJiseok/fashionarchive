# Fashion Archive Project Handoff

Last updated: 2026-05-16

This file is for continuing work in a new chat or section without re-explaining the project.

## Project Summary

Fashion Archive is a minimal monochrome React/Vite web app for browsing AI-reinterpreted fashion looks. The current direction is not a celebrity photo scraping service. The concept is an AI styling archive inspired by street fashion, celebrities, Pinterest, and brands, but shown with non-real AI faces / looks.

Production test URL:

- https://fashionarchive.vercel.app

GitHub repository:

- https://github.com/SuhJiseok/fashionarchive

## Critical Current Rule

Until the user explicitly says that mobile improvement work is complete, only change mobile behavior/styles.

- Mobile-only work should be guarded by `isMobileViewport` in React or `@media (max-width: 720px)` in CSS.
- Do not change desktop/PC layout or behavior unless the user clearly says mobile work is done.
- Always check `git status --short` before editing.

## Tech Stack

- Vite
- React 19
- lucide-react
- Plain CSS in `src/styles.css`

Useful commands:

```bash
npm run dev
npm run build
npm run preview
```

Vercel CLI is usually run through npm:

```bash
npm exec --yes --package vercel@54.1.0 -- vercel ls fashionarchive --scope danielsuh-s-projects --no-color 2>&1
```

Note: the Vercel command can return shell exit code `1` because output goes through stderr, even when the deployment list shows `Ready`. Inspect the text output.

## Important Files

- `src/App.jsx`: main interaction logic, carousel, detail mode, modal, mobile gestures.
- `src/styles.css`: all visual styling and responsive behavior.
- `src/data/archiveItems.json`: look codes and product/item information.
- `src/components/Backdrop.jsx`: extracted backdrop/blur component for the code modal.
- `src/assets/archive/`: look images.
- `src/assets/products/`: product images.
- `src/assets/detail-icons/`: side/front/back view icons.

## Code / Asset Structure

Look code format:

```txt
ST-FW-001
```

Meaning:

- `ST` = Street
- `FW` = Fall/Winter
- `001` = sequence number

Season codes currently used in v1:

- `SS`
- `FW`

Possible future expansion:

- `RS`
- `PF`

Archive image folder structure:

```txt
src/assets/archive/st/fw/001/side.png
src/assets/archive/st/fw/001/front.png
src/assets/archive/st/fw/001/back.png
```

Product image folder structure:

```txt
src/assets/products/st/fw/001/{itemId}.png
```

Example:

```txt
src/assets/products/st/fw/001/outer.png
src/assets/products/st/fw/001/shoes.webp
```

The app also supports fallback flat archive filenames like:

```txt
src/assets/archive/st-fw-001-side.png
```

## Current UX Behavior

Desktop:

- Minimal monochrome layout.
- Top search bar expands on hover/focus.
- Profile icon on top right.
- Main active image appears large in the center.
- Bottom carousel is a semicircular rotating thumbnail slider.
- Active thumbnail has desktop drop shadow.
- Clicking the main image opens/closes the detail view.
- Product info panel appears on the right in detail mode.

Mobile:

- Current work is focused on mobile only.
- Browser pull-to-refresh / native scroll is allowed only when the gesture starts from the top header area around the search bar/profile button.
- Gestures outside the header are intercepted by the app.
- In normal mode, swiping left/up moves to the next look, and swiping right/down moves to the previous look.
- Main image transitions use a mobile image stack to avoid flicker.
- In detail mode, vertical swipe up opens the product info overlay.
- In detail mode, tapping the enlarged main image also opens the product info overlay.
- In detail mode, tapping the carousel closes detail mode instead of selecting another thumbnail.
- In detail mode, wheel/scroll-based slide movement is blocked.
- Detail view icons remain fixed on the left side and should not move with the image.

Mobile product info overlay:

- Fullscreen overlay.
- Slides up from the bottom.
- Dismisses downward.
- Uses transparent white layer + backdrop blur.
- Current blur: `blur(16px)`.
- Current base white opacity: `rgb(255 255 255 / 14%)`.
- Current gradient opacity:

```css
rgb(255 255 255 / 4%) 0%
rgb(255 255 255 / 10%) 46%
rgb(255 255 255 / 22%) 100%
```

- Dismiss button is a borderless `ChevronDown` icon at the top-left of the overlay.
- Closed accordion rows are lighter gray.
- Expanded accordion row text is darker and stronger.

## Current Data Example

`ST-FW-001` currently has example item data:

- Black Padded Jacket
- Navy Hooded Zip-Up
- White Crossbody Bag
- Light Blue Distressed Jeans
- Pants Keychain
- Black Leather Gloves
- Dark Burgundy Boat Shoes

The data lives in:

```txt
src/data/archiveItems.json
```

## Interaction Notes

- `activeView` defaults to `side`.
- View button order is `side`, `front`, `back`.
- When detail mode closes, view resets to `side`.
- Mobile detail image tap now opens the info overlay, not closes the detail view.
- Desktop detail image click still closes the detail view.
- The top header native-scroll exception is implemented with `isArchiveHeaderTarget()`.

## Style Direction

- Monotone, minimal, quiet.
- Avoid decorative gradients/orbs/cards.
- Use simple icon-only controls when possible.
- Avoid adding borders/backgrounds to buttons unless the user asks; recent feedback rejected an outlined close button.
- Product/info UI should feel like a minimal fashion archive, with Zara-like grid/list restraint.
- Keep text contrast readable over the mobile blurred overlay.

## Build / Release Routine

After changes:

1. Run:

```bash
npm run build
```

2. Commit intentionally.
3. Push to GitHub `main`.
4. Check Vercel deployment status:

```bash
npm exec --yes --package vercel@54.1.0 -- vercel ls fashionarchive --scope danielsuh-s-projects --no-color 2>&1
```

5. Confirm latest deployment says `Ready`.

## Recent Work Before This Handoff

Latest functional changes before creating this document:

- Mobile header area can be used for browser pull-to-refresh.
- Other mobile areas still drive the app carousel gestures.
- Mobile detail image tap opens the fullscreen product info overlay.
- Mobile product info overlay uses stronger blur, lower opacity, and better accordion text contrast.
- Mobile accordion closed/open text emphasis was swapped: closed rows lighter, expanded row darker.
