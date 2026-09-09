// Word/phrase banks for the prayer builder are loaded at runtime from
// word-bank.json so they can be edited independently of this script.
const WORD_BANK_URL = "word-bank.json";
const DEFAULT_LANGUAGE = "en";
const SECTIONS = ["gratitude", "request"];

let currentLanguage = DEFAULT_LANGUAGE;
let WORD_BANKS = {
  en: { gratitude: [], request: [] },
  es: { gratitude: [], request: [] },
};

const PREVIEW_COUNT = 5;

const state = {
  en: { gratitude: [], request: [] },
  es: { gratitude: [], request: [] },
};

const uiState = {
  gratitude: { expanded: false, search: "", preview: [] },
  request: { expanded: false, search: "", preview: [] },
};

const translations = {
  en: {
    documentLanguage: "en",
    languageLabel: "Language",
    toggleLabel: "Español",
    subtitle: "Tap or drag words to build your prayer!",
    opening: "Dear Heavenly Father,",
    gratitudeHeading: "I am thankful for...",
    requestHeading: "Please bless...",
    closing: "In the name of Jesus Christ, amen.",
    myPrayer: "My Prayer",
    random: "🎲 Surprise me!",
    clear: "Clear",
    add: "Add",
    customPlaceholder: "Type your own...",
    searchPlaceholder: "🔍 Search words...",
    showAll: "Show all words ▾",
    showFewer: "Show fewer words ▴",
    noResults: "No words found. Try a different search.",
    gratitudeChosenLabel: "Chosen gratitude words",
    requestChosenLabel: "Chosen blessing words",
    gratitudeCustomLabel: "Type your own gratitude phrase",
    requestCustomLabel: "Type your own blessing phrase",
    gratitudeSearchLabel: "Search gratitude words",
    requestSearchLabel: "Search blessing words",
    emptyHint: "Tap or drag words here ↓",
    gratitudeLine: "I am thankful for",
    requestLine: "Please bless",
    removeLabel: "Remove",
  },
  es: {
    documentLanguage: "es",
    languageLabel: "Idioma",
    toggleLabel: "English",
    subtitle: "¡Toca o arrastra palabras para crear tu oración!",
    opening: "Querido Padre Celestial,",
    gratitudeHeading: "Estoy agradecido por...",
    requestHeading: "Por favor bendice a...",
    closing: "En el nombre de Jesucristo, amén.",
    myPrayer: "Mi oración",
    random: "🎲 ¡Sorpréndeme!",
    clear: "Borrar",
    add: "Agregar",
    customPlaceholder: "Escribe tu propia frase...",
    searchPlaceholder: "🔍 Buscar palabras...",
    showAll: "Mostrar todas las palabras ▾",
    showFewer: "Mostrar menos palabras ▴",
    noResults: "No se encontraron palabras. Prueba otra búsqueda.",
    gratitudeChosenLabel: "Frases de gratitud elegidas",
    requestChosenLabel: "Frases de bendición elegidas",
    gratitudeCustomLabel: "Escribe tu propia frase de gratitud",
    requestCustomLabel: "Escribe tu propia frase de bendición",
    gratitudeSearchLabel: "Busca palabras de gratitud",
    requestSearchLabel: "Busca palabras de bendición",
    emptyHint: "Toca o arrastra palabras aquí ↓",
    gratitudeLine: "Estoy agradecido por",
    requestLine: "Por favor bendice a",
    removeLabel: "Quitar",
  },
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

function text() {
  return translations[currentLanguage];
}

function getSelectedWords(section) {
  return state[currentLanguage][section];
}

function getWordBank(section) {
  return WORD_BANKS[currentLanguage][section];
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
  return getWordBank(section).filter((word) => fuzzyMatch(ui.search, word));
}

function renderWordBank(section) {
  const bank = document.getElementById(`${section}-bank`);
  bank.innerHTML = "";
  const words = getVisibleWords(section);

  if (words.length === 0) {
    const empty = document.createElement("p");
    empty.className = "no-results";
    empty.textContent = text().noResults;
    bank.appendChild(empty);
    return;
  }

  words.forEach((word) => {
    const chip = createWordChip(word, section);
    if (getSelectedWords(section).includes(word)) {
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

  const label = document.createElement("span");
  label.textContent = word;

  const remove = document.createElement("span");
  remove.className = "remove";
  remove.setAttribute("aria-hidden", "true");
  remove.textContent = "×";

  chip.append(label, remove);
  chip.setAttribute("aria-label", `${text().removeLabel} ${word}`);
  chip.addEventListener("click", () => removeWord(section, word));
  return chip;
}

function renderChosenWords(section) {
  const container = document.getElementById(`${section}-chosen`);
  container.innerHTML = "";
  container.dataset.emptyText = text().emptyHint;
  getSelectedWords(section).forEach((word) => {
    container.appendChild(createChosenChip(word, section));
  });
}

function addWord(section, word) {
  const trimmed = word.trim();
  const selected = getSelectedWords(section);
  if (!trimmed) return;
  if (selected.includes(trimmed)) return;
  selected.push(trimmed);
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function removeWord(section, word) {
  state[currentLanguage][section] = getSelectedWords(section).filter((w) => w !== word);
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function clearSection(section) {
  state[currentLanguage][section] = [];
  renderChosenWords(section);
  renderWordBank(section);
  updatePrayerOutput();
}

function pickRandomWords(section, count = 3) {
  const available = getWordBank(section).filter((w) => !getSelectedWords(section).includes(w));
  const shuffled = shuffle(available);
  const picks = shuffled.slice(0, Math.min(count, available.length));
  picks.forEach((word) => addWord(section, word));
}

function addCustomWord(section) {
  const input = document.getElementById(`${section}-custom-input`);
  if (!input) return;
  const trimmed = input.value.trim();
  if (!trimmed) return;

  const bank = getWordBank(section);
  if (!bank.includes(trimmed)) {
    bank.push(trimmed);
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

  updateSectionToggle(section);
  renderWordBank(section);
}

function updatePrayerOutput() {
  const list = document.getElementById("prayer-output");
  list.innerHTML = "";

  const lines = [];
  getSelectedWords("gratitude").forEach((word) => lines.push(`${text().gratitudeLine} ${word}.`));
  getSelectedWords("request").forEach((word) => lines.push(`${text().requestLine} ${word}.`));

  lines.forEach((line) => {
    const item = document.createElement("li");
    item.textContent = line;
    list.appendChild(item);
  });
}

function setupDropzone(section) {
  const zone = document.getElementById(`${section}-chosen`);
  const acceptedType = `application/x-prayer-section-${section}`;

  // DataTransfer.types can be a DOMStringList in some browsers, so copy it into
  // an array before checking for our custom MIME type.
  const isAcceptable = (event) =>
    Array.from(event.dataTransfer.types || []).includes(acceptedType);

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
  document.getElementById("language-toggle").addEventListener("click", switchLanguage);
}

function updateSectionToggle(section) {
  const toggleBtn = document.querySelector(`.toggle-btn[data-target="${section}"]`);
  if (toggleBtn) {
    toggleBtn.textContent = uiState[section].expanded ? text().showFewer : text().showAll;
    toggleBtn.setAttribute("aria-expanded", String(uiState[section].expanded));
  }
}

function initializePreviews() {
  SECTIONS.forEach((section) => {
    uiState[section].preview = shuffle(getWordBank(section)).slice(0, PREVIEW_COUNT);
  });
}

function renderLanguage() {
  document.documentElement.lang = text().documentLanguage;
  document.getElementById("language-label").textContent = text().languageLabel;
  const languageToggle = document.getElementById("language-toggle");
  languageToggle.textContent = text().toggleLabel;
  languageToggle.setAttribute("aria-pressed", String(currentLanguage === "es"));

  document.getElementById("app-subtitle").textContent = text().subtitle;
  document.getElementById("opening-heading").textContent = text().opening;
  document.getElementById("gratitude-heading").textContent = text().gratitudeHeading;
  document.getElementById("request-heading").textContent = text().requestHeading;
  document.getElementById("closing-heading").textContent = text().closing;
  document.getElementById("my-prayer-heading").textContent = text().myPrayer;
  document.getElementById("opening-line").textContent = text().opening;
  document.getElementById("closing-line").textContent = text().closing;

  document.querySelectorAll(".random-btn").forEach((btn) => {
    btn.textContent = text().random;
  });
  document.querySelectorAll(".clear-btn").forEach((btn) => {
    btn.textContent = text().clear;
  });
  document.querySelectorAll(".add-custom-btn").forEach((btn) => {
    btn.textContent = text().add;
  });
  document.querySelectorAll(".custom-input").forEach((input) => {
    input.placeholder = text().customPlaceholder;
  });
  document.querySelectorAll(".search-input").forEach((input) => {
    input.placeholder = text().searchPlaceholder;
  });
  document.getElementById("gratitude-chosen").setAttribute("aria-label", text().gratitudeChosenLabel);
  document.getElementById("request-chosen").setAttribute("aria-label", text().requestChosenLabel);
  document.getElementById("gratitude-custom-input").setAttribute("aria-label", text().gratitudeCustomLabel);
  document.getElementById("request-custom-input").setAttribute("aria-label", text().requestCustomLabel);
  document.getElementById("gratitude-search").setAttribute("aria-label", text().gratitudeSearchLabel);
  document.getElementById("request-search").setAttribute("aria-label", text().requestSearchLabel);

  SECTIONS.forEach((section) => {
    updateSectionToggle(section);
    renderChosenWords(section);
    renderWordBank(section);
  });
  updatePrayerOutput();
}

function switchLanguage() {
  currentLanguage = currentLanguage === "en" ? "es" : "en";
  SECTIONS.forEach((section) => {
    uiState[section].search = "";
    const searchInput = document.getElementById(`${section}-search`);
    if (searchInput) searchInput.value = "";
  });
  initializePreviews();
  renderLanguage();
}

function normalizeBank(data) {
  return {
    gratitude: Array.isArray(data?.gratitude) ? data.gratitude : [],
    request: Array.isArray(data?.request) ? data.request : [],
  };
}

async function loadWordBanks() {
  try {
    const response = await fetch(WORD_BANK_URL);
    if (!response.ok) {
      throw new Error(`Failed to load ${WORD_BANK_URL}: ${response.status}`);
    }
    const data = await response.json();
    WORD_BANKS = data.en || data.es
      ? { en: normalizeBank(data.en), es: normalizeBank(data.es) }
      : { en: normalizeBank(data), es: { gratitude: [], request: [] } };
  } catch (err) {
    console.error("Could not load word-bank.json; falling back to an empty word bank.", err);
    WORD_BANKS = {
      en: { gratitude: [], request: [] },
      es: { gratitude: [], request: [] },
    };
  }
}

async function init() {
  await loadWordBanks();
  initializePreviews();
  setupDropzone("gratitude");
  setupDropzone("request");
  setupControls();
  renderLanguage();
}

document.addEventListener("DOMContentLoaded", init);
