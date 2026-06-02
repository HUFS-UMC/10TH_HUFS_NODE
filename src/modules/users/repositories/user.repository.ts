import { prisma } from "../../../libs/prisma.js";

type UserCreateData = {
  email: string;
  passwordHash?: string | null;
  signupMethod?: string;
  name: string;
  gender?: string | null;
  birth?: Date | null;
  address?: string;
  detailAddress?: string;
  phoneNumber?: string | null;
};

const isUniqueError = (error: unknown) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

export const addUser = async (data: UserCreateData): Promise<number | null> => {
  try {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash: data.passwordHash,
        signupMethod: data.signupMethod ?? "EMAIL",
        name: data.name,
        gender: data.gender,
        birth: data.birth,
        address: data.address,
        detailAddress: data.detailAddress,
        phoneNumber: data.phoneNumber,
      },
    });

    return user.id;
  } catch (error) {
    if (isUniqueError(error)) {
      return null;
    }

    throw new Error(`오류가 발생했어요: ${error}`);
  }
};

export const createUserWithPreferences = async (
  data: UserCreateData & { preferences: number[] },
): Promise<number | null> => {
  try {
    const user = await prisma.$transaction(async (tx) => {
      const createdUser = await tx.user.create({
        data: {
          email: data.email,
          passwordHash: data.passwordHash,
          signupMethod: data.signupMethod ?? "EMAIL",
          name: data.name,
          gender: data.gender,
          birth: data.birth,
          address: data.address,
          detailAddress: data.detailAddress,
          phoneNumber: data.phoneNumber,
        },
      });

      if (data.preferences.length > 0) {
        await tx.userFavorCategory.createMany({
          data: data.preferences.map((foodCategoryId) => ({
            userId: createdUser.id,
            foodCategoryId,
          })),
          skipDuplicates: true,
        });
      }

      return createdUser;
    });

    return user.id;
  } catch (error) {
    if (isUniqueError(error)) {
      return null;
    }

    throw new Error(`오류가 발생했어요: ${error}`);
  }
};

export const getUserByEmail = async (email: string) => {
  return prisma.user.findUnique({
    where: { email },
  });
};

export const getUser = async (userId: number) => {
  try {
    return await prisma.user.findUnique({
      where: { id: userId },
    });
  } catch (error) {
    throw new Error(`오류가 발생했어요: ${error}`);
  }
};

export const setPreference = async (userId: number, foodCategoryId: number): Promise<void> => {
  try {
    await prisma.userFavorCategory.create({
      data: {
        foodCategoryId,
        userId,
      },
    });
  } catch (error) {
    throw new Error(`오류가 발생했어요: ${error}`);
  }
};

export const updateUserProfile = async (
  userId: number,
  data: Partial<Omit<UserCreateData, "email" | "passwordHash" | "signupMethod">> & {
    preferences?: number[];
  },
) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.update({
      where: { id: userId },
      data: {
        name: data.name,
        gender: data.gender,
        birth: data.birth,
        address: data.address,
        detailAddress: data.detailAddress,
        phoneNumber: data.phoneNumber,
      },
    });

    if (data.preferences) {
      await tx.userFavorCategory.deleteMany({ where: { userId } });

      if (data.preferences.length > 0) {
        await tx.userFavorCategory.createMany({
          data: data.preferences.map((foodCategoryId) => ({
            userId,
            foodCategoryId,
          })),
          skipDuplicates: true,
        });
      }
    }

    return user;
  });
};

export const getUserPreferencesByUserId = async (userId: number) => {
  try {
    return await prisma.userFavorCategory.findMany({
      where: { userId },
      include: { foodCategory: true },
      orderBy: { foodCategoryId: "asc" },
    });
  } catch (error) {
    throw new Error(`오류가 발생했어요: ${error}`);
  }
};
