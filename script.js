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
    const lessons = [
        {
            short: "The white cross", kicker: "Start with the edges", title: "Make a white cross",
            description: "Find the four white edge pieces and bring them around the white center. Match the other color on each edge with its center too—white on top, colors lined up on the sides.",
            tip: "The center pieces never move relative to one another. They tell you where every color belongs.",
            label: "A handy move", algorithm: "F R U R′ U′ F′",
            demo: "F R U R' U' F'"
        },
        {
            short: "White corners", kicker: "Finish the first layer", title: "Slot in the corners",
            description: "Find a white corner in the bottom layer. Turn the bottom until it sits directly below its matching home, then repeat the corner move until it clicks into place.",
            tip: "Keep white on top. If a corner is stuck in the wrong spot, use the same move to bring it back down first.",
            label: "Repeat until it fits", algorithm: "R U R′ U′",
            demo: "R U R' U'"
        },
        {
            short: "Middle layer", kicker: "Build the second layer", title: "Fill the middle edges",
            description: "Look on the bottom for an edge with no yellow. Match its front color to the center, then use the left or right sequence to insert it.",
            tip: "If all the useful edges are already in the middle but misplaced, use an insertion sequence to pop one out.",
            label: "Insert to the right", algorithm: "U R U′ R′ U′ F′ U F",
            demo: "U R U' R' U' F' U F"
        },
        {
            short: "Yellow cross", kicker: "Turn the cube over", title: "Make a yellow cross",
            description: "With yellow on top, use the sequence to move from a dot to an L, then a line, then a cross. You may need to do it more than once.",
            tip: "For the L, hold its arms at the back and left. For the line, hold it horizontally.",
            label: "Repeat as needed", algorithm: "F R U R′ U′ F′",
            demo: "F R U R' U' F'"
        },
        {
            short: "Yellow corners", kicker: "Orient the last layer", title: "Point yellow corners up",
            description: "Keep yellow on top. Repeat the sequence until the front-right top corner shows yellow on top. Turn only the top layer to bring the next unsolved corner there.",
            tip: "The cube may look scrambled halfway through—keep the same front face and finish the full sequence.",
            label: "Corner-orienting sequence", algorithm: "R U R′ U R U2 R′",
            demo: "R U R' U R U2 R'"
        },
        {
            short: "Last layer", kicker: "One final loop", title: "Line up the last pieces",
            description: "Turn the top layer to place matching corners, then cycle the remaining edges. Repeat the sequence and use a top-layer turn between tries until every side matches.",
            tip: "You’ve got this: keep yellow on top and don’t rotate the whole cube during the sequence.",
            label: "Cycle the corners", algorithm: "U R U′ L′ U R′ U′ L",
            demo: "U R U' L' U R' U' L"
        }
    ];

    const cubeRoot = document.getElementById("cube-root");
    const cubeStatus = document.getElementById("cube-status");
    const moveQueue = [];
    let busy = false;
    let currentLesson = 0;
    let cubies = [];
    let lastMove = "F R U R' U' F'";
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

    function parseMove(token) {
        const face = token[0].toUpperCase();
        const info = faces[face];
        if (!info) return null;
        const direction = token.includes("'") ? -1 : 1;
        const turns = token.includes("2") ? 2 : 1;
        return { face, axis: info.axis, sign: info.sign, quarterTurns: -info.sign * direction * turns };
    }

    function enqueue(sequence) {
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
        if (token === "@reset") {
            cubeRoot.replaceChildren();
            makeCube();
            cubeStatus.textContent = "Cube reset";
            busy = false;
            processQueue();
            return;
        }
        if (token === "@pause") {
            window.setTimeout(() => {
                cubeStatus.textContent = "Scramble complete — watch the solve";
                busy = false;
                processQueue();
            }, 650);
            return;
        }
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
            for (const cubie of selected) {
                const position = rotateVector([cubie.x, cubie.y, cubie.z], move.axis, move.quarterTurns);
                [cubie.x, cubie.y, cubie.z] = position;
                const rotatedStickers = {};
                for (const [face, color] of Object.entries(cubie.stickers)) {
                    rotatedStickers[faceFromNormal(rotateVector(normals[face], move.axis, move.quarterTurns))] = color;
                }
                cubie.stickers = rotatedStickers;
                cubeRoot.appendChild(cubie.element);
                drawCubie(cubie);
            }
            layer.remove();
            cubeStatus.textContent = moveQueue.length ? "Next move…" : "Ready to explore";
            busy = false;
            processQueue();
        }, duration);
    }

    function renderLesson(index) {
        currentLesson = Math.max(0, Math.min(lessons.length - 1, index));
        const lesson = lessons[currentLesson];
        document.getElementById("step-count").textContent = `STEP ${String(currentLesson + 1).padStart(2, "0")} / 06`;
        document.getElementById("step-short-name").textContent = lesson.short;
        document.getElementById("progress-fill").style.width = `${((currentLesson + 1) / lessons.length) * 100}%`;
        document.getElementById("lesson-kicker").textContent = lesson.kicker;
        document.getElementById("lesson-title").textContent = lesson.title;
        document.getElementById("lesson-description").textContent = lesson.description;
        document.getElementById("lesson-tip").textContent = lesson.tip;
        document.getElementById("algorithm-label").textContent = lesson.label;
        document.getElementById("algorithm-code").textContent = lesson.algorithm;
        document.getElementById("previous-step").disabled = currentLesson === 0;
        document.getElementById("next-step").innerHTML = currentLesson === lessons.length - 1
            ? 'Start again <span class="arrow" aria-hidden="true">↻</span>'
            : 'Next step <span class="arrow" aria-hidden="true">→</span>';
        lastMove = lesson.demo;
        document.querySelectorAll(".step-card").forEach((card, cardIndex) => {
            if (cardIndex === currentLesson) card.setAttribute("aria-current", "step");
            else card.removeAttribute("aria-current");
        });
    }

    const stepGrid = document.getElementById("steps-grid");
    lessons.forEach((lesson, index) => {
        const button = document.createElement("button");
        button.className = "step-card";
        button.type = "button";
        button.innerHTML = `<span class="step-card-top"><span>STEP ${String(index + 1).padStart(2, "0")}</span><span aria-hidden="true">↗</span></span><strong>${lesson.short}</strong><small>${lesson.kicker}</small>`;
        button.addEventListener("click", () => {
            renderLesson(index);
            document.getElementById("lesson").scrollIntoView({ behavior: "smooth", block: "start" });
        });
        stepGrid.appendChild(button);
    });

    document.getElementById("previous-step").addEventListener("click", () => renderLesson(currentLesson - 1));
    document.getElementById("next-step").addEventListener("click", () => {
        renderLesson(currentLesson === lessons.length - 1 ? 0 : currentLesson + 1);
    });
    document.querySelectorAll(".move-button").forEach(button => button.addEventListener("click", () => enqueue(button.dataset.move)));
    document.getElementById("play-algorithm").addEventListener("click", () => enqueue(lastMove));
    document.getElementById("reset-cube").addEventListener("click", () => {
        moveQueue.length = 0;
        moveQueue.push("@reset");
        processQueue();
    });
    document.getElementById("scramble-cube").addEventListener("click", () => {
        const options = Object.keys(faces);
        const scramble = [];
        let previousFace = "";
        for (let i = 0; i < 15; i++) {
            let face = options[Math.floor(Math.random() * options.length)];
            while (face === previousFace) face = options[Math.floor(Math.random() * options.length)];
            previousFace = face;
            scramble.push(face + (Math.random() < .5 ? "'" : ""));
        }
        enqueue(scramble.join(" "));
    });
    document.getElementById("watch-solve").addEventListener("click", () => {
        const scramble = "R U R' U' F2 D L B'";
        const solution = "B L' D' F2 U R U' R'";
        moveQueue.length = 0;
        moveQueue.push("@reset", ...scramble.split(" "), "@pause", ...solution.split(" "));
        processQueue();
    });

    makeCube();
    renderLesson(0);
    window.addEventListener("resize", () => {
        if (!busy && moveQueue.length === 0) cubies.forEach(drawCubie);
    });
})();
