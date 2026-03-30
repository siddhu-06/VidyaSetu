'use client';

import { useRef, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/Card';
import type { Student } from '@/types';

interface PassportQRProps {
  student: Student;
  size?: number;
  showDownload?: boolean;
}

function toFileSlug(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Unable to render the QR code image.'));
    image.src = url;
  });
}

export function PassportQR({ student, size = 160, showDownload = true }: PassportQRProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  async function handleDownload(): Promise<void> {
    try {
      setIsDownloading(true);
      setDownloadError(null);

      const svgElement = containerRef.current?.querySelector('svg');

      if (!(svgElement instanceof SVGSVGElement)) {
        throw new Error('QR code is not ready yet.');
      }

      const serializedSvg = new XMLSerializer().serializeToString(svgElement);
      const svgBlob = new Blob([serializedSvg], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = window.URL.createObjectURL(svgBlob);

      try {
        const image = await loadImage(svgUrl);
        const canvas = document.createElement('canvas');
        const exportSize = size * 2;
        canvas.width = exportSize;
        canvas.height = exportSize;

        const context = canvas.getContext('2d');

        if (!context) {
          throw new Error('Unable to prepare the QR image for download.');
        }

        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, exportSize, exportSize);
        context.drawImage(image, 0, 0, exportSize, exportSize);

        const link = document.createElement('a');
        link.href = canvas.toDataURL('image/png');
        link.download = `passport-${toFileSlug(student.name)}.png`;
        link.click();
      } finally {
        window.URL.revokeObjectURL(svgUrl);
      }
    } catch (error) {
      setDownloadError(error instanceof Error ? error.message : 'Unable to download the QR code.');
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning passport QR</CardTitle>
        <CardDescription>
          Scan this code to open the portable passport at https://vidyasetu.app/passport/{student.id}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col items-center gap-4">
        <div ref={containerRef} className="rounded-3xl border border-slate-200 bg-white p-4">
          <QRCodeSVG
            value={`https://vidyasetu.app/passport/${student.id}`}
            size={size}
            bgColor="#ffffff"
            fgColor="#0f172a"
            includeMargin
          />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-slate-900">{student.name}</p>
          <p className="text-sm text-slate-500">Grade {student.grade}</p>
        </div>
        {showDownload ? (
          <Button type="button" variant="secondary" className="print:hidden" isLoading={isDownloading} onClick={() => void handleDownload()}>
            Download QR
          </Button>
        ) : null}
        {downloadError ? <p className="text-sm text-rose-700">{downloadError}</p> : null}
      </CardContent>
    </Card>
  );
}
