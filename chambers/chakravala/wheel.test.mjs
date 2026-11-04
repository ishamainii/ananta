import { chakravala } from "./wheel.js";
import assert from "node:assert/strict";
const last = N => chakravala(N).at(-1);
assert.deepEqual([last(61).a, last(61).b, last(61).k], [1766319049n, 226153980n, 1n]);
for (const N of [2, 3, 7, 13, 61, 67, 94, 109, 181, 433, 661, 991, 4999])
  for (const { a, b, k } of chakravala(N)) assert.equal(a * a - BigInt(N) * b * b, k);
console.log("991:", last(991).a.toString(), last(991).a.toString().length, "digits");
console.log("turns 61:", chakravala(61).length - 1);
console.log("wheel.js ok");
