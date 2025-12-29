
let excludeTags;
let excludeClasses;
let excludeDomains;
let excludeAttributes;

async function getStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(["excludeTags", "excludeClasses", "excludeDomains", "excludeAttributes"], function (result) {
      let excludeTags = result.excludeTags.split(",").map(tag => tag.trim());
      let excludeClasses = result.excludeClasses.split(",").map(tag => tag.trim());
      let excludeDomains = result.excludeDomains.split("\n").map(tag => tag.trim());
      let excludeAttributes = result.excludeAttributes.split(",").map(tag => tag.trim());

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
loadStorage()



document.addEventListener("mousedown", function (event) {
  // event.preventDefault();

  //Check if mouse is left click
  if (event.button !== 0)
    return

  let currentDomain = window.location.hostname.toLowerCase();
  if (excludeDomains && excludeDomains.some(x => currentDomain.indexOf(x) !== -1))
    return

  let elementsTocheck = [
    event.target,
    event.target?.parentElement,
    event.target?.parentElement?.parentElement,
  ];

  for (let element of elementsTocheck) {
    if (!element)
      return;

    let currentTagName = element.tagName.toLowerCase();
    if (excludeTags && excludeTags.some(x => x == currentTagName))
      return;

    let currentClassList = [...element.classList, element.id].join(" ").toLowerCase();
    if (excludeClasses && excludeClasses.some(x => currentClassList.indexOf(x) !== -1))
      return;

    if (excludeAttributes && excludeAttributes.some(x => element.getAttribute(x)))
      return;

    let link = element.href;
    if (link && link.endsWith('#'))
      return
  }

  let linkElement = elementsTocheck.find(element => element.href);
  if (linkElement) {
    let href = linkElement.getAttribute('href');
    let fullHref = linkElement.href;

    // Skip non-navigation hrefs
    if (!href ||
        href === '#' ||
        href.startsWith('javascript:') ||
        href.startsWith('#') && !href.includes('/')) {
      return;
    }

    // Skip same-page anchor links
    if (fullHref.split('#')[0] === window.location.href.split('#')[0] && href.includes('#')) {
      return;
    }

    // Skip dropdown/menu triggers (common patterns)
    if (linkElement.getAttribute('role') === 'button' ||
        linkElement.getAttribute('role') === 'menuitem' ||
        linkElement.hasAttribute('aria-haspopup') ||
        linkElement.hasAttribute('aria-expanded') ||
        linkElement.hasAttribute('data-toggle') ||
        linkElement.hasAttribute('data-bs-toggle')) {
      return;
    }

    event.preventDefault();
    window.open(fullHref, "_blank");
  }
});
