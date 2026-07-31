export class CreateMonitorDto {
  name!: string;
  type!: 'http' | 'tcp' | 'ping';
  url!: string;
  interval!: number;
}