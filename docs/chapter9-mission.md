# Chapter 9 Mission Notes

## 적용한 인증 흐름

- 이메일/비밀번호 회원가입: `POST /api/users/signup`
- 이메일/비밀번호 로그인: `POST /api/users/login`
- Access/Refresh 재발급: `POST /api/auth/refresh`
- 내 정보 수정: `PATCH /api/users/me`
- GitHub OAuth 로그인 시작: `GET /api/auth/github`
- GitHub OAuth 콜백: `GET /api/auth/github/callback`

`Authorization: Bearer <accessToken>` 형식의 JWT가 있어야 아래 API를 사용할 수 있습니다.

- `GET /api/home`
- `GET /api/users/me`
- `PATCH /api/users/me`
- `POST /api/regions/:regionId/stores`
- `POST /api/stores/:storeId/reviews`
- `GET /api/users/me/reviews`
- `POST /api/stores/:storeId/missions`
- `POST /api/missions/:missionId/challenge`
- `GET /api/users/me/missions`
- `PATCH /api/missions/:missionId/complete`

## 소셜 로그인 연동 기록

이번 구현은 GitHub OAuth를 연동했습니다. 워크북 요구사항에서 참고할 Passport 라이브러리로는 `passport-github2`를 선택할 수 있습니다. 이 프로젝트 코드에서는 의존성을 늘리지 않고 동일한 OAuth 흐름을 직접 구현했습니다.

GitHub OAuth App 설정값:

- Homepage URL: `http://localhost:8080`
- Authorization callback URL: `http://localhost:8080/api/auth/github/callback`

필요한 환경 변수:

```env
JWT_SECRET=replace-with-long-random-secret
GITHUB_CLIENT_ID=replace-with-github-client-id
GITHUB_CLIENT_SECRET=replace-with-github-client-secret
GITHUB_CALLBACK_URL=http://localhost:8080/api/auth/github/callback
```

연동 과정:

1. GitHub Developer settings에서 OAuth App을 생성합니다.
2. 위 callback URL을 등록합니다.
3. `.env`에 GitHub client id, client secret, JWT secret을 추가합니다.
4. 브라우저에서 `/api/auth/github`로 이동합니다.
5. GitHub 동의 화면에서 승인하면 callback API가 GitHub access token을 교환합니다.
6. `/user`, `/user/emails` API로 프로필과 검증된 primary email을 가져옵니다.
7. 기존 계정의 `signupMethod`가 `GITHUB`이면 로그인하고, 없으면 GitHub 계정으로 새 사용자를 생성합니다.

## 가입 방식 제한

`User.signupMethod`에 최초 가입 방식을 저장합니다.

- `EMAIL` 계정은 이메일/비밀번호 로그인만 허용합니다.
- `GITHUB` 계정은 GitHub 로그인만 허용합니다.
- 같은 이메일이 이미 다른 가입 방식으로 존재하면 로그인을 거부합니다.

## 세션 기반 인증과 JWT 비교

세션 기반 인증은 서버가 로그인 상태를 세션 저장소에 보관하고, 클라이언트는 세션 ID가 담긴 쿠키를 매 요청마다 보내는 방식입니다. 서버는 세션 ID로 저장소를 조회해서 사용자를 식별합니다.

JWT 기반 인증은 서버가 서명된 토큰을 발급하고, 클라이언트는 토큰을 매 요청마다 보냅니다. 서버는 토큰의 서명과 만료 시간을 검증해서 사용자를 식별합니다.

세션 방식 장점:

- 서버에서 세션을 즉시 삭제할 수 있어 강제 로그아웃과 권한 회수가 쉽습니다.
- 토큰 본문이 클라이언트에 노출되지 않습니다.
- 쿠키 설정을 잘하면 브라우저 기반 앱에서 보안 정책을 일관되게 적용하기 좋습니다.

세션 방식 단점:

- 서버가 세션 저장소를 운영해야 합니다.
- 서버가 여러 대이면 Redis 같은 공유 저장소나 sticky session 구성이 필요합니다.
- 모바일 앱, 외부 API 클라이언트와 연동할 때 쿠키 기반 흐름이 번거로울 수 있습니다.

JWT 방식 장점:

- Access token 검증만으로 인증할 수 있어 서버 확장이 단순합니다.
- 웹, 모바일, 외부 API 클라이언트에서 같은 방식으로 사용하기 좋습니다.
- 짧은 access token과 긴 refresh token을 나누면 사용성과 보안을 균형 있게 가져갈 수 있습니다.

JWT 방식 단점:

- 이미 발급된 access token은 만료 전까지 회수하기 어렵습니다.
- 토큰 탈취 시 만료 전까지 악용될 수 있으므로 HTTPS, 짧은 만료 시간, 안전한 저장소가 중요합니다.
- payload는 암호화가 아니라 인코딩이므로 민감 정보를 넣으면 안 됩니다.
