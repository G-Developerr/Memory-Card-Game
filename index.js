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
let currentStage = 1;
let maxUnlockedStage = 1;
let lives = 3;
let multiplier = 1;
let heroMode = false;
let heroModeTimer = null;
let isGameOverState = false;

const DIFFICULTY_SETTINGS = {
    easy: { pairs: 6, columns: 4, rows: 3, label: "Easy", previewMs: 1400 },
    medium: { pairs: 8, columns: 4, rows: 4, label: "Medium", previewMs: 1200 },
    hard: { pairs: 9, columns: 6, rows: 3, label: "Hard", previewMs: 900 },
    legendary: { pairs: 9, columns: 6, rows: 3, label: "Legendary", previewMs: 700 }
};

const STAGES = [
    { stage: 1, previewPenalty: 0, hintCount: 2, reward: "S.H.I.E.L.D. Rookie" },
    { stage: 2, previewPenalty: 80, hintCount: 2, reward: "Arc Reactor Spark" },
    { stage: 3, previewPenalty: 120, hintCount: 2, reward: "Vibranium Token" },
    { stage: 4, previewPenalty: 160, hintCount: 2, reward: "Infinity Echo" },
    { stage: 5, previewPenalty: 200, hintCount: 1, reward: "Asgard Medal" },
    { stage: 6, previewPenalty: 240, hintCount: 1, reward: "Wakanda Crest" },
    { stage: 7, previewPenalty: 300, hintCount: 1, reward: "Mystic Sigil" },
    { stage: 8, previewPenalty: 360, hintCount: 1, reward: "Avenger Elite" },
    { stage: 9, previewPenalty: 440, hintCount: 1, reward: "Reality Shard" },
    { stage: 10, previewPenalty: 520, hintCount: 0, reward: "Infinity Champion" }
];

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
const stageEl = document.querySelector(".stage-label");
const rewardsCountEl = document.querySelector(".rewards-count");
const stageModalEl = document.querySelector(".stage-modal");
const stageSummaryEl = document.querySelector(".stage-summary");
const rewardSummaryEl = document.querySelector(".reward-summary");
const livesEl = document.querySelector(".lives");
const multiplierEl = document.querySelector(".multiplier");
const heroBtn = document.querySelector(".hero-btn");

fetch("./data/cards.json")
    .then((res) => res.json())
    .then((data) => {
        fullDeck = data;
        loadStageProgress();
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
    hintUses = getCurrentStageConfig().hintCount;
    lives = 3;
    multiplier = 1;
    heroMode = false;
    stopHeroMode();
    isGameOverState = false;

    scoreEl.textContent = "0";
    totalPairsEl.textContent = String(totalPairs);
    movesEl.textContent = "0";
    timerEl.textContent = "00:00";
    difficultyLabelEl.textContent = DIFFICULTY_SETTINGS[currentDifficulty].label;
    stageEl.textContent = String(currentStage);
    winMessageEl.textContent = "";
    streakEl.textContent = "0";
    pointsEl.textContent = "0";
    livesEl.textContent = String(lives);
    multiplierEl.textContent = "x1";
    progressBarEl.style.width = "0%";
    pauseBtn.textContent = "Pause";
    hintBtn.textContent = `Hint (${hintUses})`;
    hintBtn.disabled = hintUses === 0;
    heroBtn.disabled = false;
    heroBtn.textContent = "Hero Mode";
    rewardsCountEl.textContent = String(getRewards().length);
    hideStageModal();
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
    if (streak >= 3) multiplier = Math.min(5, multiplier + 1);
    points += (100 + Math.max(0, streak - 1) * 25) * multiplier;

    scoreEl.textContent = String(score);
    streakEl.textContent = String(streak);
    pointsEl.textContent = String(points);
    multiplierEl.textContent = `x${multiplier}`;
    updateProgressBar();
    resetBoard();
    checkGameCompleted();
}

function unflipCards() {
    setTimeout(() => {
        firstCard.classList.remove("flipped");
        secondCard.classList.remove("flipped");
        streak = 0;
        multiplier = 1;
        lives -= 1;
        streakEl.textContent = "0";
        multiplierEl.textContent = "x1";
        livesEl.textContent = String(Math.max(0, lives));
        if (lives <= 0) {
            handleGameOver();
            return;
        }
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
    stopHeroMode();
    heroMode = false;
    const stars = getStarsForStage();
    const resultText = `${moves} moves - ${formatTime(secondsElapsed)} - ${points} pts - ${stars} stars`;
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
    const reward = grantReward(stars);
    const hasNext = currentStage < STAGES.length;
    winMessageEl.textContent = `Victory! ${resultText}`;
    if (hasNext) {
        showStageModal(resultText, reward);
    } else {
        showStageModal(`${resultText} - Final Stage Cleared!`, reward, true);
    }
    canInteract = false;
}

function restart() {
    startNewGame();
}

function changeDifficulty(value) {
    if (!DIFFICULTY_SETTINGS[value]) return;
    currentDifficulty = value;
    loadStageProgress();
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
    const basePreview = DIFFICULTY_SETTINGS[currentDifficulty].previewMs ?? 1200;
    const previewMs = Math.max(350, basePreview - getCurrentStageConfig().previewPenalty);

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

function getStageTargets() {
    const pairBase = DIFFICULTY_SETTINGS[currentDifficulty].pairs;
    const targetMoves = pairBase + 4 + currentStage;
    const targetPoints = 450 + currentStage * 120 + pairBase * 50;
    return { targetMoves, targetPoints };
}

function getStarsForStage() {
    const { targetMoves, targetPoints } = getStageTargets();
    let stars = 1;
    if (moves <= targetMoves) stars += 1;
    if (points >= targetPoints) stars += 1;
    return stars;
}

function getCurrentStageConfig() {
    return STAGES[currentStage - 1];
}

function getProgressKey() {
    return `memory_progress_${currentDifficulty}`;
}

function getRewardsKey() {
    return `memory_rewards_${currentDifficulty}`;
}

function loadStageProgress() {
    const saved = Number(localStorage.getItem(getProgressKey()) || "1");
    maxUnlockedStage = Math.min(Math.max(saved, 1), STAGES.length);
    currentStage = maxUnlockedStage;
}

function getRewards() {
    const stored = localStorage.getItem(getRewardsKey());
    if (!stored) return [];
    try {
        return JSON.parse(stored);
    } catch {
        return [];
    }
}

function saveRewards(rewards) {
    localStorage.setItem(getRewardsKey(), JSON.stringify(rewards));
    rewardsCountEl.textContent = String(rewards.length);
}

function grantReward(stars) {
    const stageInfo = getCurrentStageConfig();
    const rewards = getRewards();
    const rewardId = `${currentDifficulty}_stage_${currentStage}`;
    if (!rewards.some((item) => item.id === rewardId)) {
        rewards.push({ id: rewardId, label: `${stageInfo.reward} (${stars} stars)` });
        saveRewards(rewards);
    }
    if (currentStage < STAGES.length) {
        maxUnlockedStage = Math.max(maxUnlockedStage, currentStage + 1);
        localStorage.setItem(getProgressKey(), String(maxUnlockedStage));
    }
    return stageInfo.reward;
}

function showStageModal(resultText, reward, isFinal = false) {
    stageSummaryEl.textContent = `Stage ${currentStage}: ${resultText}`;
    const targets = getStageTargets();
    rewardSummaryEl.textContent = `Reward: ${reward} | Targets: <= ${targets.targetMoves} moves & >= ${targets.targetPoints} pts`;
    const button = stageModalEl.querySelector("button");
    button.textContent = isFinal ? "Play Again" : "Next Stage";
    stageModalEl.classList.remove("hidden");
}

function hideStageModal() {
    stageModalEl.classList.add("hidden");
}

function nextStage() {
    if (isGameOverState) {
        isGameOverState = false;
        hideStageModal();
        startNewGame();
        return;
    }
    if (currentStage < STAGES.length) {
        currentStage += 1;
    } else {
        currentStage = 1;
    }
    hideStageModal();
    startNewGame();
}

function handleGameOver() {
    stopTimer();
    stopLegendaryMode();
    canInteract = false;
    winMessageEl.textContent = "Game Over! No lives left. Restart or use easier strategy.";
    isGameOverState = true;
    showStageModal("Game Over", "No reward unlocked");
    const button = stageModalEl.querySelector("button");
    button.textContent = "Retry Stage";
}

function activateHeroMode() {
    if (heroMode || !canInteract) return;
    if (points < 400) {
        winMessageEl.textContent = "Need 400 points to activate Hero Mode.";
        return;
    }
    points -= 400;
    pointsEl.textContent = String(points);
    heroMode = true;
    multiplier = 2;
    multiplierEl.textContent = "x2";
    heroBtn.disabled = true;
    heroBtn.textContent = "Hero Mode ON";
    winMessageEl.textContent = "Hero Mode activated for 10 seconds!";
    stopHeroMode();
    heroModeTimer = setTimeout(() => {
        heroMode = false;
        multiplier = 1;
        multiplierEl.textContent = "x1";
        heroBtn.disabled = false;
        heroBtn.textContent = "Hero Mode";
        if (!stageModalEl.classList.contains("hidden")) return;
        winMessageEl.textContent = "";
    }, 10000);
}

function stopHeroMode() {
    if (heroModeTimer) {
        clearTimeout(heroModeTimer);
        heroModeTimer = null;
    }
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