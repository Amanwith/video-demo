package com.example.vediodemo.controller;

import com.example.vediodemo.webServer.WebSocketServer;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.Set;

@Controller
@Slf4j
public class StartController {

    @GetMapping("/hello")
    public String index() {
        return "video";
    }


    @GetMapping("/getUserList")
    @ResponseBody
    public Set<String> get() {
        Set<String> users = WebSocketServer.getConnectionUsers();
        log.info(users.toString());
        return users;
    }
}
