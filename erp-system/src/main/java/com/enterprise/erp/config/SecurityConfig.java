package com.enterprise.erp.config;

import com.enterprise.erp.security.filter.JwtAuthenticationFilter;
import com.enterprise.erp.security.service.UserDetailsServiceImpl;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity(prePostEnabled = true)
@RequiredArgsConstructor
public class SecurityConfig {

    private final UserDetailsServiceImpl userDetailsService;
    private final JwtAuthenticationFilter jwtAuthFilter;

    private static final String[] PUBLIC_URLS = {
        "/api/auth/**",
        "/swagger-ui/**",
        "/swagger-ui.html",
        "/api-docs/**",
        "/actuator/health"
    };

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session ->
                session.sessionCreationPolicy(SessionCreationPolicy.STATELESS)
            )
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers(PUBLIC_URLS).permitAll()

                // Admin only
                // .requestMatchers("/api/users/**").hasRole("ADMIN")
                .requestMatchers("/api/users/**").permitAll() // Temporarily allow all for testing
                .requestMatchers(HttpMethod.DELETE, "/api/**").hasRole("ADMIN")

                // Manager + Admin
                .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers("/api/purchase-orders/**").hasAnyRole("ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.POST, "/api/inventory/adjust").hasAnyRole("ADMIN", "MANAGER")

                // All authenticated users
                .requestMatchers("/api/products/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/inventory/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/sales-orders/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/suppliers/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/customers/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")
                .requestMatchers("/api/warehouses/**").hasAnyRole("ADMIN", "MANAGER", "STAFF")

                .anyRequest().authenticated()
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}
