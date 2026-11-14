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
    const faceNames = {
        U: { name: "Up", position: "Top face" },
        D: { name: "Down", position: "Bottom face" },
        L: { name: "Left", position: "Left side" },
        R: { name: "Right", position: "Right side" },
        F: { name: "Front", position: "Facing you" },
        B: { name: "Back", position: "Facing away" }
    };
    const moveDefinitions = {
        U: { axis: "y", sign: 1, layers: [1], face: "U", label: "Up face" },
        D: { axis: "y", sign: -1, layers: [-1], face: "D", label: "Down face" },
        R: { axis: "x", sign: 1, layers: [1], face: "R", label: "Right face" },
        L: { axis: "x", sign: -1, layers: [-1], face: "L", label: "Left face" },
        F: { axis: "z", sign: 1, layers: [1], face: "F", label: "Front face" },
        B: { axis: "z", sign: -1, layers: [-1], face: "B", label: "Back face" },
        u: { axis: "y", sign: 1, layers: [0, 1], label: "Up wide turn" },
        d: { axis: "y", sign: -1, layers: [-1, 0], label: "Down wide turn" },
        r: { axis: "x", sign: 1, layers: [0, 1], label: "Right wide turn" },
        l: { axis: "x", sign: -1, layers: [-1, 0], label: "Left wide turn" },
        f: { axis: "z", sign: 1, layers: [0, 1], label: "Front wide turn" },
        b: { axis: "z", sign: -1, layers: [-1, 0], label: "Back wide turn" },
        M: { axis: "x", sign: -1, layers: [0], label: "Middle slice (like L)" },
        E: { axis: "y", sign: -1, layers: [0], label: "Equator slice (like D)" },
        S: { axis: "z", sign: 1, layers: [0], label: "Standing slice (like F)" },
        x: { axis: "x", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like R)" },
        y: { axis: "y", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like U)" },
        z: { axis: "z", sign: 1, layers: [-1, 0, 1], label: "Whole cube rotation (like F)" }
    };
    const ollAlgorithms = `
R U2 R' R' F R F' U2 R' F R F'
F R U R' U' F' f R U R' U' f'
y' f R U R' U' f' U' F R U R' U' F'
y' f R U R' U' f' U F R U R' U' F'
r' U2 R U R' U r
r U2 R' U' R U' r'
r U R' U R U2 r'
y2 r' U' R U' R' U2 r
y R U R' U' R' F R U R U' R' F'
R U R' U R' F R F' R U2 R'
M R U R' U R U2 R' U M'
y' M' R' U' R U' R' U2 R U' M
r U' r' U' r U r' F' U F
R' F R U R' F' R F U' F'
r' U' r R' U' R U r' U r
r U r' R U R' U' r U' r'
R U R' U R' F R F' U2 R' F R F'
y R U2 R2 F R F' U2 M' U R U' r'
M U R U R' U' M' R' F R F'
r U R' U' M2 U R U' R' U' M'
R U R' U R U' R' U R U2 R'
R U2 R2 U' R2 U' R2 U2 R
R2 D R' U2 R D' R' U2 R'
r U R' U' r' F R F'
y F' r U R' U' r' F R
y R U2 R' U' R U' R'
R U R' U R U2 R'
r U R' U' M U R U' R'
r2 D' r U r' D r2 U' r' U' r
y2 F U R U2 R' U' R U2 R' U' F'
R' U' F U R U' R' F' R
S R U R' U' R' F R f'
R U R' U' R' F R F'
y2 R U R2 U' R' F R U R U' F'
R U2 R2 F R F' R U2 R'
y2 L' U' L U' L' U L U L F' L' F
F R U' R' U' R U R' F'
R U R' U R U' R' U' R' F R F'
y L F' L' U' L U F U' L'
y R' F R U R' U' F' U R
y2 R U R' U R U2 R' F R U R' U' F'
R' U' R U' R' U2 R F R U R' U' F'
y R' U' F' U F R
f R U R' U' f'
F R U R' U' F'
R' U' R' F R F' U R
F' L' U' L U L' U' L U F
F R U R' U' R U R' U' F'
y2 r U' r2 U r2 U r2 U' r
r' U r2 U' r2 U' r2 U r'
f R U R' U' R U R' U' f'
y2 R' F' U' F U' R U R' U R
r' U' R U' R' U R U' R' U2 r
r U R' U R U' R' U R U2 r'
R U2 R2 U' R U' R' U2 F R F'
r U r' U R U' R' U R U' R' r U' r'
R U R' U' M' U R U' r'
`.trim().split(/\r?\n/);

    const pllAlgorithms = [
        ["Aa", "x R' U R' D2 R U' R' D2 R2 x'"],
        ["Ab", "x R2 D2 R U R' D2 R U' R x'"],
        ["E", "y x' R U' R' D R U R' D' R U R' D R U' R' D' x"],
        ["F", "y R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R"],
        ["Ga", "R2 U R' U R' U' R U' R2 D U' R' U R D'"],
        ["Gb", "R' U' R U D' R2 U R' U R U' R U' R2 D"],
        ["Gc", "R2 U' R U' R U R' U R2 D' U R U' R' D"],
        ["Gd", "R U R' U' D R2 U' R U' R' U R' U R2 D'"],
        ["H", "M2 U' M2 U2 M2 U' M2"],
        ["Ja", "y R' U L' U2 R U' R' U2 R L"],
        ["Jb", "R U R' F' R U R' U' R' F R2 U' R'"],
        ["Na", "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'"],
        ["Nb", "R' U R U' R' F' U' F R U R' F R' F' R U' R"],
        ["Ra", "y R U' R' U' R U R D R' U' R D' R' U2 R'"],
        ["Rb", "R' U2 R U2 R' F R U R' U' R' F' R2"],
        ["T", "R U R' U' R' F R2 U' R' U' R U R' F'"],
        ["Ua", "y2 R U' R U R U R U' R' U' R2"],
        ["Ub", "R' U R' U' R' U' R' U R U R2"],
        ["V", "R' U R' U' R D' R' D R' U D' R2 U' R2 D R2"],
        ["Y", "F R U' R' U' R U R' F' R U R' U' R' F R F'"],
        ["Z", "M' U' M2 U' M2 U' M' U2 M2"]
    ];

    function getCaseSolutions(caseId, currentAlgorithm) {
        const onlineSolutions = window.CUBE_ALGORITHM_VARIANTS[caseId];
        if (!Array.isArray(onlineSolutions) || onlineSolutions.length === 0) {
            throw new Error(`No online algorithms were loaded for ${caseId}.`);
        }
        const solutions = [];
        const seenMoves = new Set();
        const addSolution = (solution, label = solution.label) => {
            const moves = solution.moves.trim().replace(/\s+/g, " ");
            if (seenMoves.has(moves)) return;
            seenMoves.add(moves);
            const moveCount = moves.split(" ").length;
            const hasSpeedCubeMetrics = Number.isFinite(solution.stm) && Number.isFinite(solution.etm);
            solutions.push({
                label,
                moves,
                votes: Number.isFinite(solution.votes) ? solution.votes : 0,
                etm: hasSpeedCubeMetrics ? solution.etm : null,
                stm: hasSpeedCubeMetrics ? solution.stm : null,
                hasSpeedCubeMetrics
            });
        };
        for (const solution of onlineSolutions) {
            addSolution(solution);
        }
        addSolution({ label: "Current algorithm", moves: currentAlgorithm });

        const rankedSolutions = solutions.filter(solution => solution.hasSpeedCubeMetrics);
        if (rankedSolutions.length === 0) {
            throw new Error(`No SpeedCubeDB move metrics were loaded for ${caseId}.`);
        }
        const easiest = rankedSolutions.reduce((best, solution) =>
            solution.stm < best.stm ||
            (solution.stm === best.stm && solution.etm < best.etm) ||
            (solution.stm === best.stm && solution.etm === best.etm && solution.moves.length < best.moves.length)
                ? solution
                : best
        );
        const popularSolutions = rankedSolutions.filter(solution => solution.votes > 0);
        const mostPopular = popularSolutions.length
            ? popularSolutions.reduce((best, solution) =>
                solution.votes > best.votes ||
                (solution.votes === best.votes && solution.stm < best.stm)
                    ? solution
                    : best
            )
            : null;

        const orderedSolutions = [easiest];
        if (mostPopular && mostPopular !== easiest) orderedSolutions.push(mostPopular);
        for (const solution of solutions) {
            if (!orderedSolutions.includes(solution)) orderedSolutions.push(solution);
        }

        return orderedSolutions.map(solution => {
            const recommendations = [];
            if (solution === easiest) recommendations.push("Easiest");
            if (solution === mostPopular) recommendations.push("Most popular");
            const recommendationLabel = recommendations.length
                ? `${recommendations.join(" + ")} · `
                : "";
            const moveCount = solution.moves.split(" ").length;
            const stats = [solution.hasSpeedCubeMetrics ? `${solution.stm} STM` : `${moveCount} moves`];
            if (solution.votes > 0) stats.push(`${solution.votes} votes`);
            return { ...solution, label: `${recommendationLabel}${solution.label} · ${stats.join(" · ")}` };
        });
    }

    const cases = [
        ...ollAlgorithms.map((algorithm, index) => ({
            id: `oll-${String(index + 1).padStart(2, "0")}`,
            category: "OLL",
            name: `OLL ${index + 1}`,
            kicker: `Orientation · case ${index + 1}`,
            description: "Orient the last layer while keeping the lower two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "Match the yellow-sticker pattern on the cube and keep yellow on top as you start the algorithm.",
            algorithm,
            solutions: getCaseSolutions(`oll-${String(index + 1).padStart(2, "0")}`, algorithm),
            sourceUrl: `https://speedcubedb.com/a/3x3/OLL/OLL_${index + 1}`
        })),
        ...pllAlgorithms.map(([name, algorithm]) => ({
            id: `pll-${name.toLowerCase()}`,
            category: "PLL",
            name: `${name} Perm`,
            kicker: `Permutation · ${name}`,
            description: "Permute the last-layer pieces while keeping the first two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "The preview shows the top-layer permutation with the last layer oriented.",
            algorithm,
            solutions: getCaseSolutions(`pll-${name.toLowerCase()}`, algorithm),
            sourceUrl: `https://speedcubedb.com/a/3x3/PLL/${name}`
        }))
    ];

    const cubeRoot = document.getElementById("cube-root");
    const cubeStatus = document.getElementById("cube-status");
    const moveQueue = [];
    let busy = false;
    let activeCategory = "PLL";
    let selectedCase = null;
    let selectedAlgorithmIndex = 0;
    let pendingCase = null;
    let pendingAlgorithmIndex = 0;
    let cubies = [];
    let casePermutationArrows = [];
    const casePreviewStates = new Map();
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
        const cacheKey = `${caseItem.id}:${solutionIndex}`;
        if (casePreviewStates.has(cacheKey)) return casePreviewStates.get(cacheKey);
        const state = createSolvedCubeState();
        inverseAlgorithm(caseItem.solutions[solutionIndex].moves).forEach(token => {
            const move = parseMove(token);
            if (!move) return;
            state.filter(cubie => {
                const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
                return move.layers.includes(coordinate);
            }).forEach(cubie => rotateCubie(cubie, move));
        });
        casePreviewStates.set(cacheKey, state);
        return state;
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

    function getCasePermutationArrows(algorithm) {
        const finalPositions = cubies.map(({ id, x, y, z }) => ({ id, x, y, z }));
        algorithm.trim().split(/\s+/).forEach(token => {
            const move = parseMove(token);
            if (!move) return;
            finalPositions.filter(cubie => {
                const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
                return move.layers.includes(coordinate);
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
        const selected = cubies.filter(cubie => {
            const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
            return move.layers.includes(coordinate);
        });
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

    function renderCase(caseItem, solutionIndex) {
        const categoryCases = cases.filter(item => item.category === caseItem.category);
        const caseNumber = categoryCases.findIndex(item => item.id === caseItem.id) + 1;
        const selectedSolution = caseItem.solutions[solutionIndex];
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
        caseItem.solutions.forEach((solution, index) => {
            const option = document.createElement("option");
            option.value = String(index);
            option.textContent = `${index + 1}. ${solution.label}`;
            algorithmChoice.appendChild(option);
        });
        algorithmChoice.value = String(solutionIndex);
        document.getElementById("algorithm-source").href = caseItem.sourceUrl;
        document.getElementById("algorithm-label").textContent = `${selectedSolution.label} · tap a move to animate it`;
        renderAlgorithm(selectedSolution.moves);
        document.querySelectorAll(".case-card").forEach(card => {
            card.setAttribute("aria-pressed", String(card.dataset.caseId === caseItem.id));
        });
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
        casePermutationArrows = caseItem.category === "PLL" ? getCasePermutationArrows(algorithm) : [];
        renderCubeViews();
        renderCase(caseItem, solutionIndex);
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
        const selected = cubies.filter(cubie => {
            const coordinate = move.axis === "x" ? cubie.x : move.axis === "y" ? cubie.y : cubie.z;
            return move.layers.includes(coordinate);
        });
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
        const duration = matchMedia("(prefers-reduced-motion: reduce)").matches ? 30 : 520;
        window.setTimeout(() => {
            selected.forEach(cubie => {
                rotateCubie(cubie, move);
                cubeRoot.appendChild(cubie.element);
                drawCubie(cubie);
            });
            layer.remove();
            renderCubeViews();
            cubeStatus.textContent = moveQueue.length ? "Next move…" : "Ready to explore";
            busy = false;
            if (pendingCase) {
                const nextCase = pendingCase;
                const nextAlgorithmIndex = pendingAlgorithmIndex;
                pendingCase = null;
                loadCase(nextCase, nextAlgorithmIndex);
                return;
            }
            processQueue();
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
            algorithm.textContent = caseItem.algorithm.replace(/'/g, "′");
            card.append(meta, titleRow, pattern, algorithm);
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

    const faceGuideGrid = document.getElementById("face-guide-grid");
    for (const face of ["U", "D", "L", "R", "F", "B"]) {
        const card = document.createElement("article");
        card.className = "face-guide-card";

        const demo = document.createElement("button");
        demo.className = "face-demo";
        demo.type = "button";
        demo.setAttribute("aria-label", `Animate ${face}: ${faceNames[face].position.toLowerCase()} clockwise`);

        const stage = document.createElement("span");
        stage.className = "face-cube-stage";
        stage.setAttribute("aria-hidden", "true");
        const miniCube = document.createElement("span");
        miniCube.className = "mini-cube";
        miniCube.dataset.face = face;
        for (const stickerFace of Object.keys(normals)) {
            const sticker = document.createElement("i");
            sticker.className = `mini-face mini-face-${stickerFace}`;
            miniCube.appendChild(sticker);
        }
        stage.appendChild(miniCube);
        demo.appendChild(stage);

        const copy = document.createElement("span");
        copy.className = "face-guide-copy";
        copy.innerHTML = `<span class="face-guide-name"><code>${face}</code> ${faceNames[face].name}</span><span class="face-guide-hint">${faceNames[face].position}</span><span class="face-guide-hint">Tap to turn clockwise</span>`;
        demo.appendChild(copy);
        demo.addEventListener("click", () => enqueue(face));
        card.appendChild(demo);

        const reverse = document.createElement("button");
        reverse.className = "face-reverse";
        reverse.type = "button";
        reverse.textContent = `${face}′ · Turn counterclockwise`;
        reverse.setAttribute("aria-label", `Animate ${face} prime: ${faceNames[face].position.toLowerCase()} counterclockwise`);
        reverse.addEventListener("click", () => enqueue(`${face}'`));
        card.appendChild(reverse);
        faceGuideGrid.appendChild(card);
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
    document.getElementById("previous-case").addEventListener("click", () => navigateCase(-1));
    document.getElementById("next-case").addEventListener("click", () => navigateCase(1));
    document.getElementById("case-search").addEventListener("input", renderCaseGrid);
    document.querySelectorAll(".move-button").forEach(button => button.addEventListener("click", () => enqueue(button.dataset.move)));
    document.getElementById("play-algorithm").addEventListener("click", () => {
        if (selectedCase && !pendingCase) enqueue(selectedCase.solutions[selectedAlgorithmIndex].moves);
    });
    document.getElementById("reset-cube").addEventListener("click", () => {
        if (selectedCase) loadCase(selectedCase, selectedAlgorithmIndex);
    });

    makeCube();
    renderCaseGrid();
    loadCase(cases.find(caseItem => caseItem.id === "pll-t"));
    window.addEventListener("resize", () => {
        if (!busy && moveQueue.length === 0) cubies.forEach(drawCubie);
    });
})();
