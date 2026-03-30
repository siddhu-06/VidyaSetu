'use client';

import { QRCodeSVG } from 'qrcode.react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';

interface PassportQRProps {
  value: string;
  publicCode: string;
}

export function PassportQR({ value, publicCode }: PassportQRProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Portable QR passport</CardTitle>
        <CardDescription>Scan this code to open the student’s public learning passport.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div className="rounded-3xl border border-slate-200 bg-white p-4">
          <QRCodeSVG value={value} size={176} bgColor="#ffffff" fgColor="#0f172a" includeMargin />
        </div>
        <p className="text-center text-sm text-slate-600">
          Public code: <span className="font-semibold text-slate-900">{publicCode}</span>
        </p>
      </CardContent>
    </Card>
  );
}

