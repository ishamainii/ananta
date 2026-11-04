import assert from "node:assert/strict";
import { reference, residuals, norm, newtonStep, FIXED, NAMES } from "./yantra.js";

const ref = reference();
assert.ok(norm(residuals(ref)) < 1e-12, "reference yantra is exact");

// perturb the 11 solved unknowns, Newton should come back
let x = ref.map((v, i) => FIXED.includes(i) ? v : v + 0.01 * Math.sin(7 * i + 1));
for (let k = 0; k < 20; k++) x = newtonStep(x);
assert.ok(norm(residuals(x)) < 1e-11, "newton converges");
assert.ok(x.every((v, i) => Math.abs(v - ref[i]) < 1e-7), "back to the reference");

// move one of the 5 free choices: still solvable, but a different yantra
let y = ref.slice(); y[NAMES.indexOf("U4")] += 0.01;
for (let k = 0; k < 20; k++) y = newtonStep(y);
assert.ok(norm(residuals(y)) < 1e-11, "another exact yantra");
console.log("yantra.js ok, residual", norm(residuals(x)).toExponential(2));
