plotCiOverlap = () => {
  const drawing = new InteractiveDrawing(
      document.getElementById("drawing"), 200, 4096);
  drawing.background = null;
  const HALF_HEIGHT = 15;
  const CENTER1 = 30;
  const CENTER2 = 40;
  const TEXT_START = 100;
  const PIXEL_PER_UNIT = 100;

  const p1 = new Point(105, CENTER1, {allowYMovement: false});
  const p2 = new Point(150, CENTER1, {allowYMovement: false});
  const p3 = new Point(205, CENTER2, {allowYMovement: false});
  const p4 = new Point(450, CENTER2, {allowYMovement: false});
  const allPoints = [p1, p2, p3, p4];
  allPoints.forEach(point => drawing.addPoint(point));
  
  computeOverlap = (p1, p2, p3, p4) => {
    if (p1.x > p2.x) {
      [p1, p2] = [p2, p1];
    }
    if (p3.x > p4.x) {
      [p3, p4] = [p4, p3];
    }
    // |Overlap| / (|L1| |L2|)
    let uniformOverlap = Math.min(p2.x, p4.x) - Math.max(p1.x, p3.x);
    if (uniformOverlap < 0) uniformOverlap = 0;
    uniformOverlap /= (p2.x - p1.x) * (p4.x - p3.x);
    uniformOverlap *= PIXEL_PER_UNIT;
    
    const m1 = (p1.x + p2.x) / 2 / PIXEL_PER_UNIT;
    const m2 = (p3.x + p4.x) / 2 / PIXEL_PER_UNIT;
    const s1 = (p2.x - p1.x) / 2 / 1.96 / PIXEL_PER_UNIT;
    const s2 = (p4.x - p3.x) / 2 / 1.96 / PIXEL_PER_UNIT;
    const total_s2 = Math.pow(s1, 2) + Math.pow(s2, 2);
    const tStat2 = Math.pow(m1 - m2, 2) / total_s2;
    const overlap_exp = Math.pow(m1 - m2, 2) / 2 / total_s2;
    const overlap = Math.exp(-overlap_exp) / Math.sqrt(2 * Math.PI * total_s2);
    return [uniformOverlap, tStat2, overlap];
  };
  
  drawing.addAfterUpdateListener(ctx => {
    drawing.drawXAxis(
        ctx,
        CENTER2 + HALF_HEIGHT + 5,
        {pixelsPerTick: PIXEL_PER_UNIT});
    drawLine = (p1, p2) => {
      ctx.fillStyle = "rgba(0, 128, 255, 0.25)";
      ctx.fillRect(p1.x, p1.y - HALF_HEIGHT, p2.x - p1.x, 2 * HALF_HEIGHT);
      // ctx.beginPath();
      // ctx.moveTo(p1.x, p1.y);
      // ctx.lineTo(p2.x, p2.y);
      // ctx.stroke();
      drawBracket = (point, isLeft) => {
        ctx.beginPath();
        const BRACE_LEN = 5;
        sgn = isLeft ? 1 : -1;
        ctx.moveTo(point.x + sgn * BRACE_LEN, point.y - HALF_HEIGHT);
        ctx.lineTo(point.x, point.y - HALF_HEIGHT);
        ctx.lineTo(point.x, point.y + HALF_HEIGHT);
        ctx.lineTo(point.x + sgn * BRACE_LEN, point.y + HALF_HEIGHT);
        ctx.strokeStyle = "rgb(0, 0, 0)";
        ctx.stroke();
      }
      drawBracket(p1, p1.x < p2.x);
      drawBracket(p2, p1.x >= p2.x);
      drawBracket(p3, p3.x < p4.x);
      drawBracket(p4, p3.x >= p4.x);
    }
    drawLine(p1, p2);
    drawLine(p3, p4);
    const [uniformOverlap, tStat2, overlap] = computeOverlap(p1, p2, p3, p4);
    ctx.font = "15px Arial";
    ctx.fillStyle = "rgb(0, 0, 0)";
    
    let nextTextPosition = TEXT_START;
    addText = (text) => {
    	ctx.fillText(text, 5, nextTextPosition);
      nextTextPosition += 20;
    }
    addText("Uniform Overlap: " + uniformOverlap.toFixed(4));
    addText("Gaussian Overlap: " + overlap.toFixed(4));
    addText("Log10 Gaussian Overlap: " + Math.log10(overlap).toFixed(4));
    addText("t-Statistic Squared: " + tStat2.toFixed(4));
  });
};

window.onload = () => plotCiOverlap();
