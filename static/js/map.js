let roadLayer;
let roadFeatures = [];
let lastSearchLayer = null;

// Initialize the map
const map = L.map('map').setView([52.4862, -1.8904], 12);

// Add tile layer
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map); // ✅ Needed!

// Load road data
fetch('/api/roads')
  .then(response => response.json())
  .then(data => {
    roadFeatures = data.features;

    // Create list of unique road names
    const roadNames = [...new Set(
        roadFeatures
            .map(f => f.properties.name)
            .filter(name => typeof name === 'string')
    )];

    // Listen for input changes to filter suggestions
    const input = document.getElementById("search");
    const datalist = document.getElementById("road-suggestions");

    input.addEventListener("input", function () {
        const value = this.value.toLowerCase();

        // Clear old suggestions
        datalist.innerHTML = "";

        // Add new ones that START with the input
        roadNames
            .filter(name => name.toLowerCase().startsWith(value))
            .slice(0, 15) // Optional: limit to top 15
            .forEach(name => {
                const option = document.createElement("option");
                option.value = name;
                datalist.appendChild(option);
            });
        });

    roadLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        const name = feature.properties.name ?? "Unnamed";
        const length = feature.properties.length_m?.toFixed(2) ?? "N/A";
        const type = feature.properties.highway ?? "Unknown";
        const speed = feature.properties.maxspeed ?? "N/A";
        
        layer.bindPopup(`
          <strong>${name}</strong><br>
          Type: ${type}<br>
          Speed Limit: ${speed}<br>
          Length: ${length} m
        `);
      },
      style: {
      opacity: 0,           // Make the line invisible
      fillOpacity: 0,       // In case of polygon features (safety)
      weight: 8,            // Still thick enough to be clickable
      color: "#000000"      // Doesn't matter, it's invisible
      }
    }).addTo(map);
  });

// Search handler
function searchRoad() {
  const input = document.getElementById("search").value.trim().toLowerCase();
  if (!input) return;

  if (lastSearchLayer) {
    map.removeLayer(lastSearchLayer);
  }

  const matches = roadFeatures.filter(f =>
    typeof f.properties.name === 'string' &&
    f.properties.name.toLowerCase().includes(input)
  );

  if (matches.length === 0) {
    alert("Road not found.");
    return;
  }

  lastSearchLayer = L.geoJSON(matches, {
    onEachFeature: function (feature, layer) {
      const name = feature.properties.name;
      const length = feature.properties.length_m?.toFixed(2) ?? "N/A";
      const type = feature.properties.highway ?? "Unknown";
      const speed = feature.properties.maxspeed ?? "N/A";
      layer.bindPopup(`<strong>${name}</strong><br>Type: ${type}<br>Length: ${length} m<br>Speed Limit: ${speed}`);
    },
    style: {
      color: "#cc0000",
      weight: 3
    }
  }).addTo(map);

  // Build a group to zoom to
  const group = L.featureGroup();
  lastSearchLayer.eachLayer(layer => group.addLayer(layer));

  map.fitBounds(group.getBounds());

  const totalLength = matches.reduce((sum, f) => sum + (f.properties.length_m || 0), 0).toFixed(2);
  L.popup()
    .setLatLng(group.getBounds().getCenter())
    .setContent(`<strong>${matches[0].properties.name ?? "Unnamed"}</strong><br>
      Type: ${matches[0].properties.highway ?? "Unknown"}<br>
      Speed Limit: ${matches[0].properties.maxspeed ?? "N/A"}<br>
      Total length: ${totalLength} m
`)

    .openOn(map);
}
