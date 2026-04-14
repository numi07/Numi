export default async function handler(req, res) {
    const scriptURL = process.env.GAS_SCRIPT_URL;
    const adminPass = process.env.ADMIN_PASSWORD;
    const allowedDomains = ["shikdernumi.pro.bd"];
    const referer = req.headers.referer || "";
    const isAllowedSource = allowedDomains.some(domain => referer.includes(domain));
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;
        if (!isAllowedSource && pass !== adminPass) {
            return res.status(403).json({ 
                error: "Forbidden", 
                message: "সরাসরি এক্সেস নিষিদ্ধ! ডাটা দেখতে আপনার ওয়েবসাইট ভিজিট করুন।" 
            });
        }
        const effectivePass = isAllowedSource ? adminPass : pass;
        let url = `${scriptURL}?pass=${effectivePass}`;
        if (action === 'delete') url += `&action=delete&id=${id}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            res.setHeader('Access-Control-Allow-Origin', '*');
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch from Google Script" });
        }
    }
    if (req.method === 'POST') {
        try {
            if (!isAllowedSource) {
                return res.status(403).json({ error: "Access denied" });
            }

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: new URLSearchParams(req.body).toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Failed to post data" });
        }
    }
}
