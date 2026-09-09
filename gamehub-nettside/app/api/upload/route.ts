import { NextResponse } from 'next/server';
import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { isLoggedIn } from '@/lib/auth';
import { INSTALLER, isVersion } from '@/lib/versions';

/**
 * The browser uploads straight to Vercel Blob — a server function may only
 * receive 4.5 MB, and an installer is around 80. This route just hands the
 * browser a short-lived permission slip, after checking the admin cookie and
 * that the file is going where a version file belongs.
 */
export async function POST(request: Request) {
  if (!(await isLoggedIn())) return NextResponse.json({ error: 'Ikke logget inn.' }, { status: 401 });
  const body = (await request.json()) as HandleUploadBody;
  try {
    const result = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        const match = /^releases\/(\d+\.\d+\.\d+)\/(.+)$/.exec(pathname);
        if (!match || !isVersion(match[1]!) || match[2] !== INSTALLER) {
          throw new Error('Filen må lagres som releases/<versjon>/GameHub-Setup.exe.');
        }
        return {
          allowedContentTypes: ['application/octet-stream', 'application/x-msdownload', 'application/x-msdos-program', 'application/vnd.microsoft.portable-executable'],
          maximumSizeInBytes: 2 * 1024 * 1024 * 1024,
          addRandomSuffix: false,
          allowOverwrite: true,
          cacheControlMaxAge: 60,
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }
}
