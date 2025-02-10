require([
  "esri/layers/FeatureLayer",
  "esri/widgets/TimeSlider",
  "esri/widgets/Zoom",
  "esri/widgets/Legend",
  "esri/widgets/Expand",
  "esri/widgets/TimeZoneLabel",
  "esri/layers/GraphicsLayer",
  "esri/layers/SceneLayer",
  "esri/layers/TileLayer",
  "esri/request",
  "util.js",
  "auth.js"
], function(FeatureLayer, TimeSlider, Zoom, Legend, Expand, TimeZoneLabel, GraphicsLayer, SceneLayer, TileLayer, esriRequest, Util, Auth) {
  async function main() {
    await Auth.initToken();
    const layer = new FeatureLayer({
      portalItem: {
        id: "f9e9283b9c9741d09aad633f68758bf6",
      },
    });
    Util.map.add(layer);
    layer.load().then(() => {
      Util.map.add(layer);

      const timeSlider = new TimeSlider({
        container: "timeSlider",
        view: Util.view,
        mode: "time-window",
        fullTimeExtent: layer.timeInfo.fullTimeExtent.expandTo("hours"),
        stops: {
          interval: layer.timeInfo.interval
        },
        layout: "auto",
        timeVisible: true,
        loop: true
      });
      Util.view.ui.add(timeSlider, "bottom-right");
    }).catch((error) => {
      console.error("Error loading layer:", error);
    });

    const zoom = new Zoom({
      view: Util.view
    });
    Util.view.ui.add(zoom, "top-left");

    const legend = new Legend({
      view: Util.view
    });

    const expand = new Expand({
      view: Util.view,
      content: legend,
      mode: "floating"
    });
    Util.view.ui.add(expand, "top-left");

    // const timeZoneLabel = new TimeZoneLabel({view: Util.view});
    // Util.view.ui.add(timeZoneLabel, "top-left");
    //
    // const timezonePicker = document.createElement("calcite-input-time-zone");
    // timezonePicker.mode = "name";
    // timezonePicker.id = "timezone-picker";
    // Util.view.ui.add(timezonePicker, "top-right");
    //
    // timezonePicker.addEventListener("calciteInputTimeZoneChange", () => {
    //   Util.view.timeZone = timezonePicker.value;
    // });

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

    const lcz = new TileLayer({
      portalItem: {
        id: "55e9d9daabda4f5bbb8838840e0c43b7",
        token: Util.token
      },
      opacity: 0.5
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
    // Util.map.add(mutableSepLSTVectorLayer);
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
      Util.handleLSTChange(mutableFebLSTVectorLayer, mutableSepLSTVectorLayer, lcz);
      if(value != 3)
        Util.calculateAverageTemperature(getLSTLayers()[1])
    });

    //Toggle UHI
    const cityService = document.getElementById('cityService');
    const uhiService = document.getElementById('uhiService');
    const paneDiv = document.getElementById('paneDiv');
    const infoDiv = document.getElementById('infoDiv');
    const selectLST = document.getElementById('selectLST');
    const title = document.getElementById('title');
    cityService.addEventListener('click', () => {
      paneDiv.style.display = "none";
      infoDiv.style.display = "none";
      title.innerText = "SATX 2024 - 3D City"
      Util.map.remove(Util.getCurrentLSTLayer(immutableFebLSTVectorLayer, immutableSepLSTVectorLayer, mutableFebLSTVectorLayer, mutableSepLSTVectorLayer)[1])
    })

    uhiService.addEventListener('click', () => {
      title.innerText = "SATX 2024 - Heat Island"
      paneDiv.style.display = "block";
      infoDiv.style.display = "block";
      value = selectLST.value;
      Util.handleLSTChange(mutableFebLSTVectorLayer, mutableSepLSTVectorLayer, lcz);
      if(value != 3)
        Util.calculateAverageTemperature(getLSTLayers()[1])
    })

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
            // Show the loading overlay
            Util.showLoading();

            try {
              // Perform async operations
              await Util.addTreeOnGraphic(graphic, mutableTreesLayer);
              await Util.reduceTemperatureAroundGraphic(graphic, getLSTLayers()[1], 30, 1);
              await Util.reduceTemperatureAroundGraphic(graphic, getLSTLayers()[1], 60, 1);
              await Util.reduceTemperatureAroundGraphic(graphic, getNotLSTLayers()[1], 30, 1);
              await Util.reduceTemperatureAroundGraphic(graphic, getNotLSTLayers()[1], 60, 1);
            } catch (error) {
              console.error("Error during feature creation:", error);
            } finally {
              // Hide the loading overlay
              Util.hideLoading();
            }
          }
        }
      });
    }

    document.getElementById("reset").addEventListener("click", async () => {
      Util.showLoading();
      await Util.resetByUpdateFeatureLayer(getLSTLayers()[0], getLSTLayers()[1]);
      await Util.resetByUpdateFeatureLayer(getNotLSTLayers()[0], getNotLSTLayers()[1]);
      await Util.deleteTreeNullFeatureLayer(immutableTreesLayer, mutableTreesLayer);
      Util.hideLoading();
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

