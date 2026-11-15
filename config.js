/* =====================================================================
   배달 평점·리뷰 수 선호도 설문 — 공통 설정
   ---------------------------------------------------------------------
   ① SHEET_URL : 구글 Apps Script 웹 앱 주소(…/exec)를 붙여 넣으세요.
                 비워 두면 응답이 이 기기(브라우저)에만 저장됩니다(테스트용).
   ② 아래 실험 설계는 바꾸지 않는 것을 권장합니다(분석 페이지와 맞물려 있음).
   ===================================================================== */
window.SURVEY_CONFIG = {
  SHEET_URL: "https://script.google.com/macros/s/AKfycbyZ5OjYhGwu6_nq3GQHSjLZ7LGJM9Fvz4Ph-FlzsVujNOOUSawqyV8ojOg6dsN1fOm3/exec",            // 예: "https://script.google.com/macros/s/XXXX/exec"
  GROUPS_PER_PERSON: 3,     // 한 사람이 응답하는 그룹 수 (무작위 배정)
  SURVEY_VERSION: "v1",
};

/* ---------------------------------------------------------------------
   실험 설계: 5×5 라틴 방격
   - 평점 5단계 × 리뷰 수 5단계 = 25칸, 25개 매장이 한 칸씩 차지
   - 한 그룹 안에서 평점 단계·리뷰 단계가 각각 한 번씩만 등장
   - 전체로 보면 평점과 리뷰 수가 서로 독립(상관 0) → 각 효과를 따로 추정 가능
   - 그룹 안에서 가격·배달시간·배달팁·최소주문·사진은 모두 동일
   --------------------------------------------------------------------- */
(function () {
  const RATING_LEVELS = [4.1, 4.4, 4.6, 4.8, 5.0];
  const REVIEW_LEVELS = [8, 45, 260, 1500, 8800];          // 약 5.8배 간격(로그 등간격)

  // 그룹별 시프트 k : 리뷰단계 = (k - 평점단계) mod 5
  // A(k=4)는 '평점↑ 리뷰↓' 완전 트레이드오프, D(k=3)는 지배 매장 1개 포함 등 서로 다른 구도
  const GROUP_DEFS = [
    { id: "A", k: 4, mult: 1.00, category: "치킨",      emoji: "🍗", bg: "#f6e3c4",
      menu: "후라이드치킨", price: "20,000원", time: "35~50분", minOrder: "16,000원", tip: "0원~3,000원",
      names: ["바삭골목 치킨", "닭다방", "오늘의통닭", "황금깃털 치킨", "마당치킨상회"] },
    { id: "B", k: 2, mult: 0.93, category: "피자",      emoji: "🍕", bg: "#f8d9cf",
      menu: "페퍼로니 피자 L", price: "23,900원", time: "40~55분", minOrder: "18,000원", tip: "1,000원~3,500원",
      names: ["화덕공방", "도우랩", "치즈한판", "모퉁이 피자상점", "반죽하는집"] },
    { id: "C", k: 0, mult: 1.08, category: "족발·보쌈", emoji: "🍖", bg: "#ead8cc",
      menu: "앞다리 족발 중", price: "34,000원", time: "45~60분", minOrder: "25,000원", tip: "0원~3,000원",
      names: ["순덕이네 족발", "앞다리상회", "보쌈하는날", "장충골 족발", "달빛보쌈"] },
    { id: "D", k: 3, mult: 0.96, category: "분식",      emoji: "🌶️", bg: "#f7d4d4",
      menu: "국물떡볶이 2인", price: "14,000원", time: "25~40분", minOrder: "12,000원", tip: "1,500원~3,000원",
      names: ["빨간국물 분식", "학교앞 떡집", "쫄깃한오후", "매콤상점", "골목떡볶이 연구실"] },
    { id: "E", k: 1, mult: 1.04, category: "카페·디저트", emoji: "🍰", bg: "#f3e6f0",
      menu: "딸기 생크림 케이크", price: "8,500원", time: "30~45분", minOrder: "13,000원", tip: "2,000원~3,500원",
      names: ["구름베이커리", "오후세시 디저트", "달달상회", "크림한스푼", "밀가루정원"] },
  ];

  const stores = [];
  const groups = GROUP_DEFS.map((g) => {
    const list = RATING_LEVELS.map((rating, r) => {
      const c = ((g.k - r) % 5 + 5) % 5;
      const reviews = Math.max(3, Math.round(REVIEW_LEVELS[c] * g.mult));
      const s = {
        id: g.id + (r + 1),           // A1 ~ E5
        group: g.id,
        no: r + 1,
        name: g.names[r],
        rating, ratingLevel: r,
        reviews, reviewLevel: c,
      };
      stores.push(s);
      return s;
    });
    return { ...g, stores: list };
  });

  window.SURVEY_DESIGN = { RATING_LEVELS, REVIEW_LEVELS, groups, stores,
    storeById: Object.fromEntries(stores.map((s) => [s.id, s])) };
})();
