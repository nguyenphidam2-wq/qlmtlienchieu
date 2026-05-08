import { IFeatureModule, ImportResult } from "../types";
import { TDP } from "@/lib/models/TDP";
import mongoose from "mongoose";

export const tdpModule: IFeatureModule = {
  id: "tdp",
  name: "Tổ dân phố",
  description: "Quản lý thông tin và ranh giới các tổ dân phố",
  
  async importData(data: any[]): Promise<ImportResult> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      let inserted = 0;
      let updated = 0;
      let errors = 0;
      const errorDetails: string[] = [];

      for (const row of data) {
        if (!row.name) {
          errors++;
          errorDetails.push(`Thiếu tên tổ dân phố: ${JSON.stringify(row)}`);
          continue;
        }

        try {
          // Parse values safely
          const households = parseInt(row.households?.toString() || "0", 10);
          const population = parseInt(row.population?.toString() || "0", 10);
          const area_sqm = parseFloat(row.area_sqm?.toString() || "0");
          let risk_status = "green";
          
          if (row.risk_status) {
            const normalizedStatus = row.risk_status.toString().toLowerCase();
            if (normalizedStatus.includes("red") || normalizedStatus.includes("đỏ")) risk_status = "red";
            else if (normalizedStatus.includes("yellow") || normalizedStatus.includes("vàng")) risk_status = "yellow";
          }

          let geojson = row.geojson;
          if (typeof geojson === 'string') {
             try {
                geojson = JSON.parse(geojson);
             } catch (e) {
                // Ignore parsing errors for empty geojson
             }
          }

          if (!geojson) {
             geojson = { type: "FeatureCollection", features: [] }; // Default empty
          }

          const existingTDP = await TDP.findOne({ name: row.name }).session(session);

          const tdpData = {
            name: row.name,
            households: isNaN(households) ? 0 : households,
            population: isNaN(population) ? 0 : population,
            area_sqm: isNaN(area_sqm) ? 0 : area_sqm,
            risk_status,
            color: row.color?.toString() || "#3388ff", // Allow manual color input
            geojson,
            leader_name: row.leader_name?.toString() || "",
            leader_phone: row.leader_phone?.toString() || ""
          };

          if (existingTDP) {
            await TDP.findByIdAndUpdate(existingTDP._id, tdpData, { session });
            updated++;
          } else {
            await TDP.create([tdpData], { session });
            inserted++;
          }
        } catch (err: any) {
          errors++;
          errorDetails.push(`Lỗi dòng [${row.name}]: ${err.message}`);
        }
      }

      await session.commitTransaction();
      return {
        success: true,
        message: `Đã xử lý: Thêm mới ${inserted}, Cập nhật ${updated}, Lỗi ${errors}`,
        inserted,
        updated,
        errors,
        errorDetails
      };
    } catch (error: any) {
      await session.abortTransaction();
      return {
        success: false,
        message: `Lỗi nghiêm trọng: ${error.message}`,
        inserted: 0,
        updated: 0,
        errors: data.length,
        errorDetails: [error.message]
      };
    } finally {
      session.endSession();
    }
  }
};
