// Split the ADV 150 GLB's single red body mesh into separately-paintable parts.
//
// The source model (3D Warehouse, Arq. Vini Boschetti) has all red bodywork in
// one primitive with material "[Color A07]". Connected-component analysis
// (scripts/analyze-adv150.mjs) shows, in raw coords (+Y = front, +Z = up):
//   - front fairing:   one island, y > 5.7
//   - rear body L/R:   one island per side, y < 2.2 (side spear + tail merged)
// Split:
//   paint_front : whole triangles with centroid y > 4 (falls in a real gap)
//   paint_side / paint_rear : the rear islands CLIPPED against an angled
//     plane f = y - 0.4z + 16 = 0 that follows the bike's visual panel line;
//     crossing triangles are cut with interpolated vertices so the seam is a
//     clean straight line, not a jagged triangle boundary.
//
// Usage: node scripts/split-adv150.mjs <input.glb> <output.glb>
import { NodeIO, PropertyType } from "@gltf-transform/core";
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions";
import { dedup, prune, quantize, weld } from "@gltf-transform/functions";

const [input, output] = process.argv.slice(2);
const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS);
const doc = await io.read(input);

await doc.transform(weld());

const FRONT_MIN_Y = 4;
// Signed distance to the side/rear seam plane; >0 = side panel, <0 = tail
const seam = (p) => p[1] - 0.4 * p[2] + 16;

let done = false;
for (const mesh of doc.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    const mat = prim.getMaterial();
    if (!mat || mat.getName() !== "[Color A07]" || done) continue;
    done = true;

    const indices = prim.getIndices().getArray();
    const semantics = prim.listSemantics();
    const attributes = semantics.map((s) => prim.getAttribute(s));
    const readVertex = (i) =>
      attributes.map((a) => {
        const el = new Array(a.getElementSize()).fill(0);
        a.getElement(i, el);
        return el;
      });
    const lerpVertex = (va, vb, t) =>
      va.map((el, k) => el.map((x, c) => x + (vb[k][c] - x) * t));
    const posOf = (v) => v[semantics.indexOf("POSITION")];

    // Part builders: each accumulates its own vertex/index arrays.
    const makePart = (name) => ({
      name,
      verts: [],
      indices: [],
      byOrig: new Map(), // original vertex index -> part vertex index
      byEdge: new Map(), // clipped edge key -> part vertex index
      addOrig(i) {
        let idx = this.byOrig.get(i);
        if (idx === undefined) {
          idx = this.verts.push(readVertex(i)) - 1;
          this.byOrig.set(i, idx);
        }
        return idx;
      },
      addClipped(ia, ib, t) {
        const key = ia < ib ? `${ia}_${ib}` : `${ib}_${ia}`;
        let idx = this.byEdge.get(key);
        if (idx === undefined) {
          const v =
            ia < ib
              ? lerpVertex(readVertex(ia), readVertex(ib), t)
              : lerpVertex(readVertex(ib), readVertex(ia), 1 - t);
          idx = this.verts.push(v) - 1;
          this.byEdge.set(key, idx);
        }
        return idx;
      },
      addTriOrig(a, b, c) {
        this.indices.push(this.addOrig(a), this.addOrig(b), this.addOrig(c));
      },
      addPolygon(refs) {
        // refs: array of part vertex indices; fan-triangulate
        for (let i = 1; i < refs.length - 1; i++) {
          this.indices.push(refs[0], refs[i], refs[i + 1]);
        }
      },
    });

    const front = makePart("paint_front");
    const side = makePart("paint_side");
    const rear = makePart("paint_rear");

    for (let t = 0; t < indices.length; t += 3) {
      const tri = [indices[t], indices[t + 1], indices[t + 2]];
      const pos = tri.map((i) => posOf(readVertex(i)));
      const cy = (pos[0][1] + pos[1][1] + pos[2][1]) / 3;
      if (cy > FRONT_MIN_Y) {
        front.addTriOrig(...tri);
        continue;
      }

      const d = pos.map(seam);
      if (d.every((x) => x >= 0)) {
        side.addTriOrig(...tri);
        continue;
      }
      if (d.every((x) => x < 0)) {
        rear.addTriOrig(...tri);
        continue;
      }

      // Triangle crosses the seam: Sutherland–Hodgman against both half-spaces
      for (const part of [side, rear]) {
        const keep = part === side ? (x) => x >= 0 : (x) => x < 0;
        const polygon = [];
        for (let i = 0; i < 3; i++) {
          const j = (i + 1) % 3;
          if (keep(d[i])) polygon.push(part.addOrig(tri[i]));
          if (keep(d[i]) !== keep(d[j])) {
            const tt = d[i] / (d[i] - d[j]);
            polygon.push(part.addClipped(tri[i], tri[j], tt));
          }
        }
        if (polygon.length >= 3) part.addPolygon(polygon);
      }
    }

    const buffer = doc.getRoot().listBuffers()[0];
    for (const part of [front, side, rear]) {
      if (!part.indices.length) continue;
      const newPrim = doc.createPrimitive();
      semantics.forEach((sem, k) => {
        const src = attributes[k];
        const size = src.getElementSize();
        const arr = new Float32Array(part.verts.length * size);
        part.verts.forEach((v, vi) => arr.set(v[k], vi * size));
        const acc = doc
          .createAccessor(`${part.name}_${sem}`)
          .setType(src.getType())
          .setArray(arr)
          .setBuffer(buffer);
        newPrim.setAttribute(sem, acc);
      });
      newPrim.setIndices(
        doc
          .createAccessor(`${part.name}_indices`)
          .setType("SCALAR")
          .setArray(new Uint32Array(part.indices))
          .setBuffer(buffer)
      );
      newPrim.setMaterial(mat.clone().setName(part.name));
      mesh.addPrimitive(newPrim);
      console.log(
        `${part.name}: ${part.indices.length / 3} tris, ${part.verts.length} verts`
      );
    }

    mesh.removePrimitive(prim);
    prim.dispose();
    mat.dispose();
  }
}

if (!done) throw new Error('material "[Color A07]" not found');

// Dedup accessors only — the three paint materials are intentionally
// identical apart from their names and must stay separate.
await doc.transform(
  dedup({ propertyTypes: [PropertyType.ACCESSOR] }),
  prune(),
  quantize()
);
await io.write(output, doc);
console.log("wrote", output);
