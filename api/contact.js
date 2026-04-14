export default async function handler(req, res) {
    const scriptURL = process.env.GAS_SCRIPT_URL;
    const adminPass = process.env.ADMIN_PASSWORD;

    if (req.method === 'GET') {
        const { pass, action, id } = req.query;

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
            return res.status(500).json({ error: "Failed to fetch from Google Script" });
        }
    }

    if (req.method === 'POST') {
        try {
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
