package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    @Override
    public User register(User user) {
        // 아이디 중복 체크
        if (userRepository.existsByLoginId(user.getLoginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        // 비밀번호 해싱 없이 그대로 저장 (데모 용)
        return userRepository.save(user);
    }

    @Override
    public User login(String loginId, String password) {
        // 평문 비밀번호로 검증 (데모 용)
        return userRepository.findByLoginIdAndPassword(loginId, password)
                .orElseThrow(() -> new IllegalArgumentException("아이디 또는 비밀번호가 올바르지 않습니다."));
    }
}
