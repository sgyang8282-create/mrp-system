# 생산관리 시스템 (MRP 기반) — mrp-system

제조업 생산계획/MRP/CAPA/일일계획/재고 시뮬레이션을 통합 관리하는 웹 애플리케이션.
Next.js 15 + TypeScript + TailwindCSS + Supabase(PostgreSQL) 기반.

> **구현 범위: 11개 페이지 전체 + 로그인/인증 흐름** — Dashboard, BOM 관리, 현재고 관리,
> 생산그룹 관리, 월간 생산계획, MRP 전개, CAPA 분석, 일일 생산계획, 재고 시뮬레이션,
> 생산실적 입력, 계획대비실적. PRD에 정의된 전체 업무 흐름(월 생산계획 → MRP 전개 →
> CAPA 분석 → 일일 생산계획 → 재고 시뮬레이션 → 생산실적 입력 → 계획대비실적)이 화면
> 단위로 모두 연결되어 있고, `/login` 기반 인증 미들웨어로 보호됩니다. 실제 공장 도입 전
> 보강이 필요한 지점은 8번 "알려진 제한사항"에 정리했습니다.

## 목차

1. [기술 스택](#1-기술-스택)
2. [로컬 실행 방법](#2-로컬-실행-방법)
3. [Supabase 스키마 적용 방법](#3-supabase-스키마-적용-방법)
4. [폴더 구조](#4-폴더-구조)
5. [디자인 컨셉](#5-디자인-컨셉)
6. [페이지별 기능 상세](#6-페이지별-기능-상세)
7. [테스트 방법](#7-테스트-방법)
8. [알려진 제한사항](#8-알려진-제한사항-실제-도입-전-보강-권장)

---

## 1. 기술 스택

- Next.js 15 (App Router, Server Components/Actions)
- TypeScript
- TailwindCSS + 커스텀 디자인 토큰(산업용 계기반 컨셉)
- Supabase (PostgreSQL, Auth, RLS)
- Recharts (CAPA 부하율 차트, 재고 시뮬레이션 차트, 계획대비실적 차트)
- next-themes (다크모드)
- xlsx (SheetJS) — 엑셀 Import/Export

## 2. 로컬 실행 방법

```bash
# 1) 의존성 설치
npm install

# 2) 환경변수 설정
cp .env.local.example .env.local
# .env.local 에 Supabase 프로젝트 URL/키 입력

# 3) 개발 서버 실행
npm run dev
# http://localhost:3000 (자동으로 /dashboard 로 이동)
```

> Supabase 환경변수를 설정하지 않아도 **모든 페이지가 데모 데이터로 정상 렌더링**됩니다
> (각 도메인별 `*.demo.ts` 파일). 실제 DB 연동은 3번 항목을 참고하세요.

## 3. Supabase 스키마 적용 방법

```bash
# Supabase CLI 설치되어 있다는 가정 하에
supabase login
supabase link --project-ref <your-project-ref>

# 마이그레이션 적용 (스키마 → RLS 순서)
supabase db push
```

`supabase/migrations/` 폴더에는 다음 두 스크립트가 순서대로 들어 있습니다.

1. `0001_init_schema.sql` — 전체 테이블/타입/트리거/뷰/RPC/샘플데이터
2. `0002_rls_policies.sql` — 역할 기반 RLS 정책

적용 후 Supabase Studio에서 `profiles` 테이블에 로그인한 사용자의 `role`
(`admin`/`leader`/`worker`)과 `production_group_id`를 지정해야 화면별 접근 제어가 의도대로 동작합니다.

## 3.1 인증(로그인) 흐름

- `/login` — 이메일/비밀번호 로그인 폼(`@supabase/ssr` 브라우저 클라이언트로 `signInWithPassword` 호출)
- `src/middleware.ts` — 모든 페이지 요청에서 세션을 확인해, 미로그인 시 `/login`으로 리다이렉트
  (Supabase 환경변수가 없는 로컬 데모 모드에서는 인증 검사 자체를 건너뜁니다)
- `src/app/(app)/layout.tsx` — 로그인된 사용자만 진입 가능한 라우트 그룹. 여기서
  `profiles`를 조회해 헤더에 실제 이름/역할/소속 생산그룹을 표시하고, 로그아웃 버튼을 제공합니다.
- 자체 회원가입 화면은 제공하지 않습니다(내부 업무 시스템 성격에 맞춰, 계정은 관리자가
  Supabase Auth 대시보드에서 생성하는 방식을 가정). **사용자를 만든 뒤 `profiles` 테이블에
  동일한 `id`로 행을 추가하고 `role`/`production_group_id`를 지정해야** 역할 기반 화면
  제어와 RLS가 의도대로 동작합니다. `profiles` 행이 없으면 로그인은 되지만 기본적으로
  조회만 가능한(worker 미만) 상태로 동작합니다.

## 4. 폴더 구조

```
src/
├─ middleware.ts        # 인증 미들웨어 (세션 갱신 + 로그인 리다이렉트)
├─ app/
│  ├─ login/            # 로그인 페이지 (사이드바 없음, AppShell 밖)
│  ├─ (app)/            # 로그인 후 화면 전용 라우트 그룹 (URL에는 영향 없음)
│  │  ├─ layout.tsx     # 인증 가드 + 프로필 조회 + AppShell 적용
│  │  └─ dashboard/ bom/ inventory/ groups/ monthly-plans/
│  │     mrp/ capa/ daily-plans/ simulation/ actuals/ plan-vs-actual/
│  │       각 page.tsx(+loading.tsx)
│  ├─ {bom,inventory,groups,monthly-plans,daily-plans,simulation,actuals}/
│  │     actions.ts("use server") — 라우트 그룹 밖에 두어 페이지가 아닌 일반 모듈로 취급
│  ├─ api/
│  │  ├─ bom/{import,export}          BOM 엑셀
│  │  ├─ inventory/{import,export}    현재고 엑셀
│  │  ├─ actuals/{import,export}      생산실적 엑셀
│  │  └─ mrp/[runId]/export           MRP 전개 결과 엑셀
│  ├─ layout.tsx         # 루트 레이아웃 (ThemeProvider만, AppShell은 (app) 그룹에서 적용)
│  └─ globals.css        # 디자인 토큰(CSS 변수) 정의
├─ components/
│  ├─ layout/     Sidebar, Header, AppShell, ComingSoon
│  ├─ auth/       LoginForm, SignOutButton
│  ├─ theme/      다크모드
│  ├─ ui/         Button, Card, Badge, Input, Select, Dialog, Skeleton (shadcn 스타일 자체 구현)
│  └─ {dashboard, bom, inventory, groups, monthly-plans, mrp, capa,
│      daily-plans, simulation, actuals, plan-vs-actual}/  페이지별 프레젠테이션 컴포넌트
├─ lib/
│  ├─ supabase/    client.ts(브라우저), server.ts(서버/서비스롤), profile.ts(로그인 사용자 조회)
│  ├─ services/    도메인별 실쿼리 서비스 + *.demo.ts 폴백 (예: mrp.ts / mrp.demo.ts)
│  ├─ mrp/         순수 계산 엔진 — engine.ts(MRP 전개/CAPA), daily-plan-engine.ts(일일계획
│  │               자동생성), simulation-engine.ts(재고 시뮬레이션). 실제 서비스와 데모
│  │               데이터가 동일한 함수를 공유합니다.
│  ├─ excel/       도메인별 엑셀 파싱/생성 (bom.ts, inventory.ts, actuals.ts, mrp.ts)
│  ├─ bom/         BOM 트리 빌드 + 순환참조 검사(tree.ts)
│  └─ utils.ts
└─ types/          도메인별 타입 (database.ts는 DDL 스키마 기준 공통 타입)
supabase/migrations/      # DDL + RLS 스크립트
```

## 5. 디자인 컨셉

공장 현장의 계기반(instrument panel)을 모티프로 한 정보 밀도 높은 다크톤 UI.

- **색상**: 그래파이트 배경 + 절제된 블루 계열 강조색. 재고/CAPA 경고는 신호등 색상(적/황/녹)만
  예약해서 사용해 위험도가 색으로 즉시 구분되도록 함.
- **타이포그래피**: 본문/UI는 Pretendard(국문 최적화 산세리프), KPI 수치·표 데이터는
  IBM Plex Mono(계기판 숫자처럼 자릿수가 정렬되어 스캔이 빠름).
- **레이아웃**: 좌측 고정 사이드바(11개 페이지) + 상단 헤더 + 카드 기반 화면 구성.
  둥근 모서리를 최소화(4~6px)하고 그림자 대신 헤어라인 보더를 사용해 SaaS 카드킷 느낌을 피함.

## 6. 페이지별 기능 상세

### Dashboard
KPI 4종(생산달성률/결품위험/재고부족/CAPA초과 그룹), CAPA 부하율 차트, 결품위험·생산계획
TOP10 리스트. 다크모드/반응형(모바일 드로어 사이드바).

### BOM 관리
- 무한 단계 BOM 트리 뷰(확장/축소, 단위소요/누적소요/작업소요시간/생산그룹 표시)
- BOM 라인 추가(Server Action, 저장 전 클라이언트 1차 순환참조 검증 + DB 트리거 최종 검증) / 삭제
- 엑셀 업로드(`/api/bom/import`, 행 단위 검증 후 실패 리포트) / 다운로드(`/api/bom/export`)

### 현재고 관리
- 품목별 현재고 테이블(검색, 재고 0 이하 강조)
- 재고 수정 다이얼로그 — `admin_update_inventory` RPC 호출(사유 입력, 같은 트랜잭션에서
  `inventory_history`에 정확히 기록)
- 변경 이력 다이얼로그, 엑셀 업/다운로드(`/api/inventory/import|export`)

### 생산그룹 관리
- 생산그룹 CRUD, 가용시간(CAPA)은 DB generated column으로 자동 계산
- 등록/수정 폼에서 가용시간 계산식 실시간 미리보기

### 월간 생산계획 → MRP 전개 → CAPA 분석
- **월간 생산계획**: 월 선택, 완제품별 계획수량 등록/수정(DRAFT)/확정, 삭제
- **MRP 전개 엔진**(`lib/mrp/engine.ts`): 다단계 BOM 재귀 전개(순환 경로 방어) → 현재고
  반영 순소요량 계산(음수 클램프). 실제 서비스·데모가 같은 함수를 공유.
- **MRP 전개 페이지**: 실행 이력 선택, 레벨/총소요량/현재고/순소요량 테이블, 엑셀 다운로드
- **CAPA 분석 페이지**: Dashboard와 동일한 부하율 차트 재사용 + 생산그룹별 상세 테이블
- "MRP 전개 실행" 1회 클릭으로 mrp_runs → mrp_result_lines → capa_results 일괄 계산/저장

### 일일 생산계획
- **자동 생성 엔진**(`lib/mrp/daily-plan-engine.ts`): BOM 레벨이 깊은 품목(부품)부터 처리해
  완제품 쪽으로 갈수록 시작일이 밀리도록 역산. 반제품(SEMI) 레벨 종료 후 2일 검사 리드타임을
  더한 뒤 다음 레벨 시작. 그룹 1일 가용시간을 `인원 × 440분`으로 근사해 소요시간이 큰
  품목부터 배분(**단순화 사항**: 개별 작업자 배정까지는 하지 않음 — 8번 참고)
- 날짜별 계획 테이블(수량 수정, 확정/잠금/삭제), 재생성 시 미확정 자동계획만 정리하고
  수동조정·확정본은 보존, 배정 불가 품목 리포트

### 재고 시뮬레이션
- **계산 엔진**(`lib/mrp/simulation-engine.ts`): 예상재고 = 기초재고 + 생산량 − 소요량 −
  출고 − 불량. 마이너스 전환일은 CRITICAL(빨강), 3일 이내 전환 예정은 WARNING(노랑)
- 생산량/소요량은 실제 `daily_plans`·BOM 정미수량과 연동해 계산(하드코딩 아님)
- 품목 선택 + 조회기간(7/14/30일) 전환, 라인 차트 + 일별 상세 테이블, 재고 조정
  (생산 외 출고/폐기/보정) 입력

### 생산실적 입력
- 날짜별 실적 목록, 수동 입력(품목/수량/불량수량), 엑셀 업/다운로드
  (`/api/actuals/import|export`). 저장 시 트리거가 현재고에 자동 반영.

### 계획대비실적
- DB 뷰 `v_plan_vs_actual` 조회. 기간 선택, KPI 카드(전체 달성률 등), 일자별 계획 vs 실적
  막대 차트, 품목별 상세 테이블(달성률 배지)

## 7. 테스트 방법

- [ ] `.env.local` 미설정 상태에서 아무 페이지나 접속하면 로그인 없이 데모 데이터로 바로
      보이는지 확인 (미들웨어가 데모 모드에서는 인증을 건너뜀)
- [ ] Supabase 연동 후 로그인하지 않고 `/dashboard` 등에 접속하면 `/login`으로 리다이렉트되는지 확인
- [ ] 로그인 성공 시 원래 가려던 페이지(`redirectTo`)로 이동하는지, 헤더에 실제 이름/역할/
      소속 그룹이 표시되는지, 로그아웃이 정상 동작하는지 확인
- [ ] `.env.local` 미설정 상태에서 각 페이지 접속 시 데모 데이터 배너 + 정상 렌더링 확인
- [ ] Supabase 연동 후 실데이터 입력 시 각 화면이 실쿼리 결과로 전환되는지 확인
- [ ] BOM에서 순환참조가 발생하는 조합을 추가해 클라이언트 경고 + 저장 차단 확인
- [ ] 월간계획 확정 → MRP 전개 실행 → CAPA/MRP 결과 화면에 반영되는지 확인
- [ ] MRP 실행 결과로 일일계획 자동 생성 → 반제품 완료일 + 2일 뒤 상위 품목 일정이
      잡히는지 확인
- [ ] 재고 조정(출고/폐기/보정) 입력 후 재고 시뮬레이션과 현재고 화면에 즉시 반영되는지 확인
- [ ] 생산실적 입력 후 현재고 증가 + 계획대비실적 달성률이 갱신되는지 확인
- [ ] 다크모드 ↔ 라이트모드 전환 시 신호등 색상(적/황/녹) 대비 유지 확인
- [ ] 모바일 너비(375px)에서 사이드바 드로어 전환, 카드/테이블 반응형 확인

향후 단계에는 `src/lib/mrp/*.ts`(순수 함수라 테스트 용이) 단위 테스트(Vitest 권장)와
Supabase 마이그레이션에 대한 `pgTAP` 기반 DB 테스트 추가를 권장합니다.

## 8. 알려진 제한사항 (실제 도입 전 보강 권장)

- **일일계획 자동 생성은 그룹 총량 단위로 근사**합니다. 1인당 430~450분·최대 3품목 제약은
  그룹의 "인원 × 440분" 총 가용시간으로 뭉뚱그려 반영되며, 개별 작업자에게 실제로 배정하는
  단계까지는 만들지 않았습니다. 작업자 배정이 꼭 필요하다면 `profiles`에서 그룹별 작업자
  목록을 가져와 `daily-plan-engine.ts`의 그룹 단위 배분을 작업자 단위로 한 단계 더 쪼개는
  방식으로 확장할 수 있습니다.
- **재고 시뮬레이션은 페이지 로드 시 실시간 계산 방식**입니다. `inventory_simulation_daily`
  테이블(DDL에 이미 정의됨)에 결과를 저장하는 배치 잡으로 바꾸면, 대량 품목을 다룰 때 응답
  속도를 높일 수 있습니다.
- **`daily_plans`의 RLS는 "본인 소속 그룹만 조회"가 기본**이라, 조장(leader) 계정으로 다른
  그룹이 담당하는 품목의 재고 시뮬레이션을 보면 해당 그룹의 계획이 누락되어 계산이 부정확할
  수 있습니다. 재고 시뮬레이션을 전 그룹 대상으로 열어두려면 관리자 전용으로 제한하거나,
  이 조회에 한해 RLS를 완화하는 별도 정책/뷰 추가를 권장합니다.
- 캘린더는 주말/휴일을 구분하지 않고 연속 일수로 계산합니다.
- `daily_plan_history`(일일계획 변경 이력 테이블)는 스키마만 있고 아직 실제 기록 로직은
  연결하지 않았습니다.
- **회원가입/프로필 자동 생성 트리거가 없습니다.** 관리자가 Supabase Auth에서 사용자를
  만든 뒤 `profiles` 테이블에 동일 `id`로 역할을 직접 지정해야 합니다. 자동화하려면
  `auth.users` INSERT 시 `profiles`에 기본행(예: role='worker')을 만드는 트리거를
  추가하는 것을 권장합니다.
