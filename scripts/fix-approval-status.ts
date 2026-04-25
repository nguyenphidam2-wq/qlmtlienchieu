/**
 * Fix Approval Status Migration Script
 *
 * This script updates all subjects with null/undefined approval_status to "Approved".
 * This fixes the issue where old imported data doesn't show markers on the GIS map.
 *
 * Usage:
 *   npx tsx scripts/fix-approval-status.ts
 */

async function fixApprovalStatus() {
  console.log("Starting approval status fix...");
  console.log("=".repeat(50));

  try {
    const mongoose = await import("mongoose");
    const { connectDB } = await import("../src/lib/mongodb");
    const { Subject } = await import("../src/lib/models");

    await connectDB();
    console.log("✅ Connected to MongoDB\n");

    // Count subjects with undefined/null approval_status
    const undefinedCount = await Subject.countDocuments({
      $or: [
        { approval_status: { $exists: false } },
        { approval_status: null },
        { approval_status: undefined },
      ]
    });

    console.log(`📊 Found ${undefinedCount} subjects with undefined/null approval_status`);

    if (undefinedCount > 0) {
      // Update all undefined/null approval_status to "Approved"
      const result = await Subject.updateMany(
        {
          $or: [
            { approval_status: { $exists: false } },
            { approval_status: null },
            { approval_status: undefined },
          ]
        },
        { $set: { approval_status: "Approved" } }
      );

      console.log(`✅ Updated ${result.modifiedCount} subjects to "Approved"`);
    }

    // Verify: count approved and total
    const approvedCount = await Subject.countDocuments({ approval_status: "Approved" });
    const totalCount = await Subject.countDocuments();

    console.log("\n" + "=".repeat(50));
    console.log("📊 Final Status:");
    console.log(`   Total subjects: ${totalCount}`);
    console.log(`   With Approved status: ${approvedCount}`);

    // Show breakdown by status
    const statusCounts = await Subject.aggregate([
      { $group: { _id: "$approval_status", count: { $sum: 1 } } }
    ]);
    console.log("\n   Breakdown by approval_status:");
    statusCounts.forEach((s: any) => {
      console.log(`     - ${s._id || "(undefined)"}: ${s.count}`);
    });

    console.log("\n✅ Fix completed successfully!");

  } catch (error) {
    console.error("\n❌ Fix failed:", error);
    throw error;
  } finally {
    const mongoose = await import("mongoose");
    await mongoose.default.disconnect();
    console.log("\n🔌 Disconnected from MongoDB");
  }
}

fixApprovalStatus().catch(console.error);