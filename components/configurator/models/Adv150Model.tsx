"use client";

import * as THREE from "three";
import { useConfiguratorStore } from "@/stores/configurator-store";
import { FINISHES } from "@/lib/materials";
import type { FinishId, HexColor } from "@/types/configurator";

/* ------------------------------------------------------------------------ */
/* Honda ADV 150 — procedural model built from reference photos and specs:   */
/*   length 1950mm, wheelbase 1324mm, seat 795mm, tires 110/80-14 & 130/70-13 */
/* Units are meters. Bike faces +X, up is +Y, ground at y = 0.               */
/* Geometry is built once at module scope (pure math, no WebGL needed).     */
/* ------------------------------------------------------------------------ */

function extrudePanel(
  build: (s: THREE.Shape) => void,
  depth: number,
  bevel = 0.04
): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  build(shape);
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 5,
    curveSegments: 32,
  });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

const FRONT_AXLE: [number, number, number] = [0.662, 0.266, 0];
const REAR_AXLE: [number, number, number] = [-0.662, 0.256, 0];
const FORK_RAKE = 0.39; // ~22° from vertical

/** Front apron / leg shield with the adventure beak under the headlight */
const apronGeo = extrudePanel((s) => {
  s.moveTo(0.44, 0.5);
  s.quadraticCurveTo(0.52, 0.5, 0.58, 0.55);
  s.quadraticCurveTo(0.63, 0.59, 0.7, 0.64);
  s.lineTo(0.86, 0.7); // beak tip
  s.quadraticCurveTo(0.79, 0.75, 0.71, 0.76);
  s.quadraticCurveTo(0.66, 0.84, 0.62, 0.92); // headlight face
  s.quadraticCurveTo(0.57, 1.02, 0.44, 1.05); // up to windscreen base
  s.quadraticCurveTo(0.35, 1.03, 0.33, 0.96);
  s.quadraticCurveTo(0.3, 0.76, 0.4, 0.6); // near-vertical knee-side edge
  s.quadraticCurveTo(0.43, 0.53, 0.44, 0.5);
}, 0.28, 0.05);

/** Red under-seat spear panel (side panels part) */
const spearGeo = extrudePanel((s) => {
  s.moveTo(0.16, 0.77);
  s.lineTo(-0.44, 0.81);
  s.lineTo(-0.44, 0.62);
  s.quadraticCurveTo(-0.15, 0.55, 0.05, 0.59);
  s.quadraticCurveTo(0.14, 0.63, 0.16, 0.77);
}, 0.3, 0.04);

/** Upswept pointed tail (rear cowl part) */
const tailGeo = extrudePanel((s) => {
  s.moveTo(-0.42, 0.82);
  s.quadraticCurveTo(-0.62, 0.91, -0.8, 0.91);
  s.lineTo(-0.87, 0.87); // tail point
  s.quadraticCurveTo(-0.64, 0.7, -0.44, 0.62); // upswept underside
  s.lineTo(-0.42, 0.7);
  s.lineTo(-0.42, 0.82);
}, 0.26, 0.045);

/** Silver accent blade sweeping from the footboard up under the seat */
const bladeGeo = extrudePanel((s) => {
  s.moveTo(0.38, 0.48);
  s.quadraticCurveTo(0.05, 0.36, -0.18, 0.4);
  s.quadraticCurveTo(-0.34, 0.44, -0.4, 0.58);
  s.lineTo(-0.34, 0.61);
  s.quadraticCurveTo(-0.27, 0.5, -0.13, 0.46);
  s.quadraticCurveTo(0.08, 0.42, 0.34, 0.53);
  s.lineTo(0.38, 0.48);
}, 0.31, 0.02);

/** Black lower body: floor + engine-bay fairing */
const lowerBodyGeo = extrudePanel((s) => {
  s.moveTo(0.4, 0.6);
  s.lineTo(0.36, 0.42);
  s.quadraticCurveTo(0.1, 0.34, -0.14, 0.36);
  s.quadraticCurveTo(-0.32, 0.39, -0.4, 0.56);
  s.lineTo(-0.42, 0.7);
  s.lineTo(-0.05, 0.62);
  s.lineTo(0.4, 0.6);
}, 0.26, 0.03);

/** Two-level stepped seat */
const seatGeo = extrudePanel((s) => {
  s.moveTo(0.18, 0.79);
  s.quadraticCurveTo(0.2, 0.83, 0.1, 0.845);
  s.quadraticCurveTo(-0.05, 0.855, -0.2, 0.845);
  s.quadraticCurveTo(-0.27, 0.9, -0.34, 0.925);
  s.quadraticCurveTo(-0.45, 0.945, -0.53, 0.925);
  s.quadraticCurveTo(-0.57, 0.9, -0.55, 0.86);
  s.lineTo(-0.5, 0.82);
  s.quadraticCurveTo(-0.15, 0.77, 0.05, 0.775);
  s.lineTo(0.18, 0.79);
}, 0.28, 0.035);

/** Rear fender arm dropping from the tail over the rear wheel */
const fenderArmGeo = extrudePanel((s) => {
  s.moveTo(-0.64, 0.76);
  s.quadraticCurveTo(-0.8, 0.68, -0.86, 0.52);
  s.lineTo(-0.92, 0.42);
  s.lineTo(-0.86, 0.4);
  s.quadraticCurveTo(-0.78, 0.56, -0.6, 0.68);
  s.lineTo(-0.64, 0.76);
}, 0.08, 0.01);

/** Windscreen: rounded trapezoid, built flat then leaned back */
const windscreenGeo = (() => {
  const s = new THREE.Shape();
  s.moveTo(-0.19, 0);
  s.lineTo(0.19, 0);
  s.lineTo(0.16, 0.3);
  s.quadraticCurveTo(0, 0.37, -0.16, 0.3);
  s.lineTo(-0.19, 0);
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    curveSegments: 24,
  });
  geo.translate(0, 0, -0.006);
  return geo;
})();

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */

/** Paint material driven by the configurator store for a given part */
function Paint({ partId }: { partId: string }) {
  const customization = useConfiguratorStore(
    (s) => s.partCustomizations[partId]
  );
  const color: HexColor = customization?.color ?? "#b02330";
  const finishId: FinishId = customization?.finish ?? "gloss";
  const finish = FINISHES[finishId];

  return (
    <meshPhysicalMaterial
      color={color}
      roughness={finish.roughness}
      metalness={finish.metalness}
      clearcoat={finish.clearcoat}
      clearcoatRoughness={finish.clearcoatRoughness}
    />
  );
}

function BlackPlastic() {
  return <meshStandardMaterial color="#1b1b1e" roughness={0.7} />;
}

function DarkMetal() {
  return <meshStandardMaterial color="#3a3d42" metalness={0.7} roughness={0.4} />;
}

function Silver() {
  return <meshStandardMaterial color="#d0d3d8" metalness={0.85} roughness={0.25} />;
}

/* ------------------------------------------------------------------ */
/* Wheels                                                              */
/* ------------------------------------------------------------------ */

function Wheel({
  position,
  radius,
  tube,
  widthScale = 1,
  discSide = 1,
  discRadius = 0.12,
}: {
  position: [number, number, number];
  radius: number;
  tube: number;
  widthScale?: number;
  discSide?: 1 | -1;
  discRadius?: number;
}) {
  const major = radius - tube;
  const rimR = major - tube * 0.4;
  return (
    <group position={position}>
      {/* Tire */}
      <mesh scale={[1, 1, widthScale]}>
        <torusGeometry args={[major, tube, 20, 56]} />
        <meshStandardMaterial color="#121213" roughness={0.94} />
      </mesh>
      {/* Rim lip */}
      <mesh>
        <torusGeometry args={[rimR, 0.013, 12, 48]} />
        <meshStandardMaterial color="#2e3033" metalness={0.85} roughness={0.3} />
      </mesh>
      {/* 5 double spokes */}
      {Array.from({ length: 10 }, (_, i) => {
        const angle =
          (Math.floor(i / 2) * Math.PI * 2) / 5 + (i % 2 === 0 ? -0.12 : 0.12);
        return (
          <group key={i} rotation-z={angle}>
            <mesh position={[rimR * 0.5, 0, 0]}>
              <boxGeometry args={[rimR, 0.017, 0.015]} />
              <meshStandardMaterial
                color="#2e3033"
                metalness={0.85}
                roughness={0.3}
              />
            </mesh>
          </group>
        );
      })}
      {/* Hub */}
      <mesh rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.048, 0.048, 0.08, 24]} />
        <DarkMetal />
      </mesh>
      {/* Brake disc */}
      <mesh rotation-x={Math.PI / 2} position={[0, 0, discSide * 0.048]}>
        <cylinderGeometry args={[discRadius, discRadius, 0.005, 40]} />
        <meshStandardMaterial color="#a7aab0" metalness={0.9} roughness={0.35} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Front end: fork, fender, handlebar, mirrors                         */
/* ------------------------------------------------------------------ */

function FrontEnd() {
  return (
    <group>
      {/* 110/80-14 front wheel */}
      <Wheel position={FRONT_AXLE} radius={0.266} tube={0.054} discRadius={0.12} />

      {/* Telescopic fork, visible below the apron */}
      <group position={FRONT_AXLE} rotation-z={FORK_RAKE}>
        {[-0.075, 0.075].map((z) => (
          <group key={z} position-z={z}>
            <mesh position-y={0.18}>
              <cylinderGeometry args={[0.023, 0.026, 0.36, 16]} />
              <Silver />
            </mesh>
            <mesh position-y={0.55}>
              <cylinderGeometry args={[0.015, 0.015, 0.4, 16]} />
              <meshStandardMaterial
                color="#d5d8dc"
                metalness={0.95}
                roughness={0.15}
              />
            </mesh>
          </group>
        ))}
        {/* Brake caliper on right slider */}
        <mesh position={[0.05, 0.1, 0.075]} rotation-z={0.3}>
          <boxGeometry args={[0.05, 0.09, 0.035]} />
          <meshStandardMaterial color="#c9a227" metalness={0.7} roughness={0.35} />
        </mesh>
      </group>

      {/* Front fender hugger — customizable */}
      <mesh position={FRONT_AXLE} rotation-z={0.1} scale={[1, 1, 1.35]}>
        <torusGeometry args={[0.29, 0.033, 14, 40, 1.9]} />
        <Paint partId="front-fender" />
      </mesh>
    </group>
  );
}

function Handlebar() {
  return (
    <group>
      {/* Stem + silver clamp */}
      <group position={[0.37, 0.99, 0]} rotation-z={0.35}>
        <mesh position-y={0.04}>
          <cylinderGeometry args={[0.022, 0.026, 0.1, 12]} />
          <DarkMetal />
        </mesh>
      </group>
      <mesh position={[0.335, 1.06, 0]}>
        <boxGeometry args={[0.055, 0.045, 0.09]} />
        <Silver />
      </mesh>

      {/* Tubular bar: straight center, raised outer segments */}
      <mesh position={[0.33, 1.07, 0]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.014, 0.014, 0.26, 12]} />
        <BlackPlastic />
      </mesh>
      {[-1, 1].map((side) => (
        <group
          key={side}
          position={[0.33, 1.07, side * 0.12]}
          rotation={[-side * 0.22, side * 0.18, 0]}
        >
          <mesh position-z={side * 0.1} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.013, 0.013, 0.2, 12]} />
            <BlackPlastic />
          </mesh>
          {/* Grip */}
          <mesh position-z={side * 0.21} rotation-x={Math.PI / 2}>
            <cylinderGeometry args={[0.018, 0.018, 0.11, 12]} />
            <meshStandardMaterial color="#0f0f10" roughness={0.9} />
          </mesh>
          {/* Brake lever */}
          <mesh
            position={[0.055, 0.01, side * 0.19]}
            rotation-y={side * 0.25}
          >
            <boxGeometry args={[0.09, 0.012, 0.02]} />
            <Silver />
          </mesh>
        </group>
      ))}

      {/* Mirrors on tall stalks */}
      {[-1, 1].map((side) => (
        <group key={side} position={[0.31, 1.09, side * 0.19]}>
          <mesh rotation-x={side * 0.3} position={[0, 0.07, side * 0.022]}>
            <cylinderGeometry args={[0.009, 0.009, 0.15, 8]} />
            <BlackPlastic />
          </mesh>
          <mesh
            position={[0, 0.155, side * 0.05]}
            rotation={[side * 0.15, 0, 0]}
            scale={[0.26, 0.62, 1]}
          >
            <sphereGeometry args={[0.06, 20, 14]} />
            <BlackPlastic />
          </mesh>
        </group>
      ))}

      {/* Instrument cluster behind the windscreen */}
      <mesh position={[0.38, 1.02, 0]} rotation-z={-0.45}>
        <boxGeometry args={[0.03, 0.1, 0.16]} />
        <meshStandardMaterial color="#0c0c0e" roughness={0.3} />
      </mesh>
      <mesh position={[0.394, 1.023, 0]} rotation-z={-0.45}>
        <boxGeometry args={[0.005, 0.07, 0.12]} />
        <meshStandardMaterial
          color="#0a2530"
          emissive="#2a7a90"
          emissiveIntensity={0.8}
          roughness={0.2}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Bodywork                                                            */
/* ------------------------------------------------------------------ */

function Bodywork() {
  return (
    <group>
      {/* Front apron with beak — customizable */}
      <mesh geometry={apronGeo}>
        <Paint partId="fairing-front" />
      </mesh>

      {/* Black inner panel (glove box area, rider side) */}
      <mesh position={[0.32, 0.74, 0]} rotation-z={-0.12}>
        <boxGeometry args={[0.06, 0.42, 0.32]} />
        <BlackPlastic />
      </mesh>

      {/* Under-seat spear panels — customizable */}
      <mesh geometry={spearGeo}>
        <Paint partId="side-panels" />
      </mesh>

      {/* Tail cowl — customizable */}
      <mesh geometry={tailGeo}>
        <Paint partId="rear-cowl" />
      </mesh>

      {/* Silver accent blade */}
      <mesh geometry={bladeGeo}>
        <Silver />
      </mesh>

      {/* Black lower body */}
      <mesh geometry={lowerBodyGeo}>
        <BlackPlastic />
      </mesh>

      {/* Center tunnel between apron and seat */}
      <mesh position={[0.26, 0.6, 0]} rotation-z={-0.1}>
        <boxGeometry args={[0.22, 0.26, 0.2]} />
        <BlackPlastic />
      </mesh>

      {/* Footboards */}
      {[-0.16, 0.16].map((z) => (
        <mesh key={z} position={[0.12, 0.4, z]}>
          <boxGeometry args={[0.4, 0.025, 0.1]} />
          <BlackPlastic />
        </mesh>
      ))}

      {/* Seat */}
      <mesh geometry={seatGeo}>
        <meshStandardMaterial color="#141416" roughness={0.88} />
      </mesh>

      {/* Under-tail filler between cowl and drivetrain */}
      <mesh position={[-0.56, 0.68, 0]} rotation-z={0.35}>
        <boxGeometry args={[0.3, 0.14, 0.2]} />
        <BlackPlastic />
      </mesh>

      {/* Windscreen leaning back from the apron top */}
      <group position={[0.43, 1.04, 0]} rotation-z={0.5} scale={1.12}>
        <mesh geometry={windscreenGeo} rotation-y={-Math.PI / 2}>
          <meshPhysicalMaterial
            color="#9fb8c8"
            transparent
            opacity={0.4}
            roughness={0.05}
            metalness={0.1}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
      {/* Windscreen brackets */}
      {[-0.06, 0.06].map((z) => (
        <mesh key={z} position={[0.42, 1.08, z]} rotation-z={0.5}>
          <boxGeometry args={[0.014, 0.12, 0.018]} />
          <BlackPlastic />
        </mesh>
      ))}

      {/* Headlight: black angular housing + twin LED lenses above the beak */}
      <mesh position={[0.67, 0.815, 0]} rotation-z={-0.5}>
        <boxGeometry args={[0.07, 0.19, 0.3]} />
        <meshStandardMaterial color="#0d0d0f" roughness={0.25} />
      </mesh>
      {[-0.075, 0.075].map((z) => (
        <mesh
          key={z}
          position={[0.705, 0.813, z]}
          rotation={[0, -Math.sign(z) * 0.12, -0.5]}
        >
          <boxGeometry args={[0.016, 0.09, 0.11]} />
          <meshStandardMaterial
            color="#e8f4ff"
            emissive="#dff2ff"
            emissiveIntensity={1.8}
          />
        </mesh>
      ))}

      {/* Front turn signals at the fairing shoulders */}
      {[-0.2, 0.2].map((z) => (
        <mesh key={z} position={[0.45, 0.97, z]} rotation-z={-0.3}>
          <boxGeometry args={[0.02, 0.08, 0.022]} />
          <meshStandardMaterial
            color="#c87820"
            emissive="#ff9a2a"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}

      {/* Grab rails flanking the pillion */}
      {[-0.17, 0.17].map((z) => (
        <mesh key={z} position={[-0.42, 0.86, z]} rotation-z={0.15}>
          <boxGeometry args={[0.3, 0.022, 0.03]} />
          <BlackPlastic />
        </mesh>
      ))}

      {/* Tail light on the tail point */}
      <mesh position={[-0.845, 0.85, 0]} rotation-z={0.4}>
        <boxGeometry args={[0.025, 0.075, 0.22]} />
        <meshStandardMaterial
          color="#7a1010"
          emissive="#ff2222"
          emissiveIntensity={1.2}
        />
      </mesh>

      {/* Rear fender arm, plate and signals */}
      <mesh geometry={fenderArmGeo}>
        <BlackPlastic />
      </mesh>
      {[-0.09, 0.09].map((z) => (
        <mesh key={z} position={[-0.87, 0.49, z]}>
          <boxGeometry args={[0.015, 0.02, 0.055]} />
          <meshStandardMaterial
            color="#c87820"
            emissive="#ff9a2a"
            emissiveIntensity={0.35}
          />
        </mesh>
      ))}
      <mesh position={[-0.915, 0.4, 0]} rotation-z={0.15}>
        <boxGeometry args={[0.012, 0.1, 0.15]} />
        <meshStandardMaterial color="#e8e8e2" roughness={0.6} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */
/* Drivetrain: engine, CVT, exhaust, shocks, rear wheel                */
/* ------------------------------------------------------------------ */

function Drivetrain() {
  return (
    <group>
      {/* 130/70-13 rear wheel */}
      <Wheel
        position={REAR_AXLE}
        radius={0.256}
        tube={0.068}
        widthScale={1.05}
        discSide={-1}
        discRadius={0.11}
      />

      {/* Engine block under the seat front */}
      <mesh position={[-0.18, 0.36, 0]}>
        <boxGeometry args={[0.34, 0.24, 0.26]} />
        <meshStandardMaterial color="#2a2a2d" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh position={[0.02, 0.33, 0.02]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.06, 0.06, 0.14, 20]} />
        <DarkMetal />
      </mesh>

      {/* CVT case doubling as swingarm (left side) */}
      <mesh position={[-0.38, 0.31, -0.16]} rotation-z={0.12}>
        <boxGeometry args={[0.54, 0.19, 0.055]} />
        <DarkMetal />
      </mesh>
      <mesh position={[-0.18, 0.33, -0.19]} rotation-x={Math.PI / 2}>
        <cylinderGeometry args={[0.085, 0.085, 0.03, 24]} />
        <BlackPlastic />
      </mesh>
      {/* Right-side swingarm link */}
      <mesh position={[-0.5, 0.28, 0.11]}>
        <boxGeometry args={[0.34, 0.05, 0.03]} />
        <DarkMetal />
      </mesh>

      {/* Exhaust: brushed muffler with black tip (right side) */}
      <mesh
        position={[-0.2, 0.28, 0.12]}
        rotation={[0, 0.12, Math.PI / 2 - 0.18]}
      >
        <cylinderGeometry args={[0.018, 0.018, 0.5, 12]} />
        <DarkMetal />
      </mesh>
      <mesh position={[-0.52, 0.37, 0.17]} rotation-z={Math.PI / 2 - 0.12}>
        <cylinderGeometry args={[0.068, 0.062, 0.38, 20]} />
        <meshStandardMaterial color="#c0c3c8" metalness={0.85} roughness={0.3} />
      </mesh>
      <mesh position={[-0.7, 0.394, 0.17]} rotation-z={Math.PI / 2 - 0.12}>
        <cylinderGeometry args={[0.045, 0.05, 0.05, 16]} />
        <BlackPlastic />
      </mesh>
      {/* Heat shield strip */}
      <mesh position={[-0.5, 0.43, 0.19]} rotation-z={-0.12}>
        <boxGeometry args={[0.3, 0.02, 0.08]} />
        <Silver />
      </mesh>

      {/* Twin rear shocks with yellow springs — signature ADV detail */}
      {[-0.145, 0.145].map((z) => (
        <group key={z} position={[-0.55, 0.55, z]} rotation-z={-0.4}>
          <mesh position-y={0.13}>
            <cylinderGeometry args={[0.011, 0.011, 0.18, 10]} />
            <Silver />
          </mesh>
          <mesh position-y={-0.05}>
            <cylinderGeometry args={[0.017, 0.017, 0.26, 12]} />
            <DarkMetal />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh key={i} position-y={0.07 - i * 0.044}>
              <torusGeometry args={[0.03, 0.0085, 8, 20]} />
              <meshStandardMaterial
                color="#d4a017"
                metalness={0.75}
                roughness={0.3}
              />
            </mesh>
          ))}
        </group>
      ))}

      {/* Rear hugger */}
      <mesh position={REAR_AXLE} rotation-z={1.15} scale={[1, 1, 1.3]}>
        <torusGeometry args={[0.3, 0.035, 12, 32, 1.0]} />
        <BlackPlastic />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------ */

export function Adv150Model() {
  return (
    <group>
      <FrontEnd />
      <Handlebar />
      <Bodywork />
      <Drivetrain />
    </group>
  );
}
