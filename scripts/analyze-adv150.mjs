// Phase 1: analyze connected components of the red body mesh in the ADV 150 GLB.
// Usage: node scripts/analyze-adv150.mjs <input.glb>
import { NodeIO } from "@gltf-transform/core";
import { weld } from "@gltf-transform/functions";

const input = process.argv[2];
const io = new NodeIO();
const doc = await io.read(input);

await doc.transform(weld());

const RED_MATERIALS = new Set(["[Color A07]"]);

for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    if (!mat || !RED_MATERIALS.has(mat.getName())) continue;

    const indices = prim.getIndices().getArray();
    const position = prim.getAttribute("POSITION");
    const vertCount = position.getCount();

    // Union-find over vertices
    const parent = new Uint32Array(vertCount);
    for (let i = 0; i < vertCount; i++) parent[i] = i;
    const find = (a) => {
      while (parent[a] !== a) {
        parent[a] = parent[parent[a]];
        a = parent[a];
      }
      return a;
    };
    const union = (a, b) => {
      const ra = find(a), rb = find(b);
      if (ra !== rb) parent[ra] = rb;
    };

    for (let t = 0; t < indices.length; t += 3) {
      union(indices[t], indices[t + 1]);
      union(indices[t], indices[t + 2]);
    }

    // Component stats keyed by root
    const comps = new Map();
    const el = [0, 0, 0];
    for (let t = 0; t < indices.length; t += 3) {
      const root = find(indices[t]);
      let c = comps.get(root);
      if (!c) {
        c = {
          tris: 0,
          min: [Infinity, Infinity, Infinity],
          max: [-Infinity, -Infinity, -Infinity],
        };
        comps.set(root, c);
      }
      c.tris++;
      for (let k = 0; k < 3; k++) {
        position.getElement(indices[t + k], el);
        for (let ax = 0; ax < 3; ax++) {
          if (el[ax] < c.min[ax]) c.min[ax] = el[ax];
          if (el[ax] > c.max[ax]) c.max[ax] = el[ax];
        }
      }
    }

    const list = [...comps.values()].sort((a, b) => b.tris - a.tris);
    console.log(`\nmesh "${mesh.getName()}" material "${mat.getName()}": ${list.length} components, ${indices.length / 3} tris total`);
    const r = (v) => v.map((x) => +x.toFixed(1)).join(",");
    list.forEach((c, i) => {
      const cx = c.min.map((m, ax) => +((m + c.max[ax]) / 2).toFixed(1));
      console.log(
        `#${i} tris=${c.tris} center=[${cx.join(",")}] min=[${r(c.min)}] max=[${r(c.max)}]`
      );
    });
  }
}
