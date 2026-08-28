const fs=require("fs");
const s=fs.readFileSync("app/page.tsx","utf8");
const assert=(v,m)=>{if(!v)throw new Error(m)};
assert(s.includes('useState<RuntimeTarget>("v4_2")'),"frozen v4.2.0 primary route is not initial runtime");
assert(!s.includes('localStorage.getItem("harmonic.compare.runtime")'),"runtime selection still restored");
assert(!s.includes('localStorage.setItem("harmonic.compare.runtime"'),"runtime selection still persisted");
assert(s.includes('localStorage.removeItem("harmonic.compare.runtime")'),"stale selection not cleared");
console.log("V93 fresh-primary runtime regression: PASS");
