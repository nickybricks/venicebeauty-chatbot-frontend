document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");

    let uploadedFiles = []; // Liste für hochgeladene Dateien

    /** Öffnet & schließt den Chat */
    chatToggle.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === "none" || !chatWindow.style.display ? "flex" : "none";
        if (!chatBody.hasChildNodes()) {
            addMessage("Hallo! 👋 Wie kann ich dir heute helfen?", "bot");
        }
    };

    /** Nachricht senden */
    sendBtn.onclick = sendMessage;
    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage(message, "user");
            chatInput.value = "";
            fetchResponse(message);
        }
    }

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        messageEl.textContent = text;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    /** Datei auswählen */
    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            uploadedFiles.push(file);
            addMessage(`📎 Datei hinzugefügt: ${file.name}`, "user");
        }
    };

    /** Antwort vom Bot abrufen */
    function fetchResponse(message) {
        if (message.includes("@") && message.includes(".")) {
            localStorage.setItem("userEmail", message.trim());
        }

        const formData = new FormData();
        formData.append("message", message);
        formData.append("email", localStorage.getItem("userEmail") || "");

        // Falls Dateien hochgeladen wurden, füge sie der Anfrage hinzu
        uploadedFiles.forEach((file, index) => {
            formData.append(`file_${index}`, file);
        });

        fetch("https://ki-chatbot-13ko.onrender.com/chat", {
            method: "POST",
            body: formData
        })
        .then((res) => res.json())
        .then((data) => {
            addMessage(data.response, "bot");
            if (data.ticketCreated) {
                uploadedFiles = []; // Dateien nach Support-Ticket leeren
            }
        })
        .catch(() => {
            addMessage("Fehler bei der Verbindung zum Bot.", "bot");
        });
    }
});
