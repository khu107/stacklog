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
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { UpdateProfileSocialDto } from './dto/update-profile-social.dto';
import { UpdateProfileBasicDto } from './dto/update-profile-basic.dto';
import { UpdateProfileIdnameDto } from './dto/update-profile-idname.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

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
