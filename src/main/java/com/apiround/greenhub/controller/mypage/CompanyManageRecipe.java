package com.apiround.greenhub.controller.mypage;

import java.util.List;

import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import com.apiround.greenhub.entity.Company;
import jakarta.servlet.http.HttpSession;

import com.apiround.greenhub.entity.Recipe;
import com.apiround.greenhub.entity.RecipeIngredient;
import com.apiround.greenhub.entity.RecipeStep;
import com.apiround.greenhub.entity.RecipeXProduct;
import com.apiround.greenhub.service.AdminRecipeService;
import com.apiround.greenhub.service.RecipeService;
import lombok.RequiredArgsConstructor;

@Controller
@RequiredArgsConstructor
@RequestMapping("/admin/recipe-management")
public class CompanyManageRecipe {

    private final RecipeService recipeService;
    private final AdminRecipeService adminRecipeService;

    // 권한 체크: company_id = 3인 회사만 접근 가능
    private boolean hasRecipeManagementPermission(HttpSession session) {
        Company company = (Company) session.getAttribute("company");
        if (company == null) {
            return false;
        }
        // company_id = 3인 회사만 레시피 관리 권한 부여
        return company.getCompanyId() != null && company.getCompanyId().equals(3);
    }

    // 관리자용 레시피 관리 목록 페이지
    @GetMapping
    public String adminRecipeManagement(HttpSession session, Model model,
                                       @RequestParam(required = false) String search,
                                       @RequestParam(required = false) String status,
                                       @RequestParam(defaultValue = "0") int page,
                                       @RequestParam(defaultValue = "12") int size) {
        
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            model.addAttribute("error", "레시피 관리 권한이 없습니다.");
            return "error/403";
        }
        
        // 필터링된 레시피 조회 (데이터베이스 레벨에서 필터링)
        List<Recipe> allRecipes = adminRecipeService.getRecipesByStatusAndSearch(status, search);
        
        // 서버 사이드 페이징 적용
        long totalElements = allRecipes.size();
        int totalPages = totalElements > 0 ? (int) Math.ceil((double) totalElements / size) : 1;
        
        // 페이지 범위 검증
        if (page < 0) page = 0;
        if (page >= totalPages) page = totalPages - 1;
        
        int startIndex = page * size;
        int endIndex = Math.min(startIndex + size, allRecipes.size());
        
        List<Recipe> recipes;
        if (startIndex < allRecipes.size() && startIndex >= 0) {
            recipes = allRecipes.subList(startIndex, endIndex);
        } else {
            recipes = new java.util.ArrayList<>();
        }
        
        model.addAttribute("recipes", recipes);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalElements", totalElements);
        model.addAttribute("pageSize", size);
        model.addAttribute("searchTerm", search);
        model.addAttribute("statusFilter", status);
        
        return "admin/recipe-management";
    }

    // 레시피 상세 보기 (관리자용)
    @GetMapping("/{id}")
    public String adminRecipeDetail(HttpSession session, @PathVariable Integer id, Model model) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            model.addAttribute("error", "레시피 관리 권한이 없습니다.");
            return "error/403";
        }
        
        try {
            Recipe recipe = recipeService.getRecipe(id);
            if (recipe == null) {
                model.addAttribute("error", "레시피를 찾을 수 없습니다.");
                return "error/404";
            }
            
            List<RecipeIngredient> ingredients = recipeService.getIngredients(id);
            List<RecipeStep> steps = recipeService.getSteps(id);
            List<RecipeXProduct> products = recipeService.getProducts(id);

            model.addAttribute("recipe", recipe);
            model.addAttribute("ingredients", ingredients);
            model.addAttribute("steps", steps);
            model.addAttribute("products", products);
            return "admin/recipe-detail";
        } catch (Exception e) {
            System.err.println("레시피 상세보기 오류: " + e.getMessage());
            e.printStackTrace();
            model.addAttribute("error", "레시피 상세 정보를 불러오는 중 오류가 발생했습니다: " + e.getMessage());
            return "error/500";
        }
    }

    // 레시피 승인
    @PostMapping("/{id}/approve")
    @ResponseBody
    public ResponseEntity<?> approveRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.updateRecipeStatus(id, "APPROVED");
            return ResponseEntity.ok().body("레시피가 승인되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("승인 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 레시피 거부
    @PostMapping("/{id}/reject")
    @ResponseBody
    public ResponseEntity<?> rejectRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.updateRecipeStatus(id, "REJECTED");
            return ResponseEntity.ok().body("레시피가 거부되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("거부 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 레시피 게시
    @PostMapping("/{id}/publish")
    @ResponseBody
    public ResponseEntity<?> publishRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.updateRecipeStatus(id, "PUBLISHED");
            return ResponseEntity.ok().body("레시피가 게시되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("게시 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 레시피 삭제
    @PostMapping("/{id}/delete")
    @ResponseBody
    public ResponseEntity<?> deleteRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.deleteRecipe(id);
            return ResponseEntity.ok().body("레시피가 삭제되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("삭제 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 레시피 게시중단
    @PostMapping("/{id}/stop")
    @ResponseBody
    public ResponseEntity<?> stopRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.updateRecipeStatus(id, "STOP");
            return ResponseEntity.ok().body("레시피가 게시중단되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("게시중단 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }

    // 레시피 게시 재개
    @PostMapping("/{id}/re-publish")
    @ResponseBody
    public ResponseEntity<?> rePublishRecipe(HttpSession session, @PathVariable Integer id) {
        // 권한 체크
        if (!hasRecipeManagementPermission(session)) {
            return ResponseEntity.status(403).body("레시피 관리 권한이 없습니다.");
        }
        try {
            adminRecipeService.updateRecipeStatus(id, "PUBLISHED");
            return ResponseEntity.ok().body("레시피가 다시 게시되었습니다.");
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("게시 재개 처리 중 오류가 발생했습니다: " + e.getMessage());
        }
    }
}
