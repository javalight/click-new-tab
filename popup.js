var defaultTags = "i"
var defaultClasses = "buttons, Pagination"
var defaultDomains = "discord.com"
var defaultAttributes = ""


function getStorage() {
    chrome.storage.sync.get({
        excludeTags: defaultTags,
        excludeClasses: defaultClasses,
        excludeDomains: defaultDomains,
        excludeAttributes: defaultAttributes
    }, function (result) {
        var { tags, classes, domains, attributes } = getElements()
        tags.value = result.excludeTags;
        classes.value = result.excludeClasses;
        domains.value = result.excludeDomains;
        attributes.value = result.excludeAttributes;
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


window.onload = function () {
    var { tags, classes, domains, attributes } = getElements();
    [tags, classes, domains, attributes].forEach(el => el.addEventListener("change", saveStorage));

    getStorage();
}



function getElements() {
    var tags = document.querySelector("#excludeTags");
    var classes = document.querySelector("#excludeClasses");
    var domains = document.querySelector("#excludeDomains");
    var attributes = document.querySelector("#excludeAttributes");

    var elements = { tags, classes, domains, attributes }
    return elements;
}
