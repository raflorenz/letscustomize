// Third-stage split for the ADV 150 GLB: runs on the PROCESSED file
// (public/models/honda-adv-150.glb, i.e. after split-adv150.mjs +
// split-adv150-accents.mjs + compress-models.mjs), not on the source.
//
// Splits the front fender out of the bulk "<auto>" material into a new
// "paint_fender" material so it can be painted with the Front Fairing part.
// World coords (post-node-transform): x = width, centerline x ~= -0.49;
// y = up; z = length, front at z = 0. The fender is exactly two connected
// components (outer shell 820 tris + inner liner 748 tris), both centered on
// the bike's centerline above the front wheel (bbox center ~[-0.49,0.48,0.37])
// and ~0.22 m wide. The same region holds ~490 tiny fork bolts / rings /
// reflector discs that must stay black, so the take-test requires the
// component to STRADDLE the centerline with real width (x size > 0.15) —
// every hardware bit there is under 0.01 wide or sits off-center.
//
// Usage: node scripts/split-adv150-fender.mjs public/models/honda-adv-150.glb
//        (writes in place; pass a second path to write elsewhere)
// Run scripts/compress-models.mjs afterwards to restore meshopt compression.
// Re-run this (after split-adv150-accents.mjs) if the model is regenerated.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
import { prune, weld } from "@gltf-transform/functions";
import { MeshoptDecoder, MeshoptEncoder } from "meshoptimizer";

const [input, output = process.argv[2]] = process.argv.slice(2);
await MeshoptDecoder.ready;
await MeshoptEncoder.ready;
const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    "meshopt.decoder": MeshoptDecoder,
    "meshopt.encoder": MeshoptEncoder,
  });
const doc = await io.read(input);
await doc.transform(weld());

const SOURCE = "<auto>";
const NEW_NAME = "paint_fender";
// (center, size) of a component's world-space bbox -> is it a fender shell?
const take = (center, size) =>
  Math.abs(center[0] + 0.49) < 0.05 &&
  center[1] > 0.4 &&
  center[1] < 0.55 &&
  center[2] > 0.25 &&
  center[2] < 0.45 &&
  size[0] > 0.15;

// Locate the source material's primitive and its node's world matrix.
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
let found = null;
const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      if (prim.getMaterial()?.getName() === SOURCE) {
        if (found)
          throw new Error(`material "${SOURCE}" appears in multiple primitives`);
        found = { prim, mesh, wm: node.getWorldMatrix() };
      }
    }
  }
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);
if (!found) throw new Error(`material "${SOURCE}" not found`);
const { prim, mesh, wm } = found;

const pos = prim.getAttribute("POSITION");
const idxAccessor = prim.getIndices();
const idx = idxAccessor.getArray();

// Union-find over welded vertices -> connected components.
const n = pos.getCount();
const parent = new Uint32Array(n);
for (let i = 0; i < n; i++) parent[i] = i;
const find = (a) => {
  while (parent[a] !== a) {
    parent[a] = parent[parent[a]];
    a = parent[a];
  }
  return a;
};
for (let t = 0; t < idx.length; t += 3) {
  const ra = find(idx[t]);
  parent[find(idx[t + 1])] = ra;
  parent[find(idx[t + 2])] = ra;
}

// World-space bbox per component.
const boxes = new Map();
const el = [0, 0, 0];
const xf = ([x, y, z]) => [
  wm[0] * x + wm[4] * y + wm[8] * z + wm[12],
  wm[1] * x + wm[5] * y + wm[9] * z + wm[13],
  wm[2] * x + wm[6] * y + wm[10] * z + wm[14],
];
for (let t = 0; t < idx.length; t += 3) {
  const root = find(idx[t]);
  let b = boxes.get(root);
  if (!b) {
    b = { min: [1 / 0, 1 / 0, 1 / 0], max: [-1 / 0, -1 / 0, -1 / 0] };
    boxes.set(root, b);
  }
  for (let k = 0; k < 3; k++) {
    pos.getElement(idx[t + k], el);
    const w = xf(el);
    for (let ax = 0; ax < 3; ax++) {
      if (w[ax] < b.min[ax]) b.min[ax] = w[ax];
      if (w[ax] > b.max[ax]) b.max[ax] = w[ax];
    }
  }
}
const taken = new Set();
for (const [root, b] of boxes) {
  const center = b.min.map((m, ax) => (m + b.max[ax]) / 2);
  const size = b.min.map((m, ax) => b.max[ax] - m);
  if (take(center, size)) taken.add(root);
}
if (taken.size !== 2)
  throw new Error(
    `${NEW_NAME}: expected exactly 2 fender shells, matched ${taken.size} components`
  );

const keepIdx = [];
const takeIdx = [];
for (let t = 0; t < idx.length; t += 3) {
  const dst = taken.has(find(idx[t])) ? takeIdx : keepIdx;
  dst.push(idx[t], idx[t + 1], idx[t + 2]);
}

const buffer = doc.getRoot().listBuffers()[0];
const makeIndices = (name, list) =>
  doc
    .createAccessor(name)
    .setType("SCALAR")
    .setArray(new idx.constructor(list))
    .setBuffer(buffer);

const newPrim = doc.createPrimitive();
for (const sem of prim.listSemantics())
  newPrim.setAttribute(sem, prim.getAttribute(sem));
newPrim.setIndices(makeIndices(`${NEW_NAME}_indices`, takeIdx));
newPrim.setMaterial(prim.getMaterial().clone().setName(NEW_NAME));
mesh.addPrimitive(newPrim);
prim.setIndices(makeIndices(`${SOURCE}_keep_indices`, keepIdx));
idxAccessor.dispose();

console.log(
  `${SOURCE}: kept ${keepIdx.length / 3} tris, ` +
    `${NEW_NAME} gets ${takeIdx.length / 3} tris (${taken.size} components)`
);

// No dedup here — it could merge the intentionally-identical paint materials.
await doc.transform(prune());
await io.write(output, doc);
console.log("wrote", output);
