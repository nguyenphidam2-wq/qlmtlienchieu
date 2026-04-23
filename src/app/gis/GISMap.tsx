"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap, GeoJSON, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-draw/dist/leaflet.draw.css";
import "leaflet-draw";
import { getSubjects } from "@/lib/actions/subjects";
import { getBusinesses } from "@/lib/actions/businesses";
import { getCustomZones, createCustomZone, deleteCustomZone, importGeoJSONZones, updateCustomZone } from "@/lib/actions/zones";
import { ISubject, IBusiness, ICustomZone } from "@/lib/models";
import MarkerClusterGroup from "react-leaflet-cluster";
import * as turf from "@turf/turf";

// Status colors
const statusColors: Record<string, string> = {
  "Nghiện": "#ff5252",
  "Sử dụng": "#ffb300",
  "Sau cai": "#00e676",
  "Khởi tố": "#ce93d8",
};

const riskColors: Record<string, string> = {
  "Thấp": "#00e676",
  "Trung bình": "#ffb300",
  "Cao": "#ff5252",
  "Rất cao": "#ce93d8",
};

// Drug zone colors (based on TDP risk level)
const drugZoneColors = {
  red: "#ff5252",    // High risk - many drug subjects
  yellow: "#ffb300", // Medium risk
  green: "#00e676",  // Low risk
};

// Lien Chieu center coordinates
const LIEN_CHIEU_CENTER: [number, number] = [16.0664, 108.1408];
const DEFAULT_ZOOM = 14;

// Lien Chieu center coordinates

// Preset colors for zones
const PRESET_COLORS = [
  "#ff5252", "#ffb300", "#00e676", "#2196f3",
  "#9c27b0", "#ff9800", "#e91e63", "#00bcd4",
  "#8bc34a", "#795548",
];

// TDP to coordinate mapping (approximate centers for each TDP in Lien Chieu)
const TDP_COORDINATES: Record<string, [number, number]> = {
  // Generate based on TDP number - closer TDPs cluster together
  "1": [16.0715, 108.1420], "2": [16.0705, 108.1440], "3": [16.0695, 108.1460],
  "4": [16.0685, 108.1480], "5": [16.0675, 108.1500], "6": [16.0665, 108.1520],
  "7": [16.0655, 108.1540], "8": [16.0645, 108.1560], "9": [16.0635, 108.1580],
  "10": [16.0625, 108.1600], "11": [16.0615, 108.1620], "12": [16.0605, 108.1640],
  "13": [16.0720, 108.1410], "14": [16.0710, 108.1430], "15": [16.0730, 108.1450],
  "16": [16.0740, 108.1470], "17": [16.0750, 108.1490], "18": [16.0760, 108.1510],
  "19": [16.0770, 108.1530], "20": [16.0780, 108.1550], "21": [16.0790, 108.1570],
  "22": [16.0800, 108.1590], "23": [16.0810, 108.1610], "24": [16.0820, 108.1630],
  "25": [16.0680, 108.1430], "26": [16.0670, 108.1450], "27": [16.0660, 108.1470],
  "28": [16.0650, 108.1490], "29": [16.0640, 108.1510], "30": [16.0630, 108.1530],
  "31": [16.0620, 108.1550], "32": [16.0610, 108.1570], "33": [16.0600, 108.1590],
  "34": [16.0590, 108.1610], "35": [16.0580, 108.1630], "36": [16.0570, 108.1650],
  "37": [16.0690, 108.1390], "38": [16.0700, 108.1410], "39": [16.0710, 108.1390],
  "40": [16.0720, 108.1370], "41": [16.0730, 108.1350], "42": [16.0740, 108.1330],
  "43": [16.0750, 108.1310], "44": [16.0760, 108.1290], "45": [16.0770, 108.1270],
  "46": [16.0640, 108.1400], "47": [16.0630, 108.1420], "48": [16.0620, 108.1440],
  "49": [16.0610, 108.1460], "50": [16.0600, 108.1480], "51": [16.0590, 108.1500],
  "52": [16.0580, 108.1520], "53": [16.0570, 108.1540], "54": [16.0560, 108.1560],
  "55": [16.0550, 108.1580], "56": [16.0540, 108.1600], "57": [16.0530, 108.1620],
  "58": [16.0650, 108.1380], "59": [16.0660, 108.1360], "60": [16.0670, 108.1340],
  "61": [16.0680, 108.1320], "62": [16.0690, 108.1300], "63": [16.0700, 108.1280],
  "64": [16.0710, 108.1260], "65": [16.0720, 108.1240], "66": [16.0730, 108.1220],
  "67": [16.0740, 108.1200], "68": [16.0750, 108.1180], "69": [16.0760, 108.1160],
  "70": [16.0770, 108.1140], "71": [16.0780, 108.1120], "72": [16.0790, 108.1100],
  "73": [16.0800, 108.1080], "74": [16.0810, 108.1060], "75": [16.0820, 108.1040],
  "76": [16.0830, 108.1020], "77": [16.0840, 108.1000], "78": [16.0850, 108.0980],
  "79": [16.0860, 108.0960], "80": [16.0870, 108.0940], "81": [16.0880, 108.0920],
  "82": [16.0890, 108.0900], "83": [16.0900, 108.0880],
};

// Special TDP areas
const SPECIAL_TDPS = ["Quan Nam 1", "Quan Nam 2", "Quan Nam 3", "Quan Nam 4", "Quan Nam 5", "Quan Nam 6", "Hiền Phước", "Hưởng Phước", "Trung Sơn", "Tân Ninh", "Vân Dương 1", "Vân Dương 2"];

function MapController() {
  const map = useMap();

  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
    }, 300);
  }, [map]);

  return null;
}

function ZonePopupComponent({ zone, onSaveField, onRemoveField }: { zone: any, onSaveField: any, onRemoveField: any }) {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  return (
    <div className="text-sm min-w-[200px]">
      <b>{zone.name}</b>
      <br />
      <span className="inline-block w-3 h-3 rounded-full mr-1" style={{ backgroundColor: zone.displayColor || zone.color }}></span>
      {zone.riskCount !== undefined ? `Số đối tượng: ${zone.riskCount}` : `Loại: ${zone.type}`}
      {zone.areaSqm > 0 && (
        <>
          <br />
          <span className="text-slate-600 block mt-1">
            📐 Diện tích: {(zone.areaSqm / 10000).toFixed(2)} hecta (ha)
          </span>
        </>
      )}

      {/* Custom Fields Section */}
      <div className="mt-2 pt-2 border-t border-slate-200">
         {zone.custom_fields && zone.custom_fields.map((f: any, i: number) => (
           <div key={i} className="flex justify-between items-start group py-1 text-xs border-b border-slate-50 last:border-0">
             <span className="text-slate-500 font-medium whitespace-nowrap">{f.label}:</span>
             <strong className="text-slate-800 ml-2 flex-1 text-right break-words">{f.value}</strong>
             <button onClick={() => onRemoveField(zone._id?.toString(), i)} className="opacity-0 group-hover:opacity-100 text-red-500 ml-2 hover:bg-red-50 px-1.5 py-0.5 rounded transition-opacity" title="Xóa">✕</button>
           </div>
         ))}

         {isAdding ? (
           <div className="mt-2 bg-slate-50 p-2 rounded-lg border border-slate-200 shadow-inner">
             <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Tên trường (VD: Số hộ)" className="w-full text-xs p-1.5 mb-1.5 border border-slate-300 rounded outline-none focus:border-blue-500" />
             <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Nội dung (VD: 345)" className="w-full text-xs p-1.5 mb-2 border border-slate-300 rounded outline-none focus:border-blue-500" />
             <div className="flex gap-2">
               <button onClick={() => { onSaveField(zone._id?.toString(), newLabel, newValue); setIsAdding(false); setNewLabel(""); setNewValue(""); }} disabled={!newLabel || !newValue} className="flex-1 bg-blue-600 text-white py-1.5 rounded text-xs font-semibold disabled:opacity-50 hover:bg-blue-700 transition-colors">Lưu</button>
               <button onClick={() => setIsAdding(false)} className="flex-1 bg-slate-200 text-slate-700 py-1.5 rounded text-xs font-semibold hover:bg-slate-300 transition-colors">Hủy</button>
             </div>
           </div>
         ) : (
           <button onClick={() => setIsAdding(true)} className="w-full mt-2 text-xs text-blue-600 bg-blue-50 hover:bg-blue-100 py-1.5 rounded-lg font-medium border border-blue-100 transition-colors flex items-center justify-center gap-1 shadow-sm">
             <i className="fas fa-plus"></i> Thêm trường thông tin
           </button>
         )}
      </div>
    </div>
  );
}

export function GISMap() {
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [customZones, setCustomZones] = useState<ICustomZone[]>([]);
  const [loading, setLoading] = useState(true);
  const [layers, setLayers] = useState({
    subjects: true,
    businesses: true,
    zones: true,
  });
  const [drawMode, setDrawMode] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);
  const drawControlRef = useRef<L.Control.Draw | null>(null);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, businessesData, zonesData] = await Promise.all([
          getSubjects(),
          getBusinesses(),
          getCustomZones(),
        ]);
        setSubjects(subjectsData);
        setBusinesses(businessesData);
        
        // Turf.js Point-In-Polygon calculate risk density per zone
        const enrichedZones = zonesData.map((zone) => {
          if (zone.type === "polygon" && zone.geojson?.features) {
            const points = turf.featureCollection(
              subjectsData.filter(s => s.lat && s.lng).map(s => turf.point([s.lng!, s.lat!]))
            );
            let count = 0;
            let totalArea = 0;
            zone.geojson.features.forEach((f: any) => {
              if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
                const ptsWithin = turf.pointsWithinPolygon(points, f);
                count += ptsWithin.features.length;
                try {
                  totalArea += turf.area(f);
                } catch(e) {}
              }
            });
            let calculatedColor = zone.color;
            // Density logic
            if (count >= 5) calculatedColor = drugZoneColors.red;
            else if (count >= 2) calculatedColor = drugZoneColors.yellow;
            else if (count === 1) calculatedColor = drugZoneColors.green;
            
            return { ...zone, riskCount: count, displayColor: calculatedColor, areaSqm: totalArea };
          }
          return { ...zone, displayColor: zone.color };
        });
        setCustomZones(enrichedZones as any);
      } catch (error) {
        console.error("Error loading map data:", error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // Fix Leaflet default icon issue
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Initialize draw control after map loads
  useEffect(() => {
    if (loading || !mapRef.current) return;

    const map = mapRef.current;

    // Initialize drawn items layer
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    // Initialize draw control
    if (!drawControlRef.current && drawnItemsRef.current) {
      drawControlRef.current = new L.Control.Draw({
        position: "topright",
        draw: {
          polygon: {
            allowIntersection: false,
            showArea: true,
            shapeOptions: {
              color: PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
              fillOpacity: 0.3,
            },
          },
          polyline: false,
          circle: false,
          rectangle: false,
          marker: false,
          circlemarker: false,
        },
        edit: {
          featureGroup: drawnItemsRef.current,
          remove: true,
        },
      });

      if (drawMode) {
        map.addControl(drawControlRef.current);
      }
    }

    // Handle draw created event
    const handleDrawCreated = async (e: L.LeafletEvent) => {
      const event = e as L.DrawEvents.Created;
      const layer = event.layer;
      const type = event.layerType;

      if (drawnItemsRef.current) {
        drawnItemsRef.current.addLayer(layer);
      }

      const geojson = layer.toGeoJSON();
      const name = prompt("Nhập tên khu vực:");
      if (!name) {
        if (drawnItemsRef.current) {
          drawnItemsRef.current.removeLayer(layer);
        }
        return;
      }

      let zoneType: "polygon" | "marker" | "circle" | "polyline" = "polygon";
      if (type === "marker") zoneType = "marker";
      else if (type === "rectangle") zoneType = "polygon";
      else if (type === "polyline") zoneType = "polyline";

      try {
        const color = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        await createCustomZone({
          name,
          color,
          type: zoneType,
          geojson: {
            type: "FeatureCollection",
            features: [geojson as GeoJSON.Feature],
          },
        });

        const zones = await getCustomZones();
        setCustomZones(zones);

        if (drawnItemsRef.current) {
          drawnItemsRef.current.removeLayer(layer);
        }
      } catch (error) {
        console.error("Error saving zone:", error);
      }
    };

    map.on(L.Draw.Event.CREATED, handleDrawCreated);

    return () => {
      map.off(L.Draw.Event.CREATED, handleDrawCreated);
    };
  }, [loading, drawMode]);

  const toggleLayer = (layer: keyof typeof layers) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  const toggleDrawMode = () => {
    setDrawMode((prev) => !prev);
  };

  const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const geojson = JSON.parse(text) as GeoJSON.FeatureCollection;

      if (!geojson.features || !Array.isArray(geojson.features)) {
        alert("Invalid GeoJSON file");
        return;
      }

      const namePrefix = prompt("Nhập tiền tố tên khu vực (ví dụ: 'Khu vực'):", "Khu vực") || "Khu vực";
      const count = await importGeoJSONZones(geojson, { namePrefix });

      alert(`Đã import ${count} khu vực!`);

      const zones = await getCustomZones();
      setCustomZones(zones);
    } catch (error) {
      console.error("Error importing GeoJSON:", error);
      alert("Lỗi khi import GeoJSON!");
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const handleDeleteZone = useCallback(async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa khu vực này?")) return;

    try {
      await deleteCustomZone(id);
      const zones = await getCustomZones();
      setCustomZones(zones);
    } catch (error) {
      console.error("Error deleting zone:", error);
    }
  }, []);

  const handleSaveField = async (id: string, label: string, value: string) => {
    try {
      const zone = customZones.find(z => z._id?.toString() === id);
      if (!zone) return;
      const updatedFields = [...(zone.custom_fields || []), { label, value }];
      await updateCustomZone(id, { custom_fields: updatedFields });
      setCustomZones(prev => prev.map(z => z._id?.toString() === id ? { ...z, custom_fields: updatedFields } : z) as any);
    } catch (e) {
      console.error(e);
      alert("Lỗi khi cập nhật!");
    }
  };

  const handleRemoveField = async (id: string, index: number) => {
    if (!confirm("Xóa trường thông tin này?")) return;
    try {
      const zone = customZones.find(z => z._id?.toString() === id);
      if (!zone) return;
      const updatedFields = (zone.custom_fields || []).filter((_, i) => i !== index);
      await updateCustomZone(id, { custom_fields: updatedFields });
      setCustomZones(prev => prev.map(z => z._id?.toString() === id ? { ...z, custom_fields: updatedFields } : z) as any);
    } catch (e) {
      console.error(e);
    }
  };

  // Get TDP center coordinates
  const getTDPCoords = useCallback((tdp: string | undefined): [number, number] | null => {
    if (!tdp) return null;
    const tdpNum = tdp.replace(/Tổ |Khu /gi, "").trim();
    if (TDP_COORDINATES[tdpNum]) {
      return TDP_COORDINATES[tdpNum];
    }
    // Special TDPs - assign random coords in Lien Chieu
    if (SPECIAL_TDPS.includes(tdp)) {
      return [16.0664 + (Math.random() - 0.5) * 0.02, 108.1408 + (Math.random() - 0.5) * 0.04];
    }
    return null;
  }, []);

  if (loading) {
    return (
      <div className="h-[calc(100vh-120px)] flex items-center justify-center bg-slate-100 rounded-xl">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
          <p className="text-slate-500">Đang tải bản đồ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Toggle Panel Button */}
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="absolute top-4 right-4 z-[1001] bg-white rounded-lg shadow-lg p-2 hover:bg-gray-100 transition-all"
        title={showPanel ? "Ẩn bảng điều khiển" : "Hiện bảng điều khiển"}
      >
        <i className={`fas ${showPanel ? "fa-chevron-right" : "fa-chevron-left"}`}></i>
      </button>

      {/* Collapsible Controls Panel */}
      {showPanel && (
        <div className="absolute top-4 right-10 z-[1000] bg-white rounded-lg shadow-lg p-3 w-56 transition-all text-slate-800">
          {/* Layers Section */}
          <div className="mb-3">
            <h4 className="text-xs font-bold text-gray-500 mb-2 flex items-center justify-between">
              LỚP BẢN ĐỒ
              <span className="text-[10px] font-normal text-gray-400">Layers</span>
            </h4>
            <div className="space-y-1">
              <button
                className={`w-full px-3 py-1.5 rounded text-xs flex items-center gap-2 ${layers.subjects ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-400"}`}
                onClick={() => toggleLayer("subjects")}
              >
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: "#ff5252" }}></span>
                Đối tượng
              </button>
              <button
                className={`w-full px-3 py-1.5 rounded text-xs flex items-center gap-2 ${layers.businesses ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-400"}`}
                onClick={() => toggleLayer("businesses")}
              >
                <span className="w-2.5 h-2.5 rounded" style={{ background: "#00e676" }}></span>
                CSKD
              </button>
              <button
                className={`w-full px-3 py-1.5 rounded text-xs flex items-center gap-2 ${layers.zones ? "bg-blue-100 text-blue-700" : "bg-gray-50 text-gray-400"}`}
                onClick={() => toggleLayer("zones")}
              >
                <span className="w-2.5 h-2.5 rounded border-2 border-purple-500"></span>
                Khu vực tùy chỉnh
              </button>
            </div>
          </div>

          {/* Drawing Tools */}
          <div className="mb-3 border-t pt-2 border-slate-200">
            <h4 className="text-xs font-bold text-gray-500 mb-2">CÔNG CỤ</h4>
            <div className="space-y-1">
              <button
                className={`w-full px-3 py-1.5 rounded text-xs flex items-center gap-2 ${drawMode ? "bg-purple-100 text-purple-700" : "bg-gray-50 text-gray-600"}`}
                onClick={toggleDrawMode}
              >
                <i className="fas fa-draw-polygon"></i>
                {drawMode ? "Tắt vẽ" : "Bật vẽ"}
              </button>
              <label className="w-full px-3 py-1.5 rounded text-xs flex items-center gap-2 bg-gray-50 text-gray-600 cursor-pointer hover:bg-gray-100">
                <i className="fas fa-file-import"></i>
                Import GeoJSON
                <input ref={fileInputRef} type="file" accept=".json,.geojson" onChange={handleFileUpload} className="hidden" />
              </label>
            </div>
          </div>

          {/* Saved Zones */}
          {customZones.length > 0 && (
            <div className="border-t pt-2 border-slate-200">
              <h4 className="text-xs font-bold text-gray-500 mb-2">
                KHU VỰC ({customZones.length})
              </h4>
              <div className="max-h-32 overflow-y-auto space-y-1">
                {customZones.map((zone: any) => (
                  <div key={zone._id?.toString()} className="flex items-center gap-1 px-1 py-0.5 hover:bg-gray-100 rounded text-xs text-slate-700">
                    <span className="w-2 h-2 rounded" style={{ backgroundColor: zone.color }}></span>
                    <span className="flex-1 truncate">{zone.name}</span>
                    <button onClick={() => zone._id && handleDeleteZone(zone._id.toString())} className="text-red-400 hover:text-red-600">
                      <i className="fas fa-times text-[10px]"></i>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend - Bottom Left, Compact */}
      <div className="absolute bottom-4 left-4 z-[1000] bg-white rounded-lg shadow-lg p-3 w-48 text-slate-800 border border-slate-200">
        <h4 className="font-semibold text-xs mb-2">Chú giải</h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors["Nghiện"] }}></span>
            <span>Nghiện</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors["Sử dụng"] }}></span>
            <span>Sử dụng</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors["Sau cai"] }}></span>
            <span>Sau cai</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full" style={{ background: statusColors["Khởi tố"] }}></span>
            <span>Khởi tố</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-slate-200 col-span-2">
            <span className="w-2.5 h-2.5 rounded" style={{ background: riskColors["Cao"] }}></span>
            <span>CSKD nguy cơ cao</span>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="h-[calc(100vh-120px)] rounded-xl overflow-hidden border border-slate-200">
        <MapContainer
          center={LIEN_CHIEU_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
            url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            subdomains={["mt0", "mt1", "mt2", "mt3"]}
            maxZoom={19}
          />
          <MapController />
          <FeatureGroup>
            {/* Draw control */}
          </FeatureGroup>

          {/* Custom Zones from Database */}
          {layers.zones &&
            customZones.map((zone: any) => (
              <GeoJSON
                key={zone._id?.toString()}
                data={zone.geojson}
                style={{
                  color: zone.displayColor || zone.color,
                  weight: 2,
                  fillOpacity: (zone.riskCount || 0) > 0 ? 0.35 : 0.15,
                }}
              >
                <Popup>
                  <ZonePopupComponent zone={zone} onSaveField={handleSaveField} onRemoveField={handleRemoveField} />
                </Popup>
              </GeoJSON>
            ))}

          {/* Subject Markers with Clustering */}
          {layers.subjects && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
              {subjects
                .filter((s) => s.lat && s.lng)
                .map((s) => (
                  <CircleMarker
                    key={s._id?.toString()}
                    center={[s.lat!, s.lng!]}
                    radius={8}
                    pathOptions={{
                      color: "#fff",
                      weight: 1.5,
                      fillColor: statusColors[s.status || ""] || "#8b949e",
                      fillOpacity: 0.85,
                    }}
                  >
                    <Popup>
                      <div className="text-sm">
                        <b>{s.full_name}</b>
                        <br />
                        Năm sinh: {s.yob} | {s.gender}
                        <br />
                        Tổ/DP: {s.tdp || "—"}
                        <br />
                        Loại MT: {(s.drug_types_used && s.drug_types_used.length > 0) ? s.drug_types_used.join(', ') : "Chưa rõ"}
                        <br />
                        Tình trạng: <span style={{ color: statusColors[s.status || ""] }}>{s.status}</span>
                        <br />
                        <small>{s.address_current || s.address_permanent}</small>
                      </div>
                    </Popup>
                  </CircleMarker>
                ))}
            </MarkerClusterGroup>
          )}

          {/* Business Markers with Clustering */}
          {layers.businesses && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
              {businesses
              .filter((b) => b.lat && b.lng)
              .map((b) => {
                const color = riskColors[b.risk_level || "Thấp"] || "#8b949e";
                const icon = L.divIcon({
                  className: "",
                  html: `<div style="width:24px;height:24px;background:${color};border:2px solid #fff;border-radius:5px;display:flex;align-items:center;justify-content:center;"><i class="fas fa-store" style="color:#fff;font-size:10px;"></i></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                });
                return (
                  <Marker
                    key={b._id?.toString()}
                    position={[b.lat!, b.lng!]}
                    icon={icon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <b>{b.name}</b>
                        <br />
                        Loại: {b.business_type} | Nguy cơ: <span style={{ color }}>{b.risk_level}</span>
                        <br />
                        <small>{b.address}</small>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </MarkerClusterGroup>
          )}

          {/* Drug Density Zones - Auto calculated based on subject count per TDP */}
        </MapContainer>
      </div>

      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}