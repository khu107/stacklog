// src/auth/guards/jwt-auth.guard.ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  // 추가 커스터마이징이 필요하면 여기에 구현
  // 기본적으로는 passport-jwt 전략을 사용
}
