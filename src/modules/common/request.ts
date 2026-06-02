import { Request } from "express";

export const parseNumberParam = (value: unknown) => {
  if (typeof value !== "string") {
    return null;
  }

  const parsed = Number(value);

  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
};

export const getCurrentUser = (req: Request) => req.res?.locals.user;
