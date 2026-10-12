
const promptBox = document.getElementById("prompt");
const sendButton = document.getElementById("send");
const welcome = document.getElementById("welcome");
const conversation = document.getElementById("conversation");
const connection = document.getElementById("connection");
const voiceToggle = document.getElementById("voice-toggle");
const voiceLabel = document.getElementById("voice-label");
const voiceIcon = document.getElementById("voice-icon");
const stopButton = document.getElementById("stop-speaking");
const notice = document.getElementById("notice");

let voiceEnabled = true;
let selectedVoice = null;

function updateConnection() {
  connection.textContent = navigator.onLine
    ? "Workspace ready"
    : "Offline";
}

window.addEventListener("online", updateConnection);
window.addEventListener("offline", updateConnection);
updateConnection();

/*
 * Voice selection:
 * Browser voice names vary across Android devices.
 * Prefer a likely feminine English voice, then fall back
 * to an available English voice.
 */
function chooseVoice() {
  if (!("speechSynthesis" in window)) {
    selectedVoice = null;
    voiceLabel.textContent = "Voice unavailable";
    voiceToggle.disabled = true;
    return;
  }

  const voices = window.speechSynthesis.getVoices();

  const englishVoices = voices.filter((voice) =>
    /^en([-_]|$)/i.test(voice.lang)
  );

  const preferredNames = [
    "samantha",
    "aria",
    "jenny",
    "zira",
    "female",
    "google uk english female",
    "google us english"
  ];

  selectedVoice =
    englishVoices.find((voice) => {
      const name = voice.name.toLowerCase();
      return preferredNames.some((preferred) =>
        name.includes(preferred)
      );
    }) ||
    englishVoices.find((voice) =>
      /^en[-_]in$/i.test(voice.lang)
    ) ||
    englishVoices[0] ||
    null;

  voiceToggle.disabled = !selectedVoice;
  voiceLabel.textContent = selectedVoice
    ? (voiceEnabled ? "Voice on" : "Voice off")
    : "Voice unavailable";
  voiceIcon.textContent = voiceEnabled ? "♫" : "♪";
  voiceToggle.setAttribute("aria-pressed", String(voiceEnabled));
}

if ("speechSynthesis" in window) {
  chooseVoice();
  window.speechSynthesis.onvoiceschanged = chooseVoice;
} else {
  chooseVoice();
}

function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
  }
  stopButton.hidden = true;
}

function speak(text) {
  if (
    !voiceEnabled ||
    !("speechSynthesis" in window) ||
    !selectedVoice
  ) {
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.voice = selectedVoice;
  utterance.lang = selectedVoice.lang;

  // Gentle starting settings; actual voice quality depends
  // on the voice engine installed on the device.
  utterance.rate = 0.90;
  utterance.pitch = 1.08;
  utterance.volume = 0.85;

  utterance.onstart = () => {
    stopButton.hidden = false;
  };

  utterance.onend = () => {
    stopButton.hidden = true;
  };

  utterance.onerror = () => {
    stopButton.hidden = true;
    notice.textContent =
      "Voice playback could not start. Check your device's speech settings.";
  };

  window.speechSynthesis.speak(utterance);
}

voiceToggle.addEventListener("click", () => {
  voiceEnabled = !voiceEnabled;

  if (!voiceEnabled) {
    stopSpeaking();
  }

  chooseVoice();
});

stopButton.addEventListener("click", stopSpeaking);

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    promptBox.value = button.dataset.prompt;
    promptBox.focus();
  });
});

function addMessage(role, label, text) {
  const message = document.createElement("article");
  message.className = `message ${role}`;

  const title = document.createElement("span");
  title.className = "message-label";
  title.textContent = label;

  const body = document.createElement("div");
  body.className = "message-text";
  body.textContent = text;

  message.append(title, body);

  if (role === "assistant") {
    const tools = document.createElement("div");
    tools.className = "message-tools";

    const speakButton = document.createElement("button");
    speakButton.type = "button";
    speakButton.className = "speak-button";
    speakButton.textContent = "♫ Listen";
    speakButton.addEventListener("click", () => speak(text));

    tools.appendChild(speakButton);
    message.appendChild(tools);
  }

  conversation.appendChild(message);
  return message;
}

function sendMessage() {
  const text = promptBox.value.trim();

  if (!text) {
    promptBox.focus();
    return;
  }

  stopSpeaking();

  welcome.hidden = true;
  conversation.hidden = false;

  addMessage("user", "YOU", text);

  const response =
    "Your message has been received. Champu's conversation engine " +
    "has not been connected yet. That is our next development stage.";

  addMessage("assistant", "CHAMPU", response);

  promptBox.value = "";
  notice.textContent =
    "Interface ready · AI services will be connected in a later stage.";

  conversation.scrollIntoView({
    behavior: "smooth",
    block: "end"
  });

  if (voiceEnabled) {
    speak(response);
  }

  promptBox.focus();
}

sendButton.addEventListener("click", sendMessage);

promptBox.addEventListener("keydown", (event) => {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    sendMessage();
  }
});

if ("serviceWorker" in navigator &&
    location.protocol === "https:") {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js")
      .catch((error) => {
        console.error("Offline support registration failed:", error);
      });
  });
}

