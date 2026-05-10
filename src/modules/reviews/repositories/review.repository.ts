import { prisma } from "../../../libs/prisma.js";

export const addReview = async (data: {
  storeId: number;
  userId: number;
  contents?: string;
  rating?: number;
}) => {
  return prisma.review.create({
    data,
  });
};

export const getMyReviews = async (userId: number, page: number, size: number) => {
  return prisma.review.findMany({
    where: { userId },
    include: {
      store: true,
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * size,
    take: size,
  });
};
