// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
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
import { GithubAuthGuard } from './guards/github-auth.guard';

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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (result.needsProfileSetup) {
      res.redirect(`http://localhost:3001/auth/callback?needsSetup=true`);
    } else {
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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (result.needsProfileSetup) {
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=true&provider=naver`,
      );
    } else {
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=false&provider=naver`,
      );
    }
  }

  @Get('github')
  @UseGuards(GithubAuthGuard)
  async githubAuth(@Request() req) {
    // Guard에서 자동으로 GitHub로 리다이렉트됨
  }

  @Get('github/callback')
  @UseGuards(GithubAuthGuard)
  async githubAuthRedirect(@Request() req, @Res() res: Response) {
    const result = req.user;

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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    if (result.needsProfileSetup) {
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=true&provider=github`,
      );
    } else {
      res.redirect(
        `http://localhost:3001/auth/callback?needsSetup=false&provider=github`,
      );
    }
  }

  // 프로필 설정 완료
  @UseGuards(JwtAuthGuard)
  @Post('complete-profile')
  async completeProfile(
    @Request() req,
    @Body() body: any,
    @Res() res: Response,
  ) {
    const { idname, bio } = body;
    const userId = req.user.sub;

    const result = await this.authService.completeProfile(userId, idname, bio);

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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json(result);
  }

  @Post('refresh')
  async refreshToken(@Request() req, @Res() res: Response) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token이 없습니다');
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

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
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({ success: true });
  }

  @Post('logout')
  async logout(@Res() res: Response) {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });
    return res.json({ success: true });
  }
}
