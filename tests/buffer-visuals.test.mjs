import assert from "node:assert/strict";
import { bufferVisualClass } from "../bufferVisuals.js";

assert.equal(bufferVisualClass("Large cutoff buffer"), "buffer-large");
assert.equal(bufferVisualClass("Medium cutoff buffer"), "buffer-medium");
assert.equal(bufferVisualClass("Small cutoff buffer"), "buffer-small");
assert.equal(bufferVisualClass("Small cutoff gap"), "buffer-small-gap");
assert.equal(bufferVisualClass("Medium cutoff gap"), "buffer-medium-gap");
assert.equal(bufferVisualClass("Large cutoff gap"), "buffer-large-gap");
assert.equal(bufferVisualClass("Unknown"), "buffer-unknown");

console.log("buffer visual classes work");
