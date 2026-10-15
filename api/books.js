export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";
    const isAllowedSource = referer.includes(allowedDomain) || origin.includes(allowedDomain) || referer.includes("localhost") || origin.includes("localhost");

    if (req.method === 'GET') {
        const { action, pass, refresh } = req.query;

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
            // Vercel Edge ক্যাশ হেডার: বিশ্বব্যাপী ব্যবহারকারীদের জন্য ০.০০১ সেকেন্ডে ডেলিভারি
            res.setHeader('Access-Control-Allow-Origin', `https://${allowedDomain}`);
            if (!refresh && !pass) {
                res.setHeader('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=86400');
            } else {
                res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
            }

            const fetchUrl = `${scriptURL}?action=getData${refresh ? '&refresh=1' : ''}&_t=${Date.now()}`;
            const response = await fetch(fetchUrl);
            const data = await response.json();
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
            
            const publicActions = ['updateLikes', 'updateComments'];
            const requiresAdmin = !publicActions.includes(payload.action);

            if (requiresAdmin && payload.adminPass !== adminPass) {
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
