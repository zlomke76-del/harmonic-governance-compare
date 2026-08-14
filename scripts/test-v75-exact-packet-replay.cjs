const fs = require('fs');

const route = fs.readFileSync('app/api/replay-exact/route.ts', 'utf8');
const page = fs.readFileSync('app/page.tsx', 'utf8');
const adapter = fs.readFileSync('lib/governance-adapter.ts', 'utf8');

const checks = [
  ['route forwards original packetJson body', route.includes('const outboundBody = input.packetJson') && route.includes('body: outboundBody')],
  ['route does not stringify packet for outbound transport', !route.includes('body: JSON.stringify(packet)')],
  ['route hashes exact outbound body', route.includes('createHash("sha256")') && route.includes('outboundSha256')],
  ['route verifies packet identity', route.includes('returnedPacketId') && route.includes('observedPacketId !== packetId')],
  ['route declares no semantic translation', route.includes('semantic_translation_performed: false')],
  ['UI exposes exact replay mode', page.includes('Exact packet replay — literal transport, no model, no semantic translation')],
  ['UI calls exact replay route', page.includes('fetch("/api/replay-exact"')],
  ['adapter marks exact replay witness', adapter.includes('v75-exact-packet-replay-2026-08-14') && adapter.includes('llm_involved_in_packet_construction: false')]
];

let failed = false;
for (const [label, pass] of checks) {
  console.log(`${pass ? 'PASS' : 'FAIL'}: ${label}`);
  if (!pass) failed = true;
}
if (failed) process.exit(1);
