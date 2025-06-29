import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entity/user.entity';
import { UpdateProfileIdnameDto } from './dto/update-profile-idname.dto';
import { UserResponseDto } from './dto/user-response.dto';
import { UpdateProfileSocialDto } from './dto/update-profile-social.dto';
import { UpdateProfileBasicDto } from './dto/update-profile-basic.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  // 임시 테스트를 위해 나중에 관리자로 전환
  async findAll() {
    return this.userRepository.find({
      select: ['id', 'displayName', 'idname', 'avatarUrl', 'bio'],
    });
  }
  // 내 프로필 조회
  async getMyProfile(userId: number) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      idname: user.idname,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      status: user.status,
      github: user.github,
      linkedin: user.linkedin,
      website: user.website,
      emailVerified: user.emailVerified,
    };
  }

  async getUserProfile(idname: string) {
    const user = await this.userRepository.findOne({
      where: { idname },
      select: [
        'id',
        'displayName',
        'idname',
        'avatarUrl',
        'bio',
        'github',
        'linkedin',
        'website',
      ],
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    return user;
  }
  // 기본 정보 수정
  async updateBasicProfile(
    userId: number,
    updateProfileBasicDto: UpdateProfileBasicDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 업데이트할 필드만 적용
    if (updateProfileBasicDto.displayName !== undefined) {
      user.displayName = updateProfileBasicDto.displayName;
    }
    if (updateProfileBasicDto.bio !== undefined) {
      user.bio = updateProfileBasicDto.bio;
    }

    await this.userRepository.save(user);
    return this.getMyProfile(userId);
  }

  // 소셜 링크 수정
  async updateSocialProfile(
    userId: number,
    updateProfileSocialDto: UpdateProfileSocialDto,
  ): Promise<UserResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 업데이트할 필드만 적용
    if (updateProfileSocialDto.github !== undefined) {
      user.github = updateProfileSocialDto.github;
    }
    if (updateProfileSocialDto.linkedin !== undefined) {
      user.linkedin = updateProfileSocialDto.linkedin;
    }
    if (updateProfileSocialDto.website !== undefined) {
      user.website = updateProfileSocialDto.website;
    }

    await this.userRepository.save(user);
    return this.getMyProfile(userId);
  }

  // idname 수정
  async updateIdname(
    userId: number,
    updateProfileIdnameDto: UpdateProfileIdnameDto,
  ) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    // 현재 idname과 같으면 그냥 리턴
    if (user.idname === updateProfileIdnameDto.idname) {
      return this.getMyProfile(userId);
    }

    // idname 중복 체크
    const isAvailable = await this.checkIdnameAvailable(
      updateProfileIdnameDto.idname,
    );
    if (!isAvailable) {
      throw new BadRequestException('이미 사용 중인 ID입니다');
    }

    user.idname = updateProfileIdnameDto.idname;
    await this.userRepository.save(user);
    return this.getMyProfile(userId);
  }

  // 기존 메서드들
  async checkIdnameAvailable(idname: string): Promise<boolean> {
    const user = await this.userRepository.findOne({ where: { idname } });
    return !user;
  }

  //  계정 탈퇴
  async deleteAccount(userId: number): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    await this.userRepository.remove(user);
    console.log(`계정 삭제 완료: userId=${userId}`);
  }

  // 아바타 업데이트
  async updateAvatar(userId: number, avatarUrl: string | null): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('사용자를 찾을 수 없습니다');
    }

    if (avatarUrl === null) {
      user.avatarUrl = undefined as any;
    } else {
      user.avatarUrl = avatarUrl;
    }

    await this.userRepository.save(user);
  }

  findOne(id: number) {
    return this.userRepository.findOne({
      where: { id: +id },
      relations: ['socialAuth'],
    });
  }
}
