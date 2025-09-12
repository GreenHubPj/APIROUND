package com.apiround.greenhub.controller.mypage;

import com.apiround.greenhub.dto.mypage.OrderStatusDto;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.SessionAttribute;
import com.apiround.greenhub.dto.user.UserDto; // 사용자 정보를 담을 DTO가 필요합니다

@Controller
public class MyPageController {

    @GetMapping("/mypage")
    public String mypage(
        @SessionAttribute(name = "loginUser", required = false) UserDto loginUser,
        Model model
    ) {
        // 로그인한 사용자인 경우
        if (loginUser != null) {
            // TODO: 실제로는 여기서 사용자 ID를 기반으로 주문 현황을 조회하는 서비스를 호출해야 합니다.
            // 임시로 빈 주문 상태 객체를 생성합니다.
            OrderStatusDto orderStatus = new OrderStatusDto();
            
            // 모델에 사용자 정보와 주문 상태 추가
            model.addAttribute("currentUser", loginUser);
            model.addAttribute("orderStatus", orderStatus);
        }
        
        return "mypage";
    }
}
