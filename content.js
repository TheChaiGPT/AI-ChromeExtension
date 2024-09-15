// content.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "pasteText") {
    const textToInsert = request.text;

    // Insert the text into the Google Doc
    insertTextAtCursor(textToInsert)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Error inserting text:", error);
        sendResponse({ success: false });
      });

    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Function to insert text at the cursor position in Google Docs
function insertTextAtCursor(text) {
  return new Promise((resolve, reject) => {
    try {
      // Google Docs uses an iframe; get the iframe's document
      const iframe = document.querySelector('.kix-appview-editor');
      if (!iframe) {
        reject("Google Docs editor iframe not found.");
        return;
      }

      // Simulate keyboard events to insert text
      const textarea = iframe.querySelector('.kix-cursor');

      if (!textarea) {
        reject("Cursor element not found.");
        return;
      }

      textarea.focus();

      // Use the execCommand API
      document.execCommand('insertText', false, text);
      resolve();
    } catch (error) {
      reject(error);
    }
  });
}
