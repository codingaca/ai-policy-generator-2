// API 호출을 위한 헬퍼 함수 (지수 백오프 포함)
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function callGeminiAPI(prompt, retries = 5, delay = 1000) {
    // API 키. Canvas 환경에서는 자동으로 처리됩니다.
    const apiKey = "AIzaSyA9pgjQJSO0GgSfHhAWBQn_dku9XzFzWRY"; 
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    const payload = {
        contents: [{ 
            parts: [{ text: prompt }] 
        }],
    };

    for (let i = 0; i < retries; i++) {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const result = await response.json();
            
            if (result.candidates && result.candidates[0].content?.parts?.[0]?.text) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error("API 응답에서 유효한 텍스트를 찾을 수 없습니다.");
            }

        } catch (error) {
            console.error(`API 호출 실패 (시도 ${i + 1}/${retries}):`, error);
            if (i === retries - 1) {
                throw new Error("API 호출에 최종 실패했습니다. 네트워크 연결을 확인하거나 나중에 다시 시도해주세요.");
            }
            await sleep(delay * Math.pow(2, i));
        }
    }
}


// generatePrompt 함수를 async로 변경
async function generatePrompt() {
    // 1. 키워드 입력 값 가져오기
    const k1 = '노인';
    const k2 = document.getElementById('keyword2').value.trim() || '디지털 격차';
    const k3 = document.getElementById('keyword3').value.trim() || '해당 지역';
    const k4 = document.getElementById('keyword4').value.trim() || '현장 지원'; 

    // 2. API에 전송할 프롬프트 생성 (기존 로직 동일)
    const prompt = `정책 전문가로서, 다음과 같은 엄격한 형식에 맞춰 단 하나의 정책을 제안합니다. 제안의 목적이나 역할에 대한 **어떠한 설명이나 서론 문구도 출력하지 마십시오.** 오직 아래 양식만 출력합니다.
다음 조건에 맞는 정책 제안서 1건을 **가독성이 좋은 마크다운(Markdown) 형식**으로 즉시 생성하십시오.
1. **정책 목표:** [${k3}] 지역의 [${k1}]이 겪는 [${k2}] 문제를 해결하기 위한 **가장 시급하고 효과적인 [${k4}] 정책 아이디어** 단 하나를 제안합니다.
2. **정책 형식:** 제안에 대한 설명이나 부연 없이, 오직 아래의 **국민신문고 정책 제안 양식**에 맞춰 결과만 출력합니다.
3. **연결 정보:** 이 정책을 담당할 **가장 적합한 [${k3}] 지역의 정책 부서**를 예측하여 명시하고, 해당 지역 관공서의 **공식 홈페이지 주소**도 함께 명시합니다. (예: 서울시청 홈페이지 주소: http://www.seoul.go.kr)

--- 국민신문고 정책 제안 양식 ---

[제안 제목]: 
[담당 정책 부서(예측)]: 
[지역 관공서 홈페이지 주소]:

1. 현황 및 문제점 (3줄 이내 요약):
2. 정책 내용 및 실행 방안:
3. 기대 효과 (3가지):

**지시 사항:**
- 모든 설명은 마크다운 문법을 사용하여 명확하게 구분하고, 굵은 글씨와 목록을 적극 활용하여 가독성을 높여주십시오.
- **오직 마크다운으로 된 제안서 본문만 출력합니다.**`;


    // 3. 결과 섹션 표시 및 로딩 상태 설정
    const resultSection = document.getElementById('result-section');
    const promptOutput = document.getElementById('promptOutput');
    const copyMessage = document.getElementById('copyMessage');
    const loader = document.getElementById('loader'); // [수정] 로더 엘리먼트 가져오기
    
    // [수정] 로더와 "생성 중" 텍스트를 텍스트 박스(promptOutput) 안에 함께 표시
    promptOutput.style.display = 'flex';        // flex로 변경
    promptOutput.style.flexDirection = 'column'; // 세로 정렬
    promptOutput.style.alignItems = 'center';    // 가운데 정렬
    promptOutput.style.justifyContent = 'center'; // 가운데 정렬
    promptOutput.innerHTML = ''; // 일단 비우기

    loader.style.display = 'block';      // 로더 보이기
    loader.style.margin = '0 0 15px 0'; // 로더 아래쪽 여백 설정
    promptOutput.appendChild(loader);      // 로더를 promptOutput 안으로 이동

    // "생성 중" 텍스트를 별도 p 태그로 추가
    const loadingText = document.createElement('p');
    loadingText.textContent = 'AI가 정책 제안서를 생성 중입니다. 잠시만 기다려주세요...';
    loadingText.style.margin = '0'; // p 태그 기본 마진 제거
    promptOutput.appendChild(loadingText); // 텍스트 추가
    
    copyMessage.textContent = '';        // 이전 메시지 초기화
    resultSection.style.display = 'block';

    // 4. API 호출 및 결과 표시
    try {
        const generatedProposal = await callGeminiAPI(prompt);
        
        // [수정] Markdown을 HTML로 변환하여 표시
        if (typeof marked !== 'undefined') {
            const htmlOutput = marked.parse(generatedProposal, { breaks: true });
            promptOutput.innerHTML = htmlOutput; // [수정] 로더와 텍스트를 결과물로 덮어쓰기
        } else {
            console.error("marked.js 라이브러리를 찾을 수 없습니다.");
            promptOutput.textContent = generatedProposal; // [수정] 덮어쓰기
        }
        
    } catch (error) {
        promptOutput.textContent = `오류가 발생했습니다: ${error.message}\n\n입력값을 확인하거나 잠시 후 다시 시도해주세요.`; // [수정] 덮어쓰기
    } finally {
        // [수정] API 호출 완료 후 (성공/실패) 로더 숨기기 및 원위치
        loader.style.display = 'none';
        loader.style.margin = ''; // 인라인 마진 스타일 제거 (CSS 기본값 적용)
        
        // 로더를 promptOutput 밖으로 (원래 위치) 이동
        if (resultSection && loader.parentNode !== resultSection) {
             resultSection.insertBefore(loader, promptOutput);
        }
        
        // [수정] promptOutput 스타일 원복
        promptOutput.style.display = 'block';
        promptOutput.style.flexDirection = '';
        promptOutput.style.alignItems = '';
        promptOutput.style.justifyContent = '';
    }

    // 5. 지역 부서 링크 동적 업데이트 (기존 로직 동일)
    const localGovLink = document.getElementById('localGovLink');
    localGovLink.href = `https://www.google.com/search?q=${k3}+구청+홈페이지`;
    localGovLink.textContent = `${k3} 관공서 홈페이지 검색`;
    localGovLink.style.display = 'block'; 
}

// [추가] 복사 성공/실패 시 메시지를 표시하는 헬퍼 함수
function showCopyMessage(message, isError = false) {
    const copyMessage = document.getElementById('copyMessage');
    if (!copyMessage) return; // 엘리먼트가 없으면 중단

    copyMessage.textContent = message;
    copyMessage.style.color = isError ? '#d9534f' : '#6a5acd'; // 에러 시 붉은색, 성공 시 보라색

    // 3초 후에 메시지 숨기기
    setTimeout(() => {
        copyMessage.textContent = '';
    }, 3000);
}

// 복사 함수
function copyPrompt() {
    const proposalText = document.getElementById('promptOutput').textContent;
    
    if (navigator.clipboard) {
        navigator.clipboard.writeText(proposalText).then(() => {
            // [수정] alert 대신 showCopyMessage 사용
            showCopyMessage('제안서가 복사되었습니다!');
        }).catch(err => {
            console.error('복사 실패:', err);
            fallbackCopyTextToClipboard(proposalText);
        });
    } else {
        fallbackCopyTextToClipboard(proposalText);
    }
}

// navigator.clipboard.writeText가 작동하지 않을 경우를 위한 대체 함수
function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    textArea.style.position = "fixed";
    textArea.style.top = 0;
    textArea.style.left = 0;
    textArea.style.width = "2em";
    textArea.style.height = "2em";
    textArea.style.padding = 0;
    textArea.style.border = "none";
    textArea.style.outline = "none";
    textArea.style.boxShadow = "none";
    textArea.style.background = "transparent";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            // [수정] alert 대신 showCopyMessage 사용
            showCopyMessage('제안서가 복사되었습니다!');
        } else {
            // [수정] alert 대신 showCopyMessage 사용
            showCopyMessage('복사에 실패했습니다.', true);
        }
    } catch (err) {
        console.error('대체 복사 실패:', err);
        // [수정] alert 대신 showCopyMessage 사용
        showCopyMessage('복사에 실패했습니다.', true);
    }

    document.body.removeChild(textArea);
}

