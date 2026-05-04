import { UserSignUpRequest } from "../dtos/user.dto.js"; //인터페이스 가져오기 
import { responseFromUser } from "../dtos/user.dto.js";
import { randomBytes, scrypt as scryptCallback } from "crypto";
import { promisify } from "util";
import {
  addUser,
  getUser,
  getUserPreferencesByUserId,
  setPreference,
} from "../repositories/user.repository.js";

const scrypt = promisify(scryptCallback);

const hashPassword = async (password: string) => {
  const salt = randomBytes(16).toString("hex");
  const hashedPassword = (await scrypt(password, salt, 64)) as Buffer;

  return `${salt}:${hashedPassword.toString("hex")}`;
};

export const userSignUp = async (data: UserSignUpRequest) => {
  const passwordHash = await hashPassword(data.password);

  const joinUserId = await addUser({
    email: data.email,
    passwordHash,
    name: data.name,
    gender: data.gender,
    birth: data.birth, // 문자열을 Date 객체로 변환해서 넘겨줍니다. 
    address: data.address,
    detailAddress: data.detailAddress,
    phoneNumber: data.phoneNumber,
  });

  if (joinUserId === null) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  for (const preference of data.preferences) {
    await setPreference(joinUserId, preference);
  }

  const user = await getUser(joinUserId);
  const preferences = await getUserPreferencesByUserId(joinUserId);

  return responseFromUser({ user, preferences });
};
