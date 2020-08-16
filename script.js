// Grab canvas elements and set dimensions
var canvas = document.getElementById('html-canvas');
var context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Second canvas layer is used to draw rectangles for zooming in
var canvas2 = document.getElementById('html-canvas-top-layer');
var context2 = canvas2.getContext('2d');
canvas2.width = window.innerWidth;
canvas2.height = window.innerHeight;

// GLOBAL VARIABLES
var MIN_X = -2.25;
var MAX_X = .75;
var MIN_Y = -1.25;
var MAX_Y = 1.25;
var MANDELBROT_ASPECT_RATIO = (MAX_X - MIN_X) / (MAX_Y - MIN_Y);
var CANVAS_ASPECT_RATIO = canvas.width / canvas.height;

var START_MIN_X;
var START_MAX_X;
var START_MIN_Y;
var START_MAX_Y;
setStartCoords(CANVAS_ASPECT_RATIO, MANDELBROT_ASPECT_RATIO);

var undoStack = []; //contains previous min/max x & y values in order to undo a zoom
var MAX_ITERATIONS = 500;
var scaleFactor = 2;

var curMinX = START_MIN_X;
var curMinY = START_MIN_Y;
var curMaxX = START_MAX_X;
var curMaxY = START_MAX_Y;

// Event listener to listen to change canvas size when window size changes
function resized(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    canvas2.width = window.innerWidth;
    canvas2.height = window.innerHeight;
    CANVAS_ASPECT_RATIO = canvas.width / canvas.height;

    setStartCoords(CANVAS_ASPECT_RATIO, MANDELBROT_ASPECT_RATIO);
    drawMandelbrotSet(START_MIN_X, START_MIN_Y, START_MAX_X, START_MAX_Y);
}
var resize;
window.addEventListener('resize', function(){
    clearTimeout(resize);
    resize = setTimeout(resized, 100);
});

var dragStartX;
var dragStartY;
var dragEndX;
var dragEndY;
var mouseDown = false;

// Event listeners to listen for when a mouse/touch is started
window.addEventListener('mousedown', function(event) {
    dragStartX = event.clientX;
    dragStartY = event.clientY;
    mouseDown = true;
});
window.addEventListener('touchstart', function(event) {
    event.preventDefault();

    dragStartX = event.touches[0].clientX;
    dragStartY = event.touches[0].clientY;
    mouseDown = true;
}, { passive: false });

// Event listeners to listen for when a mouse/touch is moved
// This will draw a box between the initial touch point and the current point,
// While maintaining the screens aspect ratio, to preserve the Mandelbrot set's aspect ratio
window.addEventListener('mousemove', function(event) {
    // clear top layer canvas and draw a rectangle
    if(mouseDown){
        let rectX = dragStartX;
        let rectY = dragStartY;
        let rectHeight, rectWidth;

        // Complicated logic to keep aspect ratio
        if(event.clientX < dragStartX) {
            rectWidth = (dragStartX - event.clientX);
        }
        else {
            rectWidth = event.clientX - rectX;
        }

        if(event.clientY < dragStartY) {
            rectHeight = -(dragStartY - event.clientY);
        }
        else {
            rectHeight = event.clientY - rectY;
        }
        if(CANVAS_ASPECT_RATIO > 1) {
            if (event.clientY < dragStartY) {
                rectHeight = -rectWidth / CANVAS_ASPECT_RATIO;
            }
            else {
                rectHeight = rectWidth / CANVAS_ASPECT_RATIO;
            }
            if (event.clientX < dragStartX) {
                rectHeight *= -1;
            }
        }
        else {
            if (event.clientX < dragStartX) {
                rectWidth = -rectHeight * CANVAS_ASPECT_RATIO;
            }
            else {
                rectWidth = rectHeight * CANVAS_ASPECT_RATIO;
            }
            if (event.clientY < dragStartY) {
                rectWidth *= -1;
            }
        }

        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.strokeStyle = 'rgba(255,255,255)';
        context2.lineWidth = 3;
        context2.strokeRect(rectX, rectY, rectWidth, rectHeight);

        dragEndX = rectX + rectWidth;
        dragEndY = rectY + rectHeight;
    }
});
window.addEventListener('touchmove', function(event) {
    event.preventDefault();

    // clear top layer canvas and draw a rectangle
    if(mouseDown){
        let rectX = dragStartX;
        let rectY = dragStartY;
        let rectHeight, rectWidth;

        // Complicated logic to keep aspect ratio
        if(event.touches[0].clientX < dragStartX) {
            rectWidth = (dragStartX - event.touches[0].clientX);
        }
        else {
            rectWidth = event.touches[0].clientX - rectX;
        }

        if(event.touches[0].clientY < dragStartY) {
            rectHeight = -(dragStartY - event.touches[0].clientY);
        }
        else {
            rectHeight = event.touches[0].clientY - rectY;
        }
        if(CANVAS_ASPECT_RATIO > 1) {
            if (event.touches[0].clientY < dragStartY) {
                rectHeight = -rectWidth / CANVAS_ASPECT_RATIO;
            }
            else {
                rectHeight = rectWidth / CANVAS_ASPECT_RATIO;
            }
            if (event.touches[0].clientX < dragStartX) {
                rectHeight *= -1;
            }
        }
        else {
            if (event.touches[0].clientX < dragStartX) {
                rectWidth = -rectHeight * CANVAS_ASPECT_RATIO;
            }
            else {
                rectWidth = rectHeight * CANVAS_ASPECT_RATIO;
            }
            if (event.touches[0].clientY < dragStartY) {
                rectWidth *= -1;
            }
        }

        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.strokeStyle = 'rgba(255,255,255)';
        context2.lineWidth = 3;
        context2.strokeRect(rectX, rectY, rectWidth, rectHeight);

        dragEndX = rectX + rectWidth;
        dragEndY = rectY + rectHeight;
    }
}, { passive: false });

// Event listeners to listen for when a mouse/touch is ended
// This will also redraw the Mandelbrot set to reflect the 
window.addEventListener('mouseup', function(event) {
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    mouseDown = false;

    // set new current coordinates (also check to ensure that minX < maxX etc...)
    var startCoords = screenLocationToCoords(dragStartX, dragStartY);
    var endCoords = screenLocationToCoords(dragEndX, dragEndY);
    curMinX = Math.min(startCoords.x, endCoords.x);
    curMinY = Math.min(startCoords.y, endCoords.y);
    curMaxX = Math.max(startCoords.x, endCoords.x);
    curMaxY = Math.max(startCoords.y, endCoords.y);

    // re-draw mandelbrot
    drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
});
window.addEventListener('touchend', function() {
    event.preventDefault();

    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    mouseDown = false;

    // set new current coordinates (also check to ensure that minX < maxX etc...)
    var startCoords = screenLocationToCoords(dragStartX, dragStartY);
    var endCoords = screenLocationToCoords(dragEndX, dragEndY);
    curMinX = Math.min(startCoords.x, endCoords.x);
    curMinY = Math.min(startCoords.y, endCoords.y);
    curMaxX = Math.max(startCoords.x, endCoords.x);
    curMaxY = Math.max(startCoords.y, endCoords.y);

    // re-draw mandelbrot
    drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
}, { passive: false });

// Calculates and sets the starting coordinates for the mandelbrot set
// This function is to make the whole Mandelbrot set visible on the screen,
// while maintaining a correct aspect ratio so it does not appear stretched.
function setStartCoords(canvas_aspect_ratio, mandelbrot_aspect_ratio) {
    // for wider displays (desktop)
    if (canvas_aspect_ratio >= mandelbrot_aspect_ratio) {
        START_MIN_X = (MIN_X * (canvas_aspect_ratio / mandelbrot_aspect_ratio));
        START_MAX_X = MAX_X * (canvas_aspect_ratio / mandelbrot_aspect_ratio);
        START_MIN_Y = MIN_Y;
        START_MAX_Y = MAX_Y;
    }
    // for taller displays (mobile)
    else {
        START_MIN_X = MIN_X;
        START_MAX_X = MAX_X;
        START_MIN_Y = MIN_Y * (mandelbrot_aspect_ratio / canvas_aspect_ratio);
        START_MAX_Y = MAX_Y * (mandelbrot_aspect_ratio / canvas_aspect_ratio);
    }
}

// Converts a pair of screen coordinates to the cooresponding coordinates of the mandelbrot set.
// This will be used to locate where a user has decided to zoom in.
// Return value is in the form: {x: number, y: number}
function screenLocationToCoords(col, row) {
    return {
        x: scale(col, 0, canvas.width, curMinX, curMaxX),
        y: scale(row, 0, canvas.height, curMinY, curMaxY),
    }
}

// Helper function to scale a value from one range of numbers to different range of numbers
function scale(num, in_min, in_max, out_min, out_max) {
    return (num - in_min) * (out_max - out_min) / (in_max - in_min) + out_min;
}

// Draw the Mandelbrot set between the coordinates (minR, minC, maxR, maxC)
function drawMandelbrotSet(minR, minC, maxR, maxC) {
    // Looping through every pixel on the screen to determine its color
    for(let row = 0; row < (canvas.width / scaleFactor); row++) {
        for(let col = 0; col < (canvas.height / scaleFactor); col++) {
            let a = scale(row, 0, canvas.width / scaleFactor, minR, maxR);
            let b = scale(col, 0, canvas.height / scaleFactor, minC, maxC);
            let ca = a;
            let cb = b;
            
            let n = 0;
            // Check if value at coordinate (row, col) is infinite or bounded
            while (n < MAX_ITERATIONS) {
                aa = a*a - b*b;
                bb = 2 * a*b;
                if(Math.abs(aa + bb) > 16) {
                    break;
                }

                a = aa + ca;
                b = bb + cb;
                n++;
            }

            let bound;
            let brightness = 50;
            if (n >= MAX_ITERATIONS) {
                bound = 360;
                brightness = 0;
            } else {
                bound = scale(n, 0, MAX_ITERATIONS, 0, 360);
            }
            context.fillStyle = 'hsl('+bound+',100%,'+brightness+'%';
            context.fillRect(row*scaleFactor, col*scaleFactor, scaleFactor, scaleFactor);
        }
    }

    undoStack.push([minR, minC, maxR, maxC]);
}

drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);