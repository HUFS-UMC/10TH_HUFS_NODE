import { createHmac, randomBytes, timingSafeEqual, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";

const scrypt = promisify(scryptCallback);

type TokenPayload = {
  sub: number;
  type: "access" | "refresh";
  iat: number;
  exp: number;
};

const base64UrlEncode = (value: Buffer | string) =>
  Buffer.from(value)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64").toString("utf-8");
};

const getJwtSecret = () => process.env.JWT_SECRET ?? "local-dev-jwt-secret";

const sign = (data: string) => createHmac("sha256", getJwtSecret()).update(data).digest();

const createToken = (userId: number, type: TokenPayload["type"], expiresInSeconds: number) => {
  const now = Math.floor(Date.now() / 1000);
  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      sub: userId,
      type,
      iat: now,
      exp: now + expiresInSeconds,
    }),
  );
  const unsignedToken = `${header}.${payload}`;
  const signature = base64UrlEncode(sign(unsignedToken));

  return `${unsignedToken}.${signature}`;
};

export const issueTokens = (userId: number) => ({
  accessToken: createToken(userId, "access", 60 * 60),
  refreshToken: createToken(userId, "refresh", 60 * 60 * 24 * 14),
});

export const verifyToken = (token: string, expectedType: TokenPayload["type"]) => {
  const [header, payload, signature] = token.split(".");

  if (!header || !payload || !signature) {
    return null;
  }

  const expectedSignature = base64UrlEncode(sign(`${header}.${payload}`));
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (
    actualBuffer.length !== expectedBuffer.length ||
    !timingSafeEqual(actualBuffer, expectedBuffer)
  ) {
    return null;
  }

  const decoded = JSON.parse(base64UrlDecode(payload)) as TokenPayload;
  const now = Math.floor(Date.now() / 1000);

  if (decoded.type !== expectedType || decoded.exp < now) {
    return null;
  }

  return decoded;
};

export const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${hashedPassword.toString("hex")}`;
};

export const verifyPassword = async (password: string, passwordHash: string) => {
  const [salt, hash] = passwordHash.split(":");

  if (!salt || !hash) {
    return false;
  }

  const hashedPassword = (await scrypt(password, salt, 64)) as Buffer;
  const savedBuffer = Buffer.from(hash, "hex");

  return savedBuffer.length === hashedPassword.length && timingSafeEqual(savedBuffer, hashedPassword);
};
