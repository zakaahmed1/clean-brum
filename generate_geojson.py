import os
import osmnx as ox
import geopandas as gpd

# Step 1: Get the road network for driving in Birmingham
place = "Birmingham, United Kingdom"
G = ox.graph_from_place(place, network_type="drive")

# Step 2: Convert to GeoDataFrame (edges only)
edges = ox.graph_to_gdfs(G, nodes=False)

# Step 3: Filter out roads with no name
edges = edges[edges["name"].notna()]

# Step 4: Project to British National Grid (EPSG:27700) for accurate length
edges = edges.to_crs(epsg=27700)
edges["length_m"] = edges.geometry.length  # Accurate length in meters

# Step 5: Convert back to WGS84 for Leaflet/GeoJSON compatibility
edges = edges.to_crs(epsg=4326)

# Step 6: Save as GeoJSON
os.makedirs("data", exist_ok=True)
edges.to_file("data/birmingham_roads.geojson", driver="GeoJSON")

print("GeoJSON saved to: data/birmingham_roads.geojson")
