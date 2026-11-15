# A-Accordian

`<a-accordian>` is a lightweight, zero-dependency Web Component that turns standard `<details>` and `<summary>` elements into a smoothly animated accordion using native HTML semantics, Shadow DOM encapsulation, and modern CSS transitions.

Demo: [https://holmesbryant.github.io/a-accordian/](https://holmesbryant.github.io/a-accordian/)

## Features

- **Progressive enhancement** built on native `<details>` and `<summary>` elements
- **Smooth open/close animations** using a `.accordian-content` wrapper, CSS Grid row transitions (`0fr` to `1fr`), opacity fading, and modern CSS transitions
- **Shadow DOM encapsulation** with external stylesheet injection via `stylesheets` and styling hooks via CSS `::part()`
- **Exclusive accordion grouping** within an instance via the native `<details name>` attribute (or non-exclusive mode when disabled)
- **Cross-instance grouping** across selected `<a-accordian>` instances via the `shared` attribute/property
- **Accessible by default** with native keyboard navigation and `@media (prefers-reduced-motion: reduce)` support
- **Declarative and programmatic control** via HTML attributes and JavaScript properties

## Requirements

- A browser with support for ES module CSS imports (`import ... with { type: 'css' }`), `adoptedStyleSheets`, and CSS `::part()`.
- Smooth animations rely on CSS rules in `a-accordian-shadow.css` (CSS Grid row transitions, `::details-content`, and `transition-behavior: allow-discrete`). In browsers without support for those transition features, `<details>` items still open and close natively without transitions.

## Installation

Include `a-accordian.js` (alongside `a-accordian-shadow.css`) or a bundled `a-accordian.min.js` in your project and import it as an ES module:

```html
<script type="module" src="a-accordian.js"></script>
```

Or import it in JavaScript. Importing the module automatically registers the `<a-accordian>` custom element if it has not already been defined:

```javascript
import './a-accordian.js';
```

## Usage

### Basic Example

Place standard `<details>` elements inside `<a-accordian>`. By default, all items share the group name `"a-accordian"`, so opening one item closes the others within that instance.

```html
<a-accordian>
  <details>
    <summary>First Section</summary>
    <p>Content for the first section.</p>
  </details>
  <details>
    <summary>Second Section</summary>
    <p>Content for the second section.</p>
  </details>
  <details>
    <summary>Third Section</summary>
    <p>Content for the third section.</p>
  </details>
</a-accordian>
```

### Opening an Initial Item

Use the `active` attribute with a 1-based index to open a specific item when the component connects to the DOM:

```html
<a-accordian active="2">
  <details>
    <summary>First Section</summary>
    <p>Closed initially.</p>
  </details>
  <details>
    <summary>Second Section</summary>
    <p>Open initially.</p>
  </details>
</a-accordian>
```

### Custom Grouping and Non-Exclusive Mode

Use `group` to set a custom `<details name>` group or disable exclusive behavior altogether:

```html
<!-- Custom group name -->
<a-accordian group="faq-billing">
  <details>
    <summary>Question 1</summary>
    <p>Answer 1</p>
  </details>
  <details>
    <summary>Question 2</summary>
    <p>Answer 2</p>
  </details>
</a-accordian>

<!-- Allow multiple items to remain open at the same time -->
<a-accordian group="false">
  <details>
    <summary>Item A</summary>
    <p>Can stay open alongside Item B.</p>
  </details>
  <details>
    <summary>Item B</summary>
    <p>Can stay open alongside Item A.</p>
  </details>
</a-accordian>
```

### Sharing a Group Across Multiple Instances

Because each `<a-accordian>` renders inside its own Shadow DOM, native `<details name>` grouping is isolated to a single instance. Add the `shared` attribute to make a selected set of `<a-accordian>` instances behave as one unified exclusive group—opening a `<details>` item in one instance automatically closes any open `<details>` item in the other instances sharing the same key.

You can pass an explicit shared group name, or use `shared` as a boolean attribute to reuse the value of `group`:

```html
<!-- Set 1: explicit shared group name -->
<a-accordian shared="faq" active="1">
  <details>
    <summary>General Question 1</summary>
    <p>Answer 1</p>
  </details>
  <details>
    <summary>General Question 2</summary>
    <p>Answer 2</p>
  </details>
</a-accordian>

<a-accordian shared="faq">
  <details>
    <summary>Billing Question 1</summary>
    <p>Answer 3</p>
  </details>
</a-accordian>

<!-- Set 2: boolean `shared` reuses the `group` attribute ("pricing") -->
<a-accordian group="pricing" shared>
  <details>
    <summary>Plan A</summary>
    <p>Details A</p>
  </details>
</a-accordian>

<a-accordian group="pricing" shared>
  <details>
    <summary>Plan B</summary>
    <p>Details B</p>
  </details>
</a-accordian>

<!-- Independent instance: omitting `shared` keeps it isolated -->
<a-accordian>
  <details>
    <summary>Independent Item</summary>
    <p>Stays unaffected by shared groups above.</p>
  </details>
</a-accordian>
```

### Injecting Stylesheets into Shadow DOM

Use `stylesheets` with one or more comma-separated CSS URLs to load external `<link rel="stylesheet">` tags inside the component's Shadow DOM:

```html
<a-accordian stylesheets="/css/theme.css,/css/accordion.css">
  <details>
    <summary>Styled Section</summary>
    <p>Styled inside the Shadow DOM.</p>
  </details>
</a-accordian>
```

### Controlling with JavaScript

```javascript
const accordion = document.querySelector('a-accordian');

// Open the 2nd item (1-based index)
accordion.active = 2;

// Read the current active index
console.log(accordion.active); // 2

// Close all items
accordion.active = null; // or false

// Change the group name dynamically
accordion.group = 'new-group-name';

// Disable exclusive grouping dynamically
accordion.group = false;

// Link a selected set of instances into a shared cross-instance group
document.querySelectorAll('.linked-accordions').forEach(el => {
  el.shared = 'custom-set';
});

// Or reuse each instance's `group` attribute as the shared key
accordion.shared = true;

// Unlink an instance from its shared group
accordion.shared = false; // or null

// Set external Shadow DOM stylesheets (array or comma-separated string)
accordion.stylesheets = ['/css/theme.css', '/css/accordion.css'];

// Read the current Set of <link> elements
console.log(accordion.stylesheets); // Set(2) { link, link }

// Remove external stylesheets
accordion.stylesheets = null;
```

## Attributes & Properties

- **`active`** (attribute & property)
  - **Values:** 1-based integer index (e.g., `1`, `2`, `3`), `null`, or `false`
  - **Default:** `null`
  - **Behavior:** Opens the corresponding item. Setting `active` to `false`, `null`, `"false"`, `0`, or an out-of-bounds index closes all items.

- **`group`** (attribute & property)
  - **Values:** String group name, `"false"`, or `null`
  - **Default:** `"a-accordian"`
  - **Behavior:** Assigns the `name` attribute on every managed `<details>` item so only one item in the group can be open at a time within that instance. Setting `group="false"` in HTML (or `group = false` / `null` in JavaScript) removes the `name` attribute from all items and disables native exclusive grouping. When `shared` is enabled without an explicit name (`shared` / `shared = true`), changing `group` also updates the shared group key.

- **`shared`** (attribute & property)
  - **Values:** String group name, `""` / `"true"` / `true` (boolean mode using `group`), `"false"`, `false`, or `null`
  - **Default:** `null`
  - **Behavior:** Opts the instance into cross-instance exclusive grouping across Shadow DOM boundaries. All connected `<a-accordian>` instances resolving to the same shared key behave as one group—opening any `<details>` item closes open `<details>` items across all other instances in that shared group. Using `shared` without a value (or `shared = true` in JavaScript) uses the instance's `group` value as the shared key; passing an explicit string uses that string directly. Setting `shared="false"` or `shared = false` / `null` unregisters the instance.

- **`stylesheets`** (attribute & property)
  - **Values:** Comma-separated string of stylesheet URLs (attribute & property), an array of URL strings (property only), `"false"`, or `null`
  - **Default:** Empty `Set`
  - **Behavior:** Appends `<link rel="stylesheet">` elements inside the Shadow DOM for the specified URLs. Reading `accordion.stylesheets` returns the internal `Set` of `<link>` elements. Setting `stylesheets` to `null` or removing the attribute clears all injected stylesheets.

## CSS Styling

When connected, `<a-accordian>` moves its `<details>` items into an open Shadow DOM, wraps non-`<summary>` child nodes inside `<div class="accordian-content">`, and assigns `part` attributes to each `<details>`, `<summary>`, and `.accordian-content` wrapper.

For example, an accordion with two items renders inside the Shadow DOM as:

```html
<details part="details details1">
  <summary part="summary summary1">...</summary>
  <div class="accordian-content" part=" content content1">...</div>
</details>

<details part="details details2">
  <summary part="summary summary2">...</summary>
  <div class="accordian-content" part=" content content2">...</div>
</details>
```

When an item opens, the `"open"` part is toggled on `<details>`, `<summary>`, and `<div class="accordian-content">`:

```html
<details open part="details details2 open">
  <summary part="summary summary2 open">...</summary>
  <div class="accordian-content" part=" content content2 open">...</div>
</details>
```

You may also supply your own `part` values on `<details>`, `<summary>`, or the first content element inside `<details>`, and they will be preserved alongside the generated parts:

```html
<a-accordian>
  <details part="foo">
    <summary part="bar">...</summary>
    <div part="baz">...</div>
  </details>
</a-accordian>
```

Rendered inside the Shadow DOM:

```html
<details part="foo details details1">
  <summary part="bar summary summary1">...</summary>
  <div class="accordian-content" part="baz content content1">...</div>
</details>
```

Target these parts from any external stylesheet using `::part()`:

```css
/* Selects all details elements */
a-accordian::part(details) { ... }

/* Selects the 5th details element */
a-accordian::part(details5) { ... }

/* Selects all summary elements */
a-accordian::part(summary) { ... }

/* Selects the 1st summary element */
a-accordian::part(summary1) { ... }

/* Selects all content wrappers */
a-accordian::part(content) { ... }

/* Selects the 3rd content wrapper */
a-accordian::part(content3) { ... }

/* Selects any summary or content wrapper whose parent details is open */
a-accordian::part(summary open) { ... }
a-accordian::part(content open) { ... }
```

You can also style elements inside the Shadow DOM directly using the `stylesheets` attribute.

## Change Log

- **v1.6**
  - Added `shared` attribute/property to synchronize exclusive `<details>` grouping across selected `<a-accordian>` instances
- **v1.5**
  - Added Shadow DOM encapsulation (`adoptedStyleSheets` with `a-accordian-shadow.css`)
  - Wrapped `<details>` body nodes in `<div class="accordian-content">` for CSS Grid row transitions
  - Added `stylesheets` attribute/property for injecting Shadow DOM `<link rel="stylesheet">` elements
  - Toggled `"open"` part on `.accordian-content` in addition to `<details>` and `<summary>`
- **v1**
  - Initial commit
