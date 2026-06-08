document.addEventListener("DOMContentLoaded", () => {
    const voltmeterDisplay = document.getElementById("voltmeter-display");
    const btnIncrease = document.getElementById("btn-increase");
    const btnRestart = document.getElementById("btn-restart");
    const btnChangeOil = document.getElementById("btn-change-oil");
    const breakdownList = document.getElementById("breakdown-list");
    const sparkGif = document.getElementById("spark-gif");
    
    const graphCanvas = document.getElementById("graph-canvas");
    const graphCtx = graphCanvas.getContext("2d");
    
    const apparatusCanvas = document.getElementById("apparatus-canvas");
    const appCtx = apparatusCanvas.getContext("2d");

    let animationFrame;
    let voltage = 0;
    let time = 0;
    let isTesting = false;
    let hasBrokenDown = false;
    let breakdownVoltageTarget = 0;
    
    const MAX_VOLTAGE = 100; // kV
    const VOLTAGE_RATE = 15; // kV per second
    const MAX_TIME = 10; // seconds on X axis base
    
    let timeData = [];
    let voltageData = [];

    function initOilTest() {
        breakdownVoltageTarget = 30 + Math.random() * 40; // Breakdown between 30 and 70 kV
    }

    function resetTest() {
        isTesting = false;
        hasBrokenDown = false;
        voltage = 0;
        time = 0;
        timeData = [];
        voltageData = [];
        updateVoltmeter();
        drawGraph();
        drawApparatus(false);
        cancelAnimationFrame(animationFrame);
        btnIncrease.classList.remove('active');
    }

    btnRestart.addEventListener("click", () => {
        resetTest();
        initOilTest();
    });

    btnChangeOil.addEventListener("click", () => {
        breakdownList.innerHTML = '';
        resetTest();
        initOilTest();
    });

    btnIncrease.addEventListener("mousedown", startTest);
    btnIncrease.addEventListener("mouseup", stopTest);
    btnIncrease.addEventListener("mouseleave", stopTest);
    btnIncrease.addEventListener("touchstart", (e) => { e.preventDefault(); startTest(); });
    btnIncrease.addEventListener("touchend", (e) => { e.preventDefault(); stopTest(); });

    let lastTimestamp = 0;

    function startTest() {
        if (hasBrokenDown) return;
        if (!isTesting) {
            isTesting = true;
            btnIncrease.classList.add('active');
            lastTimestamp = performance.now();
            animationFrame = requestAnimationFrame(simulationLoop);
        }
    }

    function stopTest() {
        if (isTesting) {
            isTesting = false;
            btnIncrease.classList.remove('active');
            cancelAnimationFrame(animationFrame);
        }
    }

    function simulationLoop(timestamp) {
        if (!isTesting) return;
        
        const dt = (timestamp - lastTimestamp) / 1000;
        lastTimestamp = timestamp;
        
        time += dt;
        voltage += VOLTAGE_RATE * dt;
        
        if (voltage >= breakdownVoltageTarget) {
            voltage = breakdownVoltageTarget;
            triggerBreakdown();
        }
        
        timeData.push(time);
        voltageData.push(voltage);
        
        updateVoltmeter();
        drawGraph();
        
        if (isTesting) {
            animationFrame = requestAnimationFrame(simulationLoop);
        }
    }

    function triggerBreakdown() {
        stopTest();
        hasBrokenDown = true;
        
        const option = document.createElement("option");
        option.text = `Breakdown at ${voltage.toFixed(2)} KV`;
        breakdownList.add(option);
        breakdownList.selectedIndex = breakdownList.options.length - 1;
        
        drawApparatus(true);
        
        // Show the spark GIF — reload src to restart animation from frame 1
        const gifSrc = sparkGif.getAttribute("src").split("?")[0];
        sparkGif.src = gifSrc + "?t=" + Date.now();
        sparkGif.style.display = "block";
        
        setTimeout(() => {
            timeData.push(time + 0.1);
            voltageData.push(0);
            drawGraph();
            voltage = 0;
            updateVoltmeter();
        }, 200);
        
        setTimeout(() => {
            drawApparatus(false);
        }, 400);
        
        // Hide GIF after it has had time to play (~1.5 s)
        setTimeout(() => {
            sparkGif.style.display = "none";
        }, 1500);
    }

    function updateVoltmeter() {
        voltmeterDisplay.textContent = Math.floor(voltage);
    }

    function drawGraph() {
        const w = graphCanvas.width;
        const h = graphCanvas.height;
        graphCtx.clearRect(0, 0, w, h);
        
        // Draw grid lines
        graphCtx.strokeStyle = "#eee";
        graphCtx.lineWidth = 1;
        graphCtx.beginPath();
        for(let i=1; i<5; i++) {
            graphCtx.moveTo(0, i * h/5);
            graphCtx.lineTo(w, i * h/5);
        }
        for(let i=1; i<10; i++) {
            graphCtx.moveTo(i * w/10, 0);
            graphCtx.lineTo(i * w/10, h);
        }
        graphCtx.stroke();
        
        if (timeData.length === 0) return;
        
        const currentMaxTime = Math.max(MAX_TIME, time);
        
        graphCtx.strokeStyle = "#4169E1"; // Blue
        graphCtx.lineWidth = 2;
        graphCtx.beginPath();
        
        for (let i = 0; i < timeData.length; i++) {
            const x = (timeData[i] / currentMaxTime) * w;
            const y = h - (voltageData[i] / MAX_VOLTAGE) * h;
            
            if (i === 0) graphCtx.moveTo(x, y);
            else graphCtx.lineTo(x, y);
        }
        
        graphCtx.stroke();
    }

    function drawApparatus(showSpark) {
        const w = apparatusCanvas.width;
        const h = apparatusCanvas.height;
        
        appCtx.clearRect(0, 0, w, h);
        
        // Background
        appCtx.fillStyle = "#A59C94";
        appCtx.fillRect(0, 0, w, h * 0.65);
        
        // Table
        appCtx.fillStyle = "#3e2723"; // Dark wood
        appCtx.beginPath();
        appCtx.ellipse(w/2, h * 0.75, w/2 + 20, 50, 0, 0, Math.PI * 2);
        appCtx.fill();
        appCtx.fillStyle = "#2b1b17";
        appCtx.fillRect(0, h * 0.75, w, h * 0.25);
        
        // Red transformer pillar on the left
        appCtx.fillStyle = "#b71c1c";
        appCtx.fillRect(0, 0, 45, h * 0.6);
        // Base of pillar
        appCtx.fillStyle = "#e0e0e0";
        appCtx.beginPath();
        appCtx.ellipse(22.5, h * 0.6, 25, 10, 0, 0, Math.PI * 2);
        appCtx.fill();
        appCtx.fillStyle = "#9e9e9e";
        appCtx.fillRect(0, h * 0.6, 45, 15);
        appCtx.beginPath();
        appCtx.ellipse(22.5, h * 0.6 + 15, 25, 10, 0, 0, Math.PI * 2);
        appCtx.fill();
        
        // Wires from pillar to electrodes
        appCtx.strokeStyle = "#d32f2f"; // Red wire
        appCtx.lineWidth = 3;
        appCtx.beginPath();
        appCtx.moveTo(40, h * 0.5);
        appCtx.bezierCurveTo(70, h * 0.55, 60, h * 0.45, w/2 - 40, h * 0.5);
        appCtx.stroke();
        
        appCtx.strokeStyle = "#212121"; // Black wire right
        appCtx.beginPath();
        appCtx.moveTo(w, h * 0.5);
        appCtx.bezierCurveTo(w - 20, h * 0.6, w - 30, h * 0.45, w/2 + 40, h * 0.5);
        appCtx.stroke();

        // Glass cylinder
        const cx = w / 2;
        const cy = h * 0.45;
        const rW = 90;
        const rH = 130;
        const bx = cx - rW / 2;
        const by = cy - rH / 2;
        
        // Oil
        appCtx.fillStyle = "rgba(220, 230, 200, 0.7)"; 
        appCtx.fillRect(bx, by + 30, rW, rH - 30);
        // Oil surface ellipse
        appCtx.beginPath();
        appCtx.ellipse(cx, by + 30, rW/2, 10, 0, 0, Math.PI * 2);
        appCtx.fill();
        
        // Cylinder lines
        appCtx.strokeStyle = "rgba(255, 255, 255, 0.6)";
        appCtx.lineWidth = 3;
        appCtx.beginPath();
        appCtx.moveTo(bx, by);
        appCtx.lineTo(bx, by + rH);
        appCtx.moveTo(bx + rW, by);
        appCtx.lineTo(bx + rW, by + rH);
        appCtx.stroke();
        
        // Bottom ellipse
        appCtx.beginPath();
        appCtx.ellipse(cx, by + rH, rW/2, 10, 0, 0, Math.PI * 2);
        appCtx.stroke();
        
        // Top ellipse
        appCtx.beginPath();
        appCtx.ellipse(cx, by, rW/2, 10, 0, 0, Math.PI * 2);
        appCtx.stroke();
        
        // Electrodes
        appCtx.fillStyle = "#616161";
        appCtx.strokeStyle = "#212121";
        appCtx.lineWidth = 1;
        
        // Rods
        appCtx.fillRect(bx - 10, cy - 4, rW/2 - 10, 8);
        appCtx.fillRect(cx + 20, cy - 4, rW/2 - 10, 8);
        
        // Spheres
        appCtx.beginPath();
        appCtx.arc(cx - 20, cy, 15, -Math.PI/2, Math.PI/2, false);
        appCtx.fill();
        appCtx.stroke();
        appCtx.beginPath();
        appCtx.arc(cx - 20, cy, 15, Math.PI/2, -Math.PI/2, false);
        appCtx.fill();
        
        appCtx.beginPath();
        appCtx.arc(cx + 20, cy, 15, Math.PI/2, -Math.PI/2, false);
        appCtx.fill();
        appCtx.stroke();
        appCtx.beginPath();
        appCtx.arc(cx + 20, cy, 15, -Math.PI/2, Math.PI/2, false);
        appCtx.fill();
        
        if (showSpark) {
            appCtx.strokeStyle = "#FFFFAA";
            appCtx.lineWidth = 3;
            appCtx.lineCap = "round";
            appCtx.lineJoin = "round";
            
            appCtx.beginPath();
            appCtx.moveTo(cx - 5, cy);
            appCtx.lineTo(cx - 2, cy - 8 + Math.random()*16);
            appCtx.lineTo(cx + 2, cy - 8 + Math.random()*16);
            appCtx.lineTo(cx + 5, cy);
            appCtx.stroke();
            
            appCtx.shadowColor = "white";
            appCtx.shadowBlur = 10;
            appCtx.stroke();
            appCtx.shadowBlur = 0;
            
            // flash effect
            appCtx.fillStyle = "rgba(255, 255, 200, 0.3)";
            appCtx.fillRect(0, 0, w, h);
        }
    }

    initOilTest();
    drawApparatus(false);
    drawGraph();
});
