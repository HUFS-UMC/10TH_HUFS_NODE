import { UserSignUpRequest } from "../dtos/user.dto.js"; //인터페이스 가져오기 
import { responseFromUser } from "../dtos/user.dto.js";
import { hashPassword, issueTokens, verifyPassword } from "../../auth/services/auth.service.js";
import {
  createUserWithPreferences,
  getUser,
  getUserByEmail,
  getUserPreferencesByUserId,
  updateUserProfile,
} from "../repositories/user.repository.js";

export const userSignUp = async (data: UserSignUpRequest) => {
  const passwordHash = await hashPassword(data.password);

  const joinUserId = await createUserWithPreferences({
    email: data.email,
    passwordHash,
    signupMethod: "EMAIL",
    name: data.name,
    gender: data.gender,
    birth: data.birth, // 문자열을 Date 객체로 변환해서 넘겨줍니다. 
    address: data.address,
    detailAddress: data.detailAddress,
    phoneNumber: data.phoneNumber,
    preferences: data.preferences,
  });

  if (joinUserId === null) {
    throw new Error("이미 존재하는 이메일입니다.");
  }

  const user = await getUser(joinUserId);
  const preferences = await getUserPreferencesByUserId(joinUserId);

  return responseFromUser({ user, preferences });
};

export const loginWithEmail = async (email: string, password: string) => {
  const user = await getUserByEmail(email);

  if (!user || user.signupMethod !== "EMAIL" || !user.passwordHash) {
    return null;
  }

  if (!(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  return {
    user: responseFromUser({
      user,
      preferences: await getUserPreferencesByUserId(user.id),
    }),
    tokens: issueTokens(user.id),
  };
};

export const updateMyProfile = async (
  userId: number,
  data: Parameters<typeof updateUserProfile>[1],
) => {
  await updateUserProfile(userId, data);
  const user = await getUser(userId);
  const preferences = await getUserPreferencesByUserId(userId);

  return responseFromUser({ user, preferences });
};
