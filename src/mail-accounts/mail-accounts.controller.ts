
import { Controller, Get, Post, Delete, Body, Param, Query, ParseIntPipe, UseGuards, Req } from '@nestjs/common';
import { MailAccountsService } from './mail-accounts.service';
import { ConnectMailAccountDto } from './dto/connect-account.dto';


@Controller('mail')
// @UseGuards(JwtAuthGuard)
export class MailAccountsController {
  constructor(private readonly mailService: MailAccountsService) {}

  @Post('accounts')
  connect(@Req() req, @Body() dto: ConnectMailAccountDto) {
    return this.mailService.connectAccount(req.user.id, dto);
  }

  @Get('accounts')
  getAccounts(@Req() req) {
    return this.mailService.getAccounts(req.user.id);
  }

  @Delete('accounts/:id')
  deleteAccount(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.mailService.deleteAccount(req.user.id, id);
  }

  @Get('accounts/:accountId/messages')
  getMessages(
    @Req() req,
    @Param('accountId', ParseIntPipe) accountId: number,
    @Query('page', ParseIntPipe) page = 1,
  ) {
    return this.mailService.getMessages(req.user.id, accountId, page);
  }

  @Get('messages/:id')
  getMessage(@Req() req, @Param('id', ParseIntPipe) id: number) {
    return this.mailService.getMessage(req.user.id, id);
  }

  @Post('messages/:id/reply')
  reply(@Req() req, @Param('id', ParseIntPipe) id: number, @Body('text') text: string) {
    return this.mailService.replyToMessage(req.user.id, id, text);
  }
}