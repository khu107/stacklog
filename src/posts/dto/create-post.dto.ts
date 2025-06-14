import {
  IsString,
  IsOptional,
  IsEnum,
  IsBoolean,
  IsArray,
  MaxLength,
  MinLength,
} from 'class-validator';
import { PostStatus } from '../entity/post.entity';

export class CreatePostDto {
  @IsString()
  @MinLength(1, { message: '제목을 입력해주세요.' })
  @MaxLength(255, { message: '제목은 255자를 초과할 수 없습니다.' })
  title: string;

  @IsString()
  @MinLength(1, { message: '내용을 입력해주세요.' })
  content: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '요약은 500자를 초과할 수 없습니다.' })
  summary?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: '썸네일 URL은 500자를 초과할 수 없습니다.' })
  thumbnail?: string;

  @IsOptional()
  @IsEnum(PostStatus, { message: '올바른 상태를 선택해주세요.' })
  status?: PostStatus;

  @IsOptional()
  @IsBoolean()
  isPrivate?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true, message: '태그는 문자열이어야 합니다.' })
  tags?: string[];
}
