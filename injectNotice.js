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
    let noticeText = '';
    let enabledFunctions = [];
    if (backupProductsEnabled) enabledFunctions.push('Products');
    if (backupPurchaseEnabled) enabledFunctions.push('Proof Of Purchase');

    // Join the array elements with comma separators
    let enabledFunctionsText = enabledFunctions.join(', ');

    noticeText = 'Backup function is currently enabled for: ' + enabledFunctionsText + '. Navigate to the relevant pages to trigger.';

    // Create or update the notice
    createOrUpdateNotice(noticeText);
}

function createOrUpdateNotice(text) {
    let notice = document.querySelector('#backup-notice');
    if (!notice) {
        notice = document.createElement('div');
        notice.id = 'backup-notice';
        notice.style.position = 'fixed';
        notice.style.bottom = '0';
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