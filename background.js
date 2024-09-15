// background.js

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getDocumentContent") {
    // Fetch content from Google Docs
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
    return true; // Indicates async response
  } else if (request.action === "getSheetContent") {
    // Fetch content from Google Sheets
    getAccessToken().then((token) => {
      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${request.spreadsheetId}/values:batchGet?ranges=${encodeURIComponent(
          request.range || "Sheet1"
        )}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const textContent = extractTextFromSheet(data);
          sendResponse({ textContent });
        })
        .catch((error) => {
          console.error("Error fetching sheet content:", error);
          sendResponse({ textContent: "" });
        });
    });
    return true; // Indicates async response
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

// Function to extract text from Google Docs document
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

// Function to extract text from Google Sheets data
function extractTextFromSheet(sheetData) {
  let text = "";
  if (sheetData && sheetData.valueRanges) {
    sheetData.valueRanges.forEach((range) => {
      if (range.values) {
        range.values.forEach((row) => {
          text += row.join("\t") + "\n";
        });
      }
    });
  }
  return text;
}
