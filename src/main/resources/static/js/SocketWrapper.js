
/**
 * websocket包装类
 * 对websocket进行增强，绑定发生 open、close、message 事件的回调函数
 */
// ===================以下是socket=======================
function SocketWrapper(socketUrl) {
    this.socket = new WebSocket(socketUrl);
    this.inject();
    this.connectioned = false;
}

SocketWrapper.prototype.inject = function() {
    this.socket.onopen = this.socketOnOpen;
    this.socket.onclose = this.socketOnClose;
    this.socket.onmessage = this.socketOnMessage;
}

SocketWrapper.prototype.socketOnOpen = function() {
    console.log("成功连接到服务器...");
    this.connectioned = true;
    if (!localStream) {
        alert("无法捕获本地视频数据");
    } else {
        let userList = getUserList();
        console.log(userList);
        for (let i = 0; i < userList.length; i++) {
            if (userList[i] != user) {
                let peerConnection = new WebkitRTCPeerConnectionWrapper(userList[i]);
                connectMap.set(userList[i], peerConnection);
                peerConnection.sendOffer();
            }
        }
    }
}

SocketWrapper.prototype.socketOnClose = function(event) {
    console.log('与服务器连接关闭: ' + event.code)
    this.connectioned = false
    delete connectMap;
}

SocketWrapper.prototype.socketOnMessage = function(response) {
    let data = JSON.parse(response.data);


    let fromUser = data.user;
    let event = data.info;
    console.log("接收到数据");
    console.debug(data);
    let connectionWrapper = connectMap.get(fromUser);
    if (event.type === 'offer') {
        console.log("接收到offer,设置offer,发送answer")
        onOffer(event, fromUser);
    } else if (event.type === 'answer') {
        console.log('接收到answer,设置answer SDP');
        onAnswer(event, connectionWrapper);
    } else if (event.type === 'candidate') {
        console.log('接收到ICE候选者(Candidate)');
        onCandidate(event, connectionWrapper);
    } else if (event.type === 'bye') {
        console.log("WebRTC通信断开");
        onBye(fromUser, connectionWrapper);
    }
}
SocketWrapper.prototype.sendMessage = function(message) {
    this.socket.send(message);
}
SocketWrapper.prototype.closeConnection = function() {
    this.socket.close();
    this.socket = null;
    this.connectioned = false;
}
// ===================以上是socket=======================

function onOffer(offer, fromUser) {
    let connectionWrapper = new WebkitRTCPeerConnectionWrapper(fromUser);
    connectMap.set(fromUser, connectionWrapper);
    connectionWrapper.setOffer(offer);
    connectionWrapper.sendAnswer();
    connectionWrapper.peerStarted = true;
}

function onAnswer(answer, connectionWrapper) {
    connectionWrapper.setAnswer(answer);
    connectionWrapper.peerStarted = true;
}

function onCandidate(candidate, connectionWrapper) {
    connectionWrapper.setCandidate(candidate)
}

function onBye(fromUser, connectionWrapper) {
    connectionWrapper.removeRemoteVideo();
    connectionWrapper.closeConnection();
    connectMap.delete(fromUser);
}




const httpUrl = HTTP_SCHEME + "://" + DOMAIN + ":" + PORT + "/getUserList"
// 获取房间内所有成员
function getUserList() {
    let userList = null;
    $.ajax({
        url: "http://localhost:8080/getUserList", // 请求路径
        type: "GET", //请求方式
        async : false,
        success: function(data) {
            //data后台返回的json数据，已经帮你转换成JSON对象
            console.log(data);
            userList = data;
        }, //响应成功后的回调函数
        error: function() {
            alert("出错啦...");
        },
        dataType: "json" //设置接受到的响应数据的格式 text 普通的文本字符串
    });
    return userList;
}