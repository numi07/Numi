export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;
    const allowedDomain = "shikdernumi.pro.bd";

    const userAgent = req.headers['user-agent'] || "";
    const referer = req.headers.referer || "";
    const origin = req.headers.origin || "";

    // ফেসবুক, মেসেঞ্জার, হোয়াটসঅ্যাপ, টুইটার বা অন্য সোশ্যাল রোবট ক্রলার সনাক্তকরণ
    const isSocialCrawler = /facebookexternalhit|Facebot|Twitterbot|WhatsApp|TelegramBot|LinkedInBot|Pinterest|Googlebot/i.test(userAgent);
    
    // নিজস্ব অনুমোদিত ডোমেইন যাচাই
    const isAllowedSource = referer.includes(allowedDomain) || origin.includes(allowedDomain) || referer.includes("localhost") || origin.includes("localhost");

    if (req.method === 'GET') {
        const { action, pass, refresh, book, title, author, img } = req.query;

        // =========================================================================
        // ১. ফেসবুক ও সোশ্যাল প্রিভিউ হ্যান্ডলার (সিকিউরিটি চেকের আগে রাখা হয়েছে যাতে ব্লক না হয়)
        // =========================================================================
        if (action === 'share' && book) {
            const host = req.headers.host || allowedDomain;
            const protocol = req.headers['x-forwarded-proto'] || 'https';
            const targetRedirectUrl = `${protocol}://${host}/?book=${encodeURIComponent(book)}`;

            // সাধারণ কোনো মানুষ ফেসবুকে লিংকে ক্লিক করলে কোনো Forbidden এরর ছাড়া সাথে সাথে ওয়েবসাইটে রিডাইরেক্ট হবে
            if (!isSocialCrawler) {
                return res.redirect(302, targetRedirectUrl);
            }

            // ফেসবুক ক্রলারের জন্য ছবি প্রস্তুতকরণ
            let coverImg = "https://lh3.googleusercontent.com/d/1UV7XGIejCyhjrcdWX5HN2aqP_0oqgRJA";
            if (img && img.trim()) {
                coverImg = `https://lh3.googleusercontent.com/d/${img.trim()}`;
            }

            const bookTitle = title ? decodeURIComponent(title) : "চিলেকোঠা লাইব্রেরি";
            const bookAuthor = author ? decodeURIComponent(author) : "";
            const pageTitle = bookAuthor ? `${bookTitle} — ${bookAuthor} | চিলেকোঠা লাইব্রেরি` : `${bookTitle} | চিলেকোঠা লাইব্রেরি`;
            const summaryText = `চিলেকোঠা লাইব্রেরির ডিজিটাল সংগ্রহশালায় "${bookTitle}" বইটি পড়ুন ও বিস্তারিত জানুন।`;

            // ফেসবুক ক্রলারকে ছবি ও তথ্যসহ ডাইনামিক Open Graph HTML রেসপন্স
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            res.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=86400');
            return res.status(200).send(`<!DOCTYPE html>
<html lang="bn">
<head>
    <meta charset="UTF-8">
    <title>${pageTitle}</title>
    
    <!-- Facebook & Social Sharing Open Graph Tags -->
    <meta property="og:type" content="book">
    <meta property="og:site_name" content="চিলেকোঠা লাইব্রেরি">
    <meta property="og:title" content="${bookAuthor ? bookTitle + ' — ' + bookAuthor : bookTitle}">
    <meta property="og:description" content="${summaryText}">
    <meta property="og:image" content="${coverImg}">
    <meta property="og:image:secure_url" content="${coverImg}">
    <meta property="og:image:type" content="image/jpeg">
    <meta property="og:image:width" content="600">
    <meta property="og:image:height" content="800">
    <meta property="og:url" content="${targetRedirectUrl}">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${bookTitle}">
    <meta name="twitter:description" content="${summaryText}">
    <meta name="twitter:image" content="${coverImg}">

    <meta http-equiv="refresh" content="0;url=${targetRedirectUrl}">
    <script>window.location.replace("${targetRedirectUrl}");</script>
</head>
<body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0f172a; color: #fff;">
    <h2>${bookTitle}</h2>
    <p>${bookAuthor}</p>
    <img src="${coverImg}" style="max-width: 260px; border-radius: 12px; margin: 20px auto; display: block;">
    <p>চিলেকোঠা লাইব্রেরিতে নিয়ে যাওয়া হচ্ছে...</p>
    <a href="${targetRedirectUrl}" style="color: #38bdf8;">ক্লিক করে সরাসরি খুলুন</a>
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
