'use strict';

let localStream;
let remoteStream;
let userName;
let remoteUser;
let peerConnection;

let uid = String(Math.floor(Math.random() * 10000))

let sendChannel;
let receiveChannel;

var msgInput = document.querySelector("#msg-input");
var msgSendBtn = document.querySelector(".msg-send-button");
var chatTextArea = document.querySelector(".chat-text-area");

let queryString = window.location.search
let url = new URL(window.location.href);
// let userName = urlParams.get('username')
// let remoteUser = urlParams.get('remoteuser')
//let roomId = uid

// if (!roomId) {
//     window.location = 'lobby'
// }

var webRtcId = localStorage.getItem("webRtcId");
if (webRtcId) {
    userName = parseInt(webRtcId);
    $.ajax({
        url: "/api/updateNewUser/" + webRtcId + "",
        type: "PUT",
        success: function (response) {
            //console.log(response);
        },
    });
} else {
    var postData = {
        name: 'test 123',
        bio: 'this is test',
        gender: 'male',
        age: 12,
        country: 'USA'
    };
    $.ajax({
        type: "POST",
        url: "/api/createUser",
        data: postData,
        success: function (response) {
            // console.log(response);
            // console.log(response.id);
            localStorage.setItem("webRtcId", response.id);
            userName = parseInt(response.id);
        },
        error: function (error) {
            console.log(error);
        },
    });
}

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    video: true,
    audio: true
}


let init = async () => {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    document.getElementById('user-1').srcObject = localStream;
    $.post("/api/getRemoteUsers", { webRtcId: webRtcId })
        .done(function (data) {
            if (data.user[0]) {
                console.log("Remoteuser id from Init() /getRemoteUsers: ", data.user[0].id);
                if (data.user[0].id == remoteUser || data.user[0].id == userName) {
                    console.log("local init");
                } else {
                    console.log("set remote user", data.user[0].id);
                    remoteUser = parseInt(data.user[0].id);
                    createOffer(data.user[0].id);
                }
            }
        })
        .fail(function (xhr, textStatus, errorThrown) {
            console.log(xhr.responseText);
        });
}

init()

const socket = io();

socket.on('connect', () => {
    if (socket.connected) {
        socket.emit('userConnect', { userName: userName })
    }
})
let servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302']
        }
    ]
}

let createPeerConnection = async () => {
    
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    
    if (!localStream) {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = async (event) => {
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.oninactive = () => {
        remoteStream.getTracks().forEach((track) => { 
            track.enabled = !track.enabled
        })
        peerConnection.close();
    }

    peerConnection.onicecandidate = async (event) => {
        if (event.candidate) {
            socket.emit('candidateSentToUser', {
                userName: parseInt(userName),
                remoteUser: parseInt(remoteUser),
                iceCandidate: event.candidate
            });
        }
    }

    sendChannel = peerConnection.createDataChannel("sendDataChannel");
    sendChannel.onopen = () => {
        console.log("Data channel is now open and ready to use");
        onSendChannelStateChange();
    };

    peerConnection.ondatachannel = receiveChannelCallback;
}

function sendData() {
    const msgData = msgInput.value;
    chatTextArea.innerHTML +=
        "<div style='margin-top:2px; margin-bottom:2px;'><b>Me: </b>" +
        msgData +
        "</div>";
    if (sendChannel) {
        onSendChannelStateChange();
        sendChannel.send(msgData);
        msgInput.value = "";
    } else {
        receiveChannel.send(msgData);
        msgInput.value = "";
    }
}

function receiveChannelCallback(event) {
    console.log("Receive Channel Callback");
    receiveChannel = event.channel;
    receiveChannel.onmessage = onReceiveChannelMessageCallback;
    receiveChannel.onopen = onReceiveChannelStateChange;
    receiveChannel.onclose = onReceiveChannelStateChange;
}

function onReceiveChannelMessageCallback(event) {
    console.log("Received Message");
    chatTextArea.innerHTML +=
        "<div style='margin-top:2px; margin-bottom:2px;'><b>Stranger: </b>" +
        event.data +
        "</div>";
}

function onReceiveChannelStateChange() {
    const readystate = receiveChannel.readystate;
    console.log("Receive channel state is: " + readystate);
    if (readystate === "open") {
        console.log(
            "Data channel ready state is open - onReceiveChannelStateChange"
        );
    } else {
        console.log(
            "Data channel ready state is NOT open - onReceiveChannelStateChange"
        );
    }
}

function onSendChannelStateChange() {
    const readystate = sendChannel.readystate;
    console.log("Send channel state is: " + readystate);
    if (readystate === "open") {
        console.log("Data channel ready state is open - onSendChannelStateChange");
    } else {
        console.log(
            "Data channel ready state is NOT open - onSendChannelStateChange"
        );
    }
}

function fetchNextUser(remoteUser) {
    $.post(
        "/api/getNextUser",
        { webRtcId: webRtcId, remoteUser: remoteUser },
        function (data) {
            console.log("Next user is: ", data);
            if (data.user[0]) {
                if (data.user[0].id == remoteUser || data.user[0].id == userName) {
                } else {
                    remoteUser = parseInt(data.user[0].id);
                    createOffer(data.user[0].id);
                }
            }
        }
    );
}

let createOffer = async (remoteU) => {
    console.log('create offer remote', remoteU);
    await createPeerConnection()
    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)
    socket.emit('offerSentToRemote', {
        userName: parseInt(userName),
        remoteUser: parseInt(remoteU),
        offer: peerConnection.localDescription
    });
}


let createAnswer = async (data) => {
    console.log("create answer", data);
    remoteUser = parseInt(data.userName)

    await createPeerConnection()

    await peerConnection.setRemoteDescription(data.offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)
    socket.emit('answerSentToUser', {
        answer: answer,
        sender: parseInt(data.remoteUser),
        receiver: parseInt(data.userName)
    });
    $.ajax({
        url: "/api/updateOnEnagament/" + userName + "",
        type: "PUT",
        success: function (response) { },
    });
}

socket.on("receiveOffer", (data) => {
    createAnswer(data)
});

let addAnswer = async (data) => {
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(data.answer)
    }

    document.querySelector(".next-chat").style.pointerEvents = "auto";

    $.ajax({
        url: "/api/updateOnEnagament/" + userName + "",
        type: "PUT",
        success: function (response) { },
    });
}

socket.on('receiveAnswer', (data) => {
    addAnswer(data)
})

socket.on("closedRemoteUser", function (data) {
    // .................Newly Added..........................
    const remoteStream = peerConnection.getRemoteStreams()[0];
    remoteStream.getTracks().forEach((track) => track.stop());

    peerConnection.close();
    const remoteVid = document.getElementById("user-2");

    if (remoteVid.srcObject) {
        remoteVid.srcObject.getTracks().forEach((track) => track.stop());
        remoteVid.srcObject = null;
    }
    // .................Newly Added..........................
    $.ajax({
        url: "/api/updateOnNext/" + userName + "",
        type: "PUT",
        success: function (response) {
            fetchNextUser(remoteUser);
        },
    });
});

socket.on('candidateReceiver', (data) => {
    peerConnection.addIceCandidate(data.iceCandidate)
})

msgSendBtn.addEventListener("click", function (event) {
    sendData();
});

window.addEventListener('beforeunload', function (e) {
    e.preventDefault();
    $.ajax({
        url: "/api/leavingUser/" + userName + "",
        type: "PUT",
        success: function (response) {
            console.log(response);
        },
    });
    console.log("Leaving local user is: ", userName);
    // ..........................Newly Edited
    // if (remoteUser) {
        $.ajax({
            url: "/api/updateOnOtherUserClosing/" + remoteUser + "",
            type: "PUT",
            success: function (response) {
                console.log(response);
            },
        });
    // }
});

window.addEventListener("unload", function (event) {
    event.preventDefault();
    if (navigator.userAgent.indexOf("Chrome") != -1) {
        $.ajax({
            url: "/api/leavingUser/" + userName + "",
            type: "PUT",
            success: function (response) {
                console.log(response);
            },
        });
        console.log("Leaving local user is: ", userName);
        // ..........................Newly Edited
        // if (remoteUser){
            $.ajax({
                url: "/api/updateOnOtherUserClosing/" + remoteUser + "",
                type: "PUT",
                success: function (response) {
                    console.log(response);
                },
            });
            console.log("Leaving remote user is: ", remoteUser);
        // }
        // ..........................Newly Edited
        console.log("This is Chrome");
    } else if (navigator.userAgent.indexOf("Firefox") != -1) {
        // The browser is Firefox
        $.ajax({
            url: "/api/leavingUser/" + userName + "",
            type: "PUT",
            async: false,
            success: function (response) {
                console.log(response);
            },
        });
        console.log("Leaving local user is: ", userName);
        // ..........................Newly Edited
        // if (remoteUser) {
            $.ajax({
                url: "/api/updateOnOtherUserClosing/" + remoteUser + "",
                type: "PUT",
                async: false,
                success: function (response) {
                    console.log(response);
                },
            });
            console.log("Leaving remote user is: ", remoteUser);
        // }
        // ..........................Newly Edited

        console.log("This is Firefox");
    } else {
        // The browser is not Chrome or Firefox
        console.log("This is not Chrome or Firefox");
    }
})

async function closeConnection() {
    // .................Newly Added..........................
    const remoteStream = peerConnection.getRemoteStreams()[0];
    remoteStream.getTracks().forEach((track) => track.stop());
    await peerConnection.close();
    const remoteVid = document.getElementById("user-2");

    if (remoteVid.srcObject) {
        remoteVid.srcObject.getTracks().forEach((track) => track.stop());
        remoteVid.srcObject = null;
    }
    // .................Newly Added..........................
    socket.emit("remoteUserClosed", {
        userName: parseInt(userName),
        remoteUser: parseInt(remoteUser),
    });
    $.ajax({
        url: "/api/updateOnNext/" + userName + "",
        type: "PUT",
        success: function (response) {
            fetchNextUser(remoteUser);
        },
    });

    console.log("From closeConnection");
}

$(document).on("click", ".next-chat", function () {
    document.querySelector(".chat-text-area").innerHTML = "";
    closeConnection();
    peerConnection.oniceconnectionstatechange = (event) => {
        if (
            peerConnection.iceConnectionState === "disconnected" ||
            peerConnection.iceConnectionState === "closed"
        ) {
            console.log("Peer connection closed.");
        }
    };
});




// let toggleCamera = async () => {
//     let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

//     if (videoTrack.enabled) {
//         videoTrack.enabled = false
//         document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
//     } else {
//         videoTrack.enabled = true
//         document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
//     }
// }

// let toggleMic = async () => {
//     let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

//     if (audioTrack.enabled) {
//         audioTrack.enabled = false
//         document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
//     } else {
//         audioTrack.enabled = true
//         document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
//     }
// }