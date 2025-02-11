const web = require("../web.config.json");
const config = require('../host.config.json');
const {sqlPromiseSafe} = require("./sqlClient");

module.exports = async (req, res, next) => {
    if (req.session.discord && req.session.cache && req.session.cache.channels_view) {
        const call_uri = req.originalUrl.split('/')[1].split('?')[0]
        if (req.session.lite_mode === "true") {
            next();
        } else if (req.query && req.query['lite_mode'] === 'true') {
            req.session.lite_mode = true
            next();
        } else if (call_uri === 'juneOS') {
            const history_urls = await sqlPromiseSafe(`SELECT * FROM sequenzia_navigation_history WHERE user = ? ORDER BY saved DESC, date DESC`, [ req.session.discord.user.id ]);
            res.render('init-layout', {
                server: req.session.server_list,
                download: req.session.discord.servers.download,
                manage_channels: req.session.discord.channels.manage,
                write_channels: req.session.discord.channels.write,
                discord: req.session.discord,
                user: req.session.user,
                webconfig: web,
                albums: (req.session.albums && req.session.albums.length > 0) ? req.session.albums : [],
                theaters: (req.session.media_groups && req.session.media_groups.length > 0) ? req.session.media_groups : [],
                next_episode: req.session.kongou_next_episode,
                sidebar: req.session.sidebar,
                applications_list: req.session.applications_list,
                history: history_urls.rows
            })
        } else if (req.headers && req.headers['x-requested-with'] && req.headers['x-requested-with'] === 'SequenziaXHR' && req.headers['x-requested-page'] || (req.query && (req.query.json || req.query.responseType))) {
            next();
        } else if ( call_uri === 'home' || call_uri === '' ) {
            res.render('home_lite', {
                url: req.url,
                server: req.session.server_list,
                download: req.session.discord.servers.download,
                manage_channels: req.session.discord.channels.manage,
                write_channels: req.session.discord.channels.write,
                discord: req.session.discord,
                user: req.session.user,
                sidebar: req.session.sidebar,
                albums: (req.session.albums && req.session.albums.length > 0) ? req.session.albums : [],
                theaters: (req.session.media_groups && req.session.media_groups.length > 0) ? req.session.media_groups : [],
                next_episode: req.session.kongou_next_episode,
                applications_list: req.session.applications_list,
            })
        } else {
            res.redirect(`/juneOS#${req.originalUrl}`);
        }
    } else if (req.session.discord) {
        res.redirect('/discord/refresh')
    } else {
        res.end();
    }
}
