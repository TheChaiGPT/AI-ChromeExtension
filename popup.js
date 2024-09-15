// popup.js

document.addEventListener("DOMContentLoaded", () => {
  const docContentTextarea = document.getElementById("docContent");
  const userQuestionTextarea = document.getElementById("userQuestion");
  const askButton = document.getElementById("askButton");
  const responseContainer = document.getElementById("responseContainer");
  const responseTextDiv = document.getElementById("responseText");
  const copyButton = document.getElementById("copyButton");
  const apiKeyInput = document.getElementById("apiKeyInput");
  const saveApiKeyButton = document.getElementById("saveApiKeyButton");

  // Load saved API key on startup
  chrome.storage.local.get("openaiApiKey", (data) => {
    if (data.openaiApiKey) {
      apiKeyInput.value = data.openaiApiKey;
    }
  });

  // Save API key
  saveApiKeyButton.addEventListener("click", () => {
    const apiKey = apiKeyInput.value.trim();
    if (apiKey) {
      chrome.storage.local.set({ openaiApiKey: apiKey }, () => {
        alert("API Key saved.");
      });
    } else {
      alert("Please enter a valid API Key.");
    }
  });

  // Extract text from the Google Docs API
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    const url = new URL(activeTab.url);
    const documentId = url.pathname.split("/")[3];

    // Request the document content from the background script
    chrome.runtime.sendMessage(
      {
        action: "getDocumentContent",
        documentId: documentId,
      },
      (response) => {
        if (response && response.textContent) {
          docContentTextarea.value = response.textContent;
        } else {
          docContentTextarea.value =
            "Unable to extract text. Please ensure you have granted permissions.";
        }
      }
    );
  });

  // Handle the Ask button click
  askButton.addEventListener("click", () => {
    const docContent = docContentTextarea.value;
    const userQuestion = userQuestionTextarea.value.trim();

    if (!userQuestion) {
      alert("Please enter a question.");
      return;
    }

    // Retrieve the API key from storage
    chrome.storage.local.get("openaiApiKey", (data) => {
      const apiKey = data.openaiApiKey;

      if (!apiKey) {
        alert("Please enter your OpenAI API Key in the settings below.");
        return;
      }

      // Truncate the document content if it's too long
      const maxDocLength = 1500;
      let truncatedDocContent = docContent;
      if (docContent.length > maxDocLength) {
        truncatedDocContent = docContent.substring(0, maxDocLength);
      }

      // Call the OpenAI API
      fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: `You are given the following document:\n${truncatedDocContent}\nPlease answer the user's question based on the document.`,
            },
            {
              role: "user",
              content: userQuestion,
            },
          ],
        }),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.error) {
            console.error("Error from OpenAI API:", data.error);
            alert(`OpenAI API error: ${data.error.message}`);
          } else {
            const answer = data.choices[0].message.content.trim();
            responseTextDiv.textContent = answer;
            responseContainer.style.display = "block";
          }
        })
        .catch((error) => {
          console.error("Error:", error);
          alert("An error occurred while fetching the response.");
        });
    });
  });

  // Handle the Copy button click
  copyButton.addEventListener("click", () => {
    const responseText = responseTextDiv.textContent;
    navigator.clipboard.writeText(responseText).then(
      () => {
        alert("Response copied to clipboard!");
      },
      (err) => {
        console.error("Could not copy text: ", err);
      }
    );
  });
});
