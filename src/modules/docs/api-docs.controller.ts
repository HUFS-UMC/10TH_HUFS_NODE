import {
  Body,
  Controller,
  Get,
  Header,
  Patch,
  Path,
  Post,
  Query,
  Response,
  Route,
  Security,
  SuccessResponse,
  Tags,
} from "tsoa";
import type { UserSignUpRequest } from "../users/dtos/user.dto.js";

export interface ErrorResponse {
  /** 실패 이유 */
  message: string;
}

export interface SignupResponse {
  result: {
    id: number;
    email: string;
    name: string;
    gender: string;
    birth: string;
    address?: string;
    detailAddress?: string;
    phoneNumber: string;
    preferences: PreferenceResponse[];
  };
}

export interface PreferenceResponse {
  id: number;
  name: string;
}

export interface HomeResponse {
  /** 현재 사용자의 보유 포인트 */
  myPoints: number;
  /** 추천 가게 이름 목록 */
  recommendedStores: string[];
}

export interface MyPageResponse {
  phoneNumber: string;
  points: number;
}

export interface StoreCreateRequest {
  /** 가게 이름 */
  name: string;
  /** 가게 주소 */
  address: string;
  /** 가게 카테고리 */
  category?: string;
  /** 가게 전화번호 */
  phoneNumber?: string;
}

export interface StoreResponse {
  storeId: number;
  regionId: number;
  name: string;
  address: string;
  category?: string;
  phoneNumber?: string;
}

export interface ReviewCreateRequest {
  /** 리뷰 내용 */
  contents?: string;
  /** 별점 */
  rating?: number;
}

export interface ReviewResponse {
  reviewId: number;
  storeId: number;
  userId?: number;
  storeName?: string;
  contents?: string;
  rating?: number;
  createdAt: string;
}

export interface MissionCreateRequest {
  /** 지급 포인트 */
  point: number;
  /** 마감일. 예시: 2026-05-31 */
  dueDate: string;
  /** 미션 내용 */
  description: string;
}

export interface MissionResponse {
  missionId: number;
  storeId: number;
  storeName?: string;
  point: number;
  dueDate: string;
  description: string;
  /** 0은 진행중, 1은 완료 */
  isCompleted: 0 | 1;
  challengedAt?: string;
}

export interface UserMissionResponse {
  userMissionId: number;
  missionId: number;
  storeId: number;
  userId: number;
  /** 0은 진행중, 1은 완료 */
  isCompleted: 0 | 1;
  challengedAt: string;
}

export interface CompleteMissionResponse {
  message: string;
  missionId: number;
  /** 0은 진행중, 1은 완료 */
  isCompleted: 0 | 1;
}

@Route("api")
export class ApiDocsController extends Controller {
  /**
   * 새로운 사용자를 가입시킵니다.
   * 가입 요청에는 Authorization 헤더가 필요하지 않습니다.
   */
  @Post("users/signup")
  @Tags("Users")
  @SuccessResponse("201", "회원가입 성공")
  @Response<ErrorResponse>("500", "이미 존재하는 이메일 등 서버에서 처리하지 못한 오류")
  public async signup(@Body() requestBody: UserSignUpRequest): Promise<SignupResponse> {
    return {} as SignupResponse;
  }

  /**
   * 워크북 호환용 v1 회원가입 API입니다.
   * 요청과 응답 형식은 /api/users/signup과 같습니다.
   */
  @Post("v1/users/signup")
  @Tags("Users")
  @SuccessResponse("201", "회원가입 성공")
  @Response<ErrorResponse>("500", "이미 존재하는 이메일 등 서버에서 처리하지 못한 오류")
  public async signupV1(@Body() requestBody: UserSignUpRequest): Promise<SignupResponse> {
    return {} as SignupResponse;
  }

  /**
   * 홈 화면에 보여줄 내 포인트와 추천 가게 목록을 조회합니다.
   * region 쿼리를 주면 해당 지역 이름을 포함한 가게만 추천합니다.
   */
  @Get("home")
  @Tags("Home")
  @Security("bearerAuth")
  public async getHome(
    @Header("Authorization") authorization?: string,
    @Query() region?: string,
  ): Promise<HomeResponse> {
    return {} as HomeResponse;
  }

  /**
   * 현재 로그인한 사용자의 마이페이지 정보를 조회합니다.
   */
  @Get("users/me")
  @Tags("Users")
  @Security("bearerAuth")
  @Response<ErrorResponse>("404", "존재하는 유저가 없습니다.")
  public async getMyPage(@Header("Authorization") authorization?: string): Promise<MyPageResponse> {
    return {} as MyPageResponse;
  }

  /**
   * 특정 지역에 새로운 가게를 추가합니다.
   */
  @Post("regions/{regionId}/stores")
  @Tags("Stores")
  @Security("bearerAuth")
  @SuccessResponse("201", "가게 추가 성공")
  @Response<ErrorResponse>("404", "존재하지 않는 지역입니다.")
  public async createStore(
    @Path() regionId: number,
    @Body() requestBody: StoreCreateRequest,
    @Header("Authorization") authorization?: string,
  ): Promise<StoreResponse> {
    return {} as StoreResponse;
  }

  /**
   * 특정 가게에 리뷰를 작성합니다.
   */
  @Post("stores/{storeId}/reviews")
  @Tags("Reviews")
  @Security("bearerAuth")
  @SuccessResponse("201", "리뷰 작성 성공")
  @Response<ErrorResponse>("404", "존재하지 않는 가게이거나 유저입니다.")
  public async createReview(
    @Path() storeId: number,
    @Body() requestBody: ReviewCreateRequest,
    @Header("Authorization") authorization?: string,
  ): Promise<ReviewResponse> {
    return {} as ReviewResponse;
  }

  /**
   * 현재 사용자가 작성한 리뷰 목록을 페이지 단위로 조회합니다.
   */
  @Get("users/me/reviews")
  @Tags("Reviews")
  @Security("bearerAuth")
  @Response<ErrorResponse>("404", "존재하는 유저가 없습니다.")
  public async getMyReviews(
    @Header("Authorization") authorization?: string,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<ReviewResponse[]> {
    return [];
  }

  /**
   * 특정 가게에 새로운 미션을 추가합니다.
   */
  @Post("stores/{storeId}/missions")
  @Tags("Missions")
  @Security("bearerAuth")
  @SuccessResponse("201", "미션 추가 성공")
  @Response<ErrorResponse>("404", "존재하지 않는 가게입니다.")
  public async createMission(
    @Path() storeId: number,
    @Body() requestBody: MissionCreateRequest,
    @Header("Authorization") authorization?: string,
  ): Promise<MissionResponse> {
    return {} as MissionResponse;
  }

  /**
   * 특정 가게에 등록된 미션 목록을 페이지 단위로 조회합니다.
   */
  @Get("stores/{storeId}/missions")
  @Tags("Missions")
  @Response<ErrorResponse>("404", "존재하지 않는 가게입니다.")
  public async getStoreMissions(
    @Path() storeId: number,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<MissionResponse[]> {
    return [];
  }

  /**
   * 현재 사용자가 특정 미션에 도전합니다.
   * 이미 도전 중인 미션이면 409를 반환합니다.
   */
  @Post("missions/{missionId}/challenge")
  @Tags("Missions")
  @Security("bearerAuth")
  @SuccessResponse("201", "미션 도전 성공")
  @Response<ErrorResponse>("404", "존재하지 않는 미션이거나 유저입니다.")
  @Response<ErrorResponse>("409", "이미 도전 중인 미션입니다.")
  public async challengeMission(
    @Path() missionId: number,
    @Header("Authorization") authorization?: string,
  ): Promise<UserMissionResponse> {
    return {} as UserMissionResponse;
  }

  /**
   * 현재 사용자의 진행중 또는 완료 미션 목록을 조회합니다.
   * isCompleted는 0 또는 1만 사용할 수 있습니다.
   */
  @Get("users/me/missions")
  @Tags("Missions")
  @Security("bearerAuth")
  @Response<ErrorResponse>("400", "isCompleted는 0 또는 1이어야 합니다.")
  @Response<ErrorResponse>("404", "존재하는 유저가 없습니다.")
  public async getMyMissions(
    @Query() isCompleted: 0 | 1,
    @Header("Authorization") authorization?: string,
    @Query() page = 1,
    @Query() size = 10,
  ): Promise<MissionResponse[]> {
    return [];
  }

  /**
   * 현재 사용자가 도전 중인 미션을 완료 처리합니다.
   */
  @Patch("missions/{missionId}/complete")
  @Tags("Missions")
  @Security("bearerAuth")
  @Response<ErrorResponse>("404", "도전 중인 미션이 아닙니다.")
  public async completeMission(
    @Path() missionId: number,
    @Header("Authorization") authorization?: string,
  ): Promise<CompleteMissionResponse> {
    return {} as CompleteMissionResponse;
  }
}
