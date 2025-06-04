import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization Header
        (request) => request?.cookies?.accessToken, // 쿠키에서 추출
      ]),
      ignoreExpiration: false,
      secretOrKey:
        configService.get<string>('ACCESS_TOKEN_SECRET') || 'asdasdasdas',
    });
  }

  async validate(payload: any) {
    // JWT 토큰에서 사용자 ID 추출해서 실제 사용자 정보 조회
    const user = await this.usersService.findOne(payload.sub);

    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다');
    }

    // 이 값이 req.user에 들어감
    return user;
  }
}
