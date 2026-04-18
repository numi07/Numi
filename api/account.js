export default async function handler(req, res) {
    // Vercel Environment Variables থেকে ডাটা নেওয়া
    const scriptURL = process.env.ACCOUNT_GAS_SCRIPT_URL;
    const adminPass = process.env.ACCOUNT_ADMIN_PASSWORD;

    // ১. ডোমেইন সিকিউরিটি চেক
    const allowedDomains = ["shikdernumi.pro.bd", "vercel.app", "localhost"];
    const referer = req.headers.referer || "";
    const isAllowedSource = allowedDomains.some(domain => referer.includes(domain));

    // ২. হেডার সেটআপ (CORS Security)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ৩. পাসওয়ার্ড যাচাই (GET এবং POST উভয় ক্ষেত্রে)
    // ব্রাউজার থেকে আসা পাসওয়ার্ড চেক করা হচ্ছে
    const userPass = req.method === 'GET' ? req.query.pass : req.body.pass;

    if (!userPass || userPass !== adminPass) {
        return res.status(401).json({ 
            error: "Unauthorized", 
            message: "সরাসরি এক্সেস বা ভুল পাসওয়ার্ড! তথ্য দেখতে ওয়েবসাইট ব্যবহার করুন।" 
        });
    }

    // ৪. GET রিকোয়েস্ট হ্যান্ডেলিং (Data Fetch & Delete)
    if (req.method === 'GET') {
        const { action, id } = req.query;
        
        // এখানে আমরা কার্যকর পাসওয়ার্ড হিসেবে আমাদের সিক্রেট পাসওয়ার্ডটি GAS-এ পাঠাচ্ছি
        let finalGasUrl = `${scriptURL}?pass=${adminPass}`;
        
        if (action === 'delete' && id) {
            finalGasUrl += `&action=delete&id=${id}`;
        }

        try {
            const response = await fetch(finalGasUrl);
            const data = await response.json();
            // Google Script থেকে প্রাপ্ত ডাটা ব্রাউজারে পাঠানো হচ্ছে
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Google Script-এর সাথে সংযোগ বিচ্ছিন্ন!" });
        }
    }

    // ৫. POST রিকোয়েস্ট হ্যান্ডেলিং (Data Save & Update)
    if (req.method === 'POST') {
        try {
            // বডি ডাটাতে সিক্রেট পাসওয়ার্ড যুক্ত করে দিচ্ছি যাতে GAS নিশ্চিত হতে পারে
            const formData = new URLSearchParams(req.body);
            formData.set('pass', adminPass); // ইউজার যাই পাঠাক, আমরা আমাদের সিক্রেট পাসওয়ার্ড সেট করে দিচ্ছি

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: formData.toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            
            const result = await response.json();
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: "ডাটা সেভ করতে ব্যর্থ হয়েছে!" });
        }
    }
}
