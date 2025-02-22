require([
  "esri/WebScene",
  "esri/views/SceneView",
  "esri/layers/FeatureLayer",
  "esri/widgets/Weather",
  "esri/widgets/Daylight",
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
], function(WebScene, SceneView, FeatureLayer, Weather, Daylight, TimeSlider, Zoom, Legend, Expand, TimeZoneLabel, GraphicsLayer, SceneLayer, TileLayer, esriRequest, Util, Auth) {
  async function main() {
    const token = await Auth.initToken();
    const map = new WebScene({
      portalItem: {
        id: "d8eda4aaae134cd186de340dd00e4ea6"
      },
      basemap: "osm"
    });

    // Create a new SceneView and set the weather to cloudy
    const scene_view = new SceneView({
      map: map,
      container: "viewDiv",
      center: [-98.4936, 29.426],
      zoom: 18,
      camera: {
        position: {
          x: -98.4830,
          y: 29.4078,
          z: 800
        },
        tilt: 65
      },
      environment: {
        weather: {
          type: "rainy",
          cloudCover: 0.7,
          precipitation: 0.3
        }
      }
    });
    Util.view.map = map;
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

      scene_view.ui.add(timeSlider, "bottom-right");
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

    /***********************************
     * Add the widgets' UI elements to the view
     ***********************************/
    const weatherExpand = new Expand({
      view: scene_view,
      content: new Weather({
        view: scene_view
      }),
      group: "top-right",
      expanded: true
    });

    const daylightExpand = new Expand({
      view: scene_view,
      content: new Daylight({
        view: scene_view
      }),
      group: "top-right"
    });
    scene_view.ui.add([weatherExpand, daylightExpand], "top-right");

    //Toggle UHI
    const cityService = document.getElementById('cityService');
    const uhiService = document.getElementById('uhiService');
    const title = document.getElementById('title');
    cityService.addEventListener('click', () => {
      title.innerText = "SATX 2024 - 3D City"
      const timeSlider = document.getElementsByClassName('esri-time-slider')[0];
      const weatherSlider = document.getElementsByClassName('esri-ui-top-right')[0];
      weatherSlider.style.display = "block";
      timeSlider.style.display = "none";
      map.remove(layer)
    })

    uhiService.addEventListener('click', () => {
      title.innerText = "SATX 2024 - Heat Island"
      const timeSlider = document.getElementsByClassName('esri-time-slider')[0];
      const weatherSlider = document.getElementsByClassName('esri-ui-top-right')[0];
      weatherSlider.style.display = "none";
      timeSlider.style.display = "block";
      map.add(layer)
    })

    Util.view.when(() => {
      Util.view.popupEnabled = false;
    });

  };
  main();
});

