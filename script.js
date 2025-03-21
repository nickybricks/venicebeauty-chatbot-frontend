document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    const voiceBtn = document.getElementById("voice-btn");

    chatToggle.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === "none" || !chatWindow.style.display ? "flex" : "none";
    };

    function sendMessage() {
        const userMessage = chatInput.value.trim();
        if (userMessage) {
            addMessage(userMessage, "user");
            chatInput.value = "";
            fetchResponse(userMessage);
        }
    }

    chatInput.addEventListener("keypress", e => {
        if (e.key === "Enter") sendMessage();
    });

    sendBtn.onclick = sendMessage;

    uploadBtn.onclick = () => fileInput.click();
    fileInput.onchange = e => {
        const file = e.target.files[0];
        if (file) {
            addMessage(`Datei hochgeladen: ${file.name}`, "user");
            // Upload-Logik auf Serverseite nötig!
        }
    };

    voiceBtn.onclick = () => {
        const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
        recognition.lang = "de-DE";
        recognition.start();
        recognition.onresult = e => {
            const voiceMessage = e.results[0][0].transcript;
            addMessage(voiceMessage, "user");
            fetchResponse(voiceMessage);
        };
    };

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        messageEl.textContent = text;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
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
                email: localStorage.getItem("userEmail")
            }),
        })
        .then(res => res.json())
        .then(data => addMessage(data.response, "bot"))
        .catch(error => {
            console.error("Fehler:", error);
            addMessage("Verbindungsfehler zum Bot.", "bot");
        });
    }
});
