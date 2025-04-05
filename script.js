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
    let baseText = "";

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
        const text = chatInput.value.split("(Dateien:")[0].trim();
        baseText = text;
        updateInputField();
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message || selectedFiles.length > 0) {
            // Sende nur den Basis-Text, falls vorhanden
            if (baseText) {
                addMessage(baseText, "user");
                chatHistory.push({ sender: "user", message: baseText });
                fetchResponse(baseText);
            }
            if (selectedFiles.length > 0) {
                uploadFiles(selectedFiles, baseText);
            }
            selectedFiles = [];
            fileInput.value = "";
            baseText = "";
            chatInput.value = "";
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
        const fileNames = selectedFiles.map(file => file.name).join(", ");
        chatInput.value = selectedFiles.length > 0 ? `${baseText} (Dateien: ${fileNames})` : baseText;

        let fileList = document.getElementById("file-list");
        if (!fileList) {
            fileList = document.createElement("div");
            fileList.id = "file-list";
            fileList.style.position = "absolute";
            fileList.style.backgroundColor = "#fff";
            fileList.style.border = "1px solid #ddd";
            fileList.style.borderRadius = "5px";
            fileList.style.padding = "5px";
            fileList.style.boxShadow = "0 2px 4px rgba(0,0,0,0.1)";
            fileList.style.zIndex = "1000";
            fileList.style.display = "none";
            document.body.appendChild(fileList);
        }

        fileList.innerHTML = "";
        selectedFiles.forEach((file, index) => {
            const fileItem = document.createElement("div");
            fileItem.style.display = "flex";
            fileItem.style.alignItems = "center";
            fileItem.style.padding = "2px 5px";

            const fileName = document.createElement("span");
            fileName.textContent = file.name;
            fileName.style.marginRight = "5px";

            const removeBtn = document.createElement("button");
            removeBtn.textContent = "✕";
            removeBtn.style.backgroundColor = "transparent";
            removeBtn.style.border = "none";
            removeBtn.style.color = "red";
            removeBtn.style.cursor = "pointer";
            removeBtn.onclick = () => {
                selectedFiles.splice(index, 1);
                updateInputField();
                if (selectedFiles.length === 0) {
                    fileList.style.display = "none";
                }
            };

            fileItem.appendChild(fileName);
            fileItem.appendChild(removeBtn);
            fileList.appendChild(fileItem);
        });

        chatInput.onclick = () => {
            if (selectedFiles.length > 0) {
                const rect = chatInput.getBoundingClientRect();
                fileList.style.top = `${rect.top - fileList.offsetHeight - 5}px`;
                fileList.style.left = `${rect.left}px`;
                fileList.style.display = "block";
            } else {
                fileList.style.display = "none";
            }
        };

        document.addEventListener("click", (e) => {
            if (!fileList.contains(e.target) && e.target !== chatInput) {
                fileList.style.display = "none";
            }
        });
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
                console.log("Dateien erfolgreich hochgeladen:", data.filenames);
                data.filenames.forEach(filename => {
                    const fileMessage = `Datei hochgeladen: ${filename}`;
                    addMessage(fileMessage, "user");
                    chatHistory.push({ sender: "user", message: fileMessage });
                });
                // Sende nur eine fetchResponse-Anfrage nach dem Hochladen aller Dateien
                fetchResponse(`Datei hochgeladen: ${data.filenames[data.filenames.length - 1]}`);
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
            const emailMatch = message.match(/[\w\.-]+@[\w\.-]+\.\w+/);
            if (emailMatch) {
                localStorage.setItem("userEmail", emailMatch[0]);
            }
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
