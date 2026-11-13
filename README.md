# A-Accordian

`<a-accordian>` is a lightweight, zero-dependency Web Component that turns standard `<details>` and `<summary>` elements into a smoothly animated accordion using native HTML semantics and modern CSS transitions.

Demo: [https://holmesbryant.github.io/a-accordian/](https://holmesbryant.github.io/a-accordian/)

## Features

- **Progressive enhancement** built on native `<details>` and `<summary>` elements

- **Smooth open/close animations** using `::details-content`, CSS Grid row transitions (`0fr` to `1fr`), opacity fading, and `transition-behavior: allow-discrete`

- **Exclusive accordion grouping** via the native `<details name>` attribute (or non-exclusive mode when disabled)

- **Accessible by default** with native keyboard navigation and `@media (prefers-reduced-motion: reduce)` support

- **Declarative and programmatic control** via HTML attributes and JavaScript properties

## Requirements

Smooth animations require browser support for ::details-content and transition-behavior:allow-discrete. In browsers without support, `<details>` items still open and close natively without transitions.

## Installation

Copy a-accordian.min.js into your project and import the component as an ES module.

```html
<script type="module" src="a-accordian.min.js"></script>
```
Or import it in JavaScript. Importing the module automatically registers the `<a-accordian>` custom element if it has not already been defined.

```javascript
import './a-accordian.min.js';
```

## Usage

### Basic Example

Place standard `<details>` elements inside `<a-accordian>`. By default, all items share the group name "a-accordian", so opening one item closes the others.

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

Use the active attribute with a 1-based index to open a specific item when the component connects to the DOM:

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

Use "group" to isolate multiple accordions or disable exclusive behavior altogether:

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
```

## Attributes & Properties

- **active** (attribute & property)
	- Values: 1-based integer index (e.g., 1, 2, 3), null, or false
	- Default: null
	- Behavior: Opens the corresponding item. When group is enabled, setting active to false, null, "false", 0, or an out-of-bounds index closes all items.

- **group** (attribute & property)
	- Values: String group name, "false", or null
	- Default: "a-accordian"
	- Behavior: Assigns the name attribute on every managed item so only one item in the group can be open at a time. Setting group="false" in HTML (or group = false in JavaScript) removes the name attribute from all items and disables exclusive grouping. If a custom group attribute was previously set, setting group = null also clears it.

## CSS Styling

The component adds a "part" attribute to each `<details>`, `<summary>`, and the first non-summary child (the content) of each `<details>` element.

This enables you to style the accordian from a normal css stylesheet.

For example, if your accordian has two items, you get:

```html
<details part="details details1">
  <summary part="summary summary1">...</summary>
  <div part="content content1">...</div>
</details>

<details part="details details2">
  <summary part="summary summary2">...</summary>
  <div part="content content2">...</div>
</details>
```

In addition, when an item is open, the `<details>` and `<summary>` get an additional "open" part.

```html
<details open part="details details2 open">
  <summary part="summary summary2 open">...</summary>
  ...
</details>
```

You may also add your own "part" value to the mix by manually
adding a part attribute to any details, summary, or content container element. For example, if your HTML looks like:

```html
<a-accordian>
  <details part="foo">
    <summary part="bar">...</summary>
    <div part="baz">...</div>
  </details>
</a-accordian>
```

The resulting accordian will be rendered as:

```html
<details part="foo details details1">
  <summary part="bar summary summary1">...</summary>
  <div part="baz content content1">...</div>
</details>
```

You may then target each item in a normal CSS stylesheet

```css
/* Selects all details elements */
a-accordian::part(details) { ... }

/* Selects the 5th details element */
a-accordian::part(details5) { ... }

/* Selects all summary elements */
a-accordian::part(summary) { ... }

/* Selects the 1st summary element */
a-accordian::part(summary1) { ... }

/* Selects all content elements */
a-accordian::part(content) { ... }

/* Selects the 3rd content element */
a-accordian::part(content3) { ... }

/* Selects any summary whose parent is open */
a-accordian::part(summary open) { ... }
```

## Change Log

- v1 Initial commit
