class Point {
	constructor(x, y, {allowXMovement=true, allowYMovement=true}) {
  	this.x = x;
    this.y = y;
    this.allowXMovement = allowXMovement;
    this.allowYMovement = allowYMovement;
  }
}

class InteractiveDrawing {
	constructor(div, height, width) {
  	let canvas = document.createElement('canvas');
    canvas.setAttribute('height', height);
    canvas.setAttribute('width', width);
    div.appendChild(canvas);
    canvas.addEventListener("mousedown", evt => this.doMouseDown(evt), false);
    canvas.addEventListener("mouseup", evt => this.doMouseUp(evt), false);
    canvas.addEventListener("mousemove", evt => this.doMouseMove(evt), false);
    canvas.addEventListener("touchstart", evt => this.doMouseDown(evt.changedTouches[0]), false);
    canvas.addEventListener("touchend", evt => this.doMouseUp(evt.changedTouches[0]), false);
    canvas.addEventListener("touchmove", evt => {
    	this.doMouseMove(evt.changedTouches[0]);
      evt.preventDefault();
    }, false);
    this.points = [];
    // Pixels around a point within which a click will be detected.
    this.detectionRadius = 20;
    // Private states.
    this._selectedPoint = null;
    this._listenerAfterUpdate = [];
    // Common variables.
    this.canvas = canvas;
    this.height = height;
    this.width = width;
    // TODO: Convert to property so that update() is called automatically.
    this.background = "rgba(255, 255, 0, 0.25)";
  }
  update() {
    let ctx = this.canvas.getContext('2d');
    ctx.clearRect(0, 0, this.width, this.height);
    if (this.background != null) {
      ctx.fillStyle = this.background;
      ctx.fillRect(0, 0, this.width, this.height);
    }

    this._listenerAfterUpdate.forEach(listener => listener(ctx));
    
  	this.points.forEach(point => {
      ctx.beginPath();
    	ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
      ctx.closePath();
      if (point == this._selectedPoint) {
        ctx.fillStyle = "rgb(0, 0, 0)";
      } else {
        ctx.fillStyle = "rgba(0, 0, 0, .5)";
      }
      ctx.fill();
    });
  }
  addAfterUpdateListener(listener) {
    this._listenerAfterUpdate.push(listener);
    this.update();
  }
  addPoint(point) {
  	this.points.push(point);
    this.update();
  }
  _hyper(x1, y1, x2, y2) {
  	return Math.sqrt(Math.pow(x1-x2, 2) + Math.pow(y1-y2, 2));
  }
  _findPoint(x, y) {
  	let found = null;
    let foundDist = 0;
  	this.points.forEach(point => {
    	const dist = this._hyper(x, y, point.x, point.y);
      if (found === null || dist < foundDist) {
      	found = point;
        foundDist = dist;
      }
    });
    if (foundDist < this.detectionRadius) {
      return found;
    }
    return null;
  }
  _offsetEventCoords(event) {
    const rect = event.target.getBoundingClientRect();
    const x = event.clientX - rect.left; //x position within the element.
    const y = event.clientY - rect.top;  //y position within the element.
    return [x, y];
  }
  doMouseDown(event) {
    const [x, y] = this._offsetEventCoords(event);
    this._selectedPoint = this._findPoint(x, y);
    this.update();
  }
  doMouseUp(event) {
    this._selectedPoint = null;
    this.update();
  }
  doMouseMove(event) {
    const point = this._selectedPoint;
    if (point === null) {
      return;
    }
    const [x, y] = this._offsetEventCoords(event);
    if (point.allowXMovement) point.x = x;
    if (point.allowYMovement) {
      point.y = y;
      console.log("Here");
    }
    this.update();
  }
}

plotCiOverlap = () => {
  const drawing = new InteractiveDrawing(document.getElementById("drawing"), 200, 4096);
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
    drawLine = (p1, p2) => {
      ctx.fillStyle = "rgba(0, 128, 255, 0.25)";
      ctx.fillRect(p1.x, p1.y - HALF_HEIGHT, p2.x - p1.x, 2 * HALF_HEIGHT);
      // ctx.beginPath();
      // ctx.moveTo(p1.x, p1.y);
      // ctx.lineTo(p2.x, p2.y);
      // ctx.stroke();
      drawEdge = (point, isLeft) => {
        ctx.beginPath();
        const BRACE_LEN = 5;
        sgn = isLeft ? 1 : -1;
        ctx.moveTo(point.x + sgn * BRACE_LEN, point.y - HALF_HEIGHT);
        ctx.lineTo(point.x, point.y - HALF_HEIGHT);
        ctx.lineTo(point.x, point.y + HALF_HEIGHT);
        ctx.lineTo(point.x + sgn * BRACE_LEN, point.y + HALF_HEIGHT);
        ctx.stroke();
      }
      drawEdge(p1, p1.x < p2.x);
      drawEdge(p2, p1.x >= p2.x);
      drawEdge(p3, p3.x < p4.x);
      drawEdge(p4, p3.x >= p4.x);
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
