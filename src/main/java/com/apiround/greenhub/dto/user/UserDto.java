package com.apiround.greenhub.dto.user;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class UserDto {
    private Long userId;
    private String name;
    private String email;
    private String phone;
    private String gender;
    private LocalDate birthDate;
    
    // 기본 생성자
    public UserDto() {}
    
    // 모든 필드를 포함한 생성자
    public UserDto(Long userId, String name, String email, String phone, String gender, LocalDate birthDate) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.birthDate = birthDate;
    }
}
