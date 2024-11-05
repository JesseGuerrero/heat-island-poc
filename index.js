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
            type: "simple", // autocasts as new SimpleRenderer()
            symbol: {
                type: "web-style", // autocasts as new WebStyleSymbol()
                styleName: "EsriLowPolyVegetationStyle",
                name: "Populus",
            },
            label: "generic tree",
            visualVariables: [
                {
                    type: "size",
                    axis: "height",
                    field: "Tree_Height",
                    valueUnit: "meters",
                },
            ],
        };

        // layer for sketch points
        const graphicsLayer = new GraphicsLayer({
            elevationInfo: {
                mode: "on-the-ground",
            },
        });

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


        // initial building feature to initialaise heat island points client layer
        let heatIslandfeatures = [
            {
                geometry: {
                    type: "point",
                    x: 172.639847,
                    y: -43.52565,
                    z: 30,
                },
                attributes: {
                    ObjectID: 1,
                    grid_code: 1,
                    pointid: 1,
                    MERGE_SRC: "1",
                    mergeSrc: 1,
                    heatValue: 1,
                    heatValueSimplified: 1,
                },
            },
        ];

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

        let treeClientLayer = new FeatureLayer({
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

        const rasterFebTileLayer = new TileLayer({
            portalItem: {
                id: "df92570bf5ca49ee84c6629aff979a3a",
                token: token
            },
            opacity: 0.5
        });

        const febVectorLST = new FeatureLayer({
            portalItem: {
                id: "aa3c051544a9470b9fef5dfd66f872bb",
                token: token
            },
            popupTemplate: popupTemplate,
            renderer: renderer,
            opacity: 0.5
        });

        const octVectorLST = new FeatureLayer({
            portalItem: {
                id: "cb3e63d1a69e44239d149a5078b8e264",
                token: token
            },
            popupTemplate: popupTemplate,
            renderer: renderer,
            opacity: 0.5
        });

        const rasterOctTileLayer = new TileLayer({
            portalItem: {
                id: "a1f2a60c2fc44eadb8fcdb693d6c59d7",
                token: token
            },
            opacity: 0.5
        });

        var treeLayer = new FeatureLayer({
            portalItem: {
                id: "72c9f18c98f047a2815972b9b1628a84",
            },
            // url: "https://services.arcgis.com/hLRlshaEMEYQG5A8/arcgis/rest/services/HamiltonTreesWithRemovedFeatures/FeatureServer",
            renderer: treeRenderer,
            elevationInfo: {
                mode: "on-the-ground",
            },
        });

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
                if (!map.layers.includes(octVectorLST)) {
                    map.add(octVectorLST);
                }
            } else if (selectedValue == 2) {  // Feb 2024 selected
                if (map.layers.includes(rasterOctTileLayer)) {
                    map.remove(rasterOctTileLayer);
                }
                if (map.layers.includes(octVectorLST)) {
                    map.remove(octVectorLST);
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
            if (!view.map.layers.includes(octVectorLST) && !view.map.layers.includes(febVectorLST)) {
                // Exit if neither of the layers is in the map
                return;
            }

            const visibleExtent = view.extent; // Get the current visible extent

            // Query the temperature for octVectorLST if it is present in the map
            if (view.map.layers.includes(octVectorLST)) {
                const query = octVectorLST.createQuery();
                query.geometry = visibleExtent; // Limit query to the visible extent
                query.outFields = ["gridcode"]; // Only retrieve the 'gridcode' field (temperature)
                query.returnGeometry = false;   // We don't need the geometry

                octVectorLST.queryFeatures(query).then(function(result) {
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


        function updateVisibleCounts() {
            const visibleExtent = view.extent;  // Get the current visible extent

            // Query visible building count
            const buildingQuery = buildingsLayer.createQuery();
            buildingQuery.geometry = visibleExtent;
            buildingQuery.spatialRelationship = "intersects";

            buildingsLayer.queryFeatureCount(buildingQuery).then(function(visibleBuildingCount) {
                // Update the building count in the HTML
                document.querySelector("#buildingCount").innerHTML = visibleBuildingCount;
            }).catch(function(error) {
                console.error("Error querying visible building count: ", error);
            });

            // Query visible tree count
            const treeQuery = treesLayer.createQuery();
            treeQuery.geometry = visibleExtent;
            treeQuery.spatialRelationship = "intersects";

            treesLayer.queryFeatureCount(treeQuery).then(function(visibleTreeCount) {
                // Update the tree count in the HTML
                document.querySelector("#treeCount").innerHTML = visibleTreeCount;
            }).catch(function(error) {
                console.error("Error querying visible tree count: ", error);
            });
            calculateAverageTemperature();
        }

        let treeBtn = document.querySelector("#addTrees");
        treeBtn.addEventListener("click", (event) => {
            // tree query
            let treeQuery = treeLayer.createQuery();
            treeQuery.geometry =
                graphicsLayer.graphics.items[
                graphicsLayer.graphics.items.length - 1
                    ].geometry;
            treeQuery.distance = 50;
            treeQuery.units = "meters";
            treeQuery.spatialRelationship = "intersects"; // this is the default
            treeQuery.returnGeometry = true;
            treeLayer.queryFeatures(treeQuery).then(function (response) {
                const edits = {
                    addFeatures: response.features,
                };
                treeClientLayer.applyEdits(edits).then(() => {
                });
            });
        });

        map.add(buildingsLayer);
        map.add(treesLayer);
        map.add(octVectorLST);
        map.add(rasterOctTileLayer);
        map.add(threeDBuildingMesh);

        view.when(() => {
            updateVisibleCounts()
            view.popupEnabled = false; //disable popups
            // create the Editor
            const editor = new Editor({
                view: view,
            });
            // add widget to top-right of the view
            view.ui.add(editor, "top-right");
            const sketch = new Sketch({
                view: view,
                layer: graphicsLayer,
                creationMode: "update",
                availableCreateTools: ["point"],
                creationMode: "single",
                defaultCreatOptions: ["freehand"],
            });
            view.ui.add(sketch, "bottom-right");

            sketch.on("create", (event) => {
                // if you wanted to query the trees and heat island data immediately upon placing the sketch point,
                // code could be added here
            });
            let selectedFeature = null;
            let selectedFeatureCopy = null;
            // watch for state change of editor
            editor.viewModel.watch("state", (state) => {
                if (state == "editing-existing-feature") {
                    selectedFeature = editor.viewModel.featureFormViewModel.feature;
                    // only if tree layer selected
                    if (selectedFeature.layer.title == "Add Trees") {
                        selectedFeatureCopy = esriLang.clone(
                            editor.viewModel.featureFormViewModel.feature
                        );
                        editor.activeWorkflow.on("commit", () => {

                        });
                    }
                } else if (state == "creating-features") {
                    // only if tree layer selected
                    if (editor.viewModel.selectedTemplateItem.layer.title == "Add Trees") {
                        selectedFeature = null;
                        selectedFeatureCopy = null;
                        editor.viewModel.featureFormViewModel.watch("feature", (feature) => {
                            feature.attributes.Tree_Height = 15.0;
                            selectedFeature = feature;
                            selectedFeatureCopy = esriLang.clone(feature);
                        });
                        editor.activeWorkflow.on("commit", (f) => {
                            console.warn(999, 'tree', selectedFeature)
                        });
                    }
                }
            });
        });

        // Re-query the visible building count whenever the view is moved or zoomed
        view.watch("extent", updateVisibleCounts);

    }).catch(function(error) {
        console.error("Error generating token: ", error);
    });
});
