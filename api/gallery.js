// api/gallery.js

export default async function handler(req, res) {
    const scriptURL = process.env.GALLERY_SCRIPT_URL;
    const adminPass = process.env.GALLERY_ADMIN_PASSWORD;
    
    const allowedDomains = ["shikdernumi.pro.bd", "localhost"]; // localhost রাখলে টেস্টিং সুবিধা হবে
    const referer = req.headers.referer || "";
    const isAllowedSource = allowedDomains.some(domain => referer.includes(domain));

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    // ১. GET মেথড: ডাটা লোড ও লগিন চেক
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

        // লগিন ভেরিফিকেশন
        if (action === 'login') {
            if (pass === adminPass) {
                return res.status(200).json({ success: true, message: "লগিন সফল" });
            } else {
                return res.status(401).json({ success: false, message: "ভুল পাসওয়ার্ড" });
            }
        }

        // সিকিউরিটি চেক (আপনার আগের লজিক বজায় রাখা হয়েছে)
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ error: "Forbidden", message: "সরাসরি এক্সেস নিষিদ্ধ!" });
        }

        let url = `${scriptURL}?pass=${adminPass}`;
        if (action === 'delete') url += `&action=delete&id=${id}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Google Script Error" });
        }
    }

    // ২. POST মেথড: আপলোড (এখানে URLSearchParams এর বদলে JSON ব্যবহার করা হয়েছে)
    if (req.method === 'POST') {
        try {
            if (!isAllowedSource && req.body.pass !== adminPass) {
                return res.status(403).json({ error: "Access denied" });
            }

            // Google Script-এ JSON ডাটা পাঠানো সবচেয়ে নিরাপদ
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(req.body), // URLSearchParams এর বদলে JSON.stringify
                headers: { 'Content-Type': 'application/json' }
            });

            const result = await response.json();
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: "Failed to post data" });
        }
    }
}
