(function () {
    chrome.storage.local.get(['backupProductsEnabled'], function (result) {
        if (result.backupProductsEnabled) {
            const downloadLinks = document.querySelectorAll('.trackOrders_details .col-lg-2.col-sm-2.text-right a');
            const limitedDownloadLinks = Array.from(downloadLinks).slice(0, 4); // Limit for development purposes

            let invoiceLinks = {};

            // TODO: Change to downloadLinks for prod
            limitedDownloadLinks.forEach(link => {
                const invoiceNumber = link.closest('.trackOrders_details').querySelector('.col-lg-3.col-sm-3').textContent.trim();
                if (!invoiceLinks.hasOwnProperty(invoiceNumber)) {
                    invoiceLinks[invoiceNumber] = link.href;
                }
            });

            const items = Array.from(downloadLinks)
                .filter(el => el.closest('.trackOrders_details').querySelector('.col-lg-3.col-sm-3.text-left').textContent.includes("Serial:"))
                .map(el => {
                    const productText = el.closest('.trackOrders_details').querySelector('.col-lg-3.col-sm-3.text-left').textContent.trim();
                    return productText.replace("Item\n", "").replace("Serial:", " Serial:");
                });

            let processedUrls = {};
            Object.values(invoiceLinks).forEach(url => {
                if (!processedUrls[url]) {
                    chrome.runtime.sendMessage({ action: "openAndClick", url: url });
                    processedUrls[url] = true;
                }
            });

            // Ensure this is outside and after the loop for processing URLs
            chrome.runtime.sendMessage({ action: "downloadItems", items });
        }
    })
})();
