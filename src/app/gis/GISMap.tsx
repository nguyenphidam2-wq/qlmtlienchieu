"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap, GeoJSON, FeatureGroup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "@geoman-io/leaflet-geoman-free";
import "@geoman-io/leaflet-geoman-free/dist/leaflet-geoman.css";
import { getSubjects, getCurrentUserInfo } from "@/lib/actions/subjects";
import { getBusinesses } from "@/lib/actions/businesses";
import { getCustomZones, createCustomZone, deleteCustomZone, importGeoJSONZones, updateCustomZone } from "@/lib/actions/zones";
import { getTDPById, updateTDP, getTDPs } from "@/lib/actions/tdp";
import { getPCCCRecords } from "@/lib/actions/pccc";
import { ISubject, IBusiness, ICustomZone, ITDP } from "@/lib/models";
import { IPCCCRecord } from "@/lib/models/PCCC";
import MarkerClusterGroup from "react-leaflet-cluster";
import * as turf from "@turf/turf";
import { PenTool, X, CheckCircle2 } from "lucide-react";

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

function ZonePopupComponent({ 
  zone, 
  onSaveField, 
  onRemoveField,
  onChangeColor,
  currentUser
}: { 
  zone: any, 
  onSaveField: any, 
  onRemoveField: any,
  onChangeColor: (id: string, color: string) => void,
  currentUser: any
}) {
  const [newLabel, setNewLabel] = useState("");
  const [newValue, setNewValue] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  // Extract population from custom fields if available
  const populationField = zone.custom_fields?.find((f: any) => f.label.toLowerCase().includes("nhân khẩu") || f.label.toLowerCase().includes("dân số"));
  const population = populationField ? populationField.value : "Chưa cập nhật";

  const canEditColor = currentUser?.role === "admin" || currentUser?.role === "leader";

  return (
    <div className="text-sm min-w-[260px] p-1">
      <div className="flex items-center gap-2 mb-2 border-b border-slate-100 pb-2">
        <div className="w-4 h-4 rounded shadow-inner" style={{ backgroundColor: zone.color }}></div>
        <b className="text-base text-slate-800">{zone.name}</b>
      </div>

      <div className="space-y-2.5">
        {/* Core Stats */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-blue-50/50 p-2 rounded-lg border border-blue-100/50">
            <span className="text-[10px] uppercase font-bold text-blue-400 block leading-none mb-1">Nhân khẩu</span>
            <span className="text-blue-700 font-bold">{population}</span>
          </div>
          <div className="bg-purple-50/50 p-2 rounded-lg border border-purple-100/50">
            <span className="text-[10px] uppercase font-bold text-purple-400 block leading-none mb-1">Diện tích</span>
            <span className="text-purple-700 font-bold">{(zone.areaSqm / 10000).toFixed(2)} <small>ha</small></span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <div className="bg-red-50/50 p-2 rounded-lg border border-red-100/50 flex justify-between items-center">
            <span className="text-[10px] uppercase font-bold text-red-400 block leading-none">Đối tượng ma túy</span>
            <span className="text-red-700 font-black text-base">{zone.riskCount || 0}</span>
          </div>
        </div>

        {/* Business List */}
        {zone.businessList && zone.businessList.length > 0 && (
          <div className="mt-3">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <i className="fas fa-store"></i> Danh sách cơ sở ({zone.businessList.length})
            </h4>
            <div className="max-h-24 overflow-y-auto pr-1 space-y-1 custom-scrollbar">
              {zone.businessList.map((b: string, i: number) => (
                <div key={i} className="text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded border border-slate-100">
                  {b}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Color Picker Section - Moved to bottom for visibility */}
        {canEditColor && (
          <div className="mt-4 pt-3 border-t-2 border-blue-100 bg-blue-50/30 p-2 rounded-xl">
            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
              <i className="fas fa-palette"></i> Phân loại mức độ (Chỉ Lãnh đạo)
            </h4>
            <div className="flex justify-around items-center">
              {Object.entries(drugZoneColors).map(([name, color]) => (
                <button
                  key={name}
                  onClick={() => onChangeColor(zone._id.toString(), color)}
                  className={`w-10 h-10 rounded-full border-4 shadow-md transition-all hover:scale-110 active:scale-90 ${zone.color === color ? 'border-slate-800 ring-4 ring-slate-200' : 'border-white'}`}
                  style={{ backgroundColor: color }}
                  title={`Đổi sang màu ${name}`}
                />
              ))}
            </div>
          </div>
        )}

        {/* Custom Fields Section */}
        <div className="mt-3 pt-3 border-t border-slate-100">
           <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Thông tin bổ sung</h4>
           {zone.custom_fields && zone.custom_fields.filter((f: any) => f !== populationField).map((f: any, i: number) => (
             <div key={i} className="flex justify-between items-start group py-1.5 text-xs border-b border-slate-50 last:border-0">
               <span className="text-slate-500 font-medium whitespace-nowrap">{f.label}:</span>
               <strong className="text-slate-800 ml-2 flex-1 text-right break-words">{f.value}</strong>
               <button onClick={() => onRemoveField(zone._id?.toString(), i)} className="opacity-0 group-hover:opacity-100 text-red-400 ml-2 hover:text-red-600 transition-opacity" title="Xóa">✕</button>
             </div>
           ))}

           {isAdding ? (
             <div className="mt-2 bg-slate-50 p-2 rounded-xl border border-slate-200 shadow-inner">
               <input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Tên trường (VD: Số hộ)" className="w-full text-xs p-2 mb-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
               <input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="Nội dung (VD: 345)" className="w-full text-xs p-2 mb-2 border border-slate-200 rounded-lg outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-100" />
               <div className="flex gap-2">
                 <button onClick={() => { onSaveField(zone._id?.toString(), newLabel, newValue); setIsAdding(false); setNewLabel(""); setNewValue(""); }} disabled={!newLabel || !newValue} className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-bold shadow-md shadow-blue-100 disabled:opacity-50 hover:bg-blue-700 transition-all active:scale-95">Lưu</button>
                 <button onClick={() => setIsAdding(false)} className="flex-1 bg-white text-slate-600 py-2 rounded-lg text-xs font-bold border border-slate-200 hover:bg-slate-50 transition-all">Hủy</button>
               </div>
             </div>
           ) : (
             <button onClick={() => setIsAdding(true)} className="w-full mt-2 text-[11px] text-blue-600 bg-blue-50/50 hover:bg-blue-50 py-2 rounded-lg font-bold border border-blue-100/50 transition-all flex items-center justify-center gap-1.5 shadow-sm">
               <i className="fas fa-plus-circle text-xs"></i> Thêm thông tin
             </button>
           )}
        </div>
        
        {/* Debug Role */}
        <div className="mt-4 text-[9px] text-slate-300 italic text-center border-t border-slate-50 pt-2">
          KIỂM TRA QUYỀN: {currentUser?.role || "Không xác định"}
        </div>
      </div>
    </div>
  );
}

import { useSearchParams } from "next/navigation";

export function GISMap() {
  const searchParams = useSearchParams();
  const [subjects, setSubjects] = useState<ISubject[]>([]);
  const [businesses, setBusinesses] = useState<IBusiness[]>([]);
  const [customZones, setCustomZones] = useState<ICustomZone[]>([]);
  const [tdps, setTdps] = useState<ITDP[]>([]);
  const [pcccRecords, setPcccRecords] = useState<IPCCCRecord[]>([]);
  const [currentUser, setCurrentUser] = useState<{ id: string; username: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetTdp, setTargetTdp] = useState<any>(null); // For UI feedback when drawing
  const [lastDrawnLayer, setLastDrawnLayer] = useState<L.Layer | null>(null); // To store the layer before manual save
  const [saving, setSaving] = useState(false);

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const user = await getCurrentUserInfo();
      setCurrentUser(user);
    };
    fetchUser();
  }, []);

  // Derived states from searchParams
  const layers = {
    subjects: searchParams.get("subjects") !== "false",
    businesses: searchParams.get("businesses") !== "false",
    zones: searchParams.get("zones") !== "false",
    pccc: searchParams.get("pccc") === "true",
  };
  const drawMode = searchParams.get("draw") === "true";
  const selectedZoneId = searchParams.get("zoneId");
  const neutralMode = searchParams.get("neutral") === "true";
  const drawTdpId = searchParams.get("drawTdpId");

  // Fetch target TDP info if drawing
  useEffect(() => {
    if (drawTdpId) {
      getTDPById(drawTdpId).then(data => setTargetTdp(data));
    } else {
      setTargetTdp(null);
    }
  }, [drawTdpId]);

  const [legendOpen, setLegendOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const drawnItemsRef = useRef<L.FeatureGroup | null>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Zoom to selected zone effect
  useEffect(() => {
    if (selectedZoneId && mapRef.current && customZones.length > 0) {
      const zone = customZones.find(z => z._id?.toString() === selectedZoneId);
      if (zone && zone.geojson) {
        const bbox = turf.bbox(zone.geojson);
        mapRef.current.fitBounds([[bbox[1], bbox[0]], [bbox[3], bbox[2]]], { padding: [50, 50] });
      }
    }
  }, [selectedZoneId, customZones]);

  // Listen for custom "trigger-import" event from sidebar
  useEffect(() => {
    const handleTriggerImport = () => {
      fileInputRef.current?.click();
    };
    window.addEventListener("trigger-gis-import", handleTriggerImport);
    return () => window.removeEventListener("trigger-gis-import", handleTriggerImport);
  }, []);

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [subjectsData, businessesData, zonesData, pcccData, tdpsData] = await Promise.all([
          getSubjects(),
          getBusinesses(),
          getCustomZones(),
          getPCCCRecords(),
          getTDPs(),
        ]);
        setSubjects(subjectsData);
        setBusinesses(businessesData);
        setPcccRecords(pcccData);
        setTdps(tdpsData);
        
        // Preparation for Point-In-Polygon calculation
        const subjectPoints = turf.featureCollection(
          subjectsData.filter(s => s.lat && s.lng).map(s => turf.point([s.lng!, s.lat!]))
        );
        const businessPoints = turf.featureCollection(
          businessesData.filter(b => b.lat && b.lng).map(b => {
            const p = turf.point([b.lng!, b.lat!]);
            p.properties = { name: b.name };
            return p;
          })
        );

        const enrichedZones = zonesData.map((zone) => {
          if (zone.type === "polygon" && zone.geojson?.features) {
            let riskCount = 0;
            let totalArea = 0;
            let zoneBusinessList: string[] = [];

            zone.geojson.features.forEach((f: any) => {
              if (f.geometry.type === "Polygon" || f.geometry.type === "MultiPolygon") {
                // Count subjects within
                const subjectsWithin = turf.pointsWithinPolygon(subjectPoints, f);
                riskCount += subjectsWithin.features.length;

                // Find businesses within
                const businessesWithin = turf.pointsWithinPolygon(businessPoints, f);
                businessesWithin.features.forEach(feat => {
                  if (feat.properties?.name) zoneBusinessList.push(feat.properties.name);
                });

                try {
                  totalArea += turf.area(f);
                } catch(e) {}
              }
            });

            return { 
              ...zone, 
              riskCount, 
              displayColor: zone.color, // Sử dụng màu gốc từ DB, không tự động đổi theo riskCount
              areaSqm: totalArea,
              businessList: Array.from(new Set(zoneBusinessList)) // Unique list
            };
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




  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  // Initialize Geoman draw control and snapping after map loads
  useEffect(() => {
    if (loading || !mapRef.current) return;

    const map = mapRef.current;

    // Initialize drawn items layer
    if (!drawnItemsRef.current) {
      drawnItemsRef.current = new L.FeatureGroup();
      map.addLayer(drawnItemsRef.current);
    }

    // Configure Geoman global options for advanced editing and snapping
    map.pm.setGlobalOptions({
      layerGroup: drawnItemsRef.current,
      snappable: true,
      snapDistance: 20, // Snap when within 20 pixels of another vertex/edge
      snapSegment: true, // Allow snapping to the middle of segments (centerlines)
      allowSelfIntersection: false,
      hintlineStyle: { color: '#3388ff', dashArray: '5,5' },
      templineStyle: { color: '#3388ff' }
    });

    // We don't add the default Geoman toolbar because we use our custom sidebar button
    // But we still need to set up the global language or specific settings if needed.
    map.pm.setLang('vi'); // Try to set Vietnamese if supported, otherwise defaults to en

    // Handle draw/edit modes based on sidebar state or drawTdpId
    if (drawMode || drawTdpId) {
      // Ensure map is ready before enabling draw
      const timer = setTimeout(() => {
        map.pm.enableDraw('Polygon', {
          snappable: true,
          snapDistance: 20,
          finishOn: 'dblclick',
          pathOptions: {
            color: targetTdp?.color || PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)],
            fillOpacity: 0.4,
            weight: 3,
            dashArray: '5, 10'
          }
        });
        
        // Disable other layers' popups during drawing to avoid distraction
        map.eachLayer((l: any) => {
          if (l.closePopup) l.off('click');
        });
      }, 500);
      
      return () => clearTimeout(timer);
    } else {
      map.pm.disableDraw();
    }

    // Handle draw created event (Geoman uses pm:create)
    const handleDrawCreated = async (e: any) => {
      const layer = e.layer;
      const shape = e.shape; // e.g., 'Polygon', 'Marker'

      if (drawnItemsRef.current && shape === 'Polygon') {
        // layer is automatically added to drawnItemsRef by Geoman because of setGlobalOptions
      }

      const geojson = layer.toGeoJSON();
      
       if (drawTdpId) {
          // Instead of auto-saving, we keep the layer and show the Save button
          setLastDrawnLayer(layer);
          return;
       }

      const name = prompt("Nhập tên khu vực (Tổ dân phố):");
      if (!name) {
        if (drawnItemsRef.current) drawnItemsRef.current.removeLayer(layer);
        map.removeLayer(layer);
        return;
      }

      let zoneType: "polygon" | "marker" | "circle" | "polyline" = "polygon";
      if (shape === "Marker") zoneType = "marker";
      else if (shape === "Line") zoneType = "polyline";

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

        // Remove the temporary drawn layer since it will be re-rendered from the DB
        if (drawnItemsRef.current) drawnItemsRef.current.removeLayer(layer);
        map.removeLayer(layer);
      } catch (error) {
        console.error("Error saving zone:", error);
      }
    };

    map.on('pm:create', handleDrawCreated);

    return () => {
      map.off('pm:create', handleDrawCreated);
    };
  }, [loading, drawMode, drawTdpId, targetTdp]);



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

  const handleChangeColor = async (id: string, color: string) => {
    try {
      await updateCustomZone(id, { color });
      setCustomZones(prev => prev.map(z => z._id?.toString() === id ? { ...z, color, displayColor: color } : z) as any);
    } catch (e) {
      console.error("Error updating color:", e);
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
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileUpload} 
        className="hidden" 
        accept=".geojson,.json"
      />



      {/* Legend - Bottom Left, Compact & Collapsible */}
      <div className={`absolute bottom-8 right-8 z-[1000] transition-all duration-300 ${legendOpen ? 'w-56' : 'w-12'}`}>
        {legendOpen ? (
          <div className="bg-slate-900/60 backdrop-blur-xl rounded-3xl shadow-2xl p-5 text-white border border-white/10 animate-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-black text-[10px] uppercase tracking-widest text-slate-400">Chú giải lớp dữ liệu</h4>
              <button 
                onClick={() => setLegendOpen(false)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white/60 transition-colors"
              >
                <i className="fas fa-times text-[10px]"></i>
              </button>
            </div>
            <div className="grid grid-cols-1 gap-y-3 text-[11px] font-bold">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,82,82,0.4)]" style={{ background: statusColors["Nghiện"] }}></span>
                <span className="text-slate-200">Đối tượng Nghiện</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(255,179,0,0.4)]" style={{ background: statusColors["Sử dụng"] }}></span>
                <span className="text-slate-200">Đối tượng Sử dụng</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(0,230,118,0.4)]" style={{ background: statusColors["Sau cai"] }}></span>
                <span className="text-slate-200">Đối tượng Sau cai</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full shadow-[0_0_8px_rgba(206,147,216,0.4)]" style={{ background: statusColors["Khởi tố"] }}></span>
                <span className="text-slate-200">Đối tượng Khởi tố</span>
              </div>
              <div className="mt-2 pt-3 border-t border-white/10">
                <div className="flex items-center gap-3">
                  <span className="w-3.5 h-3.5 rounded-sm shadow-[0_0_8px_rgba(255,82,82,0.4)]" style={{ background: riskColors["Cao"] }}></span>
                  <span className="text-slate-200 text-[10px] uppercase tracking-tighter">CSKD nguy cơ cao</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <button 
            onClick={() => setLegendOpen(true)}
            className="w-12 h-12 bg-slate-900/60 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/10 flex items-center justify-center text-blue-400 hover:bg-slate-800 transition-all active:scale-90"
            title="Xem chú giải"
          >
            <i className="fas fa-layer-group text-lg"></i>
          </button>
        )}
      </div>

      {/* Drawing Mode Overlay */}
      {drawTdpId && targetTdp && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-[2000] animate-in slide-in-from-top-4 duration-500">
          <div className="bg-slate-900/80 backdrop-blur-xl px-6 py-4 rounded-3xl border border-blue-500/30 shadow-2xl flex items-center gap-4">
            <div className="w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center animate-pulse">
              <PenTool className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="text-white font-black text-sm uppercase tracking-tight leading-none mb-1">Đang vẽ ranh giới</h3>
              <p className="text-blue-400 text-[11px] font-bold uppercase tracking-widest">{targetTdp.name}</p>
            </div>
            <div className="h-8 w-px bg-white/10 mx-2"></div>
            <div className="text-[11px] text-slate-300 font-bold bg-blue-500/10 px-3 py-2 rounded-xl border border-blue-500/20">
              <span className="text-blue-400">HƯỚNG DẪN:</span> Click các điểm để tạo vùng. 
              <br />
              <span className="text-yellow-400 underline decoration-yellow-500/50 underline-offset-4">Click lại ĐIỂM ĐẦU TIÊN để HOÀN TẤT & LƯU TỰ ĐỘNG.</span>
            </div>
            <div className="flex gap-2">
              <button 
                onClick={async () => {
                  if (!drawTdpId) return;
                  
                  let layerToSave = lastDrawnLayer;
                  
                  // If no lastDrawnLayer, check if currently drawing and try to finish it
                  if (!layerToSave && mapRef.current) {
                    const map = mapRef.current;
                    // @ts-ignore - Accessing internal Geoman Draw instance to finish shape
                    if (map.pm.Draw.Polygon._shape) {
                       // @ts-ignore
                       map.pm.Draw.Polygon._finishShape();
                       // The pm:create event should have fired now and set lastDrawnLayer
                       // But since state update is async, we might need to grab it directly if possible
                       // or wait a tiny bit. Let's try to grab from drawnItemsRef
                       if (drawnItemsRef.current) {
                         const layers = drawnItemsRef.current.getLayers();
                         if (layers.length > 0) layerToSave = layers[layers.length - 1];
                       }
                    }
                  }

                  if (!layerToSave) {
                    alert("Vui lòng vẽ ít nhất 3 điểm trên bản đồ trước khi lưu!");
                    return;
                  }

                  setSaving(true);
                  try {
                    // @ts-ignore
                    const geojson = layerToSave.toGeoJSON();
                    await updateTDP(drawTdpId, {
                      geojson: {
                        type: "FeatureCollection",
                        features: [geojson as GeoJSON.Feature],
                      }
                    });
                    alert("Đã cập nhật tọa độ cho " + targetTdp?.name + " thành công!");
                    window.location.href = '/tdp';
                  } catch (e) {
                    console.error(e);
                    alert("Lỗi khi lưu!");
                  } finally {
                    setSaving(false);
                  }
                }}
                disabled={saving}
                className={`px-6 py-2 ${lastDrawnLayer ? 'bg-emerald-500 hover:bg-emerald-600 animate-bounce' : 'bg-blue-600 hover:bg-blue-700'} text-white text-xs font-black rounded-xl transition-all shadow-lg flex items-center gap-2 disabled:opacity-50`}
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div>
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                XÁC NHẬN & LƯU VÙNG
              </button>

              {!lastDrawnLayer && (
                <button 
                  onClick={() => {
                    if (mapRef.current) {
                      mapRef.current.pm.enableDraw('Polygon', {
                        snappable: true,
                        snapDistance: 20,
                        pathOptions: {
                          color: targetTdp?.color || '#3388ff',
                          fillOpacity: 0.4,
                        }
                      });
                    }
                  }}
                  className="px-3 py-2 bg-white/5 hover:bg-white/10 text-white/60 text-[10px] font-bold rounded-xl transition-all border border-white/10"
                >
                  Kích hoạt lại bút
                </button>
              )}
              
              <button 
                onClick={() => window.location.href = '/tdp'}
                className="p-2 bg-white/5 hover:bg-red-500/20 text-white/50 hover:text-red-400 rounded-xl transition-all"
                title="Hủy vẽ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Map */}
      <div className="h-screen w-full">
        <MapContainer
          center={LIEN_CHIEU_CENTER}
          zoom={DEFAULT_ZOOM}
          style={{ height: "100%", width: "100%" }}
          ref={mapRef}
          zoomControl={false}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url={neutralMode 
              ? "https://{s}.basemaps.cartocdn.com/rastertiles/light_all/{z}/{x}/{y}{r}.png"
              : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            }
            subdomains={["a", "b", "c", "d"]}
            maxZoom={19}
          />
          <MapController />
          <FeatureGroup>
            {/* Draw control */}
          </FeatureGroup>

          {/* TDP Zones from Database */}
          {layers.zones &&
            tdps.filter(t => t.geojson).map((tdp: any) => {
              const isSelected = selectedZoneId === tdp._id?.toString() || drawTdpId === tdp._id?.toString();
              return (
                <GeoJSON
                  key={tdp._id?.toString() + (isSelected ? '-selected' : '')}
                  data={tdp.geojson}
                  style={{
                    color: isSelected ? '#eab308' : (tdp.color || '#3388ff'),
                    weight: isSelected ? 4 : 2,
                    fillOpacity: isSelected ? 0.5 : 0.2,
                    className: isSelected ? 'animate-pulse' : ''
                  }}
                >
                  <Popup>
                    <div className="p-2 min-w-[200px]">
                       <div className="flex items-center gap-2 mb-2 border-b pb-1">
                         <div className="w-3 h-3 rounded" style={{ backgroundColor: tdp.color }}></div>
                         <b className="text-slate-800">{tdp.name}</b>
                       </div>
                       <div className="space-y-1 text-xs">
                          <p><b>Số hộ:</b> {tdp.households || "—"}</p>
                          <p><b>Nhân khẩu:</b> {tdp.population || "—"}</p>
                          <p><b>Diện tích:</b> {tdp.area_sqm ? (tdp.area_sqm).toLocaleString() + " m²" : "—"}</p>
                          <p><b>Phân loại:</b> 
                            <span className={`ml-2 px-2 py-0.5 rounded-full font-bold ${
                              tdp.risk_status === 'red' ? 'bg-red-100 text-red-600' : 
                              tdp.risk_status === 'yellow' ? 'bg-yellow-100 text-yellow-600' : 
                              'bg-green-100 text-green-600'
                            }`}>
                              {tdp.risk_status === 'red' ? 'Vùng Đỏ' : tdp.risk_status === 'yellow' ? 'Vùng Vàng' : 'Vùng Xanh'}
                            </span>
                          </p>
                       </div>
                    </div>
                  </Popup>
                </GeoJSON>
              );
            })}

          {/* Custom Zones from Database */}
          {layers.zones &&
            customZones.map((zone: any) => {
              const isSelected = selectedZoneId === zone._id?.toString();
              return (
                <GeoJSON
                  key={zone._id?.toString() + (isSelected ? '-selected' : '')}
                  data={zone.geojson}
                  style={{
                    color: isSelected ? '#eab308' : (zone.displayColor || zone.color),
                    weight: isSelected ? 4 : 2,
                    fillOpacity: isSelected ? 0.5 : ((zone.riskCount || 0) > 0 ? 0.35 : 0.15),
                    className: isSelected ? 'animate-pulse shadow-2xl' : ''
                  }}
                  eventHandlers={{
                    add: (e) => {
                      if (isSelected) {
                        e.target.bringToFront();
                      }
                    }
                  }}
                >
                  <Popup>
                    <ZonePopupComponent 
                      zone={zone} 
                      onSaveField={handleSaveField} 
                      onRemoveField={handleRemoveField}
                      onChangeColor={handleChangeColor}
                      currentUser={currentUser}
                    />
                  </Popup>
                </GeoJSON>
              );
            })}

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

          {/* PCCC Markers */}
          {layers.pccc && (
            <MarkerClusterGroup chunkedLoading maxClusterRadius={30}>
              {pcccRecords
              .filter((p) => p.lat && p.lng)
              .map((p) => {
                const icon = L.divIcon({
                  className: "",
                  html: `<div style="width:24px;height:24px;background:#f97316;border:2px solid #fff;border-radius:50%;display:flex;align-items:center;justify-content:center;"><i class="fas fa-fire-extinguisher" style="color:#fff;font-size:10px;"></i></div>`,
                  iconSize: [24, 24],
                  iconAnchor: [12, 12],
                });
                return (
                  <Marker
                    key={p._id?.toString()}
                    position={[p.lat!, p.lng!]}
                    icon={icon}
                  >
                    <Popup>
                      <div className="text-sm">
                        <b className="text-orange-600">{p.name}</b>
                        <br />
                        Loại: {p.type === "hydrant" ? "Trụ nước" : p.type === "building" ? "Công trình" : "Thiết bị"}
                        <br />
                        Trạng thái: <span className={p.status === "active" ? "text-green-600 font-bold" : "text-red-600"}>
                          {p.status === "active" ? "Hoạt động" : "Bảo trì"}
                        </span>
                        <br />
                        <small>{p.address}</small>
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

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1;
        }
      `}</style>
      <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" />
    </div>
  );
}