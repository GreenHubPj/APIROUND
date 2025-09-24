package com.apiround.greenhub.dto.user;

import lombok.Getter;
import lombok.Setter;
import java.time.LocalDate;

@Getter
@Setter
public class UserDto {
    private Integer userId;  // 엔티티와 동일 타입으로 통일
    private String name;
    private String email;
    private String phone;
    private String gender;
    private LocalDate birthDate;

    public UserDto() {}

    public UserDto(Integer userId, String name, String email, String phone, String gender, LocalDate birthDate) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.gender = gender;
        this.birthDate = birthDate;
    }
}
