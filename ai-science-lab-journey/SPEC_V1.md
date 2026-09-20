# AI Science Lab Journey — 개발 명세서 v1.0

작성 기준: 2026-09-20 원본 대화 복원
대상 시스템: `ai-science-lab-journey.domafordarwin.chatgpt.site`
운영 목표: 학교 내부망에서 인터넷 없이 운영 가능한 AI 과학실 학습·체험·분석 통합 시스템

## 1. 프로젝트 목표

AI 시대의 과학실을 단순 실험실이 아니라, 학생 활동 데이터가 수집·분석되고 다시 AI 학습에 활용되는 순환형 학습 플랫폼으로 구성한다.

핵심 흐름은 다음과 같다.

`학생 활동 → 영역별 저장 → 실시간 분석 → 교사 검토/승인 → 체험 공간 공개 → 출력/포트폴리오 → AI 재학습 → 성능 검증 → 배포 또는 차단 → 원인 분석`

## 2. 원본 대화에서 확인된 핵심 요구사항

### 2.1 교육 운영 기간
- 2026년 10월 시작
- 11월 3~4주 운영 포함
- 12월까지 연계
- 총 12차시 수준의 교육 프로그램 문서화

### 2.2 행정·수업 문서
웹앱에서 다음 문서를 작성·관리·출력할 수 있어야 한다.
- 운영 계획서
- 학습 지도안
- 모집 공고
- 선정 공고
- 결과 보고서
- 학생 활동 결과물

### 2.3 학습 공간과 체험 공간 연계
- 학습 공간의 활동 결과를 체험 공간에서 확인
- 필요 시 활동 내용을 A4 형식으로 출력
- 각 영역의 활동 데이터는 해당 영역 서버 또는 중앙 서버에 저장
- 저장된 데이터는 실시간 또는 준실시간으로 분석

### 2.4 AI 학습 순환
- 학생 활동 데이터를 AI 학습 데이터 후보로 저장
- 교사 승인 후 재학습 데이터셋에 반영
- 재학습 전후 성능 비교
- 정확도/성능 향상 또는 저하 정도 표시
- 성능 저하 시 원인 분석
- 검증 기준 미달 시 배포 차단
- 승인 → 재학습 → 검증 → 배포의 게이트 구조

### 2.5 동기화
- 원본 구현 대화에서 약 5초 단위 동기화 개념이 사용됨
- 교사 승인 전 데이터는 체험 공간의 공개 전시 대상에서 제외

### 2.6 영역 구성
- 총 6개 학습·체험 영역을 기준으로 설계
- 각 영역은 활동, 산출물, 상태, AI 분석 결과를 개별 관리

> 주: 6개 영역의 구체 명칭은 원본 대화의 복원 가능한 문맥에 모두 남아 있지 않아 v1.0에서는 관리자가 설정 가능하도록 설계한다.

## 3. 사용자 역할

### 학생
- 활동 선택
- 관찰·실험 데이터 입력
- 사진/텍스트/수치 결과 제출
- 개인 활동 결과 확인

### 교사
- 활동 승인/반려
- 공개 전시 여부 결정
- AI 학습 데이터 포함 여부 결정
- 성능 비교 및 저하 원인 검토
- 문서 생성·출력

### 체험자
- 승인된 활동 결과 조회
- 영역별 성과 확인
- 출력 가능한 결과물 열람

### 시스템 관리자
- 6개 영역 설정
- 서버/DB 상태 확인
- 백업/복원
- 모델 버전 관리

## 4. 화면 명세

### 4.1 대시보드
- 오늘의 활동 수
- 승인 대기 수
- 공개된 결과 수
- AI 학습 후보 수
- 현재 모델 버전
- 최근 성능 증감률
- 영역별 상태

### 4.2 학생 활동 화면
- 영역 선택
- 활동명/차시 표시
- 관찰 기록
- 수치 데이터 입력
- 결과 요약
- 제출

### 4.3 교사 승인 화면
- 제출 목록
- 승인/반려
- 체험 공간 공개 체크
- AI 재학습 포함 체크
- 교사 피드백

### 4.4 체험 공간 화면
- 승인된 결과만 표시
- 영역별 필터
- 학생 결과 상세 보기
- AI 분석 결과 표시
- A4 인쇄

### 4.5 AI 모델 화면
- 모델 버전
- 학습 일시
- 학습 데이터 수
- 기준 모델 성능
- 후보 모델 성능
- 증감률
- 검증 결과
- 배포 상태
- 성능 저하 원인 기록

### 4.6 문서 센터
- 계획서
- 지도안
- 모집 공고
- 선정 공고
- 결과 보고서
- HTML 미리보기
- 인쇄/PDF 저장용 레이아웃

## 5. 데이터 모델

### zones
- id
- code
- name
- description
- enabled

### activities
- id
- zone_id
- title
- session_no
- instructions
- start_date
- end_date

### submissions
- id
- activity_id
- student_name
- student_no
- observation
- numeric_data_json
- result_summary
- status: `draft | submitted | approved | rejected`
- exhibit_enabled
- training_candidate
- created_at
- updated_at

### teacher_reviews
- id
- submission_id
- decision
- feedback
- reviewed_at

### model_runs
- id
- model_name
- version
- base_version
- dataset_size
- metric_name
- base_score
- candidate_score
- delta
- validation_status
- deployment_status
- regression_reason
- created_at

### documents
- id
- doc_type
- title
- body_html
- created_at
- updated_at

## 6. 데이터 흐름

1. 학생이 학습 공간에서 활동을 제출한다.
2. 서버가 SQLite DB에 제출 내용을 저장한다.
3. 대시보드가 약 5초 간격으로 최신 상태를 조회한다.
4. 교사가 제출물을 검토한다.
5. 승인된 제출물 중 `exhibit_enabled=true`인 항목만 체험 공간에 노출한다.
6. `training_candidate=true`인 승인 데이터만 재학습 후보가 된다.
7. 재학습 결과를 기존 모델과 비교한다.
8. 성능 향상 시 배포 후보로 전환한다.
9. 성능 저하 시 자동 배포를 차단하고 원인 기록을 요구한다.
10. 최종 승인된 모델만 운영 모델로 전환한다.

## 7. 성능 비교 규칙 v1.0

- `delta = candidate_score - base_score`
- `delta > 0`: 향상
- `delta = 0`: 변화 없음
- `delta < 0`: 성능 저하
- 성능 저하 모델은 기본적으로 `deployment_status=blocked`
- 관리자는 저하 원인을 기록해야 함

가능한 원인 분류:
- 라벨 오류
- 데이터 편향
- 클래스 불균형
- 촬영 조건 변화
- 학습 데이터 부족
- 과적합
- 모델/하이퍼파라미터 변경
- 입력 해상도 또는 전처리 차이

## 8. 기술 구조 v1.0

오프라인 학교 내부망 운용을 우선해 다음 구조를 채택한다.

- Backend: Python 3 + Flask
- Database: SQLite
- Frontend: HTML/CSS/Vanilla JavaScript
- Sync: 5초 polling
- Printing: 브라우저 A4 print CSS
- Network: `0.0.0.0:8000`
- OS: Windows 11 / Ubuntu

외부 CDN과 외부 API는 기본 동작에 사용하지 않는다.

## 9. API 명세 v1.0

- `GET /api/dashboard`
- `GET /api/zones`
- `GET /api/submissions`
- `POST /api/submissions`
- `POST /api/submissions/<id>/review`
- `GET /api/exhibit`
- `GET /api/models`
- `POST /api/models`

## 10. 비기능 요구사항

- 인터넷 연결 없이 핵심 기능 동작
- 학교 내부망에서 여러 PC 접속 가능
- SQLite 단일 파일 백업 가능
- 개인정보 최소 수집
- 학생 데이터는 승인 전 외부 공개 금지
- 서버 재시작 후 데이터 유지
- A4 출력 시 화면 UI 버튼 제거

## 11. 배포 구조

```text
ai-science-lab-journey/
├─ app.py
├─ schema.sql
├─ requirements.txt
├─ README.md
├─ SPEC_V1.md
├─ docs/
│  └─ INSTALL.md
├─ scripts/
│  ├─ install_windows.ps1
│  └─ install_ubuntu.sh
├─ templates/
│  └─ index.html
└─ static/
   ├─ app.js
   └─ styles.css
```

## 12. v1.0 범위

포함:
- 6개 영역
- 학생 제출
- 교사 승인
- 체험 공간 공개
- 5초 상태 동기화
- 모델 성능 비교/차단
- A4 출력
- 로컬 SQLite 저장
- Windows/Ubuntu 설치

후속 버전 후보:
- 로그인/권한 인증
- 사진 파일 업로드
- 실제 ML 학습 파이프라인 연결
- 모델 파일 저장소
- NAS/PostgreSQL 전환
- WebSocket 실시간 동기화
- 자동 PDF 생성
- 영역별 독립 엣지 서버 동기화
