const { sqlPromiseSafe } = require('../js/sqlClient');

module.exports = async (req, res, next) => {
    try {
        if (req.body) {
            console.log(req.body)
            if (req.body.disabled_channels) {
                req.session.disabled_channels = req.body.disabled_channels.map(e => parseInt(e));
                await sqlPromiseSafe(`DELETE
                                      FROM sequenzia_hidden_channels
                                      WHERE user = ?
                                        AND user IS NOT NULL`, [req.session.discord.user.id]);

                if (req.body.disabled_channels.length > 0) {
                    await req.body.disabled_channels.forEach(async e => {
                        await sqlPromiseSafe(`INSERT INTO sequenzia_hidden_channels
                                            SET user = ?, cid = ?`, [req.session.discord.user.id, e]);
                    });
                }
            }
            if (req.body.user_profile) {

            }
            res.status(200).json({});
        } else {
            res.status(400).json({ error: 'No Data Received' })
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: e.message })
    }
}
