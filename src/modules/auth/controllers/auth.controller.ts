import { Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { issueTokens, verifyToken } from "../services/auth.service.js";
import { getGitHubLoginUrl, loginWithGitHub } from "../services/github-auth.service.js";
import { getUser } from "../../users/repositories/user.repository.js";

export const redirectToGitHubLogin = (_req: Request, res: Response) => {
  res.redirect(getGitHubLoginUrl());
};

export const handleGitHubCallback = async (req: Request, res: Response) => {
  const code = typeof req.query.code === "string" ? req.query.code : null;

  if (!code) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "GitHub 인증 코드가 없습니다." });
    return;
  }

  const result = await loginWithGitHub(code);

  if (!result) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "GitHub 로그인에 실패했습니다." });
    return;
  }

  res.json(result);
};

export const refreshToken = async (req: Request, res: Response) => {
  const token = req.body.refreshToken;

  if (typeof token !== "string") {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "refreshToken이 필요합니다." });
    return;
  }

  const payload = verifyToken(token, "refresh");

  if (!payload || !(await getUser(payload.sub))) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "유효하지 않은 refreshToken입니다." });
    return;
  }

  res.json({ tokens: issueTokens(payload.sub) });
};
