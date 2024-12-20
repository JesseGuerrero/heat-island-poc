define(["esri/request", "esri/identity/IdentityManager"],
    function (esriRequest, IdentityManager) {
        // Step 1: Define your ArcGIS Online credentials (for development purposes)
        const username = "jesus.guerrero6_utsa";
        const password = "D0lot$ofwork";

        // Step 2: Generate token programmatically (for development purposes)
        const tokenUrl = "https://utsa.maps.arcgis.com/sharing/rest/generateToken";
        const tokenParams = {
            username: username,
            password: password,
            referer: window.location.origin,
            expiration: 60,
            f: "json"
        };

        async function initToken() {
            const response = await esriRequest(tokenUrl, {
                method: "post",
                query: tokenParams
            });
            const token = response.data.token;
            IdentityManager.registerToken({
                server: "https://utsa.maps.arcgis.com",
                token: token,
                userId: username
            });
            return token;
        }

        return {
            initToken: initToken
        };
    });
