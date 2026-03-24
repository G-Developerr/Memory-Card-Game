let fullDeck = [];
let cards = [];
let firstCard = null;
let secondCard = null;
let lockBoard = false;
let score = 0;
let moves = 0;
let matchedPairs = 0;
let timerId = null;
let secondsElapsed = 0;
let gameStarted = false;
let currentDifficulty = "easy";
let isPaused = false;
let streak = 0;
let canInteract = false;
let points = 0;
let hintUses = 2;
let legendaryShuffleTimer = null;

const DIFFICULTY_SETTINGS = {
    easy: { pairs: 6, columns: 4, rows: 3, label: "Easy", previewMs: 1400 },
    medium: { pairs: 8, columns: 4, rows: 4, label: "Medium", previewMs: 1200 },
    hard: { pairs: 9, columns: 6, rows: 3, label: "Hard", previewMs: 900 },
    legendary: { pairs: 9, columns: 6, rows: 3, label: "Legendary", previewMs: 700 }
};

const gridContainer = document.querySelector(".grid-container");
const scoreEl = document.querySelector(".score");
const totalPairsEl = document.querySelector(".total-pairs");
const movesEl = document.querySelector(".moves");
const timerEl = document.querySelector(".timer");
const bestScoreEl = document.querySelector(".best-score");
const difficultyLabelEl = document.querySelector(".difficulty-label");
const winMessageEl = document.querySelector(".win-message");
const streakEl = document.querySelector(".streak");
const pauseBtn = document.querySelector(".pause-btn");
const hintBtn = document.querySelector(".hint-btn");
const progressBarEl = document.querySelector(".progress-bar");
const pointsEl = document.querySelector(".points");

fetch("./data/cards.json")
    .then((res) => res.json())
    .then((data) => {
        fullDeck = data;
        startNewGame();
    });

function startNewGame() {
    const settings = DIFFICULTY_SETTINGS[currentDifficulty];
    const selectedCards = [...fullDeck].slice(0, settings.pairs);
    cards = [...selectedCards, ...selectedCards];

    applyGridLayout(settings.columns, settings.rows);
    resetStats(settings.pairs);
    shuffleCards();
    renderCards();
    runStartPreview();
    applyLegendaryMode();
}

function applyGridLayout(columns, rows) {
    gridContainer.style.gridTemplateColumns = `repeat(${columns}, minmax(90px, 140px))`;
    gridContainer.style.gridTemplateRows = `repeat(${rows}, calc(140px / 2 * 3))`;
}

function resetStats(totalPairs) {
    stopTimer();
    stopLegendaryMode();
    secondsElapsed = 0;
    gameStarted = false;
    score = 0;
    moves = 0;
    matchedPairs = 0;
    firstCard = null;
    secondCard = null;
    lockBoard = false;
    isPaused = false;
    streak = 0;
    canInteract = false;
    points = 0;
    hintUses = 2;

    scoreEl.textContent = "0";
    totalPairsEl.textContent = String(totalPairs);
    movesEl.textContent = "0";
    timerEl.textContent = "00:00";
    difficultyLabelEl.textContent = DIFFICULTY_SETTINGS[currentDifficulty].label;
    winMessageEl.textContent = "";
    streakEl.textContent = "0";
    pointsEl.textContent = "0";
    progressBarEl.style.width = "0%";
    pauseBtn.textContent = "Pause";
    hintBtn.textContent = `Hint (${hintUses})`;
    hintBtn.disabled = false;
    updateBestScoreDisplay();
}

function shuffleCards() {
    let currentIndex = cards.length;
    while (currentIndex !== 0) {
        const randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
        const temp = cards[currentIndex];
        cards[currentIndex] = cards[randomIndex];
        cards[randomIndex] = temp;
    }
}

function renderCards() {
    gridContainer.innerHTML = "";
    for (const card of cards) {
        const cardElement = document.createElement("div");
        cardElement.classList.add("card");
        cardElement.setAttribute("data-name", card.name);
        cardElement.innerHTML = `
        <div class="front">
            <img class="front-image" src="${card.image}" alt="${card.name}" />
        </div>
        <div class="back"></div>
        `;
        gridContainer.appendChild(cardElement);
        cardElement.addEventListener("click", flipCard);
    }
}

function flipCard() {
    if (!canInteract || isPaused || lockBoard) return;
    if (this === firstCard || this.classList.contains("matched")) return;

    if (!gameStarted) {
        gameStarted = true;
        startTimer();
    }

    this.classList.add("flipped");

    if (!firstCard) {
        firstCard = this;
        return;
    }

    secondCard = this;
    lockBoard = true;
    moves += 1;
    movesEl.textContent = String(moves);
    checkForMatch();
}

function checkForMatch() {
    const isMatch = firstCard.dataset.name === secondCard.dataset.name;
    if (isMatch) {
        disableCards();
    } else {
        unflipCards();
    }
}

function disableCards() {
    firstCard.classList.add("matched");
    secondCard.classList.add("matched");
    firstCard.removeEventListener("click", flipCard);
    secondCard.removeEventListener("click", flipCard);

    score += 1;
    matchedPairs += 1;
    streak += 1;
    points += 100 + Math.max(0, streak - 1) * 25;

    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    pointsEl.textContent = String(points);
    updateProgressBar();
    resetBoard();
    checkGameCompleted();
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        streak = 0;
        streakEl.textContent = "0";
        if (currentDifficulty === "legendary") {
            points = Math.max(0, points - 15);
            pointsEl.textContent = String(points);
            shuffleUnmatchedCards();
        }
        resetBoard();
    }, 800);
}

function resetBoard() {
    firstCard = null;
    secondCard = null;
    lockBoard = false;
}

function startTimer() {
    stopTimer();
    timerId = setInterval(() => {
        secondsElapsed += 1;
        timerEl.textContent = formatTime(secondsElapsed);
    }, 1000);
}

function stopTimer() {
    if (timerId) {
        clearInterval(timerId);
        timerId = null;
    }
}

function formatTime(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function getBestScoreKey() {
    return `memory_best_${currentDifficulty}`;
}

function updateBestScoreDisplay() {
    const stored = localStorage.getItem(getBestScoreKey());
    if (!stored) {
        bestScoreEl.textContent = "-";
        return;
    }
    const parsed = JSON.parse(stored);
    bestScoreEl.textContent = `${parsed.points ?? 0} pts | ${parsed.moves} moves | ${parsed.time}`;
}

function checkGameCompleted() {
    const totalPairs = DIFFICULTY_SETTINGS[currentDifficulty].pairs;
    if (matchedPairs !== totalPairs) return;

    stopTimer();
    stopLegendaryMode();
    const resultText = `${moves} moves - ${formatTime(secondsElapsed)} - ${points} pts`;
    const bestKey = getBestScoreKey();
    const previousBest = localStorage.getItem(bestKey);
    const isBetterResult = (() => {
        if (!previousBest) return true;
        const parsed = JSON.parse(previousBest);
        if (points > (parsed.points ?? 0)) return true;
        if (points === (parsed.points ?? 0) && moves < parsed.moves) return true;
        if (points === (parsed.points ?? 0) && moves === parsed.moves && secondsElapsed < parsed.seconds) return true;
        return false;
    })();

    if (isBetterResult) {
        localStorage.setItem(bestKey, JSON.stringify({
            moves,
            seconds: secondsElapsed,
            time: formatTime(secondsElapsed),
            points
        }));
    }
    updateBestScoreDisplay();
    winMessageEl.textContent = `Victory! ${resultText}`;
    canInteract = false;
}

function restart() {
    startNewGame();
}

function changeDifficulty(value) {
    if (!DIFFICULTY_SETTINGS[value]) return;
    currentDifficulty = value;
    startNewGame();
}

function updateProgressBar() {
    const totalPairs = DIFFICULTY_SETTINGS[currentDifficulty].pairs;
    const progress = (matchedPairs / totalPairs) * 100;
    progressBarEl.style.width = `${Math.min(progress, 100)}%`;
}

function runStartPreview() {
    const allCards = [...document.querySelectorAll(".card")];
    allCards.forEach((card) => card.classList.add("flipped"));
    const previewMs = DIFFICULTY_SETTINGS[currentDifficulty].previewMs ?? 1200;

    setTimeout(() => {
        allCards.forEach((card) => card.classList.remove("flipped"));
        canInteract = true;
    }, previewMs);
}

function togglePause() {
    if (!canInteract) return;
    isPaused = !isPaused;

    if (isPaused) {
        stopTimer();
        stopLegendaryMode();
        gridContainer.classList.add("paused");
        pauseBtn.textContent = "Resume";
        return;
    }

    if (gameStarted) {
        startTimer();
        applyLegendaryMode();
    }
    gridContainer.classList.remove("paused");
    pauseBtn.textContent = "Pause";
}

function useHint() {
    if (!canInteract || isPaused || hintUses <= 0 || lockBoard) return;
    hintUses -= 1;
    hintBtn.textContent = `Hint (${hintUses})`;
    if (hintUses === 0) hintBtn.disabled = true;

    const unmatched = [...document.querySelectorAll(".card:not(.matched)")];
    unmatched.forEach((card) => card.classList.add("flipped"));
    canInteract = false;

    setTimeout(() => {
        unmatched.forEach((card) => {
            if (!card.classList.contains("matched")) card.classList.remove("flipped");
        });
        canInteract = true;
    }, 800);

    points = Math.max(0, points - 30);
    pointsEl.textContent = String(points);
}

function shuffleUnmatchedCards() {
    const unmatched = [...document.querySelectorAll(".card:not(.matched)")];
    const names = unmatched.map((card) => card.dataset.name);
    for (let i = names.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = names[i];
        names[i] = names[j];
        names[j] = temp;
    }
    unmatched.forEach((card, index) => {
        card.dataset.name = names[index];
    });
}

function applyLegendaryMode() {
    stopLegendaryMode();
    if (currentDifficulty !== "legendary") return;
    legendaryShuffleTimer = setInterval(() => {
        if (!canInteract || isPaused || lockBoard) return;
        shuffleUnmatchedCards();
        points = Math.max(0, points - 10);
        pointsEl.textContent = String(points);
        winMessageEl.textContent = "Legendary chaos: board shuffled!";
        setTimeout(() => {
            if (matchedPairs !== DIFFICULTY_SETTINGS[currentDifficulty].pairs) {
                winMessageEl.textContent = "";
            }
        }, 900);
    }, 20000);
}

function stopLegendaryMode() {
    if (legendaryShuffleTimer) {
        clearInterval(legendaryShuffleTimer);
        legendaryShuffleTimer = null;
    }
}