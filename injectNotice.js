// injectNotice.js
chrome.storage.local.get(['backupProductsEnabled', 'backupPurchaseEnabled'], function (result) {
    const { backupProductsEnabled, backupPurchaseEnabled } = result;

    if (backupProductsEnabled || backupPurchaseEnabled) {
        getNoticeText(backupProductsEnabled, backupPurchaseEnabled);
    } else {
        // Remove the notice if both functionalities are disabled
        removeNotice();
    }
});

function getNoticeText(backupProductsEnabled, backupPurchaseEnabled) {
    let noticeText = 'Backup function is currently enabled for: ';
    let suggestions = []; // Use an array to gather suggestions based on what's enabled

    if (backupProductsEnabled && backupPurchaseEnabled) {
        // If both are enabled, provide a general instruction that covers both cases
        noticeText += "Products and Proof Of Purchase.";
        suggestions.push('Please head to the "View All Products" page for products backup and the "View All Orders" page for purchase backup.');
    } else if (backupProductsEnabled) {
        // If only Products backup is enabled
        noticeText += "Products. ";
        suggestions.push('Please head to the "View All Products" page to trigger products backup.');
    } else if (backupPurchaseEnabled) {
        // If only Purchases backup is enabled
        noticeText += "Proof Of Purchase. ";
        suggestions.push('Please head to the "View All Orders" page to trigger purchases backup.');
    }

    // Joining suggestions for the case both are enabled or just making it more readable
    let suggestionText = suggestions.join(' ');

    noticeText += suggestionText;

    // Create or update the notice
    createOrUpdateNotice(noticeText);
}

function createOrUpdateNotice(text) {
    let notice = document.querySelector('#backup-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'backup-notice';
        notice.style.position = 'fixed';
        notice.style.top = '0';
        notice.style.left = '0';
        notice.style.width = '100%';
        notice.style.backgroundColor = '#feb204';
        notice.style.color = 'white';
        notice.style.textAlign = 'center';
        notice.style.padding = '10px';
        notice.style.zIndex = '10000';
        document.body.appendChild(notice);
    }
    notice.textContent = text;
}

function removeNotice() {
    const notice = document.querySelector('#backup-notice');
    if (notice) {
        notice.remove();
    }
}

chrome.runtime.onMessage.addListener(function (message, sender, sendResponse) {
    if (message.action === "updateNotice") {
        // Trigger the same storage retrieval and notice update logic as above
        chrome.storage.local.get(['backupProductsEnabled', 'backupPurchaseEnabled'], function (result) {
            const { backupProductsEnabled, backupPurchaseEnabled } = result;

            if (backupProductsEnabled || backupPurchaseEnabled) {
                getNoticeText(backupProductsEnabled, backupPurchaseEnabled);
            } else {
                removeNotice();
            }
        });
    }
});