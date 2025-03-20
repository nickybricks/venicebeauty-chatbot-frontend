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
        fetch("https://ki-chatbot-13ko.onrender.com/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message })
        })
        .then(response => {
            if (!response.ok) throw new Error("Fehler beim Verbinden zum Bot");
            return response.json();
        })
        .then(data => {
            addMessage(data.response, "bot");
        })
        .catch(() => {
            addMessage("Leider ist etwas schiefgelaufen. Versuche es später erneut.", "bot");
        });
    }
});
