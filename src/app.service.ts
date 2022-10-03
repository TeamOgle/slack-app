import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  checkServer(): string {
    return 'server is on...';
  }
}
