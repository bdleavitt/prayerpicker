// Word/phrase banks for the prayer builder are loaded at runtime from
// word-bank.json so they can be edited independently of this script.
const WORD_BANK_URL = "word-bank.json";

let WORD_BANKS = {
  gratitude: [],
  request: [],
};

const PREVIEW_COUNT = 5;

const state = {
  gratitude: [],
  request: [],
};

const uiState = {
  gratitude: { expanded: false, search: "", preview: [] },
  request: { expanded: false, search: "", preview: [] },
};

function shuffle(array) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Simple fuzzy match: true if every character of `query` appears in `text`,
// in order, allowing gaps in between (a lightweight subsequence match).
function fuzzyMatch(query, text) {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return true;
  const normalizedText = text.toLowerCase();
  let searchIndex = 0;
  for (const char of normalizedQuery) {
    searchIndex = normalizedText.indexOf(char, searchIndex);
    if (searchIndex === -1) return false;
    searchIndex += 1;
  }
  return true;
}

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

function getVisibleWords(section) {
  const ui = uiState[section];
  if (!ui.expanded) {
    return ui.preview;
  }
  return WORD_BANKS[section].filter((word) => fuzzyMatch(ui.search, word));
}

function renderWordBank(section) {
  const bank = document.getElementById(`${section}-bank`);
  bank.innerHTML = "";
  const words = getVisibleWords(section);

  if (words.length === 0) {
    const empty = document.createElement("p");
    empty.className = "no-results";
    empty.textContent = "No words found. Try a different search.";
    bank.appendChild(empty);
    return;
  }

  words.forEach((word) => {
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
  const trimmed = word.trim();
  if (!trimmed) return;
  if (state[section].includes(trimmed)) return;
  state[section].push(trimmed);
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

function pickRandomWords(section, count = 3) {
  const available = WORD_BANKS[section].filter((w) => !state[section].includes(w));
  const shuffled = shuffle(available);
  const picks = shuffled.slice(0, Math.min(count, available.length));
  picks.forEach((word) => addWord(section, word));
}

function addCustomWord(section) {
  const input = document.getElementById(`${section}-custom-input`);
  if (!input) return;
  const trimmed = input.value.trim();
  if (!trimmed) return;

  if (!WORD_BANKS[section].includes(trimmed)) {
    WORD_BANKS[section].push(trimmed);
    if (!uiState[section].expanded) {
      uiState[section].preview.push(trimmed);
    }
  }

  addWord(section, trimmed);
  input.value = "";
  input.focus();
}

function toggleSection(section) {
  const ui = uiState[section];
  ui.expanded = !ui.expanded;
  ui.search = "";

  const searchInput = document.getElementById(`${section}-search`);
  if (searchInput) searchInput.value = "";

  const searchWrapper = document.getElementById(`${section}-search-wrapper`);
  if (searchWrapper) searchWrapper.hidden = !ui.expanded;

  const toggleBtn = document.querySelector(`.toggle-btn[data-target="${section}"]`);
  if (toggleBtn) {
    toggleBtn.textContent = ui.expanded ? "Show fewer words \u25B4" : "Show all words \u25BE";
    toggleBtn.setAttribute("aria-expanded", String(ui.expanded));
  }

  renderWordBank(section);
}

function updatePrayerOutput() {
  const list = document.getElementById("prayer-output");
  list.innerHTML = "";

  const lines = [];
  state.gratitude.forEach((word) => lines.push(`I am thankful for ${word}.`));
  state.request.forEach((word) => lines.push(`Please bless ${word}.`));

  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    list.appendChild(item);
  });
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
  document.querySelectorAll(".toggle-btn").forEach((btn) => {
    btn.addEventListener("click", () => toggleSection(btn.dataset.target));
  });
  document.querySelectorAll(".add-custom-btn").forEach((btn) => {
    btn.addEventListener("click", () => addCustomWord(btn.dataset.target));
  });
  document.querySelectorAll(".custom-input").forEach((input) => {
    input.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        event.preventDefault();
        addCustomWord(input.dataset.target);
      }
    });
  });
  document.querySelectorAll(".search-input").forEach((input) => {
    input.addEventListener("input", () => {
      const section = input.dataset.target;
      uiState[section].search = input.value;
      renderWordBank(section);
    });
  });
}

async function loadWordBanks() {
  try {
    const response = await fetch(WORD_BANK_URL);
    if (!response.ok) {
      throw new Error(`Failed to load ${WORD_BANK_URL}: ${response.status}`);
    }
    const data = await response.json();
    WORD_BANKS = {
      gratitude: Array.isArray(data.gratitude) ? data.gratitude : [],
      request: Array.isArray(data.request) ? data.request : [],
    };
  } catch (err) {
    console.error("Could not load word-bank.json; falling back to an empty word bank.", err);
    WORD_BANKS = { gratitude: [], request: [] };
  }
}

async function init() {
  await loadWordBanks();

  ["gratitude", "request"].forEach((section) => {
    uiState[section].preview = shuffle(WORD_BANKS[section]).slice(0, PREVIEW_COUNT);
  });

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

