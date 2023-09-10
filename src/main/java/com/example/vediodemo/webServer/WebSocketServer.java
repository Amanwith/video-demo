package com.example.vediodemo.webServer;

import com.example.vediodemo.utils.ProtocolParse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Scope;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import javax.websocket.*;
import javax.websocket.server.PathParam;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Enumeration;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;


@ServerEndpoint("/msgServer/{userId}")
@Component
@Scope("prototype")
@Slf4j
public class WebSocketServer {

    /**
     * 静态变量，用来记录当前在线连接数。应该把它设计成线程安全的。
     */
    private static int onlineCount = 0;
    /**
     * concurrent包的线程安全Set，用来存放每个客户端对应的MyWebSocket对象。
     */
    private static final ConcurrentHashMap<String, Session> WEB_SOCKET_MAP = new ConcurrentHashMap<>();

    /**
     * 与某个客户端的连接会话，需要通过它来给客户端发送数据
     */
    private Session session;
    /**
     * 接收userId
     */
    private String userId = "";

    @OnOpen
    public void onOpen(Session session, @PathParam("userId") String userId) {
        this.session = session;
        this.userId = userId;
        WEB_SOCKET_MAP.put(userId, session);
        log.debug(userId + " - 连接建立成功");
    }

    private static final String BYE = "00";
    private static final String INFO_EXCHANGE = "01";
    private static final String BROAD_CAST = "11";


    @OnMessage
    public void onMessage(String message, Session session) {
        ProtocolParse protocolParse = new ProtocolParse(message);

        switch (protocolParse.getType()) {
            case BROAD_CAST:
                this.broadcast(protocolParse.getInfo());
                break;
            case INFO_EXCHANGE:
                this.privateLetter(protocolParse.getInfo(), protocolParse.getAcceptId());
                break;
            default:
                log.debug(protocolParse.toString());
                throw new RuntimeException("未知的 ProtocolType");
        }
    }


    /**
     * 广播
     * 对房间内除自己外所有成员广播
     */
    public void broadcast(String info) {
        log.debug("{} 开启任务", this.userId);

        // 给每个用户发送消息
        Enumeration<String> userIds = WEB_SOCKET_MAP.keys();
        while (userIds.hasMoreElements()) {
            String userId = userIds.nextElement();
            if (userId.equals(this.userId)) {
                log.error("{} 群发不能发送给自己", this.userId);
                continue;
            }
            try {
                sendInfoToUser(info, userId);
            } catch (IOException ioException) {
                ioException.printStackTrace();
            }
        }
        log.debug("{} 结束任务", this.userId);
    }

    /**
     * 私信
     * 对房间内除自己外某个成员私信
     */
    public void privateLetter(String info, String acceptId) {
        if (acceptId.equals(this.userId)) {
            log.error("{} 私信不能发送给自己", this.userId);
            return;
        }
        try {
            sendInfoToUser(info, acceptId);
        } catch (IOException ioException) {
            ioException.printStackTrace();
        }
    }

    public void sendInfoToUser(String info, String userId) throws IOException {
        Session session = WEB_SOCKET_MAP.get(userId);

        // session为null
        if (session == null) {
            log.debug("{} 已被从Map中清理掉", userId);
            return;
        }

        if (session.isOpen()) {
            log.info("{} 发消息给: {} 消息长度: {}", this.userId, userId, info.length());
            synchronized (session) {
                session.getBasicRemote().sendText(info);
            }
        }
        // session未打开
        else {
            log.info("{} 的连接 : 已关闭, 将其从Map中清理", userId);
            // 有意义吗？
            session.close();
            WEB_SOCKET_MAP.remove(userId);
        }
    }

    /**
     * 发送自定义消息
     */
    public static void sendInfo(String message, @PathParam("userId") String userId) throws IOException {
        if (!StringUtils.isEmpty(userId) && WEB_SOCKET_MAP.containsKey(userId)) {
            WEB_SOCKET_MAP.get(userId).getBasicRemote().sendText(message);
        } else {
            System.out.println("用户" + userId + ",不在线！");
        }
    }

    @OnError
    public void onError(Session session, Throwable error) {
        log.error("连接异常");
        error.printStackTrace();
    }

    @OnClose
    public void onClose(Session session) {
        WEB_SOCKET_MAP.remove(this.userId);
        log.info("连接关闭");
        Set<String> users = getConnectionUsers();
        log.debug("目前连接map中含有 {}", users);
    }

    public static synchronized int getOnlineCount() {
        return onlineCount;
    }

    public static synchronized void addOnlineCount() {
        WebSocketServer.onlineCount++;
    }

    public static synchronized void subOnlineCount() {
        WebSocketServer.onlineCount--;
    }

    public static Set<String> getConnectionUsers() {
        return WEB_SOCKET_MAP.keySet();
    }
}