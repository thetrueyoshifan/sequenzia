let _Size = null;
let _Color = null;
let unpackingJobs = new Map();
let offlineDownloadController = new Map();
let notificationControler = null;
let performaceMode = (getCookie("performaceMode") !== null) ? getCookie("performaceMode") === 'true' : false;
let menuLocation = (getCookie("menuLocation") !== null) ? getCookie("menuLocation") : false;
function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
function getCookie(cname) {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return null;
}

$(window).on('hashchange', () => {
    if (location.hash.length > 1 && location.hash.substring(1).startsWith('/')) {
        getNewContent([], [], location.hash.substring(1))
    }
});

function decodeURLRecursively(uri) {
    while (uri !== decodeURIComponent(uri || '')){
        uri = decodeURIComponent(uri);
    }
    return uri;
}
function params(_removeParams, _addParams, _url) {
    let _URL = new URL(window.location.href);
    let _params = new URLSearchParams(_URL.search);
    if (_url) {
        _URL = new URL(window.location.origin + _url);
        _params = new URLSearchParams(_URL.search);
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
        _params.set(param[0], encodeURIComponent(decodeURLRecursively(param[1])));
    })
    return `${_URL.pathname}?${_params.toString()}`

}

function dct() {
    const d = new Date();
    let h = d.getHours()
    let m = d.getMinutes();
    if (h < 10) { h = `0${h}` }
    if (m < 10) { m = `0${m}` }
    document.getElementById('time').innerHTML = `${h}:${m}`;
    dc();
}
function ddt() {
    const d = new Date();
    let mth = month[d.getMonth()];
    let dy = d.getDate();
    document.getElementById('date').innerHTML = ` ${mth} ${dy}`;
    dd();
}
function ddwt() {
    const d = new Date();
    let dow = days[d.getDay()];
    document.getElementById('day').innerHTML = `${dow}day`;
    ddw();
}

// Time
function dc(){
    setTimeout(dct,1000)
}
// Date
function dd(){
    setTimeout(ddt,5000)
}
// Day
function ddw(){
    setTimeout(ddwt,5000)
}

function getNewContent(remove, add, url) {
    if (url.startsWith('/tvTheater') || url.startsWith('/listTheater')) {
        document.getElementById('kmsBootDisplay').classList.remove('d-none');
    } else if (url.startsWith('/app')) {
        const appName = url.split('/app/').pop().split('/')[1].split('app_').pop().split('?')[0].trim();
        if (document.querySelector(`meta[name="seq-app-meta-${appName}_splashLogo"]`) &&
            document.querySelector(`meta[name="seq-app-meta-${appName}_splashLogo"]`).hasAttribute('content')) {
            document.getElementById('appBootLogo').src = document.querySelector(`meta[name="seq-app-meta-${appName}_splashLogo"]`).getAttribute('content')
        } else {
            document.getElementById('appBootLogo').src = "/static/img/sequenzia-logo-nav.png"
        }
        if (document.querySelector(`meta[name="seq-app-meta-${appName}_splashBg"]`) &&
            document.querySelector(`meta[name="seq-app-meta-${appName}_splashBg"]`).hasAttribute('content')) {
            document.getElementById('appBootBackground').style.backgroundImage = 'url(' + document.querySelector(`meta[name="seq-app-meta-${appName}_splashBg"]`).getAttribute('content') + ')';
        } else {
            document.getElementById('appBootBackground').style.backgroundImage = 'url(/static/img/app-background.jpg)'
        }
        if (document.querySelector(`meta[name="seq-app-meta-${appName}_splashAccent"]`) &&
            document.querySelector(`meta[name="seq-app-meta-${appName}_splashAccent"]`).hasAttribute('content')) {
            document.getElementById('appBootAccent').classList.remove('hidden')
            document.getElementById('appBootAccent').querySelector('img').src = document.querySelector(`meta[name="seq-app-meta-${appName}_splashAccent"]`).getAttribute('content')
        } else {
            document.getElementById('appBootAccent').classList.add('hidden')
            document.getElementById('appBootAccent').querySelector('img').src = "/static/img/kongou-group.png"
        }
        if (document.querySelector(`meta[name="seq-app-meta-${appName}_splashPublisher"]`) &&
            document.querySelector(`meta[name="seq-app-meta-${appName}_splashPublisher"]`).hasAttribute('content')) {
            document.getElementById('appBootPublisher').src = document.querySelector(`meta[name="seq-app-meta-${appName}_splashPublisher"]`).getAttribute('content')
        } else {
            document.getElementById('appBootPublisher').src = "/static/img/acr-logo.png"
        }

        document.getElementById('appBootDisplay').classList.remove('d-none');
    } else {
        document.getElementById('bootUpDisplay').classList.remove('d-none');
    }
    $.when($('#bootBackdrop').fadeIn(1000)).done(() => {
        let _url = (() => {
            try {
                if (url) { return url.split('://' + window.location.host).pop() }
                if (window.location.hash.substring(1).length > 4) { return window.location.hash.substring(1).split('://' + window.location.host).pop() }
                return null
            } catch (e) {
                console.error("Failed to access URL data, falling back")
                console.error(e)
                return null
            }
        })()
        if (_url && _url.startsWith('/') && _url.substring(1).length > 0 && _url.substring(1).split('?')[0].length < 0) {
            $.toast({
                type: 'error',
                title: 'Navigation Failure',
                subtitle: 'Now',
                content: `Invalid Path JOS:/${_url}`,
                delay: 5000,
            });
            responseComplete = true
            return false;
        }
        try {
            let _params = new URLSearchParams(_url.split('?').splice(1).join('?'));
            const _pathname = _url.split('?')[0];

            if (add || remove) {
                for (let e of remove) {
                    _params.delete(e)
                }
                for (let e of add) {
                    if (_params.has(e[0])) {
                        _params.delete(e[0])
                    }
                    _params.set(e[0], e[1])
                }
                _url = `${_pathname}?${_params.toString()}`
            }
        } catch (e) {
            $.toast({
                type: 'error',
                title: 'Navigation Failure',
                subtitle: 'Now',
                content: `Parser Failure${(e && e.message) ? '\n' + e.message : ''}`,
                delay: 5000,
            });
            responseComplete = true
            return false;
        }
        console.log(_url);
        window.location.href = `/juneOS#${_url}`;
    })
}
$.toastDefaults = {
    position: 'top-right', /** top-left/top-right/top-center/bottom-left/bottom-right/bottom-center - Where the toast will show up **/
    dismissible: true,
    stackable: true,
    pauseDelayOnHover: true,
    style: {
        toast: '', /** Classes you want to apply separated my a space to each created toast element (.toast) **/
        info: '',  /** Classes you want to apply separated my a space to modify the "info" type style  **/
        success: '', /** Classes you want to apply separated my a space to modify the "success" type style  **/
        warning: '', /** Classes you want to apply separated my a space to modify the "warning" type style  **/
        error: '', /** Classes you want to apply separated my a space to modify the "error" type style  **/
    }
};
function getSidebar(refreshSidebar, disableModels) {
    $.ajax({async: true,
        url: `/sidebar${(refreshSidebar) ? '?refresh=true' : ''}`,
        type: "GET", data: '',
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'SequenziaXHR',
            'x-Requested-Page': 'SeqSidebar'
        },
        success: function (response, textStatus, xhr) {
            let _sb = $(response).find('#sidebar')
            $("#accordionSidebar").html(_sb);
            if(isTouchDevice()===false) {
                $('[data-tooltip="tooltip"]').tooltip()
                $('[data-tooltip="tooltip"]').tooltip('hide')
            }
        },
        error: function (xhr) {
            if (xhr.status >= 403) {
                $.toast({
                    type: 'error',
                    title: 'Page Failed',
                    subtitle: 'Now',
                    content: `Failed to load sidebar, Try Again!`,
                    delay: 5000,
                });
            }
        }
    });
}
function getHistory() {
    document.getElementById('menuLoaderImageHistory').classList.remove('hidden');
    $.ajax({async: true,
        url: `/ambient-history?command=getAll`,
        type: "GET", data: '',
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'SequenziaXHR',
            'X-Requested-Page': 'SeqHistoryFromHome'
        },
        success: function (response, textStatus, xhr) {
            document.getElementById('menuBodyImageHistory').innerHTML = response
            document.getElementById('menuLoaderImageHistory').classList.add('hidden');
        },
        error: function (xhr) {
            document.getElementById('menuBodyImageHistory').innerHTML = `<div class='align-content-center ml-1'><i class="fas fa-times mr-2"></i><span>Failed to load history data</span>`
            document.getElementById('menuLoaderImageHistory').classList.add('hidden');
        }
    });
}

function toggleFavorite() {
    const channelid = document.getElementById('midSearch').getAttribute('channel');
    const eid = document.getElementById('midSearch').getAttribute('eid');
    const star = document.querySelectorAll(`.ajax-imageFav`)
    let isFavorite = false;
    if (star.length > 0)
        isFavorite = !(star[0].classList.contains('d-none'));

    sendBasic(channelid, eid, (isFavorite) ? `Unpin${(channelid === null) ? 'User' : ''}`: `Pin${(channelid === null) ? 'User' : ''}`, true);

    return false;
}
function sendBasic(channelid, messageid, action, confirm) {
    $.ajax({async: true,
        type: "post",
        url: "/actions/v1",
        data: { 'channelid': channelid,
            'messageid': messageid,
            'action': action },
        cache: false,
        headers: {
            'X-Requested-With': 'SequenziaXHR'
        },
        success: function (res, txt, xhr) {
            if (xhr.status < 400) {
                console.log(res);
                if (confirm) { $.snack('success', `${res}`, 5000) };
                afterAction(action, undefined, messageid, confirm);
            } else {
                console.log(res.responseText);
            }
        },
        error: function (xhr) {
            $.toast({
                type: 'error',
                title: 'Failed to complete action',
                subtitle: 'Now',
                content: ``,
                delay: 5000,
            });
        }
    });
    return false;
}
function afterAction(action, data, id, confirm) {
    console.log('Message Request Sent!')
    if (action === 'Pin' || action === 'Unpin') {
        [].forEach.call(document.querySelectorAll(`.ajax-imageFav`), function (el) {
            if (action.startsWith('Un')) {
                el.classList.add('d-none')
            } else {
                el.classList.remove('d-none')
            }
        });
    } else if (action === 'PinUser' || action === 'UnpinUser') {
        [].forEach.call(document.querySelectorAll(`#fav-${id} > i.fas.fa-star`), function (el) {
            if (action.startsWith('Un')) {
                el.classList.remove('favorited')
            } else {
                el.classList.add('favorited')
            }
        });
    }
}

function authwareLogin() {
    try {
        const code = document.getElementById('expressLoginCode').value.trim();
        $.ajax({
            async: true,
            url: `/transfer?code=${code}`,
            type: "GET", data: '',
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR'
            },
            success: function (response, textStatus, xhr) {
                $.toast({
                    type: 'success',
                    title: 'Express Login',
                    subtitle: 'Now',
                    content: `${response}`,
                    delay: 5000,
                });
                document.getElementById('expressLoginCode').value = '';
            },
            error: function (xhr) {
                $.toast({
                    type: 'error',
                    title: 'Express Login Error',
                    subtitle: 'Now',
                    content: ``,
                    delay: 5000,
                });
            }
        });
    } catch (e) {
        $.toast({
            type: 'error',
            title: 'Express Login Error',
            subtitle: 'Now',
            content: `Client Script Error - ${e.message}`,
            delay: 5000,
        });
    }
}
function isTouchDevice(){
    return true === ("ontouchstart" in window || window.DocumentTouch && document instanceof DocumentTouch);
}
async function clearCache(list) {
    await caches.keys().then(cacheNames => {
        console.log(`Local Caches Stores:`);
        return Promise.all(
            cacheNames.filter(e => !list || (list && list.filter(f => e.includes(f)).length > 0)).map(cache => {
                console.log(cache)
                console.log('JulyOS Kernel: Deleteing Old Cache - ' + cache);
                return caches.delete(cache);
            })
        );
    })
}
async function clearKernelCache() {
    await clearCache(['generic', 'kernel', 'config', 'temp-']);
    await kernelRequestData({type: 'INSTALL_KERNEL'})
    window.location.reload();
}

let noAmbientTimer = false;
let pageReady = false
let refreshLayoutThrottleTimeout
function refreshLayout() {
    if (pageReady) {
        if (refreshLayoutThrottleTimeout) {
            clearTimeout(refreshLayoutThrottleTimeout);
        }

        refreshLayoutThrottleTimeout = setTimeout(function () {
            if (window.innerHeight && window.innerWidth) {
                const ratio = (window.innerHeight / window.innerWidth);
                console.log(_Size[2])
                console.log(ratio)
                document.querySelector('.container').classList.remove('backdrop-wide');
                document.querySelector('.container').classList.remove('backdrop-neutral');
                document.querySelector('.container').classList.remove('backdrop-portait');
                if ((ratio <= 0.88 && _Size[2] < 0.97) || (ratio >= 1.2 && ratio <= 2.5 && _Size[2] >= 1)) {
                    document.getElementById('fullBG').style.display = 'initial';
                    document.getElementById('previewBG').style.display = 'none';
                    document.getElementById('portraitBG').style.display = 'none';
                    document.getElementById('landscapeBG').style.display = 'none';
                    document.querySelector('.container').classList.add('backdrop-neutral');
                } else {
                    document.getElementById('fullBG').style.display = 'none';
                    if (_Size[2] < 0.97) {
                        // Widescreen Image
                        document.getElementById('portraitBG').style.display = 'none';
                        document.getElementById('landscapeBG').style.display = 'initial';
                        document.querySelector('.container').classList.add('backdrop-wide');
                    } else {
                        // Portrait Image
                        document.querySelector('.container').classList.add('backdrop-portait');
                        document.getElementById('portraitBG').style.display = 'initial';
                        document.getElementById('landscapeBG').style.display = 'none';
                    }
                    document.getElementById('previewBG').style.display = 'initial';
                }
                $('#cover').fadeTo(1000, 0);
            }
        }, 1000);
    }
}
function getRandomImage() {
    //try {
        $.ajax({
            async: true,
            url: `/homeImage${(window.location.search && window.location.search.startsWith('?')) ? window.location.search : ''}`,
            type: "GET", data: '',
            processData: false,
            contentType: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR',
                'X-Requested-Page': 'SeqContent'
            },
            success: function (json, textStatus, xhr) {
                if (json.randomImagev2 && json.randomImagev2.length > 0) {
                    const previewImage = json.randomImagev2[0].previewImage;
                    const fullImage = json.randomImagev2[0].fullImage;
                    document.getElementById('midSearch').setAttribute('channel', json.randomImagev2[0].channelId);
                    document.getElementById('midSearch').setAttribute('eid', json.randomImagev2[0].eid);
                    _Size = [ json.randomImagev2[0].sizeH, json.randomImagev2[0].sizeW, json.randomImagev2[0].sizeR ];
                    _Color = [ json.randomImagev2[0].colorR, json.randomImagev2[0].colorG, json.randomImagev2[0].colorB ];

                    if (!pageReady) {
                        $('#previewBG')[0].style.backgroundImage = `url('${previewImage}')`;
                        $('#fullBG')[0].style.backgroundImage = `url('${fullImage}')`;
                        $('.full-image-holder').attr('src', fullImage);
                        $('.ajax-downloadLink').attr("href", fullImage);
                        $('.ajax-imageLink').attr("onClick", `getNewContent([], [], "${json.randomImagev2[0].jumpLink}"); return false;`);
                        $('.ajax-imageLocation').text(`${json.randomImagev2[0].className} / ${json.randomImagev2[0].channelName}`);
                        $('.ajax-imageDate').text(json.randomImagev2[0].date);
                        $('.middle-indicator').removeClass('hidden');
                        if (json.randomImagev2[0].pinned) {
                            $('.ajax-imageFav').removeClass('d-none');
                        } else {
                            $('.ajax-imageFav').addClass('d-none');
                        }
                        pageReady = true;
                        refreshLayout();
                    } else {
                        $.when($('#cover').fadeTo(1000, 1)).done(() => {
                            $('#previewBG')[0].style.backgroundImage = `url('${previewImage}')`;
                            $('#fullBG')[0].style.backgroundImage = `url('${fullImage}')`;
                            $('.full-image-holder').attr('src', fullImage);
                            $('.ajax-downloadLink').attr("href", fullImage);
                            $('.ajax-imageLink').attr("onClick", `getNewContent([], [], "${json.randomImagev2[0].jumpLink}"); return false;`);
                            $('.ajax-imageLocation').text(`${json.randomImagev2[0].className} / ${json.randomImagev2[0].channelName}`);
                            $('.ajax-imageDate').text(json.randomImagev2[0].date);
                            $('.middle-indicator').removeClass('hidden');
                            if (json.randomImagev2[0].pinned) {
                                $('.ajax-imageFav').removeClass('d-none');
                            } else {
                                $('.ajax-imageFav').addClass('d-none');
                            }
                            pageReady = true;
                            refreshLayout();
                        });
                    }
                    setTimeout(() => {document.getElementById('midSearch').classList.add('shine-effect-go');}, 3000);
                } else if (xhr.status >= 403) {
                    $.toast({
                        type: 'error',
                        title: 'Random Image Error',
                        subtitle: 'Now',
                        content: `No Results Found`,
                        delay: 5000,
                    });
                }
            },
            error: function (xhr) {
                if (xhr.status  >= 403) {
                    $.toast({
                        type: 'error',
                        title: 'Random Image Error',
                        subtitle: 'Now',
                        content: ``,
                        delay: 5000,
                    });
                }
            }
        });
    // } catch (e) {
    //     $.toast({
    //         type: 'error',
    //         title: 'Random Image Error',
    //         subtitle: 'Now',
    //         content: `Client Script Error - ${e.message}`,
    //         delay: 5000,
    //     });
    // }
}
function verifyNetworkAccess() {
    $.ajax({async: true,
        url: '/ping?json=true',
        type: "GET", data: '',
        processData: false,
        contentType: false,
        json: true,
        headers: {
            'X-Requested-With': 'SequenziaXHR'
        },
        timeout: 5000,
        success: function (res, txt, xhr) {
            if (xhr.status === 200 && !res.loggedin) {
                document.getElementById('loginUserButtons').classList.remove('hidden');
                document.getElementById('mainUserButtons').classList.add('hidden');
                document.getElementById('loginCodeDisplay').innerHTML = res.code || 'XXXXXX'
                noAmbientTimer = true;
                setInterval(function () {
                    $.ajax({async: true,
                        url: '/device-login?checklogin=true',
                        type: "GET",
                        processData: false,
                        contentType: false,
                        success: function (response) {
                            if (response === 'true') {
                                location.href = '/discord/refresh'
                            }
                        },
                        error: function (response) {
                        }
                    });
                }, 60000);
                /*$.toast({
                    type: 'error',
                    title: 'Login Required',
                    subtitle: '',
                    content: `<p>You need to login to continue!</p>${(res.code) ? '<p>Express Login: <b>' + res.code + '</b></p>' : ''}<a class="btn btn-success w-100 mb-2" href="/"><i class="fas fa-sign-in-alt pr-2"></i>Login</a><br/><a class="btn btn-danger w-100" href='#_' onclick="transitionToOOBPage('/discord/login'); return false;"><i class="fas fa-folder-bookmark pr-2"></i>Local Files</a>`
                });*/
            } else if (xhr.status !== 200) {
                $.toast({
                    type: 'error',
                    title: 'Network Error',
                    subtitle: '',
                    content: `<p>Failed to verify network access!</p><a class="btn btn-danger w-100" href='#_' onclick="transitionToOOBPage('/offline'); return false;"><i class="fas fa-folder-bookmark pr-2"></i>Local Files</a>`,
                    delay: 30000,
                });
            }
        },
        error: function (error) {
            console.log(error);
            $.toast({
                type: 'error',
                title: 'Network Error',
                subtitle: '',
                content: `<p>Failed to verify network access!</p><a class="btn btn-danger w-100" href='#_' onclick="transitionToOOBPage('/offline'); return false;"><i class="fas fa-folder-bookmark pr-2"></i>Local Files</a>`,
                delay: 30000,
            });
        }
    });
}

let lastMessageAlbum
function refreshAlbumsList(messageid) {
    lastMessageAlbum = messageid
    $(`#albumItemModal`).modal('show');
    $.ajax({async: true,
        url: `/albums?command=getAll${(lastMessageAlbum) ? '&messageid=' + lastMessageAlbum : '&manage=true'}`,
        type: "GET", data: '',
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'SequenziaXHR'
        },
        success: function (response, textStatus, xhr) {
            if (xhr.status < 400) {
                $(`#albumItemBody`).html(response);
            } else {
                $(`#albumItemBody`).html('<span>Failed to get valid albums list via AJAX</span>');
            }
        },
        error: function (xhr) {
            $(`#albumItemBody`).html('<span>Failed to get albums list via AJAX</span>');
        }
    });
}
function createNewAlbum() {
    const newAlbumNameText = document.querySelector("#albumNameText");
    const newAlbumTypeSelect = document.querySelector("#albumTypeSelect");
    const newAlbumPrivacySelect = document.querySelector("#albumPrivacySelect");
    if (newAlbumNameText.value.length > 1 && newAlbumNameText.value.trim().length > 1) {
        $.ajax({async: true,
            url: `/actions/v1`,
            type: "post",
            data: {
                'album_name': newAlbumNameText.value.trim(),
                'album_uri': newAlbumTypeSelect.value,
                'album_privacy': newAlbumPrivacySelect.value,
                'action': 'CollCreate'
            },
            cache: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR'
            },
            success: function (response, textStatus, xhr) {
                if (xhr.status < 400) {
                    $(`#newAlbumForm`).collapse('hide');
                    refreshAlbumsList();
                    newAlbumNameText.value = '';
                } else {
                    $.toast({
                        type: 'error',
                        title: 'Failed to create album',
                        subtitle: 'Now',
                        content: `Server Error`,
                        delay: 5000,
                    });
                }
            },
            error: function (xhr) {
                $.toast({
                    type: 'error',
                    title: 'Failed to create album',
                    subtitle: 'Now',
                    content: ``,
                    delay: 5000,
                });
            }
        })
    } else {
        $.snack('error', `Album name must contain text`, 1500);
    }
}
function updateAlbum(aid) {
    try {
        const albumName = document.querySelector(`#album-${aid}-Text`).value;
        const albumType = document.querySelector(`#album-${aid}-Type`).value;
        const albumPrivacy = document.querySelector(`#album-${aid}-Privacy`).value;
        if (albumName.length > 1 && albumName.trim().length > 1) {
            $.ajax({async: true,
                url: `/actions/v1`,
                type: "post",
                data: {
                    'albumid': aid,
                    'album_name': albumName,
                    'album_uri': albumType,
                    'album_privacy': albumPrivacy,
                    'action': 'CollUpdate'
                },
                cache: false,
                headers: {
                    'X-Requested-With': 'SequenziaXHR'
                },
                success: function (response, textStatus, xhr) {
                    if (xhr.status < 400) {
                        refreshAlbumsList();
                    } else {
                        $.toast({
                            type: 'error',
                            title: 'Failed to update album',
                            subtitle: 'Now',
                            content: `Failed to update album due to an error`,
                            delay: 5000,
                        });
                    }
                },
                error: function (xhr) {
                    $.toast({
                        type: 'error',
                        title: 'Failed to update album',
                        subtitle: 'Now',
                        content: `Server Error`,
                        delay: 5000,
                    });
                }
            })
        } else {
            $.snack('error', `Album name must contain text`, 1500);
        }
    } catch (e) {
        $.toast({
            type: 'error',
            title: 'Failed update album',
            subtitle: 'Now',
            content: `Client Error: ${e.message}`,
            delay: 5000,
        });
    }
}
function deleteAlbum(aid) {
    try {
        $.ajax({async: true,
            url: `/actions/v1`,
            type: "post",
            data: {
                'albumid': aid,
                'action': 'CollDelete'
            },
            cache: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR'
            },
            success: function (response, textStatus, xhr) {
                if (xhr.status < 400) {
                    refreshAlbumsList();
                } else {
                    $.toast({
                        type: 'error',
                        title: 'Failed to delete album',
                        subtitle: 'Now',
                        content: `Failed to delete album due to an error`,
                        delay: 5000,
                    });
                }
            },
            error: function (xhr) {
                $.toast({
                    type: 'error',
                    title: 'Failed to delete album',
                    subtitle: 'Now',
                    content: `Does not exist`,
                    delay: 5000,
                });
            }
        })
    } catch (e) {
        $.toast({
            type: 'error',
            title: 'Failed to delete album',
            subtitle: 'Now',
            content: `Client Error: ${e.message}`,
            delay: 5000,
        });
    }
}
let ambientTimeout;
let ambientNextImageTimeout;
function setupAmbientTimers () {
    document.addEventListener("mousemove", resetAmbientTimer, false);
    document.addEventListener("mousedown", resetAmbientTimer, false);
    document.addEventListener("keypress", resetAmbientTimer, false);
    document.addEventListener("touchmove", resetAmbientTimer, false);
    dc();
    startAmbientTimer();
    setInterval(() => {
        if (!document.hidden) {
            getRandomImage();
        }
    }, 300000)
}
function startAmbientTimer() {
    if (!ambientTimeout) {
        $.when($('.container, #homeBg').fadeIn(500)).done(() => {
            document.querySelector('.container').classList.remove('disabled-pointer')
        })
        $('.ambient-items').fadeOut(500);
        document.getElementById('midSearch').classList.remove('shine-effect-go');
        document.getElementById('midSearch').classList.add('shine-effect-go');
    }
    ambientTimeout = window.setTimeout(switchToAmbientMode, 30000)
}
function resetAmbientTimer() {
    window.clearTimeout(ambientTimeout);
    startAmbientTimer();
}
function switchToAmbientMode() {
    if (!noAmbientTimer) {
        document.querySelector('.container').classList.add('disabled-pointer')
        $('.container').fadeOut(500);
        $('#homeBg').fadeOut(1000);
        $('.ambient-items').fadeIn(500);
    }
    window.clearTimeout(ambientTimeout);
    ambientTimeout = null;
}
async function stopUnpackingFiles(fileid) {
    unpackingJobs.delete(fileid)
    kernelRequestData({type: 'CANCEL_UNPACK_FILE', fileid});
}
async function updateNotficationsPanel() {
    const tempSpannedFiles = await (async () => {
        const offlineSpannedFiles = await kernelRequestData({type: 'GET_STORAGE_ALL_SPANNED_FILES'});
        if (offlineSpannedFiles) {
            return offlineSpannedFiles.filter(e => e.expires)
        } else {
            return false;
        }
    })();
    if (unpackingJobs.size !== 0 || offlineDownloadController.size !== 0 || tempSpannedFiles.length > 0) {
        let activeSpannedJob = false;
        let completedKeys = [];
        const keys = Array.from(unpackingJobs.keys()).map(e => {
            const item = unpackingJobs.get(e);
            let results = [`<a class="dropdown-item text-ellipsis d-flex align-items-baseline" style="max-width: 80vw;" title="Stop Extraction of this job" href='#_' onclick="stopUnpackingFiles('${e}'); return false;" role='button')>`]
            if (item.active) {
                results.push(`<i class="fas fa-hammer"></i>`);
                if (!item.swHandeler)
                    results.push(`<i class="fas fa-browser ${(item.active) ? ' pl-1' : ''}"></i>`);
                results.push(`<span class="text-ellipsis${(item.active || !item.swHandeler) ? ' pl-1' : ''}">${item.name} (${item.size})</span>`);
                if (item.progress) {
                    activeSpannedJob = true;
                    results.push(`<span class="pl-2 text-success">${item.progress}%</span>`);
                }
            } else {
                results.push(`<i class="fas fa-hourglass-start pr-1"></i>`);
                if (!item.swHandeler)
                    results.push(`<i class="fas fa-browser pr-1"></i>`);
                results.push(`<span class="text-ellipsis">${item.name} (${item.size})</span>`);
            }
            results.push(`</a>`);
            return results.join('\n');
        });
        const offlineKeys = Array.from(offlineDownloadController.keys()).map(e => {
            if (keys.length > 0)
                completedKeys.push(`<div class="dropdown-divider"></div>`);
            const item = offlineDownloadController.get(e);
            let results = [`<a class="dropdown-item text-ellipsis d-flex align-items-baseline" style="max-width: 80vw;" title="Stop Extraction of this job" href='#_' role='button' onclick="cancelPendingCache('${e}'); return false;")>`]
            results.push(`<i class="fas fa-download pr-2"></i>`);
            results.push(`<span class="text-ellipsis">${(item.title) ? item.title : e} (${item.totalItems})</span>`);
            results.push(`<span class="pl-2 text-success">${((item.downloaded / item.totalItems) * 100).toFixed(0)}%</span>`);
            results.push(`</a>`);
            return results.join('\n');
        });
        if (tempSpannedFiles.length > 0) {
            if (keys.length > 0 || offlineKeys.length > 0)
                completedKeys.push(`<div class="dropdown-divider"></div>`);
            completedKeys.push(...tempSpannedFiles.map(item => {
                let results = [];
                results.push(`<div style="padding: 0.5em 1.25em; display: flex; max-width: 87vw;">`)
                results.push(`<a class="text-ellipsis mr-auto d-flex align-items-baseline" style="max-width: 80vw;"  title="Save File" href="${item.href}" role='button')>`);
                results.push(`<i class="fas fa-clock mr-1"></i>`)
                if (item.play) {
                    if (item.play === 'video' || item.play === 'kms-video') {
                        results.push(`<i class="fas fa-film mr-1"></i>`)
                    } else if (item.play === 'audio') {
                        results.push(`<i class="fas fa-music mr-1"></i>`)
                    } else {
                        results.push(`<i class="fas fa-file mr-1"></i>`)
                    }
                }
                results.push(`<span class="text-ellipsis">${item.name} (${item.size})</span>`)
                results.push(`</div>`)
                return results.join('\n');
            }))
        }
        if (document.getElementById('statusPanel')) {
            $('#statusPanel').removeClass('hidden');
            if (keys.length > 0 || offlineKeys.length > 0 || completedKeys.length > 0) {
                $('#statusPanel > .dropdown > .dropdown-menu').html($([...keys, ...offlineKeys, ...completedKeys].join('\n')));
                //$('#statusMenuProgress').html($(activeProgress.join('\n')));
                if (keys.length <= 9 && keys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-' + keys.length;
                } else if (keys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-ellipsis';
                } else if (offlineKeys.length <= 9 && offlineKeys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-' + offlineKeys.length;
                } else if (offlineKeys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-ellipsis';
                } else if (completedKeys.length <= 9 && completedKeys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-' + completedKeys.length;
                } else if (completedKeys.length > 0) {
                    document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-ellipsis';
                }
            } else {
                $('#statusPanel > .dropdown > .dropdown-menu').html('<span class="dropdown-header">No Active Jobs</span>');
                document.getElementById('statusMenuIndicator').classList = 'fas pl-2 fa-square-0';
            }
        }
        if (activeSpannedJob) {
            document.getElementById('statusMenuIcon').classList = 'fas fa-laptop-arrow-down fa-fade';
        } else if (unpackingJobs.size !== 0) {
            document.getElementById('statusMenuIcon').classList = 'fas fa-cog fa-spin';
        } else if (offlineKeys.length > 0) {
            document.getElementById('statusMenuIcon').classList = 'fas fa-sync fa-spin';
        } else if (tempSpannedFiles.length !== 0) {
            document.getElementById('statusMenuIcon').classList = 'fas fa-sd-card';
            clearInterval(notificationControler);
            notificationControler = null;
        }
    } else {
        clearInterval(notificationControler);
        notificationControler = null;
        if (document.getElementById('statusPanel')) {
            $('#statusPanel').addClass('hidden');
            $('#statusPanel > .dropdown > .dropdown-menu').html('<span class="dropdown-header">No Active Jobs</span>');
            $('#statusMenuProgress').html('');
        }
    }
}
function kernelRequestData(message) {
    if (!navigator.serviceWorker.controller) {
        if (window.location.protocol !== 'https:') {
            $.snack('error', `Application not secure!`, 1500);
        } else {
            $.snack('error', `Application not ready!`, 1500);
        }
    } else {
        return new Promise(function (resolve, reject) {
            try {
                const messageChannel = new MessageChannel();
                messageChannel.port1.onmessage = function (event) {
                    if (event.data && event.data.error) {
                        console.error(event.data.error);
                        reject(false);
                    } else {
                        resolve(event.data);
                    }
                };
                navigator.serviceWorker.controller.postMessage(message, [messageChannel.port2]);
            } catch (err) {
                $.toast({
                    type: 'error',
                    title: '<i class="fas fa-microchip pr-2"></i>Kernel Error',
                    subtitle: '',
                    content: `<p>Could not complete "${message.type}" due to communication failure with the network kernel!</p><p>${err.message}</p>`,
                    delay: 5000,
                });
            }
        });
    }
}
async function setMenuLocation(location) {
    menuLocation = location;
    if (location === 'bottom') {
        if (document.querySelector('.container').classList.contains('menu-top')) {
            document.querySelector('.container').classList.remove('menu-top');
            menuLocation = 'null';
        } else {
            document.querySelector('.container').classList.add('menu-bottom');
        }
    } else if (location === 'top') {
        if (document.querySelector('.container').classList.contains('menu-bottom')) {
            document.querySelector('.container').classList.remove('menu-bottom');
            menuLocation = 'null';
        } else {
            document.querySelector('.container').classList.add('menu-top');
        }
    } else {
        document.querySelector('.container').classList.remove('menu-bottom');
        document.querySelector('.container').classList.remove('menu-top');
        menuLocation = 'null';
    }
    setCookie("menuLocation", menuLocation);
}
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/serviceWorker.min.js')
            .then(async registration => {
                console.log('Service Worker: Registered');
            })
            .catch(err => console.log(`Service Worker: Error: ${err}`));
    });
    if (!navigator.serviceWorker.controller) {
        if (window.location.protocol !== 'https:') {
            $.toast({
                type: 'error',
                title: '<i class="fas fa-microchip pr-2"></i>Kernel Failure',
                subtitle: '',
                content: `<p>You must access Sequenzia as HTTPS for the appliation to function</p>Some features will not be available!`,
                delay: 5000,
            });
        } else {
            $.toast({
                type: 'error',
                title: '<i class="fas fa-microchip pr-2"></i>Kernel Failure',
                subtitle: '',
                content: `<p>The Network Kernel is not registered, please refresh the application and try again!</p>`,
                delay: 5000,
            });
        }
    } else {
        navigator.serviceWorker.onmessage = async function (event) {
            switch (event.data.type) {
                case 'STATUS_UNPACK_STARTED':
                case 'STATUS_UNPACK_QUEUED':
                case 'STATUS_UNPACK_DUPLICATE':
                    if (unpackingJobs.has(event.data.fileid)) {
                        downloadSpannedController.set(event.data.fileid, event.data);
                        updateNotficationsPanel();
                    }
                    break;
                case 'STATUS_UNPACK_COMPLETED':
                    setTimeout(() => {
                        unpackingJobs.delete(event.data.fileid);
                        updateNotficationsPanel();
                    }, 1000);
                    break;
                case 'STATUS_UNPACK_FAILED':
                    if (unpackingJobs.has(event.data.fileid)) {
                        console.error(`Failed to unpack file ${event.data.fileid}`)
                        setTimeout(() => {
                            unpackingJobs.delete(event.data.fileid);
                            updateNotficationsPanel();
                        }, 1000);
                        downloadSpannedController.set(event.data.fileid, event.data);
                        updateNotficationsPanel();
                    }
                    break;
                case 'STATUS_UNPACKER_ACTIVE':
                    if (unpackingJobs.has(event.data.fileid)) {
                        const dataJob = unpackingJobs.get(event.data.fileid);
                        switch (event.data.action) {
                            case 'GET_METADATA':
                            case 'EXPECTED_PARTS':
                                if (!dataJob.active) {
                                    unpackingJobs.set(event.data.fileid, {
                                        ...dataJob,
                                        active: true
                                    })
                                }
                                break;
                            case 'FETCH_PARTS_PROGRESS':
                                unpackingJobs.set(event.data.fileid, {
                                    ...dataJob,
                                    active: true,
                                    progress: event.data.percentage
                                })
                                break;
                            case 'BLOCKS_ACQUIRED':
                                console.log(`File ${dataJob.name} is ready`)
                                break;
                            default:
                                console.error('Unknown Unpacker Status');
                                console.error(event.data);
                                break;
                        }
                        updateNotficationsPanel();
                    }
                    break;
                case 'STATUS_UNPACKER_UPDATE':
                    updateNotficationsPanel();
                    break;
                case 'STATUS_UNPACKER_FAILED':
                    if (unpackingJobs.has(event.data.fileid)) {
                        switch (event.data.action) {
                            case 'GET_METADATA':
                                $.toast({
                                    type: 'error',
                                    title: 'Unpack File',
                                    subtitle: 'Now',
                                    content: `File failed to unpack!<br/>${event.data.message}`,
                                    delay: 15000,
                                });
                                break;
                            case 'READ_METADATA':
                                $.toast({
                                    type: 'error',
                                    title: 'Unpack File',
                                    subtitle: 'Now',
                                    content: `Failed to read the parity metadata response!`,
                                    delay: 15000,
                                });
                                break;
                            case 'EXPECTED_PARTS':
                                $.toast({
                                    type: 'error',
                                    title: 'Unpack File',
                                    subtitle: 'Now',
                                    content: `File is damaged or is missing parts, please report to the site administrator!`,
                                    delay: 15000,
                                });
                                break;
                            case 'EXPECTED_FETCH_PARTS':
                                $.toast({
                                    type: 'error',
                                    title: 'Unpack File',
                                    subtitle: 'Now',
                                    content: `Missing a downloaded parity file, Retry to download!`,
                                    delay: 15000,
                                });
                                break;
                            case 'UNCAUGHT_ERROR':
                                console.error(event.data.message);
                                $.toast({
                                    type: 'error',
                                    title: 'Unpack File',
                                    subtitle: 'Now',
                                    content: `File Handeler Fault!<br/>${event.data.message}`,
                                    delay: 15000,
                                });
                                break;
                            default:
                                console.error('Unknown Unpacker Error');
                                console.error(event.data);
                                break;
                        }
                        updateNotficationsPanel();
                    }
                    break;
                case 'STATUS_UNPACKER_NOTIFY':
                    unpackingJobs.set(event.data.object.id, event.data.object);
                    break;
                case 'STATUS_STORAGE_CACHE_PAGE_ACTIVE':
                    offlineDownloadController.set(event.data.url, event.data.status);
                    updateNotficationsPanel();
                    break;
                case 'STATUS_STORAGE_CACHE_PAGE_COMPLETE':
                    offlineDownloadController.delete(event.data.url);
                    updateNotficationsPanel();
                    break;
                case 'MAKE_SNACK':
                    $.snack((event.data.level || 'info'), (event.data.text || 'No Data'), (event.data.timeout || undefined))
                    break;
                case 'MAKE_TOAST':
                    $.toast({
                        type: (event.data.level || 'info'),
                        title: (event.data.title || ''),
                        subtitle: (event.data.subtitle || ''),
                        content: (event.data.content || 'No Data'),
                        delay: (event.data.timeout || undefined),
                    });
                    break;
                default:
                    break;
            }
        };
    }
}

$(document).ready(function () {
    if (menuLocation) {
        if (menuLocation === 'bottom') {
            document.querySelector('.container').classList.add('menu-bottom');
        } else if (menuLocation === 'top') {
            document.querySelector('.container').classList.add('menu-top');
        }
    }
    verifyNetworkAccess();
    getRandomImage();
    getSidebar();
    if (!navigator.serviceWorker.controller) {
        if (window.location.protocol !== 'https:') {
            $.snack('error', `Application not secure!`, 1500);
        } else {
            $.snack('error', `Application not ready!`, 1500);
        }
        updateNotficationsPanel();
    } else {
        kernelRequestData({
            type: 'CACHE_URLS',
            urls: Array.from(document.querySelectorAll('meta[name^="seq-app-meta-"]')).map(item => item.getAttribute('content'))
        });
        kernelRequestData({type: 'GET_ALL_ACTIVE_JOBS'})
            .then(async data => {
                if (data && data.activeSpannedJobs) {
                    data.activeSpannedJobs.map(job => {
                        if (job && job.id) {
                            unpackingJobs.set(job.id, job);
                        }
                    })
                }
                const updateOfflinePages = await kernelRequestData({type: 'SYNC_PAGES_NEW_ONLY'});
                console.log(updateOfflinePages);
                updateNotficationsPanel();
            })
            .catch(error => {
                console.error('Failed to get active jobs', error)
            })
    }
    $('.popover').popover('hide');
    $('[data-toggle="popover"]').popover()
    if(isTouchDevice() === false) {
        $('[data-tooltip="tooltip"]').tooltip()
        $('[data-tooltip="tooltip"]').tooltip('hide')
    }
    document.addEventListener("scroll", refreshLayout);
    window.addEventListener("resize", refreshLayout);
    window.addEventListener("orientationChange", refreshLayout);
    setTimeout(() => {
        if (!noAmbientTimer) {
            setupAmbientTimers();
        }
    }, 30000)
    //dd();
    //ddw();
})

async function transitionToOOBPage(pageUrl) {
    if (pageUrl === '/')
        return false;
    if (pageUrl.startsWith('/offline') || pageUrl.startsWith('/june')) {
        document.getElementById('bootUpDisplay').classList.remove('d-none');
    }
    try {
        document.getElementById('bootBackdropSunrise').classList.add('hidden');
        $.when($('#bootBackdrop').fadeIn(500)).done(() => { location.href = pageUrl })
    } catch (e) {
        console.error('Failed to make fancy transition animation to home page');
        console.error(e);
        location.href = pageUrl
    }
}

$('#menuItemImageHistory').on('show.bs.collapse', function () {
    if (document.getElementById('menuBodyImageHistory').classList.contains('ready')) {
        getHistory();
    }
})
