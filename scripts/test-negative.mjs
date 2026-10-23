import { execFileSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const root = process.cwd();
const matrixFile = path.join(root, "src/adapters/bootstrap/compatibility.json");
const matrix = JSON.parse(fs.readFileSync(matrixFile, "utf8"));

const expectFailure = (name, mutate, message) => {
  const file = path.join(os.tmpdir(), `kroma-negative-${process.pid}-${name}.json`);
  const copy = structuredClone(matrix);
  mutate(copy);
  fs.writeFileSync(file, JSON.stringify(copy, null, 2));
  try {
    execFileSync(process.execPath, ["scripts/check-theme-layers.mjs"], {
      cwd: root,
      env: { ...process.env, KROMA_COMPATIBILITY_FILE: file },
      encoding: "utf8",
      stdio: "pipe",
    });
    throw new Error(`${name}: checker accepted an invalid matrix`);
  } catch (error) {
    if (error.status !== 1) throw error;
    const output = `${error.stdout}${error.stderr}`;
    if (!output.includes(message)) throw new Error(`${name}: unexpected failure\n${output}`);
  } finally {
    fs.rmSync(file, { force: true });
  }
};

expectFailure("unknown-target", (copy) => {
  copy[0].mappings[0].target = "--bs-not-a-real-token";
}, "is not a Bootstrap 5.3.8 API");

expectFailure("unknown-source", (copy) => {
  copy[0].mappings[0].source = "--kroma-not-a-real-token";
}, "unknown Kroma source");

expectFailure("missing-scope", (copy) => {
  delete copy[0].scope;
  delete copy[0].scopes;
}, "adapter has no rule for undefined");

expectFailure("missing-mechanism", (copy) => {
  delete copy[0].mechanism;
}, "missing mechanism");

console.log("Negative compatibility checks passed: 4 mutations rejected.");
