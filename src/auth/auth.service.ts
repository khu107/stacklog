// src/auth/auth.service.ts
import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User, UserStatus } from '../users/entity/user.entity';
import { SocialAuth, SocialProvider } from './entity/social-auth.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(SocialAuth)
    private socialAuthRepository: Repository<SocialAuth>,
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  // JWT 토큰 생성
  generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      idname: user.idname,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
    };

    return {
      accessToken: this.jwtService.sign(payload, { expiresIn: '15m' }),
      refreshToken: this.jwtService.sign(payload, { expiresIn: '30d' }),
    };
  }

  // 구글 로그인 처리 (JWT 토큰 포함)
  async googleLogin(googleData: {
    providerId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    // 기존 구글 사용자 찾기 (provider + providerId로 중복 방지)
    const existingSocial = await this.socialAuthRepository.findOne({
      where: {
        provider: SocialProvider.GOOGLE,
        providerId: googleData.providerId,
      },
      relations: ['user'],
    });

    if (existingSocial) {
      // 기존 사용자 - 구글 정보 업데이트
      await this.userRepository.update(existingSocial.userId, {
        email: googleData.email,
        displayName: googleData.displayName,
        avatarUrl: googleData.avatarUrl || existingSocial.user.avatarUrl,
      });

      // UsersService 사용
      const updatedUser = await this.usersService.findOne(
        existingSocial.userId,
      );

      if (!updatedUser) {
        throw new NotFoundException('사용자 정보를 찾을 수 없습니다');
      }

      // JWT 토큰 생성
      const tokens = this.generateTokens(updatedUser);

      return {
        user: updatedUser,
        isNewUser: false,
        needsProfileSetup: updatedUser.status === UserStatus.PENDING,
        ...tokens,
      };
    }

    // 새 사용자 생성 (PENDING 상태)
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, {
        email: googleData.email,
        displayName: googleData.displayName,
        avatarUrl: googleData.avatarUrl,
        status: UserStatus.PENDING,
        emailVerified: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      const socialAuth = queryRunner.manager.create(SocialAuth, {
        userId: savedUser.id,
        provider: SocialProvider.GOOGLE,
        providerId: googleData.providerId,
        providerEmail: googleData.email,
      });
      await queryRunner.manager.save(socialAuth);

      await queryRunner.commitTransaction();

      // JWT 토큰 생성
      const tokens = this.generateTokens(savedUser);

      return {
        user: savedUser,
        isNewUser: true,
        needsProfileSetup: savedUser.status === UserStatus.PENDING,
        ...tokens,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // 🆕 네이버 로그인 처리 (구글 로직과 동일)
  async naverLogin(naverData: {
    providerId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    // 기존 네이버 사용자 찾기 (provider + providerId로 중복 방지)
    const existingSocial = await this.socialAuthRepository.findOne({
      where: {
        provider: SocialProvider.NAVER,
        providerId: naverData.providerId,
      },
      relations: ['user'],
    });

    if (existingSocial) {
      // 기존 사용자 - 네이버 정보 업데이트
      await this.userRepository.update(existingSocial.userId, {
        email: naverData.email,
        displayName: naverData.displayName,
        avatarUrl: naverData.avatarUrl || existingSocial.user.avatarUrl,
      });

      // UsersService 사용
      const updatedUser = await this.usersService.findOne(
        existingSocial.userId,
      );

      if (!updatedUser) {
        throw new NotFoundException('사용자 정보를 찾을 수 없습니다');
      }

      // JWT 토큰 생성
      const tokens = this.generateTokens(updatedUser);

      return {
        user: updatedUser,
        isNewUser: false,
        needsProfileSetup: updatedUser.status === UserStatus.PENDING,
        ...tokens,
      };
    }

    // 새 사용자 생성 (PENDING 상태)
    const queryRunner =
      this.userRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const user = queryRunner.manager.create(User, {
        email: naverData.email,
        displayName: naverData.displayName,
        avatarUrl: naverData.avatarUrl,
        status: UserStatus.PENDING,
        emailVerified: true,
      });
      const savedUser = await queryRunner.manager.save(user);

      const socialAuth = queryRunner.manager.create(SocialAuth, {
        userId: savedUser.id,
        provider: SocialProvider.NAVER,
        providerId: naverData.providerId,
        providerEmail: naverData.email,
      });
      await queryRunner.manager.save(socialAuth);

      await queryRunner.commitTransaction();

      // JWT 토큰 생성
      const tokens = this.generateTokens(savedUser);

      return {
        user: savedUser,
        isNewUser: true,
        needsProfileSetup: savedUser.status === UserStatus.PENDING,
        ...tokens,
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
  // 프로필 설정 완료 (JWT 토큰 재발급)
  async completeProfile(userId: number, idname: string, bio?: string) {
    // UsersService 사용
    const user = await this.usersService.findOne(userId);

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // idname 중복 체크
    const existingUser = await this.userRepository.findOne({
      where: { idname },
    });

    if (existingUser) {
      throw new ConflictException('이미 사용 중인 사용자 ID입니다');
    }

    // 프로필 완성
    await this.userRepository.update(userId, {
      idname,
      bio,
      status: UserStatus.ACTIVE,
    });

    // UsersService 사용
    const updatedUser = await this.usersService.findOne(userId);

    if (!updatedUser) {
      throw new NotFoundException('업데이트된 사용자 정보를 찾을 수 없습니다');
    }

    // JWT 토큰 재발급 (idname이 추가되었으므로)
    const tokens = this.generateTokens(updatedUser);

    return {
      user: updatedUser,
      ...tokens,
    };
  }
  // auth.service.ts
  async refreshAccessToken(refreshToken: string) {
    try {
      // Refresh token 검증
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('사용자를 찾을 수 없습니다');
      }

      // 새로운 토큰 쌍 생성 (refresh token도 갱신)
      const tokens = this.generateTokens(user);

      return {
        user,
        ...tokens,
      };
    } catch (error) {
      throw new UnauthorizedException('Refresh token이 유효하지 않습니다');
    }
  }
}
