/**
 * Test suite for AAccordian
 * @file a-accordian.test.js
 */

import ATestRunner from './ATestRunner.min.js';
import AAccordian from '../src/a-accordian.js';

const runner = new ATestRunner(import.meta.url);
runner.output = '#results';

const {
  equal,
  genCombos,
  group,
  info,
  log,
  spyOn,
  test,
  wait,
  when
} = runner;

/**
 * Helper to create and optionally mount an <a-accordian> element.
 */
function createAccordian({
  items = 3,
  active = null,
  groupName = null,
  mount = true,
  emptyLast = false
} = {}) {
  const el = document.createElement('a-accordian');
  if (active !== null) el.setAttribute('active', active);
  if (groupName !== null) el.setAttribute('group', groupName);

  for (let i = 1; i <= items; i++) {
    const details = document.createElement('details');
    const summary = document.createElement('summary');
    summary.textContent = `Section ${i}`;
    details.append(summary);

    if (!(emptyLast && i === items)) {
      const p = document.createElement('p');
      p.textContent = `Content ${i}`;
      details.append(p);
    }

    el.append(details);
  }

  if (mount) document.body.append(el);
  return el;
}

group('Registration & Initial State', () => {
  const el = createAccordian({ items: 0 });

  test('is registered as custom element "a-accordian"', customElements.get('a-accordian') !== undefined, true);
  test('instance extends HTMLElement', el instanceof HTMLElement, true);
  test('creates an open shadowRoot', el.shadowRoot?.mode, 'open');
  test('adopts shadow stylesheet', el.shadowRoot.adoptedStyleSheets.length, 1);
  test('observes "active" and "group" attributes', equal(AAccordian.observedAttributes, ['active', 'group']), true);
  test('default group property is "a-accordian"', el.group, 'a-accordian');
  test('default active property is undefined', el.active, null);

  el.remove();
});

group('DOM Mounting & Content Wrapping', () => {
  const el = createAccordian({ items: 3, emptyLast: true });
  const shadowItems = el.shadowRoot.querySelectorAll('details');

  test('moves details elements out of light DOM', el.querySelectorAll('details').length, 0);
  test('renders all details elements inside shadowRoot', shadowItems.length, 3);
  test('keeps summary as direct child of details', shadowItems[0].querySelector(':scope > summary')?.textContent, 'Section 1');
  test('wraps non-summary nodes in div data-content', () => {
    const wrapper = shadowItems[0].querySelector(':scope > div[data-content]');
    return wrapper?.querySelector('p')?.textContent;
  }, 'Content 1');
  test('does not wrap details with no content nodes besides summary', () => {
    return shadowItems[2].querySelector(':scope > [data-content]');
  }, null);

  // Trigger _init() again via group change and ensure no double-wrapping occurs
  el.group = 'reinit-group';
  test('does not double-wrap [data-content] when re-initialized', () => {
    return el.shadowRoot.querySelectorAll('details:first-child [data-content]').length;
  }, 1);

  // Disconnect and reconnect
  el.remove();
  document.body.append(el);
  test('preserves details items in shadowRoot after disconnect and reconnect', () => {
    return el.shadowRoot.querySelectorAll('details').length;
  }, 3);

  el.remove();
});

group('HTML Markup Upgrade', () => {
  const container = document.createElement('div');
  container.innerHTML = `
    <a-accordian active="2" group="markup-group">
      <details>
        <summary>One</summary>
        <p>First</p>
      </details>
      <details>
        <summary>Two</summary>
        <p>Second</p>
      </details>
    </a-accordian>
  `;
  document.body.append(container);

  const el = container.querySelector('a-accordian');
  const items = el.shadowRoot.querySelectorAll('details');

  test('upgrades markup with active attribute opening 2nd item', () => {
    return [!items[0].open, items[1].open];
  }, [true, true]);

  test('upgrades markup with custom group name', () => {
    return [...items].every(item => item.name === 'markup-group');
  }, true);

  container.remove();
});

group('Grouping Behavior (group attribute & property)', () => {
  const el = createAccordian({ items: 3 });
  const items = el.shadowRoot.querySelectorAll('details');

  test('assigns default name="a-accordian" to all details', () => {
    return [...items].every(item => item.name === 'a-accordian');
  }, true);

  el.group = 'faq';
  test('setting el.group updates group attribute', el.getAttribute('group'), 'faq');
  test('setting el.group updates details name attributes', () => {
    return [...items].every(item => item.name === 'faq');
  }, true);

  // Open items exclusively while grouped
  el.active = 1;
  el.active = 2;
  test('opening item 2 closes item 1 when grouped', [!items[0].open, items[1].open], [true, true]);

  // Disable grouping
  el.group = null;
  test('setting el.group = null removes group attribute', el.hasAttribute('group'), false);
  test('setting el.group = null sets el.group getter to null', el.group, null);
  test('removes name attribute from details when group is cleared', () => {
    return [...items].every(item => !item.hasAttribute('name'));
  }, true);

  el.active = 1;
  test('allows multiple details open simultaneously when ungrouped', [items[0].open, items[1].open], [true, true]);

  // Re-test group="false"
  el.setAttribute('group', 'false');
  test('group="false" disables grouping', el.group, null);

  el.remove();
});

group('Active Item Selection (active attribute & property)', () => {
  const el = createAccordian({ items: 3, active: '2' });
  const items = el.shadowRoot.querySelectorAll('details');

  test('initial active="2" parses to number 2', el.active, 2);
  test('initial active="2" opens 2nd details on connect', [!items[0].open, items[1].open, !items[2].open], [true, true, true]);

  el.active = 3;
  test('setting el.active = 3 updates attribute to "3"', el.getAttribute('active'), '3');
  test('setting el.active = 3 opens 3rd details', [!items[1].open, items[2].open], [true, true]);

  el.active = false;
  test('setting el.active = false removes active attribute', el.hasAttribute('active'), false);
  test('setting el.active = false sets el.active to null', el.active, null);
  test('clearing active closes all details items', [...items].every(i => !i.open), true);

  el.active = 1;
  el.setAttribute('active', 'false');
  test('active="false" sets el.active to null and closes all items', () => {
    return el.active === null && [...items].every(i => !i.open);
  }, true);

  el.active = 1;
  el.active = 99;
  test('out-of-bounds active index closes items safely', [...items].every(i => !i.open), true);
  el.remove();
});

group('Testing genCombos() across active & group combinations', () => {
  const options = {
    active: [1, 2, 3],
    group: ['alpha', 'beta']
  };

  log('Accordian combo options', options);

  for (const combo of genCombos(options)) {
    const el = createAccordian({
      items: 3,
      active: String(combo.active),
      groupName: combo.group
    });
    const items = el.shadowRoot.querySelectorAll('details');

    test(`active=${combo.active}, group="${combo.group}" opens item ${combo.active}`, () => {
      const onlyTargetOpen = [...items].every((item, idx) => item.open === (idx === combo.active - 1));
      const allNamed = [...items].every(item => item.name === combo.group);
      return onlyTargetOpen && allNamed;
    }, true);

    el.remove();
  }
});

group('Async DOM & Stylesheet Verification', () => {
  test('updates active state asynchronously', async () => {
    const el = createAccordian({ items: 3 });
    try {
      await wait(10);
      el.active = 2;
      const openItem = await when(() => el.shadowRoot.querySelector('details[open]'), 500, 10);
      return openItem?.querySelector('summary')?.textContent;
    } finally {
      el.remove();
    }
  }, 'Section 2');

  test('shadow stylesheet contains :host rule', () => {
    const el = createAccordian({ items: 1 });
    try {
      const sheet = el.shadowRoot.adoptedStyleSheets[0];
      return [...sheet.cssRules].some(rule => rule.selectorText === ':host');
    } finally {
      el.remove();
    }
  }, true);
});

runner.run();
