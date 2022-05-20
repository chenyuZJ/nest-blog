import { compareSync } from 'bcryptjs';
import { User } from './entities/user.entity';
import {
  Injectable,
  HttpException,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm';
import { WechatUserInfo } from '../auth/auth.interface';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 用户注册
  async register(createUser: CreateUserDto) {
    const newUser = await this.userRepository.create(createUser);
    return await this.userRepository.save(newUser);
  }

  async registerByWechat(userInfo: WechatUserInfo) {
    const { nickname, openid, headimgurl } = userInfo;
    const newUser = await this.userRepository.create({
      nickname,
      openid,
      avatar: headimgurl,
    });
    return await this.userRepository.save(newUser);
  }

  async findOne(id: string) {
    return await this.userRepository.findOne(id);
  }

  async findUser(username: string) {
    return await this.userRepository.findOne({
      where: { username },
    });
  }

  async findByOpenid(openid: string) {
    return await this.userRepository.findOne({ where: { openid } });
  }

  async update(updateUserDto: UpdateUserDto) {
    const { id } = updateUserDto;
    if (!id) throw new HttpException('id必须填写', HttpStatus.BAD_REQUEST);
    const user = await this.userRepository.findOne(id);
    if (!user) throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    delete updateUserDto.id;
    const updateObj = await this.userRepository.merge(user, updateUserDto);
    (await this.userRepository.save(updateObj)).id;
    return updateObj;
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne(id);
    if (!user) throw new HttpException('用户不存在', HttpStatus.BAD_REQUEST);
    await this.userRepository.remove(user);
    return new HttpException('操作成功', HttpStatus.BAD_REQUEST);
  }

  comparePassword(password, libPassword) {
    return compareSync(password, libPassword);
  }
}
