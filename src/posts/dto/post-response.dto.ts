import { PostStatus } from '../entity/post.entity';

export class PostResponseDto {
  id: string;
  title: string;
  content: string;
  summary?: string;
  slug: string;
  thumbnail?: string;
  status: PostStatus;
  isPrivate: boolean;
  tags: string[];
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  author: {
    id: string;
    username: string;
    displayName: string;
  };
}
