export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'method not allowed' });
    }

    const { gameName } = req.body || {};
    const gName = (gameName || 'Desconhecido').toString().substring(0, 50);

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'mighuelfreitas40-sys';
    const REPO_NAME = process.env.REPO_NAME || 'monitor-stats';
    const FILE_PATH = 'stats.json';

    try {
        const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        let stats = { total: 26000, games: {} };
        let sha = null;

        if (fileRes.status === 200) {
            const fileData = await fileRes.json();
            sha = fileData.sha;
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            try {
                stats = JSON.parse(content);
            } catch {}
        }

        stats.total = (stats.total || 26000) + 1;
        stats.games[gName] = (stats.games[gName] || 0) + 1;

        const newContent = Buffer.from(JSON.stringify(stats, null, 2)).toString('base64');

        const updateRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            method: 'PUT',
            headers: {
                Authorization: `token ${GITHUB_TOKEN}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `log: ${gName}`,
                content: newContent,
                sha: sha
            })
        });

        if (updateRes.status === 200 || updateRes.status === 201) {
            return res.status(200).json({ ok: true });
        } else {
            return res.status(500).json({ error: 'failed to update' });
        }
    } catch (e) {
        return res.status(500).json({ error: 'internal error' });
    }
}
