const sheet = new CSSStyleSheet();
          sheet.replaceSync(":host { --speed: 0.25s; display: block; width: 100%; font-family: inherit;}details > .accordian-content { display: flow-root; min-block-size: 0; overflow-y: clip; padding: 0; transition: padding var(--speed) ease-in-out;}details[open] > .accordian-content { padding: .5rem;}summary { cursor: pointer; font-size: unset; margin: 0 !important; }@supports selector(::details-content) { details::details-content { display: grid; grid-template-rows: 0fr; opacity: 0; padding: 0; transition: content-visibility var(--speed) ease-in-out allow-discrete, grid-template-rows var(--speed) ease-in-out, opacity var(--speed) ease-in-out; } details[open]::details-content { grid-template-rows: 1fr; opacity: 1; } @media (prefers-reduced-motion: reduce) { details::details-content { transition: none; } }}");

/**
 * @file a-accordian.js
 * @author Holmes Bryant <Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 2.0
 */


/**
 * An accordion custom element that smoothly animates open/close states using CSS transitions.
 *
 * @class AAccordian
 * @extends HTMLElement
 */
class AAccordian extends HTMLElement {
  debug = false;

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

  /**
   * Shared group setting: `null` (disabled), `true` (use `#group`), or explicit group name.
   * @private
   * @type {string|boolean|null}
   */
  #shared = null;

  /**
   * Path to one or more importable css stylesheets
   * @private
   * @type {Set}
   * @default []
   */
  #stylesheets = new Set();

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
   * Key currently registered in `#sharedGroups` for this instance.
   * @private
   * @type {?string}
   */
  #registeredGroup = null

  /**
   * Registry of `<a-accordian>` instances keyed by shared group name.
   * @private
   * @static
   * @type {Map<string, Set<AAccordian>>}
   */
  static #sharedGroups = new Map();

  /**
   * Attributes monitored for changes via `attributeChangedCallback`.
   * @static
   * @type {string[]}
   */
  static observedAttributes = ['active', 'debug', 'group', 'shared', 'stylesheets'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
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
      case 'debug':
        this.debug = this.hasAttribute(attr);
        break;
      case 'group':
        this.#group = newval;
        if (this.#connected) this.#init();
        break;
      case 'shared':
        if (this.hasAttribute(attr)) this.#shared = newval || true;
        if (this.#connected) this.#syncSharedGroup();
        break;
      case 'stylesheets':
        if (typeof newval === 'string') newval.split(',').map( item => this.#createLink(item) );
        else this.#stylesheets.clear();
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
    const items = this.querySelectorAll('details');
    this.#items = items.length ? items : this.shadowRoot.querySelectorAll('details');
    this.#init();
    this.#connected = true;
    this.#syncSharedGroup();
  }

  /**
   * Clears element references and resets connection state when removed
   * from the DOM.
   *
   * @returns {void}
   */
  disconnectedCallback() {
    this.#unregisterSharedGroup();
    this.#items = null;
    this.#connected = false;
    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  // --- Private ---

  /**
   * Closes all other open `<details>` elements across instances in the same shared group.
   * @private
   * @param {HTMLDetailsElement} activeItem
   * @returns {void}
   */
  #closeOthersInSharedGroup(activeItem) {
    if (!this.#registeredGroup) return;
    const set = AAccordian.#sharedGroups.get(this.#registeredGroup);
    if (!set) return;

    for (const instance of set) {
      instance.#items?.forEach(other => {
        if (other !== activeItem && other.open) {
          other.open = false;
        }
      });
    }
  }

  /**
   * Create a link rel="stylesheet" and add it to this.#stylesheets
   * @param {string} url - The url to the stylesheet
   */
  #createLink(url) {
    const link = document.createElement('link');
    link.rel = "stylesheet";
    link.href = url;
    this.#stylesheets.add(link);
  }

  /**
   * Resolves the effective shared group key, or `null` if disabled.
   * @private
   * @returns {?string}
   */
  #getSharedKey() {
    if (!this.#shared) return null;
    return this.#shared === true ? this.#group : this.#shared;
  }

  /**
   * Wraps item contents, configures `name` grouping, mounts items into the
   * Shadow DOM, and opens the initial active item if configured.
   *
   * @private
   * @returns {void}
   */
  #init() {
    this.#abortController?.abort();
    this.#abortController = new AbortController();

    const links = [];
    if (this.#stylesheets.size > 0) {
      for (const link of this.#stylesheets) {
        links.push(link);
      }
    }

    this.#items.forEach((item, index) => {
      index = index + 1;
      const summary = item.querySelector('summary');
      this.#wrapContent(item, summary, index);
      item.part.add('details');
      item.part.add(`details${index}`);

      item.addEventListener('toggle', () => {
        item.part.toggle('open', item.open);
        summary?.part.toggle('open', item.open);
        item.querySelector(':scope > .accordian-content')?.part.toggle('open', item.open);

        if (item.open) this.#closeOthersInSharedGroup(item);
      }, { signal: this.#abortController.signal });

      if (summary) {
        summary.part.add('summary');
        summary.part.add(`summary${index}`);
      }

      if (this.#group) item.name = this.#group;
      else item.removeAttribute('name');
    });

    this.shadowRoot.replaceChildren(...links, ...this.#items);

    if (this.#active) this.#setActive(this.#active);
  }

  /**
   * Registers/updates this instance in `#sharedGroups` and enforces that
   * at most one `<details>` is open in the group.
   * @private
   * @returns {void}
   */
  #syncSharedGroup() {
    const nextKey = this.#getSharedKey();
    if (nextKey !== this.#registeredGroup) {
      this.#unregisterSharedGroup();
      if (nextKey) {
        let set = AAccordian.#sharedGroups.get(nextKey);
        if (!set) {
          set = new Set();
          AAccordian.#sharedGroups.set(nextKey, set);
        }
        set.add(this);
        this.#registeredGroup = nextKey;
      }
    }

    // If this instance already has an open item (via `active` or `<details open>`),
    // close open items in the other instances of the same shared group.
    if (this.#registeredGroup && this.#items?.length) {
      const openItem = [...this.#items].findLast(item => item.open);
      if (openItem) this.#closeOthersInSharedGroup(openItem);
    }
  }

  /**
   * Removes this instance from its current shared group registry.
   * @private
   * @returns {void}
   */
  #unregisterSharedGroup() {
    if (!this.#registeredGroup) return;
    const set = AAccordian.#sharedGroups.get(this.#registeredGroup);
    if (set) {
      set.delete(this);
      if (set.size === 0) AAccordian.#sharedGroups.delete(this.#registeredGroup);
    }
    this.#registeredGroup = null;
  }

  /**
   * Wraps non-`<summary>` child nodes of a `<details>` element inside a
   * `<div class="accordian-content"` element to enable CSS Grid row transitions.
   *
   * @private
   * @param {HTMLDetailsElement} details - The `<details>` element to wrap.
   * @returns {void}
   */
  #wrapContent(details, summary, index) {
    if (details.querySelector(':scope > .accordian-content')) return;

    const contentNodes = [...details.childNodes].filter(node => node !== summary && node.nodeValue?.trim() !== '');
    if (!contentNodes.length) return;

    const wrapper = document.createElement('div');
    const contentParts = (contentNodes[0].getAttribute('part') ?? '') + ` content content${index}`;
    wrapper.classList.add('accordian-content');
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
      this.#items.forEach(item => { item.open = false; });
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

  /**
   * Gets the shared group configuration (`null`, `true`, or explicit group name).
   * @type {string|boolean|null}
   */
  get shared() { return this.#shared }

  /**
   * Sets or removes the `shared` attribute.
   * @param {string|boolean|null|undefined} value
   */
  set shared(value) {
    if (value === true || value === '') this.setAttribute('shared', '');
    else if (value) this.setAttribute('shared', value);
    else this.removeAttribute('shared');
  }

  /**
   * Gets the url(s) of importable css stylesheets
   * @type {Set}
   * @returns {Set}
   */
  get stylesheets() { return this.#stylesheets }

  /** Sets the url(s) of importable css stylesheets
   * @param {string | array} value - An array or comma-separated string of URLs
   */
  set stylesheets(value) {
    if (typeof value === 'string') this.setAttribute('stylesheets', value);
    else if (Array.isArray(value)) this.setAttribute('stylesheets', value.join(','));
    else this.removeAttribute('stylesheets');
  }
}

if (!customElements.get('a-accordian')) customElements.define('a-accordian', AAccordian);

export { AAccordian as default };
