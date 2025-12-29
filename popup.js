let currentDomain = null;

function getStorage() {
    chrome.storage.sync.get(["excludeTags", "excludeClasses", "excludeDomains", "excludeAttributes"], function (result) {
        var { tags, classes, domains, attributes } = getElements()
        tags.value = result.excludeTags;
        classes.value = result.excludeClasses;
        domains.value = result.excludeDomains;
        attributes.value = result.excludeAttributes;

        updateSiteStatus(result.excludeDomains);
    });
}

function saveStorage() {
    var { tags, classes, domains, attributes } = getElements()
    chrome.storage.sync.set({
        excludeTags: tags.value.toLowerCase(),
        excludeClasses: classes.value.toLowerCase(),
        excludeDomains: domains.value.toLowerCase(),
        excludeAttributes: attributes.value.toLowerCase(),
    });
}

function updateSiteStatus(excludeDomains) {
    if (!currentDomain) return;

    const domainList = excludeDomains ? excludeDomains.split("\n").map(d => d.trim().toLowerCase()) : [];
    const isDisabled = domainList.some(d => d && currentDomain.includes(d));

    const statusEl = document.querySelector("#siteStatus");
    const btnEl = document.querySelector("#toggleSiteBtn");
    const badgeEl = document.querySelector("#statusBadge");

    if (isDisabled) {
        statusEl.classList.remove("enabled");
        statusEl.classList.add("disabled");
        btnEl.textContent = "Enable for this site";
        btnEl.classList.add("green");
        btnEl.classList.remove("red");
        badgeEl.textContent = "Disabled";
    } else {
        statusEl.classList.remove("disabled");
        statusEl.classList.add("enabled");
        btnEl.textContent = "Disable for this site";
        btnEl.classList.add("red");
        btnEl.classList.remove("green");
        badgeEl.textContent = "Active";
    }
}

function toggleCurrentSite() {
    if (!currentDomain) return;

    var { domains } = getElements();
    let domainList = domains.value ? domains.value.split("\n").map(d => d.trim()) : [];

    const isDisabled = domainList.some(d => d && currentDomain.includes(d.toLowerCase()));

    if (isDisabled) {
        // Remove domain from list
        domainList = domainList.filter(d => !currentDomain.includes(d.toLowerCase()));
    } else {
        // Add domain to list
        domainList.push(currentDomain);
    }

    domains.value = domainList.filter(d => d).join("\n");
    saveStorage();
    updateSiteStatus(domains.value);
}

window.onload = function () {
    var { tags, classes, domains, attributes } = getElements();
    [tags, classes, domains, attributes].forEach(el => el.addEventListener("change", saveStorage));

    // Get current tab's domain
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs[0] && tabs[0].url) {
            try {
                const url = new URL(tabs[0].url);
                currentDomain = url.hostname.toLowerCase();
                document.querySelector("#currentDomain").textContent = currentDomain;
            } catch (e) {
                document.querySelector("#currentDomain").textContent = "N/A";
            }
        }
        getStorage();
    });

    // Toggle button click handler
    document.querySelector("#toggleSiteBtn").addEventListener("click", toggleCurrentSite);

    // Advanced options dropdown toggle
    document.querySelector("#advancedToggle").addEventListener("click", function() {
        const content = document.querySelector("#advancedContent");
        const arrow = document.querySelector("#advancedArrow");
        content.classList.toggle("open");
        arrow.classList.toggle("open");
    });
}


function getElements() {
    var tags = document.querySelector("#excludeTags");
    var classes = document.querySelector("#excludeClasses");
    var domains = document.querySelector("#excludeDomains");
    var attributes = document.querySelector("#excludeAttributes");

    var elements = { tags, classes, domains, attributes }
    return elements;
}
