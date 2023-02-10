var defaultTags = ""
var defaultClasses = "pagination, button, menu, control, icon"
var defaultDomains = "discord.com"
var defaultAttributes = ""


function saveDefaults() {
    chrome.storage.sync.get({
        excludeTags: null,
        excludeClasses: null,
        excludeDomains: null,
        excludeAttributes: null
    }, function (result) {
        if (!result.excludeTags)
            chrome.storage.sync.set({
                excludeTags: defaultTags,
            });
        if (!result.excludeClasses)
            chrome.storage.sync.set({
                excludeClasses: defaultClasses,
            });
        if (!result.excludeDomains)
            chrome.storage.sync.set({
                excludeDomains: defaultDomains,
            });
        if (!result.excludeAttributes)
            chrome.storage.sync.set({
                excludeAttributes: defaultAttributes,
            });
    });
}

saveDefaults();