require([
    "esri/Map",
    "esri/views/SceneView",
    "esri/request",
    "esri/identity/IdentityManager",
    "esri/layers/FeatureLayer",
    "esri/layers/SceneLayer",
    "esri/layers/TileLayer"  // Import TileLayer module
], function(Map, SceneView, esriRequest, IdentityManager, FeatureLayer, SceneLayer, TileLayer) {

    // Step 1: Define your ArcGIS Online credentials (for development purposes)
    const username = "jesus.guerrero6_utsa";  // Your ArcGIS Online username
    const password = "D0lot$ofwork";  // Your ArcGIS Online password

    // Step 2: Generate token programmatically (development purposes)
    const tokenUrl = "https://utsa.maps.arcgis.com/sharing/rest/generateToken";  // Your ArcGIS Online organization
    const tokenParams = {
        username: username,
        password: password,
        referer: window.location.origin,
        expiration: 60,  // Token expiration in minutes (adjust as needed)
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
            server: "https://utsa.maps.arcgis.com",  // Your ArcGIS Online server
            token: token,
            userId: username
        });

        // Step 5: Create the map with a topographic basemap
        const map = new Map({
            basemap: "osm",
            ground: "world-elevation"  // Adds elevation for ground surface
        });

        const view = new SceneView({
            container: "viewDiv",
            map: map,
            center: [-98.4936, 29.426],  // Downtown San Antonio coordinates
            zoom: 18,
            camera: {
                position: {
                    x: -98.4957,  // Longitude
                    y: 29.4181,    // Latitude
                    z: 500        // Height in meters from the ground
                },
                tilt: 65  // Tilt to show a 3D perspective of buildings
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
                id: "9d4e37788fca48db9b1cba8f0e3e671b",
                token: token
            },
            elevationInfo: {
                mode: "on-the-ground"
            }
        });

        const rasterTileLayer = new TileLayer({
            portalItem: {
                id: "a1f2a60c2fc44eadb8fcdb693d6c59d7",  // Your raster tile layer ID
                token: token
            },
            elevationInfo: {
                mode: "on-the-ground"
            },
            opacity: 0.5
        });
        //
        // let renderer = {
        //     type: "heatmap",
        //     field: "heatValue",
        //     minDensity: 0,
        //     maxDensity: 0.04625,
        //     radius: 18,
        //     colorStops: [
        //         { ratio: 0, color: "rgba(255, 185, 80, 0)" },
        //         { ratio: 0.11, color: "rgba(255, 173, 51, 1)" },
        //         { ratio: 0.22, color: "rgba(255, 147, 31, 1)" },
        //         { ratio: 0.33, color: "rgba(255, 126, 51, 1)" },
        //         { ratio: 0.44, color: "rgba(250, 94, 31, 1)" },
        //         { ratio: 0.55, color: "rgba(236, 63, 19, 1)" },
        //         { ratio: 0.66, color: "rgba(184, 23, 2, 1)" },
        //         { ratio: 0.77, color: "rgba(165, 1, 4, 1)" },
        //         { ratio: 0.88, color: "rgba(142, 1, 3, 1)" },
        //         { ratio: 1, color: "rgba(122, 1, 3, 1)" },
        //     ],
        //     radius: 11,
        //     referenceScale: 5000,
        //     maxDensity: 100000,
        //     minDensity: 0,
        // };
        // const heatBuildingLayer = new FeatureLayer({
        //     portalItem: {
        //         id: "6d18d70774e74eb99b6097749d2f3d43",
        //         token: token
        //     },
        //     renderer: renderer,
        //     elevationInfo: {
        //         mode: "on-the-ground"
        //     }
        // });

        map.add(buildingsLayer);
        map.add(treesLayer);
        // map.add(heatBuildingLayer)
        map.add(rasterTileLayer);  // Add the raster tile layer to the map

    }).catch(function(error) {
        console.error("Error generating token: ", error);
    });
});
