export default async function handler(req, res) {
    const scriptURL = process.env.CARD_GAS_SCRIPT_URL;
    const allowedDomain = "shikdernumi.pro.bd";

    // সিকিউরিটি ডোমেন ভ্যালিডেশন (শুধুমাত্র আপনার সাইট ও লোকালহোস্ট থেকে রিকোয়েস্ট গ্রহণ করবে)
    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";
    const isAllowedSource = 
        referer.includes(allowedDomain) || 
        origin.includes(allowedDomain) || 
        referer.includes("localhost") || 
        origin.includes("localhost") ||
        referer.includes("vercel.app") ||
        origin.includes("vercel.app");

    // CORS Headers
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', origin || `https://${allowedDomain}`);
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    // Preflight OPTIONS রিকোয়েস্ট হ্যান্ডেল
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (!scriptURL) {
        return res.status(500).json({ error: "Server Configuration Error: CARD_GAS_SCRIPT_URL is not set." });
    }

    // সরাসরি কেউ ব্রাউজারে ইউআরএল পেস্ট করে দেখতে চাইলে ব্লক করবে
    if (!isAllowedSource) {
        return res.status(403).json({ 
            error: "Forbidden", 
            message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
        });
    }

    // 1. GET REQUEST (উইশ কার্ড লোড করার জন্য)
    if (req.method === 'GET') {
        const { id } = req.query;

        if (!id) {
            return res.status(400).json({ success: false, message: "কার্ডের আইডি প্রদান করা হয়নি।" });
        }

        try {
            // গুগল স্ক্রিপ্টে রিডাইরেক্ট ফলো করে কল করা হচ্ছে
            const response = await fetch(`${scriptURL}?id=${encodeURIComponent(id)}&_t=${Date.now()}`, {
                redirect: 'follow'
            });
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: "ডাটা ফেচ করতে সমস্যা হয়েছে।" });
        }
    }

    // 2. POST REQUEST (লগইন, রেজিস্ট্রেশন, সেভ ও ডিলিট করার জন্য)
    if (req.method === 'POST') {
        try {
            const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: JSON.stringify(payload),
                headers: { 'Content-Type': 'application/json' },
                redirect: 'follow'
            });

            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ success: false, error: "অপারেশন সম্পন্ন করতে সমস্যা হয়েছে।" });
        }
    }

    return res.status(405).json({ error: "Method not allowed" });
}
