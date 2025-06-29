import { IsOptional, IsString, IsIn } from 'class-validator';
import { PagePaginationDto } from '../../common/dto/page-pagination.dto';

export class SearchPostDto extends PagePaginationDto {
  @IsOptional()
  @IsString()
  q?: string;
}
