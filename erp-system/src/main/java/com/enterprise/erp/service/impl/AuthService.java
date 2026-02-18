package com.enterprise.erp.service.impl;
import com.enterprise.erp.dto.request.LoginRequest;
import com.enterprise.erp.dto.request.RegisterRequest;
import com.enterprise.erp.dto.response.JwtAuthResponse;
import com.enterprise.erp.entity.User;
import com.enterprise.erp.exception.DuplicateResourceException;
import com.enterprise.erp.repository.UserRepository;
import com.enterprise.erp.security.jwt.JwtTokenProvider;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
@Service @RequiredArgsConstructor @Slf4j
public class AuthService {
    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    @Transactional
    public JwtAuthResponse login(LoginRequest request) {
        Authentication auth = authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));
        User user = (User) auth.getPrincipal();
        user.setLastLogin(LocalDateTime.now());
        userRepository.save(user);
        String token = tokenProvider.generateToken(auth);
        log.info("User logged in: {}", user.getUsername());
        return JwtAuthResponse.builder()
            .accessToken(token).tokenType("Bearer")
            .expiresIn(tokenProvider.getExpirationMs())
            .username(user.getUsername())
            .role(user.getRole().name())
            .build();
    }
    @Transactional
    public String register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername()))
            throw new DuplicateResourceException("Username already taken: " + request.getUsername());
        if (userRepository.existsByEmail(request.getEmail()))
            throw new DuplicateResourceException("Email already registered: " + request.getEmail());
        userRepository.save(User.builder()
            .username(request.getUsername()).email(request.getEmail())
            .password(passwordEncoder.encode(request.getPassword()))
            .firstName(request.getFirstName()).lastName(request.getLastName())
            .role(request.getRole()).enabled(true).build());
        log.info("New user registered: {}", request.getUsername());
        return "User registered successfully";
    }
}
