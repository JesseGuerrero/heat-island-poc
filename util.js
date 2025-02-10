// util.js
define(["esri/Map", "esri/views/SceneView", "esri/widgets/Sketch",   "esri/layers/GraphicsLayer",],
    function (Map, SceneView, Sketch, GraphicsLayer) {

    function showLoading() {
        const loadingOverlay = document.getElementById("loadingOverlay");
        loadingOverlay.style.display = "block"; // Show overlay
    }

    function hideLoading() {
        const loadingOverlay = document.getElementById("loadingOverlay");
        loadingOverlay.style.display = "none"; // Hide overlay
    }
    // Function to generate a color ramp based on normalized value
    function colorRampPrediction(min, max, value) {
        // Normalize value between 0 and 1
        const normalizedValue = (value - min) / (max - min);

        // Define RGB values for the color ramp
        const startColor = { r: 0, g: 128, b: 128 }; // Blue
        const midColor = { r: 255, g: 255, b: 0 }; // Yellow
        const endColor = { r: 255, g: 0, b: 0 }; // Red

        let r, g, b;

        if (normalizedValue < 0.5) {
            // Interpolate between startColor and midColor
            const t = normalizedValue * 2; // Scale to [0, 1]
            r = Math.round(startColor.r + t * (midColor.r - startColor.r));
            g = Math.round(startColor.g + t * (midColor.g - startColor.g));
            b = Math.round(startColor.b + t * (midColor.b - startColor.b));
        } else {
            // Interpolate between midColor and endColor
            const t = (normalizedValue - 0.5) * 2; // Scale to [0, 1]
            r = Math.round(midColor.r + t * (endColor.r - midColor.r));
            g = Math.round(midColor.g + t * (endColor.g - midColor.g));
            b = Math.round(midColor.b + t * (endColor.b - midColor.b));
        }

        // Convert RGB to a color string
        return `rgb(${r}, ${g}, ${b})`;
    }

    async function rampLSTToPrediction(lstLayer, valueString, fieldName = valueString) {
        try {
            // Query to get statistics for the grid_code field
            const result = await lstLayer.queryFeatures({
                where: "1=1",
                outStatistics: [
                    {
                        statisticType: "min",
                        onStatisticField: valueString,
                        outStatisticFieldName: "minValue"
                    },
                    {
                        statisticType: "max",
                        onStatisticField: valueString,
                        outStatisticFieldName: "maxValue"
                    }
                ]
            });

            const popupTemplate = {
                title: "Weather",
                content: [{
                    type: "fields",
                    fieldInfos: [{
                        fieldName: fieldName,  // The original field name
                        label: "Temperature (°F)",  // Renaming it in the popup
                        visible: true  // Ensure only this field is visible
                    }]
                }]
            };

            const stats = result.features[0].attributes;
            const minValue = stats.minValue;
            const maxValue = stats.maxValue;

            // Generate uniqueValueInfos for each value in the range
            const uniqueValueInfos = [];
            for (let value = minValue; value <= maxValue; value++) {
                uniqueValueInfos.push({
                    value: value,
                    symbol: {
                        type: "simple-fill",
                        color: colorRampPrediction(minValue, maxValue, value),
                        outline: {
                            width: 0,
                        }
                    }
                });
            }

            // Set the renderer
            const renderer = {
                type: "unique-value",
                field: valueString,
                uniqueValueInfos: uniqueValueInfos
            };
            lstLayer.renderer = renderer;
            lstLayer.popupTemplate = popupTemplate;
            lstLayer.opacity = 0.5;
        } catch (error) {
            console.error("Error querying features:", error);
        }
    }

    async function deleteTreeNullFeatureLayer(originalLayer, mutableLayer) {
        try {
            const featuresToDelete = await mutableLayer.queryFeatures({
                where: "AREA IS NULL", // Correct syntax for querying null values
                outFields: ["*"], // Retrieve only the OBJECTID field
                returnGeometry: false // No need to return geometry
            });

            const objectIds = featuresToDelete.features.map(feature => feature.attributes.OBJECTID_1);
            if (objectIds.length > 0) {
                const deleteFeaturesArray = objectIds.map(objectId => ({ objectId: objectId })); // Ensure correct structure
                const deleteResponse = await mutableLayer.applyEdits({
                    deleteFeatures: deleteFeaturesArray
                });
                if (deleteResponse.deleteFeatureResults.some(result => result.error)) {
                    console.error("Error deleting features:", deleteResponse.deleteFeatureResults);
                } else {
                    console.log("Features with AREA = null successfully deleted.");
                }
            } else {
                console.log("No features with AREA = null found for deletion.");
            }
        } catch (error) {
            console.error("Error deleting features from the layer:", error);
        }
    }

    async function resetByUpdateFeatureLayer(originalLayer, mutableLayer) {
        try {
            // Step 1: Query features from mutableLayer where mutated = '1'
            const mutableFeatures = await mutableLayer.queryFeatures({
                where: "mutated = '1'",
                outFields: ["*"],
                returnGeometry: true
            });

            // Step 2: Extract a list of unique IDs from the mutable features
            const objectIds = mutableFeatures.features.map(feature => feature.attributes.OBJECTID); // Use your unique identifier field here

            // Step 3: Create a where clause to select matching features in originalLayer
            const whereClause = `OBJECTID IN (${objectIds.join(",")})`; // Adjust OBJECTID to your unique identifier field

            // Step 4: Query features from originalLayer using the where clause
            const originalFeatures = await originalLayer.queryFeatures({
                where: whereClause,
                outFields: ["*"],
                returnGeometry: true
            });

            // Step 5: Prepare the features for updating
            const updateFeatures = originalFeatures.features.map((feature) => {
                feature.attributes.mutated = 0;
                return {
                    attributes: feature.attributes,
                    geometry: feature.geometry
                };
            });

            // Step 6: Apply the updates to reset mutableLayer
            const updateResponse = await mutableLayer.applyEdits({
                updateFeatures: updateFeatures
            });

            if (updateResponse.updateFeatureResults.some(result => result.error)) {
                console.error("Error updating features during reset:", updateResponse.updateFeatureResults);
            } else {
                console.log("Features successfully reset.");
            }
        } catch (error) {
            console.error("Error resetting layer values:", error);
        }
    }


    async function addTreeOnGraphic(graphic, treeLayer) {
        graphic.attributes = graphic.attributes || {};
        graphic.attributes.HEIGHT = 15.0; // Default tree height
        graphic.attributes.Width = 15.0;
        graphic.attributes.Name = "Northern Red Oak"
        graphic.attributes.Units = "Meters"

        if (graphic.geometry && graphic.geometry.hasZ) {
            graphic.geometry.z = undefined; // Remove the z-value
        }
        try {
            const edits = {
                addFeatures: [graphic]
            };
            const response = await treeLayer.applyEdits(edits);
            if (response.addFeatureResults[0].error) {
                console.error("Error adding feature:", response.addFeatureResults[0].error);
                return;
            }
            console.log("Added new tree feature with default Tree Height of 15.0 meters, now changeing LST.");
        } catch (error) {
            console.error("Error applying edits to the FeatureLayer:", error);
        }
    }

    async function reduceTemperatureAroundGraphic(graphic, lstLayer, distance, amount) {
        try {
            const query = lstLayer.createQuery();
            query.geometry = graphic.geometry; // The point geometry
            query.distance = distance; // Distance in meters
            query.units = "meters";
            query.spatialRelationship = "intersects"; // Can be "intersects", "contains", etc., depending on your needs
            query.returnGeometry = false; // We only need attributes
            query.outFields = ["OBJECTID", "gridcode", "mutated"]; // Specify the fields to retrieve
            const results = await lstLayer.queryFeatures(query);
            const featuresToUpdate = results.features.map((feature) => {
                // Step 2: Modify the gridcode attribute for each polygon
                feature.attributes.gridcode -= amount; // Example: setting gridcode to 100
                feature.attributes.mutated = 1;
                return {
                    attributes: feature.attributes
                };
            });

            // Step 3: Use applyEdits to update the polygons' gridcode
            if (featuresToUpdate.length > 0) {
                const updateResponse = await lstLayer.applyEdits({
                    updateFeatures: featuresToUpdate
                });
                if (updateResponse.updateFeatureResults.some(result => result.error)) {
                    console.error("Error updating features' gridcode:", updateResponse.updateFeatureResults);
                } else {
                    console.log("Updated gridcode for polygons within 60 meters.");
                }
            } else {
                console.log("No polygons found within 60 meters to update.");
            }
        } catch (error) {
            console.error("Error querying or updating features:", error);
        }
    }

    function stopSketch() {
        sketch.cancel();  // Cancel any ongoing Sketch operation
    }

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
                x: -98.4830,
                y: 29.4078,
                z: 800
            },
            tilt: 65
        }
    });

    const treeRenderer = {
        type: "unique-value", // Use Unique Value Renderer
        field: "Name", // The field to symbolize based on unique values
        defaultSymbol: {
            type: "web-style", // Default symbol if the TREE_TYPE doesn't match any listed
            styleName: "EsriLowPolyVegetationStyle",
            name: "Populus"
        },
        uniqueValueInfos: [
            {
                value: "Common Whitebeam", // Unique value 1
                symbol: {
                    type: "web-style",
                    styleName: "EsriLowPolyVegetationStyle",
                    name: "Sorbus"
                }
            },
            {
                value: "European Beech", // Unique value 2
                symbol: {
                    type: "web-style",
                    styleName: "EsriLowPolyVegetationStyle",
                    name: "Fagus"
                }
            },
            {
                value: "Northern Red Oak", // Unique value 3
                symbol: {
                    type: "web-style",
                    styleName: "EsriLowPolyVegetationStyle",
                    name: "Quercus Rubra"
                }
            },
            {
                value: "Norway Maple", // Unique value 4
                symbol: {
                    type: "web-style",
                    styleName: "EsriLowPolyVegetationStyle",
                    name: "Acer"
                }
            },
            {
                value: "Umbrella Acacia", // Unique value 5
                symbol: {
                    type: "web-style",
                    styleName: "EsriLowPolyVegetationStyle",
                    name: "Acacia"
                }
            }
        ],
        visualVariables: [
            {
                type: "size",
                axis: "height",
                field: "HEIGHT",
                valueUnit: "meters"
            },
            {
                type: "size",
                axis: "width", // New visual variable for width
                field: "Width", // The field that defines the width
                valueUnit: "meters"
            }
        ]
    };

    function getCurrentLSTLayer(imFeb, imSep, feb, sep) {
        if (map.layers.includes(feb)) {
            return [imFeb, feb]
        }
        if (map.layers.includes(sep)) {
            return [imSep, sep]
        }
        else return [imSep, sep]
    }

    function getNotCurrentLSTLayer(imFeb, imSep, feb, sep) {
        return getCurrentLSTLayer(imSep, imFeb, sep, feb);
    }

    function handleLSTChange(feb, sep, lcz) {
        const lstSelect = document.getElementById("selectLST");
        const selectedValue = lstSelect.value;

        if (selectedValue == 1) {  // Sep 2024 selected
            if (map.layers.includes(lcz)) {
                map.remove(lcz);
            }
            if (map.layers.includes(feb)) {
                map.remove(feb);
            }
            if (!map.layers.includes(sep)) {
                map.add(sep);
            }
        } else if (selectedValue == 2) {  // Feb 2024 selected
            if (map.layers.includes(lcz)) {
                map.remove(lcz);
            }
            if (map.layers.includes(sep)) {
                map.remove(sep);
            }
            if (!map.layers.includes(feb)) {
                map.add(feb);
            }
        } else if(selectedValue == 3) {
            if (map.layers.includes(sep)) {
                map.remove(sep);
            }
            if (map.layers.includes(feb)) {
                map.remove(feb);
            }
            if (!map.layers.includes(lcz)) {
                map.add(lcz);
            }
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

    function calculateAverageTemperature(lstLayer) {
        const visibleExtent = view.extent; // Get the current visible extent
        const query = lstLayer.createQuery();
        query.geometry = visibleExtent; // Limit query to the visible extent
        query.outFields = ["gridcode"]; // Only retrieve the 'gridcode' field (temperature)
        query.returnGeometry = false;   // We don't need the geometry

        lstLayer.queryFeatures(query).then(function(result) {
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

    const sketch = new Sketch({
        view: view,
        layer: new GraphicsLayer(),
        visibleElements: {
            selectionTools: false,
            settingsMenu: false,
            undoRedoMenu: true
        }
    });
    return {
        rampLSTToPrediction: rampLSTToPrediction,
        resetByUpdateFeatureLayer: resetByUpdateFeatureLayer,
        deleteTreeNullFeatureLayer: deleteTreeNullFeatureLayer,
        stopSketch: stopSketch,
        map: map,
        view: view,
        treeRenderer: treeRenderer,
        sketch, sketch,
        reduceTemperatureAroundGraphic: reduceTemperatureAroundGraphic,
        addTreeOnGraphic: addTreeOnGraphic,
        getCurrentLSTLayer: getCurrentLSTLayer,
        handleLSTChange: handleLSTChange,
        getNotCurrentLSTLayer: getNotCurrentLSTLayer,
        debounce: debounce,
        calculateAverageTemperature: calculateAverageTemperature,
        showLoading: showLoading,
        hideLoading: hideLoading
    };
});
