mapboxgl.accessToken =
  "pk.eyJ1IjoiamRlYm9pIiwiYSI6ImNsc3dvNmJ0NzBua2gyam82OHIyMDJlaXoifQ.vml5fodiy2NC8Zu2yvmPew";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/jdeboi/clxwdfwei04pd01qo5hvm9rs7",
  center: [-90.0715, 29.9511], // Centered on New Orleans
  zoom: 11,
  maxZoom: 12,
  minZoom: 10,
  bearingSnap: 0,
  pitchWithRotate: false,
  dragRotate: false,
});

// Step 1: Load the CSV data with D3.js
d3.csv("data/schools.csv").then(function (csvData) {
  // Create a dictionary to store CSV data by ZIP code
  let studentData = {};
  csvData.forEach(function (row) {
    studentData[row["Zip Code"]] = {
      econDisadv: +row["Econ Disadv Count"],
      totalStudents: +row["Total Student Count"],
      percentDisadv: +row["Percent Disadvantaged"],
      povertyPercent: +row["Zip Poverty Percent"],
      percentCommunityDifference: +row["Percent Community Difference"],
      population: +row["Population"],
      numberOfSchools: +row["Number of Schools"],
    };
  });

  // Step 2: Load the GeoJSON data
  d3.json("data/Orleans_zips.geojson").then(function (geojsonData) {
    // Step 3: Add the CSV data to the GeoJSON properties
    geojsonData.features.forEach(function (feature) {
      let zipCode = feature.properties.zcta5ce10; // Use the correct GeoJSON property for ZIP code
      if (studentData[zipCode]) {
        feature.properties.econDisadv = studentData[zipCode].econDisadv;
        feature.properties.totalStudents = studentData[zipCode].totalStudents;
        feature.properties.percentDisadv = studentData[zipCode].percentDisadv;
        feature.properties.povertyPercent = studentData[zipCode].povertyPercent;
        feature.properties.percentCommunityDifference =
          studentData[zipCode].percentCommunityDifference;
        feature.properties.population = studentData[zipCode].population;
        feature.properties.numberOfSchools =
          studentData[zipCode].numberOfSchools;
      }
    });

    // Step 4: Add the GeoJSON data to the Mapbox map
    map.on("load", function () {
      map.addSource("zip-codes", {
        type: "geojson",
        data: geojsonData,
      });

      map.addLayer({
        id: "zip-codes-layer",
        type: "fill",
        source: "zip-codes",
        paint: {
          "fill-color": [
            "step",
            ["get", "econDisadv"],
            "#FFEDA0", // color for <= 200 students
            500,
            "#FEB24C",
            1000,
            "#FD8D3C",
            1500,
            "#FC4E2A",
            2000,
            "#E31A1C",
            3000,
            "#BD0026",
          ],
          "fill-opacity": 0.6,
        },
      });

      map.addLayer({
        id: "zip-codes-borders",
        type: "line",
        source: "zip-codes",
        paint: {
          "line-color": "#ffffff",
          "line-width": 2,
        },
      });

      // Step 5: Add popups to display ZIP code data
      map.on("click", "zip-codes-layer", (e) => {
        const properties = e.features[0].properties;
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
                            <strong>Zip Code: ${
                              properties.zcta5ce10
                            }</strong><br>
                            Economically Disadvantaged: ${
                              properties.econDisadv
                            }<br>
                            Total Students: ${properties.totalStudents}<br>
                            Percent Disadvantaged: ${(
                              properties.percentDisadv * 100
                            ).toFixed(2)}%<br>
                            Zip Poverty Percent: ${(
                              properties.povertyPercent * 100
                            ).toFixed(2)}%<br>
                            Percent Community Difference: ${(
                              properties.percentCommunityDifference * 100
                            ).toFixed(2)}%<br>
                            Population: ${properties.population}<br>
                            Number of Schools: ${properties.numberOfSchools}
                        `
          )
          .addTo(map);
      });

      // Change the cursor to a pointer when hovering over the zip codes
      map.on("mouseenter", "zip-codes-layer", () => {
        map.getCanvas().style.cursor = "pointer";
      });

      // Reset the cursor to default when not hovering
      map.on("mouseleave", "zip-codes-layer", () => {
        map.getCanvas().style.cursor = "";
      });
    });
  });
});
