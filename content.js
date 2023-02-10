
let excludeTags;
let excludeClasses;
let excludeDomains;
let excludeAttributes;

async function getStorage() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get({
      excludeTags: "",
      excludeClasses: "",
      excludeDomains: "",
      excludeAttributes: ""
    }, function (result) {
      let excludeTags = result.excludeTags.split(",").map(tag => tag.trim());
      let excludeClasses = result.excludeClasses.split(",").map(tag => tag.trim());
      let excludeDomains = result.excludeDomains.split("\n").map(tag => tag.trim());
      let excludeAttributes = result.excludeAttributes.split(",").map(tag => tag.trim());

      resolve({ excludeTags, excludeClasses, excludeDomains, excludeAttributes });
    });
  });
}

async function loadStorage(changes, namespace) {
  let storageData = await getStorage();
  excludeTags = storageData.excludeTags;
  excludeClasses = storageData.excludeClasses;
  excludeDomains = storageData.excludeDomains;
  excludeAttributes = storageData.excludeAttributes;
}

chrome.storage.onChanged.addListener(loadStorage);
loadStorage()

document.addEventListener("click", function (event) {

  let currentDomain = window.location.hostname.toLowerCase();
  if (excludeDomains.some(x => currentDomain.indexOf(x) !== -1))
    return

  let elementsTocheck = [event.target, event.target.parentElement, event.target.parentElement.parentElement];

  for (let element of elementsTocheck) {
    let currentTagName = element.tagName.toLowerCase();
    if (excludeTags.some(x => x == currentTagName))
      return;

    let currentClassList = [...element.classList, element.id].join(" ").toLowerCase();
    if (excludeClasses.some(x => currentClassList.indexOf(x) !== -1))
      return;

    if (excludeAttributes.some(x => element.getAttribute(x)))
      return;

    let link = element.href;
    if (link && link.endsWith('#'))
      return
  }

  let link = elementsTocheck.find(element => element.href);
  if (link) {
    event.preventDefault();
    window.open(link, "_blank");
  }
});
