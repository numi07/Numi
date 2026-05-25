// api/tracker.js
export default async function handler(req, res) {
    const scriptURL = process.env.HISAB_GAS_SCRIPT_URL;
    const adminPass = process.env.HISAB_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const referer = req.headers.referer || "";
    const isAllowedSource = referer.includes(allowedDomain) || referer.includes("localhost") || referer.includes("127.0.0.1") || !referer;

    // GET: Login check & Fetch Data
    if (req.method === 'GET') {
        const { action, pass } = req.query;

        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ success: false, error: "Unauthorized" });
        }

        // Data fetch security
        if (pass !== adminPass) return res.status(403).json({ error: "Forbidden" });

        try {
            const response = await fetch(`${scriptURL}?action=${action || 'getData'}&pass=${encodeURIComponent(pass)}`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Cloud Fetch Error" });
        }
    }

    // POST: Write operations (Entry, Edit, Delete)
    if (req.method === 'POST') {
        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            if (payload.adminPass !== adminPass) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Post Failed" });
        }
    }
}
