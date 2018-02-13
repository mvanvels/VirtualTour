/*
  AUTHOR David Freer
  Direct Questions -> soulshined@me.com
  Date: 2/10/2018
*/

/**
 * Helper Class for HTML5 canvas, makes inline editing dev friendly
 * This is maintained as a PURE JS solution
 */
class SimpleCanvas {
  constructor(selector, context = '2d') {
    if (!selector) {
      console.log("Simple Canvas: No DOM element matches canvas selector")
      return
    }

    this.canvas = selector
    this.ctx = this.canvas.getContext(context)
    this.ctx.imageSmoothingEnabled = true

    this.width = this.canvas.width
    this.height = this.canvas.height
    this.cursor = "default"

    this.setStrokeStyle("defaults")
    this.rezero()
  }
  /**
   * Cursor css style getter/setter
   * @return {String} current cursor type
   */
  get cursor() { return this._cursor }
  set cursor(val) {
    this._cursor = val
    this.canvas.style.cursor = val
  }
  /**
   * Canvas width getter/setter
   * @return {Number} current canvas width
   */
  get width() { return this._width }
  set width(val) {
    this._width = val
    this.canvas.width = val
  }
  /**
   * Canvas height getter/setter
   * @return {Number} current canvas height
   */
  get height() { return this._height }
  set height(val) {
    this._height = val
    this.canvas.height = val
  }
  /**
  * clears canvas from all drawings
  */
  clear() {
    this.ctx.clearRect(0,0, this.canvas.width, this.canvas.height)
  }
  /**
   * rezeroes canvas coordinates to 0,0
   */
  rezero() {
    this.ctx.moveTo(0,0)
  }
  /**
   * Stroke/Fill/Shadow styling
   * this should be called anytime before a draw method is rendered to alter the stroke, fill colors
   * @param {[Object|String]} style object of attributes, string of "defaults" to restore to defaults
   * @code
   *   let style = {
   *      lineWidth : 5,
   *      lineColor : "red",
   *      fillColor : "tomato",
   *      shadowColor: "lightgray",
   *      shadowBlur : 3
   *   }
   */
	setStrokeStyle(style) {
		if (style === "defaults") {
		  const lineGradient=this.ctx.createLinearGradient(0,0,170,0)
    	lineGradient.addColorStop("0","#FFB300")
    	lineGradient.addColorStop("1.0","#FFD164")

			this.ctx.lineWidth = 3
			this.ctx.strokeStyle = lineGradient
			this.ctx.fillStyle = "rgba(0,0,255,0.2)"

			return
		}

		if (style.lineWidth) this.ctx.lineWidth = style.lineWidth
		if (style.lineColor) this.ctx.strokeStyle = style.lineColor
		if (style.fillColor) this.ctx.fillStyle = style.fillColor
    if (style.shadowColor) this.ctx.shadowColor= style.shadowColor
    if (style.shadowBlur) this.ctx.shadowBlur = style.shadowBlur
	}
  /**
  * Draws a circle using canvas arc()
  * @param  {Number}  centerX  Middle x of circle
  * @param  {Number}  centerY  Middle y of circle
  * @param  {Number}  radius   Radius of circle
  * @param  {Boolean} [isFilled] - false. Optional param to fill in shape
  */
  drawCircle(centerX, centerY, radius,isFilled) {
    isFilled = isFilled || false
    this.ctx.beginPath()
    this.ctx.arc(centerX, centerY, radius, 0, 2*Math.PI)
    ctx.closePath()
    ctx.stroke()
    if (isFilled)	this.ctx.fill()
  }
  /**
  * Draws a line on the canvas from given points
  * @param  {Object} startXY { x: value, y: value }
  * @param  {Object} endXY   { x: value, y: value }
  */
  drawLine(startXY, endXY) {
    this.ctx.beginPath()
    this.ctx.moveTo(startXY['x'], startXY['y'])
    this.ctx.lineTo(endXY['x'], endXY['y'])
    this.ctx.closePath()
    this.ctx.stroke()
  }
  /**
   * Draws a path on the canvas from an object of arrays
   * @param  {Object}  points   Object[Array[x:value,y:value]...]; The arrays of the object must have 'x','y' as keys
   * @param  {Boolean} [isFilled] - false. Optional param to fill in shape
   */
	drawPath(points, isFilled) {
		isFilled = isFilled || false
		this.ctx.beginPath()
    //move to the first index coordinates before drawing lines.
    //Do not use moveTo in the loop as a fill will not be honored
    this.ctx.moveTo(points[0]['x'], points[0]['y'])

    for (var i = 0; i < points.length - 1; i++) {
      this.ctx.lineTo(points[i+1]['x'], points[i+1]['y'])
    }

    this.ctx.closePath()
    this.ctx.stroke()
		if (isFilled)	this.ctx.fill()
	}
  /**
   * Gets the most roundabout center of shape. This naturally is not 100% accurate with polygons
   * @param  {Object} points [Object[Array[x:value,y:value]]...]; The arrays of the object must have 'x', 'y' as keys
   * @return {Array}        Returns an array of coordinates [x,y] representing center shape
   */
	getCentroid(points) {
		// use formula here: https://en.wikipedia.org/wiki/Centroid#Locating_the_centroid

		//makes life easier and parses points from it's kvp.
		// this is the best workaround imo since some browsers don't support Object.keys()/values()
		let coords = []

    for (coord of points) {
      coords.push([coord.x, coord.y])
    }

    return coords.reduce(function(x,y) {
      return [x[0] + y[0]/coords.length, x[1] + y[1]/coords.length]
    }, [0,0])
	}
}
