import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TokenMiddleware implements NestMiddleware {
  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  use(req: any, res: Response, next: NextFunction) {
    try {
      // 1. 헤더에서 토큰 추출 (Bearer 토큰)
      let token = this.extractTokenFromHeader(req);

      // 2. 헤더에 없으면 쿠키에서 추출
      if (!token) {
        token = this.extractTokenFromCookies(req);
      }

      if (token) {
        try {
          // 3. 토큰 검증
          const payload = this.jwtService.verify(token, {
            secret: this.configService.get<string>('ACCESS_TOKEN_SECRET'),
          });

          // 4. 사용자 정보를 req 객체에 추가
          req.user = {
            sub: payload.sub,
            email: payload.email,
            idname: payload.idname,
            displayName: payload.displayName,
            avatarUrl: payload.avatarUrl,
            bio: payload.bio,
            iat: payload.iat,
            exp: payload.exp,
          };

          console.log('🔐 Token 미들웨어 - 인증 성공:', {
            userId: payload.sub,
            email: payload.email,
            idname: payload.idname,
          });
        } catch (jwtError) {
          if (jwtError.name === 'TokenExpiredError') {
            console.log('⏰ 토큰 만료됨 (공개 API에서는 무시)');
          } else {
            // 다른 JWT 오류는 로그 출력
            console.log('⚠️ Token 미들웨어 - JWT 검증 실패:', jwtError.message);
          }
        }
      } else {
        console.log('ℹ️ Token 미들웨어 - 토큰 없음');
      }
    } catch (error) {
      console.error('❌ Token 미들웨어 오류:', error);
    }

    next();
  }

  private extractTokenFromHeader(request: any): string | undefined {
    const authHeader = request.headers.authorization;
    if (!authHeader) return undefined;

    const [type, token] = authHeader.split(' ');
    return type === 'Bearer' ? token : undefined;
  }

  private extractTokenFromCookies(request: any): string | undefined {
    return request.cookies?.accessToken;
  }
}
