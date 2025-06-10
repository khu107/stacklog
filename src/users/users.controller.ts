import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Req,
  UseGuards,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';

import { FileInterceptor } from '@nestjs/platform-express';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateProfileSocialDto } from './dto/update-profile-social.dto';
import { UpdateProfileBasicDto } from './dto/update-profile-basic.dto';
import { UpdateProfileIdnameDto } from './dto/update-profile-idname.dto';
import { UploadService } from '../upload/upload.service';

@Controller('users')
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly uploadService: UploadService,
  ) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getMyProfile(@Req() req): Promise<UserResponseDto> {
    return this.usersService.getMyProfile(req.user?.sub);
  }

  //  기본 정보 수정 (displayName, bio)
  @Patch('me/basic')
  @UseGuards(JwtAuthGuard)
  async updateBasicProfile(
    @Req() req,
    @Body() updateProfileBasicDto: UpdateProfileBasicDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateBasicProfile(
      req.user?.sub,
      updateProfileBasicDto,
    );
  }

  //  소셜 링크 수정 (github, linkedin, website)
  @Patch('me/social')
  @UseGuards(JwtAuthGuard)
  async updateSocialProfile(
    @Req() req,
    @Body() updateProfileSocialDto: UpdateProfileSocialDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateSocialProfile(
      req.user?.sub,
      updateProfileSocialDto,
    );
  }

  @Patch('me/idname')
  @UseGuards(JwtAuthGuard)
  async updateIdname(
    @Req() req,
    @Body() updateProfileIdnameDto: UpdateProfileIdnameDto,
  ): Promise<UserResponseDto> {
    return this.usersService.updateIdname(
      req.user?.sub,
      updateProfileIdnameDto,
    );
  }

  @Post('me/avatar')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FileInterceptor('avatar'))
  async uploadAvatar(@Req() req, @UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('파일을 선택해주세요.');
    }

    try {
      // temp에서 avatar로 이동
      const avatarFilename = this.uploadService.moveToAvatar(file.filename);

      // 아바타 URL 생성
      const avatarUrl = this.uploadService.getAvatarUrl(avatarFilename);

      // DB에 아바타 URL 저장 (UsersService에 메서드 필요)
      await this.usersService.updateAvatar(req.user?.sub, avatarUrl);

      return {
        message: '아바타가 성공적으로 업로드되었습니다.',
        avatarUrl,
      };
    } catch (error) {
      // 실패시 temp 파일 삭제
      this.uploadService.deleteFile(file.filename, 'temp');
      throw error;
    }
  }

  // idname 중복 체크
  @Get('check-idname/:idname')
  async checkIdnameAvailable(@Param('idname') idname: string) {
    const isAvailable = await this.usersService.checkIdnameAvailable(idname);

    return {
      idname,
      isAvailable,
      message: isAvailable ? '사용 가능한 ID입니다' : '이미 사용 중인 ID입니다',
    };
  }

  @Delete('me/avatar')
  @UseGuards(JwtAuthGuard)
  async deleteAvatar(@Req() req) {
    try {
      console.log('🗑️ 아바타 삭제 시작:', req.user?.sub);

      // 현재 사용자 정보 조회
      const user = await this.usersService.findOne(req.user?.sub);
      if (!user) {
        throw new NotFoundException('사용자를 찾을 수 없습니다.');
      }

      console.log('📄 기존 avatarUrl:', user.avatarUrl);

      // 기존 아바타가 있다면 파일 삭제
      if (user.avatarUrl) {
        const filename = user.avatarUrl.split('/').pop();
        if (filename) {
          console.log('🗂️ 파일 삭제:', filename);
          this.uploadService.deleteFile(filename, 'avatar');
        }
      }

      // DB에서 아바타 URL 제거
      console.log('💾 DB 업데이트 시작');
      await this.usersService.updateAvatar(req.user?.sub, null);
      console.log('✅ DB 업데이트 완료');

      return {
        message: '아바타가 성공적으로 삭제되었습니다.',
        avatarUrl: null,
      };
    } catch (error) {
      console.error('❌ 아바타 삭제 실패:', error);
      throw error;
    }
  }
  @Delete('me')
  @UseGuards(JwtAuthGuard)
  async deleteAccount(@Req() req, @Res() res): Promise<void> {
    await this.usersService.deleteAccount(req.user?.sub);

    // 🍪 쿠키 삭제
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');

    console.log('✅ 계정 삭제 및 쿠키 정리 완료');

    res.json({ message: '계정이 성공적으로 삭제되었습니다' });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
