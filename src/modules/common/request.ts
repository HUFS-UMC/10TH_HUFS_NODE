import { Request } from "express";
import { getFirstUser, getUser } from "../users/repositories/user.repository.js";

export const parseNumberParam = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getCurrentUser = async (req: Request) => {
  const authorization = req.header("Authorization");
  const tokenUserId = authorization?.replace("Bearer", "").trim();
  const parsedUserId = Number(tokenUserId);

  if (Number.isInteger(parsedUserId) && parsedUserId > 0) {
    const user = await getUser(parsedUserId);

    if (user) {
      return user;
    }
  }

  return getFirstUser();
};
