// =========================================================================
// VISUALIZER & INTERACTIVE CANVAS ENGINE
// Visual graphs, dynamic charts, and interactive learning tools
// Designed to make math visible and non-intimidating
// =========================================================================

const Visualizer = {
  // 1. Draw Normal Distribution Curve with shaded areas & critical lines
  drawNormalCurve: function(canvasId, zScore = 1.96, tailType = "two", alpha = 0.05) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    // Padding & scales
    const padX = 40;
    const padY = 30;
    const plotWidth = width - padX * 2;
    const plotHeight = height - padY * 2;
    const baseY = height - padY;

    // Normal PDF function: f(x) = (1/√(2π)) * e^(-x^2 / 2)
    function pdf(x) {
      return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * x * x);
    }

    const minX = -3.8;
    const maxX = 3.8;
    const maxPdf = pdf(0); // ~0.3989

    function toScreenX(x) {
      return padX + ((x - minX) / (maxX - minX)) * plotWidth;
    }

    function toScreenY(y) {
      return baseY - (y / maxPdf) * plotHeight;
    }

    // Determine critical thresholds based on tailType & alpha
    let critLeft = null;
    let critRight = null;
    if (tailType === "two") {
      critRight = zScore;
      critLeft = -zScore;
    } else if (tailType === "right") {
      critRight = zScore;
    } else if (tailType === "left") {
      critLeft = -zScore;
    }

    // 1. Fill Rejection Regions (Red/Rose glow)
    const step = 0.05;
    for (let x = minX; x <= maxX; x += step) {
      const nextX = x + step;
      let inRejection = false;

      if (tailType === "two" && (x >= critRight || nextX <= critLeft)) inRejection = true;
      if (tailType === "right" && x >= critRight) inRejection = true;
      if (tailType === "left" && nextX <= critLeft) inRejection = true;

      if (inRejection) {
        ctx.fillStyle = "rgba(244, 63, 94, 0.4)"; // Rose glow
        ctx.beginPath();
        ctx.moveTo(toScreenX(x), baseY);
        ctx.lineTo(toScreenX(x), toScreenY(pdf(x)));
        ctx.lineTo(toScreenX(nextX), toScreenY(pdf(nextX)));
        ctx.lineTo(toScreenX(nextX), baseY);
        ctx.closePath();
        ctx.fill();
      } else {
        // Acceptance region (Teal/Emerald soft glow)
        ctx.fillStyle = "rgba(16, 185, 129, 0.18)";
        ctx.beginPath();
        ctx.moveTo(toScreenX(x), baseY);
        ctx.lineTo(toScreenX(x), toScreenY(pdf(x)));
        ctx.lineTo(toScreenX(nextX), toScreenY(pdf(nextX)));
        ctx.lineTo(toScreenX(nextX), baseY);
        ctx.closePath();
        ctx.fill();
      }
    }

    // 2. Draw Baseline & Axis Ticks
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padX, baseY);
    ctx.lineTo(width - padX, baseY);
    ctx.stroke();

    // Axis labels (-3, -2, -1, 0, 1, 2, 3)
    ctx.fillStyle = "#94a3b8";
    ctx.font = "11px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    for (let tick = -3; tick <= 3; tick++) {
      const tx = toScreenX(tick);
      ctx.beginPath();
      ctx.moveTo(tx, baseY);
      ctx.lineTo(tx, baseY + 6);
      ctx.stroke();
      ctx.fillText(tick === 0 ? "μ (0)" : `${tick > 0 ? "+" : ""}${tick}`, tx, baseY + 20);
    }

    // 3. Draw Normal Bell Curve Line (Cyan Gradient)
    const curveGrad = ctx.createLinearGradient(0, 0, width, 0);
    curveGrad.addColorStop(0, "#06b6d4");
    curveGrad.addColorStop(0.5, "#38bdf8");
    curveGrad.addColorStop(1, "#818cf8");

    ctx.strokeStyle = curveGrad;
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = minX; x <= maxX; x += 0.02) {
      const sx = toScreenX(x);
      const sy = toScreenY(pdf(x));
      if (x === minX) ctx.moveTo(sx, sy);
      else ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // 4. Draw Center Line (μ = 0)
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toScreenX(0), baseY);
    ctx.lineTo(toScreenX(0), toScreenY(maxPdf));
    ctx.stroke();
    ctx.setLineDash([]);

    // 5. Draw Critical Value Markers (Vertical Dotted Lines)
    function drawMarker(zVal, label, color) {
      const sx = toScreenX(zVal);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(sx, baseY);
      ctx.lineTo(sx, toScreenY(pdf(zVal)) - 10);
      ctx.stroke();
      ctx.setLineDash([]);

      // Label pin
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(sx, toScreenY(pdf(zVal)), 4, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = "bold 12px 'Prompt', sans-serif";
      ctx.fillText(label, sx, toScreenY(pdf(zVal)) - 18);
    }

    if (critLeft !== null) {
      drawMarker(critLeft, `Z_crit = ${critLeft.toFixed(2)}`, "#f43f5e");
    }
    if (critRight !== null) {
      drawMarker(critRight, `Z_crit = +${critRight.toFixed(2)}`, "#f43f5e");
    }

    // Legend on canvas
    ctx.font = "11px 'Prompt', sans-serif";
    ctx.textAlign = "left";
    ctx.fillStyle = "#10b981";
    ctx.fillRect(padX, 10, 12, 12);
    ctx.fillText("พื้นที่ยอมรับ H₀ (Acceptance Region: 1 - α)", padX + 20, 20);

    ctx.fillStyle = "#f43f5e";
    ctx.fillRect(width - 220, 10, 12, 12);
    ctx.fillText("เขตวิกฤตปฏิเสธ H₀ (Rejection: α)", width - 200, 20);
  },

  // 2. Draw Interactive Regression Scatter Plot
  drawRegressionScatter: function(canvasId, points, slope, intercept) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const width = canvas.width;
    const height = canvas.height;

    ctx.clearRect(0, 0, width, height);

    const padX = 50;
    const padY = 40;
    const plotWidth = width - padX * 2;
    const plotHeight = height - padY * 2;

    const xs = points.map(p => p.x);
    const ys = points.map(p => p.y);
    const minX = 0;
    const maxX = Math.max(...xs) * 1.15;
    const minY = 0;
    const maxY = Math.max(...ys) * 1.15;

    function toScreenX(x) {
      return padX + (x / maxX) * plotWidth;
    }

    function toScreenY(y) {
      return (height - padY) - (y / maxY) * plotHeight;
    }

    // Grid lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.08)";
    ctx.lineWidth = 1;
    for (let i = 1; i <= 5; i++) {
      const gx = padX + (plotWidth / 5) * i;
      const gy = (height - padY) - (plotHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(gx, padY);
      ctx.lineTo(gx, height - padY);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(padX, gy);
      ctx.lineTo(width - padX, gy);
      ctx.stroke();
    }

    // Axis lines
    ctx.strokeStyle = "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padX, padY);
    ctx.lineTo(padX, height - padY);
    ctx.lineTo(width - padX, height - padY);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = "#94a3b8";
    ctx.font = "12px 'Prompt', sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("ตัวแปรต้น X (เช่น ค่าโฆษณา)", width / 2, height - 10);

    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("ตัวแปรตาม Y (เช่น ยอดขาย)", 0, 0);
    ctx.restore();

    // Regression Line Ŷ = a + bx
    const lineX1 = 0;
    const lineY1 = intercept + slope * lineX1;
    const lineX2 = maxX;
    const lineY2 = intercept + slope * lineX2;

    ctx.strokeStyle = "#8b5cf6"; // Violet trend line
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toScreenX(lineX1), toScreenY(lineY1));
    ctx.lineTo(toScreenX(lineX2), toScreenY(lineY2));
    ctx.stroke();

    // Data Points & Residual drop lines
    points.forEach((p, idx) => {
      const sx = toScreenX(p.x);
      const sy = toScreenY(p.y);
      const predY = intercept + slope * p.x;
      const predSy = toScreenY(predY);

      // Residual dotted line
      ctx.strokeStyle = "rgba(244, 63, 94, 0.35)";
      ctx.lineWidth = 1;
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx, predSy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point circle
      ctx.fillStyle = "#06b6d4"; // Cyan point
      ctx.beginPath();
      ctx.arc(sx, sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });

    // Equation badge on plot
    ctx.fillStyle = "rgba(15, 23, 42, 0.85)";
    ctx.strokeStyle = "rgba(139, 92, 246, 0.5)";
    ctx.lineWidth = 1;
    ctx.fillRect(width - 240, padY + 10, 220, 50);
    ctx.strokeRect(width - 240, padY + 10, 220, 50);

    ctx.fillStyle = "#a78bfa";
    ctx.font = "bold 13px 'Prompt', sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`เส้นแนวโน้ม: Ŷ = ${intercept.toFixed(2)} + ${slope.toFixed(3)}X`, width - 230, padY + 32);
    ctx.font = "11px 'Prompt', sans-serif";
    ctx.fillStyle = "#94a3b8";
    ctx.fillText("เส้นสีม่วง = โมเดลกำลังสองน้อยที่สุด", width - 230, padY + 50);
  }
};
