export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');

    const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
    const REPO_OWNER = process.env.REPO_OWNER || 'mighuelfreitas40-sys';
    const REPO_NAME = process.env.REPO_NAME || 'monitor-stats';
    const FILE_PATH = 'stats.json';

    try {
        const fileRes = await fetch(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${FILE_PATH}`, {
            headers: { Authorization: `token ${GITHUB_TOKEN}` }
        });

        let stats = { total: 26000, games: {} };

        if (fileRes.status === 200) {
            const fileData = await fileRes.json();
            const content = Buffer.from(fileData.content, 'base64').toString('utf8');
            try {
                stats = JSON.parse(content);
            } catch {}
        }

        return res.status(200).json({
            total: stats.total || 0,
            games: stats.games || {}
        });
    } catch (e) {
        return res.status(500).json({ error: 'internal error' });
    }
}
