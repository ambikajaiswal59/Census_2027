import { useEffect, useRef } from "react";
import Map from "ol/Map.js";
import View from "ol/View.js";
import TileLayer from "ol/layer/Tile.js";
import XYZ from "ol/source/XYZ.js";
import { transformExtent } from "ol/proj.js";
import { defaults as defaultInteractions } from "ol/interaction.js";
import "ol/ol.css";

// OpenLayers map of the census dashboard.
//
// For now the map is ONE layer: the coloured tiles painted by the backend tile
// server. The old browser-drawn layers (state / district shapes, borders, picked-area
// outline and names) are removed, so there is no hover, click-to-select or names on
// the map yet. The zoom, reset and fullscreen buttons still work.

// Address of the tile server. Put VITE_TILE_URL in .env to change it without editing
// this file (for example VITE_TILE_URL=http://192.168.1.28:6999).
const TILE_BASE_URL =
  (typeof import.meta !== "undefined" && import.meta.env?.VITE_TILE_URL) ||
  "http://192.168.1.28:6999";

// Hard coded for now (TL): always the same column and table, whichever parameter or
// level is chosen on the page.
const TILE_URL = `${TILE_BASE_URL}/tiles/{z}/{x}/{y}.png?column=total_population&table=states`;

// India, in lon / lat, used to frame the first view and the reset button.
const INDIA_EXTENT_LONLAT = [68.1, 6.5, 97.5, 37.3];

const MIN_ZOOM_OFFSET = 0.3; // how far you can zoom out from the framed view
const MAX_ZOOM = 9.2; // State / UT map zooms less far
const MAX_ZOOM_DISTRICT = 10.4;

export default function OlMap({
  level,
  onControlsReady, // ({ zoomIn, zoomOut, reset })
  onLoaded, // the map is on screen (hides MapCard's loader)
}) {
  const hostRef = useRef(null);
  const viewRef = useRef(null);

  const isDistrict = level === "District";

  // Always the latest callbacks, read inside OpenLayers events (created once).
  const live = useRef({});
  live.current = { onLoaded };

  /* ---------------- build the map once ---------------- */
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return undefined;

    const tileLayer = new TileLayer({
      source: new XYZ({
        url: TILE_URL,
        minZoom: 5,
        maxZoom: 18,
        crossOrigin: "anonymous",
        tileSize: 256,
        transition: 0,
        wrapX: false,
      }),
      visible: true,
      zIndex: 0,
    });

    // Say in the browser console why no colours show (server down, wrong column or
    // table, blocked by CORS).
    let tileWarned = false;
    tileLayer.getSource().on("tileloaderror", (event) => {
      if (tileWarned) return;
      tileWarned = true;
      console.warn(
        "[map tiles] A tile failed to load. Open this address in a browser tab to see why:",
        event.tile?.getKey?.(),
      );
    });

    const view = new View({
      projection: "EPSG:3857",
      center: [0, 0],
      zoom: 4.5,
      minZoom: 3,
      maxZoom: MAX_ZOOM,
      constrainResolution: false,
    });
    viewRef.current = view;

    const map = new Map({
      target: host,
      layers: [tileLayer],
      view,
      controls: [],
      interactions: defaultInteractions({
        altShiftDragRotate: false,
        pinchRotate: false,
      }),
    });

    const indiaExtent = transformExtent(
      INDIA_EXTENT_LONLAT,
      "EPSG:4326",
      "EPSG:3857",
    );

    const frame = (duration = 0) => {
      const size = map.getSize();
      if (!size || !size[0] || !size[1]) return;

      view.fit(indiaExtent, {
        size,
        padding: [10, 10, 10, 10],
        duration,
      });
    };

    let framed = false;

    // Keep the canvas the size of its box (fullscreen, window resize, flex layout).
    const observer = new ResizeObserver(() => {
      map.updateSize();

      if (!framed && map.getSize()?.[0]) {
        framed = true;
        frame(0);

        const z = view.getZoom();
        if (typeof z === "number") {
          view.setMinZoom(Math.max(1, z - MIN_ZOOM_OFFSET));
        }
      }
    });
    observer.observe(host);

    // The loader goes away once the map has drawn for the first time.
    map.once("rendercomplete", () => live.current.onLoaded?.());

    onControlsReady?.({
      zoomIn: () =>
        view.animate({ zoom: (view.getZoom() ?? 5) + 0.4, duration: 200 }),
      zoomOut: () =>
        view.animate({ zoom: (view.getZoom() ?? 5) - 0.4, duration: 200 }),
      reset: () => frame(450),
    });

    return () => {
      observer.disconnect();
      map.setTarget(undefined);
      map.dispose();
      viewRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------------- level switched ---------------- */
  // The tiles are the same for both levels for now, so there is nothing to reload:
  // only zoom limit changes, and the page's loader is cleared.
  useEffect(() => {
    viewRef.current?.setMaxZoom(isDistrict ? MAX_ZOOM_DISTRICT : MAX_ZOOM);

    // Clear the page's loader a moment later: the parent card turns it on after
    // this effect runs, so clearing it straight away would leave it stuck on.
    const id = setTimeout(() => live.current.onLoaded?.(), 60);
    return () => clearTimeout(id);
  }, [isDistrict]);

  return <div ref={hostRef} className="absolute inset-0" />;
}
