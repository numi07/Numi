export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const referer = req.headers.referer || "";
    const isAllowedSource = referer.includes(allowedDomain) || referer.includes("localhost");

    if (req.method === 'GET') {
        const { action, pass } = req.query;

        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ error: "Unauthorized" });
        }
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
            });
        }

        try {
            const response = await fetch(`${scriptURL}?action=getData`);
            const data = await response.json();
            res.setHeader('Access-Control-Allow-Origin', `https://${allowedDomain}`);
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Fetch failed" });
        }
    }
    if (req.method === 'POST') {
        try {
            if (!isAllowedSource) {
                return res.status(403).json({ error: "Access denied" });
            }

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
            return res.status(500).json({ error: "Operation failed" });
        }
    }
}
