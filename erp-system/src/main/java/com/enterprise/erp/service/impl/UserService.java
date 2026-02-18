package com.enterprise.erp.service.impl;

import com.enterprise.erp.entity.User;
import com.enterprise.erp.repository.UserRepository;

import lombok.RequiredArgsConstructor;

import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;


    // GET ALL USERS
    public List<User> getAllUsers() {

        return userRepository.findAll();

    }


    // GET USER BY ID
    public User getUserById(Long id) {

        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));

    }


    // CREATE USER
    public User createUser(User user) {

        return userRepository.save(user);

    }


    // DELETE USER
    public void deleteUser(Long id) {

        userRepository.deleteById(id);

    }

}
