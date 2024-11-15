require([
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/layers/SceneLayer",
  "esri/request",
  "util.js",
  "auth.js"
], function(FeatureLayer, GraphicsLayer, SceneLayer, esriRequest, Util, Auth) {
  async function main() {
    const token = await Auth.initToken();
    const buildingsLayer = new SceneLayer({
      portalItem: {
        id: "5f3bfa18600a41979e989f357f4bcc76",
        token: Util.token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });
    const buildingsWestLayer = new SceneLayer({
      portalItem: {
        id: "93bb781426864219981e94aab54f6afc",
        token: Util.token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });
    const threeDBuildingMesh = new SceneLayer({
      portalItem: {
        id: "a553a5d36795411a905844082ddcb70f",
        token: Util.token
      },
      elevationInfo: {
        mode: "absolute-height",
        offset: 0
      }
    });
    Util.map.add(buildingsLayer);
    Util.map.add(buildingsWestLayer);
    Util.map.add(threeDBuildingMesh);

    const immutableSepLSTVectorLayer = new FeatureLayer({
      portalItem: {
        id: "d129f34b746846dda6debd89c55cf3f3"
      }
    });
    const mutableSepLSTVectorLayer = new FeatureLayer({
      portalItem: {
        id: "630f2470acb14d599c6f9993d1d73d1a"
      }
    });
    const immutableFebLSTVectorLayer = new FeatureLayer({
      portalItem: {
        id: "4d6205881d4e4dbda4a2735046edfd20"
      }
    });
    const mutableFebLSTVectorLayer = new FeatureLayer({
      portalItem: {
        id: "fbd5f1203df44c8c8fb4c17e668dfa22"

      }
    });
    Util.map.add(mutableSepLSTVectorLayer);
    function getLSTLayers() {
      return Util.getCurrentLSTLayer(immutableFebLSTVectorLayer, immutableSepLSTVectorLayer, mutableFebLSTVectorLayer, mutableSepLSTVectorLayer);
    }
    function getNotLSTLayers() {
      return Util.getNotCurrentLSTLayer(immutableFebLSTVectorLayer, immutableSepLSTVectorLayer, mutableFebLSTVectorLayer, mutableSepLSTVectorLayer)
    }
    mutableFebLSTVectorLayer.when(async () => {
      await Util.rampLSTToPrediction(getLSTLayers()[1], "gridcode")
    });
    mutableSepLSTVectorLayer.when(async () => {
      await Util.rampLSTToPrediction(getLSTLayers()[1], "gridcode")
    });
    document.getElementById("selectLST").addEventListener("change", function() {
      const value = event.target.value;
      Util.handleLSTChange(value, mutableFebLSTVectorLayer, mutableSepLSTVectorLayer);
      Util.calculateAverageTemperature(getLSTLayers()[1])
    });

    const immutableTreesLayer = new FeatureLayer({
      portalItem: {
        id: "18039c2ee1b443f8ad528d111b639428"
      }
    });
    const mutableTreesLayer = new FeatureLayer({
      portalItem: {
        id: "136b0b29bff54ddfb6ed36fdc9288078"
      },
      elevationInfo: {
        mode: "on-the-ground"
      },
      renderer: Util.treeRenderer
    });
    Util.map.add(mutableTreesLayer);

    // Hide the Sketch widget from the UI until "Add Trees" button is clicked
    Util.view.ui.add(Util.sketch, "top-right");
    Util.sketch.container.style.display = "none"; // Initially hide the Sketch widget
    function startCreatingFeature() {
      Util.sketch.create("point");
      Util.sketch.on("create", async (event) => {
        if (event.state === "complete") {
          const graphic = event.graphic;
          if (graphic) {
            await Util.addTreeOnGraphic(graphic, mutableTreesLayer);
            await Util.reduceTemperatureAroundGraphic(graphic, getLSTLayers()[1], 30, 1)
            await Util.reduceTemperatureAroundGraphic(graphic, getLSTLayers()[1], 60, 1)
            await Util.reduceTemperatureAroundGraphic(graphic, getNotLSTLayers()[1], 30, 1)
            await Util.reduceTemperatureAroundGraphic(graphic, getNotLSTLayers()[1], 60, 1)
          }
        }
      });
    }
    document.getElementById("reset").addEventListener("click", async () => {
      await Util.resetByUpdateFeatureLayer(getLSTLayers()[0], getLSTLayers()[1]);
      await Util.resetByUpdateFeatureLayer(getNotLSTLayers()[0], getNotLSTLayers()[1]);
      await Util.deleteTreeNullFeatureLayer(immutableTreesLayer, mutableTreesLayer);
    });
    document.getElementById("addTrees").addEventListener("click", startCreatingFeature);
    document.getElementById("cursor").addEventListener("click", Util.stopSketch);


    function updateVisibleCounts() {
      Util.calculateAverageTemperature(getLSTLayers()[1])
      const visibleExtent = Util.view.extent;  // Get the current visible extent
      let buildingCount = 0;

      // Create promises for querying visible counts
      const buildingWestPromise = buildingsWestLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      const buildingPromise = buildingsLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      const treePromise = mutableTreesLayer.queryFeatureCount({
        geometry: visibleExtent,
        spatialRelationship: "intersects"
      });

      // Use Promise.all to wait for all queries to complete
      Promise.all([buildingWestPromise, buildingPromise, treePromise])
          .then(([visibleBuildingWestCount, visibleBuildingCount, treeCount]) => {
            // Update the counts
            buildingCount = visibleBuildingWestCount + visibleBuildingCount;

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
    const debouncedUpdateVisibleCounts = Util.debounce(updateVisibleCounts, 300);

    // Ensure all layers are loaded before updating counts
    Promise.all([
      buildingsWestLayer.when(),
      buildingsLayer.when(),
      mutableTreesLayer.when()
    ]).then(() => {
      // Layers are loaded, proceed to update counts
      updateVisibleCounts();
      Util.view.watch("extent", debouncedUpdateVisibleCounts);  // Watch for extent changes
    }).catch(error => {
      console.error("Error loading layers: ", error);
    });

    Util.view.when(() => {
      updateVisibleCounts()
      Util.view.popupEnabled = true; //disable popups
    });




    // Re-query the visible building count whenever the view is moved or zoomed
    Util.view.watch("extent", updateVisibleCounts);
  };
  main();
});

