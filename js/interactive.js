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
    canvas.addEventListener("mousedown", evt => this._doMouseDown(evt), false);
    canvas.addEventListener("mouseup", evt => this._doMouseUp(evt), false);
    canvas.addEventListener("mousemove", evt => this._doMouseMove(evt), false);
    canvas.addEventListener("touchstart", evt => this._doMouseDown(evt.changedTouches[0]), false);
    canvas.addEventListener("touchend", evt => this._doMouseUp(evt.changedTouches[0]), false);
    canvas.addEventListener("touchmove", evt => {
    	this._doMouseMove(evt.changedTouches[0]);
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
  _doMouseDown(event) {
    const [x, y] = this._offsetEventCoords(event);
    this._selectedPoint = this._findPoint(x, y);
    this.update();
  }
  _doMouseUp(event) {
    this._selectedPoint = null;
    this.update();
  }
  _doMouseMove(event) {
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
