import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateProfileSocialDto {
  @IsOptional()
  @IsString()
  github?: string;

  @IsOptional()
  @IsString()
  linkedin?: string;

  @IsOptional()
  @IsUrl()
  website?: string;
}
