package com.enterprise.erp.controller;

import com.enterprise.erp.service.impl.UserService;

import lombok.RequiredArgsConstructor;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;


    @GetMapping
    public Object getAllUsers() {

        return userService.getAllUsers();

    }

}
