// api/gallery.js

export default async function handler(req, res) {
    const scriptURL = process.env.GALLERY_SCRIPT_URL; // Vercel Env: আপনার Apps Script Exec URL
    const adminPass = process.env.GALLERY_ADMIN_PASSWORD; // Vercel Env: আপনার সিক্রেট পাসওয়ার্ড
    
    const allowedDomains = ["shikdernumi.pro.bd"];
    const referer = req.headers.referer || "";
    const isAllowedSource = allowedDomains.some(domain => referer.includes(domain));

    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ১. GET মেথড: ডাটা লোড বা ডিলিট করার জন্য
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

        // সিকিউরিটি চেক: যদি সোর্স এলাউড না হয় এবং পাসওয়ার্ডও না থাকে
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
            });
        }

        // যদি আপনার ডোমেইন থেকে আসে তবে অটোমেটিক এডমিন পাসওয়ার্ড সেট হবে
        const effectivePass = isAllowedSource ? adminPass : pass;
        let url = `${scriptURL}?pass=${effectivePass}`;
        
        if (action === 'delete') {
            url += `&action=delete&id=${id}`;
        }

        try {
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch from Google Script" });
        }
    }

    // ২. POST মেথড: ফাইল আপলোড করার জন্য
    if (req.method === 'POST') {
        try {
            // শুধুমাত্র আপনার ডোমেইন থেকে আপলোড এলাউ করা হচ্ছে
            if (!isAllowedSource) {
                return res.status(403).json({ error: "Access denied: Unauthorized source" });
            }

            // ফ্রন্টএন্ড থেকে আসা বডিকে URLSearchParams এ কনভার্ট করা (Google Script এর জন্য)
            const bodyData = new URLSearchParams(req.body).toString();

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: bodyData,
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded' 
                }
            });

            const result = await response.text(); 
            return res.status(200).json({ success: true, message: result });

        } catch (error) {
            return res.status(500).json({ error: "Failed to post data to Google Script" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
