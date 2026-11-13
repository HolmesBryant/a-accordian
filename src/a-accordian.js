/**
 * @file src/a-accordian.js
 * @author Holmes Bryant <Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.0
 */

import styles from './a-accordian-shadow.css' with { type: 'css' };

/**
 * An accordion custom element that animates open/close states using CSS transitions.
 *
 * @class AAccordian
 * @extends HTMLElement
 */
export default class AAccordian extends HTMLElement {
  // --- Attributes ---

  /**
   * 1-based index of the active `<details>` item, or `null` when unset.
   * @private
   * @type {?number}
   */
  #active = null;

  /**
   * Group name assigned to each `<details>` element's `name` attribute.
   * @private
   * @type {?string}
   * @default 'a-accordian'
   */
  #group = 'a-accordian';

  // --- Properties ---

  #abortController;

  /**
   * Tracks whether the element is currently connected to the DOM.
   * @private
   * @type {boolean}
   * @default false
   */
  #connected = false;

  /**
   * Collection of `<details>` elements managed by the accordion.
   * @private
   * @type {?NodeListOf<HTMLDetailsElement>}
   */
  #items;

  /**
   * Attributes monitored for changes via `attributeChangedCallback`.
   * @static
   * @type {string[]}
   */
  static observedAttributes = ['active', 'group'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [styles];
  }

  // --- Lifecycle ---

  /**
   * Responds to changes on observed attributes (`active`, `group`).
   *
   * @param {string} attr - Name of the changed attribute.
   * @param {?string} oldval - Previous attribute value.
   * @param {?string} newval - New attribute value.
   * @returns {void}
   */
  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    if (!this.hasAttribute(attr) || newval === 'false') newval = null;

    switch (attr) {
      case 'active':
        this.#active = newval ? Number.parseInt(newval, 10) : null;
        if (this.#connected) this.#setActive(this.#active);
        break;
      case 'group':
        this.#group = newval;
        if (this.#connected) this.#init();
        break;
    }
  }

  /**
   * Collects child `<details>` elements and initializes the component when
   * inserted into the DOM.
   *
   * @returns {void}
   */
  connectedCallback() {
    this.#abortController = new AbortController();
    const items = this.querySelectorAll('details');
    this.#items = items.length ? items : this.shadowRoot.querySelectorAll('details');
    this.#init();
    this.#connected = true;
  }

  /**
   * Clears element references and resets connection state when removed
   * from the DOM.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    this.#items = null;
    this.#connected = false;
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  // --- Private ---

  /**
   * Wraps item contents, configures `name` grouping, mounts items into the
   * Shadow DOM, and opens the initial active item if configured.
   *
   * @private
   * @returns {void}
   */
  #init() {
    this.#items.forEach((item, index) => {
      index = index + 1;
      const summary = item.querySelector('summary');
      item.part.add('details');
      item.part.add(`details${index}`);
      item.addEventListener('toggle', e => {
        item.part.toggle('open');
        summary.part.toggle('open');
      }, {signal: this.#abortController.signal });

      if (summary) {
        summary.part.add('summary');
        summary.part.add(`summary${index}`);
      }
      this.#wrapContent(item, summary, index);

      if (this.#group) item.name = this.#group;
      else item.removeAttribute('name');
    });

    this.shadowRoot.replaceChildren(...this.#items);

    if (this.#active) this.#setActive(this.#active);
  }

  /**
   * Wraps non-`<summary>` child nodes of a `<details>` element inside a
   * `<div data-content>` element to enable CSS Grid row transitions.
   *
   * @private
   * @param {HTMLDetailsElement} details - The `<details>` element to wrap.
   * @returns {void}
   */
  #wrapContent(details, summary, index) {
    if (details.querySelector(':scope > [data-content]')) return;

    const contentNodes = [...details.childNodes].filter(node => node !== summary && node.nodeValue?.trim() !== '');
    if (!contentNodes.length) return;

    const wrapper = document.createElement('div');
    const contentParts = (contentNodes[0].getAttribute('part') ?? '') + ` content content${index}`;
    wrapper.toggleAttribute('data-content', true);
    wrapper.setAttribute('part', contentParts);
    wrapper.append(...contentNodes);
    details.append(wrapper);
  }

  /**
   * Opens the `<details>` item at the given 1-based index, or closes grouped
   * items when no valid index is provided.
   *
   * @private
   * @param {?number} idx - 1-based index of the `<details>` item to activate.
   * @returns {void}
   */
  #setActive(idx) {
    if (!this.#items?.length) return;
    const target = idx ? this.#items[idx - 1] : null;

    if (!target) {
      this.#items.forEach(item => { item.open = false });
      return;
    }

    target.open = true;
  }

  // --- Getters / Setters ---

  /**
   * Gets the 1-based index of the active `<details>` item.
   *
   * @type {?number}
   * @returns {?number}
   */
  get active() { return this.#active }

  /**
   * Sets or removes the `active` attribute.
   *
   * @param {number|string|boolean|null|undefined} value - 1-based item index, or `null`/`false` to clear.
   */
  set active(value) {
    if (value != null && value !== false) this.setAttribute('active', value);
    else this.removeAttribute('active');
  }

  /**
   * Gets the accordion group name.
   *
   * @type {?string}
   * @returns {?string}
   */
  get group() { return this.#group }

  /**
   * Sets or removes the `group` attribute.
   *
   * @param {?string} value - Group name, or a falsy value to disable exclusive grouping.
   */
  set group(value) {
    if (value) this.setAttribute('group', value);
    else this.removeAttribute('group');
  }
}

if (!customElements.get('a-accordian')) customElements.define('a-accordian', AAccordian);
