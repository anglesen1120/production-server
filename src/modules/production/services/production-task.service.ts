import { Injectable } from '@nestjs/common';
import { PageMetaDto } from 'common/dto/page-meta.dto';
import { ProductionTaskRepository } from '../repositories/production-task.repository';
import { ProductionTasksPageOptionsDto } from '../dto/production-tasks-page-options.dto';
import { ProductionTasksPageDto } from '../dto/production-tasks-page.dto';
import { UserEntity } from '../../user/models/user.entity';
import { FindConditions } from 'typeorm';
import { ProductionTaskEntity } from '../models/production-task.entity';
import { ProductionTaskDto } from '../dto/production-task.dto';

@Injectable()
export class ProductionTaskService {
    constructor(
        public readonly productionTaskRepository: ProductionTaskRepository,
    ) {}

    async getTask(
        user: FindConditions<UserEntity>,
    ): Promise<ProductionTaskEntity | undefined> {
        const { id } = user;
        const queryBuilder = this.productionTaskRepository.createQueryBuilder(
            'productionTask',
        );
        const productionTask = await queryBuilder
            .leftJoinAndSelect('productionTask.user', 'user')
            .leftJoinAndSelect('productionTask.master', 'master')
            .leftJoinAndSelect('productionTask.customer', 'customer')
            .leftJoinAndSelect(
                'productionTask.productionMachine',
                'productionMachine',
            )
            .where('user.id = :id', { id })
            .getOne();

        return productionTask ? productionTask.toDto() : undefined;
    }

    async getTasks(
        pageOptionsDto: ProductionTasksPageOptionsDto,
    ): Promise<ProductionTasksPageDto> {
        const queryBuilder = this.productionTaskRepository.createQueryBuilder(
            'productionTask',
        );
        const [productionTasks, productionTasksCount] = await queryBuilder
            .leftJoinAndSelect('productionTask.user', 'user')
            .leftJoinAndSelect('productionTask.master', 'master')
            .leftJoinAndSelect('productionTask.customer', 'customer')
            .leftJoinAndSelect(
                'productionTask.productionMachine',
                'productionMachine',
            )
            .skip(pageOptionsDto.skip)
            .take(pageOptionsDto.take)
            .getManyAndCount();

        const pageMetaDto = new PageMetaDto({
            pageOptionsDto,
            itemCount: productionTasksCount,
        });

        return new ProductionTasksPageDto(
            productionTasks.toDtos(),
            pageMetaDto,
        );
    }
}
