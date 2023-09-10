const pc_config = {
    "iceServers": []
};

/**
 * webkitRTCPeerConnection包装类
 * 对webkitRTCPeerConnection进行增强，绑定发生 addstream、 candidate 事件的回调函数
 * 设置发送和接收 offer、answer、candidate 消息的函数
 * 设置 关闭连接 和 移除html中对应video 的函数
 */
function getRTCPeerConnection() {
    return window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection;
}

function WebkitRTCPeerConnectionWrapper(toUserId) {
    console.debug("构造peerConnection");
    let rtcPeerConnection = getRTCPeerConnection();
    this.webRtcPeerConnection = new rtcPeerConnection(pc_config);
    this.webRtcPeerConnection.toUserId = toUserId.toString();
    console.log('添加本地视频流...');
    this.webRtcPeerConnection.addStream(localStream);
    this.inject();
    this.peerStarted = false;
}

WebkitRTCPeerConnectionWrapper.prototype.inject = function(){
    this.webRtcPeerConnection.addEventListener("addstream", this.onAddRemoteStream, false);
    this.webRtcPeerConnection.onicecandidate = this.onicecandidate;
}

// ===================以下是offer=======================
WebkitRTCPeerConnectionWrapper.prototype.sendOffer = function() {
    let connection = this.webRtcPeerConnection;
    this.webRtcPeerConnection.createOffer(function(sessionDescription) { //成功时调用
        console.log("创建offer成功");
        // icecandidate事件触发的时机是在setLocalDescription执行之后。
        connection.setLocalDescription(sessionDescription);
        sendSDP(sessionDescription, connection);
    }, function(error) { //失败时调用
        console.error("创建Offer失败" + error.toString());
    }, mediaConstraints);
}
WebkitRTCPeerConnectionWrapper.prototype.setOffer = function(offer) {

    console.log("设置offer");
    this.webRtcPeerConnection.setRemoteDescription(new RTCSessionDescription(offer));
}

// ===================以下是answer=======================
WebkitRTCPeerConnectionWrapper.prototype.sendAnswer = function() {
    let connection = this.webRtcPeerConnection;
    connection.createAnswer(function(sessionDescription) { //成功时
        console.log('创建Answer成功');
        connection.setLocalDescription(sessionDescription);
        sendSDP(sessionDescription, connection);
    }, function(error) { //失败时
        console.error("创建Answer失败" + error.toString());
    }, mediaConstraints);
}
WebkitRTCPeerConnectionWrapper.prototype.setAnswer = function(answer) {

    this.webRtcPeerConnection.setRemoteDescription(new RTCSessionDescription(answer));
}


// ===================以下是candidate=======================
/**
 * 在 event.candidate 中包含了大量信息，
 * 含有属性 type 在本地进行调试发现值为 "host" 且不可修改
 * dev 为标记该处是否为本地环境
 */
const dev = true;
// 发送所有ICE候选者给对方 setLocalDescription时被触发
WebkitRTCPeerConnectionWrapper.prototype.onicecandidate = function(event) {
    if (event.candidate) {
        if (dev) {
            sendSDP({
                type: "candidate",
                sdpMLineIndex: event.candidate.sdpMLineIndex,
                sdpMid: event.candidate.sdpMid,
                candidate: event.candidate.candidate
            }, this);
        } else {
            sendSDP(event.candidate, this);
        }
    }
}
WebkitRTCPeerConnectionWrapper.prototype.setCandidate = function(candidate) {
    let promise = this.webRtcPeerConnection.addIceCandidate(
        new RTCIceCandidate({
            sdpMLineIndex: candidate.sdpMLineIndex,
            sdpMid: candidate.sdpMid,
            candidate: candidate.candidate
        })
    );
    this.peerStarted = true;
}

// ===================一些关闭处理=======================
WebkitRTCPeerConnectionWrapper.prototype.sendBye = function() {
    console.log(user + "发起关闭连接:to " + this.webRtcPeerConnection.toUserId);
    sendSDP({
        type : "bye"
    }, this.webRtcPeerConnection);
}

// ===================处理html的video显示=======================
WebkitRTCPeerConnectionWrapper.prototype.onAddRemoteStream = function(event) {
    console.log("添加远程视频流");
    // remoteVideo.src = window.URL.createObjectURL(event.stream);
    addRemoteVideo(this, event.stream);
}
WebkitRTCPeerConnectionWrapper.prototype.removeRemoteVideo = function() {
    console.log("移除远程视频流");
    let removeEle = document.getElementById(this.webRtcPeerConnection.toUserId);
    if (removeEle != null){
        videoBox.removeChild(removeEle);
    }
}

WebkitRTCPeerConnectionWrapper.prototype.closeConnection = function() {
    this.webRtcPeerConnection.peerStarted = false;
    this.webRtcPeerConnection.close();
}

/**
 * 根据消息种类，设置消息头
 */
const BYE = "00";
const INFO_EXCHANGE = "01";
const BROAD_CAST = "11";

function sendSDP(sdp, connection) {
    const message = JSON.stringify({
        user : user,
        info : sdp
    });
    console.log("发送sdp 类型为: " + sdp.type);
    // textForSendSDP.value = text;
    let s = INFO_EXCHANGE + formatNumber(connection.toUserId.length, 2) + connection.toUserId + message;
    socketWrapper.sendMessage(s);
}

function formatNumber(num, formatLength) {
    let numStr = num.toString();
    for (let i = 0; i < formatLength - numStr.length; i++) {
        numStr = "0" + numStr;
    }
    return numStr
}

function addRemoteVideo(connection, stream) {

    let video = document.createElement("video");
    video.autoplay = true;
    video.srcObject = stream;
    let div = document.createElement("div");
    div.className = "remote-video";
    div.id = connection.toUserId;
    div.appendChild(video);
    videoBox.appendChild(div);
}

