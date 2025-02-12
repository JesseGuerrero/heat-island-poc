// Grant CesiumJS access to your ion assets
Cesium.Ion.defaultAccessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJmMTBkNmYwYi02NjE1LTQ0MDItYTU0MC1iMmI5YTBjYmIxNTYiLCJpZCI6Mjc1NTU0LCJpYXQiOjE3Mzk0MDE1NTB9.mPvU0lpHt2S_outuu1hRq_5dReEifbBc-YIbPUtv4wU";

const viewer = new Cesium.Viewer("cesiumContainer", {
    // This is a global 3D Tiles tileset so disable the
    // globe to prevent it from interfering with the data
    globe: false,
    // Disabling the globe means we need to manually
    // re-enable the atmosphere
    skyAtmosphere: new Cesium.SkyAtmosphere(),
    // 2D and Columbus View are not currently supported
    // for global 3D Tiles tilesets
    sceneModePicker: false,
    // Imagery layers are not currently supported for
    // global 3D Tiles tilesets
    baseLayerPicker: false,
    // Use the Google geocoder instead of Bing
    geocoder: Cesium.IonGeocodeProviderType.GOOGLE,
});

try {
    const tileset = await Cesium.Cesium3DTileset.fromIonAssetId(2275207);
    viewer.scene.primitives.add(tileset);
} catch (error) {
    console.log(error);
}