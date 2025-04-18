const canvas = document.getElementById('complexCanvas');
const ctx = canvas.getContext('2d');
const realInput = document.getElementById('real');
const imaginaryInput = document.getElementById('imaginary');
const angleInput = document.getElementById('angle');
const initialComplexSpan = document.getElementById('initialComplex');
const rotationAngleSpan = document.getElementById('rotationAngle');
const rotatedComplexSpan = document.getElementById('rotatedComplex');
const confirmComplexButton = document.getElementById('confirmComplexButton');
const confirmRotateButton = document.getElementById('confirmRotateButton');
const multiplierRealInput = document.getElementById('multiplierReal');
const multiplierImaginaryInput = document.getElementById('multiplierImaginary');
const confirmMultiplyButton = document.getElementById('confirmMultiplyButton');
const multiplierComplexSpan = document.getElementById('multiplierComplex');
const productComplexSpan = document.getElementById('productComplex');
const resetAllButton = document.getElementById('resetAllButton'); // Added reset button reference

const width = canvas.width;
const height = canvas.height;
const centerX = width / 2;
const centerY = height / 2;
const scale = 40; // Pixels per unit

// let currentStep = 1; // No longer needed with separate buttons
let initialA = NaN;
let initialB = NaN;

// Store default values
const defaultReal = "1";
const defaultImaginary = "1";
const defaultAngle = "45";
const defaultMultiplierReal = "0";
const defaultMultiplierImaginary = "1";

// --- Coordinate Transformation ---
function toCanvasX(x) {
    return centerX + x * scale;
}

function toCanvasY(y) {
    return centerY - y * scale;
}

// --- Drawing Functions ---
function drawAxes() {
    ctx.strokeStyle = '#ccc';
    ctx.lineWidth = 1;

    // X-axis (Real)
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Y-axis (Imaginary)
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, height);
    ctx.stroke();

    // Add labels and ticks
    ctx.fillStyle = '#999';
    ctx.font = '10px sans-serif';
    for (let i = -Math.floor(centerX / scale); i <= Math.floor(centerX / scale); i++) {
        if (i === 0) continue;
        ctx.fillText(i.toString(), toCanvasX(i) - 3, centerY + 12);
        ctx.beginPath();
        ctx.moveTo(toCanvasX(i), centerY - 3);
        ctx.lineTo(toCanvasX(i), centerY + 3);
        ctx.stroke();
    }
    for (let i = -Math.floor(centerY / scale); i <= Math.floor(centerY / scale); i++) {
        if (i === 0) continue;
        ctx.fillText(i.toString() + 'i', centerX + 5, toCanvasY(i) + 3);
        ctx.beginPath();
        ctx.moveTo(centerX - 3, toCanvasY(i));
        ctx.lineTo(centerX + 3, toCanvasY(i));
        ctx.stroke();
    }
    ctx.fillText('Re', width - 15, centerY + 12);
    ctx.fillText('Im', centerX + 5, 12);
}

function drawVector(x, y, color, label) {
    const canvasX = toCanvasX(x);
    const canvasY = toCanvasY(y);

    ctx.strokeStyle = color;
    ctx.lineWidth = 2;

    // Draw line from origin
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.lineTo(canvasX, canvasY);
    ctx.stroke();

    // Draw arrowhead
    const angle = Math.atan2(canvasY - centerY, canvasX - centerX);
    const arrowLength = 8;
    ctx.beginPath();
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(canvasX - arrowLength * Math.cos(angle - Math.PI / 6), canvasY - arrowLength * Math.sin(angle - Math.PI / 6));
    ctx.moveTo(canvasX, canvasY);
    ctx.lineTo(canvasX - arrowLength * Math.cos(angle + Math.PI / 6), canvasY - arrowLength * Math.sin(angle + Math.PI / 6));
    ctx.stroke();

    // Draw label
    if (label) {
        ctx.fillStyle = color;
        ctx.font = '12px sans-serif';
        // Adjust label position slightly based on quadrant for better visibility
        let labelX = canvasX + 5;
        let labelY = canvasY - 5;
        if (x < 0) labelX = canvasX - 5 - ctx.measureText(label).width; // Move left if in left half
        if (y < 0) labelY = canvasY + 15; // Move down if in bottom half
        ctx.fillText(label, labelX, labelY);
    }
}

function drawRotationArc(angleRad, radius) {
    if (radius <= 0.01) return; // Don't draw arc if vector is near zero
    const canvasRadius = radius * scale;
    ctx.strokeStyle = '#aaa';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    // Draw arc from positive x-axis to the angle of the rotated vector
    const startAngle = 0;
    const endAngle = -angleRad; // Canvas rotation is clockwise
    ctx.arc(centerX, centerY, canvasRadius, startAngle, endAngle, angleRad < 0); // Adjust direction
    ctx.stroke();
    ctx.setLineDash([]); // Reset line dash

    // Draw angle label (optional)
    const labelRadius = canvasRadius * 0.5;
    const labelAngle = -angleRad / 2;
    const labelX = centerX + labelRadius * Math.cos(labelAngle);
    const labelY = centerY + labelRadius * Math.sin(labelAngle);
    ctx.fillStyle = '#555';
    ctx.font = '11px sans-serif';
    ctx.fillText(`${(angleRad * 180 / Math.PI).toFixed(1)}°`, labelX, labelY);
}

function clearInfo() {
    initialComplexSpan.textContent = '';
    rotationAngleSpan.textContent = '';
    rotatedComplexSpan.textContent = '';
    multiplierComplexSpan.textContent = '';
    productComplexSpan.textContent = '';
}

// --- Reset Function ---
function resetAll() {
    // Reset input values to defaults
    realInput.value = defaultReal;
    imaginaryInput.value = defaultImaginary;
    angleInput.value = defaultAngle;
    multiplierRealInput.value = defaultMultiplierReal;
    multiplierImaginaryInput.value = defaultMultiplierImaginary;

    // Reset internal state
    initialA = NaN;
    initialB = NaN;

    // Clear canvas and draw axes
    ctx.clearRect(0, 0, width, height);
    drawAxes();

    // Clear info display
    clearInfo();

    // Reset UI element states
    realInput.disabled = false;
    imaginaryInput.disabled = false;
    confirmComplexButton.disabled = false;

    angleInput.disabled = true;
    confirmRotateButton.disabled = true;

    multiplierRealInput.disabled = true;
    multiplierImaginaryInput.disabled = true;
    confirmMultiplyButton.disabled = true;

    // Optional: Focus on the first input
    realInput.focus();
}

// --- Event Listeners for New Buttons ---

// Listener for '确定复数'
confirmComplexButton.addEventListener('click', () => {
    const a = parseFloat(realInput.value);
    const b = parseFloat(imaginaryInput.value);

    if (isNaN(a) || isNaN(b)) {
        alert('请输入有效的实部和虚部！');
        return;
    }

    initialA = a;
    initialB = b;

    // Clear canvas and draw axes + initial vector
    ctx.clearRect(0, 0, width, height);
    drawAxes();
    drawVector(initialA, initialB, 'blue', `z = ${initialA.toFixed(2)} + ${initialB.toFixed(2)}i`);

    // Update info display
    clearInfo();
    initialComplexSpan.textContent = `${initialA.toFixed(2)} + ${initialB.toFixed(2)}i`;

    // Update UI state
    realInput.disabled = true;
    imaginaryInput.disabled = true;
    confirmComplexButton.disabled = true;

    angleInput.disabled = false;
    confirmRotateButton.disabled = false;
    multiplierRealInput.disabled = false; // Enable multiplier inputs
    multiplierImaginaryInput.disabled = false;
    confirmMultiplyButton.disabled = false; // Enable multiply button
    angleInput.focus(); // Focus on angle input for next step
});

// Listener for '确定旋转'
confirmRotateButton.addEventListener('click', () => {
    const angleDeg = parseFloat(angleInput.value);
    if (isNaN(angleDeg)) {
        alert('请输入有效的旋转角度！');
        return;
    }
    const angleRad = angleDeg * (Math.PI / 180);

    // Calculate rotation
    const cosTheta = Math.cos(angleRad);
    const sinTheta = Math.sin(angleRad);
    const aPrime = initialA * cosTheta - initialB * sinTheta;
    const bPrime = initialA * sinTheta + initialB * cosTheta;

    // Redraw axes and initial vector (in case canvas was cleared or state is unexpected)
    ctx.clearRect(0, 0, width, height);
    drawAxes();
    drawVector(initialA, initialB, 'blue', `z = ${initialA.toFixed(2)} + ${initialB.toFixed(2)}i`);

    // Draw rotated vector and arc
    drawVector(aPrime, bPrime, 'red', `z' = ${aPrime.toFixed(2)} + ${bPrime.toFixed(2)}i`);
    const radius = Math.sqrt(initialA * initialA + initialB * initialB);
    drawRotationArc(angleRad, radius);

    // Update info display
    rotationAngleSpan.textContent = `${angleDeg.toFixed(1)}° (${angleRad.toFixed(2)} rad)`;
    rotatedComplexSpan.textContent = `${aPrime.toFixed(2)} + ${bPrime.toFixed(2)}i`;

    // Update UI state - Ready for next complex number input
    angleInput.disabled = true;
    confirmRotateButton.disabled = true;
    // angleInput.value = ''; // Optionally clear angle input

    realInput.disabled = false;
    imaginaryInput.disabled = false;
    confirmComplexButton.disabled = false;
    realInput.focus(); // Focus back on real input
});

// Listener for '乘以复数'
confirmMultiplyButton.addEventListener('click', () => {
    const c = parseFloat(multiplierRealInput.value);
    const d = parseFloat(multiplierImaginaryInput.value);

    if (isNaN(initialA) || isNaN(initialB)) {
        alert('请先确定初始复数！');
        return;
    }
    if (isNaN(c) || isNaN(d)) {
        alert('请输入有效的乘数实部和虚部！');
        return;
    }

    // Calculate the product: (a + bi) * (c + di) = (ac - bd) + (ad + bc)i
    const productA = initialA * c - initialB * d;
    const productB = initialA * d + initialB * c;

    // Clear canvas and redraw axes, initial vector, and multiplier vector
    ctx.clearRect(0, 0, width, height);
    drawAxes();
    drawVector(initialA, initialB, 'blue', `z = ${initialA.toFixed(2)} + ${initialB.toFixed(2)}i`);
    // Draw multiplier vector (w) only if it's not zero
    if (Math.abs(c) > 1e-6 || Math.abs(d) > 1e-6) {
        drawVector(c, d, 'green', `w = ${c.toFixed(2)} + ${d.toFixed(2)}i`);
    }
    drawVector(productA, productB, 'purple', `z*w = ${productA.toFixed(2)} + ${productB.toFixed(2)}i`);

    // Update info display (clear previous rotation info first)
    rotationAngleSpan.textContent = '';
    rotatedComplexSpan.textContent = '';
    multiplierComplexSpan.textContent = `${c.toFixed(2)} + ${d.toFixed(2)}i`;
    productComplexSpan.textContent = `${productA.toFixed(2)} + ${productB.toFixed(2)}i`;

    // Keep inputs enabled for further operations or reset UI as needed
    // Example: Disable multiply button after one use
    // confirmMultiplyButton.disabled = true;
});

// --- Event Listener for Reset Button ---
resetAllButton.addEventListener('click', resetAll);

// --- Initial Setup ---
window.onload = () => {
    resetAll(); // Call resetAll to set initial state and draw axes
};