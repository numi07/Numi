// api/books.js
export default async function handler(req, res) {
    const scriptURL = process.env.BOOKS_GAS_SCRIPT_URL;
    const adminPass = process.env.BOOKS_ADMIN_PASSWORD;

    // ১. GET রিকোয়েস্ট: ডাটা পড়া এবং লগিন চেক করা
    if (req.method === 'GET') {
        const { action, pass, id } = req.query;

        // যদি লগিন বা ডিলিট চেক করতে চায় তবে পাসওয়ার্ড ভেরিফাই করবে
        if ((action === 'checkLogin' || action === 'deleteBook') && pass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            let url = `${scriptURL}?action=${action || 'getData'}`;
            if (id) url += `&id=${id}`;
            
            const response = await fetch(url);
            const data = await response.json();
            
            // লগিন চেক সফল হলে রেসপন্স পাঠাবে
            if (action === 'checkLogin') return res.status(200).json({ success: true });
            
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Failed to fetch from Google Script" });
        }
    }

    // ২. POST রিকোয়েস্ট: বই বা লেখক সেভ করা
    if (req.method === 'POST') {
        const payload = JSON.parse(req.body);
        
        // পাসওয়ার্ড চেক
        if (payload.adminPass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        try {
            // আসল Google Script এ ডাটা পাঠানো (GAS JSON বডি সাপোর্ট করে)
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
