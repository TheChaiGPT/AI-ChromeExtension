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
          const htmlContent = extractHtmlFromDocument(data);
          const plainTextContent = extractPlainTextFromDocument(data);
          sendResponse({ htmlContent, plainTextContent });
        })
        .catch((error) => {
          console.error("Error fetching document content:", error);
          sendResponse({ htmlContent: "", plainTextContent: "" });
        });
    });
    return true; // Indicates async response
  } else if (request.action === "getSheetContent") {
    // Fetch content from Google Sheets
    getAccessToken().then((token) => {
      fetch(
        `https://sheets.googleapis.com/v4/spreadsheets/${request.spreadsheetId}?includeGridData=true`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      )
        .then((response) => response.json())
        .then((data) => {
          const htmlContent = extractHtmlFromSheet(data);
          const plainTextContent = extractPlainTextFromSheet(data);
          sendResponse({ htmlContent, plainTextContent });
        })
        .catch((error) => {
          console.error("Error fetching sheet content:", error);
          sendResponse({ htmlContent: "", plainTextContent: "" });
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

// Function to extract HTML content from Google Docs document
function extractHtmlFromDocument(document) {
  let htmlContent = "";
  if (document && document.body && document.body.content) {
    document.body.content.forEach((element) => {
      if (element.paragraph) {
        htmlContent += parseParagraph(element.paragraph);
      }
    });
  }
  return htmlContent;
}

// Helper function to parse a paragraph element
function parseParagraph(paragraph) {
  let paragraphHtml = "<p>";
  paragraph.elements.forEach((elem) => {
    if (elem.textRun && elem.textRun.content) {
      paragraphHtml += parseTextRun(elem.textRun);
    }
  });
  paragraphHtml += "</p>";
  return paragraphHtml;
}

// Helper function to parse a text run with styling
function parseTextRun(textRun) {
  let text = textRun.content.replace(/\n/g, "<br>");

  if (textRun.textStyle) {
    let style = textRun.textStyle;
    if (style.bold) {
      text = `<strong>${text}</strong>`;
    }
    if (style.italic) {
      text = `<em>${text}</em>`;
    }
    if (style.underline) {
      text = `<u>${text}</u>`;
    }
    if (style.link && style.link.url) {
      text = `<a href="${style.link.url}" target="_blank">${text}</a>`;
    }
  }

  return text;
}

// Function to extract plain text from the document
function extractPlainTextFromDocument(document) {
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

// Function to extract HTML content from Google Sheets data
function extractHtmlFromSheet(sheetData) {
  let html = "<table border='1'>";
  if (sheetData && sheetData.sheets) {
    sheetData.sheets.forEach((sheet) => {
      if (sheet.data) {
        sheet.data.forEach((data) => {
          data.rowData.forEach((row) => {
            html += "<tr>";
            row.values.forEach((cell) => {
              let cellValue = cell.formattedValue || "";
              html += `<td>${cellValue}</td>`;
            });
            html += "</tr>";
          });
        });
      }
    });
  }
  html += "</table>";
  return html;
}

// Function to extract plain text from Google Sheets data
function extractPlainTextFromSheet(sheetData) {
  let text = "";
  if (sheetData && sheetData.sheets) {
    sheetData.sheets.forEach((sheet) => {
      if (sheet.data) {
        sheet.data.forEach((data) => {
          data.rowData.forEach((row) => {
            let rowText = row.values
              .map((cell) => cell.formattedValue || "")
              .join("\t");
            text += rowText + "\n";
          });
        });
      }
    });
  }
  return text;
}
