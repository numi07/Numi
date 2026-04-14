// api/contact.js
export default async function handler(req, res) {
    const scriptURL = process.env.GAS_SCRIPT_URL;
    const adminPass = process.env.ADMIN_PASSWORD;

    // GET রিকোয়েস্ট (মেসেজ রিড করার জন্য)
    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

        // পাসওয়ার্ড চেক
        if (pass !== adminPass) {
            return res.status(401).json({ error: "Unauthorized" });
        }

        // ডিলিট বা রিড অ্যাকশন
        let url = `${scriptURL}?pass=${pass}`;
        if (action === 'delete') url += `&action=delete&id=${id}`;

        const response = await fetch(url);
        const data = await response.json();
        return res.status(200).json(data);
    }

    // POST রিকোয়েস্ট (মেসেজ পাঠানোর জন্য)
    if (req.method === 'POST') {
        const response = await fetch(scriptURL, {
            method: 'POST',
            body: new URLSearchParams(req.body).toString(),
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        return res.status(200).json({ success: true });
    }
}
