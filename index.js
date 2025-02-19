require([
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/layers/SceneLayer",
  "esri/layers/TileLayer",
  "esri/layers/IntegratedMesh3DTilesLayer",
  "esri/request",
  "esri/widgets/Expand",
  "esri/widgets/Weather",
  "esri/widgets/Daylight",
  "util.js",
  "auth.js"
], function(FeatureLayer, GraphicsLayer, SceneLayer, TileLayer, IntegratedMesh3DTilesLayer, esriRequest, Expand, Weather, Daylight, Util, Auth) {
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

    const google3DTiles = new IntegratedMesh3DTilesLayer({
      url: "https://tile.googleapis.com/v1/3dtiles/root.json",
      title: "Google tiles",
      customParameters: {
        // see https://developers.google.com/maps/documentation/tile/3d-tiles-overview
        "key": "AIzaSyBs91cGrEkkESlZTy8AxbGy2wzlfVOfhG4"
      }
    });
    const lcz = new TileLayer({
      portalItem: {
        id: "55e9d9daabda4f5bbb8838840e0c43b7",
        token: Util.token
      },
      opacity: 0.5
    });
    Util.map.add(google3DTiles)
    // Util.map.add(buildingsLayer);
    // Util.map.add(buildingsWestLayer);
    // Util.map.add(threeDBuildingMesh);
    const weatherExpand = new Expand({
      view: Util.view,
      content: new Weather({
        view: Util.view
      }),
      group: "top-right",
      expanded: true
    });

    const daylightExpand = new Expand({
      view: Util.view,
      content: new Daylight({
        view: Util.view
      }),
      group: "top-right"
    });
    Util.view.ui.add([weatherExpand, daylightExpand], "top-right");

    /***********************************
     * Add functionality to change between flooding and no flooding
     ***********************************/
    // Wait for the view to be loaded, in order to being able to retrieve the layer
    Util.view.when(() => {
      // Find the layer for the
      let floodLevel = scene.allLayers.find(function (layer) {
        return layer.title === "Flood Level";
      });

      const selection = document.getElementById("selection");

      selection.addEventListener("calciteSegmentedControlChange", () => {
        switch (selection.selectedItem.value) {
          case "flooding":
            // Change the weather to rainy to match the flooding scenario
            view.environment.weather = {
              type: "rainy", // autocasts as new RainyWeather({ cloudCover: 0.7, precipitation: 0.3 })
              cloudCover: 0.7,
              precipitation: 0.3
            };
            // Turn on the water layer showing the flooding
            floodLevel.visible = true;
            break;

          case "noFlooding":
            // Change the weather back to cloudy
            Util.view.environment.weather = {
              type: "cloudy", // autocasts as new CloudyWeather({ cloudCover: 0.3 })
              cloudCover: 0.3
            };

            // Turn off the water layer showing the flooding
            floodLevel.visible = false;
            break;
        }
      });
    });
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
      if(!Util.map.layers.includes(google3DTiles))
        Util.map.add(google3DTiles)
      if(Util.map.layers.includes(buildingsLayer))
        Util.map.remove(buildingsLayer)
      if(Util.map.layers.includes(buildingsWestLayer))
        Util.map.remove(buildingsWestLayer)
      if(Util.map.layers.includes(threeDBuildingMesh))
        Util.map.remove(threeDBuildingMesh)
      if(Util.map.layers.includes(mutableTreesLayer))
        Util.map.remove(mutableTreesLayer);
      Util.map.remove(Util.getCurrentLSTLayer(immutableFebLSTVectorLayer, immutableSepLSTVectorLayer, mutableFebLSTVectorLayer, mutableSepLSTVectorLayer)[1])
    })

    uhiService.addEventListener('click', () => {
      title.innerText = "SATX 2024 - Heat Island"
      paneDiv.style.display = "block";
      infoDiv.style.display = "block";
      if(Util.map.layers.includes(google3DTiles))
        Util.map.remove(google3DTiles)
      if(!Util.map.layers.includes(buildingsLayer))
        Util.map.add(buildingsLayer)
      if(!Util.map.layers.includes(buildingsWestLayer))
        Util.map.add(buildingsWestLayer)
      if(!Util.map.layers.includes(threeDBuildingMesh))
        Util.map.add(threeDBuildingMesh)
      if(!Util.map.layers.includes(mutableTreesLayer))
        Util.map.add(mutableTreesLayer);
      value = selectLST.value;
      Util.handleLSTChange(mutableFebLSTVectorLayer, mutableSepLSTVectorLayer, lcz);
      if(value != 3)
        Util.calculateAverageTemperature(getLSTLayers()[1])
    })



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

