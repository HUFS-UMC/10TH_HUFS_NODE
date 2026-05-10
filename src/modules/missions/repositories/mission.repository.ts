import { prisma } from "../../../libs/prisma.js";

const isUniqueError = (error: unknown) => {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
};

export const addMission = async (data: {
  storeId: number;
  point: number;
  dueDate: Date;
  description: string;
}) => {
  return prisma.mission.create({
    data,
  });
};

export const getMission = async (missionId: number) => {
  return prisma.mission.findUnique({
    where: { id: missionId },
    include: { store: true },
  });
};

export const getStoreMissions = async (storeId: number, page: number, size: number) => {
  return prisma.mission.findMany({
    where: { storeId },
    orderBy: { id: "asc" },
    skip: (page - 1) * size,
    take: size,
  });
};

export const challengeMission = async (userId: number, missionId: number) => {
  try {
    return await prisma.$transaction(async (tx) => {
      const mission = await tx.mission.findUnique({
        where: { id: missionId },
      });

      if (!mission) {
        return "NOT_FOUND" as const;
      }

      return tx.userMission.create({
        data: {
          missionId: mission.id,
          userId,
        },
        include: {
          mission: true,
        },
      });
    });
  } catch (error) {
    if (isUniqueError(error)) {
      return "ALREADY_CHALLENGED" as const;
    }

    throw error;
  }
};

export const getMyMissions = async (
  userId: number,
  isCompleted: boolean,
  page: number,
  size: number,
) => {
  return prisma.userMission.findMany({
    where: {
      userId,
      isCompleted,
    },
    include: {
      mission: {
        include: {
          store: true,
        },
      },
    },
    orderBy: { challengedAt: "desc" },
    skip: (page - 1) * size,
    take: size,
  });
};

export const completeMission = async (userId: number, missionId: number) => {
  const userMission = await prisma.userMission.findUnique({
    where: {
      missionId_userId: {
        missionId,
        userId,
      },
    },
  });

  if (!userMission || userMission.isCompleted) {
    return null;
  }

  return prisma.userMission.update({
    where: { id: userMission.id },
    data: { isCompleted: true },
    include: { mission: true },
  });
};
