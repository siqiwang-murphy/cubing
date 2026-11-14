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
        M: { axis: "x", sign: -1, layers: [0], label: "Middle slice (like L)" },
        E: { axis: "y", sign: -1, layers: [0], label: "Equator slice (like D)" },
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
                const threeQuarterTurn = token.match(/^([URFDLBurfdlbMESxyz])3$/);
                if (threeQuarterTurn) token = `${threeQuarterTurn[1]}'`;
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
    let pendingCase = null;
    let pendingAlgorithmIndex = 0;
    let cubies = [];
    let casePermutationArrows = [];
    const casePreviewStates = new Map();
    const algorithmLearningStorageKey = "cube-club.algorithm-learning-status.v1";
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
    const defaultViewRotation = { x: -24, y: -34 };
    const viewRotation = { ...defaultViewRotation };
    let viewAlignment = { x: 0, y: 0, z: 0 };
    let isPlayingAlgorithm = false;
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
            sticker.style.backgroundColor = color;
            sticker.setAttribute("aria-hidden", "true");
            cubie.element.appendChild(sticker);
        }
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

    function isCaseSolved(caseItem) {
        return caseItem.solutions.some((_, index) => getAlgorithmLearningState(caseItem, index).id === "known");
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
            algorithmLearningStatuses[getAlgorithmLearningKey(caseItem, selectedSolutionIndex)] = nextState.id;
            try {
                window.localStorage.setItem(algorithmLearningStorageKey, JSON.stringify(algorithmLearningStatuses));
                algorithmLearningStorageMessage = "";
            } catch (error) {
                console.error("Could not save algorithm learning status.", error);
                algorithmLearningStorageMessage = "Could not save this status in the browser.";
            }
            renderAlgorithmLearningStatuses(caseItem, selectedSolutionIndex);
            renderCaseGrid();
            container.querySelector(`[data-solution-index="${selectedSolutionIndex}"]`).focus();
        });
        container.appendChild(button);
        document.getElementById("algorithm-status-message").textContent = algorithmLearningStorageMessage;
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
            // Centers stay fixed except for wide, S-slice, and whole-cube turns.
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
        document.getElementById("custom-algorithm-status").textContent = customSolution
            ? "A custom algorithm is available in this case's solution list."
            : "Enter moves such as R, R', R2, r, M, or x.";
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
        loadCase(selectedCase, solutionIndex);
        status.textContent = "Custom algorithm added to this case's solutions.";
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

    function processQueue() {
        if (busy || moveQueue.length === 0) return;
        busy = true;
        const token = moveQueue.shift();
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
                const gap = Number(document.getElementById("turn-gap").value);
                cubeStatus.textContent = `Next move in ${gap} ms`;
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
        }, duration);
    }

    const caseGrid = document.getElementById("case-grid");

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
            card.className = "case-card";
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
            completion.textContent = "Solved · Know one solution";
            completion.hidden = !isCaseSolved(caseItem);
            card.append(meta, titleRow, pattern, algorithm, completion);
            card.addEventListener("click", () => loadCase(caseItem));
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
    document.getElementById("custom-algorithm-input").addEventListener("keydown", event => {
        if (event.key === "Enter") {
            event.preventDefault();
            applyCustomAlgorithm();
        }
    });
    document.getElementById("turn-gap").addEventListener("input", event => {
        document.getElementById("turn-gap-value").textContent = `${event.currentTarget.value} ms`;
    });
    document.getElementById("previous-case").addEventListener("click", () => navigateCase(-1));
    document.getElementById("next-case").addEventListener("click", () => navigateCase(1));
    document.getElementById("case-search").addEventListener("input", renderCaseGrid);
    document.querySelectorAll(".move-button").forEach(button => button.addEventListener("click", () => enqueue(button.dataset.move)));
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
    renderCaseGrid();
    loadCase(cases.find(caseItem => caseItem.id === "pll-aa"));
    window.addEventListener("resize", () => {
        if (!busy && moveQueue.length === 0) cubies.forEach(drawCubie);
    });
})();
