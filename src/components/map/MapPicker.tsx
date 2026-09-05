"use client";

import { useState, useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin, Navigation, Check, X, RotateCcw, Crosshair } from "lucide-react";

const DEFAULT_CENTER: [number, number] = [16.0664, 108.1408]; // Phường Liên Chiểu

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
}

function LocationMarker({
  position,
  setPosition,
}: {
  position: L.LatLng | null;
  setPosition: (p: L.LatLng) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  const eventHandlers = {
    dragend() {
      const marker = markerRef.current;
      if (marker != null) {
        setPosition(marker.getLatLng());
      }
    },
  };

  return position === null ? null : (
    <Marker
      draggable={true}
      eventHandlers={eventHandlers}
      position={position}
      ref={markerRef}
    />
  );
}

export default function MapPicker({
  initialLat,
  initialLng,
  title = "Chọn vị trí trên bản đồ",
  subtitle = "Click vào bản đồ hoặc kéo marker để định vị tọa độ chính xác",
  onSelect,
  onClose,
}: {
  initialLat?: number;
  initialLng?: number;
  title?: string;
  subtitle?: string;
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng && !isNaN(initialLat) && !isNaN(initialLng) && initialLat !== 0
      ? new L.LatLng(initialLat, initialLng)
      : null
  );

  // Fix Leaflet marker icons
  useEffect(() => {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
  }, []);

  const handleGetCurrentLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
        },
        (err) => {
          alert("Không thể lấy vị trí hiện tại: " + err.message);
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Trình duyệt không hỗ trợ Geolocation.");
    }
  };

  const handleResetToDefault = () => {
    setPosition(new L.LatLng(DEFAULT_CENTER[0], DEFAULT_CENTER[1]));
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-cyan-500/30 rounded-2xl shadow-2xl shadow-cyan-950/60 w-full max-w-4xl overflow-hidden flex flex-col h-[90vh] sm:h-[82vh] text-slate-100">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base text-white tracking-wide">{title}</h3>
              <p className="text-[11px] sm:text-xs text-slate-400">{subtitle}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Map Container */}
        <div className="flex-1 relative bg-slate-950">
          <MapContainer
            center={position || DEFAULT_CENTER}
            zoom={position ? 16 : 14}
            style={{ height: "100%", width: "100%" }}
          >
            <MapController center={position ? [position.lat, position.lng] : DEFAULT_CENTER} />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>

          {/* Quick Action Floating Controls */}
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2">
            <button
              type="button"
              onClick={handleGetCurrentLocation}
              className="bg-slate-900/90 backdrop-blur border border-slate-700 text-cyan-400 hover:text-cyan-300 hover:bg-slate-800 p-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transition"
              title="Lấy vị trí GPS hiện tại"
            >
              <Navigation className="w-4 h-4" />
              <span className="hidden sm:inline">GPS của tôi</span>
            </button>
            <button
              type="button"
              onClick={handleResetToDefault}
              className="bg-slate-900/90 backdrop-blur border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800 p-2.5 rounded-xl shadow-lg text-xs font-semibold flex items-center gap-2 transition"
              title="Đưa về trung tâm Liên Chiểu"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Về trung tâm</span>
            </button>
          </div>

          {/* Map Helper Badge */}
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] text-slate-300 shadow-lg flex items-center gap-2">
            <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Click bản đồ hoặc kéo marker để chỉnh tọa độ</span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Tọa độ đã chọn:</span>
            {position ? (
              <span className="font-mono text-xs font-bold text-cyan-400 bg-cyan-950/60 border border-cyan-800/60 px-2.5 py-1 rounded-md">
                {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </span>
            ) : (
              <span className="text-xs text-amber-400 italic font-medium">Chưa có vị trí nào được chọn</span>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
            >
              Hủy bỏ
            </button>
            <button
              type="button"
              onClick={() => {
                if (position) {
                  onSelect(position.lat, position.lng);
                }
              }}
              disabled={!position}
              className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-900/40 flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              Xác nhận tọa độ
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
