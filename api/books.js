// api/books.js
export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;

    // GET Request: ডাটা পড়ার জন্য
    if (req.method === 'GET') {
        const { action, pass, id } = req.query;

        // যদি ডিলিট করতে চায় তবে পাসওয়ার্ড চেক করবে
        if (action === 'deleteBook' && pass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            let url = `${scriptURL}?action=${action || 'getData'}`;
            if (id) url += `&id=${id}`;
            
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch from Google Script" });
        }
    }

    // POST Request: ডাটা সেভ বা আপডেট করার জন্য
    if (req.method === 'POST') {
        const body = JSON.parse(req.body);
        
        // পাসওয়ার্ড চেক (সিকিউরিটির জন্য Frontend থেকে পাঠানো হবে)
        if (body.adminPass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: new URLSearchParams(body).toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Failed to save data" });
        }
    }
}
