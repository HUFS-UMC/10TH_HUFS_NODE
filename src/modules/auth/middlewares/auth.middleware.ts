import { NextFunction, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { verifyToken } from "../services/auth.service.js";
import { getUser } from "../../users/repositories/user.repository.js";

export const requireLogin = async (req: Request, res: Response, next: NextFunction) => {
  const authorization = req.header("Authorization");
  const token = authorization?.startsWith("Bearer ") ? authorization.slice(7).trim() : null;

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "로그인이 필요합니다." });
    return;
  }

  const payload = verifyToken(token, "access");

  if (!payload) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "유효하지 않은 토큰입니다." });
    return;
  }

  const user = await getUser(payload.sub);

  if (!user) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "유효하지 않은 사용자입니다." });
    return;
  }

  res.locals.user = user;
  next();
};
