import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateProfileBasicDto {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  displayName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  bio?: string;
}
