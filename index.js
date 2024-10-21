require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/request",
    "esri/identity/IdentityManager",
    "esri/layers/FeatureLayer",
    "esri/layers/SceneLayer",
    "esri/layers/TileLayer",
    "esri/geometry/Extent" // Import Extent module for spatial query
], function(Map, SceneView, esriRequest, IdentityManager, FeatureLayer, SceneLayer, TileLayer, Extent) {

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
            elevationInfo: {
                mode: "on-the-ground"
            },
            opacity: 0.5
        });

        map.add(buildingsLayer);
        map.add(treesLayer);
        map.add(rasterTileLayer);

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
        }

        // Initially query the visible building count when the view is loaded
        view.when(updateVisibleCounts);

        // Re-query the visible building count whenever the view is moved or zoomed
        view.watch("extent", updateVisibleCounts);

    }).catch(function(error) {
        console.error("Error generating token: ", error);
    });
});
