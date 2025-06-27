// routes/docs/api.tsx
import { Fragment } from "preact";

export default function NotionDocsEmbed() {
  const notionPageUrl =
    "https://atom-club-701.notion.site/ebd/21fbae07692a8078a968faceafc2329c";

  return (
    <Fragment>
      <div class="flex flex-col min-h-screen">
        {/*
          The iframe will automatically inherit the full width of its parent container.
          Setting a dynamic height to try and fill the available space.
          Tailwind 'h-screen' can be useful here, but might cut off content
          if the Notion page is very long without scrolling within the iframe.
          'min-h-screen' and 'flex-grow' on the iframe's parent would be better.
        */}
        <iframe
          src={notionPageUrl}
          width="100%"
          height="1000px" // Adjust height as needed, or make it dynamic with JS if preferred
          frameborder="0"
          allowFullScreen
          class="flex-grow w-full border-none" // Tailwind for styling the iframe itself
        >
          Your browser does not support iframes. Please visit the documentation
          directly at{" "}
          <a
            href={notionPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="text-blue-600 hover:underline dark:text-blue-400"
          >
            {notionPageUrl}
          </a>
          .
        </iframe>
      </div>
    </Fragment>
  );
}