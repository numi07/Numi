// api/gallery.js

export default async function handler(req, res) {
    const scriptURL = process.env.GALLERY_SCRIPT_URL;
    const adminPass = process.env.GALLERY_ADMIN_PASSWORD;
    
    const allowedDomains = ["shikdernumi.pro.bd"];
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

        // লগিন ভেরিফিকেশন লজিক
        if (action === 'login') {
            if (pass === adminPass) {
                return res.status(200).json({ success: true, message: "লগিন সফল" });
            } else {
                return res.status(401).json({ success: false, message: "ভুল পাসওয়ার্ড" });
            }
        }

        // সিকিউরিটি চেক
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ error: "Forbidden", message: "সরাসরি এক্সেস নিষিদ্ধ!" });
        }

        const effectivePass = isAllowedSource ? adminPass : pass;
        let url = `${scriptURL}?pass=${effectivePass}`;
        
        if (action === 'delete') url += `&action=delete&id=${id}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Google Script Error" });
        }
    }

    // ২. POST মেথড: আপলোড
    if (req.method === 'POST') {
        try {
            if (!isAllowedSource) return res.status(403).json({ error: "Access denied" });

            // Google Script-এ পাঠানোর জন্য বডি তৈরি
            // এখানে Vercel-এর req.body যদি অবজেক্ট হয় তবে সেটিকে URLSearchParams এ রূপান্তর করতে হবে
            const bodyParams = new URLSearchParams(req.body);
            bodyParams.append('pass', adminPass); // ব্যাকএন্ড থেকে সিক্রেট পাসওয়ার্ড যোগ করা হলো

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: bodyParams.toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Failed to post data" });
        }
    }
}
