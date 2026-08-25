// Word/phrase banks for the prayer builder.
const WORD_BANKS = {
  gratitude: [
    "my family", "my friends", "my home", "food to eat", "this beautiful day",
    "my teacher", "my pets", "the scriptures", "my health", "the Holy Ghost",
    "my church", "warm clothes", "kind neighbors", "school", "toys to play with",
    "sunshine", "rain", "music", "books", "Jesus Christ",
  ],
  request: [
    "my family", "my friends", "those who are sick", "missionaries", "my teacher",
    "people who are sad", "safety today", "help to be kind", "my pets",
    "those who are lonely", "help with my homework", "peace in the world",
    "my grandparents", "help to make good choices", "those who need food",
    "help to be brave", "my church leaders", "help to forgive others",
  ],
};

const state = {
  gratitude: [],
  request: [],
};

function createWordChip(word, section) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "word-chip";
  chip.textContent = word;
  chip.draggable = true;
  chip.dataset.word = word;
  chip.dataset.section = section;

  chip.addEventListener("click", () => addWord(section, word));

  chip.addEventListener("dragstart", (event) => {
    event.dataTransfer.setData("text/plain", JSON.stringify({ word, section }));
    event.dataTransfer.setData(`application/x-prayer-section-${section}`, word);
  });

  return chip;
}

function renderWordBank(section) {
  const bank = document.getElementById(`${section}-bank`);
  bank.innerHTML = "";
  WORD_BANKS[section].forEach((word) => {
    const chip = createWordChip(word, section);
    if (state[section].includes(word)) {
      chip.classList.add("selected");
      chip.disabled = true;
    }
    bank.appendChild(chip);
  });
}

function createChosenChip(word, section) {
  const chip = document.createElement("button");
  chip.type = "button";
  chip.className = "chosen-word";
  chip.innerHTML = `<span>${word}</span><span class="remove" aria-hidden="true">&times;</span>`;
  chip.setAttribute("aria-label", `Remove ${word}`);
  chip.addEventListener("click", () => removeWord(section, word));
  return chip;
}

function renderChosenWords(section) {
  const container = document.getElementById(`${section}-chosen`);
  container.innerHTML = "";
  state[section].forEach((word) => {
    container.appendChild(createChosenChip(word, section));
  });
}

function addWord(section, word) {
  if (state[section].includes(word)) return;
  state[section].push(word);
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function removeWord(section, word) {
  state[section] = state[section].filter((w) => w !== word);
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function clearSection(section) {
  state[section] = [];
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function pickRandomWords(section, count = 3) {
  const available = WORD_BANKS[section].filter((w) => !state[section].includes(w));
  const shuffled = shuffle(available);
  const picks = shuffled.slice(0, Math.min(count, available.length));
  picks.forEach((word) => addWord(section, word));
}

function joinWords(words) {
  if (words.length === 0) return "";
  if (words.length === 1) return words[0];
  if (words.length === 2) return `${words[0]} and ${words[1]}`;
  return `${words.slice(0, -1).join(", ")}, and ${words[words.length - 1]}`;
}

function updatePrayerOutput() {
  const output = document.getElementById("prayer-output");
  const gratitude = state.gratitude;
  const request = state.request;

  let text = "Dear Heavenly Father, ";
  text += gratitude.length
    ? `I am thankful for ${joinWords(gratitude)}. `
    : "";
  text += request.length
    ? `Please bless ${joinWords(request)}. `
    : "";
  text += "In the name of Jesus Christ, amen.";

  output.textContent = text;
}

function setupDropzone(section) {
  const zone = document.getElementById(`${section}-chosen`);
  const acceptedType = `application/x-prayer-section-${section}`;

  const isAcceptable = (event) => event.dataTransfer.types.includes(acceptedType);

  zone.addEventListener("dragover", (event) => {
    if (!isAcceptable(event)) return;
    event.preventDefault();
    zone.classList.add("drag-over");
  });

  zone.addEventListener("dragleave", () => {
    zone.classList.remove("drag-over");
  });

  zone.addEventListener("drop", (event) => {
    if (!isAcceptable(event)) return;
    event.preventDefault();
    zone.classList.remove("drag-over");
    const data = event.dataTransfer.getData("text/plain");
    if (!data) return;
    try {
      const { word, section: fromSection } = JSON.parse(data);
      if (fromSection === section) {
        addWord(section, word);
      }
    } catch (err) {
      // ignore malformed drag data
    }
  });
}

function setupControls() {
  document.querySelectorAll(".random-btn").forEach((btn) => {
    btn.addEventListener("click", () => pickRandomWords(btn.dataset.target));
  });
  document.querySelectorAll(".clear-btn").forEach((btn) => {
    btn.addEventListener("click", () => clearSection(btn.dataset.target));
  });
}

function init() {
  renderWordBank("gratitude");
  renderWordBank("request");
  renderChosenWords("gratitude");
  renderChosenWords("request");
  setupDropzone("gratitude");
  setupDropzone("request");
  setupControls();
  updatePrayerOutput();
}

document.addEventListener("DOMContentLoaded", init);
