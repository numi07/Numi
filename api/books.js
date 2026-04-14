// api/books.js
export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;

    // ১. GET Request: ডাটা পড়া বা ডিলিট করা
    if (req.method === 'GET') {
        const { action, pass, id } = req.query;

        // লগিন চেক বা ডিলিট করার সময় পাসওয়ার্ড ভেরিফাই করা
        if ((action === 'checkLogin' || action === 'deleteBook') && pass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            let url = `${scriptURL}?action=${action || 'getData'}`;
            if (id) url += `&id=${id}`;
            
            const response = await fetch(url);
            const data = await response.json();

            if (action === 'checkLogin') return res.status(200).json({ success: true });
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch from GAS" });
        }
    }

    // ২. POST Request: বই বা লেখক সেভ করা
    if (req.method === 'POST') {
        try {
            const payload = JSON.parse(req.body);
            // সিকিউরিটি চেক
            if (payload.adminPass !== adminPass) {
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
            return res.status(500).json({ error: "Failed to save data" });
        }
    }
}
