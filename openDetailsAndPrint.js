// Initialize an empty array to hold the details for each link
let links = [];

// Iterate over each link in the document
document.querySelectorAll('.trackOrders_details .col-lg-3.col-sm-3 a').forEach(link => {
    let invoiceDetailContainer = link.closest('.col-lg-3.col-sm-3');
    if (invoiceDetailContainer) {
        let invoiceTextContent = invoiceDetailContainer.textContent.trim();
        let match = invoiceTextContent.match(/(\d+)/); // Matches the first sequence of digits
        if (match && match[0]) {
            let invoiceNumber = match[0];
            // Add the details to the links array
            links.push({ url: link.href, invoiceNumber: invoiceNumber });
        } else {
            console.error("Invoice number not found for link:", link.href);
        }
    }
});

// Once all links are collected, send them to the background script for sequential processing
if (links.length > 0) {
    chrome.runtime.sendMessage({ action: "processLinks", links: links });
} else {
    console.log("No links found for processing.");
}
