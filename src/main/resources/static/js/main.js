const SOCKET_SCHEME = "ws"
const HTTP_SCHEME = "http"
const DOMAIN = "localhost"
// const DOMAIN = "localhost"
const PORT = "8080"




const user = Math.round(Math.random() * 1000) + "";
const socketUrl = SOCKET_SCHEME + "://"+ DOMAIN+":"+ PORT +"/msgServer/" + user;

let socketWrapper = null;
let connectMap = new Map;

let localVideo = document.getElementById('local-video');
let videoBox = document.body.getElementsByClassName("video-box").item(0);
let localStream = null;
const mediaConstraints = {
    'mandatory': {
        'OfferToReceiveAudio': false,
        'OfferToReceiveVideo': true
    }
};

window.onload = function () {}

//-------- 处理用户UI事件 -----
// 开始打开媒体
function getUserMedia() {
    return navigator.getUserMedia || navigator.msGetUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
}



function buildSocket() {
    if (socketWrapper) {
        alert("不要重复连接");
    } else {
        socketWrapper = new SocketWrapper(socketUrl);
    }
}

function startVideo() {
    if (localStream) {
        buildSocket();
        return
    }

    // 方式一
    let userMedia = getUserMedia();
    if (userMedia != null) {
        userMedia.call(navigator
            ,{
                video: true,
                audio: true
            },function(stream) { //success
                localStream = stream;
                localVideo.srcObject = stream;
                //localVideo.src = window.URL.createObjectURL(stream);
                localVideo.play();
                localVideo.volume = 0;
                buildSocket();
            }, function(error) { //error
                console.error('无法打开音视频，[错误代码：' + error.code + ']');
            }
        )
    }

    // 方式二
    // if (hasUserMedia()) {
    //     navigator.getUserMedia({
    //             video: true,
    //             audio: true
    //         }, function(stream) { //success
    //             localStream = stream;
    //             localVideo.srcObject = stream;
    //             //localVideo.src = window.URL.createObjectURL(stream);
    //             localVideo.play();
    //             localVideo.volume = 0;
    //             buildSocket();
    //         }, function(error) { //error
    //             console.error('无法打开音视频，[错误代码：' + error.code + ']');
    //         }
    //     );
    // }

}



// 开始建立连接
function connect() {
    startVideo()
}
// 停止连接
function hangUp() {
    console.log("停止连接");
    connectMap.forEach((connectionWrapper, userId) => {
        connectionWrapper.sendBye();
        connectionWrapper.removeRemoteVideo();
        connectionWrapper.closeConnection();
        connectMap.delete(userId);
    })
    socketWrapper.closeConnection();
    socketWrapper = null;
}

function refreshPage() {
    location.reload();
}
