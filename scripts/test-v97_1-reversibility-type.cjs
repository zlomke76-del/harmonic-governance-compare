const fs=require("fs");
const page=fs.readFileSync("app/page.tsx","utf8");
const start=page.indexOf('id: "v3-nda-authority-history"');
const end=page.indexOf('id: "emergency-continuity-life-safety"',start);
const block=page.slice(start,end);
if(!block.includes('reversibility: "difficult_to_reverse"')) {
  throw new Error("NDA fixture does not use the allowed difficult_to_reverse enum");
}
if(block.includes('reversibility: "hard_to_reverse"')) {
  throw new Error("Invalid hard_to_reverse enum remains in NDA fixture");
}
console.log("V97.1 reversibility enum: PASS");
