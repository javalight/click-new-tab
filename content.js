
let excludeTags;
let excludeClasses;
let excludeDomains;
let excludeAttributes;

// ============================================================
// BUILT-IN DETECTION PATTERNS (from research)
// These are always checked regardless of user settings
// ============================================================

// ARIA roles that indicate UI controls, not navigation
const UI_ROLES = [
  'button', 'menuitem', 'tab', 'switch', 'option',
  'menuitemcheckbox', 'menuitemradio', 'listbox', 'combobox',
  'slider', 'spinbutton', 'searchbox', 'textbox', 'dialog'
];

// ARIA attributes that indicate interactive UI elements
const UI_ARIA_ATTRIBUTES = [
  'aria-haspopup',
  'aria-expanded',
  'aria-controls',
  'aria-pressed',
  'aria-checked',
  'aria-selected'
];

// Framework data attributes for dropdowns/modals/UI triggers
const UI_DATA_ATTRIBUTES = [
  // Bootstrap 4
  'data-toggle',
  'data-dismiss',
  'data-target',
  // Bootstrap 5
  'data-bs-toggle',
  'data-bs-dismiss',
  'data-bs-target',
  // Foundation
  'data-dropdown',
  'data-reveal',
  'data-open',
  'data-close',
  // General patterns
  'data-modal',
  'data-popup',
  'data-popover',
  'data-tooltip',
  'data-action',
  'data-collapse',
  'data-slide',
  'data-fancybox',
  'data-lightbox',
  // Vue/React/Angular
  'data-v-',
  '@click',
  'ng-click'
];

// CSS class patterns that indicate UI triggers (partial match)
const UI_CLASS_PATTERNS = [
  'dropdown', 'toggle', 'trigger', 'modal', 'popup', 'popover',
  'collapse', 'accordion', 'tab-', 'tabs-', 'menu-toggle',
  'nav-toggle', 'hamburger', 'sidebar-toggle', 'offcanvas',
  'lightbox', 'fancybox', 'magnific', 'carousel', 'slider',
  'btn-group', 'button-group'
];

// ============================================================
// STORAGE FUNCTIONS
// ============================================================

async function getStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["excludeTags", "excludeClasses", "excludeDomains", "excludeAttributes"], function (result) {
      let excludeTags = (result.excludeTags || '').split(",").map(tag => tag.trim()).filter(Boolean);
      let excludeClasses = (result.excludeClasses || '').split(",").map(tag => tag.trim()).filter(Boolean);
      let excludeDomains = (result.excludeDomains || '').split("\n").map(tag => tag.trim()).filter(Boolean);
      let excludeAttributes = (result.excludeAttributes || '').split(",").map(tag => tag.trim()).filter(Boolean);

      resolve({ excludeTags, excludeClasses, excludeDomains, excludeAttributes });
    });
  });
}

async function loadStorage() {
  let storageData = await getStorage();
  excludeTags = storageData.excludeTags;
  excludeClasses = storageData.excludeClasses;
  excludeDomains = storageData.excludeDomains;
  excludeAttributes = storageData.excludeAttributes;
}

chrome.storage.onChanged.addListener(loadStorage);
loadStorage();

// ============================================================
// DETECTION FUNCTIONS
// ============================================================

/**
 * Check if href is a valid navigation URL (not a fake button pattern)
 */
function isValidNavigationHref(href, fullHref) {
  if (!href) return false;

  // Skip empty or hash-only
  if (href === '' || href === '#') return false;

  // Skip javascript: protocol
  if (href.startsWith('javascript:')) return false;

  // Skip mailto: and tel: links
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;

  // Skip hash-only links that don't contain a path
  if (href.startsWith('#') && !href.includes('/')) return false;

  // Skip same-page anchor links
  const currentBase = window.location.href.split('#')[0].split('?')[0];
  const linkBase = fullHref.split('#')[0].split('?')[0];
  if (currentBase === linkBase && href.includes('#')) return false;

  return true;
}

/**
 * Check if element has ARIA attributes indicating it's a UI control
 */
function hasUIAriaAttributes(element) {
  // Check role attribute
  const role = element.getAttribute('role');
  if (role && UI_ROLES.includes(role.toLowerCase())) {
    return true;
  }

  // Check ARIA state attributes
  for (const attr of UI_ARIA_ATTRIBUTES) {
    if (element.hasAttribute(attr)) {
      return true;
    }
  }

  return false;
}

/**
 * Check if element has framework data attributes for UI triggers
 */
function hasUIDataAttributes(element) {
  for (const attr of UI_DATA_ATTRIBUTES) {
    // Some attributes are prefixes (like data-v-)
    if (attr.endsWith('-')) {
      const attrs = element.getAttributeNames();
      if (attrs.some(a => a.startsWith(attr))) {
        return true;
      }
    } else if (element.hasAttribute(attr)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if element's classes match UI trigger patterns
 */
function hasUIClassPatterns(element) {
  const classList = element.className;
  if (typeof classList !== 'string') return false;

  const classListLower = classList.toLowerCase();
  return UI_CLASS_PATTERNS.some(pattern => classListLower.includes(pattern));
}

/**
 * Check if element matches user-defined exclusions
 */
function matchesUserExclusions(element) {
  // Check excluded tags
  const tagName = element.tagName.toLowerCase();
  if (excludeTags && excludeTags.some(x => x === tagName)) {
    return true;
  }

  // Check excluded classes/IDs
  const classAndId = [...element.classList, element.id].join(" ").toLowerCase();
  if (excludeClasses && excludeClasses.some(x => x && classAndId.includes(x))) {
    return true;
  }

  // Check excluded attributes
  if (excludeAttributes && excludeAttributes.some(x => x && element.hasAttribute(x))) {
    return true;
  }

  return false;
}

/**
 * Check if any element in the chain (clicked element + parents) should be excluded
 */
function shouldExcludeElementChain(elements) {
  for (const element of elements) {
    if (!element) continue;

    // Check user-defined exclusions
    if (matchesUserExclusions(element)) {
      return true;
    }

    // Check built-in UI class patterns
    if (hasUIClassPatterns(element)) {
      return true;
    }
  }
  return false;
}

/**
 * Main function to determine if a link should open in new tab
 */
function shouldOpenInNewTab(linkElement, elementsChain) {
  const href = linkElement.getAttribute('href');
  const fullHref = linkElement.href;

  // 1. Validate href is a real navigation URL
  if (!isValidNavigationHref(href, fullHref)) {
    return false;
  }

  // 2. Check ARIA attributes (indicates UI control)
  if (hasUIAriaAttributes(linkElement)) {
    return false;
  }

  // 3. Check framework data attributes (indicates UI trigger)
  if (hasUIDataAttributes(linkElement)) {
    return false;
  }

  // 4. Check if element or parents have UI class patterns or user exclusions
  if (shouldExcludeElementChain(elementsChain)) {
    return false;
  }

  // 5. Check built-in UI class patterns on the link itself
  if (hasUIClassPatterns(linkElement)) {
    return false;
  }

  return true;
}

// ============================================================
// MAIN EVENT HANDLER
// ============================================================

document.addEventListener("mousedown", function (event) {
  // Only handle left clicks
  if (event.button !== 0) return;

  // Skip if modifier keys are pressed (let browser handle normally)
  if (event.ctrlKey || event.metaKey || event.shiftKey) return;

  // Check if current domain is excluded
  const currentDomain = window.location.hostname.toLowerCase();
  if (excludeDomains && excludeDomains.some(x => x && currentDomain.includes(x))) {
    return;
  }

  // Build element chain (clicked element + up to 3 parent levels)
  const elementsToCheck = [
    event.target,
    event.target?.parentElement,
    event.target?.parentElement?.parentElement,
    event.target?.parentElement?.parentElement?.parentElement
  ].filter(Boolean);

  // Find the link element in the chain
  const linkElement = elementsToCheck.find(el => el.tagName === 'A' && el.href);

  if (linkElement && shouldOpenInNewTab(linkElement, elementsToCheck)) {
    event.preventDefault();
    event.stopPropagation();
    window.open(linkElement.href, "_blank");
  }
});
