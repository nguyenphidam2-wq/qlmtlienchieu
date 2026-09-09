import { NextRequest, NextResponse } from "next/server";
import { validateAgentAuth } from "@/lib/agent-auth";
import connectToDatabase from "@/lib/mongodb";
import {
  Subject,
  TDP,
  Rental,
  ConditionalBusiness,
  TestSchedule,
  CustomZone,
  User,
  AuditLog,
  AgentTask,
} from "@/lib/models";
import mongoose from "mongoose";

const COLLECTION_MAP: Record<string, mongoose.Model<any>> = {
  subjects: Subject,
  tdp: TDP,
  rentals: Rental,
  conditional_businesses: ConditionalBusiness,
  businesses: ConditionalBusiness,
  schedules: TestSchedule,
  customzones: CustomZone,
  users: User,
  audit_logs: AuditLog,
  agent_tasks: AgentTask,
};

export async function POST(request: NextRequest) {
  const auth = validateAgentAuth(request);
  if (!auth.authorized) {
    return auth.response!;
  }

  try {
    await connectToDatabase();
    const body = await request.json();
    const {
      collection,
      operation = "find",
      query = {},
      projection,
      sort = { _id: -1 },
      limit = 50,
      skip = 0,
      field,
      pipeline,
    } = body;

    if (!collection || !COLLECTION_MAP[collection.toLowerCase()]) {
      return NextResponse.json(
        {
          error: "INVALID_COLLECTION",
          message: `Collection '${collection}' is not allowed. Allowed: ${Object.keys(COLLECTION_MAP).join(", ")}`,
        },
        { status: 400 }
      );
    }

    const Model = COLLECTION_MAP[collection.toLowerCase()];
    const safeLimit = Math.min(Math.max(1, parseInt(String(limit), 10) || 50), 500);
    const safeSkip = Math.max(0, parseInt(String(skip), 10) || 0);

    const startMs = Date.now();
    let result: any = null;
    let totalMatched: number | undefined = undefined;

    switch (operation) {
      case "find": {
        let select = projection || {};
        // Safety: hide password_hash if querying users
        if (collection.toLowerCase() === "users" && !projection) {
          select = { password_hash: 0 };
        }
        const data = await Model.find(query, select)
          .sort(sort)
          .skip(safeSkip)
          .limit(safeLimit)
          .lean();
        result = data;
        totalMatched = await Model.countDocuments(query);
        break;
      }

      case "findOne": {
        let select = projection || {};
        if (collection.toLowerCase() === "users" && !projection) {
          select = { password_hash: 0 };
        }
        result = await Model.findOne(query, select).lean();
        break;
      }

      case "count": {
        result = await Model.countDocuments(query);
        break;
      }

      case "distinct": {
        if (!field) {
          return NextResponse.json({ error: "MISSING_FIELD", message: "'field' is required for distinct operation" }, { status: 400 });
        }
        result = await Model.distinct(field, query);
        break;
      }

      case "aggregate": {
        if (!Array.isArray(pipeline)) {
          return NextResponse.json({ error: "INVALID_PIPELINE", message: "'pipeline' must be an array of stages" }, { status: 400 });
        }
        // Safety: prohibit $out and $merge to prevent accidental table overwrites
        for (const stage of pipeline) {
          if (stage.$out || stage.$merge) {
            return NextResponse.json(
              { error: "DISALLOWED_STAGE", message: "$out and $merge aggregation stages are not permitted" },
              { status: 403 }
            );
          }
        }
        result = await Model.aggregate(pipeline);
        break;
      }

      default:
        return NextResponse.json(
          {
            error: "UNSUPPORTED_OPERATION",
            message: `Operation '${operation}' is not supported. Supported: find, findOne, count, distinct, aggregate`,
          },
          { status: 400 }
        );
    }

    const durationMs = Date.now() - startMs;

    return NextResponse.json({
      status: "ok",
      collection,
      operation,
      duration_ms: durationMs,
      total_matched: totalMatched,
      count: Array.isArray(result) ? result.length : result !== null ? 1 : 0,
      data: result,
    });
  } catch (error: any) {
    return NextResponse.json({ status: "error", error: error.message }, { status: 500 });
  }
}
