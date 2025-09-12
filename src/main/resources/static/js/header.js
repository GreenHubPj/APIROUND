// /static/js/header.js
document.addEventListener('DOMContentLoaded', () => {
  console.log('Header JS 로드됨');
  
  const btnLogout = document.getElementById('btnLogout');
  console.log('로그아웃 버튼 찾기:', btnLogout);
  
  if (btnLogout) {
    console.log('로그아웃 버튼 이벤트 리스너 추가');
    btnLogout.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('로그아웃 버튼 클릭됨!');
      
      // 간단한 확인
      if (confirm('정말 로그아웃하시겠습니까?')) {
        try {
          console.log('로그아웃 API 호출 시작');
          const response = await fetch('/api/auth/logout', { 
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('로그아웃 응답 상태:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('로그아웃 성공:', data);
            alert('로그아웃되었습니다.');
          } else {
            console.log('로그아웃 실패');
            alert('로그아웃에 실패했습니다.');
          }
        } catch (err) {
          console.error('로그아웃 요청 실패:', err);
          alert('네트워크 오류가 발생했습니다.');
        } finally {
          console.log('홈페이지로 리다이렉트');
          window.location.href = '/';
        }
      }
    });
  } else {
    console.log('로그아웃 버튼을 찾을 수 없습니다. 로그인 상태를 확인해주세요.');
  }
});
