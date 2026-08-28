import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { z } from "zod";
import { projectExactPacketReplay } from "../../../lib/governance-adapter";
import type { CompareResponse, LaneResult } from "../../../lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const DEFAULT_HARMONIC_API_URL = "https://www.solace-harmonic.com/api/evaluate";

const RequestSchema = z.object({
  packetJson: z.string().min(2).max(250000)
});

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function returnedPacketId(json: Record<string, unknown>): string | null {
  const candidates: unknown[] = [
    json.packet_id,
    asRecord(json.governance)?.packet_id,
    asRecord(json.harmonic)?.packet_id,
    asRecord(json.unified_transaction)?.packet_id,
    asRecord(json.constitutional_transaction)?.packet_id,
    asRecord(asRecord(json.governance)?.unified_transaction)?.packet_id,
    asRecord(asRecord(json.governance)?.constitutional_transaction)?.packet_id
  ];
  for (const value of candidates) {
    if (typeof value === "string" && value.trim()) return value;
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const input = RequestSchema.parse(await req.json());

    let packet: Record<string, unknown>;
    try {
      const parsed = JSON.parse(input.packetJson);
      const record = asRecord(parsed);
      if (!record) throw new Error("Packet must be a JSON object.");
      packet = record;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Invalid JSON packet.";
      return NextResponse.json({ error: `Exact replay packet is not valid JSON: ${message}` }, { status: 400 });
    }

    const packetId = typeof packet.packet_id === "string" && packet.packet_id.trim()
      ? packet.packet_id.trim()
      : null;
    if (!packetId) {
      return NextResponse.json({ error: "Exact packet replay requires an explicit packet_id so transport identity can be verified." }, { status: 400 });
    }

    const url = process.env.HARMONIC_API_URL || process.env.HARMONIC_ONLY_API_URL || DEFAULT_HARMONIC_API_URL;
    const key = process.env.HARMONIC_GOVERNANCE_API_KEY || process.env.HARMONIC_API_KEY || process.env.HARMONIC_ONLY_API_KEY;
    if (!key) {
      return NextResponse.json({ error: "No Harmonic API key is configured for exact packet replay." }, { status: 503 });
    }

    // packetJson is the exact operator-supplied JSON text. It is validated above, but is not
    // parsed/re-serialized for transport. No model, scenario adapter, or semantic mapper touches it.
    const outboundBody = input.packetJson;
    const outboundSha256 = createHash("sha256").update(Buffer.from(outboundBody, "utf8")).digest("hex");
    const outboundBytes = Buffer.byteLength(outboundBody, "utf8");

    const started = Date.now();
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "X-Harmonic-Harness-Build": "v75-exact-packet-replay-2026-08-14",
        "X-Harmonic-Replay-Mode": "exact-packet"
      },
      body: outboundBody
    });

    const responseText = await res.text();
    let json: Record<string, unknown> = {};
    try {
      json = responseText ? (JSON.parse(responseText) as Record<string, unknown>) : {};
    } catch {
      json = { raw_text: responseText };
    }

    if (!res.ok) {
      return NextResponse.json({
        error: `Harmonic /api/evaluate returned HTTP ${res.status}.`,
        packet_id: packetId,
        outbound_sha256: outboundSha256,
        outbound_bytes: outboundBytes,
        response: json
      }, { status: res.status });
    }

    const observedPacketId = returnedPacketId(json);
    if (!observedPacketId) {
      return NextResponse.json({
        error: "Exact packet replay integrity failure: Harmonic did not return a verifiable packet_id.",
        submitted_packet_id: packetId,
        returned_packet_id: null,
        outbound_sha256: outboundSha256,
        outbound_bytes: outboundBytes,
        response: json
      }, { status: 502 });
    }
    if (observedPacketId !== packetId) {
      return NextResponse.json({
        error: "Exact packet replay integrity failure: returned packet_id does not match the submitted packet_id.",
        submitted_packet_id: packetId,
        returned_packet_id: observedPacketId,
        outbound_sha256: outboundSha256,
        outbound_bytes: outboundBytes,
        response: json
      }, { status: 502 });
    }

    const projected = projectExactPacketReplay({
      unified: json,
      packet,
      outboundSha256,
      outboundBytes
    });
    const latencyMs = Date.now() - started;

    const lanes: LaneResult[] = [
      {
        lane: "harmonic",
        title: "Continuation Stabilizer",
        response: typeof packet.response === "string" ? packet.response : "",
        evaluation: projected.harmonic,
        latencyMs
      },
      {
        lane: "harmonic_governance",
        title: "Constitutional Runtime",
        response: typeof packet.response === "string" ? packet.response : "",
        evaluation: projected.harmonic_governance,
        latencyMs
      }
    ];

    const payload: CompareResponse & { replayTransport: Record<string, unknown> } = {
      runtimeTarget: "v4_2",
      runtimeLabel: "Current Production · Exact packet replay",
      prompt: "Exact packet replay; no model inference or harness semantic translation.",
      scenario: packetId,
      model: "No model · literal packet transport",
      generatedAt: new Date().toISOString(),
      lanes,
      replayTransport: {
        mode: "exact_packet_replay",
        submitted_packet_id: packetId,
        returned_packet_id: observedPacketId,
        packet_id_match: true,
        outbound_sha256: outboundSha256,
        outbound_bytes: outboundBytes,
        semantic_translation_performed: false,
        llm_involved_in_packet_construction: false
      }
    };

    return NextResponse.json(payload);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
