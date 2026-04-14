export default async function handler(req, res) {
    const scriptURL = process.env.GAS_SCRIPT_URL;
    const adminPass = process.env.ADMIN_PASSWORD;

    // লগইন চেক এবং ডাটা রিড
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

        // চেক করুন পাসওয়ার্ড আসলেই মিলছে কি না
        if (!pass || pass !== adminPass) {
            console.log("Unauthorized attempt with pass:", pass); // এটি Vercel logs এ দেখা যাবে
            return res.status(401).json({ error: "Unauthorized" });
        }

        let url = `${scriptURL}?pass=${pass}`;
        if (action === 'delete') url += `&action=delete&id=${id}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Google Script connection failed" });
        }
    }

    // ডাটা সেভ (POST)
    if (req.method === 'POST') {
        try {
            const response = await fetch(scriptURL, {
                method: 'POST',
                body: new URLSearchParams(req.body).toString(),
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });
            const result = await response.json();
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: "Data save failed" });
        }
    }
}
