package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.util.HashUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    @Override
    public User signup(User uPlain) {
        if (uPlain == null) throw new IllegalArgumentException("잘못된 요청입니다.");

        if (isBlank(uPlain.getLoginId()) ||
                isBlank(uPlain.getPassword()) ||
                isBlank(uPlain.getName()) ||
                isBlank(uPlain.getEmail()) ||
                isBlank(uPlain.getPhone())) {
            throw new IllegalArgumentException("필수값이 누락되었습니다.");
        }

        if (userRepository.existsByLoginId(uPlain.getLoginId())) {
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        }
        if (userRepository.existsByEmail(uPlain.getEmail())) {
            throw new IllegalArgumentException("이미 사용 중인 이메일입니다.");
        }

        User u = new User();
        u.setLoginId(uPlain.getLoginId());
        u.setPassword(HashUtil.sha256(uPlain.getPassword())); // 데모용 해시
        u.setName(uPlain.getName());
        u.setEmail(uPlain.getEmail());
        u.setPhone(uPlain.getPhone());
        u.setGender(uPlain.getGender());
        u.setBirthDate(uPlain.getBirthDate());
        u.setMarketingConsent(Boolean.TRUE.equals(uPlain.getMarketingConsent()));
        u.setSmsConsent(Boolean.TRUE.equals(uPlain.getSmsConsent()));

        return userRepository.save(u);
    }

    private boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
