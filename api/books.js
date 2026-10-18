export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const userAgent = (req.headers['user-agent'] || "").toLowerCase();
    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";

    // ১. ফেসবুক, মেসেঞ্জার, হোয়াটসঅ্যাপ, টুইটার ইত্যাদি সোশ্যাল ক্রলার নিখুঁতভাবে শনাক্তকরণ
    const isSocialCrawler = /facebookexternalhit|facebot|facebookcatalog|twitterbot|whatsapp|telegrambot|linkedinbot|pinterest|googlebot|bingbot|applebot/i.test(userAgent);
    
    // নিজস্ব অনুমোদিত ডোমেইন যাচাই
    const isAllowedSource = referer.includes(allowedDomain) || origin.includes(allowedDomain) || referer.includes("localhost") || origin.includes("localhost");

    // বিশেষ ক্যারেক্টার এস্কেপ ফাংশন (যাতে কোড বা ট্যাগ ভেঙে টেক্সট হিসেবে ভেসে না ওঠে)
    function cleanHtmlText(str) {
        if (!str) return "";
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    if (req.method === 'GET') {
        const { action, pass, refresh, book, title, author, img } = req.query;

        // =========================================================================
        // ফেসবুক ও সোশ্যাল শেয়ার হ্যান্ডলার (বইয়ের ছবি, নাম ও বিবরণ নিশ্চিতকরণ)
        // =========================================================================
        if (action === 'share' && book) {
            const host = req.headers.host || allowedDomain;
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            
            // ব্যবহারকারী ক্লিক করলে সরাসরি যে পেজে বই ওপেন হবে
            const targetRedirectUrl = `${protocol}://${host}/?book=${encodeURIComponent(book)}`;
            
            // ফেসবুক যখন শেয়ারের তথ্য পড়বে তখন এই শেয়ার এন্ডপয়েন্টটিকেই ওজি লিঙ্ক হিসেবে রাখবে
            const canonicalShareUrl = `${protocol}://${host}${req.url}`;

            // যদি সাধারণ কোনো মানুষ (ভিজিটর) ক্লিক করে, সরাসরি রিডাইরেক্ট করে মূল বইয়ের পাতায় নিয়ে যাবে
            if (!isSocialCrawler) {
                res.writeHead(302, { Location: targetRedirectUrl });
                return res.end();
            }

            // ছবি প্রস্তুতকরণ (গুগল ড্রাইভ আইডি বা সরাসরি লিঙ্ক)
            let coverImg = "https://lh3.googleusercontent.com/d/1UV7XGIejCyhjrcdWX5HN2aqP_0oqgRJA";
            if (img && img.trim()) {
                const cleanImg = img.trim();
                if (cleanImg.startsWith("http")) {
                    coverImg = cleanImg;
                } else {
                    coverImg = `https://lh3.googleusercontent.com/d/${cleanImg}`;
                }
            }

            const rawTitle = title ? decodeURIComponent(title) : "চিলেকোঠা লাইব্রেরি";
            const rawAuthor = author ? decodeURIComponent(author) : "";
            
            const displayTitle = rawAuthor ? `${rawTitle} — ${rawAuthor}` : rawTitle;
            const displayDesc = `চিলেকোঠা লাইব্রেরির ডিজিটাল সংগ্রহশালায় "${rawTitle}" বইটি পড়ুন ও সংগ্রহ দেখুন।`;

            const safeTitle = cleanHtmlText(displayTitle);
            const safeDesc = cleanHtmlText(displayDesc);
            const safeSiteName = cleanHtmlText("চিলেকোঠা লাইব্রেরি");

            // ফেসবুক ক্রলারের জন্য ১০০% ক্লিন মেটা রেসপন্স (কোনো দৃশ্যমান স্ক্রিন টেক্সট থাকবে না)
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
            
            return res.status(200).send(`<!DOCTYPE html>
<html lang="bn" prefix="og: http://ogp.me/ns# fb: http://ogp.me/ns/fb#">
<head>
    <meta charset="UTF-8">
    <title>${safeTitle} | ${safeSiteName}</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">

    <!-- Primary Meta Tags -->
    <meta name="title" content="${safeTitle}">
    <meta name="description" content="${safeDesc}">

    <!-- Open Graph / Facebook -->
    <meta property="og:type" content="book">
    <meta property="og:site_name" content="${safeSiteName}">
    <meta property="og:title" content="${safeTitle}">
    <meta property="og:description" content="${safeDesc}">
    <meta property="og:image" content="${coverImg}">
    <meta property="og:image:secure_url" content="${coverImg}">
    <meta property="og:image:alt" content="${safeTitle}">
    <meta property="og:url" content="${canonicalShareUrl}">

    <!-- Twitter -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${safeTitle}">
    <meta name="twitter:description" content="${safeDesc}">
    <meta name="twitter:image" content="${coverImg}">

    <!-- Instant Fallback Redirect -->
    <meta http-equiv="refresh" content="0;url=${targetRedirectUrl}">
    <script type="text/javascript">
        window.location.replace("${targetRedirectUrl}");
    </script>
    <style>
        body { margin: 0; background-color: #0f172a; }
    </style>
</head>
<body>
</body>
</html>`);
        }

        // ২. এডমিন পাসওয়ার্ড যাচাই
        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ error: "Unauthorized" });
        }

        // ৩. সরাসরি অননুমোদিত এক্সেস ব্লক (শুধুমাত্র নির্দিষ্ট ডোমেইন ও এডমিনের জন্য)
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
            });
        }

        // ৪. গুগল শিট থেকে লাইভ ডাটা ফেচ
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
