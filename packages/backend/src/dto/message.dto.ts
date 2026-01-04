import { IsEnum, IsOptional, IsString, IsNumber } from 'class-validator';

export class MessageDto {
  @IsEnum(['text', 'link', 'image', 'file'])
  type: 'text' | 'link' | 'image' | 'file';

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  url?: string;

  @IsOptional()
  @IsString()
  filename?: string;

  @IsOptional()
  @IsNumber()
  fileSize?: number;
}

export class LoginDto {
  @IsString()
  password: string;
}
