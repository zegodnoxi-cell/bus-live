// ============================================================
// ERNAKULAM BUS INTERACTION MAP
// ============================================================


// ============================================================
// MAP SETUP
// ============================================================

const map = new maplibregl.Map({

  container: "map",

  style:
    "https://tiles.openfreemap.org/styles/bright",

  // Ernakulam
  center: [
    76.30348,
    10.0098
  ],

  zoom: 19,

  pitch: 30,

  bearing: 0,

  minZoom: 14,

  maxZoom: 20,

  maxPitch: 65,

  dragRotate: false,

  touchPitch: false,

  attributionControl: true

});


// Make map available globally
window.map = map;


// ============================================================
// BUS STOP CONFIGURATION
// ============================================================

const BUS_STOP_RADIUS_METERS = 2000;

const BUS_STOP_REFRESH_DISTANCE_METERS = 300;


// Last location used for bus-stop query
let lastBusStopQueryLocation = null;


// Prevent duplicate Overpass requests
let busStopRequestInProgress = false;


// Prevent duplicate GPS watches
let busStopLocationWatchId = null;


// User's current location
let userLocation = null;


// User location marker
let userLocationMarker = null;


// ============================================================
// MAP LOAD
// ============================================================

map.on("load", () => {

  console.log(
    "MAP LOADED SUCCESSFULLY"
  );


  // ----------------------------------------------------------
  // GET STYLE LAYERS
  // ----------------------------------------------------------

  const layers =
    map.getStyle().layers || [];


  // ----------------------------------------------------------
  // CUSTOMIZE MAP
  // ----------------------------------------------------------

  layers.forEach((layer) => {

    const id =
      layer.id?.toLowerCase() || "";

    const sourceLayer =
      layer["source-layer"]?.toLowerCase() || "";


    // --------------------------------------------------------
    // REMOVE BUILDINGS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // REMOVE POI CLUTTER
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // BACKGROUND
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // LAND + WATER
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // WATERWAYS
    // --------------------------------------------------------

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


    // --------------------------------------------------------
    // ROAD SYSTEM
    // --------------------------------------------------------

    if (
      layer.type === "line" &&
      sourceLayer === "transportation"
    ) {

      let width = 3;

      const color =
        "#FFFFFF";


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


    // --------------------------------------------------------
    // ROAD LABELS
    // --------------------------------------------------------

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


        // SECONDARY ROADS

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


        // LOCAL ROADS

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
        layer["source-layer"] ===
          "transportation_name"
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


  // ==========================================================
  // MAP PADDING
  // ==========================================================

  map.setPadding({

    top: 180,

    right: 0,

    bottom: 0,

    left: 0

  });


  // ==========================================================
  // FORCE RESIZE
  // ==========================================================

  map.resize();


  // ==========================================================
  // BUS STOP LAYER
  // ==========================================================

  setupBusStopLayer();


  // ==========================================================
  // IMPORTANT
  // ==========================================================
  //
  // DO NOT START GPS HERE.
  //
  // GPS starts only after:
  //
  // PHONE
  //   ↓
  // OTP
  //   ↓
  // LOCATION BUTTON
  //
  // ==========================================================

  console.log(
    "MAP READY — waiting for location permission"
  );

});


// ============================================================
// BUS STOP LAYER SETUP
// ============================================================

function setupBusStopLayer() {

  // ----------------------------------------------------------
  // GEOJSON SOURCE
  // ----------------------------------------------------------

  if (
    !map.getSource(
      "nearby-bus-stops"
    )
  ) {

    map.addSource(
      "nearby-bus-stops",
      {

        type: "geojson",

        data: {

          type:
            "FeatureCollection",

          features: []

        }

      }
    );

  }


  // ----------------------------------------------------------
  // BUS STOP VISUAL
  // ----------------------------------------------------------

  if (
    !map.getLayer(
      "nearby-bus-stops"
    )
  ) {

    map.addLayer({

      id:
        "nearby-bus-stops",

      type:
        "circle",

      source:
        "nearby-bus-stops",

      minzoom:
        15,

      paint: {

        "circle-radius": [

          "interpolate",

          ["linear"],

          ["zoom"],

          15,
          4,

          17,
          5,

          19,
          6,

          20,
          7

        ],

        "circle-color":
          "#FFFFFF",

        "circle-stroke-color":
          "#111111",

        "circle-stroke-width":
          2,

        "circle-opacity":
          1

      }

    });

  }


  console.log(
    "BUS STOP LAYER READY"
  );

}


// ============================================================
// OTP
// ============================================================
//
// HTML already contains:
//
// otp-1
// otp-2
// otp-3
// otp-4
//
// and:
//
// otp-submit
//
// ============================================================

const otpScreen =
  document.getElementById(
    "otp-screen"
  );

const locationScreen =
  document.getElementById(
    "location-screen"
  );

const otpSubmit =
  document.getElementById(
    "otp-submit"
  );

const locationButton =
  document.getElementById(
    "location-button"
  );


const otpBoxes = [

  document.getElementById(
    "otp-1"
  ),

  document.getElementById(
    "otp-2"
  ),

  document.getElementById(
    "otp-3"
  ),

  document.getElementById(
    "otp-4"
  )

].filter(Boolean);


// ============================================================
// OTP INPUT BEHAVIOUR
// ============================================================

otpBoxes.forEach(
  (box, index) => {

    // --------------------------------------------------------
    // INPUT
    // --------------------------------------------------------

    box.addEventListener(
      "input",
      () => {

        let value =
          box.value.replace(
            /\D/g,
            ""
          );


        // ----------------------------------------------------
        // HANDLE OTP AUTOFILL
        // ----------------------------------------------------

        if (
          value.length > 1
        ) {

          const digits =
            value
              .slice(0, 4)
              .split("");


          otpBoxes.forEach(
            (otpBox, digitIndex) => {

              otpBox.value =
                digits[
                  digitIndex
                ] || "";

            }
          );


          const lastIndex =
            Math.min(
              digits.length - 1,
              otpBoxes.length - 1
            );


          if (
            otpBoxes[lastIndex]
          ) {

            otpBoxes[
              lastIndex
            ].focus();

          }


          return;

        }


        // ----------------------------------------------------
        // NORMAL ONE DIGIT INPUT
        // ----------------------------------------------------

        box.value =
          value.slice(0, 1);


        if (
          box.value &&
          index <
            otpBoxes.length - 1
        ) {

          otpBoxes[
            index + 1
          ].focus();

        }

      }
    );


    // --------------------------------------------------------
    // KEYBOARD
    // --------------------------------------------------------

    box.addEventListener(
      "keydown",
      (event) => {

        if (
          event.key ===
            "Backspace" &&
          box.value === "" &&
          index > 0
        ) {

          otpBoxes[
            index - 1
          ].focus();

        }


        if (
          event.key === "Enter"
        ) {

          event.preventDefault();

          verifyOTP();

        }

      }
    );


    // --------------------------------------------------------
    // PASTE
    // --------------------------------------------------------

    box.addEventListener(
      "paste",
      (event) => {

        event.preventDefault();


        const pasted =
          (
            event.clipboardData ||
            window.clipboardData
          )
            .getData("text")
            .replace(/\D/g, "")
            .slice(0, 4);


        if (!pasted) {

          return;

        }


        pasted
          .split("")
          .forEach(
            (digit, digitIndex) => {

              if (
                otpBoxes[
                  digitIndex
                ]
              ) {

                otpBoxes[
                  digitIndex
                ].value =
                  digit;

              }

            }
          );


        const lastIndex =
          Math.min(
            pasted.length - 1,
            otpBoxes.length - 1
          );


        if (
          otpBoxes[lastIndex]
        ) {

          otpBoxes[
            lastIndex
          ].focus();

        }

      }
    );

  }
);


// ============================================================
// VERIFY OTP
// ============================================================

function verifyOTP() {

  const otp =
    otpBoxes
      .map(
        (box) =>
          box.value
      )
      .join("");


  // TEST MODE
  //
  // Any 4 digit OTP is accepted.
  //

  if (
    !/^\d{4}$/.test(otp)
  ) {

    const firstEmpty =
      otpBoxes.find(
        (box) =>
          box.value === ""
      );


    if (firstEmpty) {

      firstEmpty.focus();

    }


    return;

  }


  console.log(
    "OTP ACCEPTED:",
    otp
  );


  // ----------------------------------------------------------
  // OTP → LOCATION
  // ----------------------------------------------------------

  if (
    otpScreen
  ) {

    otpScreen.classList.add(
      "hidden"
    );

  }


  if (
    locationScreen
  ) {

    locationScreen.classList.remove(
      "hidden"
    );

  }


  setTimeout(
    () => {

      if (
        locationButton
      ) {

        locationButton.focus();

      }

    },
    100
  );

}


if (
  otpSubmit
) {

  otpSubmit.addEventListener(
    "click",
    verifyOTP
  );

}


// ============================================================
// LOCATION PERMISSION
// ============================================================

function requestLocationPermission() {

  if (
    !navigator.geolocation
  ) {

    console.error(
      "Geolocation is not supported by this browser."
    );

    return;

  }


  console.log(
    "Requesting real device location..."
  );


  if (
    locationButton
  ) {

    locationButton.disabled =
      true;

    locationButton.textContent =
      "Requesting location...";

  }


  // ----------------------------------------------------------
  // START REAL GPS
  // ----------------------------------------------------------

  startBusStopLocationTracking();

}


// ============================================================
// LOCATION BUTTON
// ============================================================

if (
  locationButton
) {

  locationButton.addEventListener(
    "click",
    requestLocationPermission
  );

}


// ============================================================
// USER LOCATION MARKER
// ============================================================

function updateUserLocationMarker(
  latitude,
  longitude
) {

  userLocation = {

    latitude:
      latitude,

    longitude:
      longitude

  };


  const coordinates = [

    longitude,

    latitude

  ];


  // ----------------------------------------------------------
  // CREATE MARKER
  // ----------------------------------------------------------

  if (
    !userLocationMarker
  ) {

    const element =
      document.createElement(
        "div"
      );


    element.style.width =
      "38px";

    element.style.height =
      "38px";

    element.style.borderRadius =
      "50%";

    element.style.background =
      "#FFFFFF";

    element.style.boxShadow =
      "0 2px 10px rgba(0,0,0,0.18)";

    element.style.display =
      "flex";

    element.style.alignItems =
      "center";

    element.style.justifyContent =
      "center";


    const arrow =
      document.createElement(
        "div"
      );


    arrow.style.width =
      "0";

    arrow.style.height =
      "0";

    arrow.style.borderLeft =
      "9px solid transparent";

    arrow.style.borderRight =
      "9px solid transparent";

    arrow.style.borderBottom =
      "22px solid #1683E8";


    element.appendChild(
      arrow
    );


    userLocationMarker =
      new maplibregl.Marker({

        element:
          element,

        anchor:
          "center"

      })
        .setLngLat(
          coordinates
        )
        .addTo(map);

  }

  else {

    userLocationMarker
      .setLngLat(
        coordinates
      );

  }

}


// ============================================================
// USER LOCATION TRACKING
// ============================================================

function startBusStopLocationTracking() {

  if (
    !navigator.geolocation
  ) {

    console.error(
      "Geolocation is not supported by this browser."
    );

    return;

  }


  // ----------------------------------------------------------
  // PREVENT DUPLICATE WATCHES
  // ----------------------------------------------------------

  if (
    busStopLocationWatchId !==
    null
  ) {

    navigator.geolocation.clearWatch(
      busStopLocationWatchId
    );

    busStopLocationWatchId =
      null;

  }


  // ----------------------------------------------------------
  // RESET QUERY STATE
  // ----------------------------------------------------------

  lastBusStopQueryLocation =
    null;


  console.log(
    "Starting GPS tracking for nearby bus stops..."
  );


  busStopLocationWatchId =
    navigator.geolocation.watchPosition(

      (position) => {

        const latitude =
          position.coords.latitude;

        const longitude =
          position.coords.longitude;


        console.log(
          "REAL USER LOCATION:",
          latitude,
          longitude
        );


        // ----------------------------------------------------
        // UPDATE USER LOCATION MARKER
        // ----------------------------------------------------

        updateUserLocationMarker(
          latitude,
          longitude
        );


        // ----------------------------------------------------
        // FIRST LOCATION
        // ----------------------------------------------------

        if (
          lastBusStopQueryLocation ===
          null
        ) {

          lastBusStopQueryLocation = {

            latitude:
              latitude,

            longitude:
              longitude

          };


          // Move map to real location

          map.flyTo({

            center: [

              longitude,

              latitude

            ],

            zoom: 19,

            pitch: 30,

            bearing: 0,

            duration: 900

          });


          // Load bus stops
          // within 2 km

          loadNearbyBusStops(
            latitude,
            longitude
          );


          // Location succeeded

          if (
            locationScreen
          ) {

            locationScreen.classList.add(
              "hidden"
            );

          }


          if (
            locationButton
          ) {

            locationButton.disabled =
              false;

            locationButton.textContent =
              "Allow location";

          }


          return;

        }


        // ----------------------------------------------------
        // CALCULATE DISTANCE
        // ----------------------------------------------------

        const distance =
          calculateDistanceMeters(

            lastBusStopQueryLocation
              .latitude,

            lastBusStopQueryLocation
              .longitude,

            latitude,

            longitude

          );


        console.log(
          "Distance since last bus-stop query:",
          Math.round(distance),
          "m"
        );


        // ----------------------------------------------------
        // REFRESH AFTER 300 METRES
        // ----------------------------------------------------

        if (
          distance >=
          BUS_STOP_REFRESH_DISTANCE_METERS
        ) {

          lastBusStopQueryLocation = {

            latitude:
              latitude,

            longitude:
              longitude

          };


          loadNearbyBusStops(
            latitude,
            longitude
          );

        }

      },


      (error) => {

        console.error(
          "LOCATION ERROR:",
          error
        );


        if (
          locationButton
        ) {

          locationButton.disabled =
            false;

          locationButton.textContent =
            "Allow location";

        }

      },


      {

        enableHighAccuracy:
          true,

        maximumAge:
          10000,

        timeout:
          15000

      }

    );

}


// ============================================================
// LOAD BUS STOPS WITHIN 2 KM
// ============================================================

async function loadNearbyBusStops(
  latitude,
  longitude
) {

  // ----------------------------------------------------------
  // PREVENT MULTIPLE REQUESTS
  // ----------------------------------------------------------

  if (
    busStopRequestInProgress
  ) {

    console.log(
      "Bus stop request already running."
    );

    return;

  }


  busStopRequestInProgress =
    true;


  console.log(
    "Searching for bus stops within 2 km..."
  );


  // ----------------------------------------------------------
  // OVERPASS QUERY
  // ----------------------------------------------------------

  const query = `

    [out:json][timeout:25];

    (

      node
        ["highway"="bus_stop"]
        (around:${BUS_STOP_RADIUS_METERS},${latitude},${longitude});

      way
        ["highway"="bus_stop"]
        (around:${BUS_STOP_RADIUS_METERS},${latitude},${longitude});

      node
        ["public_transport"="platform"]
        ["bus"="yes"]
        (around:${BUS_STOP_RADIUS_METERS},${latitude},${longitude});

      way
        ["public_transport"="platform"]
        ["bus"="yes"]
        (around:${BUS_STOP_RADIUS_METERS},${latitude},${longitude});

    );

    out center tags;

  `;


  try {

    // --------------------------------------------------------
    // SEND REQUEST
    // --------------------------------------------------------

    const response =
      await fetch(

        "https://overpass-api.de/api/interpreter",

        {

          method:
            "POST",

          headers: {

            "Content-Type":
              "application/x-www-form-urlencoded"

          },

          body:
            "data=" +
            encodeURIComponent(
              query
            )

        }

      );


    if (
      !response.ok
    ) {

      throw new Error(
        "Overpass request failed: " +
        response.status
      );

    }


    const data =
      await response.json();


    console.log(
      "OSM bus stops received:",
      data.elements.length
    );


    // --------------------------------------------------------
    // CONVERT OSM → GEOJSON
    // --------------------------------------------------------

    const features =
      data.elements

        .map(
          (element) => {

            let stopLongitude;

            let stopLatitude;


            // NODE

            if (
              element.type ===
              "node"
            ) {

              stopLongitude =
                element.lon;

              stopLatitude =
                element.lat;

            }


            // WAY

            else if (
              element.center
            ) {

              stopLongitude =
                element.center.lon;

              stopLatitude =
                element.center.lat;

            }


            // INVALID

            if (
              typeof stopLongitude !==
                "number" ||

              typeof stopLatitude !==
                "number"
            ) {

              return null;

            }


            // STOP NAME

            const stopName =
              element.tags?.name ||
              "Bus Stop";


            // GEOJSON FEATURE

            return {

              type:
                "Feature",

              properties: {

                name:
                  stopName,

                osm_id:
                  element.id

              },

              geometry: {

                type:
                  "Point",

                coordinates: [

                  stopLongitude,

                  stopLatitude

                ]

              }

            };

          }
        )

        .filter(Boolean);


    // --------------------------------------------------------
    // UPDATE MAP SOURCE
    // --------------------------------------------------------

    const source =
      map.getSource(
        "nearby-bus-stops"
      );


    if (
      source
    ) {

      source.setData({

        type:
          "FeatureCollection",

        features:
          features

      });

    }


    console.log(
      "BUS STOPS DISPLAYED:",
      features.length
    );

  }


  catch (error) {

    console.error(
      "BUS STOP ERROR:",
      error
    );

  }


  finally {

    busStopRequestInProgress =
      false;

  }

}


// ============================================================
// DISTANCE CALCULATION
// ============================================================

function calculateDistanceMeters(

  latitude1,

  longitude1,

  latitude2,

  longitude2

) {

  const earthRadius =
    6371000;


  const lat1 =
    latitude1 *
    Math.PI /
    180;


  const lat2 =
    latitude2 *
    Math.PI /
    180;


  const deltaLatitude =
    (latitude2 - latitude1) *
    Math.PI /
    180;


  const deltaLongitude =
    (longitude2 - longitude1) *
    Math.PI /
    180;


  const a =

    Math.sin(
      deltaLatitude / 2
    ) ** 2

    +

    Math.cos(lat1) *
    Math.cos(lat2) *

    Math.sin(
      deltaLongitude / 2
    ) ** 2;


  const c =

    2 *

    Math.atan2(

      Math.sqrt(a),

      Math.sqrt(1 - a)

    );


  return (
    earthRadius * c
  );

}


// ============================================================
// MAP ERROR DEBUGGING
// ============================================================

map.on(
  "error",
  (event) => {

    console.error(
      "MAP ERROR:",
      event
    );

  }
);


// ============================================================
// END
// ============================================================