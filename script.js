(() => {
    if (!window.CUBE_ALGORITHM_VARIANTS) {
        throw new Error("Algorithm alternatives did not load. Check algorithm-variants.js.");
    }

    const faces = {
        U: { axis: "y", sign: 1, color: "#f3d54b" },
        D: { axis: "y", sign: -1, color: "#f0eee3" },
        R: { axis: "x", sign: 1, color: "#e34f42" },
        L: { axis: "x", sign: -1, color: "#ed8a43" },
        F: { axis: "z", sign: 1, color: "#49b878" },
        B: { axis: "z", sign: -1, color: "#4b83df" }
    };
    const normals = {
        U: [0, 1, 0], D: [0, -1, 0],
        R: [1, 0, 0], L: [-1, 0, 0],
        F: [0, 0, 1], B: [0, 0, -1]
    };
    const moveDefinitions = {
        U: { axis: "y", sign: 1, layers: [1], face: "U", label: "Up face" },
        D: { axis: "y", sign: -1, layers: [-1], face: "D", label: "Down face" },
        R: { axis: "x", sign: 1, layers: [1], face: "R", label: "Right face" },
        L: { axis: "x", sign: -1, layers: [-1], face: "L", label: "Left face" },
        F: { axis: "z", sign: 1, layers: [1], face: "F", label: "Front face" },
        B: { axis: "z", sign: -1, layers: [-1], face: "B", label: "Back face" },
        u: { axis: "y", sign: 1, layers: [0, 1], label: "Up wide turn", movesCenters: true },
        d: { axis: "y", sign: -1, layers: [-1, 0], label: "Down wide turn", movesCenters: true },
        r: { axis: "x", sign: 1, layers: [0, 1], label: "Right wide turn", movesCenters: true },
        l: { axis: "x", sign: -1, layers: [-1, 0], label: "Left wide turn", movesCenters: true },
        f: { axis: "z", sign: 1, layers: [0, 1], label: "Front wide turn", movesCenters: true },
        b: { axis: "z", sign: -1, layers: [-1, 0], label: "Back wide turn", movesCenters: true },
        M: { axis: "x", sign: -1, layers: [0], label: "Middle slice (like L)", movesCenters: true },
        E: { axis: "y", sign: -1, layers: [0], label: "Equator slice (like D)", movesCenters: true },
        S: { axis: "z", sign: 1, layers: [0], label: "Standing slice (like F)", movesCenters: true },
        x: { axis: "x", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like R)" },
        y: { axis: "y", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like U)" },
        z: { axis: "z", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like F)" }
    };
    function normalizeAlgorithm(sequence) {
        const tokens = sequence
            .replace(/[’′]/g, "'")
            .replace(/[()]/g, " ")
            .trim()
            .split(/\s+/)
            .filter(Boolean)
            .map(token => {
                const wideTurn = token.match(/^([URFDLB])w(2|')?$/i);
                if (wideTurn) token = `${wideTurn[1].toLowerCase()}${wideTurn[2] || ""}`;
                const threeQuarterTurn = token.match(/^([URFDLBurfdlbMESmesxyzIi])3$/);
                if (threeQuarterTurn) token = `${threeQuarterTurn[1]}'`;
                const alias = token.match(/^([IiEeMmSs])(2|'|²)?$/);
                if (alias) {
                    const base = alias[1].toLowerCase() === "i"
                        ? "l"
                        : alias[1].toUpperCase();
                    token = `${base}${alias[2] || ""}`;
                }
                return token;
            });
        return {
            moves: tokens.join(" "),
            invalidTokens: tokens.filter(token => !/^[URFDLBurfdlbMESxyz](?:2|')?$/.test(token))
        };
    }

    function getCaseSolutions(caseId) {
        const jPermSolutions = window.CUBE_ALGORITHM_VARIANTS[caseId];
        if (!Array.isArray(jPermSolutions) || jPermSolutions.length === 0) {
            throw new Error(`No J Perm algorithms were loaded for ${caseId}.`);
        }
        const solutions = [];
        const seenMoves = new Set();
        for (const solution of jPermSolutions) {
            const parsed = normalizeAlgorithm(solution.moves);
            if (parsed.invalidTokens.length > 0) {
                throw new Error(`Unsupported J Perm move notation for ${caseId}: ${parsed.invalidTokens.join(", ")}.`);
            }
            if (!parsed.moves) continue;
            const moves = caseId.startsWith("pll-") ? removeCubeRotations(parsed.moves) : parsed.moves;
            if (seenMoves.has(moves)) continue;
            seenMoves.add(moves);
            solutions.push({ moves });
        }
        if (solutions.length === 0) {
            throw new Error(`No usable J Perm algorithms were found for ${caseId}.`);
        }
        return solutions;
    }

    const ollCaseIds = Object.keys(window.CUBE_ALGORITHM_VARIANTS)
        .filter(caseId => caseId.startsWith("oll-"))
        .sort((left, right) => Number(left.slice(4)) - Number(right.slice(4)));
    const pllCaseNames = ["Aa", "Ab", "E", "F", "Ga", "Gb", "Gc", "Gd", "H", "Ja", "Jb", "Na", "Nb", "Ra", "Rb", "T", "Ua", "Ub", "V", "Y", "Z"];
    if (ollCaseIds.length !== 57) {
        throw new Error(`Expected 57 J Perm OLL cases, found ${ollCaseIds.length}.`);
    }

    const cases = [
        ...ollCaseIds.map((id, index) => ({
            id,
            category: "OLL",
            name: `OLL ${index + 1}`,
            kicker: `Orientation · case ${index + 1}`,
            description: "Orient the last layer while keeping the lower two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "Match the yellow-sticker pattern on the cube and keep yellow on top as you start the algorithm.",
            solutions: getCaseSolutions(id),
            sourceUrl: "https://jperm.net/algs/oll"
        })),
        ...pllCaseNames.map(name => ({
            id: `pll-${name.toLowerCase()}`,
            category: "PLL",
            name: `${name} Perm`,
            kicker: `Permutation · ${name}`,
            description: "Permute the last-layer pieces while keeping the first two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "The preview shows the top-layer permutation with the last layer oriented.",
            solutions: getCaseSolutions(`pll-${name.toLowerCase()}`),
            sourceUrl: "https://jperm.net/algs/pll"
        }))
    ];
    const cubeRoot = document.getElementById("cube-root");
    const cubeStage = document.querySelector(".cube-stage");
    const cubeOrbit = document.querySelector(".cube-orbit");
    const cubeStatus = document.getElementById("cube-status");
    const moveQueue = [];
    let busy = false;
    let activeCategory = "PLL";
    let selectedCase = null;
    let selectedAlgorithmIndex = 0;
    let activeAlgorithmSequence = "";
    let tutorialMoveTokens = [];
    let tutorialMoveIndex = 0;
    let tutorialHighlightSegments = [];
    let activeTutorialHighlight = null;
    let pendingCase = null;
    let pendingAlgorithmIndex = 0;
    let cubies = [];
    let casePermutationArrows = [];
    const casePreviewStates = new Map();
    const algorithmLearningStorageKey = "cube-club.algorithm-learning-status.v1";
    const beginnerSteps = [
        {
            id: "daisy",
            title: "Make the white daisy",
            shortTitle: "Daisy",
            description: "Put the four white edge stickers around the yellow center. Their side colors do not need to match the side centers yet; that is the next step.",
            tip: "A white sticker already facing up is a petal. Bring the other white stickers up too, even if the edge colors look out of line with the centers.",
            reference: {
                note: "The daisy is an optional warm-up; J Perm begins by building a white cross with its edge colors matched to the side centers.",
                url: "https://jperm.net/3x3",
                label: "J Perm: beginner method"
            }
        },
        {
            id: "white-cross",
            title: "Turn the daisy into a white cross",
            shortTitle: "White cross",
            description: "For each petal, turn the top until its side color matches the center on that side. Turn that matching face twice to send the white edge down beside the white center.",
            tip: "Keep the white center on the bottom. Match all four side colors with their centers; the white cross is only finished when both sides match. For the next step, Righty (R U R' U') and Lefty (L' U' L U) are corner-insertion algorithms, not cross moves.",
            reference: {
                note: "J Perm emphasizes matching both colors on each white edge and explains how to handle flipped or misplaced white edges. The displayed example moves depend on the setup.",
                moves: "F U' R U",
                url: "https://jperm.net/3x3",
                label: "J Perm: white cross"
            }
        },
        {
            id: "white-corners",
            title: "Solve the white corners",
            shortTitle: "White corners",
            description: "Insert the four white corners one at a time. A corner can be above its slot or in the bottom layer, and its white sticker can face up, down, or toward any side.",
            tip: "Keep the white cross on the bottom, with each edge color matched to its side center. Turn the top layer until a white corner's two other colors match the two side centers beside its slot. If the slot is at the back, rotate the whole cube to bring it to the front, then use Righty (R U R' U') or Lefty (L' U' L U).",
            reference: {
                note: "J Perm demonstrates right- and left-handed 4-move sequences for inserting first-layer corners. This practice cube shows those Righty and Lefty examples.",
                url: "https://jperm.net/3x3",
                label: "J Perm: first layer"
            }
        },
        {
            id: "middle-layer",
            title: "Solve the middle layer",
            shortTitle: "Middle layer",
            description: "Keep white on the bottom. Find a top-layer edge with neither white nor yellow and match its front sticker to the front center. The other sticker identifies its slot; an edge is solved only when both colors match their centers.",
            tip: "For the right slot, turn U, do Righty, rotate the whole cube to face the right side, do Lefty, then rotate back. For the left slot, turn U', do Lefty, rotate to face the left side, do Righty, then rotate back. These rotations replace the usual front-face turns.",
            reference: {
                note: "Cube.Academy says to match a top-layer edge to its center, then use the other color to choose its correct slot. This guide uses cube rotations between Righty and Lefty so both edge colors finish matched to their centers.",
                moves: "Right: U R U R' U' y L' U' L U y' · Left: U' L' U' L U y' R U R' U' y",
                url: "https://www.cube.academy/how-to-solve-a-rubiks-cube",
                label: "Cube.Academy: second layer"
            }
        },
        {
            id: "yellow-cross",
            title: "Make the yellow cross",
            shortTitle: "Yellow cross",
            description: "With yellow on top, use this pattern to change the yellow edge stickers. You may need to do it more than once, turning the top to line up the pattern between tries.",
            tip: "For a line, hold it horizontally. For an L, hold its yellow edges at the back and left. A dot usually needs multiple tries.",
            reference: {
                note: "J Perm's top-cross step uses the edge pattern to set up the sequence; repeat it as needed until all four top edges face up.",
                moves: "F R U R' U' F'",
                url: "https://jperm.net/3x3",
                label: "J Perm: top cross"
            }
        },
        {
            id: "yellow-edges",
            title: "Match the yellow cross edges",
            shortTitle: "Yellow edges",
            description: "With the yellow cross made, line up each yellow edge's side sticker with its matching center. The cube path is calculated for the current cube state.",
            tip: "The yellow stickers stay on top; now match the four side colors to the centers before working on the corners.",
            reference: {
                note: "J Perm's next step matches the side colors of the top cross with their centers before solving the corners.",
                moves: "R U R' U R U2 R' U",
                url: "https://jperm.net/3x3",
                label: "J Perm: match cross colors"
            }
        },
        {
            id: "place-corners",
            title: "Put the yellow corners in place",
            shortTitle: "Place corners",
            description: "Move each yellow corner into the slot with the same three colors. In this step, the yellow sticker does not need to face up yet.",
            tip: "If one corner is already in its correct slot, hold it at the front-right-top and cycle the others. If none are correct, do the cycle once to create a correctly placed corner.",
            reference: {
                note: "J Perm places each top-layer corner by checking that all three of its colors match the surrounding centers.",
                moves: "U R U' L' U R' U' L",
                url: "https://jperm.net/3x3",
                label: "J Perm: match corners"
            }
        },
        {
            id: "yellow-corner-orientation",
            title: "Orient the yellow corners to finish",
            shortTitle: "Orient corners",
            description: "Turn the cube over so white is on top and yellow is on the bottom. Bring an unsolved yellow corner to the bottom-front-right position.",
            tip: "Repeat Righty (R U R' U') until that corner's yellow sticker faces down. Turn only the bottom layer to bring the next unsolved corner to the bottom-front-right, then repeat. Finish each Righty before turning the bottom layer.",
            reference: {
                note: "Cube.Academy teaches this final step with white on top, yellow on the bottom, repeated Righty algorithms, and bottom-layer turns between corners.",
                moves: "Righty: R U R' U' · Turn bottom to the next corner",
                url: "https://www.cube.academy/how-to-solve-a-rubiks-cube",
                label: "Cube.Academy: finish cube"
            }
        }
    ];
    const algorithmLearningStates = [
        { id: "not-seen", label: "Not seen / not learning", className: "not-seen" },
        { id: "learning", label: "Learning", className: "learning" },
        { id: "known", label: "Know it", className: "known" }
    ];
    let algorithmLearningStatuses = {};
    let algorithmLearningStorageMessage = "";
    try {
        const savedStatuses = window.localStorage.getItem(algorithmLearningStorageKey);
        if (savedStatuses) {
            const parsedStatuses = JSON.parse(savedStatuses);
            if (!parsedStatuses || typeof parsedStatuses !== "object" || Array.isArray(parsedStatuses)) {
                throw new Error("Saved algorithm statuses are not a valid object.");
            }
            algorithmLearningStatuses = parsedStatuses;
        }
    } catch (error) {
        console.error("Could not load saved algorithm learning statuses.", error);
        algorithmLearningStorageMessage = "Saved statuses could not be loaded; changes may not persist.";
    }
    let guestAlgorithmLearningStatuses = { ...algorithmLearningStatuses };
    let guestCustomAlgorithms = {};
    let accountProgressUserId = null;
    let accountProgressNeedsGuestMerge = false;
    let accountProgressReady = false;
    let syncingAccountUserId = null;
    let accountProgressSyncId = 0;
    let accountProgressSaveQueue = Promise.resolve();
    let accountProgressSaveVersion = 0;
    let accountProgressMessage = "";
    let pendingAccountStatusChanges = {};
    let pendingAccountCustomChanges = {};
    const defaultViewRotation = { x: -24, y: -34 };
    const viewRotation = { ...defaultViewRotation };
    let viewAlignment = { x: 0, y: 0, z: 0 };
    let isPlayingAlgorithm = false;
    let isPlayingBeginnerStage = false;
    let isPlayingTutorialPlayback = false;
    let preserveCompletedTutorialMoves = false;
    let isPlayingCornerPractice = false;
    let cornerPracticeTimer = null;
    let cornerPracticeInitialState = [];
    let cornerPracticeCubies = [];
    let cornerPracticeSequence = [];
    let cornerPracticeDescription = "";
    let cornerPracticeCanInteract = false;
    const defaultCornerPracticeViewRotation = { x: 24, y: -34 };
    const cornerPracticeViewRotation = { ...defaultCornerPracticeViewRotation };
    let cornerPracticePointer = null;
    let activeBeginnerStep = 0;
    let tutorialMode = false;
    let beginnerDaisyScramble = createBeginnerScramble();
    let daisySearchTables = null;
    const unit = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit"));

    function createSolvedCubeState() {
        const state = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const stickers = {};
                    for (const [face, normal] of Object.entries(normals)) {
                        if (x * normal[0] + y * normal[1] + z * normal[2] === 1) stickers[face] = faces[face].color;
                    }
                    state.push({ id: `${x},${y},${z}`, x, y, z, stickers });
                }
            }
        }
        return state;
    }

    function makeCube() {
        cubies = createSolvedCubeState();
        for (const cubie of cubies) {
            const element = document.createElement("div");
            element.className = "cubie";
            cubie.element = element;
            cubeRoot.appendChild(element);
            drawCubie(cubie);
        }
    }

    function drawCubie(cubie) {
        const spacing = unit();
        cubie.element.style.transform = `translate(-50%, -50%) translate3d(${cubie.x * spacing}px, ${-cubie.y * spacing}px, ${cubie.z * spacing}px)`;
        cubie.element.replaceChildren();
        for (const [face, color] of Object.entries(cubie.stickers)) {
            const sticker = document.createElement("i");
            sticker.className = `sticker sticker-${face}`;
            if (activeTutorialHighlight && activeTutorialHighlight.edgeId === cubie.id && activeTutorialHighlight.color === color) {
                sticker.classList.add("tutorial-highlight-edge");
            }
            if (activeTutorialHighlight && activeTutorialHighlight.centerId === cubie.id) {
                sticker.classList.add("tutorial-highlight-center");
            }
            sticker.style.backgroundColor = color;
            sticker.setAttribute("aria-hidden", "true");
            cubie.element.appendChild(sticker);
        }
    }

    function cloneCubeState(state) {
        return state.map(cubie => ({
            id: cubie.id,
            x: cubie.x,
            y: cubie.y,
            z: cubie.z,
            stickers: { ...cubie.stickers }
        }));
    }

    function renderCornerPracticeCube(state) {
        const root = document.getElementById("corner-practice-root");
        root.replaceChildren();
        const spacing = 25;
        state.forEach(cubie => {
            const element = document.createElement("div");
            element.className = "cubie";
            cubie.element = element;
            element.style.transform = `translate(-50%, -50%) translate3d(${cubie.x * spacing}px, ${-cubie.y * spacing}px, ${cubie.z * spacing}px)`;
            Object.entries(cubie.stickers).forEach(([face, color]) => {
                const sticker = document.createElement("i");
                sticker.className = `sticker sticker-${face}`;
                sticker.style.backgroundColor = color;
                sticker.setAttribute("aria-hidden", "true");
                element.appendChild(sticker);
            });
            root.appendChild(element);
        });
        updateCornerPracticeView();
    }

    function updateCornerPracticeView() {
        const orbit = document.querySelector(".corner-practice-orbit");
        orbit.style.transform =
            `rotateX(${cornerPracticeViewRotation.x}deg) rotateY(${cornerPracticeViewRotation.y}deg)`;
    }

    function positionForFacelet(face, row, column) {
        if (face === "U") return { x: column - 1, y: 1, z: row - 1 };
        if (face === "D") return { x: column - 1, y: -1, z: 1 - row };
        if (face === "F") return { x: column - 1, y: 1 - row, z: 1 };
        if (face === "B") return { x: 1 - column, y: 1 - row, z: -1 };
        if (face === "R") return { x: 1, y: 1 - row, z: 1 - column };
        return { x: -1, y: 1 - row, z: column - 1 };
    }

    function colorAtFacelet(state, face, row, column) {
        const position = positionForFacelet(face, row, column);
        const cubie = state.find(item => item.x === position.x && item.y === position.y && item.z === position.z);
        return cubie && cubie.stickers[face] ? cubie.stickers[face] : "#303632";
    }

    function createCasePatternGrid(caseItem, state) {
        const isPll = caseItem.category === "PLL";
        const grid = document.createElement("div");
        grid.className = "case-pattern-grid";
        for (let row = 0; row < 5; row++) {
            for (let column = 0; column < 5; column++) {
                let face;
                let faceRow;
                let faceColumn;
                if (row >= 1 && row <= 3 && column >= 1 && column <= 3) {
                    face = "U";
                    faceRow = row - 1;
                    faceColumn = column - 1;
                } else if (row === 0 && column >= 1 && column <= 3) {
                    face = "B";
                    faceRow = 0;
                    faceColumn = 3 - column;
                } else if (row === 4 && column >= 1 && column <= 3) {
                    face = "F";
                    faceRow = 0;
                    faceColumn = column - 1;
                } else if (column === 0 && row >= 1 && row <= 3) {
                    face = "L";
                    faceRow = 0;
                    faceColumn = row - 1;
                } else if (column === 4 && row >= 1 && row <= 3) {
                    face = "R";
                    faceRow = 0;
                    faceColumn = 3 - row;
                }

                const cell = document.createElement("i");
                if (!face) {
                    cell.className = "case-pattern-blank";
                } else {
                    const isTopFace = face === "U";
                    const color = colorAtFacelet(state, face, faceRow, faceColumn);
                    cell.className = `case-pattern-sticker${isTopFace ? " top-sticker" : " side-sticker"}`;
                    cell.style.backgroundColor = !isPll && color !== faces.U.color ? "#3d423e" : color;
                    cell.setAttribute("aria-hidden", "true");
                }
                grid.appendChild(cell);
            }
        }
        return grid;
    }

    function getCasePreviewState(caseItem, solutionIndex = 0) {
        return getPreparedCase(caseItem, solutionIndex).state;
    }

    function getAlgorithmLearningKey(caseItem, solutionIndex) {
        return `${caseItem.id}:${solutionIndex}:${caseItem.solutions[solutionIndex].moves}`;
    }

    function getAlgorithmLearningState(caseItem, solutionIndex) {
        const statusId = algorithmLearningStatuses[getAlgorithmLearningKey(caseItem, solutionIndex)];
        return algorithmLearningStates.find(state => state.id === statusId) || algorithmLearningStates[0];
    }

    function getCustomAlgorithms() {
        return Object.fromEntries(cases
            .filter(caseItem => caseItem.solutions.some(solution => solution.isCustom))
            .map(caseItem => [
                caseItem.id,
                caseItem.solutions.find(solution => solution.isCustom).moves
            ]));
    }

    function applyCustomAlgorithms(customAlgorithms) {
        cases.forEach(caseItem => {
            caseItem.solutions = caseItem.solutions.filter(solution => !solution.isCustom);
            const moves = customAlgorithms[caseItem.id];
            if (moves === undefined) return;
            if (typeof moves !== "string") {
                throw new Error(`Saved custom algorithm for ${caseItem.id} is not valid.`);
            }
            const parsed = normalizeAlgorithm(moves);
            if (!parsed.moves || parsed.invalidTokens.length > 0) {
                throw new Error(`Saved custom algorithm for ${caseItem.id} contains unsupported moves.`);
            }
            const normalizedMoves = caseItem.category === "PLL" ? removeCubeRotations(parsed.moves) : parsed.moves;
            caseItem.solutions.push({ moves: normalizedMoves, isCustom: true });
        });
    }

    function validateLearningStatuses(statuses) {
        if (!statuses || typeof statuses !== "object" || Array.isArray(statuses)) {
            throw new Error("Saved account learning statuses are not a valid object.");
        }
        for (const [key, status] of Object.entries(statuses)) {
            if (typeof key !== "string" || !algorithmLearningStates.some(state => state.id === status)) {
                throw new Error("Saved account learning statuses contain an invalid value.");
            }
        }
        return statuses;
    }

    function validateCustomAlgorithms(customAlgorithms) {
        if (!customAlgorithms || typeof customAlgorithms !== "object" || Array.isArray(customAlgorithms)) {
            throw new Error("Saved account custom algorithms are not a valid object.");
        }
        const validCaseIds = new Set(cases.map(caseItem => caseItem.id));
        for (const [caseId, moves] of Object.entries(customAlgorithms)) {
            if (!validCaseIds.has(caseId) || typeof moves !== "string") {
                throw new Error("Saved account custom algorithms contain an invalid case or value.");
            }
            const parsed = normalizeAlgorithm(moves);
            if (!parsed.moves || parsed.invalidTokens.length > 0) {
                throw new Error(`Saved custom algorithm for ${caseId} contains unsupported moves.`);
            }
        }
        return customAlgorithms;
    }

    function renderAccountProgressMessage() {
        const statusMessage = document.getElementById("algorithm-status-message");
        statusMessage.textContent = accountProgressMessage || algorithmLearningStorageMessage;
    }

    function saveAccountProgress() {
        const account = window.CUBE_CLUB_ACCOUNT;
        const userId = accountProgressUserId;
        if (!userId || !account) return;
        if (!accountProgressReady) {
            if (!syncingAccountUserId) {
                syncAccountProgress(userId);
                return;
            }
            accountProgressMessage = "Waiting for your account progress to finish loading.";
            renderAccountProgressMessage();
            return;
        }

        const version = ++accountProgressSaveVersion;
        const progress = {
            learningStatuses: { ...algorithmLearningStatuses },
            customAlgorithms: getCustomAlgorithms()
        };
        accountProgressMessage = "Saving progress to your account…";
        renderAccountProgressMessage();
        const saveTask = accountProgressSaveQueue.then(() => account.saveProgress(userId, progress));
        accountProgressSaveQueue = saveTask.catch(error => {
            if (accountProgressUserId !== userId || accountProgressSaveVersion !== version) return;
            console.error("Could not save account progress.", error);
            accountProgressMessage = `Could not save to your account: ${error && error.message ? error.message : "Please try again."}`;
            renderAccountProgressMessage();
        });
        saveTask.then(() => {
            if (accountProgressUserId !== userId || accountProgressSaveVersion !== version) return;
            accountProgressMessage = "Progress saved to your account.";
            renderAccountProgressMessage();
        }, () => {});
    }

    async function syncAccountProgress(userId) {
        const account = window.CUBE_CLUB_ACCOUNT;
        if (!account || !userId || accountProgressReady && accountProgressUserId === userId ||
            syncingAccountUserId === userId) return;

        const firstAccount = accountProgressUserId === null;
        if (firstAccount) accountProgressNeedsGuestMerge = true;
        if (!firstAccount && accountProgressUserId !== userId) {
            accountProgressNeedsGuestMerge = false;
            algorithmLearningStatuses = {};
            applyCustomAlgorithms({});
            pendingAccountStatusChanges = {};
            pendingAccountCustomChanges = {};
            renderCaseGrid();
        }
        accountProgressUserId = userId;
        accountProgressReady = false;
        syncingAccountUserId = userId;
        const requestId = ++accountProgressSyncId;
        accountProgressMessage = "Loading progress from your account…";
        renderAccountProgressMessage();
        try {
            const data = await account.loadProgress(userId);
            if (requestId !== accountProgressSyncId || accountProgressUserId !== userId) return;
            const savedStatuses = validateLearningStatuses(data.learning_statuses);
            const savedCustomAlgorithms = validateCustomAlgorithms(data.custom_algorithms);
            algorithmLearningStatuses = {
                ...(accountProgressNeedsGuestMerge ? guestAlgorithmLearningStatuses : {}),
                ...savedStatuses,
                ...pendingAccountStatusChanges
            };
            const customAlgorithms = {
                ...(accountProgressNeedsGuestMerge ? guestCustomAlgorithms : {}),
                ...savedCustomAlgorithms,
                ...pendingAccountCustomChanges
            };
            applyCustomAlgorithms(Object.fromEntries(
                Object.entries(customAlgorithms).filter(([, moves]) => typeof moves === "string")
            ));
            accountProgressNeedsGuestMerge = false;
            accountProgressReady = true;
            pendingAccountStatusChanges = {};
            pendingAccountCustomChanges = {};
            accountProgressMessage = "";
            renderCaseGrid();
            if (selectedCase && selectedCase.solutions[selectedAlgorithmIndex]) {
                loadCase(selectedCase, selectedAlgorithmIndex);
            }
            renderAccountProgressMessage();
            saveAccountProgress();
        } catch (error) {
            if (requestId !== accountProgressSyncId || accountProgressUserId !== userId) return;
            console.error("Could not load account progress.", error);
            accountProgressMessage = `Could not load your account progress: ${error && error.message ? error.message : "Please try again."}`;
            renderAccountProgressMessage();
        } finally {
            if (syncingAccountUserId === userId) syncingAccountUserId = null;
        }
    }

    function handleAccountSessionChange(session) {
        const userId = session && session.user && session.user.id;
        if (userId) {
            syncAccountProgress(userId);
            return;
        }
        if (accountProgressUserId !== null) {
            accountProgressSyncId++;
            accountProgressUserId = null;
            accountProgressNeedsGuestMerge = false;
            accountProgressReady = false;
            syncingAccountUserId = null;
            pendingAccountStatusChanges = {};
            pendingAccountCustomChanges = {};
            algorithmLearningStatuses = { ...guestAlgorithmLearningStatuses };
            applyCustomAlgorithms(guestCustomAlgorithms);
            accountProgressMessage = "";
            renderCaseGrid();
            if (selectedCase) loadCase(selectedCase);
            renderAccountProgressMessage();
        }
    }

    function getCaseLearningStatus(caseItem) {
        let isLearning = false;
        for (let index = 0; index < caseItem.solutions.length; index++) {
            const statusId = getAlgorithmLearningState(caseItem, index).id;
            if (statusId === "known") return "known";
            if (statusId === "learning") isLearning = true;
        }
        return isLearning ? "learning" : "not-seen";
    }

    function renderAlgorithmLearningStatuses(caseItem, selectedSolutionIndex) {
        const container = document.getElementById("algorithm-status-list");
        container.replaceChildren();
        const solution = caseItem.solutions[selectedSolutionIndex];
        const learningState = getAlgorithmLearningState(caseItem, selectedSolutionIndex);
        const turnCount = solution.moves.trim().split(/\s+/).length;
        const optionLabel = caseItem.solutions.length > 1
            ? `Option ${selectedSolutionIndex + 1} · ${turnCount} turns`
            : `${turnCount} turns`;
        const button = document.createElement("button");
        button.type = "button";
        button.className = `algorithm-status-button ${learningState.className}`;
        button.textContent = `${learningState.label} · ${optionLabel}`;
        button.setAttribute("aria-label", `${optionLabel}. Status: ${learningState.label}. Click to change status.`);
        button.setAttribute("aria-current", "true");
        button.dataset.solutionIndex = String(selectedSolutionIndex);
        button.addEventListener("click", () => {
            const currentIndex = algorithmLearningStates.findIndex(state => state.id === learningState.id);
            const nextState = algorithmLearningStates[(currentIndex + 1) % algorithmLearningStates.length];
            const learningKey = getAlgorithmLearningKey(caseItem, selectedSolutionIndex);
            algorithmLearningStatuses[learningKey] = nextState.id;
            if (accountProgressUserId) {
                if (!accountProgressReady) pendingAccountStatusChanges[learningKey] = nextState.id;
                saveAccountProgress();
            } else {
                try {
                    window.localStorage.setItem(algorithmLearningStorageKey, JSON.stringify(algorithmLearningStatuses));
                    guestAlgorithmLearningStatuses = { ...algorithmLearningStatuses };
                    algorithmLearningStorageMessage = "";
                } catch (error) {
                    console.error("Could not save algorithm learning status.", error);
                    algorithmLearningStorageMessage = "Could not save this status in the browser.";
                }
            }
            renderAlgorithmLearningStatuses(caseItem, selectedSolutionIndex);
            renderCaseGrid();
            container.querySelector(`[data-solution-index="${selectedSolutionIndex}"]`).focus();
        });
        container.appendChild(button);
        renderAccountProgressMessage();
    }

    function getPreparedCase(caseItem, solutionIndex = 0) {
        const sourceAlgorithm = caseItem.solutions[solutionIndex].moves;
        const cacheKey = `${caseItem.id}:${solutionIndex}:${sourceAlgorithm}`;
        if (casePreviewStates.has(cacheKey)) return casePreviewStates.get(cacheKey);
        const state = createSolvedCubeState();
        inverseAlgorithm(sourceAlgorithm).forEach(token => {
            const move = parseMove(token);
            if (!move) return;
            getAffectedCubies(state, move).forEach(cubie => rotateCubie(cubie, move));
        });
        const prepared = { state, algorithm: sourceAlgorithm };
        casePreviewStates.set(cacheKey, prepared);
        return prepared;
    }

    function renderCubeViews() {
        const category = selectedCase ? selectedCase.category : "OLL";
        const isPll = category === "PLL";
        const caseItem = selectedCase || { category: "OLL" };
        const diagram = document.getElementById("case-pattern-diagram");
        diagram.className = `case-pattern-diagram ${isPll ? "pll" : "oll"}`;
        diagram.setAttribute("aria-label", isPll
            ? "Top-down PLL view with side colors and piece permutation arrows"
            : "Top-down OLL view showing the yellow sticker pattern and side colors");
        document.getElementById("case-view-title").textContent = isPll ? "PLL · top + sides" : "OLL · top + sides";
        document.getElementById("case-view-subtitle").textContent = isPll ? "Piece permutation" : "Yellow pattern";
        diagram.replaceChildren(createCasePatternGrid(caseItem, cubies));
        if (isPll) diagram.appendChild(createPermutationArrowOverlay());
    }

    function renderCaseTitlePreview(caseItem, state) {
        const preview = document.getElementById("case-title-preview");
        preview.className = `case-title-preview ${caseItem.category.toLowerCase()}`;
        preview.replaceChildren(createCasePatternGrid(caseItem, state));
    }

    function createPermutationArrowOverlay() {
        const namespace = "http://www.w3.org/2000/svg";
        const svg = document.createElementNS(namespace, "svg");
        svg.setAttribute("class", "pll-arrows");
        svg.setAttribute("viewBox", "0 0 5 5");
        svg.setAttribute("aria-hidden", "true");
        const defs = document.createElementNS(namespace, "defs");
        const marker = document.createElementNS(namespace, "marker");
        marker.setAttribute("id", "pll-arrowhead");
        marker.setAttribute("viewBox", "0 0 10 10");
        marker.setAttribute("refX", "8");
        marker.setAttribute("refY", "5");
        marker.setAttribute("markerWidth", "0.24");
        marker.setAttribute("markerHeight", "0.24");
        marker.setAttribute("orient", "auto-start-reverse");
        const arrowHead = document.createElementNS(namespace, "path");
        arrowHead.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
        arrowHead.setAttribute("fill", "#171a18");
        marker.appendChild(arrowHead);
        defs.appendChild(marker);
        svg.appendChild(defs);

        casePermutationArrows.forEach(arrow => {
            const startX = arrow.start.x + 2.5;
            const startY = arrow.start.z + 2.5;
            const endX = arrow.end.x + 2.5;
            const endY = arrow.end.z + 2.5;
            const path = document.createElementNS(namespace, "path");
            path.setAttribute("d", `M ${startX} ${startY} L ${endX} ${endY}`);
            path.setAttribute("marker-end", "url(#pll-arrowhead)");
            path.setAttribute("class", "pll-arrow-path");
            svg.appendChild(path);
        });
        return svg;
    }

    function rotateVector(vector, axis, quarterTurns) {
        let [x, y, z] = vector;
        const turns = ((quarterTurns % 4) + 4) % 4;
        for (let i = 0; i < turns; i++) {
            if (axis === "x") [x, y, z] = [x, -z, y];
            else if (axis === "y") [x, y, z] = [z, y, -x];
            else [x, y, z] = [-y, x, z];
        }
        return [x, y, z];
    }

    function faceFromNormal(normal) {
        return Object.keys(normals).find(face => normals[face].every((value, index) => value === normal[index]));
    }

    function rotateCubie(cubie, move) {
        const position = rotateVector([cubie.x, cubie.y, cubie.z], move.axis, move.quarterTurns);
        [cubie.x, cubie.y, cubie.z] = position;
        const rotatedStickers = {};
        for (const [face, color] of Object.entries(cubie.stickers)) {
            rotatedStickers[faceFromNormal(rotateVector(normals[face], move.axis, move.quarterTurns))] = color;
        }
        cubie.stickers = rotatedStickers;
    }

    function getYellowCenterFace(state) {
        const yellowCenter = state.find(cubie =>
            Object.keys(cubie.stickers).length === 1 &&
            Object.values(cubie.stickers).includes(faces.U.color)
        );
        if (!yellowCenter) throw new Error("Could not find the yellow center while orienting a PLL case.");

        const yellowFace = Object.keys(yellowCenter.stickers).find(face => yellowCenter.stickers[face] === faces.U.color);
        if (!["U", "D", "R", "L", "F", "B"].includes(yellowFace)) {
            throw new Error("Could not determine the yellow center's face while orienting a PLL case.");
        }
        return yellowFace;
    }

    function getYellowTopViewAlignment(state) {
        const alignments = {
            U: { x: 0, y: 0, z: 0 },
            D: { x: 180, y: 0, z: 0 },
            R: { x: 0, y: 0, z: -90 },
            L: { x: 0, y: 0, z: 90 },
            F: { x: 90, y: 0, z: 0 },
            B: { x: -90, y: 0, z: 0 }
        };
        return alignments[getYellowCenterFace(state)];
    }

    function getCasePermutationArrows(algorithm) {
        const finalPositions = cubies.map(({ id, x, y, z, stickers }) => ({
            id,
            x,
            y,
            z,
            isFixed: Object.keys(stickers).length <= 1
        }));
        algorithm.trim().split(/\s+/).forEach(token => {
            const move = parseMove(token);
            if (!move) return;
            finalPositions.filter(cubie => {
                const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
                return move.layers.includes(coordinate) && (move.layers.length === 3 || !cubie.isFixed);
            }).forEach(cubie => {
                [cubie.x, cubie.y, cubie.z] = rotateVector([cubie.x, cubie.y, cubie.z], move.axis, move.quarterTurns);
            });
        });
        const destinations = new Map(finalPositions.map(cubie => [cubie.id, cubie]));
        return cubies
            .filter(cubie => cubie.y === 1 && (cubie.x !== 0 || cubie.z !== 0))
            .map(cubie => ({ start: { x: cubie.x, z: cubie.z }, end: destinations.get(cubie.id) }))
            .filter(arrow => arrow.end && arrow.end.y === 1 && (arrow.start.x !== arrow.end.x || arrow.start.z !== arrow.end.z));
    }

    function applyMoveToState(token) {
        const move = parseMove(token);
        if (!move) return;
        const selected = getAffectedCubies(cubies, move);
        selected.forEach(cubie => rotateCubie(cubie, move));
        cubies.forEach(drawCubie);
    }

    function inverseAlgorithm(sequence) {
        return sequence.trim().split(/\s+/).reverse().map(token => {
            if (token.includes("2")) return token;
            return token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
        });
    }

    function parseMove(token) {
        const definition = moveDefinitions[token[0]];
        if (!definition) return null;
        const direction = token.includes("'") ? -1 : 1;
        const turns = token.includes("2") ? 2 : 1;
        return {
            ...definition,
            quarterTurns: -definition.sign * direction * turns
        };
    }

    function getAffectedCubies(state, move) {
        const wholeCubeRotation = move.layers.length === 3;
        return state.filter(cubie => {
            const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
            // Slice, wide, and whole-cube turns carry centers with their layers.
            return move.layers.includes(coordinate) &&
                (wholeCubeRotation || move.movesCenters || Object.keys(cubie.stickers).length > 1);
        });
    }

    function mapLocalVectorToWorld(frame, vector) {
        return [0, 1, 2].map(index =>
            frame.x[index] * vector[0] +
            frame.y[index] * vector[1] +
            frame.z[index] * vector[2]
        );
    }

    function removeCubeRotations(sequence) {
        const frame = {
            x: [1, 0, 0],
            y: [0, 1, 0],
            z: [0, 0, 1]
        };
        const mappedMoves = [];
        for (const token of sequence.trim().split(/\s+/)) {
            const move = parseMove(token);
            if (!move) throw new Error(`Cannot map unsupported PLL move ${token}.`);
            if (["x", "y", "z"].includes(token[0])) {
                const oldFrame = {
                    x: [...frame.x],
                    y: [...frame.y],
                    z: [...frame.z]
                };
                const localBasis = {
                    x: [1, 0, 0],
                    y: [0, 1, 0],
                    z: [0, 0, 1]
                };
                for (const axis of ["x", "y", "z"]) {
                    frame[axis] = mapLocalVectorToWorld(
                        oldFrame,
                        rotateVector(localBasis[axis], move.axis, -move.quarterTurns)
                    );
                }
                continue;
            }

            const axisVector = frame[move.axis];
            const axisIndex = axisVector.findIndex(value => Math.abs(value) === 1);
            if (axisIndex < 0) throw new Error(`Cannot determine the PLL move axis for ${token}.`);
            const worldAxis = ["x", "y", "z"][axisIndex];
            const axisDirection = axisVector[axisIndex];
            const worldLayers = move.layers.map(layer => layer * axisDirection).sort((left, right) => left - right);
            const worldQuarterTurns = ((move.quarterTurns * axisDirection) % 4 + 4) % 4;
            let mappedToken = null;
            for (const candidateBase of Object.keys(moveDefinitions)) {
                if (["x", "y", "z"].includes(candidateBase)) continue;
                for (const suffix of ["", "2", "'"]) {
                    const candidateToken = `${candidateBase}${suffix}`;
                    const candidate = parseMove(candidateToken);
                    const candidateLayers = candidate.layers.slice().sort((left, right) => left - right);
                    if (candidate.axis === worldAxis &&
                        candidateLayers.join(",") === worldLayers.join(",") &&
                        ((candidate.quarterTurns % 4) + 4) % 4 === worldQuarterTurns) {
                        mappedToken = candidateToken;
                        break;
                    }
                }
                if (mappedToken) break;
            }
            if (!mappedToken) throw new Error(`Cannot map PLL move ${token} into the yellow-top orientation.`);
            mappedMoves.push(mappedToken);
        }
        return mappedMoves.join(" ");
    }

    function renderAlgorithm(sequence) {
        const container = document.getElementById("algorithm-code");
        container.replaceChildren();
        for (const token of sequence.trim().split(/\s+/).filter(Boolean)) {
            const move = parseMove(token);
            if (!move) continue;
            const button = document.createElement("button");
            button.className = "algorithm-move";
            button.type = "button";
            button.textContent = token.replace("'", "′");
            const direction = token.includes("2") ? "halfway around" : token.includes("'") ? "counterclockwise" : "clockwise";
            button.setAttribute("aria-label", `Animate ${button.textContent}: ${move.label}, ${direction}`);
            button.addEventListener("click", () => enqueue(token));
            container.appendChild(button);
        }
    }

    function renderCase(caseItem, solutionIndex, displayAlgorithm) {
        const categoryCases = cases.filter(item => item.category === caseItem.category);
        const caseNumber = categoryCases.findIndex(item => item.id === caseItem.id) + 1;
        document.getElementById("case-category").textContent = caseItem.category;
        document.getElementById("case-index").textContent = `CASE ${String(caseNumber).padStart(2, "0")} / ${String(categoryCases.length).padStart(2, "0")}`;
        document.getElementById("progress-fill").style.width = `${(caseNumber / categoryCases.length) * 100}%`;
        document.getElementById("case-kicker").textContent = caseItem.kicker;
        document.getElementById("case-title").textContent = caseItem.name;
        renderCaseTitlePreview(caseItem, cubies);
        document.getElementById("case-description").textContent = caseItem.description;
        document.getElementById("case-recognition").textContent = caseItem.recognition;
        const algorithmChoice = document.getElementById("algorithm-choice");
        algorithmChoice.replaceChildren();
        caseItem.solutions.forEach((_, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            const turnCount = getPreparedCase(caseItem, index).algorithm.trim().split(/\s+/).length;
            option.textContent = `${turnCount} turns${caseItem.solutions.length > 1 ? ` · option ${index + 1}` : ""}`;
            algorithmChoice.appendChild(option);
        });
        algorithmChoice.value = String(solutionIndex);
        renderAlgorithmLearningStatuses(caseItem, solutionIndex);
        document.getElementById("algorithm-source").href = caseItem.sourceUrl;
        document.getElementById("algorithm-label").textContent = "Tap a turn to animate it on the cube";
        renderAlgorithm(displayAlgorithm);
        const customSolution = caseItem.solutions.find(solution => solution.isCustom);
        const customInput = document.getElementById("custom-algorithm-input");
        customInput.value = customSolution ? customSolution.moves : "";
        customInput.removeAttribute("aria-invalid");
        document.getElementById("delete-custom-algorithm").hidden = !customSolution;
        document.getElementById("custom-algorithm-status").textContent = customSolution
            ? "A custom algorithm is available in this case's solution list."
            : "Enter moves such as R, R', R2, l, u, d, f, b, e, M, or x.";
        document.querySelectorAll(".case-card").forEach(card => {
            card.setAttribute("aria-pressed", String(card.dataset.caseId === caseItem.id));
        });
    }

    function applyCustomAlgorithm() {
        const input = document.getElementById("custom-algorithm-input");
        const status = document.getElementById("custom-algorithm-status");
        if (!selectedCase) {
            status.textContent = "Choose a case before adding a custom algorithm.";
            return;
        }

        const parsed = normalizeAlgorithm(input.value);
        if (!parsed.moves) {
            input.setAttribute("aria-invalid", "true");
            status.textContent = "Enter at least one move.";
            return;
        }
        if (parsed.invalidTokens.length > 0) {
            input.setAttribute("aria-invalid", "true");
            status.textContent = `Unsupported move notation: ${parsed.invalidTokens.join(", ")}.`;
            return;
        }

        const moves = selectedCase.category === "PLL" ? removeCubeRotations(parsed.moves) : parsed.moves;
        input.removeAttribute("aria-invalid");
        let solutionIndex = selectedCase.solutions.findIndex(solution => solution.isCustom);
        if (solutionIndex < 0) {
            selectedCase.solutions.push({ moves, isCustom: true });
            solutionIndex = selectedCase.solutions.length - 1;
        } else {
            selectedCase.solutions[solutionIndex].moves = moves;
        }
        if (accountProgressUserId) {
            if (!accountProgressReady) pendingAccountCustomChanges[selectedCase.id] = moves;
            saveAccountProgress();
        } else {
            guestCustomAlgorithms[selectedCase.id] = moves;
        }
        loadCase(selectedCase, solutionIndex);
        status.textContent = "Custom algorithm added to this case's solutions.";
    }

    function deleteCustomAlgorithm() {
        const status = document.getElementById("custom-algorithm-status");
        const input = document.getElementById("custom-algorithm-input");
        if (!selectedCase) {
            status.textContent = "Choose a case before deleting a custom algorithm.";
            return;
        }

        const solutionIndex = selectedCase.solutions.findIndex(solution => solution.isCustom);
        if (solutionIndex < 0) {
            status.textContent = "This case does not have a custom algorithm.";
            return;
        }

        selectedCase.solutions.splice(solutionIndex, 1);
        delete guestCustomAlgorithms[selectedCase.id];
        if (accountProgressUserId) {
            if (!accountProgressReady) {
                pendingAccountCustomChanges[selectedCase.id] = null;
            } else {
                saveAccountProgress();
            }
        }

        input.value = "";
        input.removeAttribute("aria-invalid");
        document.getElementById("delete-custom-algorithm").hidden = true;
        loadCase(selectedCase, 0);
        status.textContent = "Custom algorithm deleted.";
    }

    function navigateCase(direction) {
        const currentCase = pendingCase || selectedCase;
        if (!currentCase) return;
        const categoryCases = cases.filter(item => item.category === currentCase.category);
        const currentIndex = categoryCases.findIndex(item => item.id === currentCase.id);
        if (currentIndex < 0 || categoryCases.length === 0) return;
        const nextIndex = (currentIndex + direction + categoryCases.length) % categoryCases.length;
        document.getElementById("case-search").value = "";
        renderCaseGrid();
        loadCase(categoryCases[nextIndex]);
    }

    function loadCase(caseItem, solutionIndex = 0) {
        moveQueue.length = 0;
        if (!caseItem.solutions[solutionIndex]) {
            throw new Error(`Unknown solution ${solutionIndex} for ${caseItem.id}.`);
        }
        if (busy) {
            pendingCase = caseItem;
            pendingAlgorithmIndex = solutionIndex;
            cubeStatus.textContent = `Loading ${caseItem.name}…`;
            return;
        }
        pendingCase = null;
        selectedCase = caseItem;
        selectedAlgorithmIndex = solutionIndex;
        cubeRoot.replaceChildren();
        makeCube();
        const algorithm = caseItem.solutions[solutionIndex].moves;
        inverseAlgorithm(algorithm).forEach(applyMoveToState);
        activeAlgorithmSequence = algorithm;
        isPlayingAlgorithm = false;
        viewRotation.x = defaultViewRotation.x;
        viewRotation.y = defaultViewRotation.y;
        viewRotation.z = 0;
        viewAlignment = { x: 0, y: 0, z: 0 };
        updateCubeView();
        casePermutationArrows = caseItem.category === "PLL" ? getCasePermutationArrows(activeAlgorithmSequence) : [];
        renderCubeViews();
        renderCase(caseItem, solutionIndex, activeAlgorithmSequence);
        cubeStatus.textContent = `${caseItem.name} case loaded`;
    }

    function enqueue(sequence) {
        if (pendingCase) return;
        const tokens = sequence.trim().split(/\s+/).filter(Boolean);
        for (const token of tokens) {
            if (parseMove(token)) moveQueue.push(token);
        }
        processQueue();
    }

    function getMoveDelay() {
        if (!tutorialMode) return Number(document.getElementById("turn-gap").value);
        if (!document.getElementById("tutorial-delay-enabled").checked) return 0;
        return Number(document.getElementById("tutorial-move-delay").value);
    }

    function updateTutorialHighlights() {
        let nextHighlight = null;
        tutorialHighlightSegments.forEach(segment => {
            if (tutorialMoveIndex >= segment.startIndex && tutorialMoveIndex <= segment.endIndex) {
                nextHighlight = segment;
            }
        });
        if (activeTutorialHighlight === nextHighlight) return;
        activeTutorialHighlight = nextHighlight;
        cubies.forEach(drawCubie);

        const note = document.getElementById("tutorial-highlight-note");
        note.hidden = !nextHighlight;
        if (!nextHighlight) return;
        const colorNames = {
            [faces.R.color]: "red",
            [faces.L.color]: "orange",
            [faces.F.color]: "green",
            [faces.B.color]: "blue"
        };
        const colorName = colorNames[nextHighlight.color] || "matching";
        note.textContent =
            `Match the ${colorName} sticker on this white edge with the ${colorName} center, then turn ${nextHighlight.sideFace} twice to move it into the white cross.`;
    }

    function updateTutorialMoveControls() {
        const busyWithMoves = busy || moveQueue.length > 0;
        document.getElementById("tutorial-move-back").disabled =
            !tutorialMode || busyWithMoves || tutorialMoveIndex === 0;
        document.getElementById("tutorial-move-next").disabled =
            !tutorialMode || busyWithMoves || tutorialMoveIndex >= tutorialMoveTokens.length;
        document.getElementById("tutorial-move-progress").textContent =
            `${tutorialMoveIndex} / ${tutorialMoveTokens.length} moves`;
    }

    function stepTutorialMove(direction) {
        if (!tutorialMode) return;
        if (busy || moveQueue.length > 0) {
            cubeStatus.textContent = "Wait for the current turns to finish.";
            return;
        }
        let moveToken;
        if (direction > 0) {
            if (tutorialMoveIndex >= tutorialMoveTokens.length) {
                cubeStatus.textContent = "There are no more moves in this step.";
                return;
            }
            const token = tutorialMoveTokens[tutorialMoveIndex];
            moveToken = token;
            tutorialMoveIndex++;
            isPlayingBeginnerStage = tutorialMoveIndex === tutorialMoveTokens.length;
            isPlayingTutorialPlayback = false;
            preserveCompletedTutorialMoves = isPlayingBeginnerStage;
        } else {
            if (tutorialMoveIndex === 0) {
                cubeStatus.textContent = "There are no earlier moves in this step.";
                return;
            }
            const token = tutorialMoveTokens[tutorialMoveIndex - 1];
            moveToken = inverseAlgorithm(token)[0];
            tutorialMoveIndex--;
            isPlayingBeginnerStage = false;
            isPlayingTutorialPlayback = false;
            preserveCompletedTutorialMoves = false;
        }
        updateTutorialHighlights();
        enqueue(moveToken);
        updateTutorialMoveControls();
    }

    function processQueue() {
        if (busy || moveQueue.length === 0) return;
        busy = true;
        updateTutorialMoveControls();
        const token = moveQueue.shift();
        if (tutorialMode && isPlayingTutorialPlayback && tutorialMoveIndex < tutorialMoveTokens.length) {
            tutorialMoveIndex++;
            updateTutorialHighlights();
            updateTutorialMoveControls();
        }
        const move = parseMove(token);
        const selected = getAffectedCubies(cubies, move);
        const layer = document.createElement("div");
        layer.className = "turn-layer";
        cubeRoot.appendChild(layer);
        for (const cubie of selected) layer.appendChild(cubie.element);
        const cssQuarterTurns = move.axis === "y" ? move.quarterTurns : -move.quarterTurns;
        const cssAngle = cssQuarterTurns * 90;
        const axisName = move.axis.toUpperCase();
        layer.style.transform = `rotate${axisName}(0deg)`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                layer.style.transform = `rotate${axisName}(${cssAngle}deg)`;
            });
        });
        cubeStatus.textContent = `Turning ${token.replace("'", "′")}`;
        const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 220 : 520;
        window.setTimeout(() => {
            selected.forEach(cubie => {
                rotateCubie(cubie, move);
                cubeRoot.appendChild(cubie.element);
                drawCubie(cubie);
            });
            layer.remove();
            renderCubeViews();
            if (pendingCase) {
                busy = false;
                const nextCase = pendingCase;
                const nextAlgorithmIndex = pendingAlgorithmIndex;
                pendingCase = null;
                loadCase(nextCase, nextAlgorithmIndex);
                return;
            }
            if (moveQueue.length > 0) {
                const gap = getMoveDelay();
                cubeStatus.textContent = gap > 0 ? `Next move in ${gap} ms` : "Next move";
                window.setTimeout(() => {
                    busy = false;
                    if (pendingCase) {
                        const nextCase = pendingCase;
                        const nextAlgorithmIndex = pendingAlgorithmIndex;
                        pendingCase = null;
                        loadCase(nextCase, nextAlgorithmIndex);
                        return;
                    }
                    processQueue();
                }, gap);
                return;
            }
            cubeStatus.textContent = "Ready to explore";
            if (isPlayingAlgorithm && selectedCase && selectedCase.category === "PLL") {
                viewAlignment = getYellowTopViewAlignment(cubies);
                updateCubeView();
            }
            isPlayingAlgorithm = false;
            busy = false;
            if (isPlayingBeginnerStage) {
                const preserveCompletedMoves =
                    preserveCompletedTutorialMoves ||
                    (isPlayingTutorialPlayback && tutorialMoveIndex === tutorialMoveTokens.length);
                isPlayingBeginnerStage = false;
                isPlayingTutorialPlayback = false;
                preserveCompletedTutorialMoves = false;
                loadBeginnerDemo(preserveCompletedMoves);
            } else if (tutorialMode) {
                updateTutorialMoveControls();
                cubeStatus.textContent = `${tutorialMoveIndex} of ${tutorialMoveTokens.length} moves applied`;
            }
        }, duration);
    }

    const caseGrid = document.getElementById("case-grid");
    const caseDialog = document.getElementById("case-dialog");

    function createBeginnerScramble() {
        const faceNames = ["U", "D", "L", "R", "F", "B"];
        const suffixes = ["", "'", "2"];
        const scramble = [];
        while (scramble.length < 20) {
            const previousFace = scramble.length > 0 ? scramble[scramble.length - 1][0] : "";
            const availableFaces = faceNames.filter(face => face !== previousFace);
            const face = availableFaces[Math.floor(Math.random() * availableFaces.length)];
            const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
            scramble.push(`${face}${suffix}`);
        }
        return scramble;
    }

    const daisySearchMoves = ["U", "U'", "U2", "D", "D'", "D2", "L", "L'", "L2", "R", "R'", "R2", "F", "F'", "F2", "B", "B'", "B2"];

    function buildDaisySearchTables() {
        const edgePositions = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if ([x, y, z].filter(value => value !== 0).length === 2) edgePositions.push([x, y, z]);
                }
            }
        }
        const positionKey = position => position.join(",");
        const positionIndices = new Map(edgePositions.map((position, index) => [positionKey(position), index]));
        const orientationVectors = edgePositions.map(([x, y, z]) => {
            const vectors = [];
            if (x !== 0) vectors.push([x, 0, 0]);
            if (y !== 0) vectors.push([0, y, 0]);
            if (z !== 0) vectors.push([0, 0, z]);
            return vectors;
        });
        const transitions = new Uint8Array(edgePositions.length * 2 * daisySearchMoves.length);

        for (let positionIndex = 0; positionIndex < edgePositions.length; positionIndex++) {
            for (let orientation = 0; orientation < 2; orientation++) {
                const stateIndex = positionIndex * 2 + orientation;
                daisySearchMoves.forEach((token, moveIndex) => {
                    const move = parseMove(token);
                    const position = edgePositions[positionIndex];
                    const coordinateIndex = move.axis === "x" ? 0 : move.axis === "y" ? 1 : 2;
                    if (!move.layers.includes(position[coordinateIndex])) {
                        transitions[stateIndex * daisySearchMoves.length + moveIndex] = stateIndex;
                        return;
                    }
                    const nextPosition = rotateVector(position, move.axis, move.quarterTurns);
                    const nextPositionIndex = positionIndices.get(positionKey(nextPosition));
                    const nextWhiteNormal = rotateVector(orientationVectors[positionIndex][orientation], move.axis, move.quarterTurns);
                    const nextOrientation = orientationVectors[nextPositionIndex].findIndex(vector =>
                        vector.every((value, index) => value === nextWhiteNormal[index])
                    );
                    transitions[stateIndex * daisySearchMoves.length + moveIndex] = nextPositionIndex * 2 + nextOrientation;
                });
            }
        }

        const stateCount = 1 << 20;
        const parents = new Int32Array(stateCount);
        parents.fill(-1);
        const nextMoves = new Int8Array(stateCount);
        nextMoves.fill(-1);
        const queue = new Uint32Array(stateCount);
        const inverseMoveIndices = daisySearchMoves.map(token => {
            const inverse = token.includes("2") ? token : token.endsWith("'") ? token.slice(0, -1) : `${token}'`;
            return daisySearchMoves.indexOf(inverse);
        });
        const goalStates = edgePositions
            .map((position, index) => ({ position, index }))
            .filter(({ position }) => position[1] === 1 && (position[0] !== 0 || position[2] !== 0))
            .map(({ index }) => index * 2 + orientationVectors[index].findIndex(vector => vector[0] === 0 && vector[1] === 1 && vector[2] === 0));
        let queueEnd = 0;

        function addGoalPermutations(depth, usedMask, key) {
            if (depth === 4) {
                parents[key] = key;
                queue[queueEnd++] = key;
                return;
            }
            goalStates.forEach((goalState, index) => {
                if (usedMask & (1 << index)) return;
                addGoalPermutations(depth + 1, usedMask | (1 << index), key | (goalState << (depth * 5)));
            });
        }
        addGoalPermutations(0, 0, 0);

        let queueStart = 0;
        while (queueStart < queueEnd) {
            const key = queue[queueStart++];
            const state0 = key & 31;
            const state1 = (key >>> 5) & 31;
            const state2 = (key >>> 10) & 31;
            const state3 = (key >>> 15) & 31;
            for (let moveIndex = 0; moveIndex < daisySearchMoves.length; moveIndex++) {
                const nextKey =
                    transitions[state0 * daisySearchMoves.length + moveIndex] |
                    (transitions[state1 * daisySearchMoves.length + moveIndex] << 5) |
                    (transitions[state2 * daisySearchMoves.length + moveIndex] << 10) |
                    (transitions[state3 * daisySearchMoves.length + moveIndex] << 15);
                if (parents[nextKey] !== -1) continue;
                parents[nextKey] = key;
                nextMoves[nextKey] = inverseMoveIndices[moveIndex];
                queue[queueEnd++] = nextKey;
            }
        }
        return { edgePositions, positionIndices, orientationVectors, parents, nextMoves };
    }

    function getDaisyEdgeStateIndex(cubie, tables) {
        const positionIndex = tables.positionIndices.get(`${cubie.x},${cubie.y},${cubie.z}`);
        const whiteFace = Object.keys(cubie.stickers).find(face => cubie.stickers[face] === faces.D.color);
        if (positionIndex === undefined || !whiteFace) {
            throw new Error("Could not locate a white edge while preparing the daisy demo.");
        }
        const orientation = tables.orientationVectors[positionIndex].findIndex(vector =>
            vector.every((value, index) => value === normals[whiteFace][index])
        );
        if (orientation < 0) throw new Error("Could not determine a white edge's orientation.");
        return positionIndex * 2 + orientation;
    }

    function getDaisySolution(state) {
        const tables = daisySearchTables || (daisySearchTables = buildDaisySearchTables());
        const whiteEdges = state.filter(cubie =>
            Object.keys(cubie.stickers).length === 2 &&
            Object.values(cubie.stickers).includes(faces.D.color)
        );
        if (whiteEdges.length !== 4) throw new Error(`Expected four white edges for the daisy demo, found ${whiteEdges.length}.`);
        const edgeStates = whiteEdges.map(cubie => getDaisyEdgeStateIndex(cubie, tables));
        let key = edgeStates[0] | (edgeStates[1] << 5) | (edgeStates[2] << 10) | (edgeStates[3] << 15);
        if (tables.parents[key] === -1) throw new Error("Could not find a daisy solution for this cube state.");

        const moves = [];
        while (tables.parents[key] !== key) {
            const moveIndex = tables.nextMoves[key];
            if (moveIndex < 0) throw new Error("The daisy solution path is incomplete.");
            moves.push(daisySearchMoves[moveIndex]);
            key = tables.parents[key];
        }
        return moves.join(" ");
    }

    function getTopEdgeSideFace(cubie) {
        if (cubie.y !== 1) return null;
        if (cubie.x === 1) return "R";
        if (cubie.x === -1) return "L";
        if (cubie.z === 1) return "F";
        if (cubie.z === -1) return "B";
        return null;
    }

    function applyMoveToStateCopy(state, token) {
        const move = parseMove(token);
        if (!move) throw new Error(`Unsupported tutorial move ${token}.`);
        getAffectedCubies(state, move).forEach(cubie => rotateCubie(cubie, move));
    }

    function getWhiteCrossDemoPlan(state) {
        const whiteEdges = state.filter(cubie =>
            Object.keys(cubie.stickers).length === 2 &&
            Object.values(cubie.stickers).includes(faces.D.color)
        );
        if (whiteEdges.length !== 4) {
            throw new Error(`Expected four white edges for the cross demo, found ${whiteEdges.length}.`);
        }
        if (!whiteEdges.every(edge =>
            edge.y === 1 &&
            Object.keys(edge.stickers).find(face => edge.stickers[face] === faces.D.color) === "U"
        )) {
            return { moves: getPatternSolution(state, "white-cross"), highlights: [] };
        }

        const working = cloneCubeState(state);
        const edgeIds = whiteEdges.map(edge => edge.id);
        const moves = [];
        const highlights = [];
        const rotations = [[], ["U"], ["U2"], ["U'"]];

        edgeIds.forEach(edgeId => {
            let matchedRotation = null;
            let matchedSideFace = null;
            for (const rotation of rotations) {
                const candidate = cloneCubeState(working);
                rotation.forEach(token => applyMoveToStateCopy(candidate, token));
                const edge = candidate.find(cubie => cubie.id === edgeId);
                const sideFace = getTopEdgeSideFace(edge);
                if (sideFace && edge.stickers[sideFace] === faces[sideFace].color) {
                    matchedRotation = rotation;
                    matchedSideFace = sideFace;
                    break;
                }
            }
            if (matchedRotation === null || matchedSideFace === null) {
                throw new Error(`Could not align white edge ${edgeId} with its center.`);
            }

            const startIndex = moves.length;
            matchedRotation.forEach(token => {
                moves.push(token);
                applyMoveToStateCopy(working, token);
            });
            const edge = working.find(cubie => cubie.id === edgeId);
            const sideFace = getTopEdgeSideFace(edge);
            const center = working.find(cubie =>
                Object.keys(cubie.stickers).length === 1 &&
                cubie.stickers[sideFace] === faces[sideFace].color
            );
            if (!center) throw new Error(`Could not find the ${sideFace} center for white edge ${edgeId}.`);

            moves.push(`${sideFace}2`);
            applyMoveToStateCopy(working, `${sideFace}2`);
            highlights.push({
                startIndex,
                endIndex: moves.length,
                edgeId,
                centerId: center.id,
                color: edge.stickers[sideFace],
                sideFace
            });
        });

        const crossSolved = edgeIds.every(edgeId => {
            const edge = working.find(cubie => cubie.id === edgeId);
            const whiteFace = Object.keys(edge.stickers).find(face => edge.stickers[face] === faces.D.color);
            const homePosition = [0, 0, 0];
            Object.values(edge.stickers).forEach(color => {
                const homeFace = Object.keys(faces).find(face => faces[face].color === color);
                normals[homeFace].forEach((value, index) => { homePosition[index] += value; });
            });
            return whiteFace === "D" &&
                edge.x === homePosition[0] &&
                edge.y === homePosition[1] &&
                edge.z === homePosition[2];
        });
        if (!crossSolved) throw new Error("The daisy-to-cross plan did not align all four white edges.");
        return { moves: moves.join(" "), highlights };
    }

    const patternPlannerCache = new Map();
    const rightCornerInsert = "R U R' U'";
    const leftCornerInsert = "L' U' L U";
    const rightMiddleInsert = `U ${rightCornerInsert} y ${leftCornerInsert} y'`;
    const leftMiddleInsert = `U' ${leftCornerInsert} y' ${rightCornerInsert} y`;
    const backRightMiddleInsert = `y2 ${rightMiddleInsert} y2`;
    const backLeftMiddleInsert = `y2 ${leftMiddleInsert} y2`;
    const yellowCrossAlgorithm = "F R U R' U' F'";
    const cornerCycleAlgorithm = "U R U' L' U R' U' L";
    const yellowEdgeAlgorithm = "R U R' U R U2 R' U";
    const cornerTwistTwice = `${rightCornerInsert} ${rightCornerInsert}`;
    const cornerTwistFourTimes = `${cornerTwistTwice} ${cornerTwistTwice}`;
    // Six Righties restore the cube, so inverse pairs can be shown as forward Righties.
    const cornerTwistInverseAliases = {
        [inverseAlgorithm(cornerTwistTwice).join(" ")]: cornerTwistFourTimes,
        [inverseAlgorithm(cornerTwistFourTimes).join(" ")]: cornerTwistTwice
    };
    const cornerCycleMacros = [
        cornerCycleAlgorithm,
        `U ${cornerCycleAlgorithm} U'`,
        `U' ${cornerCycleAlgorithm} U`,
        `U2 ${cornerCycleAlgorithm} U2`
    ];
    const cornerTwistMacros = ["D", "D'", "D2", cornerTwistTwice, cornerTwistFourTimes];
    const tutorialPatternConfigs = {
        "white-cross": { piece: "edge", color: "white", goal: "exact", macros: daisySearchMoves },
        "white-corners": {
            piece: "corner",
            color: "white",
            goal: "exact",
            macros: [
                "U", "U'", "U2",
                rightCornerInsert,
                leftCornerInsert,
                "F U F' U'",
                "F' U' F U",
                `y2 ${rightCornerInsert} y2`,
                `y2 ${leftCornerInsert} y2`
            ]
        },
        "middle-layer": {
            piece: "edge",
            color: "middle",
            goal: "exact",
            macros: [
                "U", "U'", "U2",
                rightMiddleInsert,
                leftMiddleInsert,
                backRightMiddleInsert,
                backLeftMiddleInsert
            ]
        },
        "yellow-cross": { piece: "edge", color: "yellow", goal: "oriented", macros: ["U", "U'", "U2", yellowCrossAlgorithm] },
        "yellow-corner-orientation": {
            piece: "corner",
            color: "yellow",
            goal: "exact",
            frameRotation: "x2",
            inverseMacroAliases: cornerTwistInverseAliases,
            macros: cornerTwistMacros
        },
        "place-corners": { piece: "corner", color: "yellow", goal: "positioned", macros: cornerCycleMacros },
        "yellow-edges": {
            piece: "edge",
            color: "yellow",
            goal: "exact",
            macros: ["U", "U'", "U2", yellowEdgeAlgorithm]
        }
    };

    function getTutorialPieceSpecs(state, config) {
        const white = faces.D.color;
        const yellow = faces.U.color;
        const faceForColor = new Map(Object.entries(faces).map(([face, definition]) => [definition.color, face]));
        const pieceStickerCount = config.piece === "edge" ? 2 : 3;
        const frameRotation = config.frameRotation ? parseMove(config.frameRotation) : null;
        if (config.frameRotation && !frameRotation) throw new Error(`Unsupported planner frame rotation ${config.frameRotation}.`);
        return state
            .filter(cubie => {
                if (Object.keys(cubie.stickers).length !== pieceStickerCount) return false;
                const colors = Object.values(cubie.stickers);
                if (config.color === "white") return colors.includes(white);
                if (config.color === "yellow") return colors.includes(yellow);
                return !colors.includes(white) && !colors.includes(yellow);
            })
            .sort((left, right) => left.id.localeCompare(right.id))
            .map(cubie => {
                const colors = Object.values(cubie.stickers);
                const markerColor = config.color === "middle" ? colors.slice().sort()[0] : config.color === "white" ? white : yellow;
                const homePosition = [0, 0, 0];
                colors.forEach(color => {
                    const homeFace = faceForColor.get(color);
                    if (!homeFace) throw new Error(`Could not identify the home face for cubie color ${color}.`);
                    normals[homeFace].forEach((value, index) => { homePosition[index] += value; });
                });
                const markerFace = faceForColor.get(markerColor);
                const homeNormal = normals[markerFace];
                return {
                    id: cubie.id,
                    markerColor,
                    homePosition: frameRotation
                        ? rotateVector(homePosition, frameRotation.axis, frameRotation.quarterTurns)
                        : homePosition,
                    homeNormal: frameRotation
                        ? rotateVector(homeNormal, frameRotation.axis, frameRotation.quarterTurns)
                        : homeNormal
                };
            });
    }

    function buildPatternPlanner(config, pieces) {
        const positionDimensionCount = config.piece === "edge" ? 2 : 3;
        const positions = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if ([x, y, z].filter(value => value !== 0).length === positionDimensionCount) positions.push([x, y, z]);
                }
            }
        }
        const positionKey = position => position.join(",");
        const positionIndices = new Map(positions.map((position, index) => [positionKey(position), index]));
        const orientationVectors = positions.map(position => {
            const vectors = [];
            if (position[0] !== 0) vectors.push([position[0], 0, 0]);
            if (position[1] !== 0) vectors.push([0, position[1], 0]);
            if (position[2] !== 0) vectors.push([0, 0, position[2]]);
            return vectors;
        });
        const orientationCount = positionDimensionCount;
        const actions = [];
        const actionIndices = new Map();
        const inverseMacroAliases = config.inverseMacroAliases || {};
        config.macros.forEach(macro => {
            const tokens = macro.split(/\s+/).filter(Boolean);
            [tokens, inverseAlgorithm(tokens.join(" "))].forEach(action => {
                const actionKey = action.join(" ");
                const canonicalAction = (inverseMacroAliases[actionKey] || actionKey).split(/\s+/);
                const canonicalKey = canonicalAction.join(" ");
                if (actionIndices.has(canonicalKey)) return;
                actionIndices.set(canonicalKey, actions.length);
                actions.push(canonicalAction);
            });
        });
        const inverseActionIndices = actions.map(action => {
            const inverseKey = inverseAlgorithm(action.join(" ")).join(" ");
            return actionIndices.get(inverseMacroAliases[inverseKey] || inverseKey);
        });
        const transitions = new Uint8Array(positions.length * orientationCount * actions.length);

        for (let positionIndex = 0; positionIndex < positions.length; positionIndex++) {
            for (let orientation = 0; orientation < orientationCount; orientation++) {
                const stateIndex = positionIndex * orientationCount + orientation;
                actions.forEach((action, actionIndex) => {
                    let position = positions[positionIndex];
                    let stickerNormal = orientationVectors[positionIndex][orientation];
                    action.forEach(token => {
                        const move = parseMove(token);
                        const coordinateIndex = move.axis === "x" ? 0 : move.axis === "y" ? 1 : 2;
                        if (!move.layers.includes(position[coordinateIndex])) return;
                        position = rotateVector(position, move.axis, move.quarterTurns);
                        stickerNormal = rotateVector(stickerNormal, move.axis, move.quarterTurns);
                    });
                    const nextPositionIndex = positionIndices.get(positionKey(position));
                    const nextOrientation = orientationVectors[nextPositionIndex].findIndex(vector =>
                        vector.every((value, index) => value === stickerNormal[index])
                    );
                    transitions[stateIndex * actions.length + actionIndex] = nextPositionIndex * orientationCount + nextOrientation;
                });
            }
        }

        const goalStates = pieces.map(piece => {
            if (config.goal === "oriented" || config.goal === "positioned") return null;
            const positionIndex = positionIndices.get(positionKey(piece.homePosition));
            const orientation = orientationVectors[positionIndex].findIndex(vector =>
                vector.every((value, index) => value === piece.homeNormal[index])
            );
            return positionIndex * orientationCount + orientation;
        });
        const orientedGoalStates = config.goal === "oriented"
            ? positions
                .map((position, index) => ({ position, index }))
                .filter(({ position }) => position[1] === 1)
                .map(({ index }) => index * orientationCount + orientationVectors[index].findIndex(vector => vector[0] === 0 && vector[1] === 1 && vector[2] === 0))
            : null;
        const goalOptionsByPiece = config.goal === "oriented"
            ? pieces.map(() => orientedGoalStates)
            : config.goal === "positioned"
                ? pieces.map(piece => {
                    const positionIndex = positionIndices.get(positionKey(piece.homePosition));
                    return orientationVectors[positionIndex].map((_, orientation) =>
                        positionIndex * orientationCount + orientation
                    );
                })
                : null;
        const stateCount = 1 << 20;
        const parents = new Int32Array(stateCount);
        parents.fill(-1);
        const nextActions = new Int8Array(stateCount);
        nextActions.fill(-1);
        const queue = new Uint32Array(stateCount);
        let queueEnd = 0;

        function addGoalPermutations(depth, usedMask, key) {
            if (depth === pieces.length) {
                parents[key] = key;
                queue[queueEnd++] = key;
                return;
            }
            const options = goalOptionsByPiece ? goalOptionsByPiece[depth] : [goalStates[depth]];
            options.forEach((goalState, index) => {
                const goalOptionsAreUnique = config.goal === "oriented";
                if (goalOptionsAreUnique && (usedMask & (1 << index))) return;
                addGoalPermutations(
                    depth + 1,
                    goalOptionsAreUnique ? usedMask | (1 << index) : usedMask,
                    key | (goalState << (depth * 5))
                );
            });
        }
        addGoalPermutations(0, 0, 0);

        let queueStart = 0;
        while (queueStart < queueEnd) {
            const key = queue[queueStart++];
            const states = [
                key & 31,
                (key >>> 5) & 31,
                (key >>> 10) & 31,
                (key >>> 15) & 31
            ];
            for (let actionIndex = 0; actionIndex < actions.length; actionIndex++) {
                const nextKey = states.reduce((packedKey, state, pieceIndex) =>
                    packedKey | (transitions[state * actions.length + actionIndex] << (pieceIndex * 5)), 0);
                if (parents[nextKey] !== -1) continue;
                parents[nextKey] = key;
                nextActions[nextKey] = inverseActionIndices[actionIndex];
                queue[queueEnd++] = nextKey;
            }
        }
        return { positions, positionIndices, orientationVectors, orientationCount, actions, transitions, goalStates, parents, nextActions };
    }

    function getPatternStateIndices(state, pieces, tables, stepId) {
        const faceForColor = new Map(Object.entries(faces).map(([face, definition]) => [definition.color, face]));
        return pieces.map(piece => {
            const cubie = state.find(item => item.id === piece.id);
            const positionIndex = tables.positionIndices.get(`${cubie.x},${cubie.y},${cubie.z}`);
            const markerFace = Object.keys(cubie.stickers).find(face => cubie.stickers[face] === piece.markerColor);
            if (positionIndex === undefined || !markerFace || !faceForColor.has(piece.markerColor)) {
                throw new Error(`Could not locate a piece while planning ${stepId}.`);
            }
            const orientation = tables.orientationVectors[positionIndex].findIndex(vector =>
                vector.every((value, index) => value === normals[markerFace][index])
            );
            if (orientation < 0) throw new Error(`Could not determine a piece orientation while planning ${stepId}.`);
            return positionIndex * tables.orientationCount + orientation;
        });
    }

    function getPatternSolution(state, stepId) {
        const config = tutorialPatternConfigs[stepId];
        if (!config) throw new Error(`No beginner solving plan is configured for ${stepId}.`);
        const workingState = config.frameRotation ? cloneCubeState(state) : state;
        if (config.frameRotation) {
            const frameRotation = parseMove(config.frameRotation);
            if (!frameRotation || frameRotation.layers.length !== 3) {
                throw new Error(`Planner frame rotation ${config.frameRotation} must rotate the whole cube.`);
            }
            workingState.forEach(cubie => rotateCubie(cubie, frameRotation));
        }
        const pieces = getTutorialPieceSpecs(workingState, config);
        if (pieces.length !== 4) throw new Error(`Expected four pieces for ${stepId}, found ${pieces.length}.`);
        let tables = patternPlannerCache.get(stepId);
        if (!tables) {
            tables = buildPatternPlanner(config, pieces);
            patternPlannerCache.set(stepId, tables);
        }

        const stateIndices = getPatternStateIndices(workingState, pieces, tables, stepId);
        let key = stateIndices.reduce((packedKey, stateIndex, pieceIndex) =>
            packedKey | (stateIndex << (pieceIndex * 5)), 0);
        if (tables.parents[key] === -1) throw new Error(`Could not find a solution for the ${stepId} pieces.`);

        const moves = [];
        while (tables.parents[key] !== key) {
            const actionIndex = tables.nextActions[key];
            if (actionIndex < 0) throw new Error(`The ${stepId} solution path is incomplete.`);
            moves.push(...tables.actions[actionIndex]);
            key = tables.parents[key];
        }
        return moves.join(" ");
    }

    function getNextWhiteCornerInsertion(state) {
        const stepId = "white-corners";
        const config = tutorialPatternConfigs[stepId];
        const pieces = getTutorialPieceSpecs(state, config);
        let tables = patternPlannerCache.get(stepId);
        if (!tables) {
            tables = buildPatternPlanner(config, pieces);
            patternPlannerCache.set(stepId, tables);
        }
        const stateIndices = getPatternStateIndices(state, pieces, tables, stepId);
        const solvedIndices = stateIndices
            .map((stateIndex, index) => stateIndex === tables.goalStates[index] ? index : -1)
            .filter(index => index >= 0);
        if (solvedIndices.length === pieces.length) return null;

        const targetIndex = stateIndices.findIndex((stateIndex, index) => stateIndex !== tables.goalStates[index]);
        const allowedActions = tables.actions
            .map((_, actionIndex) => actionIndex)
            .filter(actionIndex => solvedIndices.every(pieceIndex =>
                tables.transitions[tables.goalStates[pieceIndex] * tables.actions.length + actionIndex] === tables.goalStates[pieceIndex]
            ));
        const startKey = stateIndices.reduce((key, stateIndex, pieceIndex) =>
            key | (stateIndex << (pieceIndex * 5)), 0);
        const stateCount = 1 << 20;
        const parents = new Int32Array(stateCount);
        parents.fill(-1);
        const nextActions = new Int8Array(stateCount);
        nextActions.fill(-1);
        const queue = new Uint32Array(stateCount);
        let queueEnd = 1;
        let queueStart = 0;
        let goalKey = -1;
        parents[startKey] = startKey;
        queue[0] = startKey;

        while (queueStart < queueEnd && goalKey === -1) {
            const key = queue[queueStart++];
            if (((key >>> (targetIndex * 5)) & 31) === tables.goalStates[targetIndex]) {
                goalKey = key;
                break;
            }
            for (const actionIndex of allowedActions) {
                let nextKey = 0;
                for (let pieceIndex = 0; pieceIndex < pieces.length; pieceIndex++) {
                    const pieceState = (key >>> (pieceIndex * 5)) & 31;
                    const nextPieceState = tables.transitions[pieceState * tables.actions.length + actionIndex];
                    nextKey |= nextPieceState << (pieceIndex * 5);
                }
                if (parents[nextKey] !== -1) continue;
                parents[nextKey] = key;
                nextActions[nextKey] = actionIndex;
                queue[queueEnd++] = nextKey;
            }
        }
        if (goalKey === -1) throw new Error(`Could not find a white-corner insertion for ${pieces[targetIndex].id}.`);

        const actionPath = [];
        for (let key = goalKey; key !== startKey; key = parents[key]) {
            const actionIndex = nextActions[key];
            if (actionIndex < 0) throw new Error("The white-corner insertion path is incomplete.");
            actionPath.push(actionIndex);
        }
        actionPath.reverse();
        return {
            placedCount: solvedIndices.length,
            cornerId: pieces[targetIndex].id,
            piece: pieces[targetIndex],
            moves: actionPath.flatMap(actionIndex => tables.actions[actionIndex]).join(" ")
        };
    }

    function getBeginnerDemoAlgorithm(step) {
        if (step.id === "daisy") return getDaisySolution(cubies);
        if (step.id === "white-cross") return getWhiteCrossDemoPlan(cubies).moves;
        if (step.id === "white-corners") {
            const cornerPlan = getNextWhiteCornerInsertion(cubies);
            return cornerPlan ? cornerPlan.moves : "";
        }
        const solution = getPatternSolution(cubies, step.id);
        if (step.id !== "yellow-corner-orientation" || !solution) return solution;
        return `x2 ${solution} x2`;
    }

    function renderBeginnerStepList() {
        const container = document.getElementById("beginner-step-list");
        container.replaceChildren();
        beginnerSteps.forEach((step, index) => {
            const button = document.createElement("button");
            button.className = "step-card";
            button.type = "button";
            button.setAttribute("aria-current", index === activeBeginnerStep ? "step" : "false");

            const top = document.createElement("span");
            top.className = "step-card-top";
            const number = document.createElement("span");
            number.textContent = `STEP ${String(index + 1).padStart(2, "0")}`;
            const stage = document.createElement("span");
            stage.textContent = index < 2 ? "White layer" : index < 4 ? "First 2 layers" : "Last layer";
            const title = document.createElement("strong");
            title.textContent = step.shortTitle;
            const summary = document.createElement("small");
            summary.textContent = step.title;
            top.append(number, stage);
            button.append(top, title, summary);
            button.addEventListener("click", () => selectBeginnerStep(index));
            container.appendChild(button);
        });
    }

    function selectBeginnerStep(index) {
        if (tutorialMode && (busy || moveQueue.length > 0)) {
            cubeStatus.textContent = "Wait for the current turns to finish.";
            return;
        }
        if (!Number.isInteger(index) || index < 0 || index >= beginnerSteps.length) return;
        if (index > activeBeginnerStep + 1) {
            cubeStatus.textContent = "Complete one step at a time.";
            return;
        }
        if (index > activeBeginnerStep && getBeginnerDemoAlgorithm(beginnerSteps[activeBeginnerStep])) {
            cubeStatus.textContent = `Finish ${beginnerSteps[activeBeginnerStep].shortTitle} before moving on.`;
            return;
        }
        activeBeginnerStep = index;
        renderBeginnerStepList();
        if (tutorialMode) loadBeginnerDemo();
    }

    function loadCornerPracticeDemo(plan) {
        const practice = document.getElementById("corner-practice");
        practice.hidden = activeBeginnerStep !== beginnerSteps.findIndex(step => step.id === "white-corners");
        if (cornerPracticeTimer !== null) window.clearTimeout(cornerPracticeTimer);
        cornerPracticeTimer = null;
        isPlayingCornerPractice = false;
        cornerPracticeCanInteract = Boolean(plan);
        cornerPracticeSequence = plan ? plan.moves.split(/\s+/).filter(Boolean) : [];
        cornerPracticeInitialState = cloneCubeState(cubies);
        cornerPracticeCubies = cloneCubeState(cornerPracticeInitialState);
        cornerPracticeViewRotation.x = defaultCornerPracticeViewRotation.x;
        cornerPracticeViewRotation.y = defaultCornerPracticeViewRotation.y;
        renderCornerPracticeCube(cornerPracticeCubies);

        const title = document.getElementById("corner-practice-title");
        const description = document.getElementById("corner-practice-description");
        const moves = document.getElementById("corner-practice-moves");
        const playButton = document.getElementById("corner-practice-play");
        document.getElementById("corner-practice-status").textContent = "";
        if (!plan) {
            title.textContent = "All four corners are placed";
            cornerPracticeDescription = "The separate cube shows the finished white corners. Your main tutorial cube is unchanged.";
            description.textContent = cornerPracticeDescription;
            moves.textContent = "";
            playButton.textContent = "Corners complete";
            updateCornerPracticeControls();
            return;
        }

        const target = cubies.find(cubie => cubie.id === plan.cornerId);
        const whiteStickerFace = Object.keys(target.stickers).find(face => target.stickers[face] === faces.D.color);
        const faceNames = { U: "up", D: "down", L: "left", R: "right", F: "front", B: "back" };
        const layer = target.y === 1 ? "top" : "bottom";
        title.textContent = `${plan.placedCount} of 4 white corners placed`;
        cornerPracticeDescription = `The next white corner is in the ${layer} layer with its white sticker facing ${faceNames[whiteStickerFace]}. Keep the white cross on the bottom, match the corner's two other colors to the side centers beside its slot, and place it above that slot. The main tutorial cube will not move.`;
        description.textContent = cornerPracticeDescription;
        moves.textContent = plan.moves.replace(/'/g, "′");
        playButton.textContent = "▶ Play on guide cube";
        updateCornerPracticeControls();
        if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
            window.requestAnimationFrame(() => {
                if (cornerPracticeCanInteract && !isPlayingCornerPractice) playCornerPracticeSolution();
            });
        }
    }

    function updateCornerPracticeControls() {
        const busyWithPracticeMove = isPlayingCornerPractice;
        document.getElementById("corner-practice-play").disabled =
            busyWithPracticeMove || !cornerPracticeCanInteract || cornerPracticeSequence.length === 0;
        document.getElementById("corner-practice-reset").disabled = !cornerPracticeCanInteract;
        document.querySelectorAll("[data-practice-move]").forEach(button => {
            button.disabled = busyWithPracticeMove || !cornerPracticeCanInteract;
        });
    }

    function animateCornerPracticeMove(move, onComplete) {
        const selected = getAffectedCubies(cornerPracticeCubies, move);
        if (selected.length === 0) throw new Error("A guide-cube move did not select any pieces.");
        const layer = document.createElement("div");
        layer.className = "turn-layer corner-practice-turn-layer";
        const root = document.getElementById("corner-practice-root");
        root.appendChild(layer);
        selected.forEach(cubie => layer.appendChild(cubie.element));

        const cssQuarterTurns = move.axis === "y" ? move.quarterTurns : -move.quarterTurns;
        const axisName = move.axis.toUpperCase();
        layer.style.transform = `rotate${axisName}(0deg)`;
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                layer.style.transform = `rotate${axisName}(${cssQuarterTurns * 90}deg)`;
            });
        });
        const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 650;
        cornerPracticeTimer = window.setTimeout(() => {
            selected.forEach(cubie => rotateCubie(cubie, move));
            renderCornerPracticeCube(cornerPracticeCubies);
            cornerPracticeTimer = null;
            onComplete();
        }, duration);
    }

    function resetCornerPracticeCube() {
        if (!cornerPracticeCanInteract) return;
        if (cornerPracticeTimer !== null) window.clearTimeout(cornerPracticeTimer);
        cornerPracticeTimer = null;
        isPlayingCornerPractice = false;
        cornerPracticeCubies = cloneCubeState(cornerPracticeInitialState);
        cornerPracticeViewRotation.x = defaultCornerPracticeViewRotation.x;
        cornerPracticeViewRotation.y = defaultCornerPracticeViewRotation.y;
        renderCornerPracticeCube(cornerPracticeCubies);
        document.getElementById("corner-practice-description").textContent = cornerPracticeDescription;
        document.getElementById("corner-practice-status").textContent = "Guide cube reset to this corner case.";
        updateCornerPracticeControls();
    }

    function turnCornerPracticeCube(token) {
        if (!cornerPracticeCanInteract || isPlayingCornerPractice) return;
        const move = parseMove(token);
        if (!move) throw new Error(`Unsupported guide-cube move ${token}.`);
        isPlayingCornerPractice = true;
        document.getElementById("corner-practice-status").textContent =
            `Turning ${token.replace("'", "′")} on the guide cube.`;
        updateCornerPracticeControls();
        animateCornerPracticeMove(move, () => {
            isPlayingCornerPractice = false;
            document.getElementById("corner-practice-status").textContent =
                `Turned ${token.replace("'", "′")} on the guide cube.`;
            updateCornerPracticeControls();
        });
    }

    function playCornerPracticeSolution() {
        if (!cornerPracticeCanInteract || isPlayingCornerPractice || cornerPracticeSequence.length === 0) return;
        cornerPracticeCubies = cloneCubeState(cornerPracticeInitialState);
        renderCornerPracticeCube(cornerPracticeCubies);
        isPlayingCornerPractice = true;
        document.getElementById("corner-practice-status").textContent = "Playing the corner insertion on the guide cube.";
        updateCornerPracticeControls();

        const moves = cornerPracticeSequence.slice();
        function playNextMove() {
            cornerPracticeTimer = null;
            if (!isPlayingCornerPractice) return;
            if (moves.length === 0) {
                isPlayingCornerPractice = false;
                document.getElementById("corner-practice-play").textContent = "▶ Replay corner insertion";
                document.getElementById("corner-practice-status").textContent =
                    "Corner inserted on the guide cube. Replay resets it to the starting case.";
                updateCornerPracticeControls();
                return;
            }
            const token = moves.shift();
            const move = parseMove(token);
            if (!move) throw new Error(`Unsupported corner-practice move ${token}.`);
            animateCornerPracticeMove(move, () => {
                cornerPracticeTimer = window.setTimeout(playNextMove, getMoveDelay());
            });
        }
        playNextMove();
    }

    function loadBeginnerDemo(preserveCompletedMoves = false) {
        if (busy || moveQueue.length > 0) {
            cubeStatus.textContent = "Wait for the current turns to finish.";
            return;
        }
        const step = beginnerSteps[activeBeginnerStep];
        const whiteCrossPlan = step.id === "white-cross" ? getWhiteCrossDemoPlan(cubies) : null;
        const cornerPlan = step.id === "white-corners" ? getNextWhiteCornerInsertion(cubies) : null;
        tutorialHighlightSegments = whiteCrossPlan ? whiteCrossPlan.highlights : [];
        const nextSequence = whiteCrossPlan
            ? whiteCrossPlan.moves
            : step.id === "white-corners"
                ? cornerPlan ? cornerPlan.moves : ""
            : getBeginnerDemoAlgorithm(step);
        const completedTokens = tutorialMoveTokens;
        const completedIndex = tutorialMoveIndex;
        if (preserveCompletedMoves && !nextSequence && completedTokens.length > 0 && completedIndex === completedTokens.length) {
            tutorialMoveTokens = completedTokens;
            tutorialMoveIndex = completedIndex;
            activeAlgorithmSequence = completedTokens.join(" ");
        } else {
            activeAlgorithmSequence = nextSequence;
            tutorialMoveTokens = activeAlgorithmSequence.trim().split(/\s+/).filter(Boolean);
            tutorialMoveIndex = 0;
        }
        updateTutorialHighlights();
        loadCornerPracticeDemo(cornerPlan);
        renderCubeViews();

        document.getElementById("tutorial-demo-step").textContent =
            `STEP ${String(activeBeginnerStep + 1).padStart(2, "0")} / ${String(beginnerSteps.length).padStart(2, "0")}`;
        document.getElementById("tutorial-demo-title").textContent = step.title;
        document.getElementById("tutorial-demo-description").textContent = step.description;
        document.getElementById("tutorial-demo-tip").textContent = step.tip;
        const reference = step.reference;
        document.getElementById("tutorial-reference-note").textContent = reference.note;
        document.getElementById("tutorial-reference-moves").textContent = reference.moves || "";
        document.getElementById("tutorial-reference-algorithm").hidden = !reference.moves;
        const referenceLink = document.getElementById("tutorial-reference-link");
        referenceLink.href = reference.url;
        referenceLink.textContent = `${reference.label} ↗`;
        document.getElementById("tutorial-demo-moves").textContent = tutorialMoveTokens.join(" ").replace(/'/g, "′");
        document.getElementById("tutorial-demo-move-label").textContent = "Moves for this step";
        document.getElementById("tutorial-previous").disabled = activeBeginnerStep === 0;
        document.getElementById("tutorial-next").disabled = activeBeginnerStep === beginnerSteps.length - 1;
        document.getElementById("tutorial-scramble").hidden = step.id !== "daisy";
        updateTutorialMoveControls();
        cubeStatus.textContent = nextSequence ? `${step.shortTitle} demo ready` : `${step.shortTitle} complete`;
    }

    function startBeginnerTutorial(newScramble) {
        if (busy || moveQueue.length > 0) {
            cubeStatus.textContent = "Wait for the current turns to finish.";
            return;
        }
        if (newScramble) beginnerDaisyScramble = createBeginnerScramble();
        activeBeginnerStep = 0;
        moveQueue.length = 0;
        pendingCase = null;
        isPlayingAlgorithm = false;
        isPlayingBeginnerStage = false;
        isPlayingTutorialPlayback = false;
        preserveCompletedTutorialMoves = false;
        tutorialMoveTokens = [];
        tutorialMoveIndex = 0;
        tutorialHighlightSegments = [];
        activeTutorialHighlight = null;
        cubeRoot.replaceChildren();
        makeCube();
        beginnerDaisyScramble.forEach(applyMoveToState);
        casePermutationArrows = [];
        viewRotation.x = defaultViewRotation.x;
        viewRotation.y = defaultViewRotation.y;
        viewRotation.z = 0;
        viewAlignment = { x: 0, y: 0, z: 0 };
        updateCubeView();
        renderCubeViews();
        renderBeginnerStepList();
        loadBeginnerDemo();
    }

    function openBeginnerDemo() {
        tutorialMode = true;
        document.querySelector(".workspace").classList.add("tutorial-mode");
        document.getElementById("tutorial-cube-guide").hidden = false;
        document.getElementById("case-dialog-title").textContent = "Beginner tutorial";
        document.getElementById("cube-title").textContent = "Beginner practice cube";
        document.getElementById("cube-workspace").setAttribute("aria-label", "Beginner tutorial and 3D cube");
        caseDialog.setAttribute("aria-label", "Beginner tutorial and 3D cube");
        caseDialog.showModal();
        startBeginnerTutorial(true);
    }

    function scrambleBeginnerDaisyDemo() {
        startBeginnerTutorial(true);
    }

    function renderCaseGrid() {
        const query = document.getElementById("case-search").value.trim().toLowerCase();
        const visibleCases = cases.filter(caseItem => {
            const solutionText = caseItem.solutions.map(solution => solution.moves).join(" ");
            const text = `${caseItem.name} ${caseItem.kicker} ${caseItem.description} ${solutionText}`.toLowerCase();
            return caseItem.category === activeCategory && text.includes(query);
        });
        caseGrid.replaceChildren();
        if (visibleCases.length === 0) {
            const empty = document.createElement("p");
            empty.className = "empty-cases";
            empty.textContent = "No cases match that search.";
            caseGrid.appendChild(empty);
            return;
        }
        visibleCases.forEach(caseItem => {
            const card = document.createElement("button");
            const learningStatus = getCaseLearningStatus(caseItem);
            card.className = `case-card${learningStatus === "known" ? " is-solved" : learningStatus === "learning" ? " is-learning" : ""}`;
            card.type = "button";
            card.dataset.caseId = caseItem.id;
            card.setAttribute("aria-pressed", String(selectedCase !== null && selectedCase.id === caseItem.id));

            const meta = document.createElement("span");
            meta.className = "case-card-meta";
            meta.innerHTML = `<span>${caseItem.category}</span><span>${caseItem.kicker.split("·")[0].trim()}</span>`;
            const titleRow = document.createElement("div");
            titleRow.className = "case-card-title-row";
            const preview = document.createElement("div");
            preview.className = `case-card-preview ${caseItem.category.toLowerCase()}`;
            preview.setAttribute("aria-hidden", "true");
            preview.appendChild(createCasePatternGrid(caseItem, getCasePreviewState(caseItem)));
            const title = document.createElement("strong");
            title.className = "case-card-title";
            title.textContent = caseItem.name;
            titleRow.append(preview, title);
            const pattern = document.createElement("span");
            pattern.className = "case-card-pattern";
            pattern.textContent = caseItem.recognition;
            const algorithm = document.createElement("code");
            algorithm.className = "case-card-alg";
            const turnCount = getPreparedCase(caseItem).algorithm.trim().split(/\s+/).length;
            algorithm.textContent = `${turnCount} turns`;
            const completion = document.createElement("span");
            completion.className = "case-card-completion";
            completion.textContent = learningStatus === "known" ? "Solved · Know one solution" : "Learning";
            completion.hidden = learningStatus === "not-seen";
            card.append(meta, titleRow, pattern, algorithm, completion);
            card.addEventListener("click", () => {
                loadCase(caseItem);
                caseDialog.showModal();
            });
            caseGrid.appendChild(card);
        });
    }

    function setCategory(category) {
        activeCategory = category;
        document.querySelectorAll(".case-tab").forEach(tab => {
            const isActive = tab.dataset.category === category;
            tab.classList.toggle("active", isActive);
            tab.setAttribute("aria-pressed", String(isActive));
        });
        document.getElementById("case-search").value = "";
        renderCaseGrid();
        const firstCase = cases.find(caseItem => caseItem.category === category);
        if (firstCase) loadCase(firstCase);
    }

    document.querySelectorAll(".case-tab").forEach(tab => {
        tab.addEventListener("click", () => setCategory(tab.dataset.category));
    });
    document.getElementById("algorithm-choice").addEventListener("change", event => {
        const solutionIndex = Number(event.currentTarget.value);
        if (selectedCase && Number.isInteger(solutionIndex) && selectedCase.solutions[solutionIndex]) {
            loadCase(selectedCase, solutionIndex);
        }
    });
    document.getElementById("apply-custom-algorithm").addEventListener("click", applyCustomAlgorithm);
    document.getElementById("delete-custom-algorithm").addEventListener("click", deleteCustomAlgorithm);
    document.getElementById("custom-algorithm-input").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            applyCustomAlgorithm();
        }
    });
    document.getElementById("turn-gap").addEventListener("input", event => {
        document.getElementById("turn-gap-value").textContent = `${event.currentTarget.value} ms`;
    });
    const tutorialDelayInput = document.getElementById("tutorial-move-delay");
    const tutorialDelayEnabled = document.getElementById("tutorial-delay-enabled");
    function updateTutorialDelayControl() {
        tutorialDelayInput.disabled = !tutorialDelayEnabled.checked;
        document.getElementById("tutorial-delay-value").textContent =
            tutorialDelayEnabled.checked ? `${tutorialDelayInput.value} ms` : "Off";
    }
    tutorialDelayInput.addEventListener("input", updateTutorialDelayControl);
    tutorialDelayEnabled.addEventListener("change", updateTutorialDelayControl);
    updateTutorialDelayControl();
    document.getElementById("previous-case").addEventListener("click", () => navigateCase(-1));
    document.getElementById("next-case").addEventListener("click", () => navigateCase(1));
    document.getElementById("case-search").addEventListener("input", renderCaseGrid);
    document.getElementById("close-case-dialog").addEventListener("click", () => caseDialog.close());
    document.getElementById("open-beginner-tutorial").addEventListener("click", openBeginnerDemo);
    document.getElementById("tutorial-previous").addEventListener("click", () => selectBeginnerStep(activeBeginnerStep - 1));
    document.getElementById("tutorial-next").addEventListener("click", () => selectBeginnerStep(activeBeginnerStep + 1));
    document.getElementById("tutorial-play").addEventListener("click", () => {
        const remainingMoves = tutorialMoveTokens.slice(tutorialMoveIndex);
        if (remainingMoves.length === 0) {
            cubeStatus.textContent = `${beginnerSteps[activeBeginnerStep].shortTitle} is already complete.`;
            return;
        }
        isPlayingBeginnerStage = tutorialMode;
        isPlayingTutorialPlayback = tutorialMode;
        preserveCompletedTutorialMoves = false;
        enqueue(remainingMoves.join(" "));
    });
    document.getElementById("tutorial-move-back").addEventListener("click", () => stepTutorialMove(-1));
    document.getElementById("tutorial-move-next").addEventListener("click", () => stepTutorialMove(1));
    document.getElementById("corner-practice-play").addEventListener("click", playCornerPracticeSolution);
    document.getElementById("corner-practice-reset").addEventListener("click", resetCornerPracticeCube);
    document.querySelectorAll("[data-practice-move]").forEach(button => {
        button.addEventListener("click", () => turnCornerPracticeCube(button.dataset.practiceMove));
    });
    const cornerPracticeStage = document.getElementById("corner-practice-stage");
    cornerPracticeStage.addEventListener("pointerdown", event => {
        if (event.button !== 0 || cornerPracticePointer !== null || isPlayingCornerPractice) return;
        cornerPracticePointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            viewX: cornerPracticeViewRotation.x,
            viewY: cornerPracticeViewRotation.y
        };
        cornerPracticeStage.setPointerCapture(event.pointerId);
        cornerPracticeStage.classList.add("is-dragging");
    });
    cornerPracticeStage.addEventListener("pointermove", event => {
        if (!cornerPracticePointer || event.pointerId !== cornerPracticePointer.id) return;
        cornerPracticeViewRotation.x =
            cornerPracticePointer.viewX - (event.clientY - cornerPracticePointer.y) * 0.5;
        cornerPracticeViewRotation.y =
            cornerPracticePointer.viewY + (event.clientX - cornerPracticePointer.x) * 0.5;
        updateCornerPracticeView();
    });
    function finishCornerPracticeDrag(event) {
        if (!cornerPracticePointer || event.pointerId !== cornerPracticePointer.id) return;
        cornerPracticePointer = null;
        cornerPracticeStage.classList.remove("is-dragging");
    }
    cornerPracticeStage.addEventListener("pointerup", finishCornerPracticeDrag);
    cornerPracticeStage.addEventListener("pointercancel", finishCornerPracticeDrag);
    document.getElementById("tutorial-reset").addEventListener("click", () => startBeginnerTutorial(false));
    document.getElementById("tutorial-scramble").addEventListener("click", scrambleBeginnerDaisyDemo);
    caseDialog.addEventListener("close", () => {
        if (!tutorialMode) return;
        tutorialMode = false;
        isPlayingBeginnerStage = false;
        isPlayingTutorialPlayback = false;
        preserveCompletedTutorialMoves = false;
        tutorialHighlightSegments = [];
        activeTutorialHighlight = null;
        if (cornerPracticeTimer !== null) window.clearTimeout(cornerPracticeTimer);
        cornerPracticeTimer = null;
        isPlayingCornerPractice = false;
        document.querySelector(".workspace").classList.remove("tutorial-mode");
        document.getElementById("tutorial-cube-guide").hidden = true;
        document.getElementById("case-dialog-title").textContent = "Case and cube";
        document.getElementById("cube-title").textContent = "Case on the cube";
        document.getElementById("cube-workspace").setAttribute("aria-label", "Algorithm case and 3D cube");
        caseDialog.setAttribute("aria-label", "Algorithm case and 3D cube");
        if (selectedCase && busy) {
            moveQueue.length = 0;
            pendingCase = selectedCase;
            pendingAlgorithmIndex = selectedAlgorithmIndex;
        } else if (selectedCase) {
            loadCase(selectedCase, selectedAlgorithmIndex);
        }
    });
    document.querySelectorAll(".move-button").forEach(button => button.addEventListener("click", () => {
        if (tutorialMode) {
            isPlayingBeginnerStage = true;
            isPlayingTutorialPlayback = false;
            preserveCompletedTutorialMoves = false;
        }
        enqueue(button.dataset.move);
    }));
    function updateCubeView() {
        cubeOrbit.style.transform = `rotateX(${viewRotation.x}deg) rotateY(${viewRotation.y}deg) rotateZ(${viewRotation.z || 0}deg) rotateX(${viewAlignment.x}deg) rotateY(${viewAlignment.y}deg) rotateZ(${viewAlignment.z}deg)`;
    }

    function rotateCubeView(deltaX, deltaY) {
        viewRotation.x += deltaX;
        viewRotation.y += deltaY;
        updateCubeView();
    }

    document.getElementById("rotate-cube-left").addEventListener("click", () => rotateCubeView(0, -90));
    document.getElementById("rotate-cube-right").addEventListener("click", () => rotateCubeView(0, 90));
    document.getElementById("rotate-cube-up").addEventListener("click", () => rotateCubeView(90, 0));
    document.getElementById("rotate-cube-down").addEventListener("click", () => rotateCubeView(-90, 0));
    document.getElementById("reset-cube-view").addEventListener("click", () => {
        viewRotation.x = defaultViewRotation.x;
        viewRotation.y = defaultViewRotation.y;
        updateCubeView();
    });

    let activePointer = null;
    cubeStage.addEventListener("pointerdown", event => {
        if (event.button !== 0 || activePointer !== null) return;
        activePointer = {
            id: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            viewX: viewRotation.x,
            viewY: viewRotation.y
        };
        cubeStage.setPointerCapture(event.pointerId);
        cubeStage.classList.add("is-dragging");
    });
    cubeStage.addEventListener("pointermove", event => {
        if (!activePointer || event.pointerId !== activePointer.id) return;
        viewRotation.x = activePointer.viewX - (event.clientY - activePointer.y) * 0.5;
        viewRotation.y = activePointer.viewY + (event.clientX - activePointer.x) * 0.5;
        updateCubeView();
    });
    function finishCubeViewDrag(event) {
        if (!activePointer || event.pointerId !== activePointer.id) return;
        activePointer = null;
        cubeStage.classList.remove("is-dragging");
    }
    cubeStage.addEventListener("pointerup", finishCubeViewDrag);
    cubeStage.addEventListener("pointercancel", finishCubeViewDrag);
    document.getElementById("play-algorithm").addEventListener("click", () => {
        if (selectedCase && !pendingCase) {
            isPlayingAlgorithm = true;
            enqueue(activeAlgorithmSequence);
        }
    });
    document.getElementById("reset-cube").addEventListener("click", () => {
        if (selectedCase) loadCase(selectedCase, selectedAlgorithmIndex);
    });

    makeCube();
    renderBeginnerStepList();
    renderCaseGrid();
    loadCase(cases.find(caseItem => caseItem.id === "pll-aa"));
    const account = window.CUBE_CLUB_ACCOUNT;
    if (account && typeof account.onSessionChange === "function") {
        account.onSessionChange(handleAccountSessionChange);
    }
    window.addEventListener("resize", () => {
        if (!busy && moveQueue.length === 0) cubies.forEach(drawCubie);
    });
})();
