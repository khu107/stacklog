import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-github2';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class GithubStrategy extends PassportStrategy(Strategy, 'github') {
  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('GITHUB_CLIENT_ID') || '',
      clientSecret: configService.get<string>('GITHUB_CLIENT_SECRET') || '',
      callbackURL: 'http://localhost:3000/auth/github/callback',
      scope: ['user:email'], // 이메일 접근 권한
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: (error: any, user?: any) => void,
  ): Promise<void> {
    console.log('🐙 깃허브 프로필:', profile);

    // 깃허브 응답 구조
    const { id, username, displayName, emails, photos } = profile;

    // 이메일이 없는 경우 처리 (깃허브에서 이메일을 비공개로 설정한 경우)
    const email = emails?.[0]?.value || `${username}@github.local`;

    try {
      const result = await this.authService.githubLogin({
        providerId: id,
        email: email,
        displayName: displayName || username,
        avatarUrl: photos?.[0]?.value,
      });

      done(null, result);
    } catch (error) {
      console.error('❌ 깃허브 로그인 에러:', error);
      done(error, false);
    }
  }
}
