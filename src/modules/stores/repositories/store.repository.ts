import { prisma } from "../../../libs/prisma.js";

export const getRegion = async (regionId: number) => {
  return prisma.region.findUnique({
    where: { id: regionId },
  });
};

export const getStore = async (storeId: number) => {
  return prisma.store.findUnique({
    where: { id: storeId },
  });
};

export const addStore = async (data: {
  regionId: number;
  name: string;
  address: string;
  category?: string;
  phoneNumber?: string;
}) => {
  return prisma.store.create({
    data,
  });
};

export const getRecommendedStores = async (region?: string) => {
  return prisma.store.findMany({
    where: region
      ? {
          region: {
            name: {
              contains: region,
            },
          },
        }
      : undefined,
    include: {
      region: true,
    },
    orderBy: { id: "asc" },
  });
};
