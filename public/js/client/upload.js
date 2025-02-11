function displayUploadModel(){
    const tmodel = $('#uploadModel');
    try {
        if (_lastUploadChannelSelection !== '') {
            tmodel.find("#destination-" + _lastUploadChannelSelection).removeClass('active');
        }
        if (uploadDestination !== '') {
            tmodel.find("#destination-" + uploadDestination).addClass('active');
            const chname = (getCookie("UploadChannelName")) ? getCookie("UploadChannelName") : '';
            tmodel.find("#channelSelector").removeClass('btn-secondary');
            tmodel.find("#channelSelector").addClass('btn-success');
            if (chname !== '') {
                tmodel.find("#selectedChannel").text(chname);
            }
        }
    } catch (e) {
        console.error("Failed to set saved channel selection")
        console.error(e)
    }
    tmodel.modal('show');
}
function displayMessageModel(type){
    if (type === 0) {
        $('.server-selection').addClass('d-none');
        $('#urlButtons').addClass('d-none');
        $('#linkURL').addClass('d-none');
        $('#sendButtons').removeClass('d-none');
        $('#textMessageInput').removeClass('d-none');
        $('#writeTitle').text('Write Message');
    } else if (type === 1) {
        $('.server-selection').removeClass('d-none');
        $('#sendButtons').addClass('d-none');
        $('#textMessageInput').addClass('d-none');
        $('#urlButtons').removeClass('d-none');
        $('#linkURL').removeClass('d-none');
        $('#writeTitle').text('Download URL');
    }
    const tmodel = $('#writeModel')
    try {
        if (_lastUploadServerSelection !== '') {
            tmodel.find("#server-" + _lastUploadServerSelection).removeClass('active');
        }
        if (_lastUploadChannelSelection !== '') {
            tmodel.find("#destination-" + _lastUploadChannelSelection).removeClass('active');
        }
        if (uploadServer !== '') {
            tmodel.find("#server-" + uploadServer).addClass('active');
        }
        if (uploadDestination !== '') {
            tmodel.find("#destination-" + uploadDestination).addClass('active');
        }
        const chname = (getCookie("UploadChannelName")) ? getCookie("UploadChannelName") : '';
        tmodel.find("#channelSelector").removeClass('btn-secondary');
        tmodel.find("#channelSelector").addClass('btn-success');
        if (chname !== '') {
            tmodel.find("#selectedChannel").text(chname);
        }
    } catch (e) {
        console.error("Failed to set saved channel selection")
        console.error(e)
    }
    tmodel.modal('show');
}

function selectedUploadChannel(chid, model, isServer) {
    try {
        const tmodel = $(`#${model}`)
        const server = tmodel.find("#destination-" + chid)[0].getAttribute('data-ch-server')
        const chname = tmodel.find("#destination-" + chid)[0].getAttribute('data-ch-name')
        if (isServer) {
            if (_lastUploadChannelSelection !== '') {
                tmodel.find("#destination-" + _lastUploadChannelSelection).removeClass('active');
            }
            if (_lastUploadServerSelection === '') {
                tmodel.find("#server-" + server).addClass('active');
            } else {
                tmodel.find("#server-" + _lastUploadServerSelection).removeClass('active');
                tmodel.find("#server-" + server).addClass('active');
            }
            if ($("#linkURL")[0].value.length > 0) {
                tmodel.find("#downloadButton").removeClass('disabled');
            }
            _lastUploadServerSelection = server;
            uploadServer = server;
            uploadDestination = '';
            try {
                setCookie("lastUploadServerSelection", server);
                setCookie("UploadServerSelection", server);
                setCookie("UploadChannelSelection", '');
            } catch (e) {
                console.error("Failed to save cookie for destinations");
                console.error(e)
            }
        } else {
            if (_lastUploadServerSelection !== '') {
                tmodel.find("#server-" + _lastUploadServerSelection).removeClass('active');
            }
            if (_lastUploadChannelSelection === '') {
                tmodel.find("#destination-" + chid).addClass('active');
            } else {
                tmodel.find("#destination-" + _lastUploadChannelSelection).removeClass('active');
                tmodel.find("#destination-" + chid).addClass('active');
            }
            if ($(".custom-file-input")[0].files.length > 0 || $("#textMessageInput")[0].value.length > 0) {
                tmodel.find("#postButton").removeClass('disabled');
            }
            _lastUploadChannelSelection = chid;
            uploadDestination = chid;
            uploadServer = server;
            try {
                setCookie("lastUploadChannelSelection", chid);
                setCookie("UploadChannelSelection", chid);
                setCookie("UploadServerSelection", server);
            } catch (e) {
                console.error("Failed to save cookie for destinations");
                console.error(e)
            }
        }
        tmodel.find("#channelSelector").removeClass('btn-secondary');
        tmodel.find("#channelSelector").addClass('btn-success');
        tmodel.find("#selectedChannel").text(chname);
        try {
            setCookie("UploadChannelName", chname);
        } catch (e) {
            console.error("Failed to save cookie for destinations");
            console.error(e)
        }
    } catch (e) {
        console.log('Can not auto select download location')
        console.error(e)
    }
    return false;
}

function sendFileData() {
    const isPackageFile = $("input[type='radio'][name='package']:checked").val()
    let send_url = `/upload/files?channelid=${uploadDestination}`

    if (! $("#zipSelection").hasClass('hidden')) {
        send_url += `&package=${isPackageFile}`
        $("#zipSelection").addClass('hidden');
    }

    $("#uploadSection").addClass('hidden');
    $("#uploadSelection").addClass('hidden');
    uploadModel.querySelector("#Footer").classList.add('hidden');
    $("#uploadingSection").removeClass('hidden');
    uploadModel.querySelector("#postButton").classList.add('disabled');
    let percentComplete = uploadModel.querySelector("#progressBar")
    uploadModel.querySelector("#uploadText").innerText = 'Uploading Content...'

    $.ajax({async: true,
        xhr: function() {
            const xhr = new window.XMLHttpRequest();
            xhr.upload.addEventListener("progress", function(evt) {
                if (evt.lengthComputable) {
                    percentComplete.style.width = `${(evt.loaded / evt.total) * 100}%`;
                    percentComplete.setAttribute( 'aria-valuenow',`${(evt.loaded / evt.total) * 100}%`);
                    if ((evt.loaded / evt.total) >= 0.99) {
                        uploadModel.querySelector("#uploadText").innerText = 'Processing Uploads...\nDO NOT CLOSE YOUR BROWSER!'
                    }
                }
            }, false);
            return xhr;
        },
        url: send_url,
        type: "POST",
        data: new FormData($("#uploadForm")[0]),
        processData: false,
        contentType: false,
        headers: {
            'X-Requested-With': 'SequenziaXHR'
        },
        success: function () {
            clearUploadModel()
            $.toast({
                type: 'success',
                title: 'Upload Completed',
                subtitle: 'Now',
                content: `Uploaded Files to Sequenzia, they should appear soon`,
                delay: 5000,
            });
        },
        error: function () {
            percentComplete.classList.remove('bg-success')
            percentComplete.classList.add('bg-danger')
            uploadModel.querySelector("#uploadText").innerText = 'Upload Failed'
        }
    });
}

function clearUploadModel() {
    $('#uploadModel').modal('hide');
    uploadModel.querySelector("#Footer").classList.remove('hidden');
    $("#uploadSection").removeClass('hidden');
    $("#uploadSelection").removeClass('hidden');
    $("#uploadingSection").addClass('hidden');
    $("#uploadForm")[0].setAttribute('val','')
    uploadModel.querySelector("#progressBar").style.width = `0%`;
    uploadModel.querySelector("#progressBar").setAttribute( 'aria-valuenow',`0%`);
    uploadModel.querySelector("#uploadText").innerText = 'NaN'
}
function clearMessageModel() {
    $('#writeModel').modal('hide');
    $("#textMessageInput")[0].value = ''
    $("#linkURL")[0].value = ''
    writeModel.querySelector("#postButton").classList.add('disabled')
    writeModel.querySelector("#downloadButton").classList.add('disabled')
}

function sendLinkMessage(channelid) {
    let URLText = document.getElementById('linkURL').value;

    if (URLText && URLText.length > 4 && URLText.includes('http') && URLText.includes('://') && uploadServer.length > 0) {
        let postData = {
            'action': 'DownloadLink',
            'url': URLText
        }
        if (uploadDestination) {
            postData.channelid = uploadDestination;
            postData.serverid = uploadServer;
        } else if (uploadServer) {
            postData.serverid = uploadServer;
        }
        $.ajax({async: true,
            type: "post",
            url: "/actions/v2",
            data: postData,
            cache: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR'
            },
            success: function (html) {
                clearMessageModel();
                $.toast({
                    type: 'success',
                    title: 'URL Sent',
                    subtitle: 'Now',
                    content: `Requested to download "${URLText}"`,
                    delay: 5000,
                });
                document.getElementById('linkURL').value = ''
            },
            error: function (xhr) {
                clearMessageModel();
                $.toast({
                    type: 'error',
                    title: 'Request Failed',
                    subtitle: 'Now',
                    content: `Failed to submit your request to the server: ${xhr.responseText}`,
                    delay: 5000,
                });
                document.getElementById('linkURL').value = ''
            }
        });
    } else {
        $.snack('error', 'Invalid URL', 5000)
    }
}
function sendTextMessage() {
    let Text = document.getElementById("textMessageInput").value;

    if (Text && Text.length > 0 && Text.length < 1900) {
        let postData = {
            'channelid': uploadDestination,
            'action': 'textMessage',
            'text': Text
        }
        $.ajax({async: true,
            type: "post",
            url: "/actions/v2",
            data: postData,
            cache: false,
            headers: {
                'X-Requested-With': 'SequenziaXHR'
            },
            success: function (html) {
                clearMessageModel();
                $.toast({
                    type: 'success',
                    title: 'Message Sent',
                    subtitle: 'Now',
                    content: `Sent Message: "${Text}"`,
                    delay: 5000,
                });
            },
            error: function (xhr) {
                clearMessageModel();
                $.toast({
                    type: 'error',
                    title: 'Request Failed',
                    subtitle: 'Now',
                    content: `Failed to submit your request to the server: ${xhr.responseText}`,
                    delay: 5000,
                });
            }
        });
    } else {
        $.snack('error', 'Bad Message', 5000)
    }
}
