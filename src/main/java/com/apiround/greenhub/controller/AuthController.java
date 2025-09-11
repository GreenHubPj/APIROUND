package com.apiround.greenhub.controller;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.service.AuthService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private record ApiResponse(String message) {}

    private final AuthService authService;
    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    // DTO 없이 엔티티로 바로 바인딩
    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody User body) {
        authService.signup(body);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(new ApiResponse("회원가입 성공"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<?> handleIllegalArgument(IllegalArgumentException e) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse(e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<?> handleEtc(Exception e) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse("회원가입 처리 중 오류가 발생했습니다."));
    }
}
