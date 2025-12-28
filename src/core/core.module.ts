import { Global, Module } from '@nestjs/common';
import { APP_FILTER } from '@nestjs/core';
import { DomainHttpExceptionsFilter } from './exceptions/filters/domain-exceptions.filter';
import { AllHttpExceptionsFilter } from './exceptions/filters/all-exceptions.filter';

//глобальный модуль для провайдеров и модулей необходимых во всех частях приложения (например LoggerService, CqrsModule, etc...)
@Global()
@Module({
  // exports: [GlobalLogerService],
  providers: [
    // Register exception filters globally
    // Order matters: specific filters first, then catch-all filter
    {
      provide: APP_FILTER,
      useClass: DomainHttpExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: AllHttpExceptionsFilter,
    },
  ],
})
export class CoreModule {}
