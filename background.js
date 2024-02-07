chrome.runtime.onInstalled.addListener(() => {
    chrome.contextMenus.create({
        id: "backupProducts",
        title: "Backup Products",
        contexts: ["all"],
        documentUrlPatterns: ["https://store.x-plane.org/*"]
    });

    chrome.contextMenus.create({
        id: "backupPurchase",
        title: "Backup Proof Of Purchase",
        contexts: ["all"],
        documentUrlPatterns: ["https://store.x-plane.org/*"]
    });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
    if (info.menuItemId === "backupProducts" && tab.url.startsWith("https://store.x-plane.org/")) {
        // Check if we are on the correct page or need to redirect
        if (tab.url !== "https://store.x-plane.org/ordertrackingX.asp?sec=pro") {
            chrome.tabs.update(tab.id, { url: "https://store.x-plane.org/ordertrackingX.asp?sec=pro" });
        } else {
            // Inject the content script to extract items and download them
            chrome.scripting.executeScript({
                target: { tabId: tab.id },
                files: ['extractItemsAndDownload.js']
            });
        }
    }
    if (info.menuItemId === "backupProducts") {
        if (tab.url === "https://store.x-plane.org/ordertrackingX.asp?sec=pro") {
            // Invoke the products function here
        } else {
            chrome.tabs.update(tab.id, { url: "https://store.x-plane.org/ordertrackingX.asp?sec=pro" });
        }
    } else if (info.menuItemId === "backupPurchase") {
        if (tab.url === "https://store.x-plane.org/ordertrackingX.asp?sec=ord") {
            // Invoke the purchase function here
        } else {
            chrome.tabs.update(tab.id, { url: "https://store.x-plane.org/ordertrackingX.asp?sec=ord" });
        }
    }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
    if (request.action === "openAndPrint") {
        chrome.tabs.create({ url: request.url, active: true }, function (tab) {
            // Wait for the tab to load completely before capturing.
            chrome.tabs.onUpdated.addListener(function tabUpdateListener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === "complete") {
                    // Remove the listener to avoid multiple captures.
                    chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                    // Capture the screenshot.
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: scrollToElementAndCapture
                    }, () => {
                        // After scrolling, capture the screenshot
                        setTimeout(() => {
                            chrome.tabs.captureVisibleTab(tab.windowId, { format: "png" }, (dataUrl) => {
                                // Process the captured screenshot
                                const filename = `X-Plane Proof Of Purchase - ${request.invoiceNumber}.png`;
                                downloadImage(dataUrl, filename);

                                // Optionally, close the tab after capturing
                                chrome.tabs.remove(tab.id);
                            });
                        }, 1000); // Adjust this delay as necessary
                    });

                    // chrome.tabs.captureVisibleTab(null, { format: "png" }, function (dataUrl) {
                    //     // Save the screenshot as an image file.
                    //     const filename = `X-Plane.org Proof Of Purchase - ${request.invoiceNumber}.png`;
                    //     downloadImage(dataUrl, filename);

                    //     // Optionally, close the tab after capturing.
                    //     chrome.tabs.remove(tab.id);
                    // });
                }
            });
        });
    }
    if (request.action === "downloadItems") {
        // Convert the items array into a blob
        const blob = new Blob([request.items.join('\n')], { type: 'text/plain' });
        const reader = new FileReader();
        reader.readAsDataURL(blob);
        reader.onloadend = function () {
            const base64data = reader.result;

            chrome.downloads.download({
                url: base64data,
                filename: 'X-Plane Keys.txt'
            });
        };

    }
    if (request.action === "openAndClick") {
        chrome.tabs.create({ url: request.url, active: true }, function (tab) {
            // Attach a single update listener per tab
            function tabUpdateListener(tabId, changeInfo, tabInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    // Immediately remove listener to prevent double execution
                    chrome.tabs.onUpdated.removeListener(tabUpdateListener);

                    // Execute the script to click the download buttons
                    chrome.scripting.executeScript({
                        target: { tabId: tab.id },
                        function: clickDownloadButton
                    });
                }
            }
            chrome.tabs.onUpdated.addListener(tabUpdateListener);
        });
    }
});

function downloadImage(dataUrl, filename) {
    chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false
    });
}


function clickDownloadButton() {
    // Corrected class selector to use dots for class names
    const buttonSelector = '.btn.btn-default'; // Ensure the selector is correct
    const buttons = document.querySelectorAll(buttonSelector);
    buttons.forEach(button => {
        // Adding a slight delay might help if the page needs time to make buttons interactive
        setTimeout(() => button.click(), 1000);
    });
}

function scrollToElementAndCapture() {
    const targetElement = document.querySelector('.page_header.no-print');
    if (targetElement) {
        // Scroll the element into view
        targetElement.scrollIntoView();

        // Wait a bit to ensure the scroll has completed and page is stable.
        setTimeout(() => {
            // Send message to background to capture the screenshot
            chrome.runtime.sendMessage({ action: "captureVisible" });
        }, 500); // Adjust delay as needed to ensure page has stabilized
    } else {
        // Element not found, handle accordingly
        console.error("Target element for screenshot not found.");
    }
}
