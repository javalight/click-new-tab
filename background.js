var defaultTags = "img"
var defaultClasses = "pagination, button, menu, control, icon"
var defaultDomains = "discord.com\nnetflix.com"
var defaultAttributes = "data-action"


function saveDefaults() {
    chrome.storage.sync.get({
        excludeTags: null,
        excludeClasses: null,
        excludeDomains: null,
        excludeAttributes: null
    }, function (result) {
        let toSet = {};

        if (!result.excludeTags) toSet.excludeTags = defaultTags;
        if (!result.excludeClasses) toSet.excludeClasses = defaultClasses;
        if (!result.excludeDomains) toSet.excludeDomains = defaultDomains;
        if (!result.excludeAttributes) toSet.excludeAttributes = defaultAttributes;

        // set any updated setting
        if (Object.keys(toSet).length > 0) chrome.storage.sync.set(toSet);
    });
}

saveDefaults();