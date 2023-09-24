// pages/_app.mdx file

import Script from "next/script";

export default function App({ Component, pageProps }) {
  const GA_TRACKING_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  return (
    <>
      <Component {...pageProps} />
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      {/* We only want to load this in production */}
      {process.env.NODE_ENV === "production" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_TRACKING_ID}`}
          />
          <Script id="google-tag-manager">
            {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                    
                gtag('config', '${GA_TRACKING_ID}');
            `}
          </Script>
        </>
      )}
    </>
  );
}
