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
    const cases = [
        {
            id: "oll-sune", category: "OLL", name: "Sune", kicker: "Orientation · corner pattern",
            description: "A classic last-layer orientation case. Keep yellow on top and hold the cube so the unsolved corner pattern faces you.",
            recognition: "One top-layer corner is oriented; the Sune pattern twists the remaining corners while preserving the lower two layers.",
            algorithm: "R U R' U R U2 R'"
        },
        {
            id: "oll-antisune", category: "OLL", name: "Anti-Sune", kicker: "Orientation · corner pattern",
            description: "The mirrored Sune case. Keep yellow on top and use the same front face throughout the sequence.",
            recognition: "This is the opposite corner-twist direction from Sune. Match the pattern, then play the sequence to orient the top.",
            algorithm: "R U2 R' U' R U' R'"
        },
        {
            id: "pll-t", category: "PLL", name: "T Perm", kicker: "Permutation · corners + edges",
            description: "A common last-layer permutation that swaps a pair of corners and a pair of edges. The top face is already oriented.",
            recognition: "Look for two adjacent corners that need to swap, along with the matching edge swap. The algorithm keeps the first two layers intact.",
            algorithm: "R U R' U' R' F R2 U' R' U' R U R' F'"
        },
        {
            id: "pll-ua", category: "PLL", name: "Ua Perm", kicker: "Permutation · edge cycle",
            description: "A three-edge cycle with the corners already in their correct positions. The U-a algorithm cycles the top edges.",
            recognition: "The corners match their side centers; three top edges need to cycle around the layer.",
            algorithm: "R U' R U R U R U' R' U' R2"
        }
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
            return coordinate * move.sign === 1;
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
        const face = token[0].toUpperCase();
        const info = faces[face];
        if (!info) return null;
        const direction = token.includes("'") ? -1 : 1;
        const turns = token.includes("2") ? 2 : 1;
        return { face, axis: info.axis, sign: info.sign, quarterTurns: -info.sign * direction * turns };
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
            button.setAttribute("aria-label", `Animate ${button.textContent}: turn the ${faceNames[move.face].name} face ${direction}`);
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
            return coordinate * move.sign === 1;
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
