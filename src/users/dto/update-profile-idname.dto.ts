import { IsString, Matches, MinLength, MaxLength } from 'class-validator';

export class UpdateProfileIdnameDto {
  @IsString()
  @MinLength(3)
  @MaxLength(20)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'idname은 영문, 숫자, _, - 만 사용 가능합니다',
  })
  idname: string;
}
