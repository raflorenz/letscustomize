// Second-stage split for the ADV 150 GLB: runs on the PROCESSED file
// (public/models/honda-adv-150.glb, i.e. after split-adv150.mjs +
// compress-models.mjs), not on the 3D Warehouse source.
//
// Splits two more paint zones out of existing materials, classifying whole
// connected components in WORLD coordinates (post-node-transform: x = width,
// bike centered near x = -0.49; y = up; z = length, front at z = 0):
//   paint_rims   from "<auto>17"    — components whose bbox center lies inside
//     a wheel cylinder: |x + 0.49| < 0.08 and (y,z) within 0.24 of an axle at
//     (0.29, 0.29) front / (0.29, 1.81) rear. The other accents (panel inserts,
//     footboard trim) all sit outside the wheel planes, so the cut is clean.
//   paint_center from "[Color M04]" — components with bbox-center z < 1.35:
//     the big L/R gray panels between the front fairing and the side panels
//     (z 0.6–1.3). The small [Color M04] bits near the rear wheel (z ≥ 1.35)
//     stay on the original material, which remains pinned gray via
//     materialOverrides in data/motorcycles/honda-adv-150.ts.
//
// Whole-component classification (no triangle clipping) is safe here because
// every component is entirely on one side of its test — verified with the
// component dumps in scripts/analyze-paint.mjs. The new primitives share the
// original vertex accessors, so only new index buffers are added.
//
// Usage: node scripts/split-adv150-accents.mjs public/models/honda-adv-150.glb
//        (writes in place; pass a second path to write elsewhere)
// Run scripts/compress-models.mjs afterwards to restore meshopt compression.
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

const wheelAxles = [
  [0.29, 0.29],
  [0.29, 1.81],
];
const SPLITS = [
  {
    source: "<auto>17",
    newName: "paint_rims",
    take: ([x, y, z]) =>
      Math.abs(x + 0.49) < 0.08 &&
      wheelAxles.some(
        ([ay, az]) => (y - ay) ** 2 + (z - az) ** 2 < 0.24 ** 2
      ),
  },
  {
    source: "[Color M04]",
    newName: "paint_center",
    take: ([, , z]) => z < 1.35,
  },
];

// Locate each source material's primitive along with its node's world matrix.
const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const found = new Map(); // source name -> { prim, mesh, wm }
const visit = (node) => {
  const mesh = node.getMesh();
  if (mesh) {
    for (const prim of mesh.listPrimitives()) {
      const name = prim.getMaterial()?.getName();
      if (SPLITS.some((s) => s.source === name)) {
        if (found.has(name))
          throw new Error(`material "${name}" appears in multiple primitives`);
        found.set(name, { prim, mesh, wm: node.getWorldMatrix() });
      }
    }
  }
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);

for (const split of SPLITS) {
  const hit = found.get(split.source);
  if (!hit) throw new Error(`material "${split.source}" not found`);
  const { prim, mesh, wm } = hit;

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
    if (split.take(center)) taken.add(root);
  }

  const keepIdx = [];
  const takeIdx = [];
  for (let t = 0; t < idx.length; t += 3) {
    const dst = taken.has(find(idx[t])) ? takeIdx : keepIdx;
    dst.push(idx[t], idx[t + 1], idx[t + 2]);
  }
  if (!takeIdx.length)
    throw new Error(`${split.newName}: no components matched`);
  if (!keepIdx.length)
    throw new Error(`${split.newName}: took ALL of "${split.source}"`);

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
  newPrim.setIndices(makeIndices(`${split.newName}_indices`, takeIdx));
  newPrim.setMaterial(prim.getMaterial().clone().setName(split.newName));
  mesh.addPrimitive(newPrim);
  prim.setIndices(makeIndices(`${split.source}_keep_indices`, keepIdx));
  idxAccessor.dispose();

  console.log(
    `${split.source}: kept ${keepIdx.length / 3} tris, ` +
      `${split.newName} gets ${takeIdx.length / 3} tris (${taken.size} components)`
  );
}

// No dedup here — it could merge the intentionally-identical paint materials.
await doc.transform(prune());
await io.write(output, doc);
console.log("wrote", output);
