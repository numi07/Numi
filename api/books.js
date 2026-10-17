export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const userAgent = req.headers['user-agent'] || "";
    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";

    // ফেসবুক, টুইটার, হোয়াটসঅ্যাপ ক্রলার বা সোশ্যাল রোবট চেক
    const isSocialCrawler = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Pinterest/i.test(userAgent);
    
    // ডোমেইন সিকিউরিটি যাচাই
    const isAllowedSource = referer.includes(allowedDomain) || origin.includes(allowedDomain) || referer.includes("localhost") || origin.includes("localhost");

    if (req.method === 'GET') {
        const { action, pass, refresh, book } = req.query;

        // =========================================================================
        // ১. ফেসবুক ও সোশ্যাল প্রিভিউ হ্যান্ডলার (বইয়ের আসল ছবি ও নাম দিয়ে কার্ড তৈরি)
        // =========================================================================
        if (action === 'share' && book) {
            try {
                // গুগল শিট থেকে বইয়ের ডাটা রিড
                const fetchUrl = `${scriptURL}?action=getData&_t=${Date.now()}`;
                const response = await fetch(fetchUrl);
                const data = await response.json();

                const targetBook = (data.books || []).find(b => b.id === book || String(b.serial) === book);

                if (targetBook) {
                    // গুগল ড্রাইভ থেকে ডিরেক্ট হাই-রেজোলিউশন CDN ইমেজ তৈরি (ফেসবুক সহজে পড়তে পারে)
                    let coverImg = (targetBook.images && targetBook.images.length > 0) ? targetBook.images[0] : "";
                    const driveMatch = coverImg.match(/\/d\/([a-zA-Z0-9_-]+)/) || coverImg.match(/[?&]id=([a-zA-Z0-9_-]+)/) || coverImg.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
                    if (driveMatch && driveMatch[1]) {
                        coverImg = `https://lh3.googleusercontent.com/d/${driveMatch[1]}`;
                    }
                    if (!coverImg) {
                        coverImg = "https://lh3.googleusercontent.com/d/1UV7XGIejCyhjrcdWX5HN2aqP_0oqgRJA";
                    }

                    const host = req.headers.host || allowedDomain;
                    const protocol = req.headers['x-forwarded-proto'] || 'https';
                    const targetRedirectUrl = `${protocol}://${host}/?book=${encodeURIComponent(targetBook.id)}`;

                    const summaryText = targetBook.summary 
                        ? (targetBook.summary.length > 180 ? targetBook.summary.substring(0, 175) + '...' : targetBook.summary)
                        : `চিলেকোঠা লাইব্রেরির ডিজিটাল সংগ্রহশালায় "${targetBook.title}" বইটি পড়ুন ও বিস্তারিত জানুন।`;

                    // ফেসবুক রোবটের জন্য সরাসরি ডাইনামিক Open Graph HTML রেসপন্স
                    res.setHeader('Content-Type', 'text/html; charset=utf-8');
                    res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
                    return res.status(200).send(`<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${targetBook.title} — ${targetBook.author} | চিলেকোঠা লাইব্রেরি</title>
    
    <!-- Facebook & Social Sharing Open Graph Tags -->
    <meta property="og:type" content="book">
    <meta property="og:site_name" content="চিলেকোঠা লাইব্রেরি">
    <meta property="og:title" content="${targetBook.title} — ${targetBook.author}">
    <meta property="og:description" content="${summaryText}">
    <meta property="og:image" content="${coverImg}">
    <meta property="og:image:secure_url" content="${coverImg}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="800">
    <meta property="og:url" content="${targetRedirectUrl}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${targetBook.title} — ${targetBook.author}">
    <meta name="twitter:description" content="${summaryText}">
    <meta name="twitter:image" content="${coverImg}">

    <!-- পাঠক লিঙ্কে চাপ দিলে সাথে সাথে আসল ওয়েবসাইটে নিয়ে যাবে -->
    <meta http-equiv="refresh" content="0;url=${targetRedirectUrl}">
    <script>window.location.replace("${targetRedirectUrl}");</script>
</head>
<body style="font-family: 'Noto Sans Bengali', sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #f8fafc;">
    <h2 style="margin-bottom: 6px;">${targetBook.title}</h2>
    <p style="color: #38bdf8; font-weight: bold; margin-top: 0;">${targetBook.author}</p>
    <img src="${coverImg}" alt="${targetBook.title}" style="max-width: 260px; border-radius: 14px; box-shadow: 0 10px 25px rgba(0,0,0,0.5); margin: 20px auto; display: block;">
    <p style="max-width: 500px; margin: 0 auto 20px; line-height: 1.6; color: #cbd5e1; font-size: 14px;">${summaryText}</p>
    <p><a href="${targetRedirectUrl}" style="display: inline-block; padding: 10px 22px; background: #0284c7; color: #fff; text-decoration: none; border-radius: 10px; font-weight: bold;">চিলেকোঠা লাইব্রেরিতে বইটি খুলুন</a></p>
</body>
</html>`);
                }
            } catch (err) {
                console.error("Share generator error:", err);
            }
        }

        // ২. এডমিন লগইন যাচাই
        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ error: "Unauthorized" });
        }

        // ৩. সিকিউরিটি চেক (সোশ্যাল ক্রলার ছাড়া সরাসরি অননুমোদিত এক্সেস ব্লক)
        if (!isAllowedSource && !isSocialCrawler && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
            });
        }

        // ৪. মূল ডাটা ফেচ
        try {
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
