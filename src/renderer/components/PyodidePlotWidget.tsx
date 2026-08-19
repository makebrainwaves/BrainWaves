import React from 'react';
import { toast } from 'react-toastify';
import { Button } from './ui/button';
import { storePyodideImageSvg, storePyodideImagePng } from '../utils/filesystem/storage';

interface Props {
  title: string;
  imageTitle: string;
  plotMIMEBundle: { [key: string]: string } | null | undefined;
}

function svgToPngArrayBuffer(svg: string): Promise<ArrayBuffer> {
  return new Promise((resolve, reject) => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        URL.revokeObjectURL(url);
        reject(new Error('No 2d context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) { reject(new Error('Canvas toBlob failed')); return; }
        pngBlob.arrayBuffer().then(resolve).catch(reject);
      }, 'image/png');
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('SVG load failed')); };
    img.src = url;
  });
}

export default function PyodidePlotWidget(props: Props) {
  function handleSaveSvg() {
    const svg = props.plotMIMEBundle?.['image/svg+xml'];
    if (!svg) return;
    storePyodideImageSvg(props.title, props.imageTitle, svg)
      .then(() => toast.success(`Saved ${props.imageTitle}.svg`))
      .catch((err) => toast.error(`Failed to save SVG: ${err.message}`));
  }

  async function handleSavePng() {
    const svg = props.plotMIMEBundle?.['image/svg+xml'];
    if (!svg) return;
    try {
      const arrayBuffer = await svgToPngArrayBuffer(svg);
      await storePyodideImagePng(props.title, props.imageTitle, arrayBuffer);
      toast.success(`Saved ${props.imageTitle}.png`);
    } catch (err: unknown) {
      toast.error(`Failed to save PNG: ${(err as Error).message}`);
    }
  }

  const svg = props.plotMIMEBundle?.['image/svg+xml'];
  if (!svg) return <div className="p-2" />;
  return (
    <div className="p-2">
      <img
        className="w-full h-auto"
        src={`data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`}
        alt={props.imageTitle}
      />
      <div className="flex gap-2 mt-2">
        <Button variant="outline" size="sm" onClick={handleSaveSvg}>
          Save as SVG
        </Button>
        <Button variant="outline" size="sm" onClick={handleSavePng}>
          Save as PNG
        </Button>
      </div>
    </div>
  );
}