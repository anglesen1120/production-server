import { Injectable } from '@nestjs/common';
import { FindConditions, UpdateResult } from 'typeorm';
import { UserEntity } from '../models/user.entity';
import { UserRegisterDto } from '../../auth/dto/user-register.dto';
import { UserRepository } from '../repositories/user.repository';
import { UsersPageOptionsDto } from '../dto/users-page-options.dto';
import { PageMetaDto } from '../../../common/dto/page-meta.dto';
import { UsersPageDto } from '../dto/users-page.dto';
import { UserAuthRepository } from '../repositories/user-auth.repository';
import { UserSalaryRepository } from '../repositories/user-salary.repository';
import { format } from 'date-fns';
import { UserAuthEntity } from '../models/user-auth.entity';
import { UserSalaryEntity } from '../models/user-salary.entity';

@Injectable()
export class UserService {
    constructor(
        public readonly userRepository: UserRepository,
        public readonly userAuthRepository: UserAuthRepository,
        public readonly userSalaryRepository: UserSalaryRepository,
    ) {}

    findUser(findData: FindConditions<UserEntity>): Promise<UserEntity> {
        return this.userRepository.findOne(findData);
    }

    async createUser(
        userRegisterDto: UserRegisterDto,
    ): Promise<[UserEntity, UserAuthEntity, UserSalaryEntity]> {
        const user = this.userRepository.create(userRegisterDto);
        await this.userRepository.save(user);

        const createdUser = {
            ...userRegisterDto,
            user,
        };
        const userAuth = this.userAuthRepository.create(createdUser);
        const userSalary = this.userSalaryRepository.create(createdUser);

        await Promise.all([
            this.userAuthRepository.save(userAuth),
            this.userSalaryRepository.save(userSalary),
        ]);

        return [user, userAuth, userSalary];
    }

    async getUsers(pageOptionsDto: UsersPageOptionsDto): Promise<UsersPageDto> {
        const queryBuilder = this.userRepository.createQueryBuilder('user');
        const [users, usersCount] = await queryBuilder
            .leftJoinAndSelect('user.userAuth', 'userAuth')
            .leftJoinAndSelect('user.userSalary', 'userSalary')
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take)
            .getManyAndCount();

        const pageMetaDto = new PageMetaDto({
            pageOptionsDto,
            itemCount: usersCount,
        });

        return new UsersPageDto(users.toDtos(), pageMetaDto);
    }

    async setLastLoginDate(user: UserEntity): Promise<UpdateResult> {
        const { id } = user;
        const today = new Date();

        const queryBuilder = await this.userRepository
            .createQueryBuilder('user')
            .update(UserEntity)
            .set({ lastLogin: format(today) })
            .where('id = :id', { id });

        return queryBuilder.execute();
    }

    async setLastLogoutDate(user: UserEntity): Promise<UpdateResult> {
        const { id } = user;
        const today = new Date();

        const queryBuilder = await this.userRepository
            .createQueryBuilder('user')
            .update(UserEntity)
            .set({ lastLogout: format(today) })
            .where('id = :id', { id });

        return queryBuilder.execute();
    }
}
