// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDocumentContent") {
    getAccessToken().then((token) => {
      fetch(`https://docs.googleapis.com/v1/documents/${request.documentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((response) => response.json())
        .then((data) => {
          const textContent = extractTextFromDocument(data);
          sendResponse({ textContent });
        })
        .catch((error) => {
          console.error("Error fetching document content:", error);
          sendResponse({ textContent: "" });
        });
    });
    // Return true to indicate that sendResponse will be called asynchronously
    return true;
  }
});

// Function to get the OAuth access token
function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError || !token) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(token);
      }
    });
  });
}

// Function to extract text from the document structure
function extractTextFromDocument(document) {
  let text = "";
  if (document && document.body && document.body.content) {
    document.body.content.forEach((element) => {
      if (element.paragraph) {
        element.paragraph.elements.forEach((elem) => {
          if (elem.textRun && elem.textRun.content) {
            text += elem.textRun.content;
          }
        });
      }
    });
  }
  return text;
}
