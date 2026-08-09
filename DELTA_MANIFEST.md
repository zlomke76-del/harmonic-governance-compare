# Delta manifest

Base: protected-fetch diagnostic build.

Fix:
- explicitly completes Vercel's 307 + Set-Cookie automation-bypass handshake
- replays the same Frozen V2 POST once with the issued cookie
- rejects unresolved redirects
- no frozen V2/Core changes
