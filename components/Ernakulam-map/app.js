// ============================================================
// ERNAKULAM MAP — BUS STOP SYSTEM
// ============================================================


// ============================================================
// 1. MAP SETUP
// ============================================================

const map = new maplibregl.Map({
  container: "map",

  style: "https://tiles.openfreemap.org/styles/bright",

  // Current map focus
  center: [76.30348, 10.0098],

  // Close navigation-style zoom
  zoom: 19,

  // Ground-plane perspective
  pitch: 30,

  bearing: 0,

  minZoom: 14,
  maxZoom: 19,

  maxPitch: 65,

  dragRotate: false,
  touchPitch: false,

  attributionControl: true
});


// ============================================================
// 2. BUS STOP DATA
// ============================================================
//
// This is intentionally one TEST stop for now.
// Later we replace this array with real Ernakulam stops.
//
// longitude, latitude
// ============================================================

const BUS_STOPS = [

  {
    id: "test-stop-01",

    name: "Test Bus Stop",

    coordinates: [
      76.30348,
      10.0098
    ]
  }

];


// ============================================================
// 3. PROXIMITY REFERENCE
// ============================================================
//
// This represents the user's current / exploration location.
//
// Later this can come from:
// - GPS
// - selected map location
// - searched location
//
// For now it is fixed to our test location.
// ============================================================

let referenceLocation = {
  longitude: 76.30348,
  latitude: 10.0098
};


// ============================================================
// 4. BUS STOP DISTANCE RULES
// ============================================================

const LARGE_RADIUS = 400;

const SMALL_RADIUS = 800;


// ============================================================
// 5. BUS STOP ICON SIZES
// ============================================================
//
// Our PNG is 256 × 204.
// MapLibre icon-size scales that image.
//
// Large ≈ 56 px wide
// Small ≈ 33 px wide
// ============================================================

const LARGE_ICON_SIZE = 0.22;

const SMALL_ICON_SIZE = 0.13;


// ============================================================
// 6. ROAD-SIDE OFFSET
// ============================================================
//
// Approximate distance between road geometry and shelter.
// This is intentionally small.
// ============================================================

const ROAD_OFFSET_METERS = 7;


// ============================================================
// 7. MAP LOAD
// ============================================================

map.on("load", () => {

  console.log("MAP LOADED");


  // ==========================================================
  // GET ALL STYLE LAYERS
  // ==========================================================

  const layers = map.getStyle().layers;


  layers.forEach((layer) => {

    const id =
      layer.id.toLowerCase();

    const sourceLayer =
      layer["source-layer"]?.toLowerCase() || "";


    // ========================================================
    // REMOVE BUILDINGS
    // ========================================================

    if (
      id.includes("building") ||
      sourceLayer.includes("building")
    ) {

      try {

        map.setLayoutProperty(
          layer.id,
          "visibility",
          "none"
        );

      } catch (error) {}

    }


    // ========================================================
    // REMOVE POI CLUTTER
    // ========================================================

    if (
      sourceLayer.includes("poi") ||
      sourceLayer.includes("housenumber") ||
      id.includes("poi") ||
      id.includes("housenumber")
    ) {

      try {

        map.setLayoutProperty(
          layer.id,
          "visibility",
          "none"
        );

      } catch (error) {}

    }


    // ========================================================
    // BACKGROUND
    // ========================================================

    if (
      layer.type === "background"
    ) {

      try {

        map.setPaintProperty(
          layer.id,
          "background-color",
          "#E3E5E7"
        );

      } catch (error) {}

    }


    // ========================================================
    // LAND + WATER
    // ========================================================

    if (
      layer.type === "fill" ||
      layer.type === "fill-extrusion"
    ) {

      try {

        const isWater =
          sourceLayer.includes("water") ||
          id.includes("water") ||
          id.includes("ocean") ||
          id.includes("river") ||
          id.includes("lake");


        if (isWater) {

          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#D8DBDE"
          );

        } else {

          map.setPaintProperty(
            layer.id,
            "fill-color",
            "#E3E5E7"
          );

        }

      } catch (error) {}

    }


    // ========================================================
    // WATERWAYS
    // ========================================================

    if (
      layer.type === "line" &&
      (
        sourceLayer.includes("waterway") ||
        id.includes("waterway")
      )
    ) {

      try {

        map.setPaintProperty(
          layer.id,
          "line-color",
          "#D4D8DB"
        );

      } catch (error) {}

    }


    // ========================================================
    // ROAD HIERARCHY
    // ========================================================

    if (
      layer.type === "line" &&
      sourceLayer === "transportation"
    ) {

      let width = 3;

      const color = "#FFFFFF";


      // LOCAL ROADS
      if (
        id.includes("minor") ||
        id.includes("service") ||
        id.includes("residential") ||
        id.includes("street")
      ) {

        width = 2.5;

      }


      // TERTIARY
      if (
        id.includes("tertiary")
      ) {

        width = 5;

      }


      // SECONDARY
      if (
        id.includes("secondary")
      ) {

        width = 8;

      }


      // PRIMARY
      if (
        id.includes("primary")
      ) {

        width = 13;

      }


      // TRUNK
      if (
        id.includes("trunk")
      ) {

        width = 17;

      }


      // MOTORWAY
      if (
        id.includes("motorway")
      ) {

        width = 21;

      }


      try {

        map.setPaintProperty(
          layer.id,
          "line-color",
          color
        );

        map.setPaintProperty(
          layer.id,
          "line-width",
          width
        );

      } catch (error) {}

    }


    // ========================================================
    // ROAD LABELS
    // ========================================================

    if (
      layer.type === "symbol" &&
      sourceLayer === "transportation_name"
    ) {

      try {

        map.setPaintProperty(
          layer.id,
          "text-color",
          "#5E6368"
        );


        map.setPaintProperty(
          layer.id,
          "text-halo-color",
          "#E3E5E7"
        );


        map.setPaintProperty(
          layer.id,
          "text-halo-width",
          1.2
        );


        // MAJOR ROADS

        if (
          id.includes("motorway") ||
          id.includes("trunk") ||
          id.includes("primary")
        ) {

          map.setLayoutProperty(
            layer.id,
            "text-size",
            14
          );

        }


        // SECONDARY

        else if (
          id.includes("secondary") ||
          id.includes("tertiary")
        ) {

          map.setLayoutProperty(
            layer.id,
            "text-size",
            12
          );

        }


        // LOCAL

        else {

          map.setLayoutProperty(
            layer.id,
            "text-size",
            10
          );

        }

      } catch (error) {}

    }

  });


  // ==========================================================
  // CUSTOM ROAD NAME
  // ==========================================================

  const roadLabels =
    map.getStyle().layers.filter(
      (layer) =>
        layer.type === "symbol" &&
        layer["source-layer"] === "transportation_name"
    );


  roadLabels.forEach((layer) => {

    try {

      map.setLayoutProperty(
        layer.id,
        "text-field",
        [
          "case",

          [
            "==",
            ["get", "name"],
            "Old NH 47"
          ],

          "Palarivattom–Edappally Road",

          ["get", "name"]
        ]
      );

    } catch (error) {}

  });


  // ==========================================================
  // MAP INTERACTION
  // ==========================================================

  map.scrollZoom.enable();

  map.dragPan.enable();

  map.doubleClickZoom.enable();

  map.touchZoomRotate.enable();

  map.touchZoomRotate.disableRotation();

  map.keyboard.disable();

  map.boxZoom.disable();

  map.dragRotate.disable();

  map.touchPitch.disable();


  // ==========================================================
  // CAMERA
  // ==========================================================

  map.setPitch(30);

  map.setBearing(0);


  map.setPadding({
    top: 180,
    right: 0,
    bottom: 0,
    left: 0
  });


  // ==========================================================
  // LOAD BUS STOP ICON
  // ==========================================================

  map.loadImage(
    "Assets/bus-stop-nearby-v2.png",
    (error, image) => {

      if (error) {

        console.error(
          "BUS STOP ICON FAILED:",
          error
        );

        return;
      }


      // ------------------------------------------------------
      // Add image to MapLibre
      // ------------------------------------------------------

      if (
        !map.hasImage("bus-stop-icon")
      ) {

        map.addImage(
          "bus-stop-icon",
          image,
          {
            pixelRatio: 1
          }
        );

      }


      // ------------------------------------------------------
      // Wait until road tiles are rendered
      // ------------------------------------------------------

      map.once("idle", () => {

        createBusStopLayer();

      });

    }
  );


  // ==========================================================
  // 8. BUS STOP CREATION
  // ==========================================================

  function createBusStopLayer() {

    const roadLayerIds =
      map
        .getStyle()
        .layers
        .filter(
          (layer) =>
            layer.type === "line" &&
            layer["source-layer"] === "transportation"
        )
        .map(
          (layer) => layer.id
        );


    console.log(
      "ROAD LAYERS:",
      roadLayerIds
    );


    // --------------------------------------------------------
    // Prepare bus-stop features
    // --------------------------------------------------------

    const processedStops =
      BUS_STOPS.map(
        (stop) => {

          const originalLng =
            stop.coordinates[0];

          const originalLat =
            stop.coordinates[1];


          // Distance from active user/exploration position

          const distance =
            getDistanceMeters(
              referenceLocation.latitude,
              referenceLocation.longitude,
              originalLat,
              originalLng
            );


          // Find nearest road

          const roadMatch =
            findNearestRoad(
              originalLng,
              originalLat,
              roadLayerIds
            );


          let finalLng =
            originalLng;

          let finalLat =
            originalLat;

          let rotation = 0;


          // --------------------------------------------------
          // If road was found
          // --------------------------------------------------

          if (roadMatch) {

            // Move shelter beside road

            const roadsidePoint =
              moveAwayFromRoad(
                roadMatch,
                originalLng,
                originalLat
              );


            finalLng =
              roadsidePoint[0];

            finalLat =
              roadsidePoint[1];


            // Align long side of shelter
            // with road direction

            rotation =
              roadMatch.rotation - 90;

          }


          return {

            type: "Feature",

            geometry: {

              type: "Point",

              coordinates: [
                finalLng,
                finalLat
              ]

            },

            properties: {

              id: stop.id,

              name: stop.name,

              distance: distance,

              rotation: rotation

            }

          };

        }
      );


    // ========================================================
    // BUS STOP SOURCE
    // ========================================================

    map.addSource(
      "bus-stops",
      {

        type: "geojson",

        data: {

          type: "FeatureCollection",

          features: processedStops

        }

      }
    );


    // ========================================================
    // BUS STOP MAP-NATIVE SYMBOL
    // ========================================================

    map.addLayer({

      id: "bus-stops",

      type: "symbol",

      source: "bus-stops",

      layout: {

        // ----------------------------------------------------
        // Custom shelter icon
        // ----------------------------------------------------

        "icon-image":
          "bus-stop-icon",


        // ----------------------------------------------------
        // TWO STATES
        //
        // 0–400m  = large
        // 400–800m = small
        // >800m hidden through filter
        // ----------------------------------------------------

        "icon-size": [

          "case",

          [
            "<=",
            ["get", "distance"],
            LARGE_RADIUS
          ],

          LARGE_ICON_SIZE,

          SMALL_ICON_SIZE

        ],


        // ----------------------------------------------------
        // Rotation comes from road geometry
        // ----------------------------------------------------

        "icon-rotate":
          ["get", "rotation"],


        // ----------------------------------------------------
        // Make icon part of map plane
        // ----------------------------------------------------

        "icon-rotation-alignment":
          "map",

        "icon-pitch-alignment":
          "map",


        // ----------------------------------------------------
        // Coordinate represents bottom of shelter
        // ----------------------------------------------------

        "icon-anchor":
          "bottom",


        // ----------------------------------------------------
        // Don't let road labels hide stop
        // ----------------------------------------------------

        "icon-allow-overlap":
          true,

        "icon-ignore-placement":
          true

      },


      // ------------------------------------------------------
      // >800m = hidden
      // ------------------------------------------------------

      filter: [

        "<=",
        ["get", "distance"],
        SMALL_RADIUS

      ]

    });


    console.log(
      "BUS STOP SYSTEM READY"
    );

  }


  // ==========================================================
  // 9. FIND NEAREST ROAD
  // ==========================================================

  function findNearestRoad(
    longitude,
    latitude,
    roadLayerIds
  ) {

    if (
      !roadLayerIds.length
    ) {

      return null;

    }


    const point =
      map.project([
        longitude,
        latitude
      ]);


    const searchRadius =
      350;


    const bbox = [

      [
        point.x - searchRadius,
        point.y - searchRadius
      ],

      [
        point.x + searchRadius,
        point.y + searchRadius
      ]

    ];


    let roadFeatures = [];


    try {

      roadFeatures =
        map.queryRenderedFeatures(
          bbox,
          {
            layers:
              roadLayerIds
          }
        );

    } catch (error) {

      console.warn(
        "ROAD QUERY FAILED",
        error
      );

      return null;

    }


    if (
      !roadFeatures.length
    ) {

      return null;

    }


    let nearest = null;


    roadFeatures.forEach(
      (feature) => {

        const geometry =
          feature.geometry;


        if (
          !geometry
        ) {

          return;

        }


        const lines = [];


        // LineString

        if (
          geometry.type ===
          "LineString"
        ) {

          lines.push(
            geometry.coordinates
          );

        }


        // MultiLineString

        if (
          geometry.type ===
          "MultiLineString"
        ) {

          geometry.coordinates.forEach(
            (line) => {

              lines.push(line);

            }
          );

        }


        lines.forEach(
          (line) => {

            for (
              let i = 0;
              i < line.length - 1;
              i++
            ) {

              const a =
                line[i];

              const b =
                line[i + 1];


              const result =
                nearestPointOnSegment(
                  longitude,
                  latitude,
                  a[0],
                  a[1],
                  b[0],
                  b[1]
                );


              if (
                !nearest ||
                result.distance <
                  nearest.distance
              ) {

                nearest = {

                  point: [
                    result.lng,
                    result.lat
                  ],

                  distance:
                    result.distance,

                  rotation:
                    bearing(
                      a[1],
                      a[0],
                      b[1],
                      b[0]
                    )

                };

              }

            }

          }
        );

      }
    );


    return nearest;

  }


  // ==========================================================
  // 10. MOVE STOP TO ROADSIDE
  // ==========================================================

  function moveAwayFromRoad(
    roadMatch,
    originalLng,
    originalLat
  ) {

    const roadLng =
      roadMatch.point[0];

    const roadLat =
      roadMatch.point[1];


    const dx =
      originalLng - roadLng;

    const dy =
      originalLat - roadLat;


    const length =
      Math.sqrt(
        dx * dx +
        dy * dy
      );


    // If original stop is already
    // slightly away from road,
    // preserve its side.

    if (
      length > 0.000001
    ) {

      const ratio =
        metersToDegrees(
          ROAD_OFFSET_METERS,
          roadLat
        ) / length;


      return [

        roadLng +
          dx * ratio,

        roadLat +
          dy * ratio

      ];

    }


    // Fallback:
    // place it on one side of road

    const roadBearing =
      roadMatch.rotation *
      Math.PI /
      180;


    const sideLng =
      Math.cos(
        roadBearing
      );

    const sideLat =
      Math.sin(
        roadBearing
      );


    const offsetDegrees =
      metersToDegrees(
        ROAD_OFFSET_METERS,
        roadLat
      );


    return [

      roadLng +
        sideLng *
        offsetDegrees,

      roadLat +
        sideLat *
        offsetDegrees

    ];

  }


  // ==========================================================
  // 11. NEAREST POINT ON ROAD SEGMENT
  // ==========================================================

  function nearestPointOnSegment(
    px,
    py,

    ax,
    ay,

    bx,
    by
  ) {

    const scale =
      Math.cos(
        py *
        Math.PI /
        180
      );


    const axM =
      ax *
      111320 *
      scale;

    const ayM =
      ay *
      110540;


    const bxM =
      bx *
      111320 *
      scale;

    const byM =
      by *
      110540;


    const pxM =
      px *
      111320 *
      scale;

    const pyM =
      py *
      110540;


    const dx =
      bxM - axM;

    const dy =
      byM - ayM;


    const lengthSquared =
      dx * dx +
      dy * dy;


    let t = 0;


    if (
      lengthSquared > 0
    ) {

      t =
        (
          (pxM - axM) * dx +
          (pyM - ayM) * dy
        ) /
        lengthSquared;


      t =
        Math.max(
          0,
          Math.min(
            1,
            t
          )
        );

    }


    const nearestX =
      axM +
      t * dx;

    const nearestY =
      ayM +
      t * dy;


    const deltaX =
      pxM -
      nearestX;

    const deltaY =
      pyM -
      nearestY;


    const distance =
      Math.sqrt(
        deltaX * deltaX +
        deltaY * deltaY
      );


    const lng =
      nearestX /
        (
          111320 *
          scale
        );

    const lat =
      nearestY /
        110540;


    return {

      lng,
      lat,

      distance

    };

  }


  // ==========================================================
  // 12. BEARING
  // ==========================================================

  function bearing(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const phi1 =
      lat1 *
      Math.PI /
      180;

    const phi2 =
      lat2 *
      Math.PI /
      180;


    const deltaLambda =
      (
        lon2 - lon1
      ) *
      Math.PI /
      180;


    const y =
      Math.sin(
        deltaLambda
      ) *
      Math.cos(
        phi2
      );


    const x =
      Math.cos(
        phi1
      ) *
      Math.sin(
        phi2
      ) -

      Math.sin(
        phi1
      ) *
      Math.cos(
        phi2
      ) *
      Math.cos(
        deltaLambda
      );


    return (
      Math.atan2(
        y,
        x
      ) *
      180 /
      Math.PI +
      360
    ) % 360;

  }


  // ==========================================================
  // 13. HAVERSINE DISTANCE
  // ==========================================================

  function getDistanceMeters(
    lat1,
    lon1,
    lat2,
    lon2
  ) {

    const R =
      6371000;


    const phi1 =
      lat1 *
      Math.PI /
      180;

    const phi2 =
      lat2 *
      Math.PI /
      180;


    const deltaPhi =
      (
        lat2 - lat1
      ) *
      Math.PI /
      180;


    const deltaLambda =
      (
        lon2 - lon1
      ) *
      Math.PI /
      180;


    const a =
      Math.sin(
        deltaPhi / 2
      ) ** 2 +

      Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(
        deltaLambda / 2
      ) ** 2;


    const c =
      2 *
      Math.atan2(
        Math.sqrt(a),
        Math.sqrt(1 - a)
      );


    return R * c;

  }


  // ==========================================================
  // 14. METERS → LAT/LONG DEGREES
  // ==========================================================

  function metersToDegrees(
    meters,
    latitude
  ) {

    const metersPerDegree =
      111320 *
      Math.cos(
        latitude *
        Math.PI /
        180
      );


    return (
      meters /
      metersPerDegree
    );

  }


  // ==========================================================
  // 15. RESIZE
  // ==========================================================

  map.resize();

});