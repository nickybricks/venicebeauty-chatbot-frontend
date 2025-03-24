document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    let chatHistory = []; // Hier wird der gesamte Chatverlauf gespeichert

    chatToggle.onclick = () => {
        if (chatWindow.style.display === "none" || !chatWindow.style.display) {
            chatWindow.style.display = "flex";
            if (!chatBody.hasChildNodes()) {
                addMessage("Hallo! 👋 Wie kann ich dir helfen? Falls es um deine Bestellung geht, nenne bitte deine Bestellnummer oder deine E-Mail.", "bot");
            }
        } else {
            chatWindow.style.display = "none";
        }
    };

    sendBtn.onclick = sendMessage;

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    function sendMessage() {
        const message = chatInput.value.trim();
        if (message) {
            addMessage(message, "user");
            chatHistory.push({ sender: "user", message });
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

    uploadBtn.onclick = () => fileInput.click();

    fileInput.onchange = (e) => {
        const file = e.target.files[0];
        if (file) {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("email", localStorage.getItem("userEmail"));

            fetch("https://ki-chatbot-13ko.onrender.com/upload", {
                method: "POST",
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if(data.success) {
                    addMessage(`Datei hochgeladen: ${file.name}`, "user");
                    chatHistory.push({ sender: "user", message: `Datei hochgeladen: ${file.name}` });
                } else {
                    addMessage("Fehler beim Hochladen der Datei.", "bot");
                }
            })
            .catch(() => {
                addMessage("Fehler bei der Verbindung zum Server.", "bot");
            });
        }
    };

    function fetchResponse(message) {
        // Speichern der E-Mail, falls im Chat erwähnt
        if (message.includes("@") && message.includes(".")) {
            localStorage.setItem("userEmail", message.trim());
        }

        fetch("https://ki-chatbot-13ko.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: message,
                email: localStorage.getItem("userEmail"),
                chatHistory: chatHistory // Übergabe des bisherigen Chatverlaufs an das Backend
            }),
        })
        .then((res) => res.json())
        .then((data) => {
            addMessage(data.response, "bot");
            chatHistory.push({ sender: "bot", message: data.response });
        })
        .catch(() => {
            addMessage("Fehler bei der Verbindung zum Bot.", "bot");
        });
    }
});
