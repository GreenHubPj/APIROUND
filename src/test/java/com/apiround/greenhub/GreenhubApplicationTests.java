package com.apiround.greenhub;

import com.apiround.greenhub.dto.mypage.MyPageRecipeRequestDto;
import com.apiround.greenhub.dto.mypage.MyPageRecipeResponseDto;
import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.repository.RecipeRepository;
import com.apiround.greenhub.service.EmailCodeService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@SpringBootTest
class GreenhubApplicationTests {
    @Autowired
    EmailCodeService email;

    @Autowired
    RecipeRepository recipeRepository;

    @Transactional
    @Test
    void repositoryTest(){
        List<Recipe> rec = recipeRepository.findByUserId(1);
         System.out.println("rec" + rec);
    }

	/*@Test
	void contextLoads() {
        System.out.println("============1");
        email.sendMail("ujkh00@gmail.com", "제목", "내용");
        System.out.println("===============2");
	}*/

}
