import * as turf from '@turf/turf';

export interface TDPItem {
  _id?: any;
  name: string;
  center?: [number, number]; // [lat, lng]
  geojson?: any;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  matchedTdpName: string;
  isSpecificAddress: boolean;
}

/**
 * Remove Vietnamese accents for robust string matching
 */
export function removeVietnameseAccents(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase();
}

/**
 * Standardize & match TDP Name from address string
 */
export function extractAndNormalizeTDPName(address: string, tdpList: TDPItem[]): TDPItem | null {
  if (!address) return null;

  const cleanAddr = address.trim().toLowerCase();
  const unaccentAddr = removeVietnameseAccents(cleanAddr);

  // 1. Named Area Keyword Mappings
  const namedAreaRules: { pattern: RegExp; searchNames: string[] }[] = [
    { pattern: /vân\s*dương\s*1|van\s*duong\s*1/i, searchNames: ["Tổ dân phố Vân Dương 1"] },
    { pattern: /vân\s*dương\s*2|van\s*duong\s*2/i, searchNames: ["Tổ dân phố Vân Dương 2"] },
    { pattern: /quan\s*nam\s*1/i, searchNames: ["Tổ dân phố Quan Nam 1"] },
    { pattern: /quan\s*nam\s*2/i, searchNames: ["Tổ dân phố Quan Nam 2"] },
    { pattern: /quan\s*nam\s*3|quan\s*nam\s*6/i, searchNames: ["Tổ dân phố Quan Nam 3"] },
    { pattern: /quan\s*nam\s*4/i, searchNames: ["Tổ dân phố Quan Nam 4"] },
    { pattern: /quan\s*nam\s*5/i, searchNames: ["Tổ dân phố Quan Nam 5"] },
    { pattern: /hưởng\s*phước|huong\s*phuoc/i, searchNames: ["Tổ dân phố Hưởng Phước"] },
    { pattern: /tân\s*ninh|tan\s*ninh|hiền\s*tân|hiền\s*phước|tân\s*hiền/i, searchNames: ["Tổ dân phố Tân Hiền"] },
    { pattern: /trung\s*sơn|trung\s*son|hồng\s*phước/i, searchNames: ["Tổ dân phố Trung Sơn - Hồng Phước"] },
    { pattern: /chung\s*cư|17\s*-\s*cc|17-cc/i, searchNames: ["Tổ dân phố Chung Cư 1"] },
    { pattern: /quang\s*thành\s*1/i, searchNames: ["Tổ dân phố Quang Thành 1"] },
    { pattern: /quang\s*thành\s*2/i, searchNames: ["Tổ dân phố Quang Thành 2"] },
    { pattern: /quang\s*thành\s*3/i, searchNames: ["Tổ dân phố Quang Thành 3"] },
    { pattern: /quang\s*thành\s*4/i, searchNames: ["Tổ dân phố Quang Thành 4"] },
    { pattern: /quang\s*thành\s*5/i, searchNames: ["Tổ dân phố Quang Thành 5"] },
    { pattern: /quang\s*thành\s*6/i, searchNames: ["Tổ dân phố Quang Thành 6"] },
    { pattern: /quang\s*thành\s*7/i, searchNames: ["Tổ dân phố Quang Thành 7"] },
    { pattern: /quang\s*thành\s*8/i, searchNames: ["Tổ dân phố Quang Thành 8"] },
    { pattern: /quang\s*thành\s*9/i, searchNames: ["Tổ dân phố Quang Thành 9"] },
    { pattern: /đa\s*phước\s*1/i, searchNames: ["Tổ dân phố Đa Phước 1"] },
    { pattern: /đa\s*phước\s*2/i, searchNames: ["Tổ dân phố Đa Phước 2"] },
    { pattern: /đa\s*phước\s*3/i, searchNames: ["Tổ dân phố Đa Phước 3"] },
    { pattern: /đa\s*phước\s*4/i, searchNames: ["Tổ dân phố Đa Phước 4"] },
    { pattern: /thanh\s*vinh\s*1/i, searchNames: ["Tổ dân phố Thanh Vinh 1"] },
    { pattern: /thanh\s*vinh\s*2/i, searchNames: ["Tổ dân phố Thanh Vinh 2"] },
    { pattern: /thanh\s*vinh\s*3/i, searchNames: ["Tổ dân phố Thanh Vinh 3"] }
  ];

  for (const rule of namedAreaRules) {
    if (rule.pattern.test(cleanAddr) || rule.pattern.test(unaccentAddr)) {
      for (const searchStr of rule.searchNames) {
        const found = tdpList.find(t => removeVietnameseAccents(t.name).includes(removeVietnameseAccents(searchStr)));
        if (found) return found;
      }
    }
  }

  // 2. Numeric "Tổ XX" matching
  const toMatch = cleanAddr.match(/(?:tổ|to)\s*(\d+)/i);
  if (toMatch && toMatch[1]) {
    const rawNum = parseInt(toMatch[1], 10);
    
    // Direct match first (if rawNum <= 27)
    let targetNum = rawNum;
    if (targetNum > 27) {
      // Map old TDP numbers > 27 into merged TDP range 1..27
      targetNum = ((rawNum - 1) % 27) + 1;
    }

    const exactMatch = tdpList.find(t => {
      const unaccentName = removeVietnameseAccents(t.name);
      // Check for exact "to dan pho X" or "to X"
      const match = unaccentName.match(/to\s*(dan\s*pho\s*)?(\d+)/);
      return match && parseInt(match[2], 10) === targetNum;
    });

    if (exactMatch) return exactMatch;
  }

  // 3. Fallback matching by substring
  for (const tdp of tdpList) {
    const coreUnaccent = removeVietnameseAccents(tdp.name).replace("to dan pho", "").trim();
    if (coreUnaccent.length >= 3 && unaccentAddr.includes(coreUnaccent)) {
      return tdp;
    }
  }

  return null;
}

/**
 * Smart Positioning Engine
 * Calculates non-overlapping, boundary-enclosed coordinates for subjects using Turf.js geometry
 */
export function calculateSmartCoordinates(
  addressCurrent: string,
  addressPermanent: string,
  indexInCluster: number,
  tdpList: TDPItem[]
): GeocodeResult {
  // Attempt TDP matching
  let matchedTDP = extractAndNormalizeTDPName(addressCurrent, tdpList) || 
                    extractAndNormalizeTDPName(addressPermanent, tdpList);

  // If still not matched, pick a deterministic fallback TDP based on subject cluster index
  if (!matchedTDP && tdpList.length > 0) {
    const fallbackIdx = (indexInCluster % 27);
    matchedTDP = tdpList[fallbackIdx] || tdpList[0];
  }

  // Default ward center (Phường Liên Chiểu, Đà Nẵng)
  let baseLat = 16.0754;
  let baseLng = 108.1452;
  let tdpName = matchedTDP ? matchedTDP.name : "Tổ Dân Phố 1";
  let tdpPolygon: any = null;

  if (matchedTDP) {
    if (matchedTDP.center && matchedTDP.center.length >= 2) {
      baseLat = matchedTDP.center[0];
      baseLng = matchedTDP.center[1];
    }

    if (matchedTDP.geojson) {
      try {
        const geo = typeof matchedTDP.geojson === 'string' ? JSON.parse(matchedTDP.geojson) : matchedTDP.geojson;
        if (geo.features && geo.features[0]) {
          tdpPolygon = geo.features[0];
        } else if (geo.type === 'Feature') {
          tdpPolygon = geo;
        }
      } catch (e) {
        // ignore parse error
      }
    }
  }

  // Detect specific street number vs general TDP address
  const hasSpecificNumber = /\d+\s+[\p{L}\s]+/u.test(addressCurrent || '') || /\d+\/\d+/.test(addressCurrent || '');

  // Golden spiral radial dispersion angle & radius
  const goldenAngle = 2.39996323; // ~137.5 degrees
  const baseRadius = 0.00010; // ~10-12 meters
  const radiusStep = 0.00008; // ~8 meters per step
  const radius = baseRadius + Math.sqrt(indexInCluster) * radiusStep;
  const angle = indexInCluster * goldenAngle;

  let targetLat = baseLat + radius * Math.sin(angle);
  let targetLng = baseLng + radius * Math.cos(angle);

  // If a polygon boundary exists for the TDP, verify and adjust point to be strictly inside polygon
  if (tdpPolygon && (tdpPolygon.geometry?.type === 'Polygon' || tdpPolygon.geometry?.type === 'MultiPolygon')) {
    try {
      const pt = turf.point([targetLng, targetLat]);
      const isInside = turf.booleanPointInPolygon(pt, tdpPolygon);

      if (!isInside) {
        const centroid = turf.centroid(tdpPolygon);
        const [cLng, cLat] = centroid.geometry.coordinates;

        // Binary search inward towards centroid until point is inside polygon
        for (let factor = 0.85; factor >= 0.05; factor -= 0.15) {
          const testLat = cLat + (targetLat - cLat) * factor;
          const testLng = cLng + (targetLng - cLng) * factor;
          if (turf.booleanPointInPolygon(turf.point([testLng, testLat]), tdpPolygon)) {
            targetLat = testLat;
            targetLng = testLng;
            break;
          }
        }
      }
    } catch (e) {
      // Fallback
    }
  }

  return {
    lat: Math.round(targetLat * 1000000) / 1000000,
    lng: Math.round(targetLng * 1000000) / 1000000,
    matchedTdpName: tdpName,
    isSpecificAddress: hasSpecificNumber
  };
}
