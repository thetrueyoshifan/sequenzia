const config = require('../config.json');
let web = require('../web.config.json');
const moment = require('moment');
const feed = require('feed').Feed;
const podcast = require('podcast');
const useragent = require('express-useragent');
if (web.Base_URL)
    web.base_url = web.Base_URL;

module.exports = async (req, res, next) => {
    function params(_removeParams, _addParams, _url, searchOnly) {
        let _params = new URLSearchParams((new URL(req.protocol + '://' + req.get('host') + req.originalUrl)).search);
        if (_url) {
            _params = new URLSearchParams(_url);
        }

        _removeParams.forEach(param => {
            if (_params.has(param)) {
                _params.delete(param);
            }
        })
        _addParams.forEach(param => {
            if (_params.has(param[0])) {
                _params.delete(param[0]);
            }
            _params.append(param[0], param[1]);
        })
        if (searchOnly) {
            return req.originalUrl + `?${_params.toString()}`
        } else {
            return req.protocol + '://' + req.get('host') + req.originalUrl + `?${_params.toString()}`
        }

    }

    let results = {
        sidebar: req.session.sidebar,
        next_episode: req.session.kongou_next_episode,
        albums: (req.session.albums && req.session.albums.length > 0) ? req.session.albums : [],
        theaters: (req.session.media_groups && req.session.media_groups.length > 0) ? req.session.media_groups : [],
        applications_list: req.session.applications_list,
        ...res.locals.response,
        webconfig: web,
        query: req.query
    };
    if (res.locals.imagedata) {
        Object.assign(results, { imageData: res.locals.imagedata });
    }

    if (req.query.responseType && req.query.responseType === 'podcast') {
        const serverIcon = (req.query.image) ? decodeURI(req.query.image) : (results.page_image) ? results.page_image : (results.active_svr) ? (web.server_avatar_overides && web.server_avatar_overides[results.active_svr]) ? web.server_avatar_overides[results.active_svr] : req.session.discord.servers.list.filter(e => e.serverid === results.active_svr).map(e => e.icon) : req.protocol + '://' + req.get('host') + '/static/img/sequenzia-logo-podcast.png';
        const podcastResponse = new podcast({
            title: `${results.full_title}`,
            itunesSubtitle: web.site_name,
            description: (results.description) ? results.description : 'Sequenzia Podcast Feed',
            itunesSummary: (results.description) ? results.description : 'Sequenzia Podcast Feed',
            imageUrl: serverIcon,
            itunesImage: serverIcon,
            siteUrl: web.base_url,
            author: web.site_name,
            itunesAuthor: web.site_name,
            itunesOwner: { name:web.company_name, email:web.company_email },
            itunesExplicit: false,
            itunesCategory: 'Uncategorized',
            itunesType: "episodic",
            feedUrl: params(['blind_key'],[['responseType', 'podcast'], ['key', req.session.discord.user.token_static]]),
            copyright: `Copyright (c) ${web.company_name} ${moment(Date.now()).format('YYYY')}`,
            generator: "Sequenzia Digital Media Management Server",
            language: "en"
        });
        if (results.results) {
            results.results.forEach(item => {
                let title = (item.content.single.length > 0) ? item.content.single : item.entities.filename
                if (item.content.single.length === 0) {
                    title = title.split('.')
                    title.pop()
                    title = title.join('.').split('(')
                    if (title.length > 1 && title[title.length - 1].length > 0 && !isNaN(parseInt(title[title.length - 1].substring(0, 1)))) {
                        title.pop()
                    }
                    title = title.join('(').split('_').join(' ')
                }
                if (item.pinned) {
                    title = '⭐️ ' + title
                }
                let podcastItem = {
                    guid: item.id,
                    title,
                    itunesTitle: title,
                    description: item.content.clean,
                    content: item.content.clean.split('\n').join('<br/>'),
                    itunesSummary: item.content.clean,
                    link: `${web.base_url}${results.call_uri}?search=eid:${item.eid}`,
                    date: moment(item.date.iso).toDate(),
                }
                if (item.entities.download && item.entities.download.length > 5 && !(item.entities.download.includes('/stream/'))) {
                    podcastItem.enclosure = {
                        url: `${item.entities.download}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}`,
                        size: item.entities.meta.filesize * 1024000,
                        type: `audio/${item.entities.filename.split('.').pop().toLowerCase()}`
                    }
                } else if (item.entities.filename) {
                    podcastItem.enclosure = {
                        url: `${web.base_url}/stream/${item.entities.meta.fileid}/${encodeURIComponent(item.entities.filename)}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}`,
                        size: item.entities.meta.filesize * 1024000,
                        type: `audio/${item.entities.filename.split('.').pop().toLowerCase()}`
                    }
                }
                podcastResponse.addItem(podcastItem)
            })
        }
        res.header("Content-Type", "text/xml").send(podcastResponse.buildXml());
    } else if (req.query.responseType && ['xml', 'json', 'atom'].indexOf(req.query.responseType) !== -1 ) {
        if (req.session.discord.user.token_login && req.session.discord.user.token_static) {
            const serverIcon = (results.page_image) ? results.page_image : (results.active_svr) ? (web.server_avatar_overides && web.server_avatar_overides[results.active_svr]) ? web.server_avatar_overides[results.active_svr] : req.session.discord.servers.list.filter(e => e.serverid === results.active_svr).map(e => e.icon) : req.protocol + '://' + req.get('host') + '/static/img/sequenzia-logo-podcast.png';
            const xmlResponse = new feed({
                title: `${results.full_title}`,
                description: (results.description) ? results.description : 'Sequenzia Response Feed',
                id: params(['key', 'blind_key'],[]),
                link: params(['responseType', 'key', 'blind_key'],[]),
                language: "en",
                image: serverIcon,
                favicon: req.protocol + '://' + req.get('host') + '/favicon.ico',
                copyright: `Copyright (c) ${web.company_name} ${moment(Date.now()).format('YYYY')}`,
                generator: "Sequenzia Digital Media Management Server",
                feedLinks: {
                    json: params(['blind_key'],[['responseType', 'json'], ['key', req.session.discord.user.token_static]]),
                    atom: params(['blind_key'],[['responseType', 'atom'], ['key', req.session.discord.user.token_static]])
                },
                author: {
                    name: web.site_name,
                    email: "",
                    link: web.base_url
                }
            })
            if (results.results) {
                results.results.forEach(item => {
                    let xmlItem = {
                        title: (item.content.single > 0) ? item.content.single : item.entities.filename,
                        id: item.id,
                        link: `${web.base_url}${results.call_uri}?search=eid:${item.eid}`,
                        description: item.content.clean,
                        author: [
                            {
                                name: `${item.server.name}:/${item.channel.class_name}/${item.channel.name}`,
                                email: "",
                                link: web.base_url
                            }
                        ],
                    }
                    if (item.date.iso) {
                        xmlItem.date = moment(item.date.iso).toDate()
                    }
                    if (item.entities.preview || item.entities.full) {
                        if (results.call_uri === '/gallery') {
                            xmlItem.content = `<img src='${(item.entities.preview) ? item.entities.preview : `${item.entities.full}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}`}'/>`
                            xmlItem.image = `${item.entities.full}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}`
                        } else {
                            xmlItem.content = `<a href='${item.entities.download}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}'>${(item.content.single > 0) ? item.content.single : item.entities.filename}</a>`
                            xmlItem.enclosure = {
                                url: `${item.entities.full}${(!config.bypass_cds_check) ? "?key=" + req.session.discord.user.token_static : ""}`
                            }
                        }
                    }

                    xmlResponse.addItem(xmlItem)
                })
            }
            switch (req.query.responseType) {
                case "json":
                    res.json(xmlResponse.json1());
                    break;
                case "atom":
                    res.header("Content-Type", "text/xml").send(xmlResponse.atom1());
                    break;
                case "xml":
                    res.header("Content-Type", "text/xml").send(xmlResponse.rss2());
                    break;
                default:
                    res.status(400);
                    break;
            }
        } else {
            res.status(500).send('Missing Static Token or Blind Token')
        }
    } else if (req.query.json && req.query.json === 'true') {
        res.json(results)
    } else if (req.query && req.query['lite_mode'] === 'true') {
        if (results.call_uri === '/gallery') {
            res.render('gallery_lite', results);
        } else if (results.call_uri === '/files') {
            res.render('file_lite', results);
        } else if (results.call_uri === '/cards') {
            res.render('card_lite', results);
        } else {
            res.render('home_lite', results);
        }
    } else {
        if (results.call_uri === '/gallery') {
            res.render('gallery_list', results);
        } else if (results.call_uri === '/listTheater') {
            res.render('episode_list', results);
        } else if (results.call_uri === '/files') {
            res.render('file_list', results);
        } else if (results.call_uri === '/cards') {
            res.render('card_list', results);
        } else  if (results.call_uri === '/tvTheater') {
            res.render('kms_shows', results);
        } else if (results.call_uri === '/home' || results.call_uri === '/homeImage') {
            res.json(results)
        } else if (results.call_uri === '/start') {
            res.render('home_embedded', results);
        } else if (results.call_uri === '/ads-micro') {
            res.render('ambient_direct', results);
        } else if (results.call_uri === '/ads-widget') {
            res.render('ambient_widget', results);
        } else if (results.call_uri === '/ambient-refresh') {
            res.json(results);
        } else {
            res.status(500).send('URI unhandled');
        }
    }
    res.locals.response = undefined;
    res.locals.imagedata = undefined;
}
