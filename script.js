document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");

    chatToggle.onclick = () => {
        chatWindow.style.display = chatWindow.style.display === "none" || !chatWindow.style.display ? "flex" : "none";
    };

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && chatInput.value.trim()) {
            const userMessage = chatInput.value.trim();
            addMessage(userMessage, "user");
            chatInput.value = "";
            fetchResponse(userMessage);
        }
    });

    function addMessage(text, sender) {
        const messageEl = document.createElement("div");
        messageEl.textContent = text;
        messageEl.className = sender === "user" ? "user-message" : "bot-message";
        chatBody.appendChild(messageEl);
        chatBody.scrollTop = chatBody.scrollHeight;
    }

    function fetchResponse(message) {
        // Checke, ob Nachricht eine E-Mail-Adresse enthält
        if (message.includes("@") && message.includes(".")) {
            localStorage.setItem("userEmail", message.trim());
        }

        fetch("https://ki-chatbot-13ko.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
                message: message,
                email: localStorage.getItem("userEmail") // E-Mail immer mitsenden, wenn gespeichert
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
