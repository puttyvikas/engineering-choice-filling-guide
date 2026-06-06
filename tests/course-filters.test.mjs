import assert from "node:assert/strict";
import { isBtechCourse, isFiveYearDualDegreeCourse } from "../courseFilters.js";

assert.equal(isBtechCourse("Civil Engineering (4 Years, Bachelor of Technology)"), true);
assert.equal(isBtechCourse("Economics (5 Years, Bachelor of Science and Master of Science (Dual Degree))"), false);

assert.equal(
  isFiveYearDualDegreeCourse("Computer Science and Engineering (5 Years, Bachelor and Master of Technology (Dual Degree))"),
  true,
);
assert.equal(isFiveYearDualDegreeCourse("Architecture (5 Years, Bachelor of Architecture)"), false);
assert.equal(isFiveYearDualDegreeCourse("Electrical Engineering (4 Years, Bachelor of Technology)"), false);

console.log("course filters work");
