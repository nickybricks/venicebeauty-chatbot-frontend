document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    let chatHistory = [];
    let selectedFiles = [];

    chatToggle.onclick = () => {
        if (chatWindow.style.display === "none" || !chatWindow.style.display) {
            chatWindow.style.display = "flex";
            if (!chatBody.hasChildNodes()) {
                addMessage("Hallo! 👋 Wie kann ich dir helfen? Falls es um deine Bestellung geht, gib bitte sowohl deine Bestellnummer als auch die E-Mail-Adresse an, mit der du bestellt hast.", "bot");
            }
        } else {
            chatWindow.style.display = "none";
        }
    };

    sendBtn.onclick = sendMessage;

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });

    function sendMessage() {
        const textContent = chatInput.textContent.trim();
        if (textContent || selectedFiles.length > 0) {
            if (textContent) {
                addMessage(textContent, "user");
                chatHistory.push({ sender: "user", message: textContent });
                fetchResponse(textContent);
            }
            if (selectedFiles.length > 0) {
                uploadFiles(selectedFiles, textContent);
            }
            selectedFiles = [];
            fileInput.value = "";
            chatInput.innerHTML = "";
        }
    }

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            selectedFiles = [...selectedFiles, ...files];
            updateInputField();
            chatInput.focus();
        }
    };

    function updateInputField() {
        const textNodes = Array.from(chatInput.childNodes).filter(node => node.nodeType === Node.TEXT_NODE);
        const textContent = textNodes.map(node => node.textContent).join("").trim();

        chatInput.innerHTML = "";
        if (textContent) {
            const textNode = document.createTextNode(textContent + " ");
            chatInput.appendChild(textNode);
        }

        selectedFiles.forEach((file, index) => {
            const chip = document.createElement("span");
            chip.className = "file-chip";
            chip.innerHTML = `${file.name}<span class="remove-file" onclick="removeFile(${index})">✕</span>`;
            chatInput.appendChild(chip);
            chatInput.appendChild(document.createTextNode(" "));
        });
    }

    window.removeFile = (index) => {
        selectedFiles.splice(index, 1);
        updateInputField();
    };

    function uploadFiles(files, message) {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file);
        });
        formData.append("email", localStorage.getItem("userEmail"));
        formData.append("message", message);

        fetch("https://ki-chatbot-13ko.onrender.com/upload", {
            method: "POST",
            body: formData
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                console.log("DEBUG: Files uploaded successfully:", data.filenames);
                data.filenames.forEach(filename => {
                    const fileMessage = `Datei hochgeladen: ${filename}`;
                    addMessage(fileMessage, "user");
                    chatHistory.push({ sender: "user", message: fileMessage });
                });
                fetchResponse(`Datei hochgeladen: ${data.filenames[data.filenames.length - 1]}`);
            } else {
                console.log("DEBUG: File upload failed:", data.error);
                addMessage("Fehler beim Hochladen der Dateien.", "bot");
            }
        })
        .catch((error) => {
            console.error("DEBUG: Upload error:", error);
            addMessage("Fehler bei der Verbindung zum Server.", "bot");
        });
    }

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        messageEl.innerHTML = text;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
        return messageEl; // Rückgabe des Elements für die Streaming-Anzeige
    }

    function fetchResponse(message) {
        if (message.includes("@") && message.includes(".")) {
            const emailMatch = message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
                localStorage.setItem("userEmail", emailMatch[0]);
            }
        }

        // Sende die Daten als Query-Parameter
        const params = new URLSearchParams({
            message: message,
            email: localStorage.getItem("userEmail") || "",
            chatHistory: JSON.stringify(chatHistory)
        });
        const url = `https://ki-chatbot-13ko.onrender.com/chat?${params.toString()}`;

        const eventSource = new EventSource(url);

        let messageEl = addMessage("", "bot"); // Erstelle ein leeres Nachrichtenelement
        let fullMessage = "";

        eventSource.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.content) {
                fullMessage += data.content;
                messageEl.innerHTML = fullMessage; // Aktualisiere den Text schrittweise
                chatBody.scrollTop = chatBody.scrollHeight;
            }
            if (data.full_response) {
                fullMessage = data.full_response;
                messageEl.innerHTML = fullMessage;
                chatHistory.push({ sender: "bot", message: fullMessage });
                if (data.suggestion) {
                    console.log("DEBUG: Suggestion found:", data.suggestion);
                    addSuggestionButton(data.suggestion);
                } else {
                    console.log("DEBUG: No suggestion found in response");
                }
                eventSource.close(); // Schließe die Verbindung, wenn die Antwort vollständig ist
            }
        };

        eventSource.onerror = (error) => {
            console.error("DEBUG: EventSource error:", error);
            messageEl.innerHTML = "Fehler bei der Verbindung zum Bot.";
            eventSource.close();
        };
    }

    function addSuggestionButton(suggestionText) {
        console.log("DEBUG: Adding suggestion button with text:", suggestionText);
        const button = document.createElement("button");
        button.textContent = suggestionText;
        button.className = "suggestion-button";
        button.style.display = "block";
        button.style.margin = "10px 0";
        button.onclick = () => {
            console.log("DEBUG: Suggestion button clicked:", suggestionText);
            addMessage(suggestionText, "user");
            chatHistory.push({ sender: "user", message: suggestionText });
            button.remove();
            fetchResponse(suggestionText);
        };
        chatBody.appendChild(button);
        console.log("DEBUG: Button added to DOM:", button);
        chatBody.scrollTop = chatBody.scrollHeight;
    }
});
