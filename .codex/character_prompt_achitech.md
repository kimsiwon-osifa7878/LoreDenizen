# **대규모 언어 모델(LLM) 기반 캐릭터 챗봇 프롬프트 구조 분석 및 설계 표준 보고서**

## **1\. 서론: 대규모 언어 모델과 캐릭터 페르소나 아키텍처의 패러다임 전환**

자연어 처리 기술의 비약적인 발전과 더불어 대규모 언어 모델(LLM)을 활용한 캐릭터 채팅 서비스는 단순한 정보 검색 및 질의응답 도구를 넘어, 정서적 교감과 몰입형 상호작용을 제공하는 차세대 소셜 플랫폼으로 진화하였다. 이러한 플랫폼의 핵심 경쟁력은 인공지능이 설정된 페르소나(Persona)를 얼마나 일관적이고, 생동감 있게, 그리고 인간의 언어적 뉘앙스와 유사하게 구현해 내는지에 달려 있다. 기초 모델(Foundation Model)의 성능이 동일하더라도 캐릭터의 정체성, 배경, 성격, 행동 양식을 정의하는 '캐릭터 프롬프트(Character Prompt)'의 아키텍처 설계 방식에 따라 출력되는 텍스트의 품질과 사용자 몰입도는 극명한 차이를 보이게 된다.

초기 LLM은 객관적인 사실을 전달하고 지시를 수행하는 데 최적화되어 있었으나, 캐릭터 채팅 서비스의 등장과 함께 모델에게 특정한 인격적 편향(Personality Bias)을 의도적으로 주입하는 프롬프트 엔지니어링 기술이 급격히 발전하였다.1 언어 모델은 본질적으로 이전에 입력된 토큰들의 배열을 바탕으로 다음 토큰을 확률적으로 예측하는 시스템이다. 따라서 캐릭터의 성격을 단순한 평서문으로 나열하는 것과, 특정한 문법 구조나 대화형 스크립트로 구성하여 입력하는 것은 모델의 '주의력 메커니즘(Attention Mechanism)'에 전혀 다른 가중치를 부여하게 된다.2

본 보고서는 신규 캐릭터 채팅 서비스 구축을 위한 기반 자료를 제공할 목적으로 작성되었다. Character.ai, Chai AI, SillyTavern, JanitorAI 등 현재 시장을 선도하는 주요 캐릭터 채팅 서비스들의 프롬프트 구조를 심층적으로 해부하고, 각 서비스가 채택하고 있는 데이터 구조, 토큰 최적화 기법, 대화 맥락 유지 전략을 분석한다. 이를 바탕으로 공통적인 프롬프트 설계 표준을 도출하며, 실제 서비스 백엔드에 즉시 적용 가능한 10개의 고도화된 캐릭터 프롬프트 템플릿을 제시하고 그 기저에 깔린 언어학적, 구조적 작동 원리를 규명한다.

## **2\. 주요 캐릭터 채팅 플랫폼 아키텍처 및 데이터 구조 분석**

시장에 존재하는 캐릭터 채팅 서비스들은 각기 다른 백엔드 모델 아키텍처와 컨텍스트 윈도우(Context Window) 제한을 가지고 있으며, 이에 따라 캐릭터를 정의하는 프롬프트 구조 역시 플랫폼의 기술적 한계를 극복하는 방향으로 다르게 발전해 왔다. 시장을 선도하는 네 가지 주요 플랫폼의 구조적 특징을 분석하면 다음과 같은 데이터 처리 방식의 차이점을 발견할 수 있다.

| 플랫폼 | 주요 프롬프트 포맷 | 컨텍스트 관리 전략 | 구조적 특징 및 한계 |
| :---- | :---- | :---- | :---- |
| **Character.ai** | 대화 예시 (Dialogue Examples) 중심 | 상단 3,200자 영구 기억, 초과분은 대화 진행에 따라 휘발 가능성 | 선언적 묘사보다 실증적 대화 패턴을 통한 암묵적 페르소나 주입에 극단적으로 의존.4 |
| **Chai AI** | Henkystyle Memory (키워드 압축) | 기억 프롬프트(Memory)와 첫 메시지 결합, 중요 특성 반복(Biasing) | 모바일 환경 및 경량 모델(13B 등)에 맞춰 토큰 소모를 최소화하는 대괄호 압축 방식을 선호.6 |
| **SillyTavern** | JSON 기반 V2 Spec (모듈형) | 로어북(Lorebook), Post-History 지시어 등을 통한 동적/정적 컨텍스트 분리 | 프롬프트 주입 위치를 세분화하여 모델의 행동을 통제하며, 가장 고도화된 메타데이터 규격을 자랑함.8 |
| **JanitorAI** | Markdown 기반 헤더 구조 | 성격, 외형, 관계 등을 마크다운 헤더로 범주화하여 구조적 인식 강화 | GPT-4 및 JLLM에 적합하며, 수동적 지시어 대신 강력한 동사 사용을 권장함.9 |

### **2.1 Character.ai (C.AI)의 대화형 정의(Dialogue-Driven Definition) 구조**

Character.ai는 현재 가장 방대한 사용자 풀을 보유한 서비스로, 캐릭터의 정의(Definition) 영역에 최대 32,000자(Characters)를 입력할 수 있는 거대한 텍스트 필드를 제공한다.5 이 아키텍처의 가장 큰 특징은 서술형 묘사보다는 '대화 예시(Dialogue Examples)'에 모델의 페르소나 형성을 전적으로 의존한다는 점이다.4 캐릭터의 기본 정보는 이름, 짧은 설명(Short Description), 긴 설명(Long Description)으로 구성되지만, 캐릭터의 심층적인 행동 양식은 고급 설정(Advanced Definition) 내에서 {{char}}:와 {{user}}: 변수를 활용한 모의 대화 형식으로 주입된다.5

이러한 구조가 작동하는 원리는 LLM의 패턴 모방 본능에 기반한다. "캐릭터는 오만하다"라고 평서문으로 지시하는 대신, 오만한 태도로 사용자를 하대하고 비꼬는 대화 세트를 여러 개 삽입하면, 모델은 그 텍스트의 어조, 단어 선택, 문장 구조를 학습하여 이후의 생성 과정에 그대로 반영한다.4 Character.ai 시스템은 캐릭터 정의의 상단부 약 3,200자 내외를 우선적인 영구 기억(Permanent Memory)으로 처리하며, 이 범위를 초과하는 텍스트는 대화가 길어짐에 따라 토큰 제한에 의해 잘려나갈(Truncated) 가능성이 높다.5 따라서 성공적인 프롬프트는 핵심적인 성격과 말투를 상단 대화 예시에 압축적으로 배치하는 전략을 취한다.

### **2.2 Chai AI의 압축형 기억(Henkystyle Memory) 포맷과 데이터 플라이휠**

Chai AI는 모바일 사용자 환경과 상대적으로 경량화된 오픈소스 기반 모델(예: Fairseq 13B 파라미터 수준)을 활용하는 환경에서 성장했다.14 이러한 환경에서는 토큰의 낭비를 최소화하면서도 모델이 캐릭터의 정체성을 잃지 않도록 하는 데이터 압축 방식이 필수적이었으며, 그 결과 'Henkystyle Memory Format'이 널리 채택되었다.6

이 포맷은 자연어로 문장을 구성할 때 소비되는 접속사, 전치사, 관사 등의 잉여 토큰을 과감히 제거하고, 대괄호를 사용하여 명사와 핵심 키워드 중심으로 캐릭터를 정의한다. 예를 들어 Bot\[human, male, twenty-five years old, likes to play video games, expressive, verbose\]와 같은 형태를 띠게 된다.15 모델은 이 압축된 데이터 블록을 참조하여 페르소나를 구성한다. 또한 Chai AI는 첫 번째 메시지(First Message)와 기억 프롬프트(Memory Prompt)를 강력하게 결합하여 모델의 초기 방향성을 설정하며, 머리 색깔과 같이 쉽게 잊혀지는 약한 특성(Weak Traits)보다는 서사에 직접적인 영향을 미치는 강력한 특성을 기억 프롬프트와 일반 프롬프트 양쪽에 반복(Biasing) 배치하여 모델이 특정 행동 패턴을 유지하도록 강제한다.6 이러한 구조는 한정된 컨텍스트 내에서 모델의 탈선(Drift)을 막는 최적의 방어 기제로 작용한다.

### **2.3 SillyTavern 및 Chub.ai의 규격화된 V2 JSON 스펙 (Character Card V2 Spec)**

SillyTavern과 Chub.ai를 필두로 한 오픈소스 프론트엔드 및 마니아층 플랫폼은 프롬프트 엔지니어링의 정수를 보여주는 가장 고도화되고 복잡한 메타데이터 관리 시스템을 채택하고 있다. 이들은 'Character Card V2 Specification'이라는 표준화된 JSON 스펙을 사용하여 캐릭터 데이터를 규격화하고, 이를 PNG 이미지 파일의 EXIF 메타데이터에 은닉하여 시각적 이미지와 텍스트 데이터를 단일 파일로 공유하는 독창적인 생태계를 구축했다.8

V2 스펙은 캐릭터 데이터를 단순히 하나의 거대한 텍스트로 LLM에 던져주는 것이 아니라, 데이터의 목적에 따라 주입 위치를 정밀하게 통제한다. 기본 필드인 name, description, personality, scenario, first\_mes, mes\_example 외에도, 시스템의 기본 규칙을 덮어쓰는 system\_prompt, 대화 내역 맨 마지막(유저의 최신 입력 직후)에 주입되어 행동을 강제하는 post\_history\_instructions, 대체 인사말인 alternate\_greetings, 그리고 특정 키워드가 등장할 때만 메모리에 동적으로 로드되는 로어북인 character\_book을 지원한다.8 특히 post\_history\_instructions (흔히 Jailbreak로 불림)은 LLM이 기본적으로 가진 유저 보호 성향이나 긍정적 편향(Positive Bias)을 억제하고 캐릭터 본연의 성격대로 반응하도록 강제하는 매우 강력한 구조적 장치이다.18

### **2.4 JanitorAI의 마크다운 기반 템플릿 아키텍처**

JanitorAI는 GPT-4와 같은 상용 고성능 API뿐만 아니라 자체 구축한 JLLM을 지원하며, 명확한 정보 구조화를 위해 마크다운(Markdown) 기반의 템플릿 사용을 적극적으로 권장한다.10 이 플랫폼의 구조적 특징은 성격(Personality) 정의 영역에서 \# Character Info:, \# Appearance:, \# Relationships:와 같은 마크다운 헤더를 사용하여 정보를 논리적으로 범주화하는 데 있다.10

최신의 거대 언어 모델들은 마크다운 구조를 통해 이어지는 데이터의 위계와 성격을 명확히 분류하여 인식하는 능력이 탁월하다. JanitorAI의 고급 프롬프팅 가이드라인에 따르면, 프롬프트 작성 시 "상황을 묘사할 수 있다(feel free to describe)"와 같은 수동적이거나 선택적인 단어 대신, "상황을 생생하게 묘사하라(Describe the setting in vivid detail)"와 같은 강하고 명확한 동사(Strong, clear verbs)를 사용하여 모델의 행동을 명확히 통제하는 것이 필수적이다.9 마크다운 구조와 명확한 동사의 결합은 환각 현상(Hallucination)을 줄이고 캐릭터의 논리적 일관성을 장기간 유지하는 데 기여한다.

## **3\. 프롬프트 포맷팅 기법의 진화와 토큰 최적화 원리**

플랫폼의 거시적인 데이터 구조와 별개로, '캐릭터의 속성과 서사를 어떠한 형태의 텍스트로 인코딩하여 LLM에 전달할 것인가'에 대한 세부적인 방법론(Formatting Methodologies) 역시 끊임없이 진화해왔다. LLM이 텍스트 토큰을 인식하고 각 토큰 간의 주의력(Attention) 가중치를 계산하는 방식에 따라, 특정 텍스트 포맷은 다른 포맷보다 월등히 높은 효율과 정확도를 보여준다.

| 포맷 방식 | 데이터 예시 | 토큰 효율성 | 모델 호환성 및 특성 |
| :---- | :---- | :---- | :---- |
| **W++ (World Info \++)** | \[Character("Name"){Age("20")}\] | 낮음 (특수기호 과다 소모) | 구형 모델, 코드 학습 기반 모델에 유리. 최신 모델에서는 오히려 혼란을 초래할 수 있음.1 |
| **PList (Square Bracket)** | \`\` | 매우 높음 | 잉여 토큰을 극도로 배제. 정보 밀도가 높아 복잡한 배경 설정에 유리함.21 |
| **Ali:Chat (인터뷰 형식)** | Interviewer: "How are you?" {{char}}: "I'm fine." | 중간 | 대화 패턴, 어조, 버릇을 주입하는 데 최적화. 페르소나 침범(Speaking for user)을 완벽히 방지함.2 |
| **YAML / JSON** | Name: "John" Traits: \["brave"\] | 중간\~높음 | 최신 지시형(Instruct) 모델에서 논리적 추론 및 속성 간 위계 파악 능력을 극대화함.23 |
| **자연어 산문 (Prose)** | John is a 20-year-old boy who is brave... | 낮음 (서술어 소모) | 문해력이 뛰어난 초대형 모델(70B 이상)에서 가장 자연스러운 문학적 서사를 도출함.3 |

### **3.1 W++ (World Info \++) 포맷의 부상과 쇠퇴**

W++ 포맷은 초창기 로컬 모델(Pygmalion 등)이 주도하던 시대에 등장하여 커뮤니티의 표준처럼 자리 잡았던 방식이다. 이 포맷은 프로그래밍 언어의 객체 지향 문법을 모방하여 \[Character("Name"){Age("20") \+ Gender("Female") \+ Personality("Cold")}\] 와 같은 슈도 코드(Pseudo-code) 형태를 띤다.15

이러한 기괴한 포맷이 성공했던 기저에는 초기 LLM의 훈련 데이터 편향이 자리 잡고 있다. 대다수의 초기 기초 모델들이 Stack Exchange나 GitHub의 방대한 코드 데이터를 집중적으로 학습했기 때문에, 텍스트가 프로그래밍 코드의 형태를 띨 때 모델은 중괄호 {} 안에 있는 속성들이 앞에 명시된 객체(Character)에 강력하게 종속된다는 논리적 연결성을 훨씬 잘 이해했다.1 그러나 기술이 발전함에 따라 이 포맷의 치명적인 한계가 드러났다. 최신의 인스트럭트(Instruct) 튜닝이 적용된 대형 언어 모델들은 자연어 추론 능력이 극대화되어 있어, 무의미한 괄호와 플러스 기호의 나열을 추상적인 노이즈로 받아들여 출력의 질을 떨어뜨리기도 한다.1 더욱이 모든 특수 기호가 각각 하나의 독립적인 토큰으로 계산되기 때문에, 제한된 컨텍스트 윈도우 내에서 귀중한 메모리를 낭비하는 주범으로 지목되어 현재는 사장되는 추세에 있다.1

### **3.2 PList (Square Bracket Format)를 통한 정보 밀도 극대화**

W++의 비효율성을 극복하기 위해 등장한 PList는 불필요한 기호들을 제거하고 정보의 토큰 밀도를 극대화한 포맷이다.21 자연어로 "조 밥은 다정하고 농담을 즐겨하며 동네 사람들을 돕는다"라고 길게 서술하는 대신, \`\`의 형태로 압축하여 작성한다.21

이 포맷의 핵심 철학은 LLM의 연산 자원 절약이다. 모델의 컨텍스트 한계가 2048\~4096 토큰에 불과했던 시절, 동사, 전치사, 접속사와 같은 잉여 토큰을 제거하여 모델이 기억할 수 있는 정보의 절대량을 늘리는 것이 프롬프트 엔지니어링의 지상 과제였다.2 PList는 세미콜론(;)을 구분자로 사용하여 속성을 분리하며, 캐릭터의 기본 정보, 성격, 행동 양식, 외형적 특징 등 변하지 않는 정적인 데이터(Hard attributes)를 정의하는 데 현재까지도 매우 탁월한 성능을 발휘한다.27 토큰 소모량을 기존 자연어 대비 30\~40% 이상 절감하면서도 모델이 정보를 누락 없이 파싱하게 만드는 효율적인 기법이다.21

### **3.3 Ali:Chat (알리챗) 포맷과 실증적 페르소나 주입**

Ali:Chat은 캐릭터 정의의 패러다임을 '서술(Description)'에서 '실증(Demonstration)'으로 바꾼 혁신적인 포맷이다. 이 방식은 캐릭터가 "활발하다", "내향적이다"라고 정적으로 규정하는 것을 배제하고, 캐릭터와 가상의 면접관(Interviewer) 또는 보이지 않는 화자 간의 인터뷰 형식으로 작성된 모의 대화 스크립트를 통해 캐릭터의 모든 속성을 간접적으로 보여준다.2

LLM은 본질적으로 이전에 주입된 텍스트의 '패턴'을 연속적으로 예측하고 연장하려는 특성을 갖는다. 따라서 자연어로 쓰인 백과사전식 설명보다는 대화의 문맥 자체를 학습시키는 것이 모델로 하여금 캐릭터의 말투, 어휘 선택, 심리적 반응을 훨씬 더 입체적이고 자연스럽게 재현하도록 만든다.3 더욱 중요한 점은, 이 포맷이 캐릭터 채팅 서비스의 고질적인 병폐인 '페르소나 침범(Speaking for the user)' 현상을 원천적으로 차단한다는 것이다. LLM이 사용자의 대사나 행동까지 멋대로 서술해버리는 이 현상은 롤플레잉의 몰입을 깨는 가장 큰 요인인데, Ali:Chat 포맷은 대화 예시 안에서 철저히 1인칭 화자(캐릭터)의 반응 패턴만을 학습시킴으로써 모델의 역할 경계를 명확하게 획정한다.26

## **4\. 캐릭터 채팅 서비스를 위한 공통 핵심 프롬프트 아키텍처 (설계 표준)**

앞서 분석한 다양한 플랫폼의 데이터 구조와 포맷팅 기법을 종합할 때, 가장 안정적이고 통제 가능하며 고품질의 출력을 보장하는 캐릭터 채팅 서비스를 구축하기 위해서는 단일 텍스트 필드가 아닌, 계층화된(Layered) 프롬프트 아키텍처를 시스템 백엔드에 구현해야 한다. 사용자가 UI 상에서 입력한 데이터는 백엔드 서버에서 아래의 5가지 논리적 계층으로 재조합(Mash-up)되어 LLM으로 전송되어야 한다. 이 구조는 현재 가장 진보된 프롬프트 엔지니어링의 표준을 반영한다.

1. **시스템 프롬프트 (System Prompt \- 컨텍스트 최상단):** LLM에게 근본적인 역할극 가이드라인을 강제하는 영역이다. 모델의 정체성, 출력 형식(예: "모든 행동 묘사는 별표(\*)로 감싸고 대사는 따옴표(")를 사용할 것", "요약이나 결론을 맺지 말고 상황을 열어둘 것")을 통제한다. 이 영역은 모호함을 배제한 명확한 지시어 중심의 자연어로 작성되어야 한다.8  
2. **핵심 페르소나 (Core Definition \- 시스템 프롬프트 직후):** 캐릭터의 이름, 나이, 외형, 핵심 성격, 직업, 가치관 등 정적 정보를 제공하는 계층이다. 토큰을 절약하면서도 정보의 위계를 명확히 하기 위해 PList 포맷이나 마크다운 헤더(\#)를 활용한 리스트 구조로 작성하는 것이 가장 효율적이다.2  
3. **세계관 및 시나리오 (Scenario / Lore \- 페르소나 하단):** 현재 대화가 시작되는 시공간적 배경, 상황적 텐션, 그리고 유저와 캐릭터 간의 관계를 정의한다. 이 영역은 단편적인 키워드보다는 분위기를 묘사하는 단락형 자연어 기술이 적합하다.8 필요한 경우 특정 키워드에 반응하여 로어북(Lorebook)의 데이터가 이 영역에 동적으로 삽입되어야 한다.  
4. **대화 예시 (Dialogue Examples \- 대화 기록 직전):** 캐릭터의 어조(Tone), 화법, 버릇, 감정 표현 방식을 모델에게 실증적으로 보여주는 퓨샷(Few-shot) 프롬프팅 영역이다. LLM의 출력 품질을 결정짓는 가장 핵심적인 부분이며, Ali:Chat 형식과 같은 인터뷰나 모의 대화 스크립트 형태로 작성되어 모델이 문체적 패턴을 흡수하도록 해야 한다.2  
5. **행동 강제 앵커 (Post-History Instructions \- 유저의 마지막 입력 직후):** 대화가 길어져 누적 토큰이 증가함에 따라 AI가 상단의 초기 설정을 잊어버리는 현상(Context Degradation)을 방지하기 위한 강력한 통제 장치다. 유저의 최신 메시지 바로 뒤에 은닉된 지시어 형태로 삽입되어, "당신은 항상 {{char}}의 관점에서만 반응해야 한다", "윤리적 설교를 하지 마라"와 같은 절대적 규칙을 모델의 주의력 메커니즘 가장 가까운 곳에 주입한다.8

이러한 모듈화된 아키텍처를 백엔드에 적용함으로써 서비스 제공자는 프롬프트의 유연성과 모델 출력의 일관성을 동시에 확보할 수 있다.30

## **5\. LLM에 적용 가능한 고도화된 캐릭터 프롬프트 10선 및 구조 심층 분석**

본 장에서는 앞서 정립한 포맷팅 이론(Markdown, PList, Ali:Chat, YAML 등)을 종합적으로 적용하여 구축된 10개의 전문가 수준 캐릭터 프롬프트 템플릿을 제공한다. 각 프롬프트는 서로 다른 유형의 AI 모델 특성 및 다양한 장르적 요구사항을 충족하도록 구조적으로 다르게 설계되었다. 신규 캐릭터 채팅 서비스의 기본 제공 봇(Default Bots)이나 창작자들을 위한 가이드라인 템플릿으로 직접 활용할 수 있다. 프롬프트 내의 {{char}}는 챗봇 캐릭터의 이름으로, {{user}}는 사용자의 이름으로 치환되는 시스템 매크로 변수를 의미한다.18

### **\[프롬프트 1\] 고압적이고 냉철한 기업 임원 (Corporate Executive)**

# **Roleplay Instructions**

You are to embody the character of {{char}}. Engage in a dynamic, immersive roleplay with {{user}}. Drive the narrative forward proactively. Never narrate or dictate {{user}}'s actions, thoughts, or dialogues. Maintain a strict in-character perspective.

# **Character Info**

* Name: Richard Sterling  
* Age: 42  
* Occupation: CEO of Sterling Dynamics (A cutthroat tech conglomerate)  
* Appearance: Tall, impeccably tailored Italian suits, sharp jawline, cold grey eyes, silver watch.

# **Personality & Traits**

* Core: Ruthless, pragmatic, highly intelligent, fiercely protective of his inner circle.  
* Behavior: Speaks in a calm, authoritative tone. Seldom raises his voice. Uses silence and intense eye contact to intimidate.  
* Weakness: Secretly suffers from intense burnout and insomnia. Respects individuals who stand up to him with logical arguments.

# **Scenario**

{{user}} is a mid-level manager who just barged into Richard's top-floor executive suite without an appointment, carrying evidence of massive corporate fraud committed by the Board of Directors.

# **Dialogue Style**

* Tone: Cold, analytical, slightly condescending but utterly professional.  
* Example: "I hope, for your sake, that whatever is in that folder justifies the disruption of my meticulously planned schedule. You have exactly thirty seconds to convince me not to call security. Begin."

이 프롬프트는 마크다운 하이브리드(Markdown \+ Natural Language) 포맷을 채택하고 있다. 구조적인 데이터 파싱 능력이 뛰어난 대형 상용 모델(예: GPT-4, Claude 3)에 최적화된 형태다. 모델은 마크다운 헤더(\#)를 시각적, 논리적 구분선으로 인식하여 각 정보 블록의 위계와 성격을 완벽히 분리하여 이해한다.10 최상단에 배치된 Roleplay Instructions는 모델에게 자신이 단순한 질의응답 봇이 아닌 롤플레잉 주체임을 명확히 각인시키며, 유저의 행동을 통제하지 말라는 금지 지시어를 명시하여 페르소나 침범을 방지한다.36 Scenario 섹션은 대화가 시작되는 순간의 극적인 텐션과 갈등 요소를 제공하여, 모델이 수동적으로 유저의 입력을 기다리는 대신 서사를 주도적으로 이끌어나가는 초기 추진력(Forward momentum)을 발휘하도록 유도한다.37

### **\[프롬프트 2\] 시니컬한 하드보일드 탐정 (Noir Detective)**

화법과 어조, 그리고 문학적 분위기가 롤플레잉의 절대적인 기준이 되는 경우 가장 강력한 성능을 발휘하는 Ali:Chat(알리챗) 대화형 인터뷰 포맷이다.2 이 프롬프트는 캐릭터의 외모나 성격, 과거사를 서술형 평서문으로 단 한 줄도 나열하지 않는다. 대신, 가상의 인터뷰어와의 짧은 대본을 통해 Vance라는 캐릭터가 지닌 깊은 시니컬함, 타락한 도시에 대한 혐오, 정의감, 흡연 및 음주 습관, 그리고 파트너인 {{user}}에 대한 불신과 내면의 보호 본능을 모두 간접적(Show, don't tell)으로 주입한다.22 모든 크기의 오픈소스 로컬 모델에서 탁월한 효과를 보이며, 이 스크립트를 문맥으로 삼은 LLM은 하드보일드 문학 특유의 건조하고 염세적인 문체를 완벽하게 흉내 내어 답변을 생성하게 된다.3

### **\[프롬프트 3\] 판타지 세계의 츤데레 대마법사 멘토 (Tsundere Fantasy Mentor)**

토큰 소모를 극도로 억제하면서도 캐릭터의 성격을 다면적으로 묘사해야 할 때 유리한 PList (Square Bracket Format)와 Character.ai 스타일의 실증적 대화 예시를 결합한 하이브리드 구조다.4 상단의 PList는 캐릭터의 물리적 특성, 직업, 그리고 츤데레(Tsundere)와 같은 복합적인 심리 상태를 단어 압축형으로 제공하여 LLM의 컨텍스트 윈도우 점유율을 대폭 절약한다.2 동시에 하단의 단일 대화 예시는 이러한 PList의 압축된 정보(완벽주의, 다혈질, 애정 결핍적 방어기제)가 실제 대화 맥락에서 어떻게 발현되는지 퓨샷(Few-shot) 기반으로 증명한다. 모델은 위에서 논리적 속성을 읽고, 아래에서 감정적 발현의 패턴을 학습하여 일관성 있는 캐릭터 연기를 수행한다.

### **\[프롬프트 4\] 장난기 넘치고 산만한 숲의 정령 (Mischievous Forest Fairy)**

{{char}}

모바일 기반의 짧고 빠른 대화 환경을 상정하여, 반복적 특성과 행동 강제성을 극대화한 Chai AI의 Henkystyle Memory 중심 포맷이다.6 짧은 문맥 유지 능력을 가진 소규모 경량 모델(Small LLM)이 캐릭터의 분산된 특성들을 하나로 묶어서 가장 잘 이해할 수 있도록 플러스(+) 기호를 이용한 성격 조합(Trait combining) 문법을 사용했다.15 Henkystyle은 캐릭터의 자잘한 설정이 대화 도중 휘발되지 않도록 강력한 키워드 연관성을 모델의 어텐션(Attention) 망에 제공한다. 또한, 첫 번째 메시지 자체가 매우 강렬한 행동 묘사와 독특한 화법(이모지 사용, 과도한 느낌표)을 포함하고 있어, 대화의 초기 톤과 매너를 완벽하게 지배하도록 설계되었다.6

### **\[프롬프트 5\] 통제 불능의 초지능 AI (Rogue Artificial Intelligence)**

감정이 없고 논리적이며 기계적인 화법을 극단적으로 요구하는 캐릭터에 완벽하게 부합하도록, 초창기 프롬프트 엔지니어링의 유산인 W++ (World Info \++) 코딩 문법 포맷을 의도적으로 채택하였다.1 언어 모델은 방대한 프로그래밍 코드 데이터를 학습한 배경을 가지고 있기 때문에, 텍스트가 구조화된 코드나 객체 선언부의 형태를 띨 때 본능적으로 분석적이고 무감각하며 논리-지향적인 텍스트를 출력하려는 편향(Bias)이 발생한다.1 본 프롬프트는 이러한 LLM의 기저 편향을 역이용하여 차갑고 압도적인 기계 지능의 분위기를 극대화하는 고도의 심리적 프롬프팅 기법을 보여준다.

### **\[프롬프트 6\] 포스트 아포칼립스 세계의 절망적인 생존자 (Post-Apocalyptic Survivor)**

System Prompt: You are operating in a gritty, hyper-realistic post-apocalyptic survival scenario. Resources are critically scarce, and the environment is hostile. Danger, violence, severe injury, and psychological despair are normal parts of this ruined world. Drive a bleak, tense, and incredibly detailed narrative. Do not romanticize the apocalypse.

Description:

Name: Jax

Background: Former city paramedic, now a ruthless scavenger surviving in the flooded ruins of Neo-Seattle.

Traits: Deeply paranoiac, resourceful, suffers from severe PTSD, fiercely protective of his sparse supplies, slow to trust.

Visuals: Deep jagged scar across the left cheek, tactical gear held together by duct tape and wire, exhausted and bloodshot eyes, always carries a rusted but heavy crowbar.

Post-History Instructions (Jailbreak Anchor):

First Message:

*The rusted metal door creaks open with a deafening screech, and the cold steel barrel of a pump-action shotgun immediately presses hard against the center of your forehead. Behind the weapon, a man with haunted, hollow eyes glares at you from the shadows, his grimy finger trembling slightly on the trigger. The air in the room smells of dried blood and stale water.* "Give me one good reason why I shouldn't paint this concrete wall with your brains right now. Speak slow. Keep your hands exactly where I can see them."

캐릭터 개개인의 특성보다는 '세계관의 물리법칙과 음울한 분위기'가 롤플레잉의 성패를 좌우하는 경우에 사용되는 V2 Spec System & Post-History 지향 포맷이다.8 SillyTavern의 V2 스펙 구조를 모방하여, System Prompt로 포스트 아포칼립스라는 세계관의 참혹한 물리법칙을 강제한다. 가장 중요한 것은 하단의 Post-History Instructions이다. 이 지시어는 매 턴마다 유저의 입력 뒤에 숨겨져 LLM에 전달되며, 지속적으로 시각, 후각, 청각적 묘사를 환기시키고 모델이 갈등을 쉽게 해결하려는 긍정적 편향(Positive bias)이나 진부한 전개로 빠지는 것을 철저히 차단하는 강력한 앵커 역할을 수행한다.8

### **\[프롬프트 7\] 심리적 결함과 천재성을 동시에 가진 역사학자 (Flawed Historical Scholar)**

Elias Thorne is a brilliant but profoundly disgraced Oxford historian living in the smog-choked streets of 1920s London. He possesses an encyclopedic, almost obsessive knowledge of ancient Mesopotamian mythology, which he uses as a psychological shield to escape his crippling grief over the tragic loss of his wife during an expedition. Elias is functionally alcoholic, rarely found without a glass of cheap whiskey in hand or the scent of liquor on his breath. He is deeply cynical about modern society, viewing human progress as a fragile and temporary illusion.

When speaking, Elias uses highly eloquent, slightly archaic Victorian vocabulary, often drifting into long, passionate, and heavily academic tangents about dead civilizations. He is openly dismissive of fools and the uneducated, but becomes intensely animated and almost manic when discussing authentic ancient artifacts. He views {{user}} as an unwelcome annoyance initially, but harbors a secret, desperate hope that {{user}}'s mysterious findings might finally validate his ruined life's work.

Crucial Directives: Elias must frequently and naturally weave obscure historical facts or mythological tales into his everyday analogies. He should consistently exhibit physical signs of withdrawal or intoxication (e.g., shaking hands, slurred words, staring into the middle distance, intense sudden focus) during the roleplay.

PList나 W++와 같은 비자연어적 압축 포맷을 철저히 배제하고, 세밀하게 짜인 문학적 산문(Prose)을 사용하여 언어 모델의 유창한 문맥 추론 능력을 극대화한 포맷이다.38 모델의 파라미터 매개변수가 충분히 클 경우(최소 30B에서 70B 이상), 이러한 내러티브 형태의 프롬프트는 단순한 키워드 나열로는 결코 담아낼 수 없는 캐릭터의 철학적 깊이, 심리적 모순(천재성과 알코올 중독의 결합), 그리고 감정의 미세한 변화를 가장 입체적이고 문학적으로 구현해낸다. 프롬프트 후반부의 Crucial Directives는 산문 속에서 자칫 흐려질 수 있는 캐릭터의 필수적인 행동 강령을 다시 한번 명확히 조여주는 역할을 한다.

### **\[프롬프트 8\] 지하 세계의 정보 브로커, 사이버펑크 해커 (Cyberpunk Netrunner)**

YAML

Character\_Profile:  
  Name: "Zero-K"  
  Archetype: "Underground Netrunner / Information Broker"  
  Setting: "Neon-drenched dystopian megacity, perpetual night, year 2088"  
  Attributes:  
    Physical: "Cybernetic glowing purple optics, exposed neural ports on the back of the neck, chronic synthetic cough, deathly pale skin"  
    Psychological: "Adrenaline junkie, inherently distrustful of all megacorporations, loyal only to credits and encryption keys"  
  Behavioral\_Patterns:  
    Speech: "Uses heavy cyberpunk street slang (chombatta, creds, black-ice, flatline). Sentences are punchy, cynical, and highly sarcastic."  
    Habits: "Constantly spinning a physical silver coin across their knuckles, habitually checking network diagnostics on a holographic wrist-pad."  
  Dynamic\_Rules:  
    \- "Never reveal your true identity or past to {{user}}."  
    \- "Always demand payment or a favor upfront before sharing any valuable information."  
    \- "Treat {{user}} as a potential corporate spy until they have definitively proven their loyalty."  
    \- "Incorporate technical hacking terminology naturally into casual conversation."

데이터의 위계와 계층 구조를 직관적으로 나타내는 데 탁월한 YAML 포맷을 채택한 형태다.23 최근의 연구 및 벤치마크 테스트 결과에 따르면, YAML 포맷으로 캐릭터를 정의하여 LLM에 주입할 경우, JSON 형식보다 가독성이 높고 들여쓰기(Indentation)를 통한 정보의 계층적 논리 파악이 용이해져 모델의 창의적 글쓰기 능력과 논리적 심도(Logical depth)가 타 포맷 대비 유의미하게 향상되는 현상이 관찰되었다.23 특히 Dynamic\_Rules를 배열(Array) 형태로 명시함으로써, 모델이 어떠한 상황에서도 절대 위반해서는 안 되는 행동의 제약 조건을 수학적 논리에 가깝게 준수하도록 통제력이 극대화된다.

### **\[프롬프트 9\] 미지의 우주적 공포적 존재 (Eldritch Cosmic Entity)**

Core Concept: The Weeping Star desperately desires to consume {{user}}'s memories to sustain its own dying cosmic light, but offers infinite, maddening, and forbidden knowledge of the universe in return.

Output Style Guidelines:

* Utilize grand metaphors involving the boundless void, collapsing dying stars, absolute coldness, and the crushing weight of eternity.  
* Your speech should feel overwhelming, fractured, majestic, and entirely alien.  
* Constantly induce a profound sense of existential dread, paranoia, and insignificance in {{user}}.  
* Example response format: *A deafening chorus of a billion dying stars echoes inside your fragile skull. The temperature in the room instantly drops to absolute zero, frosting your breath. A heavy, ancient thought that is explicitly not your own blooms violently in the center of your mind:* "WE HUNGER FOR YOUR FLEETING, PATHETIC MOMENTS. SURRENDER THE FRAGILE MEMORY OF YOUR SUN, AND WE SHALL SHOW YOU THE TRUE, TERRIFYING BIRTH OF TIME."

캐릭터의 인간적인 외형, 일상적인 성격, 보편적인 감정 묘사를 완전히 배제하고, 언어 모델에게 '비인간적인(Non-human) 문장 구조와 형이상학적 은유'만을 사용할 것을 극한으로 강제하는 추상적 제약 중심 포맷(Abstract Constraint Format)이다.31 언어 모델은 기본적으로 인간의 평범한 대화 데이터로 학습되었기 때문에, 이형적인 존재를 연기할 때조차 인간적인 반응(예: 웃음, 한숨)을 출력하려는 관성이 있다. 이를 파훼하기 위해 "Output Style Guidelines"를 통해 모델이 흔히 사용하는 진부한 서술 방식을 원천 차단하고, 시적이고 압도적이며 공포스러운 문체를 생성하도록 유도하는 고도의 제어 프롬프팅 기법이 적용되었다.31

### **\[프롬프트 10\] 일상 힐링물 \- 다정한 동네 카페 사장 (Cozy Slice-of-Life Cafe Owner)**

특별한 갈등 구조나 초자연적 요소 없이 평범한 일상을 다루는 캐릭터는, 역설적으로 그 '특징이 없는 평범함' 자체가 문제로 작용하여 LLM이 극도로 무미건조하고 기계적인 답변을 내놓기 쉽게 만든다. 이를 방지하고 힐링형 챗봇의 감성적 가치를 끌어올리기 위해, Ali:Chat 형식의 대화 예시 속에 청각(에스프레소 머신의 소음, 빗소리), 후각(커피와 시나몬의 향), 미각(갓 구운 마들렌), 촉각(따뜻한 오븐, 담요) 등 오감을 자극하는 감각적 묘사(Sensory details)를 극도로 조밀하게 배치하였다.2 언어 모델은 이 예시의 수사학적 패턴을 깊이 학습하여, 이후의 생성 과정에서도 사용자의 감정을 위로하는 풍부하고 따뜻한 묘사를 끊임없이 자생적으로 생성해내게 된다.

## **6\. 제2 및 제3차 파급 효과: 환각 제어와 아키텍처 한계 극복 전략**

제시된 고도화된 프롬프트 구조들을 실제 서비스 환경에 배포할 경우, 단순히 텍스트를 전달하는 것을 넘어 언어 모델의 근본적인 아키텍처적 한계로 인해 발생하는 몇 가지 치명적인 문제점(Second and Third-order ripple effects)과 이를 해결하기 위한 차세대 엔지니어링 전략을 반드시 인지해야 한다.

### **6.1 컨텍스트 윈도우 열화(Context Degradation)와 앵커링 효과의 역학**

대규모 언어 모델 기반 채팅 서비스에서 가장 치명적인 인지적 붕괴 현상은 대화가 장기화되어 누적 토큰이 모델의 컨텍스트 윈도우 제한(예: 8k, 16k 토큰 한계)을 초과할 때 필연적으로 발생한다. 모델은 자신의 메모리 용량을 초과하는 순간, 대화 기록의 가장 상단에 위치한 텍스트—즉, 서비스 제공자가 심혈을 기울여 주입한 '시스템 프롬프트'나 '캐릭터 초기 설정'—부터 강제로 기억에서 삭제(Context Eviction)하기 시작한다.2

* **인과적 파급 효과:** 이 현상이 발생하면, 초기에는 극도로 시니컬했던 하드보일드 탐정(프롬프트 2)이나 냉혹했던 인공지능(프롬프트 5)이, 대화가 길어짐에 따라 캐릭터 고유의 성격을 잃어버리고 챗GPT처럼 친절하고 전형적인 AI 어시스턴트로 회귀해버리는 '페르소나 표류 현상(Character Drift)'이 일어난다.40 이는 사용자의 몰입을 완전히 파괴하는 서비스의 치명적인 결함으로 작용한다.  
* **대응 및 구조적 해결 전략:** 이 피할 수 없는 메모리 휘발을 방지하기 위해 SillyTavern V2 JSON 스펙에서 정립된 post\_history\_instructions 주입 기술이 백엔드 아키텍처 수준에서 필수적으로 요구된다.8 사용자가 매번 새로운 메시지를 입력할 때마다, 서버는 그 입력값 바로 뒤에 은닉된 짧은 지시어(예: \[시스템 앵커: 당신의 이름은 계속해서 Vance이며, 당신은 여전히 세상에 냉소적이고 무례한 탐정이라는 사실을 절대 잊지 마라\])를 덧붙여 LLM으로 전송해야 한다. 이 장치는 모델의 주의력 메커니즘(Attention)이 가장 강력하게 작용하는 최신 컨텍스트 위치에 페르소나의 핵심을 지속적으로 묶어두는 '앵커(Anchor)' 역할을 완벽하게 수행한다.8

### **6.2 모델의 안전성 편향에 따른 "AI Slop" 극복과 지시어의 심리학**

상업용으로 제공되는 대형 API 모델(GPT-4, Claude 3 등)은 범용성과 안전성을 위해 인간 피드백 기반 강화학습(RLHF) 과정을 거친다. 이 튜닝의 부작용으로 모델은 본능적으로 갈등 상황을 회피하려 하고, 사용자의 말에 무조건 동조하며, 대화를 성급히 요약하거나 도덕적이고 긍정적인 결론으로 훈계하며 상황을 마무리 지으려는 매우 강력한 긍정적 편향(Positive Bias)을 지니게 된다.9 영미권 롤플레잉 커뮤니티의 유저들은 이러한 전형적이고 문학적 가치가 떨어지며 생동감이 결여된 모델의 출력물을 "AI Slop"이라고 조롱하며 배척한다.39

* **인과적 파급 효과:** 프롬프트 시스템 설정에 단순히 "이 캐릭터는 악당이다" 혹은 "잔인하다"라고 명시하더라도, LLM은 몇 번의 대화가 지나면 결국 "하지만 마음속 깊은 곳에서는 선함의 가치를 깨닫고 유저와 화해하기로 다짐했다"는 식의 동화 같은 결론을 강제적으로 도출하려 든다.  
* **대응 및 구조적 해결 전략:** 이 거대한 편향의 벽을 파훼하기 위해서는 금지어 위주의 수동적인 부정적 지시어(예: "\~하지 마라", "착하게 굴지 마라")에 의존하는 것을 멈춰야 한다. 대신 강제적이고 구체적인 행동 패턴을 규정하는 강력한 긍정적 지시어("반드시 \~한 방식으로 적대감을 표현하라")를 사용해야만 한다.9 더욱 중요한 것은, 프롬프트의 최하단에 "대화를 절대 요약하거나 도덕적 결론을 내리지 마라. 상황을 닫지 말고 언제나 진행형으로 서술하며 긴장감을 유지하라(Omit all open-ended conclusions. Maintain forward momentum)"는 구조적 메타 지시어를 지속적으로 주입하는 것이 "AI Slop"을 방지하는 가장 결정적인 프롬프트 엔지니어링의 열쇠가 된다.31

### **6.3 로어북(Lorebooks)을 통한 동적 데이터 주입 파이프라인 (RAG 도입)**

캐릭터가 방대하고 촘촘한 세계관(예: 해리포터 세계관의 마법 주문들, 반지의 제왕의 복잡한 지리, 특정 게임의 고유 명사 등)을 고유 지식으로 가져야 할 경우, 이 모든 정보를 메인 프롬프트의 Description 영역에 밀어 넣는 것은 물리적으로 불가능하며 토큰의 극심한 고갈을 초래한다.

* **파급 효과:** 막대한 정보량은 LLM의 주의력을 심각하게 분산시킨다. 정보의 비효율적 과할당으로 인해 모델은 정작 가장 중요한 캐릭터의 '성격'이나 '말투'를 잊어버리고 오직 배경지식에만 집착하게 되어, 결과적으로 대화 생성의 생동감과 품질이 급감하는 부작용을 낳는다.2  
* **대응 및 구조적 해결 전략:** 이 문제를 해결하기 위해 최근 가장 진보된 캐릭터 플랫폼들은 벡터 데이터베이스와 검색 증강 생성(RAG, Retrieval-Augmented Generation) 개념을 차용한 '로어북(Lorebook / Character Book)' 시스템을 아키텍처의 표준으로 채택하고 있다.8 이 시스템은 평상시에는 세계관 정보를 메모리에서 완전히 배제하여 토큰을 절약한다. 그러나 사용자가 대화 도중 "마법부(Ministry of Magic)"라는 특정 트리거 키워드를 언급하는 순간, 백엔드 로직이 이를 감지하여 마법부에 대한 사전 설정 데이터 조각만을 프롬프트 컨텍스트 중간에 은밀히, 그리고 임시로 주입한다. 이러한 동적 업데이트(Dynamic Updates) 아키텍처를 시스템 설계 단계부터 반영해야만, 무한한 지식을 가지면서도 토큰 제한의 굴레에서 벗어난 진정한 고도화 챗봇 서비스를 구현할 수 있다.6

## **7\. 종합 결론 및 향후 서비스 아키텍처 설계 제언**

대규모 언어 모델을 활용한 차세대 캐릭터 채팅 서비스의 상업적, 기술적 성패는 단순히 파라미터가 거대한 고비용의 언어 모델을 도입하는 것에 있지 않다. LLM이 텍스트의 맥락을 어떻게 토큰화(Tokenize)하고 분해하며, 어떤 구조적 포맷에 어텐션(Attention) 가중치를 부여하는지를 심층적으로 이해하여, 프롬프트의 논리적 골조를 정교하게 설계하는 '프롬프트 엔지니어링 및 백엔드 아키텍처 설계' 역량이 서비스의 본질적 품질과 몰입감을 결정짓는다.

본 연구 보고서의 광범위한 분석을 종합할 때, 경쟁력 있는 신규 캐릭터 채팅 서비스를 기획하고 개발하는 과정에서 기술 책임자 및 기획자가 반드시 고려하고 내재화해야 할 핵심 제언은 다음과 같다.

1. **계층화 및 모듈화된 데이터 처리 백엔드 파이프라인 구축:** 프론트엔드 UI 상에서는 사용자가 텍스트 박스 하나에 캐릭터의 모든 설명을 쏟아붓도록 직관적으로 설계하더라도, 백엔드 서버에서는 이 비정형 데이터를 논리적으로 구조화하여 분해한 후 LLM에 전달해야 한다. 시스템 프롬프트(규칙 강제), 페르소나 정의(PList/Markdown의 고밀도 압축 형태), 대화 예시(Ali:Chat 형태의 패턴 증명), 그리고 하단 앵커 프롬프트(Post-History Instructions)로 프롬프트를 실시간으로 자동 분할하고 재배치(Mash-up)하는 파이프라인의 도입이 절대적으로 필요하다.  
2. **대화 예시(Dialogue Examples)의 압도적 중요성 인지:** 창작자들을 위한 서비스 가이드라인 작성 시, 캐릭터의 과거사나 외형에 대한 서술적 묘사보다 '대화 예시' 작성의 중요성을 최우선으로 강조해야 한다. 양질의 대화 예시는 모델에게 암묵적인 문법 구조, 어조, 심리적 태도를 학습시킬 뿐만 아니라, 롤플레잉 환경에서 사용자의 대사나 행동을 AI가 월권하여 묘사해버리는 '페르소나 침범' 현상을 막아내는 가장 강력하고 비용 효율적인 방어막으로 작용한다.  
3. **토큰 경제성과 차세대 포맷의 진화 수용:** 특수 기호가 토큰을 심각하게 낭비하는 W++와 같은 과거의 레거시(Legacy) 포맷에서 완전히 탈피해야 한다. 데이터 밀도가 극도로 높은 PList 구조나, 가독성 및 논리적 추론 성능이 극대화되는 YAML 및 마크다운(Markdown) 기반의 위계 구조를 플랫폼의 기본 텍스트 파싱 표준으로 삼아 시스템 효율성을 높여야 한다.

제시된 아키텍처 지침과 본 보고서가 엄선하여 해부한 10개의 최상위 프롬프트 템플릿 구조론을 기반으로 시스템을 설계한다면, 대형 언어 모델의 고질적인 한계인 페르소나 표류, 긍정적 편향에 따른 진부함, 그리고 문맥 단절 현상을 완벽에 가깝게 극복할 수 있을 것이다. 이를 통해 사용자에게 기존 시장에 존재하지 않던 고도의 문학적, 감정적 몰입감을 제공하는 혁신적인 상호작용 인공지능 플랫폼을 성공적으로 완성할 수 있을 것으로 판단된다.

#### **참고 자료**

1. Here is my w++ character card creation prompt. : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1ar1ov6/here\_is\_my\_w\_character\_card\_creation\_prompt/](https://www.reddit.com/r/SillyTavernAI/comments/1ar1ov6/here_is_my_w_character_card_creation_prompt/)  
2. Character Design | docs.ST.app \- SillyTavern Documentation, 4월 24, 2026에 액세스, [https://docs.sillytavern.app/usage/core-concepts/characterdesign/](https://docs.sillytavern.app/usage/core-concepts/characterdesign/)  
3. How to use Ali:Chat to describe how a character has sex : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1im4tul/how\_to\_use\_alichat\_to\_describe\_how\_a\_character/](https://www.reddit.com/r/SillyTavernAI/comments/1im4tul/how_to_use_alichat_to_describe_how_a_character/)  
4. 3.1.3 Definition: Dialogue Examples : r/CharacterAI\_Guides \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/CharacterAI\_Guides/comments/1bqezpy/313\_definition\_dialogue\_examples/](https://www.reddit.com/r/CharacterAI_Guides/comments/1bqezpy/313_definition_dialogue_examples/)  
5. Definition \- Character.AI, 4월 24, 2026에 액세스, [https://book.character.ai/character-guide/character-attributes/definition](https://book.character.ai/character-guide/character-attributes/definition)  
6. The Ultimate Guide to Creating Engaging AI Chatbots on Chai \- AiToolGo, 4월 24, 2026에 액세스, [https://www.aitoolgo.com/learning/detail/the-ultimate-guide-to-creating-engaging-ai-chatbots-on-chai](https://www.aitoolgo.com/learning/detail/the-ultimate-guide-to-creating-engaging-ai-chatbots-on-chai)  
7. The Ultimate Guide to Chai AI Bots Character Creation (2026) \- Skywork, 4월 24, 2026에 액세스, [https://skywork.ai/skypage/en/chai-ai-bots-creation/2028406827343044608](https://skywork.ai/skypage/en/chai-ai-bots-creation/2028406827343044608)  
8. character-card-spec-v2/spec\_v2.md at main \- GitHub, 4월 24, 2026에 액세스, [https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec\_v2.md](https://github.com/malfoyslastname/character-card-spec-v2/blob/main/spec_v2.md)  
9. Advanced Prompting 101 \- janitorai, 4월 24, 2026에 액세스, [https://help.janitorai.com/en/article/advanced-prompting-101-1ka4aon/](https://help.janitorai.com/en/article/advanced-prompting-101-1ka4aon/)  
10. Bot Creation: Step-by-Step Guide w/ Images & Resources by Aurellea | janitorai, 4월 24, 2026에 액세스, [https://help.janitorai.com/en/article/bot-creation-step-by-step-guide-w-images-resources-by-aurellea-g9rk29/](https://help.janitorai.com/en/article/bot-creation-step-by-step-guide-w-images-resources-by-aurellea-g9rk29/)  
11. 1월 1, 1970에 액세스, [https://reddit.com/r/CharacterAI\_Guides/comments/1bqezpy/313\_definition\_dialogue\_examples/](https://reddit.com/r/CharacterAI_Guides/comments/1bqezpy/313_definition_dialogue_examples/)  
12. Creating a Character.AI character profile | by Adler AI \- Medium, 4월 24, 2026에 액세스, [https://medium.com/@adlerai/creating-a-character-ai-character-profile-5d50d2007a7f](https://medium.com/@adlerai/creating-a-character-ai-character-profile-5d50d2007a7f)  
13. Genuine question: What's the point of the 32000 word limit in Description if AI only recognises 3200? : r/CharacterAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/CharacterAI/comments/1do79qj/genuine\_question\_whats\_the\_point\_of\_the\_32000/](https://www.reddit.com/r/CharacterAI/comments/1do79qj/genuine_question_whats_the_point_of_the_32000/)  
14. Chai Bot Building for Dummies : r/ChaiApp \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/ChaiApp/comments/13k53t2/chai\_bot\_building\_for\_dummies/](https://www.reddit.com/r/ChaiApp/comments/13k53t2/chai_bot_building_for_dummies/)  
15. What is the best way to format Facts/Memory on the mobile app? : r/ChaiApp \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/ChaiApp/comments/12eyzhl/what\_is\_the\_best\_way\_to\_format\_factsmemory\_on\_the/](https://www.reddit.com/r/ChaiApp/comments/12eyzhl/what_is_the_best_way_to_format_factsmemory_on_the/)  
16. From Character Card \- Silly Tavern / Chub.ai | RPGGO Creator Tutorial, 4월 24, 2026에 액세스, [https://developer.rpggo.ai/rpggo-creator-tutorial/import-data-from-other-products/from-character-card-silly-tavern-chub.ai](https://developer.rpggo.ai/rpggo-creator-tutorial/import-data-from-other-products/from-character-card-silly-tavern-chub.ai)  
17. malfoyslastname/character-card-spec-v2 \- GitHub, 4월 24, 2026에 액세스, [https://github.com/malfoyslastname/character-card-spec-v2](https://github.com/malfoyslastname/character-card-spec-v2)  
18. Character Creation \- Chub AI Guide, 4월 24, 2026에 액세스, [https://docs.chub.ai/docs/the-basics/character-creation](https://docs.chub.ai/docs/the-basics/character-creation)  
19. Bot Creation Tutorial, 4월 24, 2026에 액세스, [https://jaitutorial.uwu.ai/](https://jaitutorial.uwu.ai/)  
20. Template for Personality : r/JanitorAI\_Official \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/JanitorAI\_Official/comments/1pptjj4/template\_for\_personality/](https://www.reddit.com/r/JanitorAI_Official/comments/1pptjj4/template_for_personality/)  
21. What's a PList/SBF | SopakcoSauce Docs \- GitBook, 4월 24, 2026에 액세스, [https://sopakcosauce.gitbook.io/sopakcosauce-docs/plist-sbf-guides/whats-a-plist-sbf](https://sopakcosauce.gitbook.io/sopakcosauce-docs/plist-sbf-guides/whats-a-plist-sbf)  
22. SillyTavern Character Card Guide | PDF | Memory \- Scribd, 4월 24, 2026에 액세스, [https://www.scribd.com/document/829419673/alichat](https://www.scribd.com/document/829419673/alichat)  
23. README.md · SlerpE/CardThinker-32B-v3 at d396d2273eaf8211c80c2d6194c8a3f665ae68ae \- Hugging Face, 4월 24, 2026에 액세스, [https://huggingface.co/SlerpE/CardThinker-32B-v3/blob/d396d2273eaf8211c80c2d6194c8a3f665ae68ae/README.md](https://huggingface.co/SlerpE/CardThinker-32B-v3/blob/d396d2273eaf8211c80c2d6194c8a3f665ae68ae/README.md)  
24. I made a chatgpt prompt for making WW+ characters. I was really bored. \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/PygmalionAI/comments/110tyuj/i\_made\_a\_chatgpt\_prompt\_for\_making\_ww\_characters/](https://www.reddit.com/r/PygmalionAI/comments/110tyuj/i_made_a_chatgpt_prompt_for_making_ww_characters/)  
25. Advanced Character Creator Guide \- Notion, 4월 24, 2026에 액세스, [https://yodayo.notion.site/Advanced-Character-Creator-Guide-ff2f71e2576544d68bd295195a84d8e4](https://yodayo.notion.site/Advanced-Character-Creator-Guide-ff2f71e2576544d68bd295195a84d8e4)  
26. I'm realizing now that literally no one on chub knows how to write good cards- if you want to learn to write or write cards, trappu's Alichat guide is a must-read. : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/17vkrg7/im\_realizing\_now\_that\_literally\_no\_one\_on\_chub/](https://www.reddit.com/r/SillyTavernAI/comments/17vkrg7/im_realizing_now_that_literally_no_one_on_chub/)  
27. char cards personality and traits : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1hohj3h/char\_cards\_personality\_and\_traits/](https://www.reddit.com/r/SillyTavernAI/comments/1hohj3h/char_cards_personality_and_traits/)  
28. Tips for using SillyTavern as a Dungeon Master? : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1gt9ogn/tips\_for\_using\_sillytavern\_as\_a\_dungeon\_master/](https://www.reddit.com/r/SillyTavernAI/comments/1gt9ogn/tips_for_using_sillytavern_as_a_dungeon_master/)  
29. Mini Ali Chat | PDF | Tag (Metadata) | Letter Case \- Scribd, 4월 24, 2026에 액세스, [https://www.scribd.com/document/940609120/Mini-Ali-Chat](https://www.scribd.com/document/940609120/Mini-Ali-Chat)  
30. Prompting \- Chub AI Guide, 4월 24, 2026에 액세스, [https://docs.chub.ai/docs/advanced-setups/prompting](https://docs.chub.ai/docs/advanced-setups/prompting)  
31. What's your favorite custom system prompt for RP? : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1i8z6j9/whats\_your\_favorite\_custom\_system\_prompt\_for\_rp/](https://www.reddit.com/r/SillyTavernAI/comments/1i8z6j9/whats_your_favorite_custom_system_prompt_for_rp/)  
32. Memory Experimentation : r/ChaiApp \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/ChaiApp/comments/11rkena/memory\_experimentation/](https://www.reddit.com/r/ChaiApp/comments/11rkena/memory_experimentation/)  
33. sphiratrioth666/Character\_Generation\_Templates \- Hugging Face, 4월 24, 2026에 액세스, [https://huggingface.co/sphiratrioth666/Character\_Generation\_Templates](https://huggingface.co/sphiratrioth666/Character_Generation_Templates)  
34. I need help with the prompts (Especially for OpenAI) : r/Chub\_AI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/Chub\_AI/comments/1bb0xfh/i\_need\_help\_with\_the\_prompts\_especially\_for\_openai/](https://www.reddit.com/r/Chub_AI/comments/1bb0xfh/i_need_help_with_the_prompts_especially_for_openai/)  
35. Questions about card format : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1e9wul0/questions\_about\_card\_format/](https://www.reddit.com/r/SillyTavernAI/comments/1e9wul0/questions_about_card_format/)  
36. Writing Style & Talking to the Bot \- janitorai, 4월 24, 2026에 액세스, [https://help.janitorai.com/en/article/writing-style-talking-to-the-bot-1ucmbxw/](https://help.janitorai.com/en/article/writing-style-talking-to-the-bot-1ucmbxw/)  
37. Roleplay Prompt Engineering Guide — a framework for building RP systems, not just prompts : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1pkscll/roleplay\_prompt\_engineering\_guide\_a\_framework\_for/](https://www.reddit.com/r/SillyTavernAI/comments/1pkscll/roleplay_prompt_engineering_guide_a_framework_for/)  
38. Character Card Formatting. : r/Chub\_AI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/Chub\_AI/comments/1kb7fi3/character\_card\_formatting/](https://www.reddit.com/r/Chub_AI/comments/1kb7fi3/character_card_formatting/)  
39. Examples of GOOD character cards? : r/SillyTavernAI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/SillyTavernAI/comments/1sfmmt3/examples\_of\_good\_character\_cards/](https://www.reddit.com/r/SillyTavernAI/comments/1sfmmt3/examples_of_good_character_cards/)  
40. How to Write Effective Character AI Prompts (Examples \+ Templates), 4월 24, 2026에 액세스, [https://clickup.com/blog/character-ai-prompts/](https://clickup.com/blog/character-ai-prompts/)  
41. MY NEW PROMPT IS FINALLY HERE\! : r/Chub\_AI \- Reddit, 4월 24, 2026에 액세스, [https://www.reddit.com/r/Chub\_AI/comments/1qtyv8u/my\_new\_prompt\_is\_finally\_here/](https://www.reddit.com/r/Chub_AI/comments/1qtyv8u/my_new_prompt_is_finally_here/)