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
var MAX_ITERATIONS = 200;
var scaleFactor = 1;

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
var dragStartScreenLocX;
var dragStartScreenLocY;
var mouseDown = false;

// Event listeners to listen for when a mouse/touch is started
window.addEventListener('mousedown', function(event) {
    dragStartScreenLocX = event.clientX;
    dragStartScreenLocY = event.clientY;
    var coords = screenLocationToCoords(event.clientX, event.clientY);
    dragStartX = coords.x;
    dragStartY = coords.y;
    mouseDown = true;
});
window.addEventListener('touchstart', function(event) {
    event.preventDefault();
    event.stopPropagation();

    dragStartScreenLocX = event.touches[0].clientX;
    dragStartScreenLocY = event.touches[0].clientY;
    var coords = screenLocationToCoords(event.touches[0].clientX, event.touches[0].clientY);
    dragStartX = coords.x;
    dragStartY = coords.y;
    mouseDown = true;
});

// Event listeners to listen for when a mouse/touch is moved
// This will draw a box between the initial touch point and the current point
window.addEventListener('mousemove', function(event) {
    // clear top layer canvas and draw a rectangle
    if(mouseDown){
        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.strokeStyle = 'rgba(255,255,255)';
        context2.lineWidth = 3;
        context2.strokeRect(dragStartScreenLocX, dragStartScreenLocY, event.clientX - dragStartScreenLocX, event.clientY - dragStartScreenLocY);
    }
});
window.addEventListener('touchmove', function(event) {
    event.preventDefault();
    event.stopPropagation();

    // clear top layer canvas and draw a rectangle
    if(mouseDown){
        dragEndX = event.touches[0].clientX;
        dragEndY = event.touches[0].clientY;

        context2.clearRect(0, 0, canvas2.width, canvas2.height);
        context2.strokeStyle = 'rgba(255,255,255)';
        context2.lineWidth = 3;
        context2.strokeRect(dragStartScreenLocX, dragStartScreenLocY, event.touches[0].clientX - dragStartScreenLocX, event.touches[0].clientY - dragStartScreenLocY);
    }
});

// Event listeners to listen for when a mouse/touch is ended
// This will also redraw the Mandelbrot set to reflect the 
window.addEventListener('mouseup', function(event) {
    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    mouseDown = false;

    // set new current coordinates (also check to ensure that minX < maxX etc...)
    var coords = screenLocationToCoords(event.clientX, event.clientY);
    curMinX = Math.min(dragStartX, coords.x);
    curMinY = Math.min(dragStartY, coords.y);
    curMaxX = Math.max(dragStartX, coords.x);
    curMaxY = Math.max(dragStartY, coords.y);

    // re-draw mandelbrot
    drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
});
window.addEventListener('touchend', function() {
    event.preventDefault();
    event.stopPropagation();

    context2.clearRect(0, 0, canvas2.width, canvas2.height);
    mouseDown = false;

    // set new current coordinates (also check to ensure that minX < maxX etc...)
    var coords = screenLocationToCoords(dragEndX, dragEndY);
    curMinX = Math.min(dragStartX, coords.x);
    curMinY = Math.min(dragStartY, coords.y);
    curMaxX = Math.max(dragStartX, coords.x);
    curMaxY = Math.max(dragStartY, coords.y);

    // re-draw mandelbrot
    drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
});

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