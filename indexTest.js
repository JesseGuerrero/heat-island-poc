require([
  "esri/layers/FeatureLayer",
  "esri/layers/GraphicsLayer",
  "esri/layers/SceneLayer",
  "esri/layers/TileLayer",
  "esri/widgets/TimeZoneLabel",
  "esri/request",
  "util.js",
  "auth.js"
], function(FeatureLayer, GraphicsLayer, SceneLayer, TileLayer, TimeZoneLabel, esriRequest, Util, Auth) {
  async function main() {
    await Auth.initToken();
    const layer = new FeatureLayer({
      url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/NDFD_Precipitation_v1/FeatureServer/0"
    });

    // get the arcgis-map component element and wait for it to be ready
    const arcgisMap = document.querySelector("viewDiv");
    if (!arcgisMap.ready) {
      arcgisMap.addEventListener("arcgisViewReadyChange", handleMapReady, {
        once: true
      });
    } else {
      handleMapReady();
    }
    async function handleMapReady() {
      arcgisMap.addLayer(layer);

      // get the MapView instance from the arcgis-map component
      const view = arcgisMap.view;
      await arcgisMap.whenLayerView(layer);


      const timeSlider = document.querySelector("arcgis-time-slider");
      timeSlider.fullTimeExtent = layer.timeInfo.fullTimeExtent.expandTo("hours");
      timeSlider.stops = {
        interval: layer.timeInfo.interval
      };


      const timeZoneLabel = new TimeZoneLabel({view});
      view.ui.add(timeZoneLabel, "top-left");


      const timezonePicker = document.getElementById("timezone-picker");
      timezonePicker.addEventListener("calciteInputTimeZoneChange", () => {
        view.timeZone = timezonePicker.value;
      });

    }
  }
  main();
});

