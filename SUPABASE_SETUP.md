# Supabase 저장 — 처음부터 설정하기

아래 순서대로만 하면 됩니다.

---

## 1단계: Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 접속 후 로그인
2. **New Project** 클릭
3. 조직 선택(또는 새로 만들기) → 프로젝트 이름 입력 → **Database password** 설정
4. **Create new project** 클릭 (1~2분 대기)

---

## 2단계: 테이블 만들기

1. Supabase 대시보드 왼쪽 메뉴에서 **SQL Editor** 클릭
2. **New query** 선택
3. 아래 SQL **전체 복사** 후 붙여넣기
4. **Run** (또는 Ctrl+Enter) 실행

```sql
-- 1) 기존 테이블 삭제 (정책은 테이블 삭제 시 함께 제거됨)
drop table if exists public.lotto_draws;

-- 2) 테이블 생성
create table public.lotto_draws (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  numbers jsonb not null,
  source text not null check (source in ('random', 'fortune')),
  fortune_index int,
  fortune_text text
);

-- 3) RLS 켜기
alter table public.lotto_draws enable row level security;

-- 4) 익명(anon) 사용자 insert 허용
create policy "Allow anonymous insert"
  on public.lotto_draws
  for insert to anon
  with check (true);
```

5. 실행 후 에러 없이 완료되면 **Table Editor**에서 `lotto_draws` 테이블이 보여야 합니다.

---

## 3단계: Supabase에서 URL이랑 service_role 키 가져오기

저장이 안 되면 대부분 **anon 키 + RLS** 때문입니다. **service_role** 키를 쓰면 RLS 없이 저장됩니다. (서버에서만 쓰므로 노출되지 않음)

### 3-1. 설정 화면

1. Supabase 대시보드 왼쪽 맨 아래 **Project Settings**(톱니바퀴) 클릭
2. 왼쪽에서 **API** 탭 클릭

### 3-2. Project URL 복사

- **Configuration** 에서 **Project URL** (`https://xxxxx.supabase.co`) 전체 복사  
→ Vercel 환경 변수 **`SUPABASE_URL`** 에 넣을 값

### 3-3. service_role 키 복사 (필수)

1. 같은 API 페이지에서 **Project API keys** 섹션으로 내려가기
2. **service_role** 이라고 적힌 행 찾기 (anon 아래에 있음, **Role: service_role**)
3. 그 행의 **API Key** 옆 **Reveal** 클릭 후 **복사**  
   - 이 키는 **secret** 이라서 브라우저에 노출하면 안 되고, **Vercel 환경 변수에만** 넣으면 됨  
→ Vercel 환경 변수 **`SUPABASE_SERVICE_ROLE_KEY`** 에 넣을 값

### 3-4. 정리

| Vercel 환경 변수 이름 | Supabase에서 복사하는 곳 |
|----------------------|--------------------------|
| `SUPABASE_URL` | Project URL (Configuration) |
| `SUPABASE_SERVICE_ROLE_KEY` | Project API keys → **service_role** 행의 API Key (Reveal 후 복사) |

---

## 4단계: Vercel 환경 변수 설정

1. [vercel.com](https://vercel.com) 로그인 → 이 로또 프로젝트 선택
2. **Settings** → **Environment Variables**
3. **Add New** 로 아래 두 개 추가 (이름·값 정확히):

| Name | Value |
|------|--------|
| `SUPABASE_URL` | 3단계에서 복사한 Project URL (앞뒤 공백 없이) |
| `SUPABASE_SERVICE_ROLE_KEY` | 3단계에서 복사한 **service_role** 키 (Reveal 후 복사한 것, 앞뒤 공백 없이) |

4. **Environment** 에서 **Production** 체크 후 **Save**
5. **한 번 더 Save** 확인

---

## 5단계: 다시 배포하기

1. Vercel 프로젝트에서 **Deployments** 탭으로 이동
2. 맨 위 배포 오른쪽 **⋯** 클릭 → **Redeploy**
3. **Redeploy** 한 번 더 클릭해서 배포 완료될 때까지 대기

---

## 6단계: 동작 확인

1. 배포된 사이트 주소로 접속 (예: `https://프로젝트명.vercel.app`)
2. **번호 추천받기** 또는 **운세 뽑기** 한 번 실행
3. Supabase 대시보드로 돌아가서 **Table Editor** → **lotto_draws** 선택
4. **Refresh** 하면 방금 저장된 행이 보여야 합니다.

---

## 저장되는 데이터 형식

| 컬럼 | 설명 |
|------|------|
| `numbers` | `[1,2,3,4,5,6,7]` — 앞 6개 본번호, 마지막 1개 보너스 |
| `source` | `random` (번호 추천/한 세트 더) 또는 `fortune` (운세 뽑기) |
| `fortune_index` | 운세 뽑기일 때만 1~100 |
| `fortune_text` | 운세 뽑기일 때만 운세 문구 |

---

## 그래도 데이터가 안 들어올 때

### 1) 환경 변수부터 확인

배포된 사이트 주소 뒤에 `/api/check-env` 를 붙여서 브라우저로 엽니다.

- 예: `https://내프로젝트.vercel.app/api/check-env`

응답 예시:

- `"SUPABASE_URL": "설정됨 (...)", "SUPABASE_ANON_KEY": "설정됨 (길이 200)"`, `"ok": true`  
  → 환경 변수는 들어가 있는 상태. 아래 2)·3) 확인.
- `"SUPABASE_URL": "없음"` 또는 `"SUPABASE_ANON_KEY": "없음"`  
  → Vercel **Settings → Environment Variables** 에 두 값 모두 넣었는지 확인하고, **Redeploy** 한 번 더 한 뒤 다시 `/api/check-env` 확인.

### 2) 저장 시 나오는 메시지 확인

번호 추천 또는 운세 뽑기를 한 번 하면, **저장이 실패할 때만** 브라우저에 **alert** 로 에러 메시지가 뜹니다.

- **"SUPABASE_URL or SUPABASE_ANON_KEY not set"**  
  → 1)처럼 환경 변수 확인 후 Redeploy.
- **"Supabase insert failed"** + `detail`  
  → Supabase 쪽 오류. `detail` 내용이 RLS/권한 관련이면 3)의 RLS 확인.
- **"저장 요청 실패: ..."**  
  → `/api/save-lotto` 호출 실패(네트워크/404 등). 4) 확인.

### 3) Supabase RLS

**Table Editor** → `lotto_draws` → **Policies** 에서 **anon** 의 **insert** 허용 정책이 있는지 확인. 없으면 2단계 SQL에서 정책 만드는 부분만 다시 실행.

### 4) API가 배포됐는지 확인

주소창에 `https://내프로젝트.vercel.app/api/check-env` 를 넣었을 때 JSON이 보여야 합니다. 404가 나오면 `api/check-env.js`, `api/save-lotto.js` 가 저장소에 있고, 그걸로 Vercel이 배포했는지 확인한 뒤 다시 배포합니다.
