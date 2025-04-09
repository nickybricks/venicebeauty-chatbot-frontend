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
    let pendingSuggestion = null;
    let loadingAnimation = null;
    let currentMessageEl = null;

    // Supabase-Client initialisieren
    const SUPABASE_URL = 'https://fjezzwlgkxywgzvwqrcp.supabase.co'; // Ersetze mit deiner Supabase Project URL
    const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZqZXp6d2xna3h5d2d6dndxcmNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQyMTM1NzUsImV4cCI6MjA1OTc4OTU3NX0.4-kjgklue8J4EIe2sllcsPvRuE__gX3CxWnx3nHqS80'; // Ersetze mit deinem Supabase API Key
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    // Funktion zum Senden von Tracking-Events an Supabase
    async function trackEvent(eventType, metadata = {}) {
        const userId = localStorage.getItem("userId") || crypto.randomUUID();
        localStorage.setItem("userId", userId);
        const { data, error } = await supabase
            .from('chat_events')
            .insert([
                { event_type: eventType, user_id: userId, metadata: metadata }
            ]);
        if (error) {
            console.error(`DEBUG: Error tracking event ${eventType}:`, error);
        } else {
            console.log(`DEBUG: Tracked event ${eventType}:`, data);
        }
    }

    chatToggle.onclick = () => {
        console.log("DEBUG: Chat toggle clicked");
        if (chatWindow.style.display === "none" || !chatWindow.style.display) {
            chatWindow.style.display = "flex";
            console.log("DEBUG: Chat window displayed");
            // Tracking-Event für chat_opened
            trackEvent('chat_opened');
            setTimeout(() => {
                console.log("DEBUG: Checking if chat body has child nodes:", chatBody.hasChildNodes());
                if (!chatBody.hasChildNodes()) {
                    console.log("DEBUG: Chat body is empty, adding welcome message");
                    const welcomeMessage = "Hallo! 👋 Wie kann ich dir helfen? Falls es um deine Bestellung geht, gib bitte sowohl deine Bestellnummer als auch die E-Mail-Adresse an, mit der du bestellt hast.";
                    const messageEl = document.createElement("div");
                    messageEl.className = "bot-message";
                    messageEl.innerHTML = welcomeMessage;
                    chatBody.appendChild(messageEl);
                    chatBody.scrollTop = chatBody.scrollHeight;
                    console.log(`DEBUG: Added welcome message to DOM: ${welcomeMessage} (Sender: bot)`);
                    console.log("DEBUG: Welcome message position:", messageEl.offsetTop, messageEl.offsetLeft);
                    console.log("DEBUG: Chat body children after adding welcome message:", chatBody.children);
                } else {
                    console.log("DEBUG: Chat body already has child nodes:", chatBody.children);
                }
            }, 200);
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
                // Tracking-Event für message_sent
                trackEvent('message_sent', { message: textContent });
                showLoadingAnimation();
                setTimeout(() => {
                    fetchResponse(textContent);
                }, 2000);
            }
            if (selectedFiles.length > 0) {
                showLoadingAnimation();
                setTimeout(() => {
                    uploadFiles(selectedFiles, textContent);
                }, 2000);
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

    function showLoadingAnimation() {
        console.log("DEBUG: Showing loading animation");
        if (loadingAnimation) {
            loadingAnimation.remove();
        }
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
        loadingAnimation.style.display = 'inline-block';
        loadingAnimation.style.visibility = 'visible';
        const messageEl = document.createElement("div");
        messageEl.className = "bot-message";
        messageEl.appendChild(loadingAnimation);
        chatBody.appendChild(messageEl);
        currentMessageEl = messageEl;
        console.log("DEBUG: Loading animation added to new bot message:", loadingAnimation);
        console.log("DEBUG: Loading animation display:", loadingAnimation.style.display);
        console.log("DEBUG: Loading animation visibility:", loadingAnimation.style.visibility);
        console.log("DEBUG: Loading animation position:", loadingAnimation.offsetTop, loadingAnimation.offsetLeft);
        console.log("DEBUG: Current message position:", messageEl.offsetTop, messageEl.offsetLeft);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function hideLoadingAnimation() {
        console.log("DEBUG: Hiding loading animation");
        if (loadingAnimation) {
            loadingAnimation.remove();
            loadingAnimation = null;
            console.log("DEBUG: Loading animation removed from current message");
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
        // Tracking-Event für file_uploaded
        trackEvent('file_uploaded', { file_count: files.length });
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

    function renderMarkdown(text) {
        let formattedText = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        formattedText = formattedText.replace(/\*\*([^\*]+)\*\*/g, '<b>$1</b>');
        return formattedText;
    }

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        let formattedText = text.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>");
        formattedText = renderMarkdown(formattedText);
        messageEl.innerHTML = formattedText;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
        console.log(`DEBUG: Added message to DOM: ${formattedText} (Sender: ${sender})`);
        console.log("DEBUG: New message position:", messageEl.offsetTop, messageEl.offsetLeft);
        return messageEl;
    }

    async function fetchResponse(message) {
        let email = null;
        if (message.includes("@") && message.includes(".")) {
            const emailMatch = message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
                email = emailMatch[0];
                localStorage.setItem("userEmail", email);
            }
        }
 
        try {
            const response = await fetch("https://ki-chatbot-13ko.onrender.com/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: message,
                    email: email,
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
                let messageEl = currentMessageEl;
                let fullMessage = "";
                let buffer = [];
                let isFirstChunk = true;
 
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) {
                        console.log("DEBUG: Stream completed");
                        if (!fullMessage) {
                            console.error("DEBUG: Stream completed with no response");
                            addMessage("Es tut mir leid, ich konnte keine Antwort generieren. Bitte versuche es erneut.", "bot");
                        }
                        // Zeige NPS-Umfrage nach der Interaktion
                        setTimeout(() => {
                            const npsSurvey = document.createElement("div");
                            npsSurvey.innerHTML = `
                                <p>Wie wahrscheinlich ist es, dass Sie unseren Chatbot weiterempfehlen? (0-10)</p>
                                <input type="number" id="nps-score" min="0" max="10">
                                <button onclick="submitNps()">Absenden</button>
                            `;
                            chatBody.appendChild(npsSurvey);
                        }, 1000);
                        // Zeige Umfrage nach der Interaktion
                        setTimeout(() => {
                            const surveyForm = document.createElement("div");
                            surveyForm.innerHTML = `
                                <p>Wir würden gerne Ihr Feedback zum Bot hören!</p>
                                <label>Wie zufrieden sind Sie mit dem Bot? (1-5):</label>
                                <input type="number" id="survey-satisfaction" min="1" max="5"><br>
                                <label>Was gefällt Ihnen am besten?</label>
                                <textarea id="survey-best-feature"></textarea><br>
                                <label>Welche Schwierigkeiten hatten Sie?</label>
                                <textarea id="survey-difficulties"></textarea><br>
                                <label>Vorschläge zur Verbesserung:</label>
                                <textarea id="survey-suggestions"></textarea><br>
                                <button onclick="submitSurvey()">Absenden</button>
                            `;
                            chatBody.appendChild(surveyForm);
                        }, 1500);
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
                                    if (isFirstChunk) {
                                        hideLoadingAnimation();
                                        isFirstChunk = false;
                                    }
                                    buffer.push(data.content);
                                }
                                if (data.full_response) {
                                    fullMessage = data.full_response;
                                    fullMessage = fullMessage.replace(/\[suggestion_button:[^\]]+\]/g, "").trim();
                                    fullMessage = fullMessage.replace(/\[Ja, bitte stornieren\]/g, "").trim();
                                    messageEl.innerHTML = renderMarkdown(fullMessage.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>"));
                                    chatHistory.push({ sender: "bot", message: fullMessage });
                                    console.log(`DEBUG: Full response received: ${fullMessage}`);
                                    if (data.suggestion) {
                                        console.log("DEBUG: Suggestion received from server:", data.suggestion);
                                        pendingSuggestion = data.suggestion;
                                        showSuggestionButton(data.suggestion);
                                    } else {
                                        console.log("DEBUG: No suggestion found in response");
                                    }
                                }
                            } catch (e) {
                                console.error(`DEBUG: Error parsing chunk: ${line}, Error: ${e}`);
                            }
                        }
                    }
 
                    let currentText = fullMessage;
                    while (buffer.length > 0) {
                        const content = buffer.shift();
                        currentText += content;
                        const linkMatch = currentText.match(/\[([^\]]+)\]\(([^)]+)\)/);
                        if (linkMatch) {
                            const beforeLink = currentText.substring(0, linkMatch.index);
                            const linkText = `<a href="${linkMatch[2]}" target="_blank">${linkMatch[1]}</a>`;
                            const afterLink = currentText.substring(linkMatch.index + linkMatch[0].length);
                            currentText = beforeLink + linkText + afterLink;
                        }
                        currentText = renderMarkdown(currentText.replace(/\n\n/g, "<br><br>").replace(/\n/g, "<br>"));
                        messageEl.innerHTML = currentText;
                        chatBody.scrollTop = chatBody.scrollHeight;
                        await new Promise(resolve => setTimeout(resolve, 50));
                    }
                    fullMessage = currentText;
                }
            } else {
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
        const existingButton = document.querySelector(".suggestion-button");
        if (existingButton) {
            console.log("DEBUG: Removing existing suggestion button");
            existingButton.remove();
        }
        const button = document.createElement("button");
        button.textContent = suggestionText;
        button.className = "suggestion-button";
        button.onclick = () => {
            console.log("DEBUG: Suggestion button clicked:", suggestionText);
            addMessage(suggestionText, "user");
            chatHistory.push({ sender: "user", message: suggestionText });
            // Tracking-Event für suggestion_button_clicked
            trackEvent('suggestion_button_clicked', { suggestion: suggestionText });
            if (suggestionText === "Ja, erstelle ein Support Ticket") {
                // Tracking-Event für support_ticket_created
                trackEvent('support_ticket_created');
            }
            button.remove();
            pendingSuggestion = null;
            showLoadingAnimation();
            setTimeout(() => {
                fetchResponse(suggestionText);
            }, 2000);
        };
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

    // Funktion zum Senden der NPS-Bewertung
    window.submitNps = async () => {
        const npsScore = document.getElementById("nps-score").value;
        const userId = localStorage.getItem("userId");
        const { data, error } = await supabase
            .from('nps_scores')
            .insert([
                { user_id: userId, score: parseInt(npsScore) }
            ]);
        if (error) {
            console.error("DEBUG: Error submitting NPS score:", error);
        } else {
            console.log("DEBUG: NPS score submitted:", data);
            trackEvent('nps_submitted', { score: parseInt(npsScore) });
        }
        alert("Vielen Dank für Ihre Bewertung!");
        document.getElementById("nps-score").parentElement.remove();
    };

    // Funktion zum Senden der Umfrageantworten
    window.submitSurvey = async () => {
        const satisfaction = document.getElementById("survey-satisfaction").value;
        const bestFeature = document.getElementById("survey-best-feature").value;
        const difficulties = document.getElementById("survey-difficulties").value;
        const suggestions = document.getElementById("survey-suggestions").value;
        const userId = localStorage.getItem("userId");
        const { data, error } = await supabase
            .from('user_surveys')
            .insert([
                {
                    user_id: userId,
                    satisfaction: parseInt(satisfaction),
                    best_feature: bestFeature,
                    difficulties: difficulties,
                    suggestions: suggestions
                }
            ]);
        if (error) {
            console.error("DEBUG: Error submitting survey:", error);
        } else {
            console.log("DEBUG: Survey submitted:", data);
            trackEvent('survey_submitted', {
                satisfaction: parseInt(satisfaction),
                best_feature: bestFeature,
                difficulties: difficulties,
                suggestions: suggestions
            });
        }
        alert("Vielen Dank für Ihr Feedback!");
        document.getElementById("survey-satisfaction").parentElement.remove();
    };
});
