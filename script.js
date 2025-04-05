document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    let chatHistory = [];
    let selectedFiles = []; // Array zum Speichern der ausgewählten Dateien
    let baseText = ""; // Zum Speichern des Textes ohne Dateinamen

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
        if (e.key === "Enter") sendMessage();
    });

    chatInput.addEventListener("input", () => {
        // Speichere den Text ohne die Dateinamen
        const text = chatInput.value.split("(Dateien:")[0].trim();
        baseText = text;
        updateInputField(); // Aktualisiere das Eingabefeld mit den Dateinamen
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message || selectedFiles.length > 0) {
            let finalMessage = baseText;
            if (selectedFiles.length > 0) {
                // Wenn Dateien ausgewählt wurden, füge sie zur Nachricht hinzu
                const fileNames = selectedFiles.map(file => file.name).join(", ");
                finalMessage = baseText ? `${baseText} (Dateien: ${fileNames})` : `Dateien: ${fileNames}`;
                uploadFiles(selectedFiles, baseText); // Dateien hochladen
                selectedFiles = []; // Zurücksetzen der ausgewählten Dateien
                fileInput.value = ""; // Datei-Eingabefeld zurücksetzen
                baseText = ""; // Zurücksetzen des Basis-Textes
            } else {
                finalMessage = message; // Nur Text ohne Dateien
            }
            addMessage(finalMessage, "user");
            chatHistory.push({ sender: "user", message: finalMessage });
            chatInput.value = "";
            fetchResponse(finalMessage);
        }
    }

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const files = Array.from(e.target.files); // Konvertiere FileList in Array
        if (files.length > 0) {
            selectedFiles = [...selectedFiles, ...files]; // Füge neue Dateien zu den bereits ausgewählten hinzu
            updateInputField(); // Aktualisiere das Eingabefeld mit den Dateinamen
            chatInput.focus(); // Setze den Fokus auf das Eingabefeld
        }
    };

    function updateInputField() {
        // Zeige die Dateinamen im Eingabefeld an
        const fileNames = selectedFiles.map((file, index) => {
            return `<span class="file-name" data-index="${index}">${file.name}<span class="remove-file" onclick="removeFile(${index})"> ✕</span></span>`;
        }).join(", ");
        chatInput.value = selectedFiles.length > 0 ? `${baseText} (Dateien: ${fileNames})` : baseText;

        // Füge ein Skript hinzu, um die Entfern-Funktion zu handhaben
        const script = document.createElement("script");
        script.textContent = `
            function removeFile(index) {
                selectedFiles.splice(index, 1);
                updateInputField();
            }
        `;
        document.body.appendChild(script);
    }

    window.removeFile = (index) => {
        selectedFiles.splice(index, 1);
        updateInputField();
    };

    function uploadFiles(files, message) {
        const formData = new FormData();
        files.forEach((file, index) => {
            formData.append(`file${index}`, file); // Füge jede Datei mit einem eindeutigen Schlüssel hinzu
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
                console.log("Dateien erfolgreich hochgeladen:", data.filenames);
                // Zeige jede Datei als separate Nachricht im Chat
                data.filenames.forEach(filename => {
                    const fileMessage = `Datei hochgeladen: ${filename}`;
                    addMessage(fileMessage, "user");
                    chatHistory.push({ sender: "user", message: fileMessage });
                    fetchResponse(fileMessage);
                });
            } else {
                addMessage("Fehler beim Hochladen der Dateien.", "bot");
            }
        })
        .catch(() => {
            addMessage("Fehler bei der Verbindung zum Server.", "bot");
        });
    }

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        messageEl.innerHTML = text;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollTop + 1000;
    }

    function fetchResponse(message) {
        if (message.includes("@") && message.includes(".")) {
            localStorage.setItem("userEmail", message.trim());
        }

        fetch("https://ki-chatbot-13ko.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                email: localStorage.getItem("userEmail"),
                chatHistory: chatHistory
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            console.log("DEBUG: Received data:", data);
            addMessage(data.response, "bot");
            chatHistory.push({ sender: "bot", message: data.response });

            if (data.suggestion) {
                addSuggestionButton(data.suggestion);
            }
        })
        .catch(() => {
            addMessage("Fehler bei der Verbindung zum Bot.", "bot");
        });
    }

    function addSuggestionButton(suggestionText) {
        const button = document.createElement("button");
        button.textContent = suggestionText;
        button.className = "suggestion-button";
        button.onclick = () => {
            addMessage(suggestionText, "user");
            chatHistory.push({ sender: "user", message: suggestionText });
            button.remove();
            fetchResponse(suggestionText);
        };
        chatBody.appendChild(button);
        chatBody.scrollTop = chatBody.scrollTop + 1000;
    }
});
