import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  canActivate(context: ExecutionContext) {
    const request = context.switchToHttp().getRequest<Request>();

    // 🔄 미들웨어에서 이미 user 정보가 설정되었는지 확인
    if (request.user) {
      console.log('✅ JWT Guard - 미들웨어에서 인증 완료됨');
      return true;
    }

    console.log('⚠️ JWT Guard - Passport 전략 실행 중...');
    return super.canActivate(context);
  }

  handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
    if (err || !user) {
      console.log('❌ JWT Guard - 인증 실패:', info?.message || err?.message);
      throw new UnauthorizedException('인증이 필요합니다');
    }

    console.log('✅ JWT Guard - 인증 성공:', {
      userId: user.sub,
      email: user.email,
    });
    return user;
  }
}
