import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';

@Injectable()
export class WayForPayService {
    private readonly merchantAccount: string;
    private readonly merchantSecretKey: string;
    private readonly merchantDomain: string;
    private readonly resultUrl: string;
    private readonly serverUrl: string;

    constructor(private readonly config: ConfigService) {
        this.merchantAccount   = config.get('WFP_MERCHANT_ACCOUNT');
        this.merchantSecretKey = config.get('WFP_MERCHANT_SECRET_KEY');
        this.merchantDomain    = config.get('WFP_MERCHANT_DOMAIN', 'graduation-frontend.onrender.com');
        this.resultUrl         = config.get('WFP_RESULT_URL', 'https://graduation-frontend.onrender.com/payment/result');
        this.serverUrl         = config.get('WFP_SERVER_URL', 'https://elearning-backend-hhfg.onrender.com/payments/callback');
    }

    createPaymentForm(params: {
        orderId:     string;
        amount:      number;
        description: string;
        courseId:    string;
        userId:      string;
        promoCode?:  string;
    }): { formData: Record<string, string>; action: string } {
        const orderDate     = Math.floor(Date.now() / 1000);
        const productName   = params.description;
        const productCount  = '1';
        const productPrice  = String(params.amount);
        const currency      = 'UAH';

        const orderReference = params.orderId;

        const signatureString = [
            this.merchantAccount,
            this.merchantDomain,
            orderReference,
            orderDate,
            params.amount,
            currency,
            productName,
            productCount,
            productPrice,
        ].join(';');

        const merchantSignature = this.sign(signatureString);

        const formData: Record<string, string> = {
            merchantAccount:   this.merchantAccount,
            merchantDomain:    this.merchantDomain,
            merchantSignature,
            orderReference,
            orderDate:         String(orderDate),
            amount:            productPrice,
            currency,
            orderTimeout:      '49000',
            productName,
            productCount,
            productPrice,
            returnUrl:         this.resultUrl,
            serviceUrl:        this.serverUrl,
        };

        return { formData, action: 'https://secure.wayforpay.com/pay' };
    }

    createSubscriptionForm(params: {
        orderId:     string;
        amount:      number;
        description: string;
        userId:      string;
        plan:        string;
    }): { formData: Record<string, string>; action: string } {
        const orderDate    = Math.floor(Date.now() / 1000);
        const productName  = params.description;
        const productCount = '1';
        const productPrice = String(params.amount);
        const currency     = 'UAH';

        const signatureString = [
            this.merchantAccount,
            this.merchantDomain,
            params.orderId,
            orderDate,
            params.amount,
            currency,
            productName,
            productCount,
            productPrice,
        ].join(';');

        const merchantSignature = this.sign(signatureString);

        const formData: Record<string, string> = {
            merchantAccount:   this.merchantAccount,
            merchantDomain:    this.merchantDomain,
            merchantSignature,
            orderReference:    params.orderId,
            orderDate:         String(orderDate),
            amount:            productPrice,
            currency,
            orderTimeout:      '49000',
            productName,
            productCount,
            productPrice,
            returnUrl:         `${this.resultUrl}?type=subscription`,
            serviceUrl:        this.serverUrl,
        };

        return { formData, action: 'https://secure.wayforpay.com/pay' };
    }

    verifyCallback(body: Record<string, any>): {
        valid:      boolean;
        orderId:    string;
        status:     string;
        amount:     number;
        type:       'course' | 'subscription';
        courseId?:  string;
        userId:     string;
        promoCode?: string;
        plan?:      string;
    } {
        const {
            merchantAccount, orderReference, amount, currency,
            authCode, cardPan, transactionStatus, reasonCode,
        } = body;

        const signatureString = [
            merchantAccount,
            orderReference,
            amount,
            currency,
            authCode,
            cardPan,
            transactionStatus,
            reasonCode,
        ].join(';');

        const expectedSignature = this.sign(signatureString);
        if (body.merchantSignature !== expectedSignature) {
            throw new BadRequestException('Невірний підпис WayForPay');
        }

        const parts = orderReference.split('_');
        const isSubscription = parts[0] === 'sub';

        if (isSubscription) {
            return {
                valid:   true,
                orderId: orderReference,
                status:  transactionStatus === 'Approved' ? 'success' : 'failure',
                amount:  Number(amount),
                type:    'subscription',
                userId:  parts[2],
                plan:    parts[1],
            };
        }

        return {
            valid:    true,
            orderId:  orderReference,
            status:   transactionStatus === 'Approved' ? 'success' : 'failure',
            amount:   Number(amount),
            type:     'course',
            courseId: parts[1],
            userId:   parts[2],
        };
    }

    buildCallbackResponse(orderReference: string, status: 'accept' | 'decline') {
        const time = Math.floor(Date.now() / 1000);
        const signatureString = [orderReference, status, time].join(';');
        return {
            orderReference,
            status,
            time,
            signature: this.sign(signatureString),
        };
    }

    private sign(data: string): string {
        return crypto
            .createHmac('md5', this.merchantSecretKey)
            .update(data)
            .digest('hex');
    }
}