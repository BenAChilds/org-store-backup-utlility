// PROD - Trigger screenshot capture for each invoice detail page.
// document.querySelectorAll('.trackOrders_details .col-lg-3.col-sm-3 a').forEach(link => {
//     const invoiceNumber = link.closest('.trackOrders_details').querySelector('.col-lg-3.col-sm-3').textContent.trim().split(/\s+/)[0];
//     chrome.runtime.sendMessage({ action: "openAndPrint", url: link.href, invoiceNumber });
// });

// DEV - Assuming this script is for opening detail pages and capturing or printing
document.querySelectorAll('.trackOrders_details .col-lg-3.col-sm-3 a').forEach((link, index) => {
    if (index < 2) { // Only operate on the first two links
        const invoiceNumber = link.closest('.trackOrders_details').querySelector('.col-lg-3.col-sm-3').textContent.trim().split(/\s+/)[0];
        chrome.runtime.sendMessage({ action: "openAndPrint", url: link.href, invoiceNumber });
    }
});
