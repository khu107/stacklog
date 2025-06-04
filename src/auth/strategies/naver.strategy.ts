// src/auth/strategies/naver.strategy.ts (수정 버전)
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-naver-v2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class NaverStrategy extends PassportStrategy(Strategy, 'naver') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('NAVER_CLIENT_ID') || '',
      clientSecret: configService.get<string>('NAVER_CLIENT_SECRET') || '',
      callbackURL: 'http://localhost:3000/auth/naver/callback',
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    console.log('🟢 네이버 프로필:', profile);

    // 🔧 네이버 응답 구조에 맞게 수정
    const { id, email, name, profile_image } = profile._json.response; // 🔧 .response 추가

    console.log('🔍 추출된 데이터:', {
      providerId: id,
      email: email,
      displayName: name,
      avatarUrl: profile_image,
    });

    try {
      const result = await this.authService.naverLogin({
        providerId: id,
        email: email,
        displayName: name,
        avatarUrl: profile_image,
      });

      done(null, result);
    } catch (error) {
      console.error('❌ 네이버 로그인 에러:', error);
      done(error, false);
    }
  }
}
