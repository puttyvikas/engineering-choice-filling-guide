import assert from "node:assert/strict";
import { classifyChance, confidenceScore } from "../admissionModel.js";

assert.equal(classifyChance(700), "Large cutoff buffer");
assert.equal(confidenceScore(700), 92);

assert.equal(classifyChance(300), "Medium cutoff buffer");
assert.equal(confidenceScore(300), 75);

assert.equal(classifyChance(50), "Small cutoff buffer");
assert.equal(confidenceScore(50), 55);

assert.equal(classifyChance(-50), "Small cutoff gap");
assert.equal(confidenceScore(-50), 35);

assert.equal(classifyChance(-500), "Medium cutoff gap");
assert.equal(confidenceScore(-500), 20);

assert.equal(classifyChance(-900), "Large cutoff gap");
assert.equal(confidenceScore(-900), 5);

console.log("admission model labels work");
