# 작업 진행 로그

## 2026-04-27

### OpenRouter 모델 선택 UX 개선
- OpenRouter 모델을 환경변수로 고정하지 않고 OpenRouter Models API에서 동적으로 검색/조회하도록 변경.
- 텍스트 관련 모델만 표시하고 이미지/오디오/비디오 중심 모델은 제외.
- 기본 10개 로드 + 스크롤 기반 추가 로드 방식으로 최대 100개까지 표시.
- 정렬 드롭다운 추가: 최신 등록순, 컨텍스트 긴 순, 입력 비용 낮은 순, 출력 비용 낮은 순, 이름순.
- 모델 목록 각 행에 다음 정보를 표시: input 비용, output 비용, context 길이, release date.
- OpenRouter API key가 서버 env에 없을 경우, 기존과 동일하게 세션 일회성 API key 팝업 입력 유지.

### 관련 파일
- `src/app/api/openrouter/models/route.ts`
- `src/components/model/ModelManager.tsx`
- `src/lib/store/model-store.ts`
- `src/lib/config/openrouter.ts`
- `src/app/api/openrouter/config/route.ts`
- `src/lib/types/index.ts`
- `README.md`
