package com.apiround.greenhub.service;

import com.apiround.greenhub.entity.User;
import com.apiround.greenhub.repository.UserRepository;
import com.apiround.greenhub.util.PasswordUtil;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;

    public AuthServiceImpl(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Override
    public User signup(User user) {
        if (user.getLoginId() == null || user.getLoginId().isBlank())
            throw new IllegalArgumentException("아이디는 필수입니다.");
        if (user.getPassword() == null || user.getPassword().isBlank())
            throw new IllegalArgumentException("비밀번호는 필수입니다.");

        if (userRepository.existsByLoginId(user.getLoginId()))
            throw new IllegalArgumentException("이미 사용 중인 아이디입니다.");
        if (user.getEmail() != null && !user.getEmail().isBlank()
                && userRepository.existsByEmail(user.getEmail()))
            throw new IllegalArgumentException("이미 가입된 이메일입니다.");

        // 비밀번호 해시 저장
        user.setPassword(PasswordUtil.encode(user.getPassword()));

        try {
            return userRepository.save(user);
        } catch (DataIntegrityViolationException e) {
            throw new IllegalArgumentException("아이디/이메일 중복 또는 잘못된 값입니다.");
        }
    }

    @Override
    @Transactional(readOnly = true)
    public User login(String loginId, String rawPassword) {
        User u = userRepository.findByLoginId(loginId)
                .orElseThrow(() -> new IllegalArgumentException("아이디가 존재하지 않습니다."));
        if (!PasswordUtil.matches(rawPassword, u.getPassword()))
            throw new IllegalArgumentException("비밀번호가 일치하지 않습니다.");
        return u;
    }
}