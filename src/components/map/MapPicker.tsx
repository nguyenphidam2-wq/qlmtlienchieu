"use client";

import { useState, useEffect } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER: [number, number] = [16.0664, 108.1408]; // Lien Chieu

function LocationMarker({ position, setPosition }: { position: L.LatLng | null; setPosition: (p: L.LatLng) => void }) {
  useMapEvents({
    click(e) {
      setPosition(e.latlng);
    },
  });

  return position === null ? null : (
    <Marker position={position}></Marker>
  );
}

export default function MapPicker({
  initialLat,
  initialLng,
  onSelect,
  onClose,
}: {
  initialLat?: number;
  initialLng?: number;
  onSelect: (lat: number, lng: number) => void;
  onClose: () => void;
}) {
  const [position, setPosition] = useState<L.LatLng | null>(
    initialLat && initialLng ? new L.LatLng(initialLat, initialLng) : null
  );

  // Fix Leaflet icons
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
      navigator.geolocation.getCurrentPosition((pos) => {
        setPosition(new L.LatLng(pos.coords.latitude, pos.coords.longitude));
      });
    } else {
      alert("Trình duyệt không hỗ trợ Geolocation.");
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <h3 className="font-bold text-slate-800">Chọn vị trí trên bản đồ</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-red-500 font-bold p-2">✕ Đóng</button>
        </div>
        
        <div className="flex-1 relative">
          <MapContainer
            center={position || DEFAULT_CENTER}
            zoom={15}
            style={{ height: "100%", width: "100%" }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
              url="https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
              subdomains={["mt0", "mt1", "mt2", "mt3"]}
              maxZoom={20}
            />
            <LocationMarker position={position} setPosition={setPosition} />
          </MapContainer>
          
          <button
            onClick={handleGetCurrentLocation}
            className="absolute bottom-6 left-4 z-[1000] bg-white text-blue-600 px-4 py-2 rounded-lg shadow-lg border border-slate-200 text-sm font-medium hover:bg-blue-50"
          >
            📍 Lấy vị trí tôi đang đứng
          </button>
        </div>
        
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="text-sm text-slate-600">
            {position ? `Đã chọn: ${position.lat.toFixed(6)}, ${position.lng.toFixed(6)}` : "Vui lòng click vào bản đồ để chọn tọa độ"}
          </div>
          <button
            onClick={() => {
              if (position) onSelect(position.lat, position.lng);
            }}
            disabled={!position}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700"
          >
            Xác nhận tọa độ
          </button>
        </div>
      </div>
    </div>
  );
}
