const fs=require("fs");
const s=fs.readFileSync("lib/governance-adapter.ts","utf8");
const assert=(v,m)=>{if(!v)throw new Error(m);};

const stateBlocks=[...s.matchAll(/state_provenance:\s*\{[\s\S]*?\n\s*\}/g)].map(m=>m[0]);
assert(stateBlocks.length>0,"no state_provenance witness blocks found");
for (const block of stateBlocks) {
  if (block.includes("evidence_ref_count")) {
    assert(block.includes("fixture_epistemic_status"),
      "state_provenance witness missing fixture_epistemic_status");
  }
}
console.log("V95b request witness shape: PASS");
