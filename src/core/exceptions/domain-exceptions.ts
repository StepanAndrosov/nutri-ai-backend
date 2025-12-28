import { DomainExceptionCode } from './domain-exception-codes';

export class Extension {
  constructor(
    public message: string,
    public key: string,
  ) {}
}

export class DomainException extends Error {
  message: string;
  code: DomainExceptionCode;
  extensions: Extension[];

  constructor(errorInfo: { code: DomainExceptionCode; message: string; extensions?: Extension[] }) {
    super(errorInfo.message);
    this.message = errorInfo.message;
    this.code = errorInfo.code;
    this.extensions = errorInfo.extensions || [];

    // Fix for TypeScript's inheritance from Error
    // Ensures instanceof checks work correctly
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}
