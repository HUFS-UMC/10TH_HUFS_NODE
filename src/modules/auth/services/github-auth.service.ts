import { issueTokens } from "./auth.service.js";
import {
  createUserWithPreferences,
  getUserByEmail,
  getUserPreferencesByUserId,
} from "../../users/repositories/user.repository.js";
import { responseFromUser } from "../../users/dtos/user.dto.js";

type GitHubEmail = {
  email: string;
  primary: boolean;
  verified: boolean;
};

type GitHubProfile = {
  login: string;
  name: string | null;
};

const getGitHubCallbackUrl = () =>
  process.env.GITHUB_CALLBACK_URL ?? "http://localhost:8080/api/auth/github/callback";

export const getGitHubLoginUrl = () => {
  const clientId = process.env.GITHUB_CLIENT_ID;

  if (!clientId) {
    throw new Error("GITHUB_CLIENT_ID가 설정되어 있지 않습니다.");
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: getGitHubCallbackUrl(),
    scope: "user:email",
  });

  return `https://github.com/login/oauth/authorize?${params.toString()}`;
};

const requestGitHubAccessToken = async (code: string) => {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getGitHubCallbackUrl(),
    }),
  });

  const data = (await response.json()) as { access_token?: string };

  return data.access_token ?? null;
};

const requestGitHub = async <T>(path: string, accessToken: string) => {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
    },
  });

  if (!response.ok) {
    throw new Error("GitHub 사용자 정보를 가져오지 못했습니다.");
  }

  return (await response.json()) as T;
};

export const loginWithGitHub = async (code: string) => {
  const accessToken = await requestGitHubAccessToken(code);

  if (!accessToken) {
    return null;
  }

  const [profile, emails] = await Promise.all([
    requestGitHub<GitHubProfile>("/user", accessToken),
    requestGitHub<GitHubEmail[]>("/user/emails", accessToken),
  ]);
  const email = emails.find((item) => item.primary && item.verified)?.email;

  if (!email) {
    throw new Error("검증된 GitHub 이메일이 없습니다.");
  }

  const existingUser = await getUserByEmail(email);

  if (existingUser && existingUser.signupMethod !== "GITHUB") {
    throw new Error(`${existingUser.signupMethod} 가입 계정은 GitHub 로그인을 사용할 수 없습니다.`);
  }

  const userId =
    existingUser?.id ??
    (await createUserWithPreferences({
      email,
      passwordHash: null,
      signupMethod: "GITHUB",
      name: profile.name ?? profile.login,
      gender: null,
      birth: null,
      phoneNumber: null,
      preferences: [],
    }));

  if (!userId) {
    return null;
  }

  const user = existingUser ?? (await getUserByEmail(email));
  const preferences = await getUserPreferencesByUserId(userId);

  return {
    user: responseFromUser({ user, preferences }),
    tokens: issueTokens(userId),
  };
};
