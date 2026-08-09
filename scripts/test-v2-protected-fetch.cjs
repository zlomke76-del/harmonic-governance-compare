const fs=require('fs'),path=require('path');
const root=path.join(__dirname,'..');
const adapter=fs.readFileSync(path.join(root,'lib/governance-adapter.ts'),'utf8');
function must(x){if(!adapter.includes(x)) throw new Error('missing '+x)}
must('new URL(url)');
must('searchParams.set("x-vercel-protection-bypass", bypassSecret)');
must('"x-vercel-protection-bypass": bypassSecret');
must('redirect: "manual"');
must('Frozen V2 fetch failed before an HTTP response was received.');
must('bypass_configured=');
must('unexpected redirect HTTP');
console.log('Frozen V2 protected fetch regression: PASS');
