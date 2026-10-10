# EP053 — 파일 이름을 몰라도 찾는 AI

EmbeddingGemma 2로 이미지와 텍스트를 함께 검색하는 작은 실습입니다. 직접 만든 화면 6장과 영어 문서 6개, 추론 전에 정한 질문 8개를 포함합니다. 일반 정확도 벤치마크가 아닙니다.

## 설치 없이 결과 확인

압축을 푼 폴더에서 다음 명령을 실행한 뒤 `http://127.0.0.1:8854/app.html`을 엽니다.

```sh
python3 -m http.server 8854 --bind 127.0.0.1
```

질문 버튼과 차원 선택을 바꾸면 저장된 실제 추론 결과를 볼 수 있습니다. 파일을 누르면 원본이 열립니다. 이 뷰어는 새 질문을 추론하는 채팅 서비스가 아닙니다.

## 모델을 다시 실행

Python 3.11 이상, 모델 및 패키지를 내려받을 공간과 네트워크가 필요합니다. 모델 최초 다운로드 뒤 계산은 로컬에서 수행합니다. 사용자 파일을 외부 추론 API에 보내지 않습니다.

```sh
python3 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python search.py --device cpu
```

원래 실행은 macOS CPU, Sentence Transformers 6.1.0, Transformers 5.19.0, Torch 2.14.0입니다. 기기별 처리 시간과 메모리는 달라집니다. 기본 설치 경로에서 5.17.0이 선택되어 모델을 인식하지 못했으므로 requirements는 모델을 지원하는 **공식 v5.19.0 태그**를 가리킵니다. 모델 리비전은 `914f7f89142e33e77833254d9c9b90c3cef7303b`로 고정했습니다. 기존 프로젝트 환경을 업그레이드하지 말고 독립 가상환경을 사용하세요.

실행하면 `results.json`, `vectors.npz`, `index-metadata.json`을 갱신합니다. 동봉된 결과를 남기려면 먼저 복사해 두세요. 이미지 이름·label·expected 정답은 임베딩 입력이 아닙니다. 이미지 자체 또는 텍스트 원문을 사용합니다.

## 새 질문을 직접 검색

색인이 만들어진 뒤 `python serve.py --port 8854`를 실행하고 같은 주소의 app.html을 엽니다. 이 모드는 질문 입력칸이 활성화되며 로컬 CPU에서 새 질문을 계산합니다. 이미지 벡터는 재사용하고 질문용 텍스트 구성만 불러옵니다. 원본 파일 해시가 달라지면 실행을 멈추므로 `python search.py`로 색인을 갱신하세요. 서버는 127.0.0.1에만 바인딩합니다.

## 파일

- `dataset.json`: 입력 자료와 사전 정의 질문. `expected`는 정답을 모델에 전달하는 필드가 아니라 실습 의도 기록입니다.
- `assets/`: 자체 작성 화면·HTML·문서. HTML은 화면 제작 원본이며 검색 대상은 지정된 PNG·TXT뿐입니다.
- `search.py`: 색인, 질문 인코딩, 차원 축소 뒤 정규화, 코사인 정렬.
- `app.html`: 결과·원본 뷰어.
- `results.json`: 모델과 버전, 실제 순위와 측정 당시 시간. 처리 시간 비교용 벤치마크가 아닙니다.
- `vectors.npz`, `index-metadata.json`: 실제 벡터와 원본 해시·경로·모델 리비전.

## 결과를 읽는 방법

한국어 장애 그래프 질문은 I1, 결제 재시도 질문은 T1을 1위로 찾았습니다. 큐 설계도 질문은 768차원에서 이미지 I3, 256차원에서 관련 문서 T4가 1위였습니다. 어느 쪽도 단순히 무관한 자료는 아닙니다. 그림만 원하면 이미지 종류로 필터링하는 제품 설계도 가능합니다.

자료에 없는 담당자 이름을 물어도 가까운 후보는 나옵니다. **유사도는 정답 확률이 아닙니다.** 이 실습은 언어 모델의 답변을 생성하거나 환각률을 측정하지 않습니다. 또한 문자열 고정 검색은 `rg -n --fixed-strings 'INC-042' assets/*.txt`로 같은 사건 문서를 찾을 수 있습니다. 의미 검색이 문자열 검색을 항상 이긴다는 주장이 아닙니다.

숫자 길이를 줄일 때는 질문과 문서를 같은 차원으로 자른 뒤 다시 정규화합니다. 차원 간 점수 크기 자체를 정확도 향상으로 읽지 마세요. 100만 float32 벡터의 원시 저장 용량은 768차원 3.072GB, 256차원 1.024GB이며 모델·원본·인덱스 부가 구조는 별도입니다.

## 출처와 권리

자체 실습 코드·문서·예제 화면은 MIT 라이선스입니다. 모델 가중치는 ZIP에 포함하지 않습니다. EmbeddingGemma 2는 별도 Apache 2.0 라이선스이며 아래 모델 카드와 관련 라이브러리의 조건을 따릅니다.

- [공식 모델 카드](https://huggingface.co/google/embeddinggemma-2/tree/914f7f89142e33e77833254d9c9b90c3cef7303b)
- [Google 개발 안내](https://developers.googleblog.com/embeddinggemma-2-the-developer-guide/)
- [Transformers 5.19.0](https://github.com/huggingface/transformers/releases/tag/v5.19.0)
- [테크독해 실습 자료](https://github.com/starhunt/techdokhae-labs)

추가 해석: 예제 이미지에는 영문 라벨과 그래프가 함께 있습니다. 이 결과는 이미지 픽셀을 직접 넣은 검색 경로의 확인이며, 문자를 지운 도형 인식이나 그래프만의 이해도를 측정한 실험이 아닙니다.
