import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';

@Controller('posts')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createPostDto: CreatePostDto, @Request() req) {
    const userId = req.user?.id || req.user?.sub;

    return this.postsService.create(createPostDto, userId);
  }

  // 포스트 이미지 업로드 (임시 저장)
  @Post('upload-image')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('postImage'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일을 선택해주세요.');
    }

    // 임시 파일 정보 반환 (나중에 포스트 저장할 때 이동)
    return {
      filename: file.filename,
      url: `/temp/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
    };
  }

  @Get()
  findAll() {
    return this.postsService.findAll();
  }

  @Get('my-posts')
  @UseGuards(JwtAuthGuard)
  async getMyPosts(@Request() req) {
    const userId = req.user.sub;
    return this.postsService.findMyPosts(userId);
  }

  @Get('my-drafts')
  @UseGuards(JwtAuthGuard)
  async getMyDrafts(@Request() req) {
    const userId = req.user.sub;
    return this.postsService.findMyDrafts(userId);
  }

  @Get(':slug')
  async findOne(@Param('slug') slug: string, @Request() req) {
    const userId = req.user?.id || req.user?.sub;

    return this.postsService.findOne(slug, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string, @Request() req) {
    const userId = req.user?.id || req.user?.sub;

    if (!userId) {
      throw new BadRequestException('인증이 필요합니다.');
    }

    await this.postsService.remove(+id, userId);

    return {
      message: '포스트가 성공적으로 삭제되었습니다.',
      deletedId: +id,
    };
  }
}
