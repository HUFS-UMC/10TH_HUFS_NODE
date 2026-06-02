import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import { bodyToUser, bodyToUserUpdate } from "../dtos/user.dto.js";
import { loginWithEmail, updateMyProfile, userSignUp } from "../services/user.service.js";

export const handleUserSignUp = async (req: Request, res: Response, next: NextFunction ) => {
  try {
    const user = await userSignUp(bodyToUser(req.body));

    res.status(StatusCodes.CREATED).json({ result: user });
  } catch (error) {
    next(error);
  }
};

export const handleEmailLogin = async (req: Request, res: Response) => {
  const result = await loginWithEmail(req.body.email, req.body.password);

  if (!result) {
    res.status(StatusCodes.UNAUTHORIZED).json({ message: "이메일 또는 비밀번호가 올바르지 않습니다." });
    return;
  }

  res.json(result);
};

export const handleUpdateMe = async (req: Request, res: Response) => {
  const user = res.locals.user;
  const result = await updateMyProfile(user.id, bodyToUserUpdate(req.body));

  res.json({ result });
};
