// api/tracker.js
export default async function handler(req, res) {
    const scriptURL = process.env.HISAB_GAS_SCRIPT_URL;
    const adminPass = process.env.HISAB_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const referer = req.headers.referer || "";
    // Localhost এবং নির্দিষ্ট ডোমেইন চেক
    const isAllowedSource = referer.includes(allowedDomain) || referer.includes("localhost") || referer.includes("127.0.0.1");

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // GET Method: ডাটা রিড বা লগইন চেক
    if (req.method === 'GET') {
        const { action, pass } = req.query;

        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ error: "Unauthorized" });
        }

        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিジット করুন।" 
            });
        }

        try {
            // ডায়নামিক অ্যাকশন বা কুয়েরি গুগল স্ক্রিপ্টে পাঠানো
            const response = await fetch(`${scriptURL}?action=${action || 'getData'}`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Fetch failed", details: error.message });
        }
    }

    // POST Method: এন্ট্রি, এডিট, ডিলিট অপারেশন
    if (req.method === 'POST') {
        try {
            if (!isAllowedSource) {
                return res.status(403).json({ error: "Access denied" });
            }

            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
            
            if (payload.adminPass !== adminPass) {
                return res.status(401).json({ error: "Unauthorized" });
            }

            // সিকিউরিটির জন্য গুগল স্ক্রিপ্টে রিকোয়েস্ট পাঠানোর আগে ভেরিসেল লেভেলে পাসওয়ার্ড চেক করে নেওয়া হচ্ছে
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Operation failed", details: error.message });
        }
    }
}
