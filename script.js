(() => {
    const faces = {
        U: { axis: "y", sign: 1, color: "#f0eee3" },
        D: { axis: "y", sign: -1, color: "#f3d54b" },
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

    const cases = [
        ...ollAlgorithms.map((algorithm, index) => ({
            id: `oll-${String(index + 1).padStart(2, "0")}`,
            category: "OLL",
            name: `OLL ${index + 1}`,
            kicker: `Orientation · case ${index + 1}`,
            description: "Orient the last layer while keeping the lower two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "Match the yellow-sticker pattern on the cube and keep yellow on top as you start the algorithm.",
            algorithm
        })),
        ...pllAlgorithms.map(([name, algorithm]) => ({
            id: `pll-${name.toLowerCase()}`,
            category: "PLL",
            name: `${name} Perm`,
            kicker: `Permutation · ${name}`,
            description: "Permute the last-layer pieces while keeping the first two layers solved. The cube is loaded into this case using the inverse of the displayed algorithm.",
            recognition: "The preview shows the top-layer permutation with the last layer oriented.",
            algorithm
        }))
    ];

    const cubeRoot = document.getElementById("cube-root");
    const cubeStatus = document.getElementById("cube-status");
    const moveQueue = [];
    let busy = false;
    let activeCategory = "PLL";
    let selectedCase = null;
    let pendingCase = null;
    let cubies = [];
    const unit = () => parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--unit"));

    function makeCube() {
        cubies = [];
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    const stickers = {};
                    for (const [face, normal] of Object.entries(normals)) {
                        if (x * normal[0] + y * normal[1] + z * normal[2] === 1) stickers[face] = faces[face].color;
                    }
                    const element = document.createElement("div");
                    element.className = "cubie";
                    const cubie = { x, y, z, stickers, element };
                    cubies.push(cubie);
                    cubeRoot.appendChild(element);
                    drawCubie(cubie);
                }
            }
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

    function renderCase(caseItem) {
        const categoryCases = cases.filter(item => item.category === caseItem.category);
        const caseNumber = categoryCases.findIndex(item => item.id === caseItem.id) + 1;
        document.getElementById("case-category").textContent = caseItem.category;
        document.getElementById("case-index").textContent = `CASE ${String(caseNumber).padStart(2, "0")} / ${String(categoryCases.length).padStart(2, "0")}`;
        document.getElementById("progress-fill").style.width = `${(caseNumber / categoryCases.length) * 100}%`;
        document.getElementById("case-kicker").textContent = caseItem.kicker;
        document.getElementById("case-title").textContent = caseItem.name;
        document.getElementById("case-description").textContent = caseItem.description;
        document.getElementById("case-recognition").textContent = caseItem.recognition;
        document.getElementById("algorithm-label").textContent = "Tap a move to animate it on the cube";
        renderAlgorithm(caseItem.algorithm);
        document.querySelectorAll(".case-card").forEach(card => {
            card.setAttribute("aria-pressed", String(card.dataset.caseId === caseItem.id));
        });
    }

    function loadCase(caseItem) {
        moveQueue.length = 0;
        if (busy) {
            pendingCase = caseItem;
            cubeStatus.textContent = `Loading ${caseItem.name}…`;
            return;
        }
        pendingCase = null;
        selectedCase = caseItem;
        cubeRoot.replaceChildren();
        makeCube();
        inverseAlgorithm(caseItem.algorithm).forEach(applyMoveToState);
        renderCase(caseItem);
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
            cubeStatus.textContent = moveQueue.length ? "Next move…" : "Ready to explore";
            busy = false;
            if (pendingCase) {
                const nextCase = pendingCase;
                pendingCase = null;
                loadCase(nextCase);
                return;
            }
            processQueue();
        }, duration);
    }

    const caseGrid = document.getElementById("case-grid");

    function renderCaseGrid() {
        const query = document.getElementById("case-search").value.trim().toLowerCase();
        const visibleCases = cases.filter(caseItem => {
            const text = `${caseItem.name} ${caseItem.kicker} ${caseItem.description} ${caseItem.algorithm}`.toLowerCase();
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
            const title = document.createElement("strong");
            title.className = "case-card-title";
            title.textContent = caseItem.name;
            const pattern = document.createElement("span");
            pattern.className = "case-card-pattern";
            pattern.textContent = caseItem.recognition;
            const algorithm = document.createElement("code");
            algorithm.className = "case-card-alg";
            algorithm.textContent = caseItem.algorithm.replace(/'/g, "′");
            card.append(meta, title, pattern, algorithm);
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
    document.getElementById("case-search").addEventListener("input", renderCaseGrid);
    document.querySelectorAll(".move-button").forEach(button => button.addEventListener("click", () => enqueue(button.dataset.move)));
    document.getElementById("play-algorithm").addEventListener("click", () => {
        if (selectedCase && !pendingCase) enqueue(selectedCase.algorithm);
    });
    document.getElementById("reset-cube").addEventListener("click", () => {
        if (selectedCase) loadCase(selectedCase);
    });

    makeCube();
    renderCaseGrid();
    loadCase(cases.find(caseItem => caseItem.id === "pll-t"));
    window.addEventListener("resize", () => {
        if (!busy && moveQueue.length === 0) cubies.forEach(drawCubie);
    });
})();
