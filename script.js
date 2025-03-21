document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");

    chatToggle.onclick = () => {
        if (chatWindow.style.display === "none" || !chatWindow.style.display) {
            chatWindow.style.display = "flex";
            if (!chatBody.hasChildNodes()) {
                addMessage("Hallo! 👋 Wie kann ich dir heute helfen?", "bot");
            }
        } else {
            chatWindow.style.display = "none";
        }
    };

    function sendMessage() {
        if (chatInput.value.trim()) {
            const userMessage = chatInput.value.trim();
            addMessage(userMessage, "user");
            chatInput.value = "";
            fetchResponse(userMessage);
        }
    }

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    sendBtn.addEventListener("click", sendMessage);

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
        .then((res) => res.json())
        .then((data) => {
            addMessage(data.response, "bot");
        })
        .catch((error) => {
            console.error("Fehler beim Abrufen der Antwort:", error);
            addMessage("Fehler bei der Verbindung zum Bot.", "bot");
        });
    }
});
