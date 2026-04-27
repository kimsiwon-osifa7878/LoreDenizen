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

### OpenRouter 다국어/비용 표기 및 선택 플로우 개선
- OpenRouter/Ollama 설정 탭의 하드코딩 한국어 문구를 i18n 키로 치환하여 영어 UI에서도 문구가 영어로 일관되게 표시되도록 수정.
- OpenRouter 모델 가격 표기를 `$ / token`에서 `$ / 1M tokens` 단위로 변경.
- OpenRouter 모델 리스트 각 행에 개별 `Select` 버튼을 추가하고, 선택 시 즉시 연결되도록 UX 변경.
- `.env`에 `OPENROUTER_API_KEY`가 없는 경우, 모델 선택 시점에 세션용 API key 입력 팝업을 띄우도록 유지/정리.
- 하단의 `Connect OpenRouter` 버튼 제거.

### OpenRouter 최신 모델 노출 이슈 대응
- 기존 필터가 텍스트 이외 모달리티(image/audio/video)를 포함한 모델을 제외하고 있어, 텍스트 입출력을 지원하는 최신 멀티모달 모델이 목록에서 누락될 수 있음을 확인.
- 필터를 "텍스트 입력 + 텍스트 출력 가능 모델" 기준으로 완화하여 최신 GPT 계열(멀티모달 포함)도 목록에 노출될 수 있도록 수정.

### 관련 파일
- `src/components/model/ModelManager.tsx`
- `src/lib/i18n.ts`
- `src/app/api/openrouter/models/route.ts`
