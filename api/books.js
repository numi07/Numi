// api/books.js
export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;

    // GET Request: ডাটা পড়া বা লগিন ভেরিফাই করা
    if (req.method === 'GET') {
        const { action, pass } = req.query;

        if (action === 'checkLogin') {
            if (pass === adminPass) return res.status(200).json({ success: true });
            else return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            const response = await fetch(`${scriptURL}?action=getData`);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Fetch failed" });
        }
    }

    // POST Request: ডাটা সেভ বা ডিলিট করা
    if (req.method === 'POST') {
        try {
            const payload = JSON.parse(req.body);
            // পাসওয়ার্ড চেক
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
            return res.status(500).json({ error: "Operation failed" });
        }
    }
}
