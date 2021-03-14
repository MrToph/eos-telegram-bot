import { QueryRunner, MigrationInterface } from 'typeorm'
import Config from '../entity/Config'
import { logger } from '../logger'

export class Init1572422782865 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<any> {
        let config = new Config()
        config.id = 0
        config.lastCommittedBlockNumber = 0

        await queryRunner.manager.save(config)
        logger.info(`Init1572422782865 migrated`)
    }

    public async down(): Promise<any> {}
}
