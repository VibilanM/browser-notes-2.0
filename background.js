chrome.contextMenus.create({
    id: "right-click",
    title: "Add a note",
    contexts: ["all"]
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId !== "right-click") return;

    chrome.tabs.sendMessage(
        tab.id,
        {
            type: "ADD_STICKY_NOTE",
            url: info.pageUrl || tab.url
        }
    );
});