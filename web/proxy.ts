import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Match everything except Next internals, the API surface and anything
  // with a file extension (images, fonts, robots.txt...).
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
