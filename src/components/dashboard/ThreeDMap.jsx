import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

const STATE_GEOJSON_URL = "/data/census/states.geojson";
const DISTRICT_GEOJSON_URL = "/data/census/districts.geojson";

// Default camera position (x, y, z). Higher y and lower z = looking more from
// above, so the map stands up instead of lying down (about 56 degrees; was 35).
const DEFAULT_CAMERA = [0, 830, 560];

function projectCoordinate([longitude, latitude]) {
  // Equirectangular projection centered over India. Keeping this projection
  // consistent across every feature preserves adjacency between boundaries.
  const centerLongitude = 82.5;
  const centerLatitude = 22.5;
  const scale = 20;

  return [
    (longitude - centerLongitude) * scale,
    (latitude - centerLatitude) * scale,
  ];
}

function getPolygonGroups(geometry) {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
}

function ringToPath(ring) {
  const points = ring.map(projectCoordinate);
  if (points.length < 3) return null;

  const shape = new THREE.Shape();
  shape.moveTo(points[0][0], points[0][1]);
  points.slice(1).forEach(([x, y]) => shape.lineTo(x, y));
  shape.closePath();
  return shape;
}

function featureToShapes(feature) {
  const shapes = [];

  getPolygonGroups(feature.geometry).forEach((polygon) => {
    const outerRing = polygon[0];
    const shape = ringToPath(outerRing);
    if (!shape) return;

    // GeoJSON rings after the first are holes (lakes, enclaves, etc.).
    polygon.slice(1).forEach((ring) => {
      const points = ring.map(projectCoordinate);
      if (points.length < 3) return;
      const hole = new THREE.Path();
      hole.moveTo(points[0][0], points[0][1]);
      points.slice(1).forEach(([x, y]) => hole.lineTo(x, y));
      hole.closePath();
      shape.holes.push(hole);
    });

    shapes.push(shape);
  });

  return shapes;
}

function getNumericValue(row, key) {
  const value = row?.[key];
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : null;
}

function makeLabelSprite(text, heightUnits = 11) {
  const fontSize = 52;
  const probe = document.createElement("canvas").getContext("2d");
  probe.font = `bold ${fontSize}px Arial`;
  const textWidth = Math.ceil(probe.measureText(text).width);

  // Canvas is as wide as the text needs, so long names are not cut or squeezed.
  const canvas = document.createElement("canvas");
  canvas.width = textWidth + 48;
  canvas.height = 88;
  const context = canvas.getContext("2d");
  context.font = `bold ${fontSize}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.lineJoin = "round";
  context.lineWidth = 11;
  context.strokeStyle = "rgba(255,255,255,0.97)";
  context.strokeText(text, canvas.width / 2, canvas.height / 2);
  context.fillStyle = "#10284A";
  context.fillText(text, canvas.width / 2, canvas.height / 2);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const material = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: false,
    sizeAttenuation: true,
  });
  const sprite = new THREE.Sprite(material);
  sprite.scale.set(
    (canvas.width / canvas.height) * heightUnits,
    heightUnits,
    1,
  );
  sprite.renderOrder = 10;
  return sprite;
}

// Centre of mass of the largest polygon of the feature, as [x, z] in scene units.
// Shapes are drawn at (x, -y), so the label uses the same sign for depth.
function getFeatureCenter(feature) {
  let best = null;
  let bestArea = -1;

  getPolygonGroups(feature.geometry).forEach((polygon) => {
    const ring = (polygon[0] || []).map(projectCoordinate);
    let area = 0;
    let cx = 0;
    let cy = 0;

    for (let i = 0; i < ring.length - 1; i += 1) {
      const [x0, y0] = ring[i];
      const [x1, y1] = ring[i + 1];
      const cross = x0 * y1 - x1 * y0;
      area += cross;
      cx += (x0 + x1) * cross;
      cy += (y0 + y1) * cross;
    }

    if (area !== 0 && Math.abs(area) > bestArea) {
      bestArea = Math.abs(area);
      best = [cx / (3 * area), cy / (3 * area)];
    }
  });

  return best ? [best[0], -best[1]] : [0, 0];
}

// Width (scene units) of the feature's biggest part, to know if a name fits inside it.
function getFeatureWidth(feature) {
  let widest = 0;

  getPolygonGroups(feature.geometry).forEach((polygon) => {
    let min = Infinity;
    let max = -Infinity;
    (polygon[0] || []).forEach((point) => {
      const [x] = projectCoordinate(point);
      if (x < min) min = x;
      if (x > max) max = x;
    });
    if (max - min > widest) widest = max - min;
  });

  return widest;
}

function darkenColor(hex) {
  const color = new THREE.Color(hex);
  color.multiplyScalar(0.58);
  return color;
}

export default function ThreeDMap({
  level = "State / UT",
  activeParamKey,
  ranges = [],
  stateData = [],
  districtData = [],
  selectedRow = null,
  showLabels = false,
  getGeoName,
  getGeoStateName,
  getRow,
  isSelectedGeo,
  colorFor,
  onGeoClick,
  onHover,
  onLeave,
  onControlsReady,
  onLoaded,
}) {
  const hostRef = useRef(null);
  const loadedUrlRef = useRef(null); // boundary file already shown once
  const flownToRef = useRef(null); // name of the area the camera last flew to
  const [loading, setLoading] = useState(true);
  const engineRef = useRef(null);
  const viewStateRef = useRef(null);
  const callbacksRef = useRef({});
  callbacksRef.current = {
    getGeoName,
    getGeoStateName,
    getRow,
    isSelectedGeo,
    colorFor,
    onGeoClick,
    onHover,
    onLeave,
    onControlsReady,
    onLoaded,
  };
  const isDistrict = level === "District";
  const geoUrl = isDistrict ? DISTRICT_GEOJSON_URL : STATE_GEOJSON_URL;

  const data = isDistrict ? districtData : stateData;
  const dataKey = data
    .map(
      (row) =>
        `${row?.state ?? ""}:${row?.district ?? ""}:${row?.[activeParamKey] ?? ""}`,
    )
    .join("|");
  const rangesKey = ranges
    .map((range) => `${range.id}:${range.color}:${range.min}:${range.max}`)
    .join("|");

  const heightLimits = useMemo(() => {
    const values = data
      .map((row) => getNumericValue(row, activeParamKey))
      .filter((value) => value !== null);
    if (!values.length) return { min: 0, max: 1 };
    return {
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [dataKey, activeParamKey]);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    let disposed = false;
    let animationFrame = 0;
    if (loadedUrlRef.current !== `${geoUrl}|${showLabels}`) setLoading(true);
    let raycastFeatures = [];
    const districtLabels = []; // { sprite, width }: shown only when the name fits inside its district
    let frameCount = 0;
    let fly = null; // camera glide to the picked area: { t, fromPos, toPos, fromTarget, toTarget }
    let downAt = null; // where the pointer went down (to tell a click from a drag)
    let hoveredObject = null;
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(
      38,
      Math.max(host.clientWidth, 1) / Math.max(host.clientHeight, 1),
      0.1,
      4000,
    );
    camera.position.set(...DEFAULT_CAMERA);
    if (viewStateRef.current?.cameraPosition) {
      camera.position.fromArray(viewStateRef.current.cameraPosition);
    }
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: "high-performance",
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(host.clientWidth || 800, host.clientHeight || 500);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.style.display = "block";
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    renderer.domElement.style.touchAction = "none";
    host.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 2.15));
    const keyLight = new THREE.DirectionalLight(0xffffff, 2.6);
    keyLight.position.set(-260, 500, 320);
    keyLight.castShadow = true;
    scene.add(keyLight);
    const fillLight = new THREE.DirectionalLight(0xc8dcff, 1.2);
    fillLight.position.set(280, 250, -240);
    scene.add(fillLight);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enableRotate = true;
    controls.enablePan = true;
    // District map can zoom in very close; the State / UT map stops further away.
    controls.minDistance = isDistrict ? 45 : 140;
    controls.maxDistance = 1700;
    controls.minPolarAngle = 0.18;
    controls.maxPolarAngle = Math.PI / 2.03;
    controls.target.set(0, 0, 0);
    if (viewStateRef.current?.target) {
      controls.target.fromArray(viewStateRef.current.target);
    }
    callbacksRef.current.onControlsReady?.({
      zoomIn: () => {
        camera.position
          .sub(controls.target)
          .multiplyScalar(0.8)
          .add(controls.target);
        controls.update();
      },
      zoomOut: () => {
        camera.position
          .sub(controls.target)
          .multiplyScalar(1.25)
          .add(controls.target);
        controls.update();
      },
      reset: () => {
        camera.position.set(...DEFAULT_CAMERA);
        controls.target.set(0, 0, 0);
        controls.update();
      },
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    const basePlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2000, 1600),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    basePlane.rotation.x = -Math.PI / 2;
    basePlane.position.y = -1.5;
    basePlane.receiveShadow = true;
    scene.add(basePlane);

    const handleResize = () => {
      if (disposed) return;
      const width = Math.max(host.clientWidth, 1);
      const height = Math.max(host.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(host);

    const updatePointer = (event) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const intersections = raycaster.intersectObjects(
        raycastFeatures.map((item) => item.mesh),
        false,
      );
      const hit = intersections[0]?.object;
      const item = hit
        ? raycastFeatures.find((entry) => entry.mesh === hit)
        : null;

      if (event.type === "pointermove") {
        if (hoveredObject && hoveredObject !== hit) {
          hoveredObject.scale.set(1, 1, 1);
        }
        hoveredObject = hit || null;
        if (hoveredObject) {
          hoveredObject.scale.set(1.006, 1, 1.006);
          renderer.domElement.style.cursor = "pointer";
          callbacksRef.current.onHover?.(event, item.feature, item.name);
        } else {
          renderer.domElement.style.cursor = "grab";
          callbacksRef.current.onLeave?.();
        }
      } else if (event.type === "click" && item) {
        callbacksRef.current.onGeoClick?.(item.feature, item.name);
      }
    };

    const rememberDown = (event) => {
      downAt = { x: event.clientX, y: event.clientY };
    };
    // A drag (rotate / move) must not pick an area when the button is released.
    const handleClick = (event) => {
      if (
        downAt &&
        Math.hypot(event.clientX - downAt.x, event.clientY - downAt.y) > 5
      ) {
        return;
      }
      updatePointer(event);
    };

    renderer.domElement.addEventListener("pointermove", updatePointer);
    renderer.domElement.addEventListener("pointerdown", rememberDown);
    renderer.domElement.addEventListener("click", handleClick);

    const loadFeatures = async () => {
      try {
        const response = await fetch(geoUrl);
        if (!response.ok)
          throw new Error(`Unable to load map boundaries (${response.status})`);
        const geojson = await response.json();
        if (disposed) return;

        // Let the browser paint the spinner before the heavy building starts.
        await new Promise((resolve) =>
          requestAnimationFrame(() => setTimeout(resolve, 30)),
        );
        if (disposed) return;

        const validFeatures = (geojson.features || []).map((feature) => {
          const name = callbacksRef.current.getGeoName(feature, level);
          const row = callbacksRef.current.getRow(feature, name);
          const value = getNumericValue(row, activeParamKey);
          const fill = callbacksRef.current.colorFor(value);
          const selected = callbacksRef.current.isSelectedGeo(
            feature,
            name,
            row,
          );
          const span = heightLimits.max - heightLimits.min;
          const normalized =
            value === null
              ? 0
              : span > 0
                ? (value - heightLimits.min) / span
                : 0.5;
          // Compress the range to keep outliers from dwarfing smaller regions.
          const height =
            value === null ? 2.5 : 5 + Math.sqrt(Math.max(0, normalized)) * 44;
          return { feature, name, row, value, fill, selected, height };
        });

        // Center the map using its geographic extent, so all supported datasets
        // remain aligned to the same India-centered projection.
        const allPoints = [];
        validFeatures.forEach(({ feature }) => {
          const walk = (coords) => {
            if (!Array.isArray(coords)) return;
            if (typeof coords[0] === "number") {
              allPoints.push(coords);
              return;
            }
            coords.forEach(walk);
          };
          walk(feature.geometry?.coordinates);
        });
        if (allPoints.length) {
          const centerLon =
            (Math.min(...allPoints.map((p) => p[0])) +
              Math.max(...allPoints.map((p) => p[0]))) /
            2;
          const centerLat =
            (Math.min(...allPoints.map((p) => p[1])) +
              Math.max(...allPoints.map((p) => p[1]))) /
            2;
          // Keep the geographic centre at the origin.
          const offsetX = (82.5 - centerLon) * 20;
          const offsetZ = (centerLat - 22.5) * 20;
          scene.position.set(offsetX, 0, offsetZ);
        }

        validFeatures.forEach(({ feature, name, fill, selected, height }) => {
          const shapes = featureToShapes(feature);
          const featureGroup = new THREE.Group();
          shapes.forEach((shape) => {
            const geometry = new THREE.ExtrudeGeometry(shape, {
              depth: height,
              bevelEnabled: false,
              curveSegments: 1,
              steps: 1,
            });
            // ExtrudeGeometry starts in the XY plane and extrudes along Z.
            // Rotate it so height is vertical, while geographic Y becomes depth.
            geometry.rotateX(-Math.PI / 2);
            geometry.computeVertexNormals();

            const topMaterial = new THREE.MeshStandardMaterial({
              color: fill,
              roughness: 0.82,
              metalness: 0.02,
              side: THREE.DoubleSide,
            });
            const sideMaterial = new THREE.MeshStandardMaterial({
              color: darkenColor(fill),
              roughness: 0.9,
              metalness: 0.01,
              side: THREE.DoubleSide,
            });
            const mesh = new THREE.Mesh(geometry, [topMaterial, sideMaterial]);
            mesh.position.y = 0;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            mesh.userData.feature = feature;
            featureGroup.add(mesh);

            // Draw only the real geographic outline on the TOP surface.
            // EdgesGeometry(ExtrudeGeometry) also outlines triangulation and
            // every vertical wall edge, which creates the stretched-line effect.
            const outlineMaterial = new THREE.LineBasicMaterial({
              color: selected ? "#00D9FF" : isDistrict ? "#D3DCE8" : "#64748B",
              transparent: true,
              opacity: selected ? 1 : 0.78,
              depthTest: true,
            });

            const outlinePoints = shape
              .getPoints(1)
              .map(
                (point) => new THREE.Vector3(point.x, height + 0.12, -point.y),
              );
            if (outlinePoints.length > 1) {
              // Ensure the outline closes without drawing internal triangulation.
              const first = outlinePoints[0];
              const last = outlinePoints[outlinePoints.length - 1];
              if (first.distanceToSquared(last) > 1e-8)
                outlinePoints.push(first.clone());
              const outlineGeometry = new THREE.BufferGeometry().setFromPoints(
                outlinePoints,
              );
              const outline = new THREE.Line(outlineGeometry, outlineMaterial);
              outline.renderOrder = selected ? 5 : 2;
              featureGroup.add(outline);
            }
            raycastFeatures.push({ feature, name, mesh });
          });

          if (showLabels && name) {
            const [x, z] = getFeatureCenter(feature);
            const label = makeLabelSprite(name, isDistrict ? 6 : 18);
            label.position.set(x, height + (isDistrict ? 4 : 10), z);
            if (isDistrict) {
              label.visible = false;
              districtLabels.push({
                sprite: label,
                width: getFeatureWidth(feature),
              });
            }
            featureGroup.add(label);
          }
          scene.add(featureGroup);
        });

        // The picked area (from the map or from the table): glide the camera to it.
        const picked = validFeatures.find((item) => item.selected);
        if (!picked) {
          flownToRef.current = null;
        } else if (flownToRef.current !== picked.name) {
          flownToRef.current = picked.name;
          const [cx, cz] = getFeatureCenter(picked.feature);
          const width = getFeatureWidth(picked.feature);
          const aim = new THREE.Vector3(
            cx + scene.position.x,
            picked.height * 0.5,
            cz + scene.position.z,
          );
          const away = camera.position.clone().sub(controls.target).normalize();
          const distance = isDistrict
            ? THREE.MathUtils.clamp(width * 2.4, 70, 700)
            : THREE.MathUtils.clamp(width * 3.2, 170, 850);
          fly = {
            t: 0,
            fromPos: camera.position.clone(),
            toPos: aim.clone().add(away.multiplyScalar(distance)),
            fromTarget: controls.target.clone(),
            toTarget: aim,
          };
        }

        loadedUrlRef.current = `${geoUrl}|${showLabels}`;
        setLoading(false);
        callbacksRef.current.onLoaded?.();
      } catch (error) {
        if (!disposed) {
          setLoading(false);
          callbacksRef.current.onLoaded?.();
        }
        console.error("3D map failed to load:", error);
        host.dataset.mapError = "true";
      }
    };

    loadFeatures();

    const render = () => {
      if (disposed) return;
      animationFrame = requestAnimationFrame(render);
      if (fly) {
        fly.t = Math.min(1, fly.t + 0.045);
        const e = 1 - Math.pow(1 - fly.t, 3); // ease out
        camera.position.lerpVectors(fly.fromPos, fly.toPos, e);
        controls.target.lerpVectors(fly.fromTarget, fly.toTarget, e);
        if (fly.t >= 1) fly = null;
      }

      controls.update();

      // District names: show a name only when it fits inside its own district on
      // screen, so zooming in reveals clear, non-overlapping names.
      if (districtLabels.length && frameCount % 6 === 0) {
        const viewHeight = Math.max(renderer.domElement.clientHeight, 1);
        const k =
          viewHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)));
        const spot = new THREE.Vector3();

        districtLabels.forEach(({ sprite, width }) => {
          sprite.getWorldPosition(spot);
          const distance = Math.max(camera.position.distanceTo(spot), 1);
          const districtPx = (width * k) / distance;
          const labelPx = (sprite.scale.x * k) / distance;
          sprite.visible = labelPx <= districtPx * 1.1;
        });
      }
      frameCount += 1;

      renderer.render(scene, camera);
    };
    render();

    engineRef.current = { scene, camera, renderer, controls };

    return () => {
      viewStateRef.current = {
        cameraPosition: camera.position.toArray(),
        target: controls.target.toArray(),
      };
      callbacksRef.current.onControlsReady?.(null);
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      renderer.domElement.removeEventListener("pointermove", updatePointer);
      renderer.domElement.removeEventListener("click", handleClick);
      renderer.domElement.removeEventListener("pointerdown", rememberDown);
      controls.dispose();
      scene.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          const materials = Array.isArray(object.material)
            ? object.material
            : [object.material];
          materials.forEach((material) => {
            if (material.map) material.map.dispose();
            material.dispose();
          });
        }
      });
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
      engineRef.current = null;
    };
  }, [
    geoUrl,
    level,
    activeParamKey,
    rangesKey,
    stateData,
    districtData,
    selectedRow,
    showLabels,
    heightLimits,
    dataKey,
    isDistrict,
  ]);

  return (
    <>
      <div
        ref={hostRef}
        className="absolute inset-0 h-full w-full"
        aria-label={`${level} 3D census map. Drag to rotate, scroll to zoom.`}
        role="application"
      />

      {loading && (
        <div
          className="absolute inset-0 z-[5] flex flex-col items-center justify-center gap-3 bg-white/60 backdrop-blur-[1px]"
          role="status"
          aria-live="polite"
        >
          <span className="h-10 w-10 animate-spin rounded-full border-4 border-[#CFE4FA] border-t-navy" />
          <span className="text-[12px] font-bold text-navy">
            {isDistrict ? "Building district 3D map…" : "Building 3D map…"}
          </span>
        </div>
      )}
    </>
  );
}
