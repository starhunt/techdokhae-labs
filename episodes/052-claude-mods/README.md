# Claude Mods — Workspace companion

테크독해 EP052의 실행 예제(v1.0.0). Claude Code에 작업 브리프 패널, 모드 선택, 다음 요청의 추가 문맥, 스피너 상태, 변경 파일 목록, 완료 알림을 연결한다.


[이번 편 ZIP 다운로드](https://github.com/starhunt/techdokhae-labs/releases/download/ep052-v1.0.0/techdokhae-ep052-claude-mods-v1.0.0.zip) · [고정 버전 소스](https://github.com/starhunt/techdokhae-labs/tree/ep052-v1.0.0/episodes/052-claude-mods) · [전체 실습 목록](https://github.com/starhunt/techdokhae-labs)

ZIP을 받았다면 압축을 푼 `techdokhae-ep052-claude-mods-v1.0.0` 폴더를, Git으로 받았다면 `techdokhae-labs/episodes/052-claude-mods` 폴더를 터미널에서 엽니다. 아래 명령은 이 README가 있는 실습 루트에서 시작합니다.

Claude Code CLI를 설치하고, 모델을 사용하는 실습은 계정 인증을 마친 상태에서 진행합니다. macOS에서 확인했으며 `cat` 명령을 사용할 수 있는 셸 환경을 전제로 합니다. 이 저장소에는 Claude Code 프로그램이나 모델을 포함하지 않습니다.

## 실행

실제 확인: Claude Code 2.1.289, Node 22.23.1, macOS 터미널. 공식 문서는 Mods 기본 활성화를 2.1.287 이상으로 설명한다. 최신 설치 환경의 지원 여부는 공식 문서에서 확인한다.

```sh
cd workspace
claude --plugin-dir ../workspace-companion --tools Read,Edit --allowedTools Read,Edit --settings '{"tui":"fullscreen"}'
```

이 옵션은 해당 실행의 표시 설정이다. 전역 설정 파일은 고치지 않는다. 넓은 fullscreen 터미널에서는 Pane이 옆에, 좁은 환경에서는 입력창 위에 나타날 수 있다.

1. `/workbench`로 패널을 연다.
2. `b`/`r`로 Build/Review를 고른다. 선택은 `$.store`에 저장된다.
3. `c`로 Brief context를 켠다. ON/OFF가 화면과 로그에 드러난다.
4. Escape로 패널을 닫고 아래 질문을 보낸다.

```
Read cart.mjs. State the project name and selected work mode supplied in extra context, then explain this function in one short English sentence. Do not edit files or use agents.
```

브리프에 있는 Tiny Cart와 선택한 모드가 응답에 포함되는지 본다. 모델의 답변 품질이나 지시 준수 전체를 보장하는 테스트가 아니다.

5. 다음에는 아래 수정 요청을 보내고 `/workbench` → `2`로 변경 탭을 확인한다.

```
Add the comment // Cart total in currency units. directly above the export in cart.mjs. Use Edit to do it and preserve the exported function name. Do not use agents.
```

스피너에는 세션에서 관찰한 누적 도구 호출 수가 붙고, 성공한 Edit/Write 파일이 목록에 들어가며, turn.complete에서 알림이 뜬다. `/work-status`는 모델 호출 없이 현재 상태 JSON을 보여 준다. `/brief-off`와 `/brief-on`으로 문맥 연결을 끄고 켤 수도 있다.

## 구조

- `.claude-plugin/plugin.json`: 플러그인 이름
- `hooks/hooks.json`: 모듈 등록
- `hooks/register.js`: 상태와 이벤트/UI 연결
- `tests/workspace.test.ts`: 공식 모의 테스트 키트로 문맥 보존·UI 합성·버튼·실패 처리 확인

검증 명령은 이 README가 있는 실습 루트에서 실행합니다. 앞의 실습을 끝내고 아직 `workspace` 안에 있다면 먼저 `cd ..`로 돌아옵니다.

```sh
claude plugin validate ./workspace-companion --json
claude plugin test ./workspace-companion
```

## 범위

`prompt.submit.context`는 실제 모델 입력이며 사용량에 영향을 줄 수 있다. UI만 바꾸는 것은 모델의 문맥이나 도구 결과를 저절로 바꾸지 않는다. 이 Mod는 모델 API를 추가 호출하지 않지만 사용자가 보내는 일반 요청은 모델을 사용한다.

변경 목록은 해당 세션에서 모드가 관찰한 성공한 Edit/Write의 **파일 이름**이다. 외부 편집이나 Git 전체 변경은 포함하지 않고, 서로 다른 디렉터리의 같은 파일 이름을 구분하지 않는다. 실전에서는 프로젝트 상대 경로·Git 조회 등 요구에 맞춰 확장해야 한다. 브리프는 작업 문맥이며 권한 정책·보안 경계가 아니다. 파일 읽기와 코드는 사용자 권한으로 실행된다.

학습 지도·마이그레이션 보드·외부 이슈 보드·도구 결과 요약 표시는 영상에서 제안한 아이디어이며 이 ZIP에 구현된 기능으로 주장하지 않는다. 테스트는 실제 모델·외부 프로세스를 대체하는 모의 테스트다. 실제 실행 녹화는 제작 기록에 별도로 보관한다.

공식 근거: https://code.claude.com/docs/en/plugins/mods/interface · https://code.claude.com/docs/en/plugins/mods/events · https://code.claude.com/docs/en/plugins/mods/api


## 배포 기록

v1.0.0은 영상 예제의 실행 코드와 테스트를 유지한 첫 공개 배포입니다. 다운로드 위치·실습 루트·검증 명령 안내와 라이선스를 추가했습니다. 학습 지도 등 미구현 아이디어를 포함한다고 주장하지 않습니다.
