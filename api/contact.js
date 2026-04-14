export default async function handler(req, res) {
    const scriptURL = process.env.GAS_SCRIPT_URL;
    const adminPass = process.env.ADMIN_PASSWORD;

    // ১. মেসেজ রিড এবং ডিলিট করার জন্য (GET Request)
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

        // পাসওয়ার্ড চেক
        if (pass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        let url = `${scriptURL}?pass=${pass}`;
        if (action === 'delete') url += `&action=delete&id=${id}`;

        try {
            const response = await fetch(url);
            const data = await response.json();
            return res.status(200).json(data);
        } catch (error) {
            return res.status(500).json({ error: "Fetch failed" });
        }
    }

    // ২. নতুন মেসেজ পাঠানোর জন্য (POST Request)
    if (req.method === 'POST') {
        try {
            // বডি ডাটা হ্যান্ডেল করা
            const bodyData = typeof req.body === 'string' ? req.body : new URLSearchParams(req.body).toString();

            const response = await fetch(scriptURL, {
                method: 'POST',
                body: bodyData,
                headers: { 
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json'
                }
            });
            
            return res.status(200).json({ success: true });
        } catch (error) {
            return res.status(500).json({ error: "Post failed" });
        }
    }
}
