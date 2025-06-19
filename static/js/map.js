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

    // Helper function to avoid copy and pasting - use this for roadLayer and lastSearchLayer so we don't have to declare features every time
    function attachRoadEvents(feature, layer) {
      const name = feature.properties.name ?? "Unnamed";
      const length = feature.properties.length_m?.toFixed(2) ?? "N/A";
      const type = feature.properties.highway ?? "Unknown";
      const speed = feature.properties.maxspeed ?? "N/A";

      const tooltipContent = `
        <strong>${name}</strong><br>
        Type: ${type}<br>
        Speed Limit: ${speed}<br>
        Length: ${length} m
      `;

      // Hover behavior

      layer.on('mouseover', function () {
        if (map.getZoom() > 14) {
          layer.bindTooltip(tooltipContent, {
            sticky: true,       // tooltip follows the mouse
            direction: 'top',   // position above the road
            opacity: 0.9,
            className: 'road-tooltip' // optional custom styling
          }).openTooltip();
        }

        hoverTimeout = setTimeout(() => {
          layer.setStyle({
            color: '#ffff00',
            weight: 5,
            opacity: 1
          });
        }, 50); // Delay slightly
      });

      layer.on('mouseout', function () {
        clearTimeout(hoverTimeout);
        layer.setStyle({
          color: layer.options.originalColor || '#000000',
          weight: layer.options.originalWeight || 8,
          opacity: layer.options.originalOpacity ?? 0
        });
      });

      // Click → open sidebar
      layer.on('click', function () {
        showSidebar({ name, type, speed, length });
      });
    }

    roadLayer = L.geoJSON(data, {
      onEachFeature: function (feature, layer) {
        // Only clickable, no hover
        const name = feature.properties.name ?? "Unnamed";
        const length = feature.properties.length_m?.toFixed(2) ?? "N/A";
        const type = feature.properties.highway ?? "Unknown";
        const speed = feature.properties.maxspeed ?? "N/A";

        layer.on('click', function () {
          showSidebar({ name, type, speed, length });
        });
      },
      style: {
        opacity: 0,
        fillOpacity: 0,
        weight: 8,
        color: "#000000"
      }
    }).addTo(map);
  });

// Search handler
function searchRoad() {
  const input = document.getElementById("search").value.trim().toLowerCase();
  if (!input) {
    hideSidebar(); // Hide sidebar if search is cleared
    if (lastSearchLayer) {
      map.removeLayer(lastSearchLayer);
      lastSearchLayer = null;
    }
    return;
  }

  // Remove previous search highlight
  if (lastSearchLayer) {
    map.removeLayer(lastSearchLayer);
    lastSearchLayer = null;
  }

  const matches = roadFeatures.filter(f =>
    typeof f.properties.name === 'string' &&
    f.properties.name.toLowerCase().startsWith(input)
  );

  if (matches.length === 0) {
    alert("Road not found.");
    return;
  }

  lastSearchLayer = L.geoJSON(matches, {
    onEachFeature: function (feature, layer) {
      layer.options.originalColor = "#cc0000";
      layer.options.originalWeight = 3;
      layer.options.originalOpacity = 1;
      attachRoadEvents(feature, layer);
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

function showSidebar(data) {
  document.getElementById("road-name").innerText = data.name;
  document.getElementById("road-type").innerText = data.type;
  document.getElementById("road-speed").innerText = data.speed;
  document.getElementById("road-length").innerText = data.length;
  document.getElementById("sidebar").classList.remove("hidden");
}

function hideSidebar() {
  document.getElementById("sidebar").classList.add("hidden");
}
