require([
  "esri/Map",
  "esri/views/SceneView",
  "esri/request",
  "esri/identity/IdentityManager",
  "esri/layers/FeatureLayer",
  "esri/layers/SceneLayer",
  "esri/layers/TileLayer",
  "esri/symbols/PolygonSymbol3D",
  "esri/symbols/FillSymbol3DLayer",
  "esri/layers/VectorTileLayer",
  "esri/geometry/Extent",
  "esri/widgets/Editor",
  "esri/widgets/Sketch",
  "esri/layers/GraphicsLayer",
  "esri/core/lang",
  "constants.js"
], function(Map, SceneView, esriRequest, IdentityManager, FeatureLayer, SceneLayer, TileLayer, PolygonSymbol3D, FillSymbol3DLayer, VectorTileLayer, Extent, Editor, Sketch, GraphicsLayer, esriLang, constants) {

  // Step 1: Define your ArcGIS Online credentials (for development purposes)
  const username = "jesus.guerrero6_utsa";
  const password = "D0lot$ofwork";

  // Step 2: Generate token programmatically (development purposes)
  const tokenUrl = "https://utsa.maps.arcgis.com/sharing/rest/generateToken";
  const tokenParams = {
    username: username,
    password: password,
    referer: window.location.origin,
    expiration: 60,
    f: "json"
  };

  // Step 3: Request token using esriRequest
  esriRequest(tokenUrl, {
    method: "post",
    query: tokenParams
  }).then(function(response) {
    const token = response.data.token;

    // Step 4: Register the generated token with IdentityManager
    IdentityManager.registerToken({
      server: "https://utsa.maps.arcgis.com",
      token: token,
      userId: username
    });

    // Step 5: Create the map with a topographic basemap
    const map = new Map({
      basemap: "osm",
      ground: "world-elevation"
    });

    const view = new SceneView({
      container: "viewDiv",
      map: map,
      center: [-98.4936, 29.426],
      zoom: 18,
      camera: {
        position: {
          x: -98.4957,
          y: 29.4135,
          z: 800
        },
        tilt: 65
      }
    });

    const popupTemplate = {
      title: "Grid Information",
      content: [{
        type: "fields",
        fieldInfos: [{
          fieldName: "gridcode", // The original field name
          label: "Temperature(F)",  // Renaming it in the popup
          visible: true // Ensure only this field is visible
        }]
      }]
    };

    const treeRenderer = {
      type: "simple",
      symbol: {
        type: "web-style",
        styleName: "EsriLowPolyVegetationStyle",
        name: "Populus"
      },
      label: "generic tree",
      visualVariables: [
        {
          type: "size",
          axis: "height",
          field: "Tree_Height",
          valueUnit: "meters"
        }
      ]
    };

    const buildingsLayer = new SceneLayer({
      portalItem: {
        id: "5f3bfa18600a41979e989f357f4bcc76",
        token: token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });

    const buildingsWestLayer = new SceneLayer({
      portalItem: {
        id: "93bb781426864219981e94aab54f6afc",
        token: token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });

    const threeDBuildingMesh = new SceneLayer({
      portalItem: {
        id: "a553a5d36795411a905844082ddcb70f",
        token: token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });

    const treesLayer = new SceneLayer({
      portalItem: {
        id: "93a464a8aa4d4d56b86ce6268bf0a788",
        token: token
      },
      elevationInfo: {
        mode: "on-the-ground"
      }
    });

    const treesWestLayer = new SceneLayer({
      portalItem: {
        id: "72213be6102f4d4da2a83328e0ab86b3",
        token: token
      },
      elevationInfo: {
        mode: "on-the-ground"
      }
    });

    const rasterFebTileLayer = new TileLayer({
      portalItem: {
        id: "d3f31dc16c284a57bb83aacf16436b30",
        token: token
      },
      opacity: 0.5
    });

    const febVectorLST = new FeatureLayer({
      portalItem: {
        id: "d9fd2cea9ef34c7193249f27fa28384c",
        token: token
      },
      popupTemplate: popupTemplate,
      opacity: 0.5
    });

    const sepVectorLST = new FeatureLayer({
      portalItem: {
        id: "9a443e86eac245139604c937c3cd4143",
        token: token
      },
      popupTemplate: popupTemplate,
      opacity: 0.5
    });

    const rasterOctTileLayer = new TileLayer({
      portalItem: {
        id: "4476c655db854d7c96247e97f17acf83",
        token: token
      },
      opacity: 0.5
    });

    // Define the 3D renderer for the trees in FeatureLayer
    // const featureTreeRenderer = {
    //     type: "unique-value", // Use unique-value renderer to differentiate by species
    //     field: "Name", // Field that contains the species names
    //     uniqueValueInfos: [
    //         {
    //             value: "Common Whitebeam",
    //             symbol: {
    //                 type: "web-style",
    //                 styleName: "EsriLowPolyVegetationStyle",
    //                 name: "Populus" // Generic placeholder symbol for Common Whitebeam
    //             }
    //         },
    //         {
    //             value: "European Beech",
    //             symbol: {
    //                 type: "web-style",
    //                 styleName: "EsriLowPolyVegetationStyle",
    //                 name: "Populus" // Generic placeholder symbol for European Beech
    //             }
    //         },
    //         {
    //             value: "Northern Red Oak",
    //             symbol: {
    //                 type: "web-style",
    //                 styleName: "EsriLowPolyVegetationStyle",
    //                 name: "Oak Tree" // Generic placeholder symbol for Northern Red Oak
    //             }
    //         },
    //         {
    //             value: "Norway Maple",
    //             symbol: {
    //                 type: "web-style",
    //                 styleName: "EsriLowPolyVegetationStyle",
    //                 name: "Maple Tree" // Generic placeholder symbol for Norway Maple
    //             }
    //         },
    //         {
    //             value: "Umbrella Acacia",
    //             symbol: {
    //                 type: "web-style",
    //                 styleName: "EsriLowPolyVegetationStyle",
    //                 name: "Acacia Tree" // Generic placeholder symbol for Umbrella Acacia
    //             }
    //         }
    //     ],
    //     defaultSymbol: {
    //         type: "web-style",
    //         styleName: "EsriLowPolyVegetationStyle",
    //         name: "Tree" // Fallback symbol for other species
    //     },
    //     visualVariables: [
    //         {
    //             type: "size", // Size visual variable to scale height
    //             field: "Tree_Height", // Field containing height data
    //             axis: "height",
    //             valueUnit: "meters" // Units for height
    //         }
    //     ]
    // };

    // Apply the renderer to treesLayer
    // treesLayer.renderer = featureTreeRenderer;


    // Create the 3D symbol for the polygons
    const polygonSymbol3D = new PolygonSymbol3D({
      symbolLayers: [
        new FillSymbol3DLayer({
          material: { color: [255, 255, 0, 0.0] }, // Set fill color
          outline: {
            color: [255, 0, 0, 0.0], // Set outline color
            size: "1px"
          }
        })
      ]
    });

    // initial building feature to initialaise tree client layer
    let treeFeatures = [
      {
        geometry: {
          type: "point",
          x: 172.639847,
          y: -43.52565,
          z: 30,
        },
        attributes: {
          OBJECTID: 0,
          Tree_Height: 0,
        },
      },
    ];

    let treeClientLayer = new GraphicsLayer({
      title: "Add Trees",
      source: treeFeatures,
      fields: [
        {
          name: "OBJECTID",
          type: "oid",
        },
        {
          name: "Tree_Height",
          type: "double",
        },
      ],
      objectIdField: "OBJECTID",
      elevationInfo: {
        mode: "on-the-ground",
        offset: 0,
      },
      renderer: treeRenderer,
    });
    view.map.add(treeClientLayer);

    // Define the renderer for the FeatureLayer
    const renderer = {
      type: "simple", // Use simple renderer
      symbol: polygonSymbol3D // Apply the 3D symbol to all features in the layer
    };

    window.handleLSTChange = function handleLSTChange() {
      const lstSelect = document.getElementById("selectLST");
      const selectedValue = lstSelect.value;

      if (selectedValue == 1) {  // Oct 2024 selected
        // Remove rasterFebTileLayer and add rasterOctTileLayer and featureLayer
        if (map.layers.includes(rasterFebTileLayer)) {
          map.remove(rasterFebTileLayer);
        }
        if (map.layers.includes(febVectorLST)) {
          map.remove(febVectorLST);
        }
        if (!map.layers.includes(rasterOctTileLayer)) {
          map.add(rasterOctTileLayer);
        }
        if (!map.layers.includes(sepVectorLST)) {
          map.add(sepVectorLST);
        }
      } else if (selectedValue == 2) {  // Feb 2024 selected
        if (map.layers.includes(rasterOctTileLayer)) {
          map.remove(rasterOctTileLayer);
        }
        if (map.layers.includes(sepVectorLST)) {
          map.remove(sepVectorLST);
        }
        if (!map.layers.includes(rasterFebTileLayer)) {
          map.add(rasterFebTileLayer);
        }
        if (!map.layers.includes(febVectorLST)) {
          map.add(febVectorLST);
        }
      }
      calculateAverageTemperature()
    }

    function calculateAverageTemperature() {
      // Check if the layers are in the map
      if (!view.map.layers.includes(sepVectorLST) && !view.map.layers.includes(febVectorLST)) {
        // Exit if neither of the layers is in the map
        return;
      }

      const visibleExtent = view.extent; // Get the current visible extent

      // Query the temperature for octVectorLST if it is present in the map
      if (view.map.layers.includes(sepVectorLST)) {
        const query = sepVectorLST.createQuery();
        query.geometry = visibleExtent; // Limit query to the visible extent
        query.outFields = ["gridcode"]; // Only retrieve the 'gridcode' field (temperature)
        query.returnGeometry = false;   // We don't need the geometry

        sepVectorLST.queryFeatures(query).then(function(result) {
          let totalTemperature = 0;
          let featureCount = result.features.length;

          // Sum up the temperatures
          result.features.forEach(function(feature) {
            totalTemperature += feature.attributes.gridcode;
          });

          // Calculate the average temperature
          let averageTemperature = featureCount > 0 ? (totalTemperature / featureCount).toFixed(2) : "N/A";

          // Update the HTML element with the calculated average temperature
          document.querySelector("#avgTemperature").innerHTML = averageTemperature + " °F";
        }).catch(function(error) {
          console.error("Error querying features: ", error);
        });
      }

      // Query the temperature for febVectorLST if it is present in the map
      if (view.map.layers.includes(febVectorLST)) {
        const query = febVectorLST.createQuery();
        query.geometry = visibleExtent; // Limit query to the visible extent
        query.outFields = ["gridcode"]; // Only retrieve the 'gridcode' field (temperature)
        query.returnGeometry = false;   // We don't need the geometry

        febVectorLST.queryFeatures(query).then(function(result) {
          let totalTemperature = 0;
          let featureCount = result.features.length;

          // Sum up the temperatures
          result.features.forEach(function(feature) {
            totalTemperature += feature.attributes.gridcode;
          });

          // Calculate the average temperature
          let averageTemperature = featureCount > 0 ? (totalTemperature / featureCount).toFixed(2) : "N/A";

          // Update the HTML element with the calculated average temperature
          document.querySelector("#avgTemperature").innerHTML = averageTemperature + " °F";
        }).catch(function(error) {
          console.error("Error querying features: ", error);
        });
      }
    }


    // Debounce function to limit frequency of updates
    function debounce(func, delay) {
      let timer;
      return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
      };
    }

    // Function to update visible counts
    function updateVisibleCounts() {
      calculateAverageTemperature()
      const visibleExtent = view.extent;  // Get the current visible extent
      let treeCount = 0;
      let buildingCount = 0;

      // Create promises for querying visible counts
      const buildingWestPromise = buildingsWestLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      const treeWestPromise = treesWestLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      const buildingPromise = buildingsLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      const treePromise = treesLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      // Use Promise.all to wait for all queries to complete
      Promise.all([buildingWestPromise, treeWestPromise, buildingPromise, treePromise])
          .then(([visibleBuildingWestCount, visibleTreeWestCount, visibleBuildingCount, visibleTreeCount]) => {
            // Update the counts
            buildingCount = visibleBuildingWestCount + visibleBuildingCount;
            treeCount = visibleTreeWestCount + visibleTreeCount;

            // Update the HTML elements if the counts are non-zero
            if (buildingCount !== 0) {
              document.querySelector("#buildingCount").innerHTML = buildingCount;
            }
            if (treeCount !== 0) {
              document.querySelector("#treeCount").innerHTML = treeCount;
            }
          })
          .catch(error => {
            console.error("Error querying visible counts: ", error);
          });
    }

    // Debounce the `updateVisibleCounts` function
    const debouncedUpdateVisibleCounts = debounce(updateVisibleCounts, 300);

    // Ensure all layers are loaded before updating counts
    Promise.all([
      buildingsWestLayer.when(),
      treesWestLayer.when(),
      buildingsLayer.when(),
      treesLayer.when()
    ]).then(() => {
      // Layers are loaded, proceed to update counts
      updateVisibleCounts();
      view.watch("extent", debouncedUpdateVisibleCounts);  // Watch for extent changes
    }).catch(error => {
      console.error("Error loading layers: ", error);
    });

    map.add(buildingsLayer);
    map.add(buildingsWestLayer);
    map.add(treesLayer);
    map.add(treesWestLayer);
    map.add(sepVectorLST);
    map.add(rasterOctTileLayer);
    map.add(threeDBuildingMesh);

// Initialize the Sketch widget for feature creation
    const sketch = new Sketch({
      view: view,
      layer: treeClientLayer,
      visibleElements: {
        selectionTools: false,
        settingsMenu: false,
        undoRedoMenu: true
      }
    });

// Hide the Sketch widget from the UI until "Add Trees" button is clicked
    view.ui.add(sketch, "top-right");
    sketch.container.style.display = "none"; // Initially hide the Sketch widget

// Function to start creating a new tree feature when "Add Trees" button is clicked
    function startCreatingFeature() {
      view.popupEnabled = false; // Disable popups

      // Show the Sketch widget to enable adding features
      // sketch.container.style.display = "block"; // Show Sketch widget
      sketch.create("point"); // Set Sketch to add point features

      // Listen for feature creation
      sketch.on("create", (event) => {
        if (event.state === "complete") {
          const graphic = event.graphic;
          if (graphic) {
            // Set default Tree Height
            graphic.attributes = graphic.attributes || {};
            graphic.attributes.Tree_Height = 15.0;
            graphic.symbol = treeRenderer.symbol;

            // Add graphic to the treeClientLayer
            treeClientLayer.add(graphic);

            console.log("Added new tree feature with default Tree Height of 15.0 meters.");
          }
        }
      });
    }

    document.getElementById("addTrees").addEventListener("click", startCreatingFeature);

    function stopSketch() {
      sketch.cancel();  // Cancel any ongoing Sketch operation
    }

    // Event listener to remove Sketch functionality when "Cursor" button is clicked
    document.getElementById("cursor").addEventListener("click", stopSketch);

    view.when(() => {
      updateVisibleCounts()
      view.popupEnabled = false; //disable popups
    });

    // Re-query the visible building count whenever the view is moved or zoomed
    view.watch("extent", updateVisibleCounts);

  }).catch(function(error) {
    console.error("Error generating token: ", error);
  });
});
