// Remotion-Konfiguration für das Video-Projekt. Browser: vorhandenes Chrome-Headless-Shell (Playwright) –
// Pfad über REMOTION_BROWSER_EXECUTABLE überschreibbar (siehe scripts/render.mjs).
import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setCodec('h264');
Config.setPixelFormat('yuv420p');
Config.setCrf(18);
if (process.env.REMOTION_BROWSER_EXECUTABLE) Config.setBrowserExecutable(process.env.REMOTION_BROWSER_EXECUTABLE);
