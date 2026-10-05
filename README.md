# 테크독해 Labs

테크독해 심층영상의 실습 코드와 다운로드 자료를 모으는 공개 저장소입니다. 회차별 폴더에서 실행 방법과 확인한 환경을 읽고, Releases에서 해당 영상에 맞는 ZIP을 받을 수 있습니다.

## 실습 목록

| 회차 | 주제 | 소스·실행 안내 | ZIP |
| --- | --- | --- | --- |
| EP052 | Claude Mods, 내 개발 작업 공간을 만들다 | [실습 폴더](episodes/052-claude-mods/) | [v1.0.0 다운로드](https://github.com/starhunt/techdokhae-labs/releases/download/ep052-v1.0.0/techdokhae-ep052-claude-mods-v1.0.0.zip) |

[테크독해 YouTube 채널](https://www.youtube.com/channel/UCwwkFt73RwZkh0TYcivgrQA)

## 자료 받기

이번 편만 실습하려면 표의 ZIP을 내려받아 압축을 풉니다. Git을 설치하지 않아도 다운로드할 수 있습니다. 여러 편의 코드를 함께 살펴보려면 저장소를 복제합니다.

```sh
git clone https://github.com/starhunt/techdokhae-labs.git
cd techdokhae-labs/episodes/052-claude-mods
```

회차 폴더의 README에서 사전 준비, 실행 순서, 기대 결과와 범위를 확인하세요. 전체 저장소를 받는 GitHub의 Code → Download ZIP과 회차별 Release ZIP은 범위가 다릅니다.

## 버전과 변경

- 소스는 `episodes/회차-주제/`에 둡니다.
- 영상에 맞춘 다운로드는 `ep052-v1.0.0`처럼 회차와 버전을 함께 표시합니다.
- 배포한 ZIP을 같은 이름으로 바꿔 끼우지 않고 수정 버전을 새로 올립니다. 기존 영상 설명의 다운로드 링크는 그대로 유지됩니다.
- `main`은 이후 수정될 수 있으므로 영상과 같은 파일이 필요하면 해당 Release 또는 태그를 선택하세요.
- 오류 제보에는 회차·다운로드 버전·Claude Code 등 관련 도구의 버전·재현 단계를 적어 주세요. API 키나 개인 로그는 포함하지 마세요.

## 라이선스

이 저장소의 자체 작성 실습 코드는 [MIT License](LICENSE)로 제공합니다. 예제에서 사용하는 외부 제품·서비스와 의존성에는 각각의 이용 조건이 적용됩니다. 이 저장소는 Anthropic의 공식 배포물이 아닙니다.
