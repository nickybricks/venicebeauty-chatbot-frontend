document.addEventListener("DOMContentLoaded", () => {
    const chatToggle = document.getElementById("chat-toggle");
    const chatWindow = document.getElementById("chat-window");
    const chatBody = document.getElementById("chat-body");
    const chatInput = document.getElementById("chat-input");
  
    chatToggle.onclick = () => {
      chatWindow.style.display = chatWindow.style.display === "none" ? "flex" : "none";
    };
  
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter" && chatInput.value.trim() !== "") {
        const userMessage = chatInput.value.trim();
        addMessage(userMessage, "user");
        chatInput.value = "";
        fetchResponse(userMessage);
      }
    });
  
    function addMessage(text, sender) {
      const messageEl = document.createElement("div");
      messageEl.textContent = text;
      messageEl.style.padding = "8px";
      messageEl.style.margin = "6px";
      messageEl.style.borderRadius = "8px";
      messageEl.style.background = sender === "user" ? "#007aff" : "#e5e5ea";
      messageEl.style.color = sender === "user" ? "#fff" : "#000";
      messageEl.style.alignSelf = sender === "user" ? "flex-end" : "flex-start";
      chatBody.appendChild(messageEl);
      chatBody.scrollTop = chatBody.scrollHeight;
    }
  
    function fetchResponse(message) {
      fetch("https://ki-chatbot-13ko.onrender.com/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message })
      })
      .then(res => res.json())
      .then(data => {
        addMessage(data.response, "bot");
      })
      .catch(() => {
        addMessage("Etwas ist schief gelaufen, bitte versuche es erneut.", "bot");
      });
    }
  });
  