# KromaChat — Visual Specification Contract

**Status:** implemented proposal, maintained alongside `styles/_tokens.scss` and the family partials.  
**Scope:** presentation inside `.kroma-chat` only. This contract does not change the TypeScript message, event, or commerce contracts.

## 1. Audit and evidence

The current design system publishes a system font stack (`system-ui`, `-apple-system`, Segoe UI, sans-serif), not a downloaded font face. KromaChat does not load web fonts. The effective face therefore depends on the operating system; browser-computed font selection must be checked on each target platform. Existing theme primitives publish weights 400, 600 and 700; the contract adds a local 500 role for the system stack rather than claiming a globally loaded 500 font file. A host-provided Bootstrap body-font declaration is a fallback only.

The previous stylesheet had reusable semantic aliases, but the application was inconsistent in their use: 11/12/14/16/18/20 px-like values were mixed with direct rem values, small labels appeared where body text was expected, headings and button labels commonly jumped to 600/700, and several components had separate one-off icon, gap and radius values. The Journey Menu was rendered as independent-looking, unbordered rows inside a card radius, with a 32 px blue-backed icon cell, 16 px vertical padding and a tiny CSS chevron. When a description was supplied, its DOM node was a sibling of the icon/title row, so it did not share the title column. Tokens for muted surfaces, spacing, radius and state were partly aliased to broad theme roles and did not express chat-specific intent.

| Finding class | Evidence | Contract response |
|---|---|---|
| Visual-system defects | Competing type weights and density, generic control radius, uneven icon scale, highly decorated surfaces | Named chat roles for type, spacing, geometry and icon sizing; restrained surface changes |
| CSS implementation defects | Menu lacks an outer border and row dividers; chevron sits independently at the edge; 32 px icon cell adds unwanted blue surface | One bordered 16 px container, 60 px minimum rows, 18 px unboxed icons, 1 px separators and small chevron |
| HTML composition defects | Journey description was outside the title/icon flex row | Description is nested in the text column after the title |
| Font/icon loading defects | No local font files or `@font-face`; icon system is inline SVG, 24×24 viewBox, mostly 1.7 stroke | Retain OS-native system stack; normalize line icons in a 24×24 box, 1.75 stroke; no external assets |
| Container/dimension defects | Chat uses `container-type: inline-size`; some styles additionally key off viewport max-width | Keep layout changes container-based; viewport rule only adapts standalone host width/height |

No fixed “computed expected” values below imply a browser measurement: they specify the expected computed value when the listed custom properties resolve normally. Kitchen Mode is the real component inspection fixture. The supplied visual images guide relative proportions; measurements not directly inferable from them are explicitly proposals.

## 2. Shared visual principles

1. **Content first:** accent color identifies actions and selected states; it is not a default background for every icon or row.
2. **One relationship scale:** size, line-height, weight, icon box, gap and padding work as a system; component-specific exceptions require a real content or touch target need.
3. **One surface per group:** related choices share a parent surface; separators, not nested cards, define rows.
4. **Readable density:** 14 px / 20 px is the principal content role. Metadata may use 12 px / 16 px; 11 px is reserved for timestamps and compact captions.
5. **Optical alignment:** line icons share a 24×24 viewBox and are centered in declared 16/18 px boxes; text columns align after the icon.
6. **Semantic contrast:** colors resolve through active Kroma semantic colors and are verified in both `data-bs-theme="light"` and `dark`.
7. **No assumed elevation:** borders and surface contrast establish grouping; shadow is reserved for the chat shell.

## 3. Type contract

Font family: `--kroma-chat-font-family` → `--kroma-font-family-base` → the system/Bootstrap stack fallback. No external font is requested. `font-synthesis` is left to platform defaults because the selected platform stack owns its available weights; 500 is a semantic medium request, not a claim that a font file was downloaded. Letter spacing is normal (no tracking added).

| Role | Size / line-height | Weight | Use |
|---|---:|---:|---|
| Display | 16 / 24 px | 700 | Chat title, confirmation title |
| Heading | 14 / 20 px | 600 | Card, form and rich-message headings |
| Body | 14 / 20 px | 400 | Message copy, form values, primary content |
| Body emphasis | 14 / 20 px | 500 | Journey labels, emphasized body copy |
| Body small | 12 / 16 px | 400 | Descriptions, supporting content |
| Label | 14 / 20 px | 600 | Input labels and compact control labels |
| Caption | 11 / 14 px | 400 | Timestamp and compact metadata |
| Price | 16 / 24 px (up to 20 px when a detail view has room) | 700 | Product and order totals; tabular numerals |

The exact CSS custom properties are `--kroma-chat-typography-*`, `--kroma-chat-leading-*`, and `--kroma-chat-weight-*` in `styles/_tokens.scss`. At 320–480 px of available width, copy wraps before type is reduced.

## 4. Iconography contract

`shared/icons.ts` supplies inline SVG with `viewBox="0 0 24 24"`, `fill="none"`, `stroke="currentColor"`, round caps and joins. Standard line stroke is **1.75**; icon-specific geometry is preserved. Action icons use an 18×18 CSS box, secondary icons 16×16, and navigation chevrons have a 16×16 alignment area with an approximately 6×6 px, 1.25 px stroke mark. No stroke is imposed on filled assets such as product imagery. The icon sits 12 px from its label, uses a semantic foreground, and has no default decorative container.

## 5. Spacing, geometry and surfaces

| Scale | Values | Roles |
|---|---|---|
| Spacing | 4, 8, 12, 16, 24, 32 px | `tight`, control/message, icon-to-label, card, section and spacious grouping |
| Radius | 4, 8, 12, 16 px | Small mark, field/button, commercial card, chat/menu shell |
| Controls | 40 px compact default; journey row 60 px minimum | Touch interaction and menu scan rhythm |
| Border | 1 px | Subtle group boundary, menu row divider, input boundary |

Menu rows use 16 px horizontal padding, 12 px vertical padding, 12 px icon-label gap and transparent backgrounds. Fields and buttons use 8 px radii; product and commerce cards 12 px; bubbles retain sender-specific geometry; pills are reserved for chips. A single shell elevation is allowed. Hover is a 3% neutral surface tint; selected states use a restrained 12% accent tint where supported. Light/dark semantics come from the existing Kroma runtime and the scoped chat aliases.

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
| Chat shell / header | Shell, avatar, title, optional subtitle/status/actions. Default and compact density; idle, focus and disabled actions. | Shell width 26 rem proposal, max height 82dvh; header min-height 60 px proposal. Title 16/24 700; secondary 12/16. Avatar 32×32. | 8 px shell border; 16 px shell radius; header separator subtle. Avatar uses accent. | Container is inline-size query root. Accessible region/title; action focus. `.kroma-chat`, `__header`, `__avatar`, `__title`, `__subtitle`, `__status`, `__header-action` in `_layout.scss` / `_states.scss` |
| Message list | Scrollable ordered message sequence, empty state and grouped messages. | Body 14/20; avatar 24×24. | 8 px message rhythm, 16 px default inset, 8 px compact; canvas surface. | Scroll contained; scrollbars unobtrusive. `__messages`, `__empty`, `_layout.scss` |
| Composer | Text area, optional error and send button. Empty/filled, focus, invalid, disabled. | Input 14/20, min-height 40 px; send target 40×40 with 18 px line icon. | 8 px radius, 1 px border, 4–8 px inner gap; one focus ring. | Text area grows to 120 px; safe-area bottom padding. `__composer`, `__input`, `__send`, `__error`, `_layout.scss`, `_forms.scss`, `_states.scss` |

### Messages

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Chat message | Assistant, user, system; grouped/continuation; optional timestamp. | Body 14/20; timestamp 11/14; assistant avatar 24 px. | 12 px bubble inset; 16 px sender radius with asymmetric 4 px tail; assistant neutral surface, user accent. | Bubble max 86%, 94% in narrow container. Author remains distinguishable by alignment and semantics. `__message*`, `__bubble`, `__time`, `_messages.scss` |
| Rich message | Optional title, description, links/actions. | Heading 14/20 600; body 14/20. | 4 px title-copy gap; 8 px action gap; no extra enclosing card. | Long text wraps. `__rich-*`, `_messages.scss` |
| Quick Replies | Wrapping selectable chips, selected and disabled. | Body small 12/16; min-height 32 px. | Pill radius, 4 px chip gap, 8 px horizontal padding; selected has restrained accent. | Flex wrap without horizontal overflow; pressed state exposed by `aria-pressed`. `__quick-replies`, `__options`, `__option`, `_messages.scss` |
| Choice List | Stacked full-width choice buttons with optional description. | Body 14/20; description 12/16. | 8 px row inset and radius; 4 px copy gap. | Single column at all widths; selected/disabled states remain clear. `__choice-list`, `__choice*`, `_messages.scss` |
| Typing indicator | Assistant bubble, three animated dots and accessible label. | Dot 5 px (proposal); bubble min-height 36 px. | 4 px dot gap; assistant bubble geometry. | Reduced-motion support. `__message--typing`, `__typing-dots`, `_messages.scss`, `_states.scss` |

### Navigation

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Journey Menu | Single bordered group; compact rows with icon, title, optional description, chevron. Enabled, hover, focus, active, disabled, consumed. | 60 px min row; label 14/20 500; description 12/16; action icon 18 px; chevron 16 px box. | 16 px shell radius, 1 px outer border/dividers, 16 px horizontal and 12 px vertical padding; icon gap 12 px. Accent icon only; no icon well or row card. | One text column after icon; description never starts below icon. Native buttons keep keyboard behavior. `__journey-menu`, `__journey-item*`, `_navigation.scss`, `navigation/journey-menu.ts`, `navigation/journey-option.ts` |
| Journey action | Primary action used for journey and commerce actions; primary/secondary variants, hover/focus/active/disabled. | 14/20 600; min-height 44 px default. | 8 px radius; 8×16 px padding; semantic primary surface only for primary action. | Wrap long labels, full width only in owning action layout. `__journey-action`, `_navigation.scss`, `_states.scss` |
| Category Picker / Tile | Responsive grid, one tile per category; odd final item spans when two columns. | Tile min-height 104 px proposal; label 14/20 500; icon 36 px. | 12 px grid gap; 12 px tile radius; no individual icon decoration requirement. | `auto-fit` columns, one column below 304 px. `__category-picker`, `__category*`, `_navigation.scss`, `_states.scss` |

### Catalog and commerce

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Product Card | Image, name, optional description, price/action; selectable/consumed. | Image 56 px; name 14/20 600; description 12/16; price 16/24 700. | 8 px gaps/inset; 12 px radius; no extra border unless theme surface needs definition. | Grid reflows under 384 px; image maintains object-fit. Button focus-visible. `__product-card*`, `_catalog.scss`, `_states.scss` |
| Product List / List Item | Repeated compact rows with image, copy, price/action. | Image 56 px proposal; body 14/20; price 16/24 700. | 8 px row rhythm, 8 px radius only for row group, semantic subtle divider/surface. | Name wraps; price stays aligned at trailing edge. `__product-list`, `__product-card`, `_catalog.scss` |
| Product Carousel | Horizontal snap track and previous/next icon controls. | Cards ≤304 px proposal; arrows 36 px target, 18 px icon. | 8 px track gap and inset; card radius 12 px. | Native horizontal scrolling; hidden scrollbar retains keyboard-accessible controls. `__product-carousel`, `__carousel-*`, `_catalog.scss`, `_states.scss` |
| Product Detail | Product image, title, description, price, features, variants, quantity and primary action. | Image max 208 px; title 14/20 600; body 14/20; price 16–20/24 700. | 8 px section gaps, 16 px card inset, 12 px radius. | Image max-height 160 px ≤384 px; content remains single column. `__product-detail*`, `_catalog.scss`, `_states.scss` |
| Variant Selector | Fieldset/legend and wrapping selected/disabled option controls. | Legend 12/16; option min-height 36 px. | 4 px option gap; 8 px radius; selected uses accent surface role. | Wraps without overflow; native radio semantics preserved. `__variant-*`, `_catalog.scss`, `_states.scss` |
| Quantity Selector | Label, decrement/value/increment with disabled bounds. | 36×36 px controls; tabular centered quantity. | 8 px control gap; 8 px radius. | May wrap below 304 px. Buttons expose labels and disabled state. `__quantity-*`, `_catalog.scss`, `_states.scss` |
| Feature List | Compact benefit list with semantic marks. | 12/16 body; 16 px icon. | 8 px row gap; 12 px icon-to-copy gap. | Text wraps; icon aligns to first line. `__product-features`, `__feature-icon`, `_catalog.scss` |
| Cart Summary / Line Item | Item rows, thumbnail, details, remove action, price summary and total. | Thumbnail 40 px; name 14/20 600; metadata 12/16; total 16/24 700. | 8 px rows and group gaps; 12 px summary radius; tabular numeric alignment. | Under 384 px trailing price/action moves below item details. `__cart-*`, `__price-*`, `_commerce.scss`, `_states.scss` |
| Order Review | Customer details, price summary and primary/secondary actions. | Body 12/16; total 16/24 700. | 8 px group rhythm; 8 px details radius. | Actions stack in narrow container. Labels and values remain associated. `__order-review`, `__customer-*`, `__review-actions`, `_commerce.scss`, `_states.scss` |

### Forms and feedback

| Component | Anatomy, variants and states | Dimensions / type / icon | Spacing, geometry, color | Responsive / a11y / selectors |
|---|---|---|---|---|
| Conversational Form | Optional title, labeled fields, validation and submit. | Title 14/20 600; labels 12/16 600; input 14/20, min-height 40 px. | 4 px label-field, 8 px field-group; fields/buttons 8 px radius; semantic error/focus. | Full available width; controls never narrower than container. Labels/errors associated in DOM. `__conversational-form`, `__form-*`, `_forms.scss`, `_states.scss` |
| Confirmation Card | Status mark, title, description, optional reference/summary. Success/warning/error. | Title 16/24 700; body 12/16; status icon 20 px. | 16 px outer inset proposal; 12 px card radius; no decorative side border. | At ≤304 px inset becomes 16 px. Status is represented in text/semantics as well as color. `__confirmation*`, `_feedback.scss` |
| Status Message | Neutral/success/warning/error inline feedback with mark. | Body 12/16; 16 px line icon. | 4 px icon gap, compact vertical padding; no card by default. | Wraps at narrow width; semantic status remains present. `__status-message`, `__status-icon`, `_messages.scss` |

## 8. Traceability matrix

Computed targets below are CSS-resolved targets for the default density unless a state is named. `auto` denotes content-derived size. Theme-dependent colors must resolve from the active Kroma theme; do not replace them with fixed hex values in component rules.

| Component / selector | Visual property | Token / rule source | Expected computed target | State |
|---|---|---|---|---|
| Chat root `.kroma-chat` | Font family / size / line-height / weight | `--kroma-chat-font-family`, body 14 px, leading 1.43, weight 400 | System stack / 14 px / ~20 px / 400 | all |
| Header `__title` | Size / line-height / weight | display, leading-display, weight-bold | 16 px / 24 px / 700 | all |
| Message `__bubble` | Body / inset / sender radius | body, bubble-padding, radius-message | 14 px / 12×16 px / 16 px with 4 px sender corner | assistant/user |
| Journey Menu `__journey-menu` | Surface / border / radius | chat-surface, border-menu, radius-menu | active raised surface / 1 px / 16 px | all themes |
| Journey row `__journey-item` | Min-height / padding / type | menu-row-height, spacing-3/menu-inline, body/weight-medium | ≥60 px / 12×16 px / 14 px 20 px 500 | default |
| Journey icon `__journey-item-label-icon svg` | Box / stroke / color | icon-action-size / shared SVG attrs / chat-accent | 18×18 px / 1.75 / active accent | default |
| Journey title/description | Hierarchy and common start edge | body+weight-medium / body-small+leading-small | 14/20 500, then 12/16, 4 px gap | descriptive variant |
| Journey separator | Border | border-menu | 1 px semantic subtle border | non-first rows |
| Journey chevron | Mark size / stroke / color | chevron-size / `_navigation.scss` / text-secondary | ~6×6 px mark in 16 px alignment box / 1.25 px / secondary | enabled |
| Category tile `__category` | Radius / minimum height | radius-card / `_navigation.scss` | 12 px / 104 px proposal | default |
| Quick Reply `__option` | Min-height / radius / type | control-height / radius-pill / typography-body-small | 44 px default (32 px chip override) / pill / 12 px 16 px | idle/selected |
| Product price `__product-price`, detail price | Type / numerals | typography-price / `font-variant-numeric` | 16 px 700 / tabular; 16–20 px in detail | all |
| Form input `__form-input` | Height / border / radius | 40 px declared / border-interactive / radius-input | ≥40 px / 1 px / 8 px | idle/focus/invalid |
| Composer `__composer` | Radius / focus | radius-input / state-focus | 8 px / 2 px visible outline | focus-within |
| Confirmation `__confirmation` | Surface / radius / title | surface-card / radius-card / display | active surface / 12 px / 16/24 700 | all status |
| All interactive controls | Focus/disabled | `_states.scss`, chat state tokens | 2 px focus ring / disabled semantic text | focus-visible/disabled |

## 9. Verification record and maintenance

- Source review confirmed a system font stack and inline SVG path registry; no external font/icon dependency is necessary.
- `kroma-chat.scss` remains the stylesheet entry point and the existing family partial architecture remains intact.
- Kitchen Mode is the verification surface for the real renderers. At implementation time, no browser session with the project page or attached reference images was available, so computed browser values and screenshot comparison remain an explicit visual verification limitation.
- The requested TypeScript check is run after implementation. Builds, browser suites and additional automated test suites are intentionally outside the requested validation scope.
- When markup/class names change, update the matching component row, traceability row and family partial together. New values should resolve to an existing role or be added here as a justified proposal before they become local component literals.
