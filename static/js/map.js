let roadLayer;
let roadFeatures = [];
let lastSearchLayer = null;

function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
  for (let j = 0; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[a.length][b.length];
}

function fuzzyMatch(input, name) {
  if (!name) return false;
  const li = input.toLowerCase();
  const ln = name.toLowerCase();
  if (ln.startsWith(li) || ln.includes(li)) return true;
  const firstWord = ln.split(/\s+/)[0];
  return levenshtein(li, firstWord) <= 2;
}

const defaultView = [52.4862, -1.8904];
const defaultZoom = 12;

const map = L.map('map').setView(defaultView, defaultZoom);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

document.getElementById("reset-view").addEventListener("click", () => {
  map.setView(defaultView, defaultZoom);

  if (lastSearchLayer) {
    map.removeLayer(lastSearchLayer);
    lastSearchLayer = null;
  }

  if (window.activeRoadLayer) {
    window.activeRoadLayer.setStyle({
      color: window.activeRoadLayer.options.originalColor || '#000000',
      weight: window.activeRoadLayer.options.originalWeight || 8,
      opacity: window.activeRoadLayer.options.originalOpacity ?? 0
    });
    window.activeRoadLayer = null;
  }

  hideSidebar();
});

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

  let hoverTimeout;

  layer.on('mouseover', function () {
    if (map.getZoom() > 14) {
      layer.bindTooltip(tooltipContent, {
        sticky: true,
        direction: 'top',
        opacity: 0.9,
        className: 'road-tooltip'
      }).openTooltip();
    }

    hoverTimeout = setTimeout(() => {
      if (window.activeRoadLayer !== layer) {
        layer.setStyle({ color: '#ffff00', weight: 5, opacity: 1 });
      }
    }, 50);
  });

  layer.on('mouseout', function () {
    clearTimeout(hoverTimeout);
    if (window.activeRoadLayer === layer) return;

    layer.setStyle({
      color: layer.options.originalColor || '#000000',
      weight: layer.options.originalWeight || 8,
      opacity: layer.options.originalOpacity ?? 0
    });
  });

  layer.on('click', function () {
    if (window.activeRoadLayer && window.activeRoadLayer !== layer) {
      window.activeRoadLayer.setStyle({
        color: window.activeRoadLayer.options.originalColor || '#000000',
        weight: window.activeRoadLayer.options.originalWeight || 8,
        opacity: window.activeRoadLayer.options.originalOpacity ?? 0
      });
    }

    layer.setStyle({ color: '#00ffff', weight: 6, opacity: 1 });
    window.activeRoadLayer = layer;
    showSidebar({ name, type, speed, length });
  });
}

fetch('/api/roads')
  .then(response => response.json())
  .then(data => {
    roadFeatures = data.features;
    const roadNames = [...new Set(roadFeatures.map(f => f.properties.name).filter(name => typeof name === 'string'))];

    const input = document.getElementById("search");
    const datalist = document.getElementById("road-suggestions");

    input.addEventListener("input", function () {
      const value = this.value.toLowerCase();
      datalist.innerHTML = "";
      roadNames.filter(name => fuzzyMatch(value, name)).slice(0, 15).forEach(name => {
        const option = document.createElement("option");
        option.value = name;
        datalist.appendChild(option);
      });
    });

    roadLayer = L.geoJSON(data, {
      onEachFeature: attachRoadEvents,
      style: { opacity: 0, fillOpacity: 0, weight: 8, color: "#000000" }
    }).addTo(map);
  });

function searchRoad() {
  const input = document.getElementById("search").value.trim().toLowerCase();
  if (!input) {
    hideSidebar();
    if (lastSearchLayer) {
      map.removeLayer(lastSearchLayer);
      lastSearchLayer = null;
    }
    return;
  }

  if (lastSearchLayer) {
    map.removeLayer(lastSearchLayer);
    lastSearchLayer = null;
  }

  const matches = roadFeatures.filter(f =>
    typeof f.properties.name === 'string' &&
    fuzzyMatch(input, f.properties.name)
  );

  if (matches.length === 0) {
    alert("Road not found.");
    return;
  }

  lastSearchLayer = L.geoJSON(matches, {
    onEachFeature: attachRoadEvents,
    style: { color: "#cc0000", weight: 3 }
  }).addTo(map);

  const group = L.featureGroup();
  lastSearchLayer.eachLayer(layer => group.addLayer(layer));
  map.invalidateSize();
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

const toggleInput = document.getElementById('theme-toggle');
const modeLabel = document.getElementById('mode-label');
const slider = document.querySelector('.slider');

function updateThemeUI(isDark) {
  document.body.classList.toggle('dark-mode', isDark);
  modeLabel.innerHTML = isDark ? "DARK<br>MODE" : "LIGHT<br>MODE";
  localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

toggleInput.addEventListener('change', () => {
  updateThemeUI(toggleInput.checked);
});

window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  const isDark = savedTheme === 'dark';
  toggleInput.checked = isDark;
  updateThemeUI(isDark);
});
