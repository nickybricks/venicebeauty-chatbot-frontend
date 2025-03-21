document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
    const sendBtn = document.getElementById("send-btn");
    const uploadBtn = document.getElementById("upload-btn");
    const fileInput = document.getElementById("file-input");
    const closeChat = document.getElementById("close-chat");
   

    chatToggle.onclick = () => {
        if (!chatWindow.classList.contains("open")) {
            chatWindow.classList.add("open");
    
            if (!chatBody.hasChildNodes()) {
                addMessage("Hallo! 👋 Wie kann ich dir heute helfen?", "bot");
            }
        } else {
            chatWindow.classList.remove("open");
        }
    };
    
    closeChat.onclick = () => {
        chatWindow.classList.remove("open");
    };
    

    sendBtn.onclick = sendMessage;

    chatInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendMessage();
    });

    chatInput.addEventListener("input", () => {
        if (chatInput.value.trim() !== "") {
            sendBtn.classList.add("active");
            sendBtn.classList.remove("disabled");
            sendBtn.disabled = false;
        } else {
            sendBtn.classList.remove("active");
            sendBtn.classList.add("disabled");
            sendBtn.disabled = true;
        }
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
        .catch(() => {
            addMessage("Fehler bei der Verbindung zum Bot.", "bot");
        });
    }
});
