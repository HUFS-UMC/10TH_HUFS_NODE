import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import { randomUUID } from "crypto";
import { handleUserSignUp } from "./modules/users/controllers/user.controller.js";

// 1. 환경 변수 설정
dotenv.config();

const app: Express = express();
const port = process.env.PORT || 8080;

type User = {
  userId: string;
  gender?: string;
  birthDate?: string;
  addressMain?: string;
  addressDetail?: string;
  phoneNumber: string;
  points: number;
};

type Store = {
  storeId: string;
  regionId: string;
  name: string;
  address: string;
  category?: string;
  phoneNumber?: string;
};

type Review = {
  reviewId: string;
  storeId: string;
  userId: string;
  contents?: string;
  rating?: number;
  createdAt: string;
};

type Mission = {
  missionId: string;
  storeId: string;
  point: number;
  dueDate: string;
  description: string;
};

type UserMission = {
  userMissionId: string;
  missionId: string;
  storeId: string;
  userId: string;
  isCompleted: 0 | 1;
  challengedAt: string;
};

const defaultUserId = "00000000-0000-4000-8000-000000000001";
const defaultRegionId = "00000000-0000-4000-8000-000000000101";
const defaultStoreId = "00000000-0000-4000-8000-000000000201";
const defaultMissionId = "00000000-0000-4000-8000-000000000301";

const users: User[] = [
  {
    userId: defaultUserId,
    gender: "N",
    birthDate: "2000-01-01",
    addressMain: "서울시 강남구",
    addressDetail: "101호",
    phoneNumber: "010-0000-0000",
    points: 1000,
  },
];

const regions = [
  { regionId: defaultRegionId, name: "강남구" },
  { regionId: "00000000-0000-4000-8000-000000000102", name: "용인시" },
];

const stores: Store[] = [
  {
    storeId: defaultStoreId,
    regionId: defaultRegionId,
    name: "예제 식당",
    address: "서울시 강남구 테헤란로 1",
    category: "한식",
    phoneNumber: "02-000-0000",
  },
];

const reviews: Review[] = [];

const missions: Mission[] = [
  {
    missionId: defaultMissionId,
    storeId: defaultStoreId,
    point: 500,
    dueDate: "2026-12-31",
    description: "식당에서 10000원 이상 주문하기",
  },
];

const userMissions: UserMission[] = [
  {
    userMissionId: "00000000-0000-4000-8000-000000000401",
    missionId: defaultMissionId,
    storeId: defaultStoreId,
    userId: defaultUserId,
    isCompleted: 0,
    challengedAt: new Date().toISOString(),
  },
];

const getCurrentUser = () => users[0];

// 2. 미들웨어 설정
app.use(cors());            // cors 방식 허용                 
app.use(express.static('public'));    // 정적 파일 접근      
app.use(express.json());              // request의 본문을 json으로 해석할 수 있도록 함(JSON 형태의 요청 body를 파싱하기 위함)     
app.use(express.urlencoded({ extended: false })); // 단순 객체 문자열 형태로 본문 데이터 해석

// 3. 기본 라우트
app.get("/", (req: Request, res: Response) => {
  res.send("Hello World! This is TypeScript Server!");
});

app.post("/api/users/signup", (req: Request, res: Response) => {
  const user: User = {
    userId: randomUUID(),
    gender: req.body.gender,
    birthDate: req.body.birthDate,
    addressMain: req.body.addressMain,
    addressDetail: req.body.addressDetail,
    phoneNumber: req.body.phoneNumber ?? "010-0000-0000",
    points: 0,
  };

  users.push(user);
  res.status(201).json(user);
});

app.get("/api/home", (req: Request, res: Response) => {
  const user = getCurrentUser();
  const region = req.query.region;
  const recommendedStores = stores
    .filter((store) => {
      if (typeof region !== "string") {
        return true;
      }

      const foundRegion = regions.find((item) => item.regionId === store.regionId);
      return foundRegion?.name.includes(region);
    })
    .map((store) => store.name);

  res.json({
    myPoints: user?.points ?? 0,
    recommendedStores,
  });
});

app.get("/api/users/me", (req: Request, res: Response) => {
  const user = getCurrentUser();

  res.json({
    phoneNumber: user?.phoneNumber,
    points: user?.points,
  });
});

app.post("/api/regions/:regionId/stores", (req: Request, res: Response) => {
  const regionId = req.params.regionId;

  if (typeof regionId !== "string") {
    res.status(404).json({ message: "존재하지 않는 지역입니다." });
    return;
  }

  const region = regions.find((item) => item.regionId === regionId);

  if (!region) {
    res.status(404).json({ message: "존재하지 않는 지역입니다." });
    return;
  }

  const store: Store = {
    storeId: randomUUID(),
    regionId,
    name: req.body.name,
    address: req.body.address,
    category: req.body.category,
    phoneNumber: req.body.phoneNumber,
  };

  stores.push(store);
  res.status(201).json(store);
});

app.post("/api/stores/:storeId/reviews", (req: Request, res: Response) => {
  const store = stores.find((item) => item.storeId === req.params.storeId);
  const user = getCurrentUser();

  if (!store) {
    res.status(404).json({ message: "존재하지 않는 가게입니다." });
    return;
  }

  const review: Review = {
    reviewId: randomUUID(),
    storeId: store.storeId,
    userId: user?.userId ?? defaultUserId,
    contents: req.body.contents,
    rating: req.body.rating,
    createdAt: new Date().toISOString(),
  };

  reviews.push(review);
  res.status(201).json(review);
});

app.post("/api/stores/:storeId/missions", (req: Request, res: Response) => {
  const store = stores.find((item) => item.storeId === req.params.storeId);

  if (!store) {
    res.status(404).json({ message: "존재하지 않는 가게입니다." });
    return;
  }

  const mission: Mission = {
    missionId: randomUUID(),
    storeId: store.storeId,
    point: req.body.point,
    dueDate: req.body.dueDate,
    description: req.body.description,
  };

  missions.push(mission);
  res.status(201).json({ ...mission, isCompleted: 0 });
});

app.post("/api/missions/:missionId/challenge", (req: Request, res: Response) => {
  const mission = missions.find((item) => item.missionId === req.params.missionId);
  const user = getCurrentUser();

  if (!mission) {
    res.status(404).json({ message: "존재하지 않는 미션입니다." });
    return;
  }

  const alreadyChallenged = userMissions.some(
    (item) => item.missionId === mission.missionId && item.userId === user?.userId,
  );

  if (alreadyChallenged) {
    res.status(409).json({ message: "이미 도전 중인 미션입니다." });
    return;
  }

  const userMission: UserMission = {
    userMissionId: randomUUID(),
    missionId: mission.missionId,
    storeId: mission.storeId,
    userId: user?.userId ?? defaultUserId,
    isCompleted: 0,
    challengedAt: new Date().toISOString(),
  };

  userMissions.push(userMission);
  res.status(201).json(userMission);
});

app.get("/api/users/me/missions", (req: Request, res: Response) => {
  const user = getCurrentUser();
  const isCompleted = Number(req.query.isCompleted);
  const page = Number(req.query.page ?? 1);
  const size = Number(req.query.size ?? 10);

  const result = userMissions
    .filter((userMission) => userMission.userId === user?.userId)
    .filter((userMission) => userMission.isCompleted === isCompleted)
    .slice((page - 1) * size, page * size)
    .map((userMission) => {
      const mission = missions.find((item) => item.missionId === userMission.missionId);

      return {
        missionId: userMission.missionId,
        storeId: userMission.storeId,
        point: mission?.point,
        dueDate: mission?.dueDate,
        isCompleted: userMission.isCompleted,
      };
    });

  res.json(result);
});

app.patch("/api/missions/:missionId/complete", (req: Request, res: Response) => {
  const user = getCurrentUser();
  const userMission = userMissions.find(
    (item) => item.missionId === req.params.missionId && item.userId === user?.userId,
  );

  if (!userMission) {
    res.status(404).json({ message: "도전 중인 미션이 아닙니다." });
    return;
  }

  userMission.isCompleted = 1;
  res.json({ message: "미션 완료 처리 성공" });
});

app.post("/api/v1/users/signup", handleUserSignUp);

// 4. 서버 시작
app.listen(port, () => {
  console.log(`[server]: Server is running at <http://localhost>:${port}`);
});
