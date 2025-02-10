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
    const token = await Auth.initToken();
    const layer = new FeatureLayer({
      portalItem: {
        id: "02795552320b48bda2e49d9995057921",
      },
      timeInfo: {
        startField: "AcquisitionDate",
        endField: "AcquisitionDate",
        timeExtent: {
          start: new Date(1577836800000),  // Your earliest timestamp
          end: new Date(1577836800000 + (365 * 24 * 60 * 60 * 1000))  // One year later
        }
      }
    });
    // Util.map.add(layer);
    layer.when(async () => {
      try {
        await Util.rampLSTToPrediction(layer, "rank", "gridcode");  // Assuming "gridcode" is the field name
      } catch (error) {
        console.error("Error applying renderer to layer:", error);
      }
    });
    layer.load().then(async () => {
      // Query to get unique acquisition dates
      const uniqueDatesQuery = await layer.queryFeatures({
        where: "1=1",
        outFields: ["AcquisitionDate"],
        returnDistinctValues: true,
        orderByFields: "AcquisitionDate"  // Sort chronologically
      });

      // Extract the unique dates and sort them
      const uniqueDates = uniqueDatesQuery.features
          .map(f => f.attributes.AcquisitionDate)
          .sort((a, b) => a - b);  // Sort numerically since these are timestamps

      const timeSlider = new TimeSlider({
        container: "timeSlider",
        view: Util.view,
        mode: "instant",
        fullTimeExtent: {
          start: new Date(uniqueDates[0]),              // First date
          end: new Date(uniqueDates[uniqueDates.length - 1])  // Last date
        },
        stops: {
          dates: uniqueDates.map(date => new Date(date))  // Convert timestamps to Date objects
        },
        layout: "auto",
        timeVisible: true,
        loop: true,
        playRate: 2000,  // 2 seconds between each date
        labelFormatFunction: (value) => {
          return new Date(value).toLocaleDateString();
        }
      });

      Util.view.ui.add(timeSlider, "bottom-right");
    }).catch((error) => {
      console.error("Error loading layer:", error);
    });

    layer.when(() => {
      console.log("Available fields:", layer.fields.map(f => f.name));
    });
    layer.queryFeatures({
      where: "1=1",
      outFields: ["AcquisitionDate"],
      returnGeometry: false,
      num: 5  // Just get first 5 records to check
    }).then(response => {
      console.log("Sample dates:", response.features.map(f => f.attributes.AcquisitionDate));
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

    //Toggle UHI
    const cityService = document.getElementById('cityService');
    const uhiService = document.getElementById('uhiService');
    const title = document.getElementById('title');
    cityService.addEventListener('click', () => {
      const timeSlider = document.getElementsByClassName('esri-time-slider')[0];
      timeSlider.style.display = "none";
      title.innerText = "SATX 2024 - 3D City"
      Util.map.remove(layer)
    })

    uhiService.addEventListener('click', () => {
      title.innerText = "SATX 2024 - Heat Island"
      const timeSlider = document.getElementsByClassName('esri-time-slider')[0];
      timeSlider.style.display = "block";
      Util.map.add(layer)
      Util.calculateAverageTemperature(layer)
    })

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

    function updateVisibleCounts() {
      Util.calculateAverageTemperature(layer)
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

