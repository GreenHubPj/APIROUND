package com.apiround.greenhub;

import com.apiround.greenhub.service.EmailCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest
class GreenhubApplicationTests {
    @Autowired
    EmailCodeService email;

	@Test
	void contextLoads() {
        System.out.println("============1");
        email.sendMail("ujkh00@gmail.com", "제목", "내용");
        System.out.println("===============2");
	}

}
