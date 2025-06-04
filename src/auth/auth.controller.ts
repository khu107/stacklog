// src/auth/auth.controller.ts (리팩토링 후)
import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  UseGuards,
  Request,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { NaverAuthGuard } from './guards/naver-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // Google OAuth 로그인 시작
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  async googleAuth(@Request() req) {
    // Guard에서 자동으로 Google로 리다이렉트됨
  }

  // Google OAuth 콜백
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  async googleAuthRedirect(@Request() req, @Res() res: Response) {
    const result = req.user;

    console.log('🔑 Google OAuth 콜백 결과:', {
      email: result.user?.email,
      isNewUser: result.isNewUser,
      needsProfileSetup: result.needsProfileSetup,
      userStatus: result.user?.status,
    });

    // 🔧 개발 환경용 쿠키 설정
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/', // 🆕 경로 설정
    };

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    console.log('🍪 쿠키 설정 완료');

    if (result.needsProfileSetup) {
      console.log('👤 프로필 설정 필요 → 콜백으로 리다이렉트');
      res.redirect(`http://localhost:3001/auth/callback?needsSetup=true`);
    } else {
      console.log('✅ 프로필 완료 → 홈으로 리다이렉트');
      res.redirect(`http://localhost:3001/auth/callback?needsSetup=false`);
    }
  }

  @Get('naver')
  @UseGuards(NaverAuthGuard)
  async naverAuth(@Request() req) {
    // Guard에서 자동으로 네이버로 리다이렉트됨
  }

  @Get('naver/callback')
  @UseGuards(NaverAuthGuard)
  async naverAuthRedirect(@Request() req, @Res() res: Response) {
    const result = req.user;

    console.log('🟢 네이버 OAuth 콜백 결과:', {
      email: result.user?.email,
      isNewUser: result.isNewUser,
      needsProfileSetup: result.needsProfileSetup,
      userStatus: result.user?.status,
    });

    // 쿠키 설정 (구글과 동일)
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15분
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30일
    });

    console.log('🍪 네이버 쿠키 설정 완료');

    if (result.needsProfileSetup) {
      console.log('👤 프로필 설정 필요 → 콜백으로 리다이렉트');
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=true&provider=naver`,
      );
    } else {
      console.log('✅ 프로필 완료 → 홈으로 리다이렉트');
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=false&provider=naver`,
      );
    }
  }

  // 프로필 설정 완료
  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  async completeProfile(@Request() req, @Body() body: any) {
    const { idname, bio } = body;
    const userId = req.user.id;

    const result = await this.authService.completeProfile(userId, idname, bio);

    return result;
  }

  @Post('refresh')
  async refreshToken(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token이 없습니다');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // 새 Access Token을 쿠키로 설정
    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
    };

    res.cookie('accessToken', result.accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie('refreshToken', result.refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ 토큰 갱신 완료');
    return { success: true };
  }
}
