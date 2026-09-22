-- =========================================================
-- RLS (Row Level Security) 정책
-- 제조업 생산관리 시스템 (MRP 기반)
-- 문서 버전 v1.0 / 2026-09-15
-- 선행 스크립트: 04_DDL_제조업_MRP시스템.sql
-- =========================================================
-- 역할 구분: admin(생산관리자) / leader(조장) / worker(작업자)
-- 원칙:
--   1) admin은 전 테이블 CRUD 가능
--   2) leader는 본인 소속 production_group 관련 데이터에 한해 조회/입력 가능
--   3) worker는 본인에게 배정된 데이터에 한해 조회, 실적은 본인 입력분만 등록
--   4) 마스터 데이터(품목/BOM/생산그룹)는 admin만 쓰기, 전 역할 조회 가능
-- =========================================================

-- ---------------------------------------------------------
-- 0. 공통 헬퍼 함수(current_role_name/is_admin/is_leader_of 등)는
--    0001_init_schema.sql 로 이동했습니다 (admin_update_inventory RPC가
--    is_admin()에 의존하므로 스키마 생성 단계에서 함께 정의).
-- ---------------------------------------------------------

-- ---------------------------------------------------------
-- 1. profiles
-- ---------------------------------------------------------
alter table profiles enable row level security;

create policy profiles_select_own_or_admin
    on profiles for select
    using (id = auth.uid() or is_admin());

create policy profiles_update_own_or_admin
    on profiles for update
    using (id = auth.uid() or is_admin());

create policy profiles_admin_all
    on profiles for all
    using (is_admin())
    with check (is_admin());

-- ---------------------------------------------------------
-- 2. 마스터 데이터: production_groups / items / bom_lines
--    조회는 로그인 사용자 전체, 쓰기는 admin만
-- ---------------------------------------------------------
alter table production_groups enable row level security;
alter table items enable row level security;
alter table bom_lines enable row level security;

create policy production_groups_select_all
    on production_groups for select
    using (auth.uid() is not null);

create policy production_groups_write_admin
    on production_groups for insert with check (is_admin());
create policy production_groups_update_admin
    on production_groups for update using (is_admin());
create policy production_groups_delete_admin
    on production_groups for delete using (is_admin());

create policy items_select_all
    on items for select
    using (auth.uid() is not null);

create policy items_write_admin
    on items for insert with check (is_admin());
create policy items_update_admin
    on items for update using (is_admin());
create policy items_delete_admin
    on items for delete using (is_admin());

create policy bom_lines_select_all
    on bom_lines for select
    using (auth.uid() is not null);

create policy bom_lines_write_admin
    on bom_lines for insert with check (is_admin());
create policy bom_lines_update_admin
    on bom_lines for update using (is_admin());
create policy bom_lines_delete_admin
    on bom_lines for delete using (is_admin());

-- ---------------------------------------------------------
-- 3. 재고: inventory / inventory_history / inventory_adjustments
--    조회는 전체, 쓰기는 admin (조정 입력은 admin/leader)
--    ※ 클라이언트(Next.js)에서 수량을 직접 수정할 때는 이 테이블에 바로 UPDATE하지 말고
--      0001_init_schema.sql 의 admin_update_inventory(p_item_id, p_quantity, p_reason) RPC를
--      사용한다. 사유(reason)가 같은 트랜잭션 안에서 inventory_history에 정확히 기록되며,
--      RPC 자체가 SECURITY DEFINER + is_admin() 체크를 수행하므로 아래 정책과 이중으로 보호된다.
-- ---------------------------------------------------------
alter table inventory enable row level security;
alter table inventory_history enable row level security;
alter table inventory_adjustments enable row level security;

create policy inventory_select_all
    on inventory for select using (auth.uid() is not null);
create policy inventory_write_admin
    on inventory for insert with check (is_admin());
create policy inventory_update_admin
    on inventory for update using (is_admin());

create policy inventory_history_select_all
    on inventory_history for select using (auth.uid() is not null);

create policy inventory_adjustments_select_all
    on inventory_adjustments for select using (auth.uid() is not null);
create policy inventory_adjustments_write_admin_or_leader
    on inventory_adjustments for insert
    with check (is_admin() or current_role_name() = 'leader');

-- ---------------------------------------------------------
-- 4. 계획/전개: monthly_plans / mrp_runs / mrp_result_lines / capa_results
--    admin 전용 (조장/작업자는 조회만)
-- ---------------------------------------------------------
alter table monthly_plans enable row level security;
alter table mrp_runs enable row level security;
alter table mrp_result_lines enable row level security;
alter table capa_results enable row level security;

create policy monthly_plans_select_all
    on monthly_plans for select using (auth.uid() is not null);
create policy monthly_plans_write_admin
    on monthly_plans for insert with check (is_admin());
create policy monthly_plans_update_admin
    on monthly_plans for update using (is_admin());
create policy monthly_plans_delete_admin
    on monthly_plans for delete using (is_admin());

create policy mrp_runs_select_all
    on mrp_runs for select using (auth.uid() is not null);
create policy mrp_runs_write_admin
    on mrp_runs for insert with check (is_admin());

create policy mrp_result_lines_select_all
    on mrp_result_lines for select using (auth.uid() is not null);
create policy mrp_result_lines_write_admin
    on mrp_result_lines for insert with check (is_admin());

create policy capa_results_select_all
    on capa_results for select using (auth.uid() is not null);
create policy capa_results_write_admin
    on capa_results for insert with check (is_admin());

-- ---------------------------------------------------------
-- 5. 일일계획: daily_plans / daily_plan_history
--    - admin: 전체 CRUD
--    - leader: 본인 소속 그룹 데이터 조회 + 수정(조정)
--    - worker: 본인에게 배정된 행만 조회
-- ---------------------------------------------------------
alter table daily_plans enable row level security;
alter table daily_plan_history enable row level security;

create policy daily_plans_select
    on daily_plans for select
    using (
        is_admin()
        or is_leader_of(production_group_id)
        or assigned_to = auth.uid()
    );

create policy daily_plans_write_admin
    on daily_plans for insert with check (is_admin());

create policy daily_plans_update_admin_or_leader
    on daily_plans for update
    using (is_admin() or is_leader_of(production_group_id))
    with check (is_admin() or is_leader_of(production_group_id));

create policy daily_plans_delete_admin
    on daily_plans for delete using (is_admin());

create policy daily_plan_history_select
    on daily_plan_history for select
    using (
        is_admin()
        or exists (
            select 1 from daily_plans dp
            where dp.id = daily_plan_history.daily_plan_id
              and (is_leader_of(dp.production_group_id) or dp.assigned_to = auth.uid())
        )
    );

-- ---------------------------------------------------------
-- 6. 생산실적: production_actuals
--    - admin: 전체
--    - leader: 소속 그룹 품목 실적 조회/입력/수정
--    - worker: 본인이 입력한 실적만 등록, 본인 입력분 조회
-- ---------------------------------------------------------
alter table production_actuals enable row level security;

create policy production_actuals_select
    on production_actuals for select
    using (
        is_admin()
        or created_by = auth.uid()
        or exists (
            select 1 from daily_plans dp
            where dp.id = production_actuals.daily_plan_id
              and is_leader_of(dp.production_group_id)
        )
    );

create policy production_actuals_insert
    on production_actuals for insert
    with check (
        is_admin()
        or created_by = auth.uid()
    );

create policy production_actuals_update_admin_or_leader
    on production_actuals for update
    using (
        is_admin()
        or exists (
            select 1 from daily_plans dp
            where dp.id = production_actuals.daily_plan_id
              and is_leader_of(dp.production_group_id)
        )
    );

-- ---------------------------------------------------------
-- 7. 재고 시뮬레이션: inventory_simulation_daily
--    조회는 전체, 쓰기는 admin(배치 서비스는 service_role 키 사용 → RLS 우회)
-- ---------------------------------------------------------
alter table inventory_simulation_daily enable row level security;

create policy inventory_simulation_select_all
    on inventory_simulation_daily for select using (auth.uid() is not null);
create policy inventory_simulation_write_admin
    on inventory_simulation_daily for insert with check (is_admin());
create policy inventory_simulation_update_admin
    on inventory_simulation_daily for update using (is_admin());

-- =========================================================
-- 참고
-- - mrp_runs / mrp_result_lines / capa_results / inventory_simulation_daily 처럼
--   서버 계산 서비스가 전용으로 쓰는 테이블은 실제로는
--   Next.js 서버(Route Handler/Server Action)에서 SUPABASE_SERVICE_ROLE_KEY로 접속해
--   RLS를 우회한 뒤 계산 결과를 적재하는 방식을 권장한다.
--   위 admin insert 정책은 "관리자 세션으로 직접 조작하는 경우"에 대한 안전장치이다.
-- =========================================================
