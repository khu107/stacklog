import { SocialAuth } from 'src/auth/entity/social-auth.entity';
import { BaseTable } from 'src/common/entity/base-table.entity';
import { Post } from 'src/posts/entity/post.entity';
import {
  Column,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

export enum UserStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
}

@Entity('users')
export class User extends BaseTable {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  email: string;

  @Column({ name: 'display_name' })
  displayName: string;

  @Column({ unique: true, nullable: true })
  @Index()
  idname: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({
    type: 'enum',
    enum: UserStatus,
    default: UserStatus.PENDING,
  })
  status: UserStatus;

  @Column({ name: 'email_verified', default: true })
  emailVerified: boolean;

  @Column({ nullable: true })
  github: string;

  @Column({ nullable: true })
  linkedin: string;

  @Column({ nullable: true })
  website: string;

  // 1:1 관계
  @OneToOne(() => SocialAuth, (socialAuth) => socialAuth.user, {
    cascade: true,
  })
  socialAuth: SocialAuth;

  @OneToMany(() => Post, (post) => post.author)
  posts: Post[];
}
