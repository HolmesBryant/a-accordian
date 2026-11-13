const sheet = new CSSStyleSheet();
          sheet.replaceSync(":host { display: block; width: 100%; font-family: inherit;}@supports selector(::details-content) { details::details-content { opacity: 0; block-size: 0; overflow-y: clip; transition: block-size 0.5s ease-in-out, opacity 0.5s ease-in-out, content-visibility 0.5s ease-in-out allow-discrete; } details[open]::details-content { opacity: 1; block-size: auto; }}");

/**
 * @file src/a-accordian.js
 * @author Holmes Bryant <Holmes Bryant <https://github.com/HolmesBryant>
 * @license GPL-3.0
 * @version 1.0
 */


class AAccordian extends HTMLElement {
  // --- Attributes ---
  #active;
  #group = 'a-accordian';

  // --- Properties ---
  #abortController;
  #connected = false;
  #items;

  static observedAttributes = ['active', 'group'];

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.adoptedStyleSheets = [sheet];
  }

  // --- Lifecycle ---

  attributeChangedCallback(attr, oldval, newval) {
    if (newval === oldval) return;
    if (!this.hasAttribute(attr) || newval === 'false') newval = null;

    switch (attr) {
    case 'active':
      this.#active = newval ? Number.parseInt(newval) : newval;
      if (this.#connected) this._setActive(this.#active);
      break;
    case 'group':
      this.#group = newval;
      if (this.#connected) this._init();
      break;
    }
  }

  connectedCallback() {
    this.#abortController = new AbortController();
    this.#items = this.querySelectorAll('details');
    this._init();
    this.#connected = true;
  }

  disconnectedCallback() {
    this.#items = null;

    if (this.#abortController) {
      this.#abortController.abort();
      this.#abortController = null;
    }
  }

  // --- Private ---

  _init() {
    this.shadowRoot.replaceChildren(...this.#items);
    this.#items.forEach( item => {
      if (this.#group) item.name = this.#group;
      else item.removeAttribute('name');
    });

    if (this.#active) this._setActive(this.#active);
  }

  _setActive(idx) {
    idx = idx - 1;
    this.#items[idx].open = true;
  }

  // --- Getters / Setters ---

  get active() { return this.#active }
  set active(value) {
    value = value != null && value !== false;
    if (value) this.setAttribute('active', value);
    else this.removeAttribute('active');
  }

  get group() { return this.#group }
  set group(value) {
    if (value) this.setAttribute('group', value);
    else this.removeAttribute('group');
  }
}

if (!customElements.get('a-accordian')) customElements.define('a-accordian', AAccordian);
