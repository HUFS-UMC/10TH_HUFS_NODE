import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { StatusCodes } from "http-status-codes";
import { handleUserSignUp } from "./modules/users/controllers/user.controller.js";
import { getCurrentUser, parseNumberParam } from "./modules/common/request.js";
import {
  addStore,
  getRecommendedStores,
  getRegion,
  getStore,
} from "./modules/stores/repositories/store.repository.js";
import { addReview, getMyReviews } from "./modules/reviews/repositories/review.repository.js";
import {
  addMission,
  challengeMission,
  completeMission,
  getMyMissions,
  getStoreMissions,
} from "./modules/missions/repositories/mission.repository.js";

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

const getPage = (req: Request) => {
  const page = Number(req.query.page ?? 1);
  return Number.isInteger(page) && page > 0 ? page : 1;
};

const getSize = (req: Request) => {
  const size = Number(req.query.size ?? 10);
  return Number.isInteger(size) && size > 0 ? size : 10;
};

const toMissionResponse = (mission: {
  id: number;
  storeId: number;
  point: number;
  dueDate: Date;
  description?: string;
}, isCompleted = 0) => ({
  missionId: mission.id,
  storeId: mission.storeId,
  point: mission.point,
  dueDate: mission.dueDate.toISOString().slice(0, 10),
  description: mission.description,
  isCompleted,
});

app.use(cors());
app.use(express.static("public"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! This is TypeScript Server!");
});

app.post("/api/users/signup", handleUserSignUp);
app.post("/api/v1/users/signup", handleUserSignUp);

app.get("/api/home", async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  const region = typeof req.query.region === "string" ? req.query.region : undefined;
  const stores = await getRecommendedStores(region);

  res.json({
    myPoints: user?.points ?? 0,
    recommendedStores: stores.map((store) => store.name),
  });
});

app.get("/api/users/me", async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하는 유저가 없습니다." });
    return;
  }

  res.json({
    phoneNumber: user.phoneNumber,
    points: user.points,
  });
});

app.post("/api/regions/:regionId/stores", async (req: Request, res: Response) => {
  const regionId = parseNumberParam(req.params.regionId);

  if (!regionId || !(await getRegion(regionId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 지역입니다." });
    return;
  }

  const store = await addStore({
    regionId,
    name: req.body.name,
    address: req.body.address,
    category: req.body.category,
    phoneNumber: req.body.phoneNumber,
  });

  res.status(StatusCodes.CREATED).json({
    storeId: store.id,
    regionId: store.regionId,
    name: store.name,
    address: store.address,
    category: store.category,
    phoneNumber: store.phoneNumber,
  });
});

app.post("/api/stores/:storeId/reviews", async (req: Request, res: Response) => {
  const storeId = parseNumberParam(req.params.storeId);
  const user = await getCurrentUser(req);

  if (!storeId || !(await getStore(storeId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 가게입니다." });
    return;
  }

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하는 유저가 없습니다." });
    return;
  }

  const review = await addReview({
    storeId,
    userId: user.id,
    contents: req.body.contents,
    rating: req.body.rating,
  });

  res.status(StatusCodes.CREATED).json({
    reviewId: review.id,
    storeId: review.storeId,
    userId: review.userId,
    contents: review.contents,
    rating: review.rating,
    createdAt: review.createdAt,
  });
});

app.get("/api/users/me/reviews", async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하는 유저가 없습니다." });
    return;
  }

  const reviews = await getMyReviews(user.id, getPage(req), getSize(req));

  res.json(
    reviews.map((review) => ({
      reviewId: review.id,
      storeId: review.storeId,
      storeName: review.store.name,
      contents: review.contents,
      rating: review.rating,
      createdAt: review.createdAt,
    })),
  );
});

app.post("/api/stores/:storeId/missions", async (req: Request, res: Response) => {
  const storeId = parseNumberParam(req.params.storeId);

  if (!storeId || !(await getStore(storeId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 가게입니다." });
    return;
  }

  const mission = await addMission({
    storeId,
    point: Number(req.body.point),
    dueDate: new Date(req.body.dueDate),
    description: req.body.description,
  });

  res.status(StatusCodes.CREATED).json(toMissionResponse(mission));
});

app.get("/api/stores/:storeId/missions", async (req: Request, res: Response) => {
  const storeId = parseNumberParam(req.params.storeId);

  if (!storeId || !(await getStore(storeId))) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 가게입니다." });
    return;
  }

  const missions = await getStoreMissions(storeId, getPage(req), getSize(req));

  res.json(missions.map((mission) => toMissionResponse(mission)));
});

app.post("/api/missions/:missionId/challenge", async (req: Request, res: Response) => {
  const missionId = parseNumberParam(req.params.missionId);
  const user = await getCurrentUser(req);

  if (!missionId) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 미션입니다." });
    return;
  }

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하는 유저가 없습니다." });
    return;
  }

  const result = await challengeMission(user.id, missionId);

  if (result === "NOT_FOUND") {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하지 않는 미션입니다." });
    return;
  }

  if (result === "ALREADY_CHALLENGED") {
    res.status(StatusCodes.CONFLICT).json({ message: "이미 도전 중인 미션입니다." });
    return;
  }

  res.status(StatusCodes.CREATED).json({
    userMissionId: result.id,
    missionId: result.missionId,
    storeId: result.mission.storeId,
    userId: result.userId,
    isCompleted: result.isCompleted ? 1 : 0,
    challengedAt: result.challengedAt,
  });
});

app.get("/api/users/me/missions", async (req: Request, res: Response) => {
  const user = await getCurrentUser(req);
  const isCompleted = Number(req.query.isCompleted);

  if (isCompleted !== 0 && isCompleted !== 1) {
    res.status(StatusCodes.BAD_REQUEST).json({ message: "isCompleted는 0 또는 1이어야 합니다." });
    return;
  }

  if (!user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "존재하는 유저가 없습니다." });
    return;
  }

  const userMissions = await getMyMissions(user.id, isCompleted === 1, getPage(req), getSize(req));

  res.json(
    userMissions.map((userMission) => ({
      missionId: userMission.missionId,
      storeId: userMission.mission.storeId,
      storeName: userMission.mission.store.name,
      point: userMission.mission.point,
      dueDate: userMission.mission.dueDate.toISOString().slice(0, 10),
      description: userMission.mission.description,
      isCompleted: userMission.isCompleted ? 1 : 0,
      challengedAt: userMission.challengedAt,
    })),
  );
});

app.patch("/api/missions/:missionId/complete", async (req: Request, res: Response) => {
  const missionId = parseNumberParam(req.params.missionId);
  const user = await getCurrentUser(req);

  if (!missionId || !user) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "도전 중인 미션이 아닙니다." });
    return;
  }

  const userMission = await completeMission(user.id, missionId);

  if (!userMission) {
    res.status(StatusCodes.NOT_FOUND).json({ message: "도전 중인 미션이 아닙니다." });
    return;
  }

  res.json({
    message: "미션 완료 처리 성공",
    missionId: userMission.missionId,
    isCompleted: userMission.isCompleted ? 1 : 0,
  });
});

app.listen(port, () => {
  console.log(`[server]: Server is running at <http://localhost>:${port}`);
});
