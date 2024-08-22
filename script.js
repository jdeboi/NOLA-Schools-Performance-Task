mapboxgl.accessToken =
  "pk.eyJ1IjoiamRlYm9pIiwiYSI6ImNsc3dvNmJ0NzBua2gyam82OHIyMDJlaXoifQ.vml5fodiy2NC8Zu2yvmPew";

const map = new mapboxgl.Map({
  container: "map",
  style: "mapbox://styles/jdeboi/clxwdfwei04pd01qo5hvm9rs7",
  center: [-89.95, 30], // Centered on New Orleans
  zoom: 10.5,
  maxZoom: 12,
  minZoom: 10,
  bearingSnap: 0,
  pitchWithRotate: false,
  dragRotate: false,
});

d3.csv("data/schools.csv").then(function (csvData) {
  // Create a dictionary to store CSV data by ZIP code
  let studentData = {};
  csvData.forEach(function (row) {
    studentData[row["Zip Code"]] = {
      econDisadv: +row["Total_DisAdv"],
      totalStudents: +row["Total_Students"],
      percentDisadv: +row["Dis_Adv_Mean_Percent"],
      povertyPercent: +row["Zip Poverty Percent"],
      percentCommunityDifference: +row["Percent_Community Difference"],
      population: +row["Population"],
      numberOfSchools: +row["School Count"],
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

      updateLegend();
      updateMapColor();

      document
        .getElementById("color-metric")
        .addEventListener("change", function () {
          const selectedMetric = this.value;
          updateLegend(selectedMetric);
          updateMapColor(selectedMetric); // Assuming you already have this function defined
        });

      // Step 5: Add popups to display ZIP code data
      map.on("click", "zip-codes-layer", (e) => {
        const properties = e.features[0].properties;
        if (properties.numberOfSchools == 0) {
          new mapboxgl.Popup()
            .setLngLat(e.lngLat)
            .setHTML("<br>No Schools")
            .addTo(map);
          return;
        }
        new mapboxgl.Popup()
          .setLngLat(e.lngLat)
          .setHTML(
            `
                                <strong>Zip Code: ${
                                  properties.zcta5ce10
                                }</strong><br>
                                Economically Disadvantaged Students: ${properties.econDisadv.toFixed(
                                  0
                                )}<br>
                                Total Students: ${properties.totalStudents}<br>
                                Average Percent Disadvantaged: ${(
                                  properties.percentDisadv * 100
                                ).toFixed(2)}%<br>
                                Poverty Percent of Zip: ${(
                                  properties.povertyPercent * 100
                                ).toFixed(2)}%<br>
                                Student Disadvantaged Rate Relative to Community (% Difference): ${(
                                  properties.percentCommunityDifference * 100
                                ).toFixed(2)}%<br>
                                Population of Zip: ${properties.population}<br>
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

// Function to update the map's fill color based on the selected metric
function updateMapColor(metric) {
  const colors = colorScales[metric] || colorScales["econDisadv"]; // Fallback to econDisadv if the metric is not found
  map.setPaintProperty("zip-codes-layer", "fill-color", colors);
}

function updateLegend(metric) {
  const legendItems = document.getElementById("legend-items");
  legendItems.innerHTML = ""; // Clear any existing legend items

  // Get the appropriate legend for the selected metric
  const legend = legendData[metric] || legendData["econDisadv"];

  // Create and append legend items
  legend.forEach((item) => {
    const legendItem = document.createElement("div");
    legendItem.className = "legend-item";

    const colorBox = document.createElement("div");
    colorBox.className = "legend-color";
    colorBox.style.backgroundColor = item.color;

    const label = document.createElement("span");
    label.textContent = item.label;

    legendItem.appendChild(colorBox);
    legendItem.appendChild(label);
    legendItems.appendChild(legendItem);
  });
}
