# AI Science Lab Journey

2026-09-20 대화를 기준으로 복원한 **AI 시대 과학실 학습·체험·AI 재학습 순환 플랫폼**의 로컬 서버용 v1.0 구현입니다.

## 주요 기능

- 6개 과학 활동 영역 관리
- 학생 활동 제출
- 교사 승인/반려
- 승인된 결과만 체험 공간 공개
- 5초 간격 대시보드 동기화
- AI 재학습 후보 데이터 표시
- 기준 모델과 후보 모델 성능 비교
- 성능 저하 시 배포 차단 및 원인 기록
- A4 인쇄용 체험 결과 화면
- Windows 11 / Ubuntu 내부망 운영

## 빠른 시작

### Windows PowerShell

```powershell
cd ai-science-lab-journey
powershell -ExecutionPolicy Bypass -File .\scripts\install_windows.ps1
.\.venv\Scripts\Activate.ps1
python app.py
```

### Ubuntu

```bash
cd ai-science-lab-journey
chmod +x scripts/install_ubuntu.sh
./scripts/install_ubuntu.sh
source .venv/bin/activate
python app.py
```

브라우저에서 서버 PC는 `http://127.0.0.1:8000`, 같은 내부망의 다른 PC는 `http://서버IP:8000`으로 접속합니다.

## 데이터

SQLite 데이터베이스 `science_lab.db`는 최초 실행 시 자동 생성됩니다. 백업은 서버를 종료한 후 이 파일을 복사하면 됩니다.

## 문서

- `SPEC_V1.md`: 복원된 개발 명세서 v1.0
- `docs/INSTALL.md`: 내부망 설치 및 운영 지침

## 주의

현재 코드는 원본 ChatGPT Site의 소스 파일을 직접 추출한 것이 아니라, 2026-09-20 원본 대화에서 확인 가능한 요구사항을 기준으로 다시 구성한 로컬 실행형 구현입니다.
