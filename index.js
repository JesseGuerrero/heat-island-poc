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
    "esri/geometry/Extent" // Import Extent module for spatial query
], function(Map, SceneView, esriRequest, IdentityManager, FeatureLayer, SceneLayer, TileLayer, PolygonSymbol3D, FillSymbol3DLayer, VectorTileLayer, Extent) {

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

        const buildingsLayer = new SceneLayer({
            portalItem: {
                id: "638d033828d7498f84550cb677b53215",
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

        const rasterTileLayer = new TileLayer({
            portalItem: {
                id: "a1f2a60c2fc44eadb8fcdb693d6c59d7",
                token: token
            },
            opacity: 0.5
        });
        map.add(rasterTileLayer);

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

        // Define the renderer for the FeatureLayer
        const renderer = {
            type: "simple", // Use simple renderer
            symbol: polygonSymbol3D // Apply the 3D symbol to all features in the layer
        };

        const featureLayer = new FeatureLayer({
            portalItem: {
                id: "cb3e63d1a69e44239d149a5078b8e264",
                token: token
            },
            popupTemplate: popupTemplate,
            renderer: renderer,
            opacity: 0.5
        });
        map.add(featureLayer);

        map.add(buildingsLayer);
        map.add(treesLayer);

        function calculateAverageTemperature() {
            const visibleExtent = view.extent; // Get the current visible extent

            const query = featureLayer.createQuery();
            query.geometry = visibleExtent; // Limit query to the visible extent
            query.outFields = ["gridcode"]; // Only retrieve the 'gridcode' field (temperature)
            query.returnGeometry = false;   // We don't need the geometry

            featureLayer.queryFeatures(query).then(function(result) {
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

        // Initially query the visible building count when the view is loaded
        view.when(updateVisibleCounts);

        // Re-query the visible building count whenever the view is moved or zoomed
        view.watch("extent", updateVisibleCounts);

    }).catch(function(error) {
        console.error("Error generating token: ", error);
    });
});
