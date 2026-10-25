# KromaChat — Visual Specification Contract

**Status:** implemented proposal, maintained alongside `styles/_tokens.scss` and the family partials.  
**Scope:** presentation inside `.kroma-chat` only. This contract does not change the TypeScript message, event, or commerce contracts.

## 1. Audit and evidence

The shared design system publishes a system stack (`system-ui`, `-apple-system`, Segoe UI, sans-serif). Before the KromaChat typography correction, the chat aliased that stack through `--kroma-font-family-base` and then `--bs-body-font-family`, so its face varied by OS and host cascade. The published page inspected at 390 px computed that system/Bootstrap stack; no `@font-face` or font resource was present. `simple-keyboard` also retained its own Helvetica stack. The available browser tools expose computed CSS and loaded resources, but not the final platform font chosen for each glyph. The source now bundles Inter Variable locally, scoped to KromaChat, with the SIL Open Font License; 400, 500, 600, 650 and 700 are real positions in its 100–900 variable weight range.

The previous stylesheet had semantic aliases but mixed weights and sizes: assistant titles were 16/24/700, body copy 14/20/400, actions 12/16/400, and JourneyOption descriptions inherited the parent button's 500 weight. Browser inspection also found the keyboard at 14/20/400 in a separate Helvetica stack. These differences made option titles and descriptions compete and made weights/platform rendering inconsistent. Tokens for type roles were too few to express assistant/status/option/action/composer/keyboard hierarchy.

| Finding class | Evidence | Contract response |
|---|---|---|
| Visual-system defects | Competing type weights and density, generic control radius, uneven icon scale, highly decorated surfaces | Named chat roles for type, spacing, geometry and icon sizing; restrained surface changes |
| CSS implementation defects | Menu lacks an outer border and row dividers; chevron sits independently at the edge; 32 px icon cell adds unwanted blue surface | One bordered 16 px container, 66 px minimum rows, 18 px unboxed icons, 1 px separators and small chevron |
| HTML composition defects | Journey description was outside the title/icon flex row | Description is nested in the text column after the title |
| Font/icon loading defects | No local font files or `@font-face`; Bootstrap/theme stack and simple-keyboard's Helvetica face diverge | Bundle Inter Variable locally for KromaChat with explicit 100–900 range; isolate it from theme and Bootstrap; retain inline SVG icons |
| Container/dimension defects | Chat uses `container-type: inline-size`; some styles additionally key off viewport max-width | Keep layout changes container-based; viewport rule only adapts standalone host width/height |

No fixed “computed expected” values below imply a browser measurement: they specify the expected computed value when the listed custom properties resolve normally. Kitchen Mode is the real component inspection fixture. The supplied visual images guide relative proportions; measurements not directly inferable from them are explicitly proposals.

## 2. Shared visual principles

1. **Content first:** accent color identifies actions and selected states; it is not a default background for every icon or row.
2. **One relationship scale:** size, line-height, weight, icon box, gap and padding work as a system; component-specific exceptions require a real content or touch target need.
3. **One surface per group:** related choices share a parent surface; separators, not nested cards, define rows.
4. **Readable density:** 14 px / 21 px is the principal message role. Descriptions use 12 px / 17 px; metadata uses 11 px / 14 px only for timestamps and compact captions.
5. **Optical alignment:** line icons share a 24×24 viewBox and are centered in declared 16/18 px boxes; text columns align after the icon.
6. **Semantic contrast:** colors resolve through active Kroma semantic colors and are verified in both `data-bs-theme="light"` and `dark`.
7. **No assumed elevation:** borders and surface contrast establish grouping; shadow is reserved for the chat shell.

## 3. Type contract

Font family: `--kroma-chat-font-family` is the locally bundled Inter Variable face, followed by a deliberate system fallback stack. It does not read `--kroma-font-family-base` or `--bs-body-font-family`. `@font-face` registers the local WOFF2 at weights 100–900 with `font-display: swap`; `font-synthesis: none` prevents fabricated weights. `font-optical-sizing: auto`, normal kerning/features and normal variation settings leave Inter's OpenType behavior intact. Letter spacing is normal.

| Role | Size / line-height | Weight | Use |
|---|---:|---:|---|
| Assistant/title | 15 / 20 px | 650 | Assistant name and confirmation title |
| Option/product heading | 14 / 20 px | 600 | JourneyOption, choice and product names |
| Body | 14 / 21 px | 400 | Conversation messages and primary content |
| Description | 12 / 17 px | 400 | Option/product descriptions and supporting text |
| Action | 13 / 18 px | 500 | Quick replies and secondary interactive actions |
| Status | 12 / 16 px | 400 | Connection and status messages |
| Price | 15 / 21 px | 700 | Product and order totals; tabular numerals |
| Composer | 16 / 22 px | 400 | Native textarea and virtual text projection |
| Metadata | 11 / 14 px | 400 | Timestamps and compact captions |
| Virtual key | 20 px / 1 line | 500 | simple-keyboard labels |

The exact CSS custom properties are `--kroma-chat-typography-*`, `--kroma-chat-leading-*`, `--kroma-chat-weight-*`, and `--kroma-chat-letter-spacing-*` in `styles/_tokens.scss`. At 320–480 px of available width, copy wraps before type is reduced. The chat root explicitly restores this family on native controls, and the `.hg-theme-default` adapter overrides simple-keyboard's built-in Helvetica face without changing its visual theme.

## 4. Iconography contract

`shared/icons.ts` supplies inline SVG with `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, round caps and joins. Standard line stroke is **1.75**; icon-specific geometry is preserved. Action icons use an 18×18 CSS box, secondary icons 16×16, and navigation chevrons have a 16×16 alignment area with an approximately 6×6 px, 1.25 px stroke mark. No stroke is imposed on filled assets such as product imagery. The icon sits 12 px from its label, uses a semantic foreground, and has no default decorative container.

## 5. Spacing, geometry and surfaces

| Scale | Values | Roles |
|---|---|---|
| Spacing | 4, 8, 12, 16, 24, 32 px | `tight`, control/message, icon-to-label, card, section and spacious grouping |
| Radius | 4, 8, 12, 16 px | Small mark, field/button, commercial card, chat/menu shell |
| Controls | 40 px compact default; journey row 66 px minimum | Touch interaction and menu scan rhythm |
| Border | 1 px | Subtle group boundary, menu row divider, input boundary |

Menu rows use 16 px horizontal padding, 12 px vertical padding, 12 px icon-label gap and transparent backgrounds. The 14/20 title plus 12/17 description and 4 px copy gap fit within the 66 px minimum row; longer text grows the row. Category tiles use an 80 px minimum and can grow with wrapped text. Fields and buttons use 8 px radii; product and commerce cards 12 px; bubbles retain sender-specific geometry; pills are reserved for chips. A single shell elevation is allowed. Hover is a 3% neutral surface tint; selected states use a restrained 12% accent tint where supported. Light/dark semantics come from the existing Kroma runtime and the scoped chat aliases.

## 6. Interactive and responsive rules

- Hover changes the surface subtly; active controls respond without layout shift beyond a 1 px press translation where already implemented.
- `:focus-visible` uses the semantic focus role and a visible 2 px outline. Focus must not be communicated by color alone.
- Disabled controls use disabled text and cursor semantics without altering enabled-state geometry. Consumed options retain the existing data state and a modest selected treatment.
- `prefers-reduced-motion` reduces transition/animation duration; typing animation remains decorative and does not replace its accessible label.
- The chat establishes the `kroma-chat` inline-size container. At ≤384 px, cards and message widths contract and the Journey Menu horizontal padding may reduce to 8 px. At ≤304 px, category tiles become one column. The 320/390/430/480 px acceptance points refer to **container widths**, not assumptions about viewport width.
- At 320 px, 390 px, 430 px, 480 px and desktop container widths, preserve type sizes and reflow content first. No fixed row width is allowed; long labels/descriptions wrap inside the text column.

## 7. Component specifications

Values marked **proposal** are implementation references where source imagery does not provide a reliable measurement.

### Layout

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Chat shell / header | Shell, avatar, title, optional subtitle/status/actions. Default and compact density; idle, focus and disabled actions. | Shell width 26 rem proposal, max height 82dvh; header min-height 60 px proposal. Title 15/20 650; status 12/16 400. Avatar 32×32. | 8 px shell border; 16 px shell radius; header separator subtle. Avatar uses accent. | Container is inline-size query root. Accessible region/title; action focus. `.kroma-chat`, `__header`, `__avatar`, `__title`, `__subtitle`, `__status`, `__header-action` in `_layout.scss` / `_states.scss` |
| Message list | Scrollable ordered message sequence, empty state and grouped messages. | Body 14/21; avatar 24×24. | 8 px message rhythm, 16 px default inset, 8 px compact; canvas surface. | Scroll contained; scrollbars unobtrusive. `__messages`, `__empty`, `_layout.scss` |
| Composer | Guided entry action, optional free-text surface, native alternative, simple-keyboard, error and send button. | Virtual/native entry 16/22; guided action 13/18; key label 20 px; send target 40×40 with 18 px line icon. | 8 px radius, 1 px border, 4–8 px inner gap; one focus ring. | Text area grows to 120 px; safe-area bottom padding. Guided state remains compact; `__composer`, `__input`, `__virtual-display`, `__send`, `__error`, `_layout.scss`, `_forms.scss`, `_states.scss` |

### Messages

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Chat message | Assistant, user, system; grouped/continuation; optional timestamp. | Body 14/21; timestamp 11/14; assistant avatar 24 px. | 12 px bubble inset; 16 px sender radius with asymmetric 4 px tail; assistant neutral surface, user accent. | Bubble max 86%, 94% in narrow container. Author remains distinguishable by alignment and semantics. `__message*`, `__bubble`, `__time`, `_messages.scss` |
| Rich message | Optional title, description, links/actions. | Heading 14/20 600; body 14/21. | 4 px title-copy gap; 8 px action gap; no extra enclosing card. | Long text wraps. `__rich-*`, `_messages.scss` |
| Quick Replies | Wrapping selectable chips, selected and disabled. | Action 13/18 500; min-height 34 px. | Pill radius, 4 px chip gap, 8 px horizontal padding; selected has restrained accent. | Flex wrap without horizontal overflow; pressed state exposed by `aria-pressed`. `__quick-replies`, `__options`, `__option`, `_messages.scss` |
| Choice List | Stacked full-width choice buttons with optional description. | Title 14/20 600; description 12/17 400. | 8 px row inset and radius; 4 px copy gap. | Single column at all widths; selected/disabled states remain clear. `__choice-list`, `__choice*`, `_messages.scss` |
| Typing indicator | Assistant bubble, three animated dots and accessible label. | Dot 5 px (proposal); bubble min-height 36 px. | 4 px dot gap; assistant bubble geometry. | Reduced-motion support. `__message--typing`, `__typing-dots`, `_messages.scss`, `_states.scss` |

### Navigation

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Journey Menu | Single bordered group; compact rows with icon, title, optional description, chevron. Enabled, hover, focus, active, disabled, consumed. | 66 px minimum row; title 14/20 600; description 12/17 400; action icon 18 px; chevron 16 px box. | 16 px shell radius, 1 px outer border/dividers, 16 px horizontal and 12 px vertical padding; icon gap 12 px; 4 px title-description gap. Accent icon only; no icon well or row card. | Rows grow for wrapping; one text column after icon. Native buttons keep keyboard behavior. `__journey-menu`, `__journey-item*`, `_navigation.scss`, `navigation/journey-menu.ts`, `navigation/journey-option.ts` |
| Journey action | Primary action used for journey and commerce actions; primary/secondary variants, hover/focus/active/disabled. | 14/21 600; min-height 44 px default. | 8 px radius; 8×16 px padding; semantic primary surface only for primary action. | Wrap long labels, full width only in owning action layout. `__journey-action`, `_navigation.scss`, `_states.scss` |
| Category Picker / Tile | Responsive grid, one tile per category; odd final item spans when two columns. | Tile min-height 80 px; title 14/20 600; description 12/17; icon 36 px. | 12 px grid gap; 12 px tile radius; no individual icon decoration requirement. | `auto-fit` columns, one column below 304 px; tile grows for wrapped text. `__category-picker`, `__category*`, `_navigation.scss`, `_states.scss` |

### Catalog and commerce

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Product Card | Image, name, optional description, price/action; selectable/consumed. | Image 56 px; name 14/20 600; description 12/17; price 15/21 700. | 8 px gaps/inset; 12 px radius; no extra border unless theme surface needs definition. | Grid reflows under 384 px; image maintains object-fit. Button focus-visible. `__product-card*`, `_catalog.scss`, `_states.scss` |
| Product List / List Item | Repeated compact rows with image, copy, price/action. | Image 56 px proposal; name 14/20 600; description 12/17; price 15/21 700. | 8 px row rhythm, 8 px radius only for row group, semantic subtle divider/surface. | Name wraps; price stays aligned at trailing edge. `__product-list`, `__product-card`, `_catalog.scss` |
| Product Carousel | Horizontal snap track and previous/next icon controls. | Cards ≤304 px proposal; arrows 36 px target, 18 px icon. | 8 px track gap and inset; card radius 12 px. | Native horizontal scrolling; hidden scrollbar retains keyboard-accessible controls. `__product-carousel`, `__carousel-*`, `_catalog.scss`, `_states.scss` |
| Product Detail | Product image, title, description, price, features, variants, quantity and primary action. | Image max 208 px; title 14/20 600; description 12/17; price 15/21 700. | 8 px section gaps, 16 px card inset, 12 px radius. | Image max-height 160 px ≤384 px; content remains single column. `__product-detail*`, `_catalog.scss`, `_states.scss` |
| Variant Selector | Fieldset/legend and wrapping selected/disabled option controls. | Legend 12/17; option min-height 36 px. | 4 px option gap; 8 px radius; selected uses accent surface role. | Wraps without overflow; native radio semantics preserved. `__variant-*`, `_catalog.scss`, `_states.scss` |
| Quantity Selector | Label, decrement/value/increment with disabled bounds. | 36×36 px controls; tabular centered quantity. | 8 px control gap; 8 px radius. | May wrap below 304 px. Buttons expose labels and disabled state. `__quantity-*`, `_catalog.scss`, `_states.scss` |
| Feature List | Compact benefit list with semantic marks. | 12/17 body; 16 px icon. | 8 px row gap; 12 px icon-to-copy gap. | Text wraps; icon aligns to first line. `__product-features`, `__feature-icon`, `_catalog.scss` |
| Cart Summary / Line Item | Item rows, thumbnail, details, remove action, price summary and total. | Thumbnail 40 px; name 14/20 600; metadata 12/17; total 15/21 700. | 8 px rows and group gaps; 12 px summary radius; tabular numeric alignment. | Under 384 px trailing price/action moves below item details. `__cart-*`, `__price-*`, `_commerce.scss`, `_states.scss` |
| Order Review | Customer details, price summary and primary/secondary actions. | Body 12/17; total 15/21 700. | 8 px group rhythm; 8 px details radius. | Actions stack in narrow container. Labels and values remain associated. `__order-review`, `__customer-*`, `__review-actions`, `_commerce.scss`, `_states.scss` |

### Forms and feedback

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Conversational Form | Optional title, labeled fields, validation and submit. | Title 14/20 600; labels 12/17 600; input 14/21, min-height 40 px. | 4 px label-field, 8 px field-group; fields/buttons 8 px radius; semantic error/focus. | Full available width; controls never narrower than container. Labels/errors associated in DOM. `__conversational-form`, `__form-*`, `_forms.scss`, `_states.scss` |
| Confirmation Card | Status mark, title, description, optional reference/summary. Success/warning/error. | Title 15/20 650; body 12/17; status icon 20 px. | 16 px outer inset proposal; 12 px card radius; no decorative side border. | At ≤304 px inset becomes 16 px. Status is represented in text/semantics as well as color. `__confirmation*`, `_feedback.scss` |
| Status Message | Neutral/success/warning/error inline feedback with mark. | Body 12/16; 16 px line icon. | 4 px icon gap, compact vertical padding; no card by default. | Wraps at narrow width; semantic status remains present. `__status-message`, `__status-icon`, `_messages.scss` |

## 8. Traceability matrix

Computed targets below are CSS-resolved targets for the default density unless a state is named. `auto` denotes content-derived size. Theme-dependent colors must resolve from the active Kroma theme; do not replace them with fixed hex values in component rules.

| Component / selector | Visual property | Token / rule source | Expected computed target | State |
|---|---|---|---|---|
| Chat root `.kroma-chat` | Font family / size / line-height / weight | local Inter Variable; body 14 px, leading 1.5, weight 400 | Inter / 14 px / 21 px / 400 | all |
| Header `__title` | Size / line-height / weight | display, leading-display, weight-strong | 15 px / 20 px / 650 | all |
| Header status `__status` | Size / line-height / weight | typography-status, leading-status, weight-regular | 12 px / 16 px / 400 | all |
| Message `__bubble` | Body / inset / sender radius | body, leading-body, bubble-padding, radius-message | 14 px / 21 px / 12×16 px / 16 px with 4 px sender corner | assistant/user |
| Journey Menu `__journey-menu` | Surface / border / radius | chat-surface, border-menu, radius-menu | active raised surface / 1 px / 16 px | all themes |
| Journey row `__journey-item` | Min-height / padding / type | menu-row-height, spacing-3/menu-inline, option-title/leading-heading/weight-semibold | ≥66 px / 12×16 px / 14 px 20 px 600 | default |
| Journey icon `__journey-item-label-icon svg` | Box / stroke / color | icon-action-size / shared SVG attrs / chat-accent | 18×18 px / 1.75 / active accent | default |
| Journey title/description | Hierarchy and common start edge | option-title+weight-semibold / description+weight-regular+leading-small | 14/20 600, then 12/17 400, 4 px gap | descriptive variant |
| Journey separator | Border | border-menu | 1 px semantic subtle border | non-first rows |
| Journey chevron | Mark size / stroke / color | chevron-size / `_navigation.scss` / text-secondary | ~6×6 px mark in 16 px alignment box / 1.25 px / secondary | enabled |
| Category tile `__category` | Radius / minimum height | radius-card / `_navigation.scss` | 12 px / 80 px minimum; grows to content | default |
| Quick Reply `__option` | Min-height / radius / type | typography-action/leading-action/weight-medium / radius-pill | 34 px / pill / 13 px 18 px 500 | idle/selected |
| Product price `__product-price`, detail price | Type / numerals | typography-price/leading-price / `font-variant-numeric` | 15 px / 21 px / 700 / tabular | all |
| Form input `__form-input` | Height / border / radius | 40 px declared / border-interactive / radius-input | ≥40 px / 1 px / 8 px | idle/focus/invalid |
| Composer `__composer` | Radius / focus | radius-input / state-focus | 8 px / 2 px visible outline | focus-within |
| Confirmation `__confirmation` | Surface / radius / title | surface-card / radius-card / display/leading-display/weight-strong | active surface / 12 px / 15/20 650 | all status |
| All interactive controls | Focus/disabled | `_states.scss`, chat state tokens | 2 px focus ring / disabled semantic text | focus-visible/disabled |

## 9. Verification record and maintenance

- Source review found that KromaChat inherited the themes' system-family token, Bootstrap body-family fallback, and simple-keyboard's explicit Helvetica family. `kroma-chat.scss` now registers a local Inter Variable WOFF2 face and the keyboard is scoped back to the KromaChat stack. The Inter asset is bundled under `src/assets/fonts/` with its OFL license.
- The published page was inspected in Chrome at the 390 px lab width before this source change: computed `font-family` was the system/Bootstrap stack, there were no `@font-face` rules or font network resources, JourneyOption description inherited weight 500, and simple-keyboard computed Helvetica 14/20/400. The DevTools interface did not expose the final OS font chosen per glyph.
- The local server was unavailable, so the new source's computed styles, emitted WOFF2 URL and rasterized output have not been inspected in a browser. The published page still represents the pre-change bundle.
- `npx tsc --noEmit` passed. Builds and automated/browser suites were not run, as required by the task.
- When markup/class names change, update the matching component row, traceability row and family partial together. New values should resolve to an existing role or be added here as a justified proposal before they become local component literals.
