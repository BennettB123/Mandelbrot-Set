// Grab canvas element and set dimensions
var canvas = document.getElementById('html-canvas');
var context = canvas.getContext('2d');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// GLOBAL VARIABLES
var START_MIN_X = -2.25;
var START_MAX_X = .75;
var START_MIN_Y = -1.5;
var START_MAX_Y = 1.5;
var undoStack = []; //contains previous min/max x & y values in order to undo a zoom
var MAX_ITERATIONS = 150;
var scaleFactor = 1;

var curMinX = START_MIN_X;
var curMinY = START_MIN_Y;
var curMaxX = START_MAX_X;
var curMaxY = START_MAX_Y;

// Event listener to listen to change canvas size when window size changes
function resized(){
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
}
var resize;
window.onresize = function(){
  clearTimeout(resize);
  resize = setTimeout(resized, 100);
};

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

    undoStack = [[START_MIN_X, START_MAX_X, START_MIN_Y, START_MAX_Y]];
}

drawMandelbrotSet(curMinX, curMinY, curMaxX, curMaxY);
