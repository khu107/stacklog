import {
  Entity,
  Column,
  CreateDateColumn,
  OneToOne,
  JoinColumn,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { User } from '../../users/entity/user.entity';

export enum SocialProvider {
  GOOGLE = 'google',
  GITHUB = 'github',
  KAKAO = 'kakao',
  NAVER = 'naver',
}

@Entity('social_auth')
export class SocialAuth {
  @PrimaryColumn({ name: 'user_id' })
  userId: number;

  @Column({
    type: 'enum',
    enum: SocialProvider,
  })
  provider: SocialProvider;

  @Column({ name: 'provider_id' })
  @Index()
  providerId: string; // 소셜에서 제공하는 고유 ID

  @Column({ name: 'provider_email' })
  providerEmail: string; // 소셜에서 가져온 원본 이메일

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToOne(() => User, (user) => user.socialAuth, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  // // 🔄 N:1 관계로 변경
  // @ManyToOne(() => User, (user) => user.socialAuths, { onDelete: 'CASCADE' })
  // @JoinColumn({ name: 'user_id' })
  // user: User;

  // provider + providerId 조합으로 고유성 보장 (중복 방지)
  @Index(['provider', 'providerId'], { unique: true })
  static providerIndex: any;
}
