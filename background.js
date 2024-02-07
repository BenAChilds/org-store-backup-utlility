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
    if (request.action === "processLinks") {
        notifyUserStart(request.links.length);
        processLinksSequentially(request.links).then(() => {
            notifyUserEnd();
        }).catch(error => {
            console.error("An error occurred during the process:", error);
            // Optionally notify the user of the error
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
    const buttonSelector = '.btn.btn-default';
    document.querySelectorAll(buttonSelector).forEach(button => {
        setTimeout(() => button.click(), 1000); // Adding a delay to ensure the page has loaded
    });
}

function scrollToElementAndCapture() {
    const targetElement = document.querySelector('.page_header.no-print');
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

async function processLinksSequentially(links) {
    for (const { url, invoiceNumber } of links) {
        const tab = await openTabAndWaitForLoad(url);

        // Ensure the tab is active before scrolling and capturing
        await chrome.tabs.update(tab.id, { active: true });

        // Scroll the target element into view
        await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: scrollToElementAndCapture
        });

        // Wait a bit to ensure the scroll effect is complete and the page is stable
        await new Promise(resolve => setTimeout(resolve, 1000));

        // Capture the screenshot from the now-active and scrolled tab
        const dataUrl = await captureScreenshot(tab);

        // Download the screenshot
        if (dataUrl) {
            const filename = `X-Plane.org Purchase - ${invoiceNumber}.png`;
            downloadScreenshot(dataUrl, filename);
        } else {
            console.error('Failed to capture screenshot for invoice:', invoiceNumber);
        }

        // Close the tab after capturing and downloading the screenshot
        chrome.tabs.remove(tab.id);
    }
}


function openTabAndWaitForLoad(url) {
    return new Promise((resolve, reject) => {
        chrome.tabs.create({ url: url, active: false }, tab => {
            chrome.tabs.onUpdated.addListener(function listener(tabId, changeInfo) {
                if (tabId === tab.id && changeInfo.status === 'complete') {
                    chrome.tabs.onUpdated.removeListener(listener);
                    resolve(tab);
                }
            });
        });
    });
}

function captureScreenshot(tab) {
    return new Promise((resolve, reject) => {
        // Add a slight delay to ensure the tab is ready for capture
        setTimeout(() => {
            chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' }, dataUrl => {
                if (chrome.runtime.lastError) {
                    reject(new Error(`Failed to capture tab: ${chrome.runtime.lastError.message}`));
                } else {
                    resolve(dataUrl);
                }
            });
        }, 500); // Adjust delay as needed
    });
}

function downloadScreenshot(dataUrl, filename) {
    if (!dataUrl) {
        console.error('No data URL provided for download.');
        return; // Exit if no data URL is provided
    }

    chrome.downloads.download({
        url: dataUrl,
        filename: filename,
        saveAs: false // or true, based on your requirements
    }, downloadId => {
        if (chrome.runtime.lastError) {
            console.error(`Download failed: ${chrome.runtime.lastError.message}`);
        }
    });
}

function notifyUserStart(linksLength) {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon.png',
        title: 'Backup Process Started',
        message: `Starting the backup process for ${linksLength} purchases. Please do not interfere with the browser while this process is running.`,
        priority: 2
    });
}

function notifyUserEnd() {
    chrome.notifications.create({
        type: 'basic',
        iconUrl: 'images/icon.png',
        title: 'Backup Process Complete',
        message: 'Backup process complete. You may now use your browser again.',
        priority: 2
    });
}
