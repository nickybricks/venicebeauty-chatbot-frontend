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
    let pendingSuggestion = null; // Variable, um den ausstehenden Vorschlag zu speichern
    let loadingAnimation = null; // Variable für die dynamisch erstellte Animation
    let currentMessageEl = null; // Variable, um die aktuelle Nachricht zu speichern

    // Debugging: Überprüfen, ob der chat-body im DOM vorhanden ist
    console.log("DEBUG: Chat body element:", chatBody);

    chatToggle.onclick = () => {
        console.log("DEBUG: Chat toggle clicked");
        if (chatWindow.style.display === "none" || !chatWindow.style.display) {
            chatWindow.style.display = "flex";
            console.log("DEBUG: Chat window displayed");
            if (!chatBody.hasChildNodes()) {
                console.log("DEBUG: Chat body is empty, adding welcome message");
                addMessage("Hallo! 👋 Wie kann ich dir helfen? Falls es um deine Bestellung geht, gib bitte sowohl deine Bestellnummer als auch die E-Mail-Adresse an, mit der du bestellt hast.", "bot");
            }
        } else {
            chatWindow.style.display = "none";
            console.log("DEBUG: Chat window hidden");
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
                // Ladeanimation anzeigen und Anfrage verzögern
                showLoadingAnimation();
                setTimeout(() => {
                    fetchResponse(textContent);
                }, 2000); // 2 Sekunden Verzögerung
            }
            if (selectedFiles.length > 0) {
                // Ladeanimation anzeigen und Anfrage verzögern
                showLoadingAnimation();
                setTimeout(() => {
                    uploadFiles(selectedFiles, textContent);
                }, 2000); // 2 Sekunden Verzögerung
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

    // Funktion zum Anzeigen der Ladeanimation
    function showLoadingAnimation() {
        console.log("DEBUG: Showing loading animation");
        // Entferne die vorherige Animation, falls vorhanden
        if (loadingAnimation) {
            loadingAnimation.remove();
        }
        // Erstelle die Ladeanimation dynamisch
        loadingAnimation = document.createElement("div");
        loadingAnimation.id = "loading-animation";
        loadingAnimation.className = "loading-animation";
        loadingAnimation.innerHTML = `
            <div class="grok-dots">
                <span class="dot"></span>
                <span class="dot"></span>
                <span class="dot"></span>
            </div>
        `;
        // Stelle sicher, dass die Animation sichtbar ist
        loadingAnimation.style.display = 'block';
        loadingAnimation.style.visibility = 'visible';
        // Füge die Animation direkt vor der neuen Nachricht ein
        if (currentMessageEl) {
            chatBody.insertBefore(loadingAnimation, currentMessageEl);
        } else {
            chatBody.appendChild(loadingAnimation);
        }
        console.log("DEBUG: Loading animation added to chat-body:", loadingAnimation);
        console.log("DEBUG: Loading animation display:", loadingAnimation.style.display);
        console.log("DEBUG: Loading animation visibility:", loadingAnimation.style.visibility);
        console.log("DEBUG: Loading animation position:", loadingAnimation.offsetTop, loadingAnimation.offsetLeft);
        // Position der letzten Bot-Nachricht für Vergleich
        const lastBotMessage = chatBody.querySelector(".bot-message:last-of-type");
        if (lastBotMessage) {
            console.log("DEBUG: Last bot message position:", lastBotMessage.offsetTop, lastBotMessage.offsetLeft);
        }
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    // Funktion zum Ausblenden der Ladeanimation
    function hideLoadingAnimation() {
        console.log("DEBUG: Hiding loading animation");
        if (loadingAnimation) {
            loadingAnimation.remove();
            loadingAnimation = null;
            console.log("DEBUG: Loading animation removed from chat-body");
        } else {
            console.error("DEBUG: Loading animation element not found in DOM");
        }
    }

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

    // Funktion zum Umwandeln von Markdown-Links und fetten Text
    function renderMarkdown(text) {
        // Ersetze Markdown-Links [Text](URL) durch <a href="URL">Text</a>
        let formattedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        // Ersetze Markdown-Syntax für fetten Text **Text** durch <b>Text</b>
        formattedText = formattedText.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');
        return formattedText;
    }

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        // Ersetze \n\n durch <br><br> für Absätze und \n durch <br> für Aufzählungszeichen
        let formattedText = text.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
        // Wandle Markdown-Links und fetten Text in HTML um
        formattedText = renderMarkdown(formattedText);
        messageEl.innerHTML = formattedText;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        // Wenn es eine Bot-Nachricht ist, speichere die Referenz für die Animation
        if (sender === "bot") {
            currentMessageEl = messageEl;
        }
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
        console.log(`DEBUG: Added message to DOM: ${formattedText} (Sender: ${sender})`);
        // Position der neuen Nachricht loggen
        console.log("DEBUG: New message position:", messageEl.offsetTop, messageEl.offsetLeft);
        return messageEl; // Rückgabe des Elements für die Streaming-Anzeige
    }

    async function fetchResponse(message) {
        // Extrahiere E-Mail-Adresse aus der aktuellen Nachricht, falls vorhanden
        let email = null;
        if (message.includes("@") && message.includes(".")) {
            const emailMatch = message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
                email = emailMatch[0];
                localStorage.setItem("userEmail", email);  // Speichere die E-Mail-Adresse für zukünftige Nutzung
            }
        }
    
        try {
            const response = await fetch("https://ki-chatbot-13ko.onrender.com/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message,
                    email: email,  // Sende nur die E-Mail-Adresse, die in der aktuellen Nachricht enthalten ist
                    chatHistory: chatHistory
                })
            });
    
            if (!response.ok) {
                console.error(`DEBUG: Fetch error: ${response.status} ${response.statusText}`);
                addMessage("Fehler bei der Verbindung zum Server.", "bot");
                hideLoadingAnimation();
                return;
            }
    
            const contentType = response.headers.get("content-type");
            console.log(`DEBUG: Response content-type: ${contentType}`);
    
            if (contentType && contentType.includes("text/event-stream")) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let messageEl = addMessage("", "bot"); // Erstelle ein leeres Nachrichtenelement
                let fullMessage = "";
                let buffer = []; // Buffer für Chunks
                let isFirstChunk = true; // Flag, um den ersten Chunk zu erkennen
    
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log("DEBUG: Stream completed");
                        if (!fullMessage) {
                            console.error("DEBUG: Stream completed with no response");
                            addMessage("Es tut mir leid, ich konnte keine Antwort generieren. Bitte versuche es erneut.", "bot");
                        }
                        break;
                    }
    
                    const chunk = decoder.decode(value);
                    console.log(`DEBUG: Received chunk: ${chunk}`);
                    const lines = chunk.split("\n\n");
                    for (const line of lines) {
                        if (line.startsWith("data: ")) {
                            try {
                                const data = JSON.parse(line.replace("data: ", ""));
                                if (data.content) {
                                    // Sobald der erste Chunk empfangen wird, Ladeanimation ausblenden
                                    if (isFirstChunk) {
                                        hideLoadingAnimation();
                                        isFirstChunk = false;
                                    }
                                    buffer.push(data.content);
                                }
                                if (data.full_response) {
                                    fullMessage = data.full_response;
                                    // Entferne den Button-Text vollständig aus der Nachricht
                                    fullMessage = fullMessage.replace(/\[suggestion_button:[^\]]+\]/g, "").trim();
                                    fullMessage = fullMessage.replace(/\[Ja, bitte stornieren\]/g, "").trim();
                                    messageEl.innerHTML = renderMarkdown(fullMessage.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>"));
                                    chatHistory.push({ sender: "bot", message: fullMessage });
                                    console.log(`DEBUG: Full response received: ${fullMessage}`);
                                    if (data.suggestion) {
                                        console.log("DEBUG: Suggestion received from server:", data.suggestion);
                                        pendingSuggestion = data.suggestion; // Speichere den Vorschlag
                                        showSuggestionButton(data.suggestion); // Zeige den Button oberhalb des Eingabefelds
                                    } else {
                                        console.log("DEBUG: No suggestion found in response");
                                    }
                                }
                            } catch (e) {
                                console.error(`DEBUG: Error parsing chunk: ${line}, Error: ${e}`);
                            }
                        }
                    }
    
                    // Verarbeite den Buffer mit Verzögerung
                    let currentText = fullMessage;
                    while (buffer.length > 0) {
                        const content = buffer.shift();
                        currentText += content;
                        // Prüfe, ob ein Markdown-Link im aktuellen Text vorhanden ist
                        const linkMatch = currentText.match(/\[([^\]]+)\]\(([^)]+)\)/);
                        if (linkMatch) {
                            const beforeLink = currentText.substring(0, linkMatch.index);
                            const linkText = `<a href="${linkMatch[2]}" target="_blank">${linkMatch[1]}</a>`;
                            const afterLink = currentText.substring(linkMatch.index + linkMatch[0].length);
                            currentText = beforeLink + linkText + afterLink;
                        }
                        // Wandle den restlichen Text in HTML um
                        currentText = renderMarkdown(currentText.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>"));
                        messageEl.innerHTML = currentText;
                        chatBody.scrollTop = chatBody.scrollHeight;
                        await new Promise(resolve => setTimeout(resolve, 50)); // Verzögerung von 50ms pro Chunk
                    }
                    fullMessage = currentText;
                }
            } else {
                // Fallback für text/plain Antworten
                console.log("DEBUG: Response is not an event-stream, treating as text/plain");
                const text = await response.text();
                console.log(`DEBUG: Received text response: ${text}`);
                hideLoadingAnimation();
                addMessage(text, "bot");
                chatHistory.push({ sender: "bot", message: text });
            }
        } catch (error) {
            console.error(`DEBUG: Fetch error: ${error}`);
            hideLoadingAnimation();
            addMessage("Fehler bei der Verbindung zum Server.", "bot");
        }
    }

    function showSuggestionButton(suggestionText) {
        // Entferne vorhandene Suggestion-Buttons
        const existingButton = document.querySelector(".suggestion-button");
        if (existingButton) {
            console.log("DEBUG: Removing existing suggestion button");
            existingButton.remove();
        }
    
        // Erstelle einen neuen Button
        const button = document.createElement("button");
        button.textContent = suggestionText;
        button.className = "suggestion-button";
        button.onclick = () => {
            console.log("DEBUG: Suggestion button clicked:", suggestionText);
            addMessage(suggestionText, "user");
            chatHistory.push({ sender: "user", message: suggestionText });
            button.remove(); // Entferne den Button nach dem Klick
            pendingSuggestion = null; // Setze den ausstehenden Vorschlag zurück
            // Ladeanimation anzeigen und Anfrage verzögern
            showLoadingAnimation();
            setTimeout(() => {
                fetchResponse(suggestionText);
            }, 2000); // 2 Sekunden Verzögerung
        };
    
        // Füge den Button oberhalb des Eingabefelds hinzu
        const chatInputContainer = document.querySelector("#chat-input-container");
        if (!chatInputContainer) {
            console.error("DEBUG: chat-input-container not found in DOM");
            return;
        }
        chatInputContainer.parentNode.insertBefore(button, chatInputContainer);
        console.log("DEBUG: Suggestion button added to DOM:", button);
        console.log("DEBUG: Button visibility:", button.style.display || "default (block)");
        console.log("DEBUG: Button position:", button.offsetTop, button.offsetLeft);
        console.log("DEBUG: Button parent:", button.parentNode);
    }
});
