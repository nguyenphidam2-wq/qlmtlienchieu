import mongoose from "mongoose";
import * as turf from "@turf/turf";
import { connectDB } from "../src/lib/mongodb";
import { Subject } from "../src/lib/models/Subject";
import { CustomZone } from "../src/lib/models/CustomZone";

async function run() {
  try {
    await connectDB();
    console.log("Connected to MongoDB.");

    const zones = await CustomZone.find({ type: "polygon" });
    const subjects = await Subject.find();

    console.log(`Found ${zones.length} zones and ${subjects.length} subjects.`);

    if (zones.length < 3) {
      console.log("There are not enough custom zones drawn to simulate this. Found: " + zones.length);
      process.exit(0);
    }

    let sIdx = 0;
    
    // Zone 0 gets 5 subjects (RED)
    console.log(`Zone 0 (Red) -> ${zones[0].name}`);
    for (let i = 0; i < 5 && sIdx < subjects.length; i++) {
       assignSubjectToZone(subjects[sIdx++], zones[0]);
    }
    
    // Zone 1 and 2 get 3 subjects each (YELLOW)
    console.log(`Zone 1 (Yellow) -> ${zones[1].name}`);
    for (let i = 0; i < 3 && sIdx < subjects.length; i++) {
        assignSubjectToZone(subjects[sIdx++], zones[1]);
    }
    console.log(`Zone 2 (Yellow) -> ${zones[2].name}`);
    for (let i = 0; i < 3 && sIdx < subjects.length; i++) {
        assignSubjectToZone(subjects[sIdx++], zones[2]);
    }

    // Remaining zones get 1 or 0 subjects (GREEN)
    for (let z = 3; z < zones.length && sIdx < subjects.length; z++) {
        assignSubjectToZone(subjects[sIdx++], zones[z]);
    }
    
    // Any leftover subjects into other remaining zones
    let currentZone = 3;
    while (sIdx < subjects.length) {
        assignSubjectToZone(subjects[sIdx++], zones[currentZone % zones.length]);
        currentZone++;
    }

    // Save
    let updatedCount = 0;
    for (const s of subjects) {
      if ((s as any)._isModifiedCoords) {
        await s.save();
        updatedCount++;
      }
    }

    console.log(`Successfully moved ${updatedCount} subjects into specific zones!`);
  } catch(e) {
    console.error("Error during assignment:", e);
  } finally {
    mongoose.disconnect();
  }
}

function assignSubjectToZone(subject: any, zone: any) {
    try {
        const features = zone.geojson.features;
        if (features && features.length > 0) {
            const poly = features[0];
            const bbox = turf.bbox(poly);
            let pt = null;
            let valid = false;
            let attempts = 0;
            // Raycast random points inside bounding box to find one strictly inside polygon
            while (!valid && attempts < 200) {
                const lng = bbox[0] + Math.random() * (bbox[2] - bbox[0]);
                const lat = bbox[1] + Math.random() * (bbox[3] - bbox[1]);
                pt = turf.point([lng, lat]);
                valid = turf.booleanPointInPolygon(pt, poly);
                attempts++;
            }
            if (valid && pt) {
                subject.lng = pt.geometry.coordinates[0];
                subject.lat = pt.geometry.coordinates[1];
                subject._isModifiedCoords = true; // custom flag
            }
        }
    } catch(e) {
        // Turf fallback geometry checks might fail for rough custom drawn polygons
    }
}

run();
