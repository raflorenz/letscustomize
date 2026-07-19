// Second-stage split for the Honda PCX GLB: runs on the PROCESSED file
// (public/models/honda-pcx.glb, i.e. after split-pcx.mjs + compress-models.mjs),
// not on the Sketchfab source.
//
// Unlike the ADV accents split, no geometry is cut here: each rim is already a
// whole primitive that merely SHARES a generic black-hardware material with
// dozens of other parts. The two rim primitives get their own cloned
// materials so the part mapping can target them:
//   paint_rims      — node "Object_96",  was "preto_metalico"   (front rim)
//   paint_rims_rear — node "Object_208", was "preto_metalico_2" (rear rim)
// Identified with report-meshes.mjs: each is the only primitive with a
// circular world bbox centered on its axle (front [0.72,0.26] r≈0.19, rear
// [-0.57,0.25] r≈0.18). The other preto_metalico* meshes near the wheels are
// the fork/caliper (Object_102), rear drum/axle hardware (Object_158) and
// front suspension (Object_83) — the bbox roundness assert below catches a
// node-name shuffle if the model is ever regenerated from source.
//
// Usage: node scripts/split-pcx-rims.mjs public/models/honda-pcx.glb
//        (writes in place; pass a second path to write elsewhere)
// Run scripts/compress-models.mjs afterwards to restore meshopt compression.
import { NodeIO } from "@gltf-transform/core";
import { ALL_EXTENSIONS } from "@gltf-transform/extensions";
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

const SPLITS = [
  { node: "Object_96", source: "preto_metalico", newName: "paint_rims" },
  { node: "Object_208", source: "preto_metalico_2", newName: "paint_rims_rear" },
];

const scene = doc.getRoot().getDefaultScene() || doc.getRoot().listScenes()[0];
const nodes = new Map();
const visit = (node) => {
  if (node.getMesh()) nodes.set(node.getName(), node);
  node.listChildren().forEach(visit);
};
scene.listChildren().forEach(visit);

for (const split of SPLITS) {
  const node = nodes.get(split.node);
  if (!node) throw new Error(`node "${split.node}" not found`);
  const prims = node
    .getMesh()
    .listPrimitives()
    .filter((p) => p.getMaterial()?.getName() === split.source);
  if (prims.length !== 1)
    throw new Error(
      `expected 1 "${split.source}" primitive on ${split.node}, got ${prims.length}`
    );
  const [prim] = prims;

  // A rim's world bbox is a circle in the x/y (length/up) plane — reject
  // anything that isn't, in case node names shifted in a regenerated GLB.
  const wm = node.getWorldMatrix();
  const pos = prim.getAttribute("POSITION");
  const min = [1 / 0, 1 / 0, 1 / 0];
  const max = [-1 / 0, -1 / 0, -1 / 0];
  const el = [0, 0, 0];
  for (let i = 0; i < pos.getCount(); i++) {
    pos.getElement(i, el);
    const w = [
      wm[0] * el[0] + wm[4] * el[1] + wm[8] * el[2] + wm[12],
      wm[1] * el[0] + wm[5] * el[1] + wm[9] * el[2] + wm[13],
      wm[2] * el[0] + wm[6] * el[1] + wm[10] * el[2] + wm[14],
    ];
    for (let ax = 0; ax < 3; ax++) {
      if (w[ax] < min[ax]) min[ax] = w[ax];
      if (w[ax] > max[ax]) max[ax] = w[ax];
    }
  }
  const dx = max[0] - min[0];
  const dy = max[1] - min[1];
  if (Math.abs(dx - dy) > 0.15 * Math.max(dx, dy))
    throw new Error(
      `${split.node} bbox is not round (${dx.toFixed(2)} x ${dy.toFixed(2)}) — not a rim?`
    );

  prim.setMaterial(prim.getMaterial().clone().setName(split.newName));
  console.log(
    `${split.node}: ${prim.getIndices().getCount() / 3} tris ` +
      `(${dx.toFixed(2)} x ${dy.toFixed(2)} m) -> ${split.newName}`
  );
}

await io.write(output, doc);
console.log("wrote", output);
