import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

interface LiqPayParams {
  action:      string;
  amount:      number;
  currency:    string;
  description: string;
  order_id:    string;
  version:     number;
  result_url?: string;
  server_url?: string;
  [key: string]: any;
}

@Injectable()
export class LiqPayService {
  private readonly publicKey:  string;
  private readonly privateKey: string;
  private readonly serverUrl:  string;
  private readonly resultUrl:  string;

  constructor(private readonly config: ConfigService) {
    this.publicKey  = config.get('LIQPAY_PUBLIC_KEY');
    this.privateKey = config.get('LIQPAY_PRIVATE_KEY');
    this.serverUrl  = config.get('LIQPAY_SERVER_URL',  'http://localhost:3000/payments/callback');
    this.resultUrl  = config.get('LIQPAY_RESULT_URL',  'http://localhost:3001/payment/result');
  }

  createPaymentForm(params: {
    orderId:     string;
    amount:      number;
    description: string;
    courseId:    string;
    userId:      string;
  }): { data: string; signature: string; action: string } {
    const payload: LiqPayParams = {
      version:     3,
      public_key:  this.publicKey,
      action:      'pay',
      amount:      params.amount,
      currency:    'UAH',
      description: params.description,
      order_id:    params.orderId,
      result_url:  this.resultUrl,
      server_url:  this.serverUrl,
      info: JSON.stringify({ courseId: params.courseId, userId: params.userId }),
    };

    const data      = Buffer.from(JSON.stringify(payload)).toString('base64');
    const signature = this.sign(data);

    return {
      data,
      signature,
      action: 'https://www.liqpay.ua/api/3/checkout',
    };
  }

  verifyCallback(data: string, signature: string): {
    valid: boolean;
    payload: any;
    orderId: string;
    status: string;
    amount: number;
    courseId: string;
    userId: string;
  } {
    const expectedSig = this.sign(data);

    if (expectedSig !== signature) {
      throw new BadRequestException('Невірний підпис LiqPay');
    }

    const payload  = JSON.parse(Buffer.from(data, 'base64').toString('utf8'));
    const info     = payload.info ? JSON.parse(payload.info) : {};

    return {
      valid:    true,
      payload,
      orderId:  payload.order_id,
      status:   payload.status,   // 'success' | 'failure' | 'sandbox'
      amount:   payload.amount,
      courseId: info.courseId,
      userId:   info.userId,
    };
  }

  private sign(data: string): string {
    return crypto
      .createHash('sha1')
      .update(this.privateKey + data + this.privateKey)
      .digest('base64');
  }
}
